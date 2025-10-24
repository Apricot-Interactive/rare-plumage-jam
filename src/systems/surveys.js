// SANCTUARY - Survey System (Biome-based)
import { gameState, getBirdById, spendSeeds, enforceBirdLimit } from '../core/state.js';
import { SURVEY_COSTS, FORAGER_BASE_RATES, UNLOCK_COSTS, ENERGY_CAPACITY } from '../core/constants.js';
import { createSpecimen } from '../data/species.js';
import { unassignBirdFromCurrentLocation, calculateForagerSlotIncome } from './foragers.js';
import { isTutorialActive, handleFirstSurveyComplete, TUTORIAL_STEPS, getCurrentTutorialStep } from './tutorial.js';

// Calculate survey contribution rate for a specific bird (seeds/sec)
function calculateSurveyContribution(biomeId, bird) {
  if (!bird || bird.vitalityPercent <= 1) return 0;

  // Get the highest unlocked forager rate for this biome
  const biomeForagers = gameState.biomes.find(b => b.id === biomeId)?.foragers || [];
  let highestSlot = 0;
  for (let i = biomeForagers.length - 1; i >= 0; i--) {
    if (biomeForagers[i].unlocked) {
      highestSlot = i;
      break;
    }
  }

  const baseRate = FORAGER_BASE_RATES[biomeId]?.[highestSlot] || 0;
  if (baseRate === 0) return 0;

  // Multiply by star level
  let rate = baseRate * bird.distinction;

  // Double if bird is from this biome
  if (bird.biome === biomeId) {
    rate *= 2;
  }

  return rate;
}

// Update survey progress for all biomes
export function updateSurveyProgress(dt) {
  if (!gameState) return;

  const dtSeconds = dt / 1000; // Convert to seconds

  gameState.biomes.forEach(biome => {
    if (!biome.unlocked) return;

    const survey = biome.survey;
    const totalCost = SURVEY_COSTS[biome.id] || 360;

    // Check if survey already complete and trigger completion if stuck at 100%
    if (survey.progress >= totalCost) {
      // Safety net: If survey is stuck at 100%, trigger completion
      completeSurvey(biome.id);
      return;
    }

    // Calculate total contribution from all assigned birds
    let totalContribution = 0;

    // ONLY add contributions if there's a surveyor assigned
    // (surveys with no surveyor only progress via manual tapping)
    if (survey.surveyorId) {
      const surveyor = getBirdById(survey.surveyorId);
      if (surveyor) {
        // Add surveyor's contribution
        totalContribution += calculateSurveyContribution(biome.id, surveyor);

        // Also add foragers' contributions (only when surveyor is present)
        biome.foragers.forEach(forager => {
          if (!forager.birdId) return;

          const bird = getBirdById(forager.birdId);
          if (bird) {
            totalContribution += calculateSurveyContribution(biome.id, bird);
          }
        });
      }
    }

    // Add seeds (without debiting player)
    if (totalContribution > 0) {
      const seedsAdded = totalContribution * dtSeconds;
      survey.progress = Math.min(totalCost, survey.progress + seedsAdded);

      // Check for completion
      if (survey.progress >= totalCost) {
        completeSurvey(biome.id);
      }
    }
  });
}

// Manual observation on a biome survey - taps add 5x the surveyor's rate
export function observeSurvey(biomeId) {
  if (!gameState) return { success: false, seedsSpent: 0 };

  const biome = gameState.biomes.find(b => b.id === biomeId);
  if (!biome || !biome.unlocked) return { success: false, seedsSpent: 0 };

  const survey = biome.survey;
  const totalCost = SURVEY_COSTS[biome.id] || 360;

  // Check if survey already complete
  if (survey.progress >= totalCost) return { success: false, seedsSpent: 0 };

  // Calculate contribution rate (use surveyor if assigned, otherwise use highest forager rate)
  let contributionRate = 0;
  let bird = null;

  if (survey.surveyorId) {
    bird = getBirdById(survey.surveyorId);
    if (bird) {
      contributionRate = calculateSurveyContribution(biomeId, bird);
    }
  }

  // If no surveyor or no contribution, use highest unlocked forager slot base rate
  if (contributionRate === 0) {
    const biomeForagers = biome.foragers;
    let highestSlot = 0;
    for (let i = biomeForagers.length - 1; i >= 0; i--) {
      if (biomeForagers[i].unlocked) {
        highestSlot = i;
        break;
      }
    }
    contributionRate = FORAGER_BASE_RATES[biomeId]?.[highestSlot] || 1;
  }

  // Manual tap adds 5x the contribution rate (FREE - no seed deduction)
  const seedsToAdd = contributionRate * 5;

  survey.progress = Math.min(totalCost, survey.progress + seedsToAdd);

  // Deduct 2 energy points from the surveyor bird (if assigned)
  if (bird) {
    const maxEnergy = ENERGY_CAPACITY[bird.distinction] || ENERGY_CAPACITY[1];

    // Ensure bird has vitality field (migration safety)
    if (bird.vitality === undefined) {
      bird.vitality = (bird.vitalityPercent / 100) * maxEnergy;
    }

    const beforePercent = bird.vitalityPercent;
    const previousVitality = bird.vitality;
    bird.vitality = Math.max(0, bird.vitality - 2);
    bird.vitalityPercent = (bird.vitality / maxEnergy) * 100;

    console.log(`🔍 SURVEY TAP: ${bird.distinction}⭐ ${beforePercent.toFixed(1)}% → ${bird.vitalityPercent.toFixed(1)}% (${maxEnergy} max)`);

    // Check if bird just became exhausted from this tap
    if (previousVitality > 0 && bird.vitality <= 0) {
      console.log(`🛑 SURVEYOR EXHAUSTED FROM TAP: ${bird.speciesName} in ${biomeId}`);
      // Trigger exhausted notification
      import('../ui/wilds.js').then(module => {
        if (module.handleExhaustedBirds) {
          module.handleExhaustedBirds([{
            bird,
            biomeId,
            type: 'surveyor'
          }]);
        }
      });
    }
  }

  // Check for completion
  if (survey.progress >= totalCost) {
    completeSurvey(biomeId);
  }

  return { success: true, seedsSpent: 0 };
}

