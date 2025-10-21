// SANCTUARY - Sanctuary System (Perches, Grooming, Maturation, Bonuses)
import { gameState, getBirdById, spendSeeds } from '../core/state.js';
import { VITALITY_RESTORE_RATE, IMMEDIATE_RESTORE_AMOUNT, IMMEDIATE_RESTORE_COOLDOWN, UNLOCK_COSTS, TRAITS } from '../core/constants.js';
import { unassignBirdFromCurrentLocation } from './foragers.js';

export function updateGrooming(dt) {
  if (!gameState) return;

  gameState.perches.forEach(perch => {
    if (!perch.birdId) return;

    const bird = getBirdById(perch.birdId);
    if (!bird) return;

    // Only restore if vitality is below 100%
    if (bird.vitalityPercent < 100) {
      const restorePerMinute = VITALITY_RESTORE_RATE;
      const restorePerMs = restorePerMinute / 60000;
      const restoreAmount = restorePerMs * dt;

      bird.vitalityPercent = Math.min(100, bird.vitalityPercent + restoreAmount);
    }

    // Update cooldown
    if (perch.restoreCooldown > 0) {
      perch.restoreCooldown = Math.max(0, perch.restoreCooldown - dt);
    }
  });
}

export function assignPerch(slot, birdId) {
  if (!gameState) return false;

  const perch = gameState.perches.find(p => p.slot === slot);
  if (!perch || !perch.unlocked) return false;

  const bird = getBirdById(birdId);
  if (!bird) return false;

  // Unassign bird from current location
  unassignBirdFromCurrentLocation(bird);

  // Unassign any bird currently in this perch slot
  if (perch.birdId) {
    unassignPerch(slot);
  }

  // Update bird location and assign to perch
  bird.location = `perch_${slot}`;
  perch.birdId = birdId;
  perch.assignedAt = Date.now();
  perch.restoreCooldown = 0;

  console.log(`Assigned ${bird.speciesName} to Perch ${slot + 1}`);
  return true;
}

export function unassignPerch(slot) {
  if (!gameState) return false;

  const perch = gameState.perches.find(p => p.slot === slot);
  if (!perch || !perch.birdId) return false;

  const bird = getBirdById(perch.birdId);
  if (bird) {
    bird.location = 'collection';
  }

  perch.birdId = null;
  perch.assignedAt = null;
  perch.restoreCooldown = 0;

  console.log(`Unassigned from Perch ${slot + 1}`);
  return true;
}

export function unlockPerchSlot(slot) {
  if (!gameState) return false;

  const perch = gameState.perches.find(p => p.slot === slot);
  if (!perch || perch.unlocked) return false;

  if (spendSeeds(perch.unlockCost)) {
    perch.unlocked = true;
    console.log(`Unlocked Perch slot ${slot + 1} for ${perch.unlockCost} Seeds`);
    return true;
  }

  return false;
}

export function instantRestore(slot) {
  if (!gameState) return false;

  const perch = gameState.perches.find(p => p.slot === slot);
  if (!perch || !perch.birdId) return false;

  // Check cooldown
  if (perch.restoreCooldown > 0) {
    console.log(`Restore on cooldown: ${Math.ceil(perch.restoreCooldown / 1000)}s remaining`);
    return false;
  }

  const bird = getBirdById(perch.birdId);
  if (!bird) return false;

  // Apply instant restore
  bird.vitalityPercent = Math.min(100, bird.vitalityPercent + IMMEDIATE_RESTORE_AMOUNT);

  // Calculate cooldown based on bird's distinction (FORAGER_DURATION * IMMEDIATE_RESTORE_COOLDOWN)
  const { FORAGER_DURATION } = { FORAGER_DURATION: { 1: 10, 2: 60, 3: 240, 4: 480, 5: 1440 } };
  const groomTimeMinutes = FORAGER_DURATION[bird.distinction] || 10;
  const cooldownMinutes = groomTimeMinutes * IMMEDIATE_RESTORE_COOLDOWN;
  perch.restoreCooldown = cooldownMinutes * 60 * 1000; // Convert to milliseconds

  console.log(`Instant restore: +${IMMEDIATE_RESTORE_AMOUNT}% vitality, cooldown ${cooldownMinutes}min`);
  return true;
}

export function matureBird(birdId) {
  if (!gameState) return false;

  const bird = getBirdById(birdId);
  if (!bird || bird.isMature) return false;

  if (spendSeeds(UNLOCK_COSTS.maturation)) {
    bird.isMature = true;
    console.log(`Matured ${bird.speciesName} for ${UNLOCK_COSTS.maturation} Seeds`);
    return true;
  }

  return false;
}

// Calculate active Distinguished Guest bonuses from perched birds
export function calculateGuestBonuses() {
  if (!gameState) return {};

  const bonuses = {
    forager_efficiency: 0,
    vitality_drain_reduction: 0,
    manual_effectiveness: 0,
    survey_outcome_improvement: 0,
    seed_cost_reduction: 0,
    breeding_cooldown_reduction: 0,
    incubation_speed: 0,
    trait_inheritance_success: 0,
    all_bonuses_multiplier: 0,
    legendary_breeding_chance: 0
  };

  gameState.perches.forEach(perch => {
    if (!perch.birdId) return;

    const bird = getBirdById(perch.birdId);
    if (!bird || !bird.traits) return;

    // Apply each trait's bonus
    bird.traits.forEach(traitId => {
      const trait = TRAITS[traitId];
      if (!trait || !trait.guestBonus) return;

      const { type, value } = trait.guestBonus;
      if (bonuses.hasOwnProperty(type)) {
        bonuses[type] += value;
      }
    });
  });

  // Apply luminescence multiplier (multiplicative bonus to all other bonuses)
  if (bonuses.all_bonuses_multiplier > 0) {
    const multiplier = 1 + bonuses.all_bonuses_multiplier;
    Object.keys(bonuses).forEach(key => {
      if (key !== 'all_bonuses_multiplier') {
        bonuses[key] *= multiplier;
      }
    });
  }

  return bonuses;
}

// Get list of active guest birds (birds in perches)
export function getActiveGuests() {
  if (!gameState) return [];

  const guests = [];

  gameState.perches.forEach(perch => {
    if (!perch.birdId) return;

    const bird = getBirdById(perch.birdId);
    if (bird) {
      guests.push(bird);
    }
  });

  return guests;
}
