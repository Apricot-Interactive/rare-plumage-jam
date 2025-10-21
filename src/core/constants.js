// SANCTUARY - Game Constants & Configuration

// === FORAGER SYSTEM ===
export const FORAGER_INCOME = {
  1: 1,      // ⭐ Common: 1 seed/sec
  2: 3,      // ⭐⭐ Uncommon: 3 seeds/sec
  3: 10,     // ⭐⭐⭐ Rare: 10 seeds/sec
  4: 30,     // ⭐⭐⭐⭐ Epic: 30 seeds/sec
  5: 100     // ⭐⭐⭐⭐⭐ Legendary: 100 seeds/sec
};

export const FORAGER_DURATION = {
  1: 10,     // ⭐ 10 minutes
  2: 60,     // ⭐⭐ 1 hour
  3: 240,    // ⭐⭐⭐ 4 hours
  4: 480,    // ⭐⭐⭐⭐ 8 hours
  5: 1440    // ⭐⭐⭐⭐⭐ 24 hours
};

export const MANUAL_TAP_SEEDS = 10; // Seeds earned per manual tap

// === SURVEY SYSTEM ===
export const BIOMES = [
  { id: 'forest', observationCost: 10, progressPerTap: 5 },
  { id: 'mountain', observationCost: 50, progressPerTap: 3 },
  { id: 'coastal', observationCost: 400, progressPerTap: 2 },
  { id: 'arid', observationCost: 5000, progressPerTap: 1 },
  { id: 'tundra', observationCost: 100000, progressPerTap: 0.5 }
];

export const ASSISTANT_TAP_RATE = {
  1: 0.2,    // ⭐ 1 tap per 5 seconds
  2: 0.333,  // ⭐⭐ 1 tap per 3 seconds
  3: 0.5,    // ⭐⭐⭐ 1 tap per 2 seconds
  4: 1.0,    // ⭐⭐⭐⭐ 1 tap per second
  5: 2.0     // ⭐⭐⭐⭐⭐ 2 taps per second
};

export const SURVEY_PROTECTION_THRESHOLD = 100; // Assistants pause when seeds < this

// === BREEDING SYSTEM ===
export const BREEDING_DURATION = {
  2: 1,      // ⭐⭐ 1 minute
  3: 10,     // ⭐⭐⭐ 10 minutes
  4: 60,     // ⭐⭐⭐⭐ 1 hour
  5: 240     // ⭐⭐⭐⭐⭐ 4 hours
};

// Distinction inheritance probabilities
export const DISTINCTION_INHERITANCE = {
  base: 0.60,    // 60% same as average
  plus: 0.30,    // 30% +1 star
  minus: 0.10    // 10% -1 star
};

// Trait count by distinction
export const TRAIT_COUNT = {
  1: 1,  // ⭐ Common: 1 trait
  2: 1,  // ⭐⭐ Uncommon: 1 trait
  3: 2,  // ⭐⭐⭐ Rare: 2 traits
  4: 3,  // ⭐⭐⭐⭐ Epic: 3 traits
  5: 3   // ⭐⭐⭐⭐⭐ Legendary: 3 traits
};

// === VITALITY SYSTEM ===
// Vitality drain rates by distinction (% per minute)
export const VITALITY_DRAIN_RATE = {
  1: 20,      // ⭐ 5 minutes to exhaust
  2: 3.33,    // ⭐⭐ 30 minutes to exhaust
  3: 0.833,   // ⭐⭐⭐ 2 hours to exhaust
  4: 0.208,   // ⭐⭐⭐⭐ 8 hours to exhaust
  5: 0.069    // ⭐⭐⭐⭐⭐ 24 hours to exhaust
};
export const VITALITY_RESTORE_RATE = 1.0; // 1% per minute while grooming
export const IMMEDIATE_RESTORE_AMOUNT = 20; // +20% instant restore
export const IMMEDIATE_RESTORE_COOLDOWN = 0.1; // Cooldown = 1/10th of groom time

// === UNLOCK COSTS ===
export const UNLOCK_COSTS = {
  foragers: [0, 500, 5000],
  perches: [0, 500, 2500, 15000, 100000],
  breedingPrograms: [0, 2500, 25000],
  maturation: 100
};

// === PRESTIGE SYSTEM ===
export const REORGANIZATION_SPECIES_THRESHOLD = 15;

