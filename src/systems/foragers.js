// SANCTUARY - Forager System
import { gameState, getBirdById, spendSeeds } from '../core/state.js';
import { FORAGER_INCOME, MANUAL_TAP_SEEDS, VITALITY_DRAIN_RATE } from '../core/constants.js';

export function calculateForagerIncome() {
  if (!gameState) return 0;

  let totalIncome = 0;

  gameState.foragers.forEach(forager => {
    if (!forager.birdId) return;

    const bird = getBirdById(forager.birdId);
    if (!bird) return;

    // Check vitality (will implement drain in Stage 2)
    if (bird.vitalityPercent <= 0) return;

    // Get base income from bird distinction
    const baseIncome = FORAGER_INCOME[bird.distinction] || 0;

    // TODO Stage 3: Apply guest bonuses
    totalIncome += baseIncome;
  });

  return totalIncome;
}

export function updateForagerVitality(dt) {
  if (!gameState) return;

  gameState.foragers.forEach(forager => {
    if (!forager.birdId) return;

    const bird = getBirdById(forager.birdId);
    if (!bird) return;

    // Only drain if bird has vitality remaining
    if (bird.vitalityPercent > 0) {
      // Get drain rate for this bird's distinction
      const drainPerMinute = VITALITY_DRAIN_RATE[bird.distinction] || 1.0;
      const drainPerMs = drainPerMinute / 60000; // Convert to per millisecond
      const drainAmount = drainPerMs * dt;

      bird.vitalityPercent = Math.max(0, bird.vitalityPercent - drainAmount);
    }
  });
}

export function assignForager(slot, birdId) {
  if (!gameState) return false;

  const forager = gameState.foragers.find(f => f.slot === slot);
  if (!forager || !forager.unlocked) return false;

  const bird = getBirdById(birdId);
  if (!bird) return false;

  // Unassign bird from current location
  unassignBirdFromCurrentLocation(bird);

  // Unassign any bird currently in this forager slot
  if (forager.birdId) {
    unassignForager(slot);
  }

  // Update bird location and assign to forager
  bird.location = `forager_${slot}`;
  forager.birdId = birdId;
  forager.assignedAt = Date.now();
  forager.accumulatedSeeds = 0;

  console.log(`Assigned ${bird.speciesName} to Forager ${slot}`);
  return true;
}

// Helper function to unassign a bird from its current location
export function unassignBirdFromCurrentLocation(bird) {
  if (!bird || !bird.location) return;

  // Parse location
  if (bird.location.startsWith('forager_')) {
    const slot = parseInt(bird.location.split('_')[1]);
    const forager = gameState.foragers.find(f => f.slot === slot);
    if (forager && forager.birdId === bird.id) {
      forager.birdId = null;
      forager.assignedAt = null;
      forager.accumulatedSeeds = 0;
    }
  } else if (bird.location.startsWith('perch_')) {
    const slot = parseInt(bird.location.split('_')[1]);
    const perch = gameState.perches.find(p => p.slot === slot);
    if (perch && perch.birdId === bird.id) {
      perch.birdId = null;
      perch.assignedAt = null;
      perch.restoreCooldown = 0;
    }
  } else if (bird.location.startsWith('assistant_')) {
    const biomeId = bird.location.split('_')[1];
    const survey = gameState.surveys.find(s => s.id === biomeId);
    if (survey && survey.assistantId === bird.id) {
      survey.assistantId = null;
      survey.lastUpdateTime = null;
    }
  }
  // If location is 'collection', no cleanup needed
}

export function unassignForager(slot) {
  if (!gameState) return false;

  const forager = gameState.foragers.find(f => f.slot === slot);
  if (!forager || !forager.birdId) return false;

  const bird = getBirdById(forager.birdId);
  if (bird) {
    bird.location = 'collection';
  }

  forager.birdId = null;
  forager.assignedAt = null;
  forager.accumulatedSeeds = 0;

  console.log(`Unassigned from Forager ${slot}`);
  return true;
}

export function unlockForagerSlot(slot) {
  if (!gameState) return false;

  const forager = gameState.foragers.find(f => f.slot === slot);
  if (!forager || forager.unlocked) return false;

  if (spendSeeds(forager.unlockCost)) {
    forager.unlocked = true;
    console.log(`Unlocked Forager slot ${slot} for ${forager.unlockCost} Seeds`);
    return true;
  }

  return false;
}

export function tapForagerSlot(slot) {
  if (!gameState) return 0;

  const forager = gameState.foragers.find(f => f.slot === slot);
  if (!forager || !forager.unlocked) return 0;

  // Tap rewards scale by circle: 10/100/1000
  const tapRewards = [10, 100, 1000];
  const seedsEarned = tapRewards[slot] || MANUAL_TAP_SEEDS;

  // TODO Stage 3: Apply manual effectiveness bonuses

  return seedsEarned;
}
