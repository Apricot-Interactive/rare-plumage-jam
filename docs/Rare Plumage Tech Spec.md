# SANCTUARY - Technical Specification

## Tech Stack
- **Vanilla JavaScript** (no frameworks)
- **Vite** (dev server + build)
- **localStorage** only (no backend)
- **Mobile-first** (375x812px viewport)
- **Deploy**: GitHub → Netlify auto-deploy

## File Structure
```
rare-plumage/
├── index.html
├── package.json
├── vite.config.js
├── src/
│   ├── main.js                 # Entry point
│   ├── styles.css              # Mobile-first CSS
│   ├── core/
│   │   ├── state.js            # Game state + save/load
│   │   ├── gameLoop.js         # 60fps update loop
│   │   └── constants.js        # All game config
│   ├── systems/
│   │   ├── foragers.js         # Forager income
│   │   ├── surveys.js          # Survey progress
│   │   ├── breeding.js         # Breeding genetics
│   │   ├── offline.js          # Offline progress
│   │   └── prestige.js         # Reorganization
│   ├── ui/
│   │   ├── navigation.js       # Screen switching
│   │   ├── modals.js           # Popups
│   │   ├── wilds.js            # Wilds UI updates
│   │   ├── sanctuary.js        # Sanctuary UI
│   │   └── hatchery.js         # Hatchery UI
│   ├── data/
│   │   ├── traits.js           # 10 trait definitions
│   │   ├── legendaries.js      # 5 legendary species
│   │   ├── species.js          # Procedural name generator
│   │   └── narrative.js        # Story text
│   └── utils/
│       ├── time.js             # Time formatting
│       ├── numbers.js          # Number formatting (1.5K)
│       └── random.js           # Seeded RNG
└── public/assets/
    ├── birds/                  # Bird sprites by rarity
    ├── biomes/                 # Biome icons
    └── ui/                     # UI elements
```

## Game State Object
```javascript
gameState = {
  version: 1,
  seeds: 100,
  totalSeedsEarned: 100,

  // Prestige
  enhancements: [],           // ['forest', 'mountain', 'coastal', 'arid', 'tundra']
  currentTerritory: 'forest',
  reorganizationCount: 0,

  // Foragers (3 slots)
  foragers: [
    {
      slot: 0,
      birdId: null,           // Reference to specimens[]
      unlocked: true,
      unlockCost: 0,
      assignedAt: null,       // Timestamp
      accumulatedSeeds: 0
    }
    // ... slots 1-2
  ],

  // Surveys (5 biomes)
  surveys: [
    {
      id: 'forest',
      biome: 'forest',
      progress: 0,            // 0-100
      assistantId: null,
      observationCost: 10,
      lastUpdateTime: null,
      progressPerTap: 5
    }
    // ... mountain, coastal, arid, tundra
  ],

  // Perches (5 slots)
  perches: [
    {
      slot: 0,
      birdId: null,
      unlocked: true,
      unlockCost: 0,
      groomingStartedAt: null,
      lastImmediateRestoreAt: null
    }
    // ... slots 1-4
  ],

  // Breeding Programs (3 slots)
  breedingPrograms: [
    {
      program: 0,
      unlocked: true,
      unlockCost: 0,
      active: false,
      lineage1Id: null,
      lineage2Id: null,
      progress: 0,            // 0-100
      startTime: null,
      estimatedDuration: null, // Milliseconds
      lastUpdateTime: null
    }
    // ... programs 1-2
  ],

  // Specimens (birds)
  specimens: [
    {
      id: 'bird_001',              // Unique ID
      speciesName: 'Forest Sparrow',
      customDesignation: null,     // Player name
      distinction: 1,              // 1-5 (rarity)
      biome: 'forest',
      traits: ['alacrity'],        // Array of trait IDs
      vitalityPercent: 100,        // 0-100
      isMature: false,             // Breeding eligible
      cataloguedAt: timestamp,
      location: 'collection',      // 'forager_0', 'assistant_forest', 'perch_1', 'program_0', 'collection'
      isLegendary: false
    }
  ],

  cataloguedSpecies: [],         // Array of species names
  legendariesAcquired: [],       // Array of legendary IDs

  // Narrative
  orientationComplete: false,
  narrativeBeatsShown: [],       // Array of beat IDs

  // Timestamps
  lastSaveTime: Date.now(),
  lastOpenTime: Date.now(),
  establishedAt: Date.now()
}
```

