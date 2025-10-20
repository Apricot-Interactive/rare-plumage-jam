// SANCTUARY - Forager System
import { gameState, getBirdById, spendSeeds } from '../core/state.js';
import { FORAGER_INCOME, MANUAL_TAP_SEEDS } from '../core/constants.js';

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
  // TODO: Implement in Stage 2
}

export function assignForager(slot, birdId) {
  if (!gameState) return false;

  const forager = gameState.foragers.find(f => f.slot === slot);
  if (!forager || !forager.unlocked) return false;

  const bird = getBirdById(birdId);
  if (!bird) return false;

  // Unassign bird from current location
  bird.location = `forager_${slot}`;

  // Assign to forager
  forager.birdId = birdId;
  forager.assignedAt = Date.now();
  forager.accumulatedSeeds = 0;

  console.log(`Assigned ${bird.speciesName} to Forager ${slot}`);
  return true;
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
