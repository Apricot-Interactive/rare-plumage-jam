// SANCTUARY - Game State Management
import { GAME_CONFIG, UNLOCK_COSTS, BIOMES, SURVEY_COSTS, ENERGY_CAPACITY, MAX_BIRDS_PER_RARITY } from './constants.js';
import { STORAGE_KEYS } from './constants.js';
import { generateId } from '../utils/random.js';
import { calculateOfflineProgress } from '../systems/offline.js';

export let gameState = null;

// Create default initial state
function createDefaultState() {
  return {
    version: GAME_CONFIG.VERSION,
    seeds: GAME_CONFIG.STARTING_SEEDS,
    totalSeedsEarned: GAME_CONFIG.STARTING_SEEDS,

    // Prestige (Crystal-based)
    crystals: [], // Array of unlocked biome IDs: ['forest', 'mountain', etc.]
    prestigeCount: 0,

    // Biomes - each contains 3 forager slots + 1 survey slot
    biomes: BIOMES.map((biome, index) => ({
      id: biome.id,
      name: biome.name,
      unlocked: index === 0, // Only forest unlocked initially
      unlockRequirement: biome.unlockRequirement, // ⭐ distinction required

      // 3 forager slots per biome
      foragers: [
        { slot: 0, birdId: null, unlocked: true, unlockCost: 0, assignedAt: null, accumulatedSeeds: 0 },
        { slot: 1, birdId: null, unlocked: false, unlockCost: UNLOCK_COSTS.biomeForagers[biome.id][1], assignedAt: null, accumulatedSeeds: 0 },
        { slot: 2, birdId: null, unlocked: false, unlockCost: UNLOCK_COSTS.biomeForagers[biome.id][2], assignedAt: null, accumulatedSeeds: 0 }
      ],

      // Survey slot
      survey: {
        progress: index === 0 ? GAME_CONFIG.STARTING_SURVEY_PROGRESS : 0, // Tutorial: Forest starts at 97.5% (390/400)
        surveyorId: null, // Bird assigned to survey
        lastUpdateTime: null
      }
    })),

    // Perches (5 slots)
    perches: [
      { slot: 0, birdId: null, unlocked: true, unlockCost: 0, assignedAt: null, restoreCooldown: 0 },
      { slot: 1, birdId: null, unlocked: false, unlockCost: UNLOCK_COSTS.perches[1], assignedAt: null, restoreCooldown: 0 },
      { slot: 2, birdId: null, unlocked: false, unlockCost: UNLOCK_COSTS.perches[2], assignedAt: null, restoreCooldown: 0 },
      { slot: 3, birdId: null, unlocked: false, unlockCost: UNLOCK_COSTS.perches[3], assignedAt: null, restoreCooldown: 0 },
      { slot: 4, birdId: null, unlocked: false, unlockCost: UNLOCK_COSTS.perches[4], assignedAt: null, restoreCooldown: 0 }
    ],
    activePerchIndex: 0, // Which perch is in the "active" (top) position

    // Breeding Programs (3 slots)
    breedingPrograms: [
      { program: 0, unlocked: true, unlockCost: 0, active: false, lineage1Id: null, lineage2Id: null, progress: 0, startTime: null, estimatedDuration: null, lastUpdateTime: null },
      { program: 1, unlocked: false, unlockCost: UNLOCK_COSTS.breedingPrograms[1], active: false, lineage1Id: null, lineage2Id: null, progress: 0, startTime: null, estimatedDuration: null, lastUpdateTime: null },
      { program: 2, unlocked: false, unlockCost: UNLOCK_COSTS.breedingPrograms[2], active: false, lineage1Id: null, lineage2Id: null, progress: 0, startTime: null, estimatedDuration: null, lastUpdateTime: null }
    ],

    // Specimens (birds) - Tutorial starts with 0 birds
    specimens: [],

    cataloguedSpecies: [],
    legendariesAcquired: [],

    // Narrative
    orientationComplete: false,
    narrativeBeatsShown: [],

    // Milestone celebrations (track which ones have been shown)
    milestonesShown: {
      biomes: [], // ['mountain', 'coastal', 'arid', 'tundra']
      starRarities: [] // [2, 3, 4, 5]
    },

    // Bird limit system
    birdLimitWarningShown: false, // Track if "birds moving on" message has been shown

    // Tutorial
    tutorialActive: true,
    tutorialStep: 0,
    tutorialCompleted: false,
    sanctuaryUnlocked: false,
    hatcheryUnlocked: false,
    hasSeenOfflineTip: false, // One-time tip about offline progress when assigning depleted bird to perch

    // Timestamps
    lastSaveTime: Date.now(),
    lastOpenTime: Date.now(),
    establishedAt: Date.now()
  };
}

// Migration helper: Convert old percentage-based vitality to absolute energy values
function migrateVitalityToAbsolute(bird) {
  if (bird.vitality === undefined && bird.vitalityPercent !== undefined) {
    const maxEnergy = ENERGY_CAPACITY[bird.distinction] || ENERGY_CAPACITY[1];
    bird.vitality = (bird.vitalityPercent / 100) * maxEnergy;
    console.log(`Migrated bird ${bird.id}: ${bird.vitalityPercent}% -> ${bird.vitality}/${maxEnergy} energy`);
  }
  // Ensure vitality exists even if vitalityPercent was missing
  if (bird.vitality === undefined) {
    const maxEnergy = ENERGY_CAPACITY[bird.distinction] || ENERGY_CAPACITY[1];
    bird.vitality = maxEnergy; // Default to full energy
  }
  return bird;
}

