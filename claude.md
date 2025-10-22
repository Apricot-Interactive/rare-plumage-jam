# SANCTUARY - 6-Hour Game Jam Build Plan

## COMPLETED STAGES

**Stages 0-5 are complete!**

- ✅ **Stage 0**: Foundation - Project structure, constants, navigation
- ✅ **Stage 1**: Core Loop - Foragers, save/load, income system
- ✅ **Stage 2**: Vitality & Surveys - Vitality drain, survey system, species generation
- ✅ **Stage 3**: Sanctuary & Perches - Grooming, maturation, distinguished guest bonuses
- ✅ **Stage 4**: Breeding & Genetics - Genetic inheritance, breeding programs
- ✅ **Stage 5**: Prestige & Offline Progress - Crystal-based prestige, offline calculation

**Current Status**: Ready for Stage 6 (Legendaries & Polish)

---

## Critical Success Factors
- **Playable at every stage** - Each stage produces runnable software
- **Systems integrate early** - Foraging → Breeding → Prestige flow works ASAP
- **Art unblocked immediately** - Complete art manifest in Stage 0
- **No blocked dependencies** - Parallel work when possible

---

## ART MANIFEST - PRIORITY 1 (Send to art team immediately)

### Required Assets

#### Bird Sprites (5 variations by rarity)
**Format**: PNG, transparent background, 128x128px canvas
**Style**: Minimalist, pixel art or simple vector silhouettes
**Color coding by rarity**:
- ⭐ Common: Gray (#888888)
- ⭐⭐ Uncommon: Green (#4CAF50)
- ⭐⭐⭐ Rare: Blue (#2196F3)
- ⭐⭐⭐⭐ Epic: Purple (#9C27B0)
- ⭐⭐⭐⭐⭐ Legendary: Gold (#FFD700)

**Files needed**:
- `bird-1star.png` - Simple sparrow silhouette
- `bird-2star.png` - Robin/songbird silhouette
- `bird-3star.png` - Hawk/owl silhouette
- `bird-4star.png` - Crane/heron silhouette
- `bird-5star.png` - Elaborate peacock/phoenix silhouette

**Legendary portraits** (OPTIONAL - can use 5star sprite):
- `legendary-prairie-chicken.png`
- `legendary-woodpecker.png`
- `legendary-flamingo.png`
- `legendary-heron.png`
- `legendary-penguin.png`

#### Biome Icons (5 environments)
**Format**: PNG, 64x64px, simple icons for survey buttons
- `biome-forest.png` - Tree icon
- `biome-mountain.png` - Mountain peak
- `biome-coastal.png` - Wave/shore
- `biome-arid.png` - Cactus/desert
- `biome-tundra.png` - Snowflake/ice

#### UI Elements
**Format**: PNG, various sizes
- `slot-empty.png` - 128x128px empty position indicator (dashed border)
- `slot-locked.png` - 128x128px padlock icon overlay
- `seeds-icon.png` - 32x32px seed/currency icon
- `vitality-bar-fill.png` - 100x8px green gradient
- `vitality-bar-bg.png` - 100x8px gray background
- `progress-bar-fill.png` - 200x12px blue gradient
- `progress-bar-bg.png` - 200x12px light gray

#### Background Images (OPTIONAL - can use solid colors)
**Format**: JPG or PNG, 375x812px (mobile viewport)
- `bg-wilds.jpg` - Sky/clouds view from zeppelin
- `bg-sanctuary.jpg` - Interior wooden deck with perches
- `bg-hatchery.jpg` - Warm interior with nests

**Fallback if no backgrounds**: Use CSS gradients
- Wilds: Sky blue gradient
- Sanctuary: Warm brown/wood gradient
- Hatchery: Soft orange/amber gradient

#### Typography
**Fonts** (from Google Fonts or web-safe):
- **Headers**: `Cinzel` or `Georgia` (formal, administrative)
- **Body**: `Roboto` or `Arial` (clean, readable)
- **Numbers**: `Roboto Mono` or `Courier New` (monospace for stats)

### Asset Delivery Priority
**MUST HAVE** (Stage 1):
- 5 bird sprites by rarity
- Empty/locked slot indicators
- Seeds icon

**NICE TO HAVE** (Stage 3+):
- Biome icons
- Progress bars
- Backgrounds

**POLISH ONLY** (Stage 6):
- Legendary portraits
- Animations
- Particle effects

---

## STAGE 0: Foundation (30 minutes)

### Goal
Repository setup, build system verified, art manifest sent

### Tasks
1. **Verify Vite setup** - Confirm dev server runs
2. **Create file structure** - All directories and stub files
3. **Define constants** - `src/core/constants.js` with all game config
4. **Basic HTML skeleton** - Three screen containers, navigation
5. **CSS foundation** - Mobile viewport, basic layout, typography
6. **Send art manifest** - Unblock art team immediately

### Deliverable
```bash
npm run dev
```
Opens browser to http://localhost:5173 showing:
- Three nav buttons (Wilds, Sanctuary, Hatchery)
- "SANCTUARY" title
- Seeds counter showing "100"
- Empty screen containers

### Files Created
```
src/
├── main.js (entry point)
├── styles.css (mobile-first)
├── core/
│   ├── constants.js (all game config)
│   └── state.js (state object structure)
├── data/
│   ├── traits.js (10 trait definitions)
│   ├── legendaries.js (5 legendary configs)
│   └── narrative.js (story text)
└── utils/
    ├── numbers.js (formatNumber, formatTime)
    └── random.js (RNG helpers)
```

### Testing
- ✅ Dev server runs without errors
- ✅ Three nav buttons visible
- ✅ Seeds counter displays
- ✅ Mobile viewport (375x812px) renders correctly

---

## STAGE 1: Core Loop - Seeds & Save/Load (45 minutes)

### Goal
Complete game state management, persistence, and basic income loop

### Tasks
1. **State system** - `src/core/state.js` with full gameState object
2. **Save/load** - localStorage persistence, 5-second auto-save
3. **Game loop** - 60fps update loop in `src/core/gameLoop.js`
4. **Forager income** - Calculate Seeds/sec from assigned foragers
5. **Forager UI** - Display 3 forager slots, assign/unassign birds
6. **Manual tap** - Click empty forager slot for +10 Seeds
7. **First specimen** - Start game with 1 Common bird in collection

### Deliverable
Playable idle game loop:
- Assign starter bird to Forager slot 1
- Seeds increase automatically
- Manual tap empty slot for +10 Seeds
- Close game, reopen → progress saved

### Files Implemented
```
src/
├── core/
│   ├── state.js (COMPLETE)
│   ├── gameLoop.js (COMPLETE)
│   └── constants.js (updated)
├── systems/
│   └── foragers.js (income calculation)
└── ui/
    ├── navigation.js (screen switching)
    └── wilds.js (forager UI)
```

### State Shape
```javascript
gameState = {
  seeds: 100,
  specimens: [{
    id: 'bird_001',
    speciesName: 'Forest Sparrow',
    distinction: 1,
    biome: 'forest',
    traits: ['alacrity'],
    vitalityPercent: 100,
    isMature: false,
    location: 'collection'
  }],
  foragers: [
    { slot: 0, birdId: null, unlocked: true },
    { slot: 1, birdId: null, unlocked: false, unlockCost: 500 },
    { slot: 2, birdId: null, unlocked: false, unlockCost: 5000 }
  ]
}
```

### Testing
- ✅ Assign bird → Seeds increase
- ✅ Seeds/sec displays correctly (1/sec for Common)
- ✅ Manual tap → +10 Seeds
- ✅ Save/load preserves state
- ✅ Auto-save every 5 seconds

---

## STAGE 2: Vitality & Surveys (60 minutes)

### Goal
Complete Wilds screen with vitality drain and survey system

### Tasks
1. **Vitality system** - 1%/min drain for active foragers
2. **Vitality UI** - Progress bars on forager slots
3. **Survey system** - 5 biomes, manual observation, progress tracking
4. **Assistant automation** - Auto-observe when assigned
5. **Survey completion** - Generate new bird at 100% progress
6. **Species generator** - Procedural names based on biome + traits
7. **Trait assignment** - Weighted by assistant distinction
8. **Unlock slots** - Spend Seeds to unlock Forager 2 & 3

### Deliverable
Complete Wilds screen loop:
- Assign bird to Forager → earns Seeds, vitality drains
- Assign bird to Assistant (Forest survey) → auto-observes
- Forest reaches 100% → new bird joins collection
- New bird has procedurally generated name and traits
- Unlock additional forager slots

### Files Implemented
```
src/
├── systems/
│   ├── foragers.js (add vitality drain)
│   ├── surveys.js (COMPLETE)
│   └── species.js (name generation)
├── ui/
│   └── wilds.js (add survey UI)
└── data/
    └── species.js (name templates)
```

### Testing
- ✅ Forager vitality drains to 0%, stops earning
- ✅ Assistant completes survey, spawns bird
- ✅ New bird has correct distinction (assistant ±1)
- ✅ Traits weighted correctly (test with Epic assistant)
- ✅ Species names vary by biome
- ✅ Unlock forager slot 2 for 500 Seeds

---

## STAGE 3: Sanctuary & Perches (45 minutes)

### Goal
Sanctuary screen functional with perch management and vitality restore

### Tasks
1. **Sanctuary UI** - 5 perch slots with assign/unassign
2. **Grooming system** - Auto-restore 1%/min vitality
3. **Manual restore** - +20% instant with cooldown
4. **Maturation** - 100 Seeds to make bird breeding-eligible
5. **Collection view** - List all specimens, show location
6. **Distinguished Guest bonuses** - Calculate buffs from perched birds
7. **Bonus display** - Show active bonuses at top of screen
8. **Unlock perches** - Spend Seeds for perches 2-5

### Deliverable
Working care loop:
- Move birds from collection to perches
- Vitality auto-restores from 0% → 100%
- Manual restore gives +20% boost
- Spend 100 Seeds to mature bird
- Active trait bonuses display (e.g., "+10% Forager Efficiency")
- Unlock additional perches

### Files Implemented
```
src/
├── systems/
│   ├── sanctuary.js (grooming, maturation, bonuses)
│   └── foragers.js (apply bonuses)
├── ui/
│   └── sanctuary.js (COMPLETE)
```

### Testing
- ✅ Assign bird to perch, starts grooming
- ✅ Vitality restores 1%/min
- ✅ Manual restore gives +20%, cooldown works
- ✅ Mature bird for 100 Seeds
- ✅ Alacrity trait gives +10% forager income
- ✅ Multiple traits stack (2x Alacrity = +20%)
- ✅ Unlock perch 2 for 500 Seeds

---

## STAGE 4: Breeding & Genetics (75 minutes)

### Goal
Complete Hatchery with genetic inheritance system

### Tasks
1. **Hatchery UI** - 3 breeding program slots
2. **Parent selection** - Choose 2 mature birds
3. **Breeding timer** - Duration based on offspring distinction
4. **Genetic square** - Trait inheritance (4 combinations)
5. **Distinction inheritance** - Average parents (60/30/10 distribution)
6. **Biome inheritance** - 50/50 from parents
7. **Trait count** - Based on offspring rarity (1/1/2/3/3)
8. **Post-hatch** - Parents lose mature status, vitality reset
9. **Incubation progress** - Manual assistance + auto-contribution
10. **Unlock programs** - Spend Seeds for programs 2 & 3

### Deliverable
Working breeding loop:
- Select 2 mature birds → start breeding
- Timer counts down (affected by bonuses)
- New bird hatches with inherited traits
- Genetic square produces 4 possible outcomes
- Parents reset to immature, need grooming
- Breed multiple generations to stack traits

### Files Implemented
```
src/
├── systems/
│   └── breeding.js (COMPLETE - genetics core)
└── ui/
    └── hatchery.js (COMPLETE)
```

### Genetic Logic
```javascript
// Example:
Parent A: [Alacrity, Fortitude] (⭐⭐⭐ Rare, Forest)
Parent B: [Precision, Fortune] (⭐⭐⭐ Rare, Mountain)

Offspring distinction: avg(3,3) = 3 → 60% ⭐⭐⭐, 30% ⭐⭐⭐⭐, 10% ⭐⭐
Offspring traits (4 combos at 25% each):
  - Alacrity + Precision
  - Alacrity + Fortune
  - Fortitude + Precision
  - Fortitude + Fortune
Offspring biome: 50% Forest, 50% Mountain
```

### Testing
- ✅ Breed 2 Commons → Uncommon offspring
- ✅ Breed 2 Rares → Epic offspring (with luck)
- ✅ Genetic square produces all 4 combinations (test 20 breedings)
- ✅ Trait count matches rarity (Epic has 3 traits)
- ✅ Synchrony trait reduces incubation time
- ✅ Parents reset after hatching
- ✅ Unlock program 2 for 2,500 Seeds

---

## STAGE 5: Crystal Prestige & Offline Progress (45 minutes)

### Goal
Crystal-based prestige mechanic and offline progress calculation

### Updated Prestige Design
**CHANGED FROM ORIGINAL**: Prestige is now crystal-based, not enhancement-based
- **Trigger**: Available after unlocking Tundra (5th biome)
- **Prestige UI**: Appears as 6th "Prestige" biome card in Wilds after Tundra unlocked
- **Crystal System**: Unlocks 1 crystal per prestige, in order: Forest → Mountain → Coastal → Arid → Tundra
- **Reset**: Keep only 5 birds from sanctuary perches (reset to 100% vitality + immature)
- **Hard Reset**: Seeds → 0, all biomes re-lock except Forest, all other birds removed
- **Sanctuary Display**: 5 crystal slots shown horizontally at top of Sanctuary screen

### Tasks
1. **Crystal state** - Add `crystals: []` array to track unlocked biome crystals
2. **Prestige check** - Enable when Tundra unlocked + 5 birds on perches
3. **Prestige UI** - 6th biome card in Wilds, opens confirmation modal
4. **Crystal display** - 5 horizontal slots at top of Sanctuary
5. **Reset logic** - Keep 5 perched birds (reset to fresh), remove everything else
6. **Sequential unlock** - Award next crystal in sequence (forest → mountain → coastal → arid → tundra)
7. **Offline progress** - Calculate elapsed time, apply caps
8. **Offline summary** - Modal showing Seeds earned, birds hatched

### Deliverable
Working crystal prestige loop:
- Unlock Tundra biome → "Prestige" 6th biome appears in Wilds
- Perform prestige → keep 5 perched birds, award Forest crystal
- Birds reset to 100% vitality + immature status
- All biomes re-lock except Forest
- Crystal displayed at top of Sanctuary
- Return after 1 hour offline → progress calculated
- Offline summary shows what happened

### Files Implemented
```
src/
├── systems/
│   ├── prestige.js (COMPLETE - NEW)
│   └── offline.js (COMPLETE)
└── ui/
    ├── sanctuary.js (add crystal display)
    ├── wilds.js (add prestige biome card)
    └── modals.js (prestige confirmation, offline summary)
```

### Testing
- ✅ Prestige available after Tundra unlocked
- ✅ Prestige modal shows warning and next crystal
- ✅ Non-perched birds removed on prestige
- ✅ 5 perched birds kept, reset to 100% vitality + immature
- ✅ Forest crystal awarded after 1st prestige
- ✅ Biomes re-lock except Forest
- ✅ Crystal displays correctly in Sanctuary
- ✅ Close game 10 minutes → reopen → 10 min progress applied
- ✅ Offline progress capped at 24 hours
- ✅ Offline summary displays correctly

---

## STAGE 6: Legendaries & Polish (75 minutes)

### Goal
Legendary breeding system, narrative beats, final polish

### Updated Legendary System
**CHANGED FROM ORIGINAL**: Legendaries now require crystals, not enhancements
- **Requirements**: Both parents must be 5-star (⭐⭐⭐⭐⭐) from same biome
- **Crystal Gate**: That biome's crystal must be unlocked via prestige
- **Breeding Chance**: 10% base chance (no scaling, can add guest bonuses)
- **Win Condition**: Breed all 5 legendaries AND place them all on sanctuary perches simultaneously
- **Biome Display**: Show biome icon/name in breeding parent selection UI

### Tasks
1. **Legendary detection** - Check crystal + 5-star same-biome requirements
2. **Legendary generation** - Create legendary specimen from LEGENDARIES constant
3. **Biome display** - Show biome info in Hatchery parent selection
4. **Win condition** - Check if all 5 legendaries on perches
5. **Field Guide UI** - Show all catalogued species, 5 legendary slots
6. **Narrative system** - Modal with Administrator character
7. **Narrative triggers** - 10 story beats throughout progression
8. **Completion screen** - All 5 legendaries on perches → full reveal
9. **Screenshot feature** - "CAPTURE" button (countdown, hide UI)
10. **Final polish** - CSS animations, transitions, hover states
11. **Balance testing** - Verify progression timeline
12. **Build & deploy** - Production build to Netlify

### Deliverable
Complete game:
- Prestige to unlock crystal → Breed 2x 5-star same-biome parents → Legendary
- Legendary reveals extinction lore
- Biome shown in breeding UI
- All 5 legendaries on perches → win screen
- Narrative beats guide player
- Field Guide shows collection progress
- Screenshot feature works
- Deployed to Netlify

### Files Implemented
```
src/
├── systems/
│   └── breeding.js (update legendary check)
├── data/
│   └── species.js (add createLegendarySpecimen)
├── ui/
│   ├── hatchery.js (add biome display)
│   ├── sanctuary.js (check win condition)
│   ├── modals.js (narrative, completion)
│   ├── fieldGuide.js (COMPLETE)
│   └── screenshot.js (COMPLETE)
└── styles.css (polish animations)
```

### Legendary Requirements Check
```javascript
function checkLegendaryEligibility(parent1, parent2) {
  // 1. Both parents must be 5-star (⭐⭐⭐⭐⭐)
  if (parent1.distinction !== 5 || parent2.distinction !== 5) return false;

  // 2. Both must be from same biome
  if (parent1.biome !== parent2.biome) return false;

  // 3. Crystal for that biome must be unlocked
  const biome = parent1.biome;
  if (!gameState.crystals.includes(biome)) return false;

  // 4. Probability roll (10% base + guest bonuses)
  const baseChance = 0.10;
  const bonusChance = calculateDistinguishedGuestBonus('legendary_breeding_chance');
  const totalChance = baseChance + bonusChance;

  return Math.random() < totalChance;
}
```

### Narrative Beats
1. **Welcome** - "Good day. Welcome to the Sanctuary."
2. **First Arrival** - Forest survey completes
3. **First Groom** - Player manually restores vitality
4. **First Breeding** - Hatchery used
5. **First Rare** - ⭐⭐⭐ bird catalogued
6. **First Epic** - ⭐⭐⭐⭐ bird catalogued
7. **Reorganization Offer** - 15 species catalogued
8. **First Legendary** - Greater Prairie-Chicken extinction lore
9. **5th Legendary** - Full apocalyptic reveal
10. **Completion Stats** - Play time, Seeds, Species, Reorganizations

### Testing
- ✅ Legendary only breeds with all 5 requirements
- ✅ Legendary shows scientific name and lore
- ✅ Narrative beats trigger at correct times
- ✅ Field Guide shows catalogued species
- ✅ Completion screen shows after 5 legendaries
- ✅ Screenshot hides UI for 2 seconds
- ✅ Production build works
- ✅ Game saves/loads correctly
- ✅ Mobile viewport renders properly
- ✅ All animations smooth

---

## Build Time Breakdown

| Stage | Duration | Cumulative | Deliverable |
|-------|----------|------------|-------------|
| 0 | 30 min | 0:30 | Foundation + Art manifest sent |
| 1 | 45 min | 1:15 | Foragers + Save/Load |
| 2 | 60 min | 2:15 | Surveys + Vitality |
| 3 | 45 min | 3:00 | Sanctuary + Perches |
| 4 | 75 min | 4:15 | Breeding + Genetics |
| 5 | 45 min | 5:00 | Prestige + Offline |
| 6 | 75 min | 6:15 | Legendaries + Polish |

**Buffer**: 15 minutes for testing/bugs

---

## Parallel Work Opportunities

### Art Team (Unblocked at Stage 0)
- Stage 0-2: Create bird sprites (5 rarities)
- Stage 2-4: Create biome icons, UI elements
- Stage 4-6: Create backgrounds, legendary portraits

### Testing/Balance (During development)
- Stage 1: Test forager income rates
- Stage 2: Test survey completion times
- Stage 3: Test vitality restore rates
- Stage 4: Test breeding genetics distribution
- Stage 5: Test offline progress calculation
- Stage 6: Full playthrough (15 min speedrun)

---

## Critical Success Metrics

### Stage 1 Complete
- [ ] Can earn Seeds
- [ ] Can save/load game
- [ ] Auto-save works

### Stage 2 Complete
- [ ] Foragers drain vitality
- [ ] Surveys complete and spawn birds
- [ ] New birds have correct traits

### Stage 3 Complete
- [ ] Vitality restores on perches
- [ ] Maturation works
- [ ] Guest bonuses apply

### Stage 4 Complete
- [ ] Breeding genetics work
- [ ] Can breed multiple generations
- [ ] Trait stacking happens

### Stage 5 Complete
- ✅ Reorganization preserves perched birds
- ✅ Income multiplier applies
- ✅ Offline progress calculates

### Stage 6 Complete
- [ ] Legendary breeding works
- [ ] Narrative appears
- [ ] Game is deployed

---

## Emergency Simplifications (if behind schedule)

### Cut from Stage 6 (30 min saved)
- Screenshot feature (nice-to-have)
- Legendary portraits (use 5-star sprite)
- Completion stats screen (just show text)

### Cut from Stage 5 (15 min saved)
- Offline summary modal (just apply progress silently)
- Territory background changes (keep single background)

### Cut from Stage 3 (10 min saved)
- Manual restore cooldown (allow spam)
- Collection view (just show birds in dropdown)

### Cut from Stage 2 (15 min saved)
- Unlock costs for slots (make all free from start)
- Species name generation (use generic names)

**Total emergency buffer**: 70 minutes

---

## Deployment Checklist

### Pre-Deploy
- [ ] All game loops tested
- [ ] Save/load works
- [ ] Mobile viewport verified
- [ ] No console errors
- [ ] Auto-save enabled

### Build
```bash
npm run build
git add .
git commit -m "Game jam submission"
git push
```

### Netlify Auto-Deploy
- [ ] Build succeeds
- [ ] Site deploys
- [ ] Test production URL
- [ ] Save URL for itch.io

### itch.io Submission
- [ ] Create new HTML project
- [ ] Upload dist/ folder as ZIP
- [ ] Set viewport to 375x812
- [ ] Enable fullscreen
- [ ] Add game description
- [ ] Add screenshots
- [ ] Publish

---

## Post-Jam Improvements (if time permits)

1. **Audio** - Background music, bird chirps, UI clicks
2. **Animations** - Bird movement, seed collection particles
3. **Enhanced UI** - Custom buttons, better typography
4. **Balance** - Adjust timers based on playtest feedback
5. **Achievement system** - Track milestones
6. **Statistics page** - Detailed player stats
7. **Export/import save** - Share progress between devices

---

## Key Technical Decisions

### Why Vanilla JS?
- No framework setup time
- Minimal bundle size
- Full control over performance
- Easy debugging

### Why localStorage only?
- No backend required
- Instant saves
- Works offline
- Simple implementation

### Why 60fps game loop + 10fps UI?
- Accurate income calculation
- Smooth animations
- Efficient DOM updates
- Good battery life

### Why auto-save every 5 seconds?
- Minimal data loss
- Not noticeable to player
- localStorage is fast enough

---

## FAQ for Art Team

**Q: What style should the birds be?**
A: Minimalist silhouettes, pixel art, or simple vector shapes. Think mobile game icons, not realistic illustrations.

**Q: Do birds need animation frames?**
A: No. Static sprites only. We can add subtle CSS animations if time permits.

**Q: What if we can't finish all assets?**
A: Priority order: Bird sprites → Slot indicators → Seeds icon. Everything else has CSS fallbacks.

**Q: Can we use stock assets?**
A: Yes, as long as they're CC0 or properly licensed. Cite sources in assets/CREDITS.txt.

**Q: What about the legendary birds?**
A: If time is short, just use the 5-star bird sprite with a gold tint. Custom portraits are nice-to-have only.

---

## Testing Schedule

### Quick Test (2 minutes) - After each stage
- Assign bird, earn Seeds
- Trigger main feature for that stage
- Save/load
- Check console for errors

### Full Test (15 minutes) - Before Stage 6
- Fresh save playthrough
- Unlock all foragers
- Complete 3 surveys
- Breed 2 generations
- Perform 1 Reorganization
- Verify offline progress (close 5 min)

### Final Test (30 minutes) - Before deploy
- Full playthrough from start
- Reach first legendary (with save editing for speed)
- Test on mobile device
- Test on different browser
- Test save/load edge cases
- Verify all narrative beats

---

This plan ensures runnable software at every stage with clear testing criteria. Art team is unblocked immediately, and systems integrate progressively. Total time: 6 hours 15 minutes with built-in buffer.