// Complete a survey and spawn a new bird
export function completeSurvey(biomeId) {
  if (!gameState) return;

  const biome = gameState.biomes.find(b => b.id === biomeId);
  if (!biome) return;

  const survey = biome.survey;

  console.log(`Survey completed: ${biomeId}`);

  // ALWAYS reset survey first to prevent infinite completion loops
  const oldProgress = survey.progress;
  survey.progress = 0;
  survey.lastUpdateTime = null;

  // Check if this is the tutorial's first survey
  const tutorialHandled = handleFirstSurveyFromTutorial(biomeId);
  if (tutorialHandled) {
    console.log(`Tutorial handled first survey completion for ${biomeId}`);
    return;
  }

  // Determine max distinction allowed for this biome
  const BIOME_MAX_DISTINCTION = {
    'forest': 2,
    'mountain': 3,
    'coastal': 4,
    'arid': 5,
    'tundra': 5
  };
  let maxDistinction = BIOME_MAX_DISTINCTION[biomeId] || 5;

  // SPECIAL RULE: Before hatchery is unlocked, forest surveys only award 1-star birds
  if (biomeId === 'forest' && !gameState.hatcheryUnlocked) {
    maxDistinction = 1;
    console.log('🌲 Forest survey limited to 1⭐ before hatchery unlock');
  }

  // Determine distinction based on surveyor (if assigned)
  let distinction = 1;
  if (survey.surveyorId) {
    const surveyor = getBirdById(survey.surveyorId);
    if (surveyor) {
      const baseDistinction = surveyor.distinction;
      const roll = Math.random();
      if (roll < 0.50) {
        distinction = baseDistinction; // 50% match
      } else if (roll < 0.80) {
        distinction = Math.min(5, baseDistinction + 1); // 30% +1
      } else {
        distinction = Math.max(1, baseDistinction - 1); // 20% -1
      }
    }
  }

  // Apply biome cap
  distinction = Math.min(distinction, maxDistinction);

  // Enforce bird limit BEFORE adding new bird (max 8 per rarity)
  const birdWasDeleted = enforceBirdLimit(distinction);

  // Create new specimen
  const newBird = createSpecimen(biomeId, distinction);
  if (newBird) {
    gameState.specimens.push(newBird);

    // Show first-time warning if a bird was deleted
    if (birdWasDeleted && !gameState.birdLimitWarningShown) {
      gameState.birdLimitWarningShown = true;
      const stars = '⭐'.repeat(distinction);
      import('../ui/modals.js').then(module => {
        module.showTutorialModal(
          `When we have too many ${stars} birds in our sanctuary, some start to move on.`,
          'normal',
          () => {
            module.hideTutorialModal();
          }
        );
      });
    }

    // Add to catalogued species if new
    if (!gameState.cataloguedSpecies.includes(newBird.speciesName)) {
      gameState.cataloguedSpecies.push(newBird.speciesName);
    }

    console.log(`New bird discovered: ${newBird.speciesName} (${distinction}⭐)`);

    // Check for star rarity milestone (2-5 stars only)
    if (distinction >= 2) {
      import('./tutorial.js').then(module => {
        if (module.checkStarRarityMilestone) {
          module.checkStarRarityMilestone(distinction);
        }
      });
    }

    // Show celebration overlay
    import('../ui/wilds.js').then(module => {
      module.showSurveyCelebration(newBird, biomeId);
    });
  }

  // Survey already reset at beginning of function
}

