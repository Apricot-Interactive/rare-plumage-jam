# SANCTUARY - Developer Build Guide

## Core Concept
Idle game: Manage aerial zeppelin sanctuary. Assign birds to forage/survey. Breed strategically using genetic inheritance to unlock 5 Legendary species. Exponential progression with prestige mechanic (Reorganization).

## Three Screens Flow
**WILDS (A)** → Foragers earn Seeds, Assistants complete surveys
**SANCTUARY (B)** → Care for birds on perches, provides global buffs
**HATCHERY (C)** → Breed birds using genetic square inheritance

## Currency: Seeds
- Foragers generate continuously (1-100/sec by ⭐ level)
- Manual tap on empty position: +10 instant
- Spend on: observations, positions, maturation (100)
- Auto-save every 5 seconds, localStorage only

## Wilds Screen

### Foragers (3 positions)
- Position 1: Free | Position 2: 500 Seeds | Position 3: 5,000 Seeds
- Generates Seeds/sec: ⭐=1, ⭐⭐=3, ⭐⭐⭐=10, ⭐⭐⭐⭐=30, ⭐⭐⭐⭐⭐=100
- Duration: ⭐=10min, ⭐⭐=1hr, ⭐⭐⭐=4hr, ⭐⭐⭐⭐=8hr, ⭐⭐⭐⭐⭐=24hr
- Vitality depletes 1%/min during work, stops at 0%

### Field Surveys (5 biomes)
- **Forest**: 10 Seeds/obs, +5% progress
- **Mountain**: 50 Seeds/obs, +3% progress
- **Coastal**: 400 Seeds/obs, +2% progress
- **Arid**: 5,000 Seeds/obs, +1% progress
- **Tundra**: 100,000 Seeds/obs, +0.5% progress

Assistant auto-observes at rate: ⭐=5sec, ⭐⭐=3sec, ⭐⭐⭐=2sec, ⭐⭐⭐⭐=1sec, ⭐⭐⭐⭐⭐=0.5sec
Pauses when Seeds < 100 (protection)

**Survey Completion (100%):**
1. New bird joins Sanctuary
2. Distinction = Assistant ⭐ ±1 (50% match, 30% +1, 20% -1)
3. 1 random trait from biome pool
4. Origin = biome
5. Progress resets to 0%

## Sanctuary Screen

### Perches (5 positions)
- Costs: Free, 500, 2,500, 15,000, 100,000 Seeds
- Only perched birds survive Reorganization
- Each bird provides Distinguished Guest buff (trait-based)

### Care Actions
**GROOM**: 1%/min vitality restore (automated)
- Manual interaction: +20% instant (cooldown = 1/10 groom duration)

**MATURE**: 100 Seeds → eligible for breeding

**LABEL**: Custom name (optional)

**CAPTURE**: 3-2-1 countdown, hide UI 2sec for screenshot

### Field Guide
Shows all catalogued species. 5 Legendary slots at top. Grid below organized by biome.

## Hatchery Screen

### Breeding Programs (3 slots)
- Program 1: Free | Program 2: 2,500 | Program 3: 25,000 Seeds
- Requires 2 mature birds
- Base duration: ⭐⭐=1min, ⭐⭐⭐=10min, ⭐⭐⭐⭐=1hr, ⭐⭐⭐⭐⭐=4hr
- Parents auto-contribute to incubation, player can manually assist

### Breeding Genetics

**Distinction Inheritance:**
```
Average parents (round up)
Distribution: 60% base, 30% +1, 10% -1
```

**Trait Inheritance (Genetic Square):**
```
Parent A: [Trait1, Trait2]
Parent B: [Trait3, Trait4]

        Trait3  Trait4
Trait1  1,3     1,4
Trait2  2,3     2,4

Offspring gets 2 traits (25% each combo)
```

Trait count by ⭐: ⭐⭐=1, ⭐⭐⭐=2, ⭐⭐⭐⭐=3, ⭐⭐⭐⭐⭐=3 (rare/epic bias)

**Biome**: 50/50 from parents

**Post-Hatch**: Parents lose mature status, start vitality restore

## The 10 Traits

### Common (60% field rate)
1. **Alacrity** - +10% Forager efficiency (Guest buff)
2. **Fortitude** - -15% Vitality depletion (Guest buff)
3. **Precision** - +15% Manual interaction (Guest buff)