export const ENHANCEMENT_MULTIPLIERS = {
  seeds_income: [1, 2, 4, 8, 16, 32],
  breeding_time_reduction: [0, 0.1, 0.2, 0.3, 0.4, 0.5],
  legendary_chance_boost: [0, 0.1, 0.15, 0.25, 0.4, 1.0],
  trait_inheritance_boost: [0, 0.05, 0.05, 0.05, 0.05, 0.05]
};

// Enhancement progression order
export const ENHANCEMENT_ORDER = ['forest', 'mountain', 'coastal', 'arid', 'tundra'];

// === OFFLINE PROGRESS ===
export const OFFLINE_CAP_HOURS = 24;

// === RARITY DEFINITIONS ===
export const RARITY = {
  1: { name: 'Common', stars: '⭐', color: '#888888' },
  2: { name: 'Uncommon', stars: '⭐⭐', color: '#4CAF50' },
  3: { name: 'Rare', stars: '⭐⭐⭐', color: '#2196F3' },
  4: { name: 'Epic', stars: '⭐⭐⭐⭐', color: '#9C27B0' },
  5: { name: 'Legendary', stars: '⭐⭐⭐⭐⭐', color: '#FFD700' }
};

// === TRAIT DEFINITIONS ===
export const TRAITS = {
  // Common (60% field rate)
  alacrity: {
    id: 'alacrity',
    name: 'Alacrity',
    rarity: 'common',
    guestBonus: { type: 'forager_efficiency', value: 0.10 },
    description: '+10% Forager efficiency'
  },
  fortitude: {
    id: 'fortitude',
    name: 'Fortitude',
    rarity: 'common',
    guestBonus: { type: 'vitality_drain_reduction', value: 0.15 },
    description: '-15% Vitality depletion'
  },
  precision: {
    id: 'precision',
    name: 'Precision',
    rarity: 'common',
    guestBonus: { type: 'manual_effectiveness', value: 0.15 },
    description: '+15% Manual interaction'
  },

  // Uncommon (30% field rate)
  fortune: {
    id: 'fortune',
    name: 'Fortune',
    rarity: 'uncommon',
    guestBonus: { type: 'survey_outcome_improvement', value: 0.10 },
    description: '+10% Survey outcome improvement'
  },
  efficiency: {
    id: 'efficiency',
    name: 'Efficiency',
    rarity: 'uncommon',
    guestBonus: { type: 'seed_cost_reduction', value: 0.10 },
    description: '-10% Seed expenditure'
  },
  constitution: {
    id: 'constitution',
    name: 'Constitution',
    rarity: 'uncommon',
    guestBonus: { type: 'breeding_cooldown_reduction', value: 0.20 },
    description: '-20% Breeding restoration'
  },

  // Rare (8% field rate)
  synchrony: {
    id: 'synchrony',
    name: 'Synchrony',
    rarity: 'rare',
    guestBonus: { type: 'incubation_speed', value: 0.25 },
    description: '-25% Incubation duration'
  },
  acuity: {
    id: 'acuity',
    name: 'Acuity',
    rarity: 'rare',
    guestBonus: { type: 'trait_inheritance_success', value: 0.15 },
    description: '+15% Trait inheritance'
  },

  // Epic (2% field rate - REQUIRED FOR LEGENDARIES)
  luminescence: {
    id: 'luminescence',
    name: 'Luminescence',
    rarity: 'epic',
    guestBonus: { type: 'all_bonuses_multiplier', value: 0.50 },
    description: '+50% to ALL buffs (multiplicative)'
  },
  supremacy: {
    id: 'supremacy',
    name: 'Supremacy',
    rarity: 'epic',
    guestBonus: { type: 'legendary_breeding_chance', value: 0.10 },
    description: '+10% Legendary breeding chance'
  }
};

// Trait assignment weights by distinction (for field surveys)
export const TRAIT_WEIGHTS_BY_DISTINCTION = {
  1: { common: 1.0, uncommon: 0, rare: 0, epic: 0 },
  2: { common: 0.7, uncommon: 0.3, rare: 0, epic: 0 },
  3: { common: 0.4, uncommon: 0.4, rare: 0.2, epic: 0 },
  4: { common: 0.2, uncommon: 0.3, rare: 0.4, epic: 0.1 },
  5: { common: 0.1, uncommon: 0.2, rare: 0.5, epic: 0.2 }
};