// Handle tutorial first survey completion
function handleFirstSurveyFromTutorial(biomeId) {
  // Check if tutorial is active and if this should be handled specially
  if (isTutorialActive() && biomeId === 'forest' && getCurrentTutorialStep() === TUTORIAL_STEPS.FIRST_SURVEY) {
    return handleFirstSurveyComplete();
  }
  return false;
}

// Assign a bird to the survey slot of a biome
export function assignSurveyor(biomeId, birdId) {
  if (!gameState) return false;

  const biome = gameState.biomes.find(b => b.id === biomeId);
  if (!biome || !biome.unlocked) return false;

  const bird = getBirdById(birdId);
  if (!bird) return false;

  // Check if bird meets biome star requirement
  // (biome 1 needs 1*, biome 2 needs 2*, etc.)
  if (bird.distinction < biome.unlockRequirement) {
    console.log(`Bird ${bird.speciesName} (${bird.distinction}⭐) doesn't meet ${biome.name} survey requirement (${biome.unlockRequirement}⭐)`);

    // Show error toast
    import('../ui/modals.js').then(module => {
      const stars = '⭐'.repeat(biome.unlockRequirement);
      module.showToast(`${biome.name} requires ${stars} birds`);
    });

    return false;
  }

  // Unassign bird from current location
  unassignBirdFromCurrentLocation(bird);

  // Unassign any bird currently in this survey
  if (biome.survey.surveyorId) {
    unassignSurveyor(biomeId);
  }

  // Update bird location and assign to survey
  bird.location = `surveyor_${biomeId}`;
  biome.survey.surveyorId = birdId;
  biome.survey.lastUpdateTime = Date.now();

  console.log(`Assigned ${bird.speciesName} to ${biomeId} survey`);
  return true;
}

// Unassign the surveyor from a biome
export function unassignSurveyor(biomeId) {
  if (!gameState) return false;

  const biome = gameState.biomes.find(b => b.id === biomeId);
  if (!biome || !biome.survey.surveyorId) return false;

  const bird = getBirdById(biome.survey.surveyorId);
  if (bird) {
    bird.location = 'collection';
  }

  biome.survey.surveyorId = null;
  biome.survey.lastUpdateTime = null;

  console.log(`Unassigned surveyor from ${biomeId}`);
  return true;
}

// Helper to get total tap rate for a biome (for UI display)
export function getBiomeTapRate(biomeId) {
  if (!gameState) return 0;

  const biome = gameState.biomes.find(b => b.id === biomeId);
  if (!biome || !biome.unlocked) return 0;

  let totalTapRate = 0;

  // Add foragers' tap rates
  biome.foragers.forEach(forager => {
    if (!forager.birdId) return;

    const bird = getBirdById(forager.birdId);
    if (!bird || bird.vitalityPercent <= 0) return;

    totalTapRate += ASSISTANT_TAP_RATE[bird.distinction] || 0;
  });

  // Add surveyor's tap rate
  if (biome.survey.surveyorId) {
    const surveyor = getBirdById(biome.survey.surveyorId);
    if (surveyor && surveyor.vitalityPercent > 0) {
      totalTapRate += ASSISTANT_TAP_RATE[surveyor.distinction] || 0;
    }
  }

  return totalTapRate;
}

// Unlock a biome by checking for required bird distinction AND seed cost
export function unlockBiome(biomeId) {
  if (!gameState) return false;

  const biome = gameState.biomes.find(b => b.id === biomeId);
  if (!biome || biome.unlocked) return false;

  const seedCost = UNLOCK_COSTS.biomeUnlock[biomeId] || 0;

  // Check if player has a bird with required distinction
  const hasRequiredBird = gameState.specimens.some(
    bird => bird.distinction >= biome.unlockRequirement
  );

  if (!hasRequiredBird) {
    console.log(`Need a ${biome.unlockRequirement}⭐ bird to unlock ${biome.name}`);
    return false;
  }

  // Check if player can afford the seed cost
  if (gameState.seeds < seedCost) {
    console.log(`Need ${seedCost} seeds to unlock ${biome.name}`);
    return false;
  }

  // Spend seeds and unlock
  if (spendSeeds(seedCost)) {
    biome.unlocked = true;
    console.log(`Unlocked ${biome.name} biome for ${seedCost} seeds!`);

    // Show milestone celebration (skip forest since it starts unlocked)
    if (biomeId !== 'forest') {
      import('./tutorial.js').then(module => {
        if (module.checkBiomeUnlockMilestone) {
          module.checkBiomeUnlockMilestone(biomeId, biome.name);
        }
      });
    }

    return true;
  }

  return false;
}
