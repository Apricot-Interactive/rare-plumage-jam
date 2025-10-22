// SANCTUARY - Game Constants & Configuration

// === FORAGER SYSTEM ===
// Base forager rates by biome and slot (seeds/second)
export const FORAGER_BASE_RATES = {
  forest: [0.5, 1, 2],      // Slot 0, Slot 1, Slot 2
  mountain: [2, 4, 8],
  coastal: [6, 12, 25],
  arid: [20, 40, 80],
  tundra: [62.5, 125, 250]
};

// Energy capacity by star level (in seconds)
export const ENERGY_CAPACITY = {
  1: 120,      // ⭐ Common: 120 seconds (2 minutes)
  2: 600,      // ⭐⭐ Uncommon: 600 seconds (10 minutes)
  3: 1800,     // ⭐⭐⭐ Rare: 1800 seconds (30 minutes)
  4: 7200,     // ⭐⭐⭐⭐ Epic: 7200 seconds (2 hours)
  5: 28800     // ⭐⭐⭐⭐⭐ Legendary: 28800 seconds (8 hours)
};

// Legacy - kept for backward compatibility but no longer used
export const FORAGER_INCOME = {
  1: 1,
  2: 3,
  3: 10,
  4: 30,
  5: 100
};

export const FORAGER_DURATION = {
  1: 10,
  2: 60,
  3: 240,
  4: 480,
  5: 1440
};

export const MANUAL_TAP_SEEDS = 10; // Seeds earned per manual tap (legacy)

// === BIOME SYSTEM ===
export const BIOMES = [
  {
    id: 'forest',
    name: 'Forest',
    unlockRequirement: 1 // ⭐ (always unlocked)
  },
  {
    id: 'mountain',
    name: 'Mountain',
    unlockRequirement: 2 // ⭐⭐
  },
  {
    id: 'coastal',
    name: 'Coastal',
    unlockRequirement: 3 // ⭐⭐⭐
  },
  {
    id: 'arid',
    name: 'Arid',
    unlockRequirement: 4 // ⭐⭐⭐⭐
  },
  {
    id: 'tundra',
    name: 'Tundra',
    unlockRequirement: 5 // ⭐⭐⭐⭐⭐
  }
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
// Energy drain: 1 energy per second while foraging/surveying
// Vitality is percentage of total energy capacity
export const ENERGY_DRAIN_PER_SECOND = 1;

// Vitality restore: Full recovery over 5 minutes (300 seconds)
export const VITALITY_RESTORE_TIME_SECONDS = 300; // 5 minutes to go from 0% to 100%

// Manual restore (brush): Each tap speeds up recovery by 1%
export const MANUAL_RESTORE_PERCENT_PER_TAP = 1; // +1% per brush tap

// Legacy vitality drain rates (% per minute) - kept for backward compatibility
export const VITALITY_DRAIN_RATE = {
  1: 20,
  2: 3.33,
  3: 0.833,
  4: 0.208,
  5: 0.069
};
export const VITALITY_RESTORE_RATE = 1.0;
export const IMMEDIATE_RESTORE_AMOUNT = 20;
export const IMMEDIATE_RESTORE_COOLDOWN = 0.1;

// === UNLOCK COSTS ===
export const UNLOCK_COSTS = {
  // Per-biome forager slot unlock costs
  biomeForagers: {
    forest: [0, 100, 2500],
    mountain: [0, 5000, 15000],
    coastal: [0, 40000, 125000],
    arid: [0, 300000, 500000],
    tundra: [0, 1500000, 4000000]
  },
  // Seed costs to unlock biomes (in addition to star requirement)
  biomeUnlock: {
    forest: 0,
    mountain: 4000,
    coastal: 30000,
    arid: 200000,
    tundra: 800000
  },
  perches: [0, 500, 2500, 15000, 100000],
  breedingPrograms: [0, 2500, 25000]
};

// Maturation costs by star level (total seeds to reach maturity)
export const MATURITY_COSTS = {
  1: 100,      // ⭐ Common
  2: 1000,     // ⭐⭐ Uncommon
  3: 5000,     // ⭐⭐⭐ Rare
  4: 50000,    // ⭐⭐⭐⭐ Epic
  5: 200000    // ⭐⭐⭐⭐⭐ Legendary
};

// Survey costs (total seeds required to complete survey)
export const SURVEY_COSTS = {
  forest: 360,
  mountain: 7200,
  coastal: 67500,
  arid: 864000,
  tundra: 10800000
};

// === PRESTIGE SYSTEM (Crystal-based) ===
// Crystal unlock order (1 per prestige)
export const PRESTIGE_BIOME_ORDER = ['forest', 'mountain', 'coastal', 'arid', 'tundra'];

// Base chance for legendary breeding (10%)
export const LEGENDARY_BREEDING_BASE_CHANCE = 0.10;

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
  VERSION: 2  // Incremented for biome refactor
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
