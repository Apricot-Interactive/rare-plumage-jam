// SANCTUARY - Forager System (Biome-based)
import { gameState, getBirdById, spendSeeds } from '../core/state.js';
import { FORAGER_BASE_RATES, ENERGY_DRAIN_PER_SECOND, ENERGY_CAPACITY, TRAITS } from '../core/constants.js';

// Calculate guest bonuses inline to avoid circular dependency
function getForagerEfficiencyBonus() {
  if (!gameState) return 0;

  let bonus = 0;
  gameState.perches.forEach(perch => {
    if (!perch.birdId) return;

    const bird = getBirdById(perch.birdId);
    if (!bird || !bird.traits) return;

    bird.traits.forEach(traitId => {
      const trait = TRAITS[traitId];
      if (trait?.guestBonus?.type === 'forager_efficiency') {
        bonus += trait.guestBonus.value;
      }
    });
  });

  return bonus;
}

// Calculate income for a specific forager slot
export function calculateForagerSlotIncome(biomeId, slotIndex, birdId) {
  if (!birdId) return 0;

  const bird = getBirdById(birdId);
  if (!bird || bird.vitalityPercent <= 0) return 0;

  // Get base rate for this biome and slot
  const baseRate = FORAGER_BASE_RATES[biomeId]?.[slotIndex] || 0;
  if (baseRate === 0) return 0;

  // Multiply by star level
  let rate = baseRate * bird.distinction;

  // Double if bird is from this biome
  if (bird.biome === biomeId) {
    rate *= 2;
  }

  // Apply guest bonuses (Alacrity trait, etc.)
  const efficiencyBonus = getForagerEfficiencyBonus();
  if (efficiencyBonus > 0) {
    rate *= (1 + efficiencyBonus);
  }

  return rate;
}

// Calculate total Seeds income from all foragers across all biomes
export function calculateForagerIncome() {
  if (!gameState) return 0;

  let totalIncome = 0;

  gameState.biomes.forEach(biome => {
    if (!biome.unlocked) return;

    biome.foragers.forEach((forager, slotIndex) => {
      if (!forager.birdId) return;

      totalIncome += calculateForagerSlotIncome(biome.id, slotIndex, forager.birdId);
    });
  });

  return totalIncome;
}

// Update vitality for all foragers and surveyors across all biomes
export function updateForagerVitality(dt) {
  if (!gameState) return;

  const dtSeconds = dt / 1000; // Convert milliseconds to seconds

  gameState.biomes.forEach(biome => {
    if (!biome.unlocked) return;

    // Drain vitality for foragers
    biome.foragers.forEach(forager => {
      if (!forager.birdId) return;

      const bird = getBirdById(forager.birdId);
      if (!bird) return;

      if (bird.vitalityPercent > 0) {
        // Drain 1 energy per second
        const maxEnergy = ENERGY_CAPACITY[bird.distinction] || ENERGY_CAPACITY[1];
        const energyDrained = ENERGY_DRAIN_PER_SECOND * dtSeconds;
        const percentDrained = (energyDrained / maxEnergy) * 100;

        bird.vitalityPercent = Math.max(0, bird.vitalityPercent - percentDrained);
      }
    });

    // Drain vitality for surveyor
    if (biome.survey.surveyorId) {
      const bird = getBirdById(biome.survey.surveyorId);
      if (bird && bird.vitalityPercent > 0) {
        const maxEnergy = ENERGY_CAPACITY[bird.distinction] || ENERGY_CAPACITY[1];
        const energyDrained = ENERGY_DRAIN_PER_SECOND * dtSeconds;
        const percentDrained = (energyDrained / maxEnergy) * 100;

        bird.vitalityPercent = Math.max(0, bird.vitalityPercent - percentDrained);
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

// Calculate manual effectiveness bonus inline to avoid circular dependency
function getManualEffectivenessBonus() {
  if (!gameState) return 0;

  let bonus = 0;
  gameState.perches.forEach(perch => {
    if (!perch.birdId) return;

    const bird = getBirdById(perch.birdId);
    if (!bird || !bird.traits) return;

    bird.traits.forEach(traitId => {
      const trait = TRAITS[traitId];
      if (trait?.guestBonus?.type === 'manual_effectiveness') {
        bonus += trait.guestBonus.value;
      }
    });
  });

  return bonus;
}

// Tap a forager slot for manual seeds - adds 5 seconds of gathering instantly
export function tapForagerSlot(biomeId, slotIndex) {
  if (!gameState) return 0;

  const biome = gameState.biomes.find(b => b.id === biomeId);
  if (!biome || !biome.unlocked) return 0;

  const forager = biome.foragers[slotIndex];
  if (!forager || !forager.unlocked) return 0;

  // Calculate 5 seconds worth of income for this slot
  const incomePerSecond = calculateForagerSlotIncome(biomeId, slotIndex, forager.birdId);
  const seedsEarned = incomePerSecond * 5; // 5 seconds worth

  // Apply manual effectiveness bonuses
  const manualBonus = getManualEffectivenessBonus();
  let finalSeeds = seedsEarned;
  if (manualBonus > 0) {
    finalSeeds *= (1 + manualBonus);
  }

  return Math.floor(finalSeeds);
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