## Constants & Balance

```javascript
// Forager income (Seeds/sec by distinction)
FORAGER_INCOME = { 1: 1, 2: 3, 3: 10, 4: 30, 5: 100 }

// Forager duration (minutes)
FORAGER_DURATION = { 1: 10, 2: 60, 3: 240, 4: 480, 5: 1440 }

// Assistant tap rate (taps/sec)
ASSISTANT_TAP_RATE = { 1: 0.2, 2: 0.333, 3: 0.5, 4: 1.0, 5: 2.0 }

// Breeding duration (minutes)
BREEDING_DURATION = { 2: 1, 3: 10, 4: 60, 5: 240 }

// Vitality drain
VITALITY_DRAIN_RATE = 1.0  // 1%/min

// Immediate restore cooldown
IMMEDIATE_RESTORE_COOLDOWN = 0.1  // 1/10th of groom time

// Reorganization threshold
REORGANIZATION_SPECIES_THRESHOLD = 15

// Enhancement multipliers (index = number of enhancements 0-5)
ENHANCEMENT_MULTIPLIERS = {
  seeds_income: [1, 2, 4, 8, 16, 32],
  breeding_time_reduction: [0, 0.1, 0.2, 0.3, 0.4, 0.5],
  legendary_chance_boost: [0, 0.1, 0.15, 0.25, 0.4, 1.0]
}

// Offline cap
OFFLINE_CAP_HOURS = 24

// Unlock costs
UNLOCK_COSTS = {
  foragers: [0, 500, 5000],
  perches: [0, 500, 2500, 15000, 100000],
  breedingPrograms: [0, 2500, 25000],
  maturation: 100
}

// Biome configs
BIOMES = [
  { id: 'forest', observationCost: 10, progressPerTap: 5 },
  { id: 'mountain', observationCost: 50, progressPerTap: 3 },
  { id: 'coastal', observationCost: 400, progressPerTap: 2 },
  { id: 'arid', observationCost: 5000, progressPerTap: 1 },
  { id: 'tundra', observationCost: 100000, progressPerTap: 0.5 }
]

// Rarity configs
RARITY = {
  1: { name: 'Common', stars: '⭐', traitCount: 1 },
  2: { name: 'Uncommon', stars: '⭐⭐', traitCount: 1 },
  3: { name: 'Rare', stars: '⭐⭐⭐', traitCount: 2 },
  4: { name: 'Epic', stars: '⭐⭐⭐⭐', traitCount: 3 },
  5: { name: 'Legendary', stars: '⭐⭐⭐⭐⭐', traitCount: 3 }
}
```

## Trait Definitions

```javascript
TRAITS = {
  // Common (60% field rate)
  alacrity: { rarity: 'common', guestBonus: { type: 'forager_efficiency', value: 0.10 } },
  fortitude: { rarity: 'common', guestBonus: { type: 'vitality_drain_reduction', value: 0.15 } },
  precision: { rarity: 'common', guestBonus: { type: 'manual_effectiveness', value: 0.15 } },

  // Uncommon (30% field rate)
  fortune: { rarity: 'uncommon', guestBonus: { type: 'survey_outcome_improvement', value: 0.10 } },
  efficiency: { rarity: 'uncommon', guestBonus: { type: 'seed_cost_reduction', value: 0.10 } },
  constitution: { rarity: 'uncommon', guestBonus: { type: 'breeding_cooldown_reduction', value: 0.20 } },

  // Rare (8% field rate)
  synchrony: { rarity: 'rare', guestBonus: { type: 'incubation_speed', value: 0.25 } },
  acuity: { rarity: 'rare', guestBonus: { type: 'trait_inheritance_success', value: 0.15 } },

  // Epic (2% field rate - REQUIRED FOR LEGENDARIES)
  luminescence: { rarity: 'epic', guestBonus: { type: 'all_bonuses_multiplier', value: 0.50 } },
  supremacy: { rarity: 'epic', guestBonus: { type: 'legendary_breeding_chance', value: 0.10 } }
}
```

## Trait Assignment by Distinction (Field Surveys)

