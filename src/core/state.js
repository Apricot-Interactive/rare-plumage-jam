// SANCTUARY - Game State Management
import { GAME_CONFIG, UNLOCK_COSTS, BIOMES } from './constants.js';
import { STORAGE_KEYS } from './constants.js';
import { generateId } from '../utils/random.js';

export let gameState = null;

// Create default initial state
function createDefaultState() {
  return {
    version: GAME_CONFIG.VERSION,
    seeds: GAME_CONFIG.STARTING_SEEDS,
    totalSeedsEarned: GAME_CONFIG.STARTING_SEEDS,

    // Prestige
    enhancements: [],
    currentTerritory: 'forest',
    reorganizationCount: 0,

    // Foragers (3 slots)
    foragers: [
      { slot: 0, birdId: null, unlocked: true, unlockCost: 0, assignedAt: null, accumulatedSeeds: 0 },
      { slot: 1, birdId: null, unlocked: false, unlockCost: UNLOCK_COSTS.foragers[1], assignedAt: null, accumulatedSeeds: 0 },
      { slot: 2, birdId: null, unlocked: false, unlockCost: UNLOCK_COSTS.foragers[2], assignedAt: null, accumulatedSeeds: 0 }
    ],

    // Surveys (5 biomes)
    surveys: BIOMES.map(biome => ({
      id: biome.id,
      biome: biome.id,
      progress: biome.id === 'forest' ? GAME_CONFIG.STARTING_SURVEY_PROGRESS : 0,
      assistantId: null,
      observationCost: biome.observationCost,
      progressPerTap: biome.progressPerTap,
      lastUpdateTime: null
    })),

    // Perches (5 slots)
    perches: [
      { slot: 0, birdId: null, unlocked: true, unlockCost: 0, assignedAt: null, restoreCooldown: 0 },
      { slot: 1, birdId: null, unlocked: false, unlockCost: UNLOCK_COSTS.perches[1], assignedAt: null, restoreCooldown: 0 },
      { slot: 2, birdId: null, unlocked: false, unlockCost: UNLOCK_COSTS.perches[2], assignedAt: null, restoreCooldown: 0 },
      { slot: 3, birdId: null, unlocked: false, unlockCost: UNLOCK_COSTS.perches[3], assignedAt: null, restoreCooldown: 0 },
      { slot: 4, birdId: null, unlocked: false, unlockCost: UNLOCK_COSTS.perches[4], assignedAt: null, restoreCooldown: 0 }
    ],

    // Breeding Programs (3 slots)
    breedingPrograms: [
      { program: 0, unlocked: true, unlockCost: 0, active: false, lineage1Id: null, lineage2Id: null, progress: 0, startTime: null, estimatedDuration: null, lastUpdateTime: null },
      { program: 1, unlocked: false, unlockCost: UNLOCK_COSTS.breedingPrograms[1], active: false, lineage1Id: null, lineage2Id: null, progress: 0, startTime: null, estimatedDuration: null, lastUpdateTime: null },
      { program: 2, unlocked: false, unlockCost: UNLOCK_COSTS.breedingPrograms[2], active: false, lineage1Id: null, lineage2Id: null, progress: 0, startTime: null, estimatedDuration: null, lastUpdateTime: null }
    ],

    // Specimens (birds) - Start with 1 Common bird
    specimens: [
      {
        id: generateId('bird'),
        speciesName: 'Forest Sparrow',
        customDesignation: null,
        distinction: 1,
        biome: 'forest',
        traits: ['alacrity'],
        vitalityPercent: 100,
        isMature: false,
        cataloguedAt: Date.now(),
        location: 'collection',
        isLegendary: false,
        restoreCooldownUntil: 0
      }
    ],

    cataloguedSpecies: ['Forest Sparrow'],
    legendariesAcquired: [],

    // Narrative
    orientationComplete: false,
    narrativeBeatsShown: [],

    // Timestamps
    lastSaveTime: Date.now(),
    lastOpenTime: Date.now(),
    establishedAt: Date.now()
  };
}

export function initializeState() {
  const loaded = loadGame();

  if (loaded) {
    gameState = loaded;
    console.log('Game loaded from localStorage');
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
