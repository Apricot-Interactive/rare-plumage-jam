# Tutorial System Test Plan

## Test Setup
1. Open Settings (⚙️ button)
2. Click "Reset Account"
3. Confirm "Yes, Reset Everything"
4. Page should automatically refresh to clean state

## Expected Tutorial Flow

### Step 0: INTRO
**Expected:**
- Modal appears with italic text: "Only silence as far as you can hear. Did anything survive?"
- Click "Next" button
- Modal closes

**UI State:**
- Only header visible
- Only Forest biome visible in Wilds
- Sanctuary tab shows: 🔒 125 🫘
- Hatchery tab shows: 🔒 2000 🫘
- Seeds counter shows 100
- No birds in collection yet

---

### Step 1: FIRST_SURVEY
**Expected:**
- Arrow bounces pointing DOWN at the tree icon (Forest survey button)
- Forest survey bar shows 97% complete (349/360)

**Action:**
- Click the tree icon

**Result:**
- Survey completes immediately (3% remaining = instant)
- Arrow disappears
- Bird celebration modal appears

---

### Step 2: BIRD_CELEBRATION
**Expected:**
- Modal shows Forest Jay details:
  - Name: "Forest Jay"
  - Distinction: ⭐ (1 star)
  - Trait: Alacrity
  - Description visible
- Click "Next" button

**Result:**
- Modal closes
- Forest Jay added to collection
- Tutorial advances to FORAGER_ASSIGNMENT

---

### Step 3: FORAGER_ASSIGNMENT
**Expected:**
- Arrow bounces pointing DOWN at "Forage?" label (below the empty forager circle)
- Forager slot 1 is visible and clickable
- Manual tapping on empty slots is DISABLED

**Action:**
- Click "Forage?" label

**Result:**
- Bird selection modal opens
- Tutorial advances to SELECT_BIRD

---

### Step 4: SELECT_BIRD
**Expected:**
- Bird selection modal shows Forest Jay
- Arrow bounces pointing DOWN at Forest Jay's icon in the modal

**Action:**
- Click Forest Jay to assign

**Result:**
- Forest Jay assigned to Forager slot 1
- Modal closes
- Arrow disappears
- Seeds start incrementing (1 seed/sec)
- Tutorial advances to MANUAL_TAPPING

---

### Step 5: MANUAL_TAPPING
**Expected:**
- Modal appears with bold text: "You're bringing me seeds. I can help too."
- Click "Next"
- Modal closes
- Arrow bounces pointing DOWN at the large forager circle (not the label)
- Manual tapping is NOW ENABLED

**Action:**
- Click the forager circle multiple times
- Watch seeds increase by +10 per tap
- Tap until seeds >= 125

**Result:**
- When seeds >= 125, arrow disappears
- Tutorial advances to SANCTUARY_UNLOCK
- Arrow bounces pointing DOWN at 🔒 125 🫘 (Sanctuary tab)

---

### Step 6: SANCTUARY_UNLOCK
**Expected:**
- Arrow pointing at Sanctuary lock tab
- Seeds >= 125

**Action:**
- Click Sanctuary tab

**Result:**
- 125 seeds deducted
- Forest Jay auto-unassigned from forager
- Forest Jay vitality set to 50%
- Navigate to Sanctuary screen
- Modal appears with bold text: "You can rest in the sanctuary, Jay"
- Click "Next"
- Tutorial advances to GROOMING

---

### Step 7: GROOMING
**Expected:**
- Sanctuary screen visible
- Wilds tab is DISABLED/UNCLICKABLE during this step
- Only "The Sanctuary" header visible
- Only "Distinguished Guests" header visible
- Only Perch 1 visible
- "Artifacts" header HIDDEN
- Crystal slots HIDDEN
- "Collection" section HIDDEN
- "Active Bonuses" section HIDDEN
- Arrow bounces pointing DOWN at "Assign Guest" button on Perch 1

**Action:**
- Click "Assign Guest"

**Result:**
- Bird selection modal opens
- Arrow bounces pointing DOWN at Forest Jay in modal
- Click Forest Jay
- Modal closes
- Forest Jay appears in Perch 1 at 50% vitality
- Arrow bounces pointing DOWN at brush icon (🪮)

**Action:**
- Click brush icon 5+ times (requires at least 5 clicks)
- Watch vitality increase by 1% per click

**Result:**
- After 5th click, arrow disappears
- Tutorial advances to SYSTEMS_REVIEW

---

### Step 8: SYSTEMS_REVIEW
**Expected:**
- Modal appears with italic text: "Let's see. FORAGE for seeds. SURVEY for more birds. REST them in the sanctuary. I need 2000 seeds before I can expand my program. I can do this."
- Click "Next"

