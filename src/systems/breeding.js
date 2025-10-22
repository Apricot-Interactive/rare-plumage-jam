// SANCTUARY - Breeding System
import { gameState, getBirdById } from '../core/state.js';
import { BREEDING_DURATION, DISTINCTION_INHERITANCE, TRAIT_COUNT } from '../core/constants.js';
import { createSpecimen } from '../data/species.js';
import { randomChoice } from '../utils/random.js';
import { getActiveGuests } from './sanctuary.js';
import { unassignBirdFromCurrentLocation } from './foragers.js';

export function calculateOffspring(parent1, parent2) {
  if (!parent1 || !parent2) return null;

  // === TRAIT INHERITANCE (Genetic Square) ===
  // Each parent contributes 1 random trait → 4 possible combinations (25% each)
  const trait1 = randomChoice(parent1.traits);
  const trait2 = randomChoice(parent2.traits);

  let offspringTraits = [trait1, trait2];

  // Apply Acuity guest bonus (+15% chance for additional trait inheritance)
  const guests = getActiveGuests();
  const hasAcuity = guests.some(g => g.traits.includes('acuity'));

  if (hasAcuity && Math.random() < 0.15) {
    // Bonus: inherit one additional random trait from either parent
    const bonusTrait = randomChoice([...parent1.traits, ...parent2.traits]);
    if (!offspringTraits.includes(bonusTrait)) {
      offspringTraits.push(bonusTrait);
    }
  }

  // === DISTINCTION INHERITANCE ===
  // Average parents (round up), then apply probability
  const avgDistinction = Math.ceil((parent1.distinction + parent2.distinction) / 2);

  const roll = Math.random();
  let distinction;

  if (roll < DISTINCTION_INHERITANCE.base) {
    distinction = avgDistinction; // 60%
  } else if (roll < DISTINCTION_INHERITANCE.base + DISTINCTION_INHERITANCE.plus) {
    distinction = Math.min(5, avgDistinction + 1); // 30% +1⭐
  } else {
    distinction = Math.max(1, avgDistinction - 1); // 10% -1⭐
  }

  // === BIOME INHERITANCE ===
  // 50/50 from either parent
  const biome = Math.random() < 0.5 ? parent1.biome : parent2.biome;

  // === TRAIT COUNT NORMALIZATION ===
  // Ensure trait count matches distinction (1/1/2/3/3)
  const expectedTraitCount = TRAIT_COUNT[distinction] || 1;

  // Remove duplicates first
  offspringTraits = [...new Set(offspringTraits)];

  // Trim or pad to match expected count
  if (offspringTraits.length > expectedTraitCount) {
    offspringTraits = offspringTraits.slice(0, expectedTraitCount);
  } else {
    // If we need more traits, pull from parent traits
    while (offspringTraits.length < expectedTraitCount) {
      const additionalTrait = randomChoice([...parent1.traits, ...parent2.traits]);
      if (!offspringTraits.includes(additionalTrait)) {
        offspringTraits.push(additionalTrait);
      } else {
        // If all parent traits are already included, break to avoid infinite loop
        break;
      }
    }
  }

  return {
    biome,
    distinction,
    traits: offspringTraits
  };
}

export function startBreeding(parent1Id, parent2Id, programSlot) {
  if (!gameState) return false;

  const program = gameState.breedingPrograms.find(p => p.program === programSlot);
  if (!program || !program.unlocked || program.active) return false;

  const parent1 = getBirdById(parent1Id);
  const parent2 = getBirdById(parent2Id);

  // Validate parents exist and are mature
  if (!parent1 || !parent2) return false;
  if (!parent1.isMature || !parent2.isMature) return false;
  if (parent1.id === parent2.id) return false; // Can't breed with self

  // Calculate offspring to determine duration
  const offspring = calculateOffspring(parent1, parent2);
  if (!offspring) return false;

  // Get base duration for offspring distinction
  const baseDuration = BREEDING_DURATION[offspring.distinction] || 1;

  // Apply Synchrony guest bonus (-25% incubation duration)
  const guests = getActiveGuests();
  const hasSynchrony = guests.some(g => g.traits.includes('synchrony'));
  const durationMultiplier = hasSynchrony ? 0.75 : 1.0;
  const finalDuration = baseDuration * durationMultiplier;

  // Unassign parents from current locations
  unassignBirdFromCurrentLocation(parent1);
  unassignBirdFromCurrentLocation(parent2);

  // Update parent states
  parent1.location = `breeding_${programSlot}`;
  parent2.location = `breeding_${programSlot}`;
  parent1.isMature = false;
  parent2.isMature = false;
  parent1.vitalityPercent = 100; // Reset vitality
  parent2.vitalityPercent = 100;

  // Initialize breeding program
  program.active = true;
  program.lineage1Id = parent1Id;
  program.lineage2Id = parent2Id;
  program.progress = 0;
  program.startTime = Date.now();
  program.estimatedDuration = finalDuration * 60000; // Convert minutes to ms
  program.lastUpdateTime = Date.now();

  console.log(`Started breeding in program ${programSlot} (${finalDuration} min)`);
  return true;
}

