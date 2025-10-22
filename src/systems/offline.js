// SANCTUARY - Offline Progress
import { gameState, addSeeds } from '../core/state.js';
import { calculateForagerIncome } from './foragers.js';
import { completeBreeding } from './breeding.js';
import { GAME_CONFIG, VITALITY_DRAIN_RATE, VITALITY_RESTORE_RATE, SURVEY_COSTS, FORAGER_BASE_RATES } from '../core/constants.js';

// Calculate survey contribution rate for a specific bird (seeds/sec) - duplicated from surveys.js to avoid circular deps
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

const MAX_OFFLINE_TIME = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

export function calculateOfflineProgress() {
  if (!gameState) {
    return { seedsEarned: 0, surveysCompleted: 0, breedingsCompleted: 0, timeAway: 0 };
  }

  const now = Date.now();
  const timeAway = now - gameState.lastSaveTime;

  // If less than 30 seconds, skip offline progress
  if (timeAway < 30000) {
    return { seedsEarned: 0, surveysCompleted: 0, breedingsCompleted: 0, timeAway: 0 };
  }

  // Cap at 24 hours
  const cappedTime = Math.min(timeAway, MAX_OFFLINE_TIME);
  const secondsAway = cappedTime / 1000;

  console.log(`Offline progress: ${Math.floor(secondsAway / 60)} minutes away`);

  let totalSeeds = 0;
  let surveysCompleted = 0;
  let breedingsCompleted = 0;

  // 1. Calculate forager income and vitality drain
  gameState.biomes.forEach(biome => {
    biome.foragers.forEach((forager, slotIndex) => {
      if (!forager.unlocked || !forager.birdId) return;

      const bird = gameState.specimens.find(b => b.id === forager.birdId);
      if (!bird) return;

      // Calculate vitality drain
      const drainRate = VITALITY_DRAIN_RATE[bird.distinction] || VITALITY_DRAIN_RATE[1];
      const vitalityDrain = (drainRate * secondsAway) / 60; // Convert per-minute to total
      const newVitality = Math.max(0, bird.vitalityPercent - vitalityDrain);

      // Only earn income while vitality > 0
      if (bird.vitalityPercent > 0) {
        // Calculate how long bird was active (before hitting 0%)
        const timeUntilDepleted = bird.vitalityPercent > vitalityDrain
          ? secondsAway
          : (bird.vitalityPercent / drainRate) * 60;

        // Calculate income for active time only
        const income = calculateForagerIncome();
        totalSeeds += income * timeUntilDepleted;
      }

      bird.vitalityPercent = newVitality;
    });
  });

  // 2. Update survey progress (seed-based system)
  gameState.biomes.forEach(biome => {
    if (!biome.unlocked) return;

    const totalCost = SURVEY_COSTS[biome.id] || 360;

    // Check if survey already complete
    if (biome.survey.progress >= totalCost) return;

    // Calculate contribution from all assigned birds
    let totalContribution = 0;

    // Add foragers' contributions
    biome.foragers.forEach(forager => {
      if (!forager.birdId) return;
      const bird = gameState.specimens.find(b => b.id === forager.birdId);
      if (bird && bird.vitalityPercent > 0) {
        // Use same contribution calculation as updateSurveyProgress
        const contrib = calculateSurveyContribution(biome.id, bird);
        totalContribution += contrib;
      }
    });

    // Add surveyor's contribution
    if (biome.survey.surveyorId) {
      const surveyor = gameState.specimens.find(b => b.id === biome.survey.surveyorId);
      if (surveyor && surveyor.vitalityPercent > 0) {
        const contrib = calculateSurveyContribution(biome.id, surveyor);
        totalContribution += contrib;
      }
    }

    // Add seeds (without debiting player)
    if (totalContribution > 0) {
      const seedsAdded = totalContribution * secondsAway;
      const oldProgress = biome.survey.progress;
      biome.survey.progress = Math.min(totalCost, biome.survey.progress + seedsAdded);

      // Check if survey completed
      if (oldProgress < totalCost && biome.survey.progress >= totalCost) {
        surveysCompleted++;
        // Survey completion is handled by the normal game loop
      }
    }
  });

  // 3. Update breeding programs
  gameState.breedingPrograms.forEach(program => {
    if (!program.active || !program.startTime) return;

    const elapsedSinceStart = now - program.startTime;

    if (elapsedSinceStart >= program.estimatedDuration) {
      // Breeding completed offline
      completeBreeding(program.program);
      breedingsCompleted++;
    } else {
      // Update progress
      program.progress = Math.min(100, (elapsedSinceStart / program.estimatedDuration) * 100);
      program.lastUpdateTime = now;
    }
  });

  // 4. Update perch grooming (vitality restoration)
  gameState.perches.forEach(perch => {
    if (!perch.birdId) return;

    const bird = gameState.specimens.find(b => b.id === perch.birdId);
    if (!bird) return;

    // Restore vitality
    const vitalityGain = (VITALITY_RESTORE_RATE * secondsAway) / 60; // Convert per-minute to total
    bird.vitalityPercent = Math.min(100, bird.vitalityPercent + vitalityGain);
  });

  // Add seeds earned
  if (totalSeeds > 0) {
    addSeeds(totalSeeds);
  }

  return {
    seedsEarned: Math.floor(totalSeeds),
    surveysCompleted,
    breedingsCompleted,
    timeAway: cappedTime
  };
}

export function formatOfflineTime(milliseconds) {
  const seconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) {
    return `${days} day${days > 1 ? 's' : ''} ${hours % 24} hour${hours % 24 !== 1 ? 's' : ''}`;
  } else if (hours > 0) {
    return `${hours} hour${hours > 1 ? 's' : ''} ${minutes % 60} minute${minutes % 60 !== 1 ? 's' : ''}`;
  } else if (minutes > 0) {
    return `${minutes} minute${minutes > 1 ? 's' : ''}`;
  } else {
    return `${seconds} second${seconds !== 1 ? 's' : ''}`;
  }
}
