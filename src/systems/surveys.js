// SANCTUARY - Survey System (Biome-based)
import { gameState, getBirdById, spendSeeds } from '../core/state.js';
import { SURVEY_COSTS, FORAGER_BASE_RATES, UNLOCK_COSTS } from '../core/constants.js';
import { createSpecimen } from '../data/species.js';
import { unassignBirdFromCurrentLocation, calculateForagerSlotIncome } from './foragers.js';

// Calculate survey contribution rate for a specific bird (seeds/sec)
function calculateSurveyContribution(biomeId, bird) {
  if (!bird || bird.vitalityPercent <= 0) return 0;

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

    // Check if survey already complete
    if (survey.progress >= totalCost) return;

    // Calculate total contribution from all assigned birds
    let totalContribution = 0;

    // Add foragers' contributions
    biome.foragers.forEach(forager => {
      if (!forager.birdId) return;

      const bird = getBirdById(forager.birdId);
      if (bird) {
        totalContribution += calculateSurveyContribution(biome.id, bird);
      }
    });

    // Add surveyor's contribution
    if (survey.surveyorId) {
      const surveyor = getBirdById(survey.surveyorId);
      if (surveyor) {
        totalContribution += calculateSurveyContribution(biome.id, surveyor);
      }
    }

    // Add seeds (without debiting player)
    if (totalContribution > 0) {
      const seedsAdded = totalContribution * dtSeconds;
      survey.progress = Math.min(totalCost, survey.progress + seedsAdded);

      // Debug logging
      if (Math.random() < 0.01) { // Log 1% of the time to avoid spam
        console.log(`Survey ${biome.id}: +${seedsAdded.toFixed(2)} seeds (${survey.progress.toFixed(1)}/${totalCost}), contribution rate: ${totalContribution.toFixed(2)}/sec`);
      }

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

  console.log(`Manual observation on ${biomeId}: +${seedsToAdd.toFixed(1)} seeds (FREE)`);

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

  // Create new specimen
  const newBird = createSpecimen(biomeId, distinction);
  if (newBird) {
    gameState.specimens.push(newBird);

    // Add to catalogued species if new
    if (!gameState.cataloguedSpecies.includes(newBird.speciesName)) {
      gameState.cataloguedSpecies.push(newBird.speciesName);
    }

    console.log(`New bird discovered: ${newBird.speciesName} (${distinction}⭐)`);

    // Show celebration overlay
    import('../ui/wilds.js').then(module => {
      module.showSurveyCelebration(newBird, biomeId);
    });
  }

  // Reset survey
  survey.progress = 0;
  survey.lastUpdateTime = null;
}

// Assign a bird to the survey slot of a biome
export function assignSurveyor(biomeId, birdId) {
  if (!gameState) return false;

  const biome = gameState.biomes.find(b => b.id === biomeId);
  if (!biome || !biome.unlocked) return false;

  const bird = getBirdById(birdId);
  if (!bird) return false;

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
    return true;
  }

  return false;
}
