// SANCTUARY - Survey System (Biome-based)
import { gameState, getBirdById, spendSeeds } from '../core/state.js';
import { ASSISTANT_TAP_RATE, SURVEY_PROTECTION_THRESHOLD } from '../core/constants.js';
import { createSpecimen } from '../data/species.js';
import { unassignBirdFromCurrentLocation } from './foragers.js';

// Update survey progress for all biomes
// Survey speed = sum of tap rates from all 4 birds (3 foragers + 1 surveyor)
export function updateSurveyProgress(dt) {
  if (!gameState) return;

  const now = Date.now();

  gameState.biomes.forEach(biome => {
    if (!biome.unlocked) return;

    const survey = biome.survey;

    // Calculate total tap rate from all 4 birds assigned to this biome
    let totalTapRate = 0;

    // Add foragers' tap rates
    biome.foragers.forEach(forager => {
      if (!forager.birdId) return;

      const bird = getBirdById(forager.birdId);
      if (!bird || bird.vitalityPercent <= 0) return;

      totalTapRate += ASSISTANT_TAP_RATE[bird.distinction] || 0;
    });

    // Add surveyor's tap rate
    if (survey.surveyorId) {
      const surveyor = getBirdById(survey.surveyorId);
      if (surveyor && surveyor.vitalityPercent > 0) {
        totalTapRate += ASSISTANT_TAP_RATE[surveyor.distinction] || 0;
      }
    }

    // Skip if no birds contributing
    if (totalTapRate === 0) return;

    // Protection: Don't spend Seeds if below threshold
    if (gameState.seeds < SURVEY_PROTECTION_THRESHOLD) return;

    // Calculate how many observations happen in this time period
    const timeSinceLastUpdate = survey.lastUpdateTime ? (now - survey.lastUpdateTime) : dt;
    const tapsInPeriod = (totalTapRate * timeSinceLastUpdate) / 1000;

    if (tapsInPeriod >= 1) {
      const wholeTaps = Math.floor(tapsInPeriod);
      for (let i = 0; i < wholeTaps; i++) {
        if (gameState.seeds >= survey.observationCost && survey.progress < 100) {
          if (spendSeeds(survey.observationCost)) {
            survey.progress += survey.progressPerTap;
            survey.progress = Math.min(100, survey.progress);
          }
        }
      }
    }

    survey.lastUpdateTime = now;

    // Check for completion
    if (survey.progress >= 100) {
      completeSurvey(biome.id);
    }
  });
}

// Manual observation on a biome survey
export function observeSurvey(biomeId) {
  if (!gameState) return false;

  const biome = gameState.biomes.find(b => b.id === biomeId);
  if (!biome || !biome.unlocked) return false;

  const survey = biome.survey;

  if (spendSeeds(survey.observationCost)) {
    survey.progress += survey.progressPerTap;
    survey.progress = Math.min(100, survey.progress);

    console.log(`Manual observation on ${biomeId}: ${survey.progress}%`);

    // Check for completion
    if (survey.progress >= 100) {
      completeSurvey(biomeId);
    }

    return true;
  }

  return false;
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

// Unlock a biome by checking for required bird distinction
export function unlockBiome(biomeId) {
  if (!gameState) return false;

  const biome = gameState.biomes.find(b => b.id === biomeId);
  if (!biome || biome.unlocked) return false;

  // Check if player has a bird with required distinction
  const hasRequiredBird = gameState.specimens.some(
    bird => bird.distinction >= biome.unlockRequirement
  );

  if (hasRequiredBird) {
    biome.unlocked = true;
    console.log(`Unlocked ${biome.name} biome!`);
    return true;
  }

  return false;
}