// Get trait IDs by rarity for random selection
export const TRAITS_BY_RARITY = {
  common: ['alacrity', 'fortitude', 'precision'],
  uncommon: ['fortune', 'efficiency', 'constitution'],
  rare: ['synchrony', 'acuity'],
  epic: ['luminescence', 'supremacy']
};

// === LEGENDARY SPECIES ===
export const LEGENDARIES = {
  forest: {
    id: 'greater_prairie_chicken',
    speciesName: 'Greater Prairie-Chicken',
    scientificName: 'Tympanuchus cupido pinnatus',
    biome: 'forest',
    requiredTraits: ['luminescence', 'supremacy'],
    lore: 'Once numbered in the millions across the North American prairie. Lost to agricultural expansion and habitat fragmentation. Last viable populations extinct by 2087.'
  },
  mountain: {
    id: 'ivory_billed_woodpecker',
    speciesName: 'Ivory-billed Woodpecker',
    scientificName: 'Campephilus principalis',
    biome: 'mountain',
    requiredTraits: ['luminescence', 'supremacy'],
    lore: 'Last confirmed sighting: 1944, Louisiana. Old-growth forest logging eliminated habitat. Declared extinct 2091 after final search efforts failed.'
  },
  coastal: {
    id: 'caribbean_flamingo',
    speciesName: 'Caribbean Flamingo',
    scientificName: 'Phoenicopterus ruber',
    biome: 'coastal',
    requiredTraits: ['luminescence', 'supremacy'],
    lore: 'Coastal habitat destruction, rising sea levels, and pollution eliminated breeding grounds. Last wild population collapsed 2095.'
  },
  arid: {
    id: 'great_blue_heron',
    speciesName: 'Great Blue Heron',
    scientificName: 'Ardea herodias',
    biome: 'arid',
    requiredTraits: ['luminescence', 'supremacy'],
    lore: 'Wetland degradation and agricultural runoff destroyed feeding grounds. Final refuge habitats lost to drought cycles by 2098.'
  },
  tundra: {
    id: 'emperor_penguin',
    speciesName: 'Emperor Penguin',
    scientificName: 'Aptenodytes forsteri',
    biome: 'tundra',
    requiredTraits: ['luminescence', 'supremacy'],
    lore: 'Antarctic sea ice collapse eliminated breeding platforms. Last colony observed 2102. Extinction confirmed 2105.'
  }
};

// === GAME SETTINGS ===
export const GAME_CONFIG = {
  AUTO_SAVE_INTERVAL: 5000,        // 5 seconds
  GAME_LOOP_FPS: 60,               // Game logic updates
  UI_LOOP_FPS: 10,                 // UI display updates
  STARTING_SEEDS: 100,
  STARTING_SURVEY_PROGRESS: 80,    // Forest starts at 80% for tutorial
  VERSION: 1
};

// === UI SETTINGS ===
export const UI_CONFIG = {
  SCREEN_TRANSITION_MS: 300,
  MODAL_FADE_MS: 200,
  SCREENSHOT_COUNTDOWN: 3,
  SCREENSHOT_HIDE_UI_MS: 2000
};

// === STORAGE KEYS ===
export const STORAGE_KEYS = {
  GAME_STATE: 'rare_plumage_save',
  SETTINGS: 'rare_plumage_settings'
};

// === NARRATIVE BEAT IDS ===
export const NARRATIVE_BEATS = {
  WELCOME: 'welcome',
  FIRST_ARRIVAL: 'first_arrival',
  FIRST_GROOM: 'first_groom',
  FIRST_BREEDING: 'first_breeding',
  FIRST_RARE: 'first_rare',
  FIRST_EPIC: 'first_epic',
  REORGANIZATION_OFFER: 'reorganization_offer',
  LEGENDARY_FOREST: 'legendary_forest',
  LEGENDARY_MOUNTAIN: 'legendary_mountain',
  LEGENDARY_COASTAL: 'legendary_coastal',
  LEGENDARY_ARID: 'legendary_arid',
  LEGENDARY_TUNDRA: 'legendary_tundra',
  FINAL_REVEAL: 'final_reveal',
  COMPLETION: 'completion'
};