### Uncommon (30% field rate)
4. **Fortune** - +10% Survey outcome improvement (Guest buff)
5. **Efficiency** - -10% Seed expenditure in Wilds (Guest buff)
6. **Constitution** - -20% Breeding restoration (Guest buff)

### Rare (8% field rate)
7. **Synchrony** - -25% Incubation duration (Guest buff)
8. **Acuity** - +15% Trait inheritance (Guest buff)

### Epic (2% field rate - REQUIRED FOR LEGENDARIES)
9. **Luminescence** - +50% to ALL buffs (multiplicative, Guest buff)
10. **Supremacy** - +10% Legendary breeding chance (Guest buff)

**Guest Buffs**: Perched birds provide facility-wide bonuses. Stack additively (3x Alacrity = +30%). Luminescence multiplies others.

## Reorganization (Prestige)

**Trigger**: Catalogue 15 species

**Resets:**
- Seeds → 100
- All survey progress → 0%
- All assignments cleared
- All non-perched birds removed

**Keeps:**
- Perched birds (3-5 based on unlocks)
- Position unlocks
- Previous Enhancements

**Gains:**
- New Enhancement (Forest→Mountain→Coastal→Arid→Tundra)
- Seeds multiplier: 1=2x, 2=4x, 3=8x, 4=16x, 5=32x
- Breeding bonuses: +10% Legendary chance, -10% incubation, +5% trait inheritance per Enhancement
- Sanctuary background changes to new territory

## The 5 Legendaries

**Requirements for EACH:**
1. Corresponding Enhancement (Forest, Mountain, Coastal, Arid, Tundra)
2. 2x ⭐⭐⭐⭐ Epic parents FROM THAT BIOME
3. One parent has **Luminescence**
4. Other parent has **Supremacy**
5. Probability: 10% per Enhancement (10%, 15%, 25%, 40%, 100%)

**Species & Lore:**
1. **Forest** - Greater Prairie-Chicken (*Tympanuchus cupido pinnatus*) - Lost to agriculture
2. **Mountain** - Ivory-billed Woodpecker (*Campephilus principalis*) - Last seen 1944, old-growth logging
3. **Coastal** - Caribbean Flamingo (*Phoenicopterus ruber*) - Pollution, habitat loss, sea level rise
4. **Arid** - Great Blue Heron (*Ardea herodias*) - Wetland degradation, agricultural runoff
5. **Tundra** - Emperor Penguin (*Aptenodytes forsteri*) - Sea ice collapse

**Completion Reveals**: World is post-apocalyptic (climate collapse, warfare). Sanctuary is flying between habitable zones. Birds exist "in brass-and-canvas cage because we eliminated their natural world."

## State Structure (localStorage)

```javascript
gameState = {
  version: 1,
  seeds: 100,
  totalSeedsEarned: 100,

  // Prestige
  enhancements: ['forest'], // max 5
  currentTerritory: 'forest',
  reorganizationCount: 1,

  // Wilds
  foragers: [
    { slot: 0, birdId: 'bird_001', vitalityPercent: 100, assignedAt: timestamp },
    { slot: 1, unlocked: false, unlockCost: 500 },
    { slot: 2, unlocked: false, unlockCost: 5000 }
  ],

  surveys: [
    { id: 'forest', progress: 45, assistantId: 'bird_002', observationCost: 10, lastObservationTime: timestamp },
    { id: 'mountain', progress: 0, assistantId: null, observationCost: 50 },
    // ... coastal, arid, tundra
  ],

  // Sanctuary
  perches: [
    { slot: 0, birdId: 'bird_003', unlocked: true, groomingStarted: timestamp, lastImmediateRestore: timestamp },
    { slot: 1, birdId: 'bird_004', unlocked: true },
    { slot: 2, birdId: null, unlocked: false, unlockCost: 2500 },
    // ... slots 3-4
  ],

  // Hatchery
  breedingPrograms: [
    { program: 0, unlocked: true, active: true, lineage1Id: 'bird_005', lineage2Id: 'bird_006',
      progress: 67, startTime: timestamp, estimatedCompletion: timestamp },
    { program: 1, unlocked: false, unlockCost: 2500 },
    { program: 2, unlocked: false, unlockCost: 25000 }
  ],

  // Collection
  specimens: [
    {
      id: 'bird_001',
      speciesName: 'Forest Sparrow',
      customDesignation: null,
      distinction: 1, // 1-5 stars
      biome: 'forest',
      traits: ['alacrity'],
      vitalityPercent: 100,
      isMature: false,
      cataloguedAt: timestamp,
      location: 'forager_0' // or 'assistant_forest', 'perch_1', 'program_0', 'collection'
    }
  ],

  cataloguedSpecies: ['forest_sparrow', 'mountain_robin'],
  legendariesAcquired: [], // max 5

  // Narrative
  orientationComplete: false,
  narrativeBeatsShown: ['welcome', 'first_groom'],

  // Timestamps
  lastSaveTime: Date.now(),
  lastOpenTime: Date.now(),
  establishedAt: timestamp
}
```