**Result:**
- Modal closes
- Tutorial advances to FREE_PLAY
- Arrow immediately appears pointing DOWN at 🔒 2000 🫘 (Hatchery tab)

---

### Step 9: FREE_PLAY
**Expected UI Changes:**
- **Wilds tab now clickable**
- All Sanctuary headers visible (Distinguished Guests, Collection, Active Bonuses)
- **Artifacts header STILL HIDDEN** (until hatchery unlocked)
- **Crystal slots STILL HIDDEN** (until hatchery unlocked)
- Mountain biome (next locked biome) now visible with unlock cost
- All 3 forager slots visible
- All 5 perch slots visible
- Arrow pointing at Hatchery lock

**Test Navigation:**
- Click between Wilds and Sanctuary - should work freely
- Click Hatchery tab (with < 2000 seeds)

**Expected:**
- Modal appears with bold text: "You don't have enough seeds - gather more in the wilds"
- Click "Next"
- Modal closes, stay on current screen

**Free Play Actions:**
- Assign birds to foragers
- Complete surveys
- Groom birds in sanctuary
- Accumulate 2000+ seeds

**When seeds >= 2000:**
- Arrow should remain pointing at Hatchery tab (already visible from start of FREE_PLAY)
- Click Hatchery tab

**Result:**
- 2000 seeds deducted
- Navigate to Hatchery screen
- Tutorial advances to HATCHERY_UNLOCK

---

### Step 10: HATCHERY_UNLOCK
**Expected:**
- Modal appears with italic text: "Our sanctuary is growing. It's time to restart the breeding program."
- Click "Next"

**Result:**
- Modal closes
- Already on Hatchery screen
- Tutorial advances to BREEDING_TUTORIAL

---

### Step 11: BREEDING_TUTORIAL
**Expected:**
- Hatchery screen showing 3 breeding programs
- Arrow bounces pointing DOWN at "Select Parent 1" button (Program 1)

**Action:**
- Click "Select Parent 1"
- Bird selection modal opens
- Select a bird (should be immature)

**Result:**
- If bird is immature, modal appears with bold text: "You need to get a little bigger first. Here, eat these seeds."
- Click "Next"
- Arrow bounces pointing DOWN at maturity button (👶→🐦)
- Click maturity button 10 times (10% progress per click)
- When mature, arrow disappears

**Action:**
- Select Parent 2
- Start breeding
- Wait for incubation to complete (or use manual assistance)

**Result:**
- New bird hatches
- Tutorial advances to COMPLETION

---

### Step 12: COMPLETION
**Expected:**
- Modal appears with italic text: "OK that's everything from the manual. Remember - 5 habitats. 5 artifacts. 5 legendary guardians. I can do this. I can save them. I can save us."
- Click "Next"

**Result:**
- Modal closes
- Tutorial completed
- `tutorialActive` set to false
- `tutorialCompleted` set to true
- **Artifacts header now visible**
- **Crystal slots now visible**
- Full game unlocked

---

## Additional Tests

### Reset Functionality
**Test:** Click Reset Account during tutorial
**Expected:**
- Tutorial arrow hidden
- Game state reset
- Page automatically refreshes
- Tutorial starts from INTRO step

### Save/Load Persistence
**Test:** Close browser mid-tutorial, reopen
**Expected:**
- Tutorial resumes at current step
- Arrow reappears if it was visible
- Tutorial state preserved

### Navigation Restrictions
**Test:** During GROOMING step, try clicking Wilds tab
**Expected:**
- Click does nothing
- Remain on Sanctuary screen

### Arrow Positioning
**Test:** Resize browser window with arrow visible
**Expected:**
- Arrow repositions to stay pointing at target
- No console errors

### Edge Cases
**Test:** Click "Next" rapidly on modals
**Expected:**
- Modal closes cleanly
- No duplicate arrows
- Tutorial advances correctly

**Test:** Try to assign same bird to multiple slots during tutorial
**Expected:**
- "Bird already in use" prompt should NOT appear during tutorial (Jay is auto-unassigned)

---

## Success Criteria

✅ All 13 tutorial steps complete without errors
✅ Arrows appear at correct positions without page refresh
✅ Modals display correct text with correct styling (italic/bold)
✅ UI elements hide/show at correct steps
✅ Navigation restrictions work correctly
✅ Lock icons display correctly on tabs
✅ Tutorial persists through browser close/reopen
✅ Reset functionality works and refreshes page
✅ No console errors throughout flow
✅ Full game unlocks after completion