export function initializeState() {
  const loaded = loadGame();

  if (loaded) {
    gameState = loaded;
    console.log('Game loaded from localStorage');

    // Migrate old saves to use absolute vitality
    if (gameState.specimens && gameState.specimens.length > 0) {
      gameState.specimens.forEach(bird => migrateVitalityToAbsolute(bird));
      console.log('Vitality migration complete');
    }

    // Migrate old saves to include milestonesShown
    if (!gameState.milestonesShown) {
      gameState.milestonesShown = {
        biomes: [],
        starRarities: []
      };
      console.log('Milestones tracking initialized');
    }

    // Migrate old saves to include birdLimitWarningShown
    if (gameState.birdLimitWarningShown === undefined) {
      gameState.birdLimitWarningShown = false;
      console.log('Bird limit warning tracking initialized');
    }

    // Migrate old saves to include activePerchIndex
    if (gameState.activePerchIndex === undefined) {
      gameState.activePerchIndex = 0;
      console.log('Active perch index initialized');
    }

    // Calculate offline progress
    const offlineProgress = calculateOfflineProgress();

    // Store offline progress for the modal (will be shown in main.js)
    if (offlineProgress.timeAway > 0) {
      window.offlineProgressData = offlineProgress;
    }
  } else {
    gameState = createDefaultState();
    console.log('New game created');
    saveGame();
  }

  return gameState;
}

export function saveGame() {
  if (!gameState) return;

  gameState.lastSaveTime = Date.now();

  try {
    const saveData = JSON.stringify(gameState);
    localStorage.setItem(STORAGE_KEYS.GAME_STATE, saveData);
    console.log('Game saved');
  } catch (error) {
    console.error('Failed to save game:', error);
  }
}

export function loadGame() {
  try {
    const saveData = localStorage.getItem(STORAGE_KEYS.GAME_STATE);

    if (!saveData) {
      return null;
    }

    const loaded = JSON.parse(saveData);

    // Version check
    if (loaded.version !== GAME_CONFIG.VERSION) {
      console.warn('Save version mismatch, starting fresh');
      return null;
    }

    // Update lastOpenTime
    loaded.lastOpenTime = Date.now();

    return loaded;
  } catch (error) {
    console.error('Failed to load game:', error);
    return null;
  }
}

// Helper to get bird by ID
export function getBirdById(birdId) {
  if (!gameState) return null;
  return gameState.specimens.find(b => b.id === birdId);
}

// Helper to update seeds
export function addSeeds(amount) {
  if (!gameState) return;
  gameState.seeds += amount;
  gameState.totalSeedsEarned += amount;
}

export function spendSeeds(amount) {
  if (!gameState) return false;
  if (gameState.seeds < amount) return false;
  gameState.seeds -= amount;
  return true;
}

// Enforce bird limit per rarity (max 8 of each star level)
// MUST be called BEFORE adding a new bird to ensure we never exceed the limit
// Returns true if a bird was deleted, false otherwise
export function enforceBirdLimit(newBirdDistinction) {
  if (!gameState) return false;

  // Count birds of this rarity
  const birdsOfThisRarity = gameState.specimens.filter(
    bird => bird.distinction === newBirdDistinction
  );

  // If we're at the limit, remove the least valuable bird to make room
  // IMPORTANT: Check >= MAX_BIRDS_PER_RARITY (not >) because we're about to add one
  if (birdsOfThisRarity.length >= MAX_BIRDS_PER_RARITY) {
    // Find unused birds (not assigned to any job)
    const unusedBirds = birdsOfThisRarity.filter(bird => {
      const isInCollection = bird.location === 'collection';
      const isOnPerch = bird.location.startsWith('perch_');
      return isInCollection || isOnPerch;
    });

    if (unusedBirds.length === 0) {
      // All birds are working! This should never happen, but if it does, log error
      console.error(`⚠️ Cannot enforce bird limit - all ${birdsOfThisRarity.length} birds of ${newBirdDistinction}⭐ are working!`);
      return false;
    }

    // Sort unused birds by priority (least valuable first)
    // Priority: immature before mature, low maturity progress before high, low energy before high
    unusedBirds.sort((a, b) => {
      // First sort by maturity (immature before mature)
      if (!a.isMature && b.isMature) return -1;
      if (a.isMature && !b.isMature) return 1;

      // If same maturity, sort by maturity progress
      const aMaturityProgress = a.maturityProgress || 0;
      const bMaturityProgress = b.maturityProgress || 0;
      if (aMaturityProgress !== bMaturityProgress) {
        return aMaturityProgress - bMaturityProgress;
      }

      // If same maturity progress, sort by vitality (least energy first)
      return a.vitalityPercent - b.vitalityPercent;
    });

    // Remove the least valuable bird
    const birdToRemove = unusedBirds[0];
    const birdIndex = gameState.specimens.findIndex(b => b.id === birdToRemove.id);
    if (birdIndex !== -1) {
      gameState.specimens.splice(birdIndex, 1);
      console.log(`🚪 Bird removed to make room: ${birdToRemove.speciesName} (${newBirdDistinction}⭐, ${birdsOfThisRarity.length} → ${MAX_BIRDS_PER_RARITY})`);
      return true;
    }
  }

  return false;
}

// Reset game state to default
export function resetGameState() {
  // Clear localStorage
  localStorage.removeItem(STORAGE_KEYS.GAME_STATE);

  // Create fresh default state
  gameState = createDefaultState();

  // Save the new state
  saveGame();

  console.log('Game state reset to default');
  return gameState;
}
