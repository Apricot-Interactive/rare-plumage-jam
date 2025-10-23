// SANCTUARY - Sanctuary System (Perches, Grooming, Maturation, Bonuses)
import { gameState, getBirdById, spendSeeds } from '../core/state.js';
import { VITALITY_RESTORE_TIME_SECONDS, MANUAL_RESTORE_PERCENT_PER_TAP, UNLOCK_COSTS, TRAITS, MATURITY_COSTS } from '../core/constants.js';
import { unassignBirdFromCurrentLocation } from './foragers.js';

export function updateGrooming(dt) {
  if (!gameState) return;

  const dtSeconds = dt / 1000; // Convert to seconds

  gameState.perches.forEach(perch => {
    if (!perch.birdId) return;

    const bird = getBirdById(perch.birdId);
    if (!bird) return;

    // Only restore if vitality is below 100%
    if (bird.vitalityPercent < 100) {
      // Full recovery over 5 minutes (300 seconds)
      // So restore rate is 100% / 300 seconds = 0.333...% per second
      const restorePerSecond = 100 / VITALITY_RESTORE_TIME_SECONDS;
      const restoreAmount = restorePerSecond * dtSeconds;

      bird.vitalityPercent = Math.min(100, bird.vitalityPercent + restoreAmount);
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

  // Initialize cooldown timestamp on bird if it doesn't exist
  if (bird.restoreCooldownUntil === undefined) {
    bird.restoreCooldownUntil = 0;
  }

  console.log(`Assigned ${bird.speciesName} to Perch ${slot + 1}`);

  // Tutorial hook
  import('../systems/tutorial.js').then(module => {
    if (module.handlePerchAssignment) {
      module.handlePerchAssignment(slot);
    }
  });

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

  const bird = getBirdById(perch.birdId);
  if (!bird) return false;

  // No cooldown - tap speeds up recovery by 1% per tap
  bird.vitalityPercent = Math.min(100, bird.vitalityPercent + MANUAL_RESTORE_PERCENT_PER_TAP);

  console.log(`Manual restore: +${MANUAL_RESTORE_PERCENT_PER_TAP}% vitality`);

  // Tutorial hook
  import('../systems/tutorial.js').then(module => {
    if (module.handleManualRestore) {
      module.handleManualRestore();
    }
  });

  return true;
}

export function matureBird(birdId) {
  if (!gameState) return false;

  const bird = getBirdById(birdId);
  if (!bird || bird.isMature) return false;

  // Initialize maturityProgress if it doesn't exist (for backward compatibility)
  if (bird.maturityProgress === undefined) {
    bird.maturityProgress = 0;
  }

  // Get total maturity cost for this bird's star level
  const totalCost = MATURITY_COSTS[bird.distinction] || MATURITY_COSTS[1];

  // Each tap costs 10% of total and grants 10% progress
  const costPerTap = Math.ceil(totalCost * 0.1);

  // Spend seeds for this tap
  if (spendSeeds(costPerTap)) {
    bird.maturityProgress += 10;
    console.log(`Maturity progress: ${bird.maturityProgress}% for ${bird.speciesName} (cost: ${costPerTap})`);

    // Check if fully mature
    if (bird.maturityProgress >= 100) {
      bird.isMature = true;
      bird.maturityProgress = 100; // Cap at 100
      console.log(`${bird.speciesName} is now mature!`);
    }

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
