// SANCTUARY - Offline Progress
import { gameState, addSeeds, getBirdById } from '../core/state.js';
import { calculateForagerSlotIncome, unassignBirdFromCurrentLocation } from './foragers.js';
import { completeBreeding } from './breeding.js';
import { completeSurvey } from './surveys.js';
import { GAME_CONFIG, VITALITY_DRAIN_RATE, VITALITY_RESTORE_RATE, SURVEY_COSTS, FORAGER_BASE_RATES, ENERGY_CAPACITY, ENERGY_DRAIN_PER_SECOND, VITALITY_RESTORE_TIME_SECONDS, AUTO_RECOVERY_MULTIPLIER } from '../core/constants.js';

// Calculate survey contribution rate for a specific bird (seeds/sec) - duplicated from surveys.js to avoid circular deps
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

  // 1. Calculate forager income and vitality drain (using new energy system)
  const exhaustedBirds = [];
  gameState.biomes.forEach(biome => {
    biome.foragers.forEach((forager, slotIndex) => {
      if (!forager.unlocked || !forager.birdId) return;

      const bird = getBirdById(forager.birdId);
      if (!bird) return;

      // Ensure bird has vitality field (migration safety)
      const maxEnergy = ENERGY_CAPACITY[bird.distinction] || ENERGY_CAPACITY[1];
      if (bird.vitality === undefined) {
        bird.vitality = (bird.vitalityPercent / 100) * maxEnergy;
      }

      // Only earn income while vitality > 0
      if (bird.vitality > 0) {
        // Calculate how long bird was active (before hitting 0 energy)
        const energyDrained = ENERGY_DRAIN_PER_SECOND * secondsAway;
        const timeUntilDepleted = bird.vitality >= energyDrained
          ? secondsAway
          : bird.vitality / ENERGY_DRAIN_PER_SECOND;

        // Calculate income for THIS SPECIFIC forager, for active time only
        const incomePerSecond = calculateForagerSlotIncome(biome.id, slotIndex, forager.birdId);
        const seedsEarned = incomePerSecond * timeUntilDepleted;
        totalSeeds += seedsEarned;

        console.log(`⚡ OFFLINE Forager ${bird.speciesName} in ${biome.id}: worked ${timeUntilDepleted.toFixed(0)}s, earned ${seedsEarned.toFixed(1)} seeds`);

        // Drain energy
        bird.vitality = Math.max(0, bird.vitality - energyDrained);
        bird.vitalityPercent = (bird.vitality / maxEnergy) * 100;

        // Track if bird became exhausted
        if (bird.vitality <= 0) {
          exhaustedBirds.push({ bird, biomeId: biome.id, type: 'forager', slotIndex });
        }
      }
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

    // ONLY add contributions if there's a surveyor assigned
    // (surveys with no surveyor only progress via manual tapping)
    if (biome.survey.surveyorId) {
      const surveyor = getBirdById(biome.survey.surveyorId);
      if (surveyor) {
        // Ensure bird has vitality field (migration safety)
        const maxEnergy = ENERGY_CAPACITY[surveyor.distinction] || ENERGY_CAPACITY[1];
        if (surveyor.vitality === undefined) {
          surveyor.vitality = (surveyor.vitalityPercent / 100) * maxEnergy;
        }

        if (surveyor.vitality > 0) {
          // Calculate how long surveyor was active (before hitting 0 energy)
          const energyDrained = ENERGY_DRAIN_PER_SECOND * secondsAway;
          const timeUntilDepleted = surveyor.vitality >= energyDrained
            ? secondsAway
            : surveyor.vitality / ENERGY_DRAIN_PER_SECOND;

          // Add surveyor's contribution for active time only
          const contrib = calculateSurveyContribution(biome.id, surveyor);
          totalContribution += contrib * timeUntilDepleted;

          console.log(`⚡ OFFLINE Surveyor ${surveyor.speciesName} in ${biome.id}: worked ${timeUntilDepleted.toFixed(0)}s`);

          // Drain energy from surveyor
          surveyor.vitality = Math.max(0, surveyor.vitality - energyDrained);
          surveyor.vitalityPercent = (surveyor.vitality / maxEnergy) * 100;

          // Track if surveyor became exhausted
          if (surveyor.vitality <= 0) {
            exhaustedBirds.push({ bird: surveyor, biomeId: biome.id, type: 'surveyor' });
          }

          // Also add foragers' contributions (only when surveyor is present)
          // Note: Foragers already had their energy drained in step 1, so use their current vitality
          biome.foragers.forEach(forager => {
            if (!forager.birdId) return;
            const bird = getBirdById(forager.birdId);
            if (bird && bird.vitality > 0) {
              // Forager was active for timeUntilDepleted seconds (from step 1)
              const contrib = calculateSurveyContribution(biome.id, bird);
              totalContribution += contrib * timeUntilDepleted;
            }
          });
        }
      }
    }

    // Add seeds (without debiting player)
    if (totalContribution > 0) {
      const seedsAdded = totalContribution;
      const oldProgress = biome.survey.progress;
      biome.survey.progress = Math.min(totalCost, biome.survey.progress + seedsAdded);

      // Check if survey completed and actually complete it
      if (oldProgress < totalCost && biome.survey.progress >= totalCost) {
        surveysCompleted++;
        completeSurvey(biome.id);
      }
    }
  });

  // Unassign all exhausted birds
  exhaustedBirds.forEach(({ bird, biomeId, type, slotIndex }) => {
    console.log(`⚡ OFFLINE: Unassigning exhausted ${bird.speciesName} (${type} in ${biomeId})`);
    unassignBirdFromCurrentLocation(bird);
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

  // 4. Update perch grooming (vitality restoration using new energy system)
  gameState.perches.forEach(perch => {
    if (!perch.birdId) return;

    const bird = getBirdById(perch.birdId);
    if (!bird) return;

    // Ensure bird has vitality field (migration safety)
    const maxEnergy = ENERGY_CAPACITY[bird.distinction] || ENERGY_CAPACITY[1];
    if (bird.vitality === undefined) {
      bird.vitality = (bird.vitalityPercent / 100) * maxEnergy;
    }

    // Only restore if vitality is below max
    if (bird.vitality < maxEnergy) {
      // Auto-recovery rate depends on star level (1-star 10x faster, 2-star 4x, 3-star 2x, 4-5 star 1x)
      const multiplier = AUTO_RECOVERY_MULTIPLIER[bird.distinction] || AUTO_RECOVERY_MULTIPLIER[5];
      const restorePerSecond = (maxEnergy / VITALITY_RESTORE_TIME_SECONDS) * multiplier;
      const energyGain = restorePerSecond * secondsAway;
      bird.vitality = Math.min(maxEnergy, bird.vitality + energyGain);
      bird.vitalityPercent = (bird.vitality / maxEnergy) * 100;
    }
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
