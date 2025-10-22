// SANCTUARY - Forager System (Biome-based)
import { gameState, getBirdById, spendSeeds } from '../core/state.js';
import { FORAGER_INCOME, MANUAL_TAP_SEEDS, VITALITY_DRAIN_RATE } from '../core/constants.js';

// Calculate total Seeds income from all foragers across all biomes
export function calculateForagerIncome() {
  if (!gameState) return 0;

  let totalIncome = 0;

  gameState.biomes.forEach(biome => {
    if (!biome.unlocked) return;

    biome.foragers.forEach(forager => {
      if (!forager.birdId) return;

      const bird = getBirdById(forager.birdId);
      if (!bird) return;

      // Check vitality
      if (bird.vitalityPercent <= 0) return;

      // Get base income from bird distinction
      const baseIncome = FORAGER_INCOME[bird.distinction] || 0;

      // TODO Stage 3: Apply guest bonuses
      totalIncome += baseIncome;
    });
  });

  return totalIncome;
}

// Update vitality for all foragers and surveyors across all biomes
export function updateForagerVitality(dt) {
  if (!gameState) return;

  gameState.biomes.forEach(biome => {
    if (!biome.unlocked) return;

    // Drain vitality for foragers
    biome.foragers.forEach(forager => {
      if (!forager.birdId) return;

      const bird = getBirdById(forager.birdId);
      if (!bird) return;

      if (bird.vitalityPercent > 0) {
        const drainPerMinute = VITALITY_DRAIN_RATE[bird.distinction] || 1.0;
        const drainPerMs = drainPerMinute / 60000;
        const drainAmount = drainPerMs * dt;

        bird.vitalityPercent = Math.max(0, bird.vitalityPercent - drainAmount);
      }
    });

    // Drain vitality for surveyor
    if (biome.survey.surveyorId) {
      const bird = getBirdById(biome.survey.surveyorId);
      if (bird && bird.vitalityPercent > 0) {
        const drainPerMinute = VITALITY_DRAIN_RATE[bird.distinction] || 1.0;
        const drainPerMs = drainPerMinute / 60000;
        const drainAmount = drainPerMs * dt;

        bird.vitalityPercent = Math.max(0, bird.vitalityPercent - drainAmount);
      }
    }
  });
}

// Assign a bird to a forager slot in a specific biome
export function assignForager(biomeId, slot, birdId) {
  if (!gameState) return false;

  const biome = gameState.biomes.find(b => b.id === biomeId);
  if (!biome || !biome.unlocked) return false;

  const forager = biome.foragers[slot];
  if (!forager || !forager.unlocked) return false;

  const bird = getBirdById(birdId);
  if (!bird) return false;

  // Unassign bird from current location
  unassignBirdFromCurrentLocation(bird);

  // Unassign any bird currently in this forager slot
  if (forager.birdId) {
    unassignForager(biomeId, slot);
  }

  // Update bird location and assign to forager
  bird.location = `forager_${biomeId}_${slot}`;
  forager.birdId = birdId;
  forager.assignedAt = Date.now();
  forager.accumulatedSeeds = 0;

  console.log(`Assigned ${bird.speciesName} to ${biomeId} Forager ${slot}`);
  return true;
}

// Unassign a bird from a forager slot
export function unassignForager(biomeId, slot) {
  if (!gameState) return false;

  const biome = gameState.biomes.find(b => b.id === biomeId);
  if (!biome) return false;

  const forager = biome.foragers[slot];
  if (!forager || !forager.birdId) return false;

  const bird = getBirdById(forager.birdId);
  if (bird) {
    bird.location = 'collection';
  }

  forager.birdId = null;
  forager.assignedAt = null;
  forager.accumulatedSeeds = 0;

  console.log(`Unassigned from ${biomeId} Forager ${slot}`);
  return true;
}

// Unlock a forager slot in a specific biome
export function unlockForagerSlot(biomeId, slot) {
  if (!gameState) return false;

  const biome = gameState.biomes.find(b => b.id === biomeId);
  if (!biome || !biome.unlocked) return false;

  const forager = biome.foragers[slot];
  if (!forager || forager.unlocked) return false;

  if (spendSeeds(forager.unlockCost)) {
    forager.unlocked = true;
    console.log(`Unlocked ${biomeId} Forager slot ${slot} for ${forager.unlockCost} Seeds`);
    return true;
  }

  return false;
}

// Tap a forager slot for manual seeds (deprecated - may remove in refactor)
export function tapForagerSlot(biomeId, slot) {
  if (!gameState) return 0;

  const biome = gameState.biomes.find(b => b.id === biomeId);
  if (!biome || !biome.unlocked) return 0;

  const forager = biome.foragers[slot];
  if (!forager || !forager.unlocked) return 0;

  // Tap rewards scale by circle: 10/100/1000
  const tapRewards = [10, 100, 1000];
  const seedsEarned = tapRewards[slot] || MANUAL_TAP_SEEDS;

  // TODO Stage 3: Apply manual effectiveness bonuses

  return seedsEarned;
}

// Helper function to unassign a bird from its current location
export function unassignBirdFromCurrentLocation(bird) {
  if (!bird || !bird.location) return;

  // Parse location
  if (bird.location.startsWith('forager_')) {
    // Format: forager_biomeId_slot
    const parts = bird.location.split('_');
    const biomeId = parts[1];
    const slot = parseInt(parts[2]);

    const biome = gameState.biomes.find(b => b.id === biomeId);
    if (biome) {
      const forager = biome.foragers[slot];
      if (forager && forager.birdId === bird.id) {
        forager.birdId = null;
        forager.assignedAt = null;
        forager.accumulatedSeeds = 0;
      }
    }
  } else if (bird.location.startsWith('surveyor_')) {
    // Format: surveyor_biomeId
    const biomeId = bird.location.split('_')[1];
    const biome = gameState.biomes.find(b => b.id === biomeId);
    if (biome && biome.survey.surveyorId === bird.id) {
      biome.survey.surveyorId = null;
      biome.survey.lastUpdateTime = null;
    }
  } else if (bird.location.startsWith('perch_')) {
    const slot = parseInt(bird.location.split('_')[1]);
    const perch = gameState.perches.find(p => p.slot === slot);
    if (perch && perch.birdId === bird.id) {
      perch.birdId = null;
      perch.assignedAt = null;
      perch.restoreCooldown = 0;
    }
  }
  // If location is 'collection', no cleanup needed
}