```javascript
TRAIT_WEIGHTS_BY_DISTINCTION = {
  1: { common: 1.0, uncommon: 0, rare: 0, epic: 0 },
  2: { common: 0.7, uncommon: 0.3, rare: 0, epic: 0 },
  3: { common: 0.4, uncommon: 0.4, rare: 0.2, epic: 0 },
  4: { common: 0.2, uncommon: 0.3, rare: 0.4, epic: 0.1 },
  5: { common: 0.1, uncommon: 0.2, rare: 0.5, epic: 0.2 }
}
```

## Core System Functions

### Save/Load
```javascript
saveGame()                    // localStorage, JSON.stringify, 5sec auto-save
loadGame()                    // localStorage, JSON.parse, version check
initializeState()             // Load or create default state
```

### Foragers
```javascript
calculateForagerIncome()      // Returns Seeds/sec from all active foragers
updateForagerVitality(dt)     // Drain vitality based on deltaTime
assignForager(slot, birdId)   // Assign bird to forager slot
unassignForager(slot)         // Remove bird from slot
tapForagerSlot(slot)          // Manual tap for +10 Seeds (affected by bonuses)
unlockForagerSlot(slot)       // Spend Seeds to unlock slot
```

### Surveys
```javascript
updateSurveyProgress(dt)      // Auto-progress with assigned assistants
observeSurvey(biomeId)        // Manual observation (spend Seeds, +progress)
completeSurvey(biomeId)       // At 100%, generate new bird
assignAssistant(biomeId, birdId)
unassignAssistant(biomeId)
```

### Breeding
```javascript
startBreeding(parent1, parent2, programSlot)
updateBreedingProgress(dt)
completeBreeding(programSlot)
calculateOffspring(parent1, parent2)  // Returns new specimen with genetics

// Genetic inheritance logic:
// Distinction: avg(parents) rounded up, then 60% base, 30% +1, 10% -1
// Traits: Genetic square (each parent contributes 1 random trait)
// Biome: 50/50 from parents
// Trait count: Based on offspring distinction (1/1/2/3/3)
```

### Sanctuary
```javascript
assignPerch(slot, birdId)
unassignPerch(slot)
startGrooming(birdId)         // 1%/min auto-restore
immediateRestore(birdId)      // +20% instant (cooldown applies)
matureBird(birdId)            // 100 Seeds, sets isMature=true
calculateDistinguishedGuestBonuses()  // Returns bonus object from perched birds
```

### Offline Progress
```javascript
calculateOfflineProgress()    // Called on game start
// Calculates:
// - Forager income (capped by vitality)
// - Survey completions (capped by Seeds)
// - Breeding completions
// - Vitality drain
// Returns summary object
```

### Prestige
```javascript
canReorganize()               // Check if 15 species catalogued
reorganizeFacility()          // Reset logic, preserve perched birds
// Resets: Seeds→100, surveys→0%, assignments cleared, non-perched birds removed
// Keeps: Perched birds, unlocks, previous enhancements
// Gains: New enhancement, multipliers
```

### Species Generation
```javascript
generateSpeciesName(biome, distinction, traits)
// Format: "{BiomePrefix} {TraitAdjective?} {BirdType}"
// Example: "Forest Swift Sparrow", "Mountain Owl"

generateRandomTrait(distinction)
// Returns trait ID weighted by distinction

createSpecimen(biome, distinction, traits, isLegendary)
// Returns new specimen object with unique ID
```

## Game Loop Structure

```javascript
// main.js entry point
function init() {
  initializeState()
  calculateOfflineProgress()  // If returning player
  enableAutoSave()            // 5sec interval
  startGameLoop()             // 60fps
  startUILoop()               // 10fps UI updates
  initNavigation()
  loadScreen('wilds')
}

function gameLoop(deltaTime) {
  // Update systems
  updateForagerVitality(deltaTime)
  updateSurveyProgress(deltaTime)
  updateBreedingProgress(deltaTime)

  // Accumulate seeds
  const income = calculateForagerIncome()
  gameState.seeds += income * (deltaTime / 1000)
}

function uiLoop() {
  // Update all displays
  updateWildsUI()
  updateSanctuaryUI()
  updateHatcheryUI()
}
```

## UI Update Intervals
- **Game loop**: 60fps (16ms) - physics/income calculation
- **UI loop**: 10fps (100ms) - display updates only
- **Auto-save**: 5 seconds

## Screen Navigation
Three screens: **Wilds** ↔ **Sanctuary** ↔ **Hatchery**
- Toggle between screens with fade transitions (300ms)
- Persistent Seeds counter at top
- Navigation buttons at bottom