export function updateBreedingProgress(dt) {
  if (!gameState) return;

  const now = Date.now();

  gameState.breedingPrograms.forEach(program => {
    if (!program.active) return;

    const timeSinceLastUpdate = program.lastUpdateTime ? (now - program.lastUpdateTime) : dt;

    // Auto-contribution from time passage
    const progressIncrease = (timeSinceLastUpdate / program.estimatedDuration) * 100;
    program.progress += progressIncrease;
    program.lastUpdateTime = now;

    // Check for completion
    if (program.progress >= 100) {
      completeBreeding(program.program);
    }
  });
}

export function manualIncubate(programSlot) {
  if (!gameState) return false;

  const program = gameState.breedingPrograms.find(p => p.program === programSlot);
  if (!program || !program.active) return false;

  // Manual tap adds 1% progress
  program.progress = Math.min(100, program.progress + 1);

  // Check for completion
  if (program.progress >= 100) {
    completeBreeding(programSlot);
  }

  return true;
}

export function completeBreeding(programSlot) {
  if (!gameState) return;

  const program = gameState.breedingPrograms.find(p => p.program === programSlot);
  if (!program || !program.active) return;

  const parent1 = getBirdById(program.lineage1Id);
  const parent2 = getBirdById(program.lineage2Id);

  if (!parent1 || !parent2) {
    console.error('Parents not found for breeding completion');
    return;
  }

  // Check for legendary eligibility FIRST
  const isLegendary = checkLegendaryEligibility(parent1, parent2);

  let newBird;
  if (isLegendary) {
    // Create legendary specimen
    console.log(`🌟 LEGENDARY BREEDING! Creating ${parent1.biome} legendary...`);
    // Import createLegendarySpecimen function
    import('../data/species.js').then(module => {
      const legendary = module.createLegendarySpecimen(parent1.biome);
      if (legendary) {
        gameState.specimens.push(legendary);

        // Add to catalogued species if new
        if (!gameState.cataloguedSpecies.includes(legendary.speciesName)) {
          gameState.cataloguedSpecies.push(legendary.speciesName);
        }

        // Track legendary acquisition
        if (!gameState.legendariesAcquired.includes(parent1.biome)) {
          gameState.legendariesAcquired.push(parent1.biome);
        }

        console.log(`✨ Legendary created: ${legendary.speciesName}`);

        // Show celebration overlay
        import('../ui/hatchery.js').then(uiModule => {
          uiModule.showBreedingCelebration(legendary, parent1, parent2, programSlot);
        });
      }

      // Return parents to collection
      parent1.location = 'collection';
      parent2.location = 'collection';
    });

    // Reset breeding program
    program.active = false;
    program.lineage1Id = null;
    program.lineage2Id = null;
    program.progress = 0;
    program.startTime = null;
    program.estimatedDuration = null;
    program.lastUpdateTime = null;
    return;
  }

  // Calculate offspring genetics (normal breeding)
  const offspringData = calculateOffspring(parent1, parent2);
  if (!offspringData) {
    console.error('Failed to calculate offspring');
    return;
  }

  // Create new specimen
  newBird = createSpecimen(
    offspringData.biome,
    offspringData.distinction,
    offspringData.traits,
    false
  );

  if (newBird) {
    gameState.specimens.push(newBird);

    // Add to catalogued species if new
    if (!gameState.cataloguedSpecies.includes(newBird.speciesName)) {
      gameState.cataloguedSpecies.push(newBird.speciesName);
    }

    console.log(`Breeding complete! New bird: ${newBird.speciesName} (${newBird.distinction}⭐)`);

    // Show celebration overlay
    // Import and call from UI module to avoid circular dependency
    import('../ui/hatchery.js').then(module => {
      module.showBreedingCelebration(newBird, parent1, parent2, programSlot);
    });
  }

  // Return parents to collection
  parent1.location = 'collection';
  parent2.location = 'collection';

  // Reset breeding program (will be done by celebration callback)
  program.active = false;
  program.lineage1Id = null;
  program.lineage2Id = null;
  program.progress = 0;
  program.startTime = null;
  program.estimatedDuration = null;
  program.lastUpdateTime = null;
}

export function unlockBreedingProgram(programSlot) {
  if (!gameState) return false;

  const program = gameState.breedingPrograms.find(p => p.program === programSlot);
  if (!program || program.unlocked) return false;

  // Check if player has enough seeds (handled by UI/caller via spendSeeds)
  program.unlocked = true;
  console.log(`Unlocked Breeding Program ${programSlot}`);
  return true;
}

export function checkLegendaryEligibility(parent1, parent2) {
  if (!gameState || !parent1 || !parent2) return false;

  // 1. Both parents must be 5-star (⭐⭐⭐⭐⭐)
  if (parent1.distinction !== 5 || parent2.distinction !== 5) return false;

  // 2. Both must be from same biome
  if (parent1.biome !== parent2.biome) return false;

  // 3. Crystal for that biome must be unlocked
  const biome = parent1.biome;
  if (!gameState.crystals.includes(biome)) return false;

  // 4. Probability roll (10% base + guest bonuses)
  const baseChance = 0.10;

  // Check for Supremacy trait bonus (from TRAITS constant)
  const guests = getActiveGuests();
  const hasSupremacy = guests.some(g => g.traits.includes('supremacy'));
  const bonusChance = hasSupremacy ? 0.10 : 0;

  const totalChance = Math.min(1.0, baseChance + bonusChance);

  console.log(`Legendary check: biome=${biome}, crystal=${gameState.crystals.includes(biome)}, chance=${totalChance}`);

  return Math.random() < totalChance;
}
