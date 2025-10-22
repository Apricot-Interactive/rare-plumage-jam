// SANCTUARY - Prestige System (Crystal-based)
import { gameState, getBirdById, saveGame } from '../core/state.js';
import { PRESTIGE_BIOME_ORDER, GAME_CONFIG, UNLOCK_COSTS, BIOMES } from '../core/constants.js';

/**
 * Check if prestige is available
 * Requirements:
 * - Tundra biome is unlocked
 * - At least 5 birds assigned to sanctuary perches
 * - Haven't already unlocked all 5 crystals
 */
export function canPrestige() {
  if (!gameState) return false;

  // Check if tundra is unlocked
  const tundra = gameState.biomes.find(b => b.id === 'tundra');
  if (!tundra || !tundra.unlocked) return false;

  // Check if we have 5+ crystals already (max prestiges reached)
  if (gameState.crystals.length >= 5) return false;

  // Check if at least 5 birds are on perches
  const perchedBirdCount = gameState.perches.filter(p => p.birdId !== null).length;
  if (perchedBirdCount < 5) return false;

  return true;
}

/**
 * Get the next crystal that will be awarded
 */
export function getNextCrystal() {
  if (!gameState) return null;

  const currentCrystalCount = gameState.crystals.length;
  if (currentCrystalCount >= PRESTIGE_BIOME_ORDER.length) return null;

  return PRESTIGE_BIOME_ORDER[currentCrystalCount];
}

/**
 * Perform prestige
 * 1. Award next crystal in sequence
 * 2. Keep only 5 birds from perches (reset to 100% vitality + immature)
 * 3. Reset seeds to starting amount
 * 4. Re-lock all biomes except Forest
 * 5. Remove all non-perched birds
 * 6. Clear all assignments except perches
 * 7. Reset breeding programs
 */
export function performPrestige() {
  if (!gameState) return false;
  if (!canPrestige()) return false;

  const nextCrystal = getNextCrystal();
  if (!nextCrystal) return false;

  console.log(`Performing prestige... Awarding ${nextCrystal} crystal`);

  // 1. Award crystal
  gameState.crystals.push(nextCrystal);
  gameState.prestigeCount++;

  // 2. Keep only perched birds, reset their state
  const keptBirds = [];
  gameState.perches.forEach(perch => {
    if (perch.birdId) {
      const bird = getBirdById(perch.birdId);
      if (bird) {
        // Reset bird to fresh state
        bird.vitalityPercent = 100;
        bird.isMature = false;
        bird.location = `perch_${perch.slot}`;
        bird.restoreCooldownUntil = 0;
        keptBirds.push(bird);
      }
    }
  });

  // Remove all other birds
  gameState.specimens = keptBirds;

  // 3. Reset seeds to starting amount
  gameState.seeds = GAME_CONFIG.STARTING_SEEDS;
  gameState.totalSeedsEarned = GAME_CONFIG.STARTING_SEEDS;

  // 4. Re-lock all biomes except Forest, reset their state
  gameState.biomes.forEach((biome, index) => {
    if (biome.id !== 'forest') {
      biome.unlocked = false;
    }

    // Reset all foragers
    biome.foragers = [
      { slot: 0, birdId: null, unlocked: true, unlockCost: 0, assignedAt: null, accumulatedSeeds: 0 },
      { slot: 1, birdId: null, unlocked: false, unlockCost: UNLOCK_COSTS.biomeForagers[biome.id][1], assignedAt: null, accumulatedSeeds: 0 },
      { slot: 2, birdId: null, unlocked: false, unlockCost: UNLOCK_COSTS.biomeForagers[biome.id][2], assignedAt: null, accumulatedSeeds: 0 }
    ];

    // Reset survey
    biome.survey = {
      progress: index === 0 ? GAME_CONFIG.STARTING_SURVEY_PROGRESS : 0,
      surveyorId: null,
      observationCost: BIOMES[index].observationCost,
      progressPerTap: BIOMES[index].progressPerTap,
      lastUpdateTime: null
    };
  });

  // 5. Keep perches assigned, reset cooldowns
  gameState.perches.forEach((perch, index) => {
    perch.assignedAt = perch.birdId ? Date.now() : null;
    perch.restoreCooldown = 0;
    // Perches keep their unlock status through prestige
  });

  // 6. Reset breeding programs (keep unlock status)
  gameState.breedingPrograms.forEach(program => {
    program.active = false;
    program.lineage1Id = null;
    program.lineage2Id = null;
    program.progress = 0;
    program.startTime = null;
    program.estimatedDuration = null;
    program.lastUpdateTime = null;
    // Programs keep their unlock status through prestige
  });

  // 7. Don't clear catalogued species or legendaries
  // These persist through prestige for completion tracking

  // Save the new state
  saveGame();

  console.log(`Prestige complete! Crystal awarded: ${nextCrystal}`);
  console.log(`Kept ${keptBirds.length} birds from perches`);
  console.log(`Total crystals: ${gameState.crystals.length}`);

  return true;
}

/**
 * Get prestige confirmation message
 */
export function getPrestigeWarningMessage() {
  const nextCrystal = getNextCrystal();
  if (!nextCrystal) return null;

  const crystalName = nextCrystal.charAt(0).toUpperCase() + nextCrystal.slice(1);

  return {
    title: 'Perform Prestige?',
    crystal: nextCrystal,
    crystalName: crystalName,
    warning: [
      `You will receive the ${crystalName} Crystal.`,
      '',
      'This will:',
      '• Keep your 5 perched birds (reset to 100% vitality + immature)',
      '• Remove all other birds',
      '• Reset Seeds to 100',
      '• Re-lock all biomes except Forest',
      '• Keep your unlocked perches and breeding programs',
      '',
      `With this crystal, you can breed the ${crystalName} legendary bird.`
    ].join('\n')
  };
}