## Legendary Breeding Requirements
Each legendary requires:
1. Corresponding Enhancement (forest/mountain/coastal/arid/tundra)
2. 2x Epic (⭐⭐⭐⭐) parents from THAT biome
3. One parent has **Luminescence** trait
4. Other parent has **Supremacy** trait
5. Probability roll (10% base * enhancements owned)

## Legendary Species Data
```javascript
LEGENDARIES = {
  forest: {
    id: 'greater_prairie_chicken',
    speciesName: 'Greater Prairie-Chicken',
    scientificName: 'Tympanuchus cupido pinnatus',
    requiredTraits: ['luminescence', 'supremacy']
  },
  mountain: {
    id: 'ivory_billed_woodpecker',
    speciesName: 'Ivory-billed Woodpecker',
    scientificName: 'Campephilus principalis',
    requiredTraits: ['luminescence', 'supremacy']
  },
  coastal: {
    id: 'caribbean_flamingo',
    speciesName: 'Caribbean Flamingo',
    scientificName: 'Phoenicopterus ruber',
    requiredTraits: ['luminescence', 'supremacy']
  },
  arid: {
    id: 'great_blue_heron',
    speciesName: 'Great Blue Heron',
    scientificName: 'Ardea herodias',
    requiredTraits: ['luminescence', 'supremacy']
  },
  tundra: {
    id: 'emperor_penguin',
    speciesName: 'Emperor Penguin',
    scientificName: 'Aptenodytes forsteri',
    requiredTraits: ['luminescence', 'supremacy']
  }
}
```

## Modal/Tutorial System
```javascript
// Narrative beats (triggered once each)
showNarrativeBeat(beatId, text)
// Displays modal with Administrator character quote
// Beats: 'welcome', 'first_arrival', 'first_groom', 'first_breeding',
//        'first_rare', 'first_epic', 'reorganization_offer',
//        'legendary_{biome}', 'completion'
```

## Number Formatting
```javascript
formatNumber(n)
// < 10,000: "1,234"
// >= 10,000: "12.5K"
// >= 1,000,000: "2.3M"
// >= 1,000,000,000: "1.2B"

formatTime(minutes)
// < 60: "5m"
// >= 60: "2h 15m"
// >= 1440: "1d 4h"
```

## localStorage Keys
```javascript
STORAGE_KEYS = {
  GAME_STATE: 'rare_plumage_save',
  SETTINGS: 'rare_plumage_settings'
}
```

## Development Workflow
```bash
# Start dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Deploy (auto via Netlify on git push)
git add .
git commit -m "Feature description"
git push
```

## 6-Hour Build Plan

**Hour 1**: State system, save/load, constants, basic HTML structure
**Hour 2**: Foragers (assign, income, vitality, UI)
**Hour 3**: Surveys (observe, assistants, completion → spawn bird, UI)
**Hour 4**: Sanctuary (perches, groom, mature, UI) + Hatchery (select, start, UI)
**Hour 5**: Breeding (genetics, incubation, completion) + Reorganization
**Hour 6**: Narrative beats, Field Guide, Legendary detection, polish, deploy

## Critical Implementation Notes

1. **Genetic Square**: Each parent contributes 1 random trait → 4 possible combinations (25% each)
2. **Offline Progress**: Calculate exact elapsed time, apply caps, update state
3. **Distinguished Guest Bonuses**: Sum all perched birds' trait bonuses, Luminescence multiplies others
4. **Vitality System**: 1%/min drain during work, 1%/min restore during groom
5. **Auto-save**: Every 5 seconds, localStorage only
6. **Survey Protection**: Assistants pause when Seeds < 100
7. **Enhancement Multipliers**: Stack multiplicatively on income/breeding
8. **Legendary Check**: On breeding completion, verify all 5 requirements before rolling

## Testing Checklist
- [ ] Save/load preserves full state
- [ ] Offline progress calculates correctly (test 1min, 1hr, 24hr)
- [ ] Foragers earn Seeds and drain vitality
- [ ] Surveys complete and spawn correct birds
- [ ] Breeding genetics work (test genetic square outcomes)
- [ ] Reorganization preserves perched birds only
- [ ] Legendary breeding requires all 5 conditions
- [ ] Guest bonuses apply correctly
- [ ] UI updates reflect state changes
- [ ] Mobile viewport works (375x812px)