## Progression Timeline

**0-5min**: Tutorial (start with 100 Seeds, Forest at 80%, first bird arrives)
**5-15min**: First breeding (2 Commons → Uncommon)
**15-30min**: First Rare, unlock Forager 2 & Perch 2
**30-60min**: Multiple Rares, unlock Perch 3 & Program 2
**1-2hr**: First Epic → Reorganization available
**2hr**: REORGANIZATION 1 → Forest Enhancement, move to Mountain territory
**2-3hr**: Accelerated progression (2x Seeds), pursue Luminescence + Supremacy
**3-4hr**: First Legendary bred (reveals extinction lore)
**4-6hr**: Reorganizations 2-4, breed Legendaries 2-4
**6+hr**: Reorganization 5, final Legendary → Full revelation → "Continue?" (Enhanced mode)

## Narrative Beats (Administrator character)

1. **Welcome**: "Good day. Welcome to the Sanctuary."
2. **First Arrival**: "A specimen has arrived. Kindly attend to its needs."
3. **Grooming**: "Specimens require vitality for fieldwork."
4. **First Breeding**: "Two specimens have matured. The Hatchery awaits."
5. **First Rare**: "Rare specimens possess dual traits. Rather more useful."
6. **First Epic**: "Epic specimen. Three traits. Legendaries become possible."
7. **Reorganization Offer**: "Only perched specimens persist. All progress resets. However, you'll acquire Enhancement and +100% efficiency. Rather worth it."
8. **First Legendary**: [Reveals Greater Prairie-Chicken extinction history]
9. **Final Legendary**: [Full apocalyptic reveal, "documentation of loss"]
10. **Completion Stats**: Duration, Seeds, Specimens, Species, Reorganizations

## Technical Stack
- **Vanilla JavaScript** (no framework)
- **Vite** (build tool)
- **localStorage** (persistence only)
- **Auto-save** every 5 seconds
- **Deploy**: Netlify dev → itch.io submission

## Critical Functions to Implement

```javascript
// Core systems
saveGame()
loadGame()
calculateForagerIncome()
updateSurveyProgress()
discoverNewSpecimen(biome, assistantDistinction)

// Breeding
breedSpecimens(parent1, parent2)
geneticSquareInherit(parent1Traits, parent2Traits)
verifyLegendaryRequirements(parent1, parent2)

// Prestige
reorganizeFacility()
applyEnhancementMultipliers()

// Narrative
displayNarrativeBeat(beatId)
```

## Build Priority (6hr plan)

**Hour 1**: State, save/load, navigation, Seeds counter
**Hour 2**: Foragers (assign, income, vitality)
**Hour 3**: Surveys (observe, assistants, completion → new bird)
**Hour 4**: Sanctuary (perches, groom, mature) + Hatchery (select, commence)
**Hour 5**: Breeding logic (genetics, incubation) + Reorganization
**Hour 6**: Narrative beats, Field Guide, Legendary detection, polish

## Key Balance Numbers
- Start: 100 Seeds, Forest at 80%
- Maturation: 100 Seeds always
- First Reorganization: ~2 hours playtime (15 species)
- Legendary chance: 10/15/25/40/100% for 1/2/3/4/5 Enhancements
- Trait rarity: 60% Common, 30% Uncommon, 8% Rare, 2% Epic

## Win Condition
Breed all 5 Legendaries → Full narrative reveal → Option to continue with all 5 Enhancements (enhanced mode)
