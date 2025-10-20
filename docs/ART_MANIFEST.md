# SANCTUARY - Art Asset Manifest

**Game**: Rare Plumage Jam (Sanctuary)
**Viewport**: 375x812px (mobile-first)
**Style**: Minimalist, clean, pixel art or simple vector silhouettes
**Delivery**: Place all assets in `public/assets/` folders as specified below

---

## PRIORITY 1: MUST HAVE (Stage 1 - Needed Immediately)

### Bird Sprites (5 files)
**Location**: `public/assets/birds/`
**Format**: PNG with transparent background
**Canvas Size**: 128x128px
**Style**: Simple silhouettes, distinguishable by shape and color

| File | Rarity | Color | Description |
|------|--------|-------|-------------|
| `bird-1star.png` | ⭐ Common | Gray `#888888` | Simple sparrow/small bird silhouette |
| `bird-2star.png` | ⭐⭐ Uncommon | Green `#4CAF50` | Robin/songbird, slightly larger |
| `bird-3star.png` | ⭐⭐⭐ Rare | Blue `#2196F3` | Hawk/owl, distinct shape |
| `bird-4star.png` | ⭐⭐⭐⭐ Epic | Purple `#9C27B0` | Crane/heron, elegant pose |
| `bird-5star.png` | ⭐⭐⭐⭐⭐ Legendary | Gold `#FFD700` | Peacock/phoenix, elaborate |

**Reference**: Think mobile game icons - clear at small sizes, not realistic

### UI Slot Indicators (2 files)
**Location**: `public/assets/ui/`
**Format**: PNG with transparency

| File | Size | Description |
|------|------|-------------|
| `slot-empty.png` | 128x128px | Dashed border circle/square, subtle |
| `slot-locked.png` | 128x128px | Padlock icon, semi-transparent overlay |

### Currency Icon (1 file)
**Location**: `public/assets/ui/`
**Format**: PNG with transparency

| File | Size | Description |
|------|------|-------------|
| `seeds-icon.png` | 32x32px | Seed/grain icon for currency display |

**DEADLINE**: End of Stage 1 (1 hour 15 minutes from start)

---

## PRIORITY 2: NICE TO HAVE (Stage 2-3)

### Biome Icons (5 files)
**Location**: `public/assets/biomes/`
**Format**: PNG, 64x64px
**Style**: Simple, recognizable icons

| File | Icon | Description |
|------|------|-------------|
| `biome-forest.png` | 🌲 | Tree/leaf icon |
| `biome-mountain.png` | ⛰️ | Mountain peak |
| `biome-coastal.png` | 🌊 | Wave/shoreline |
| `biome-arid.png` | 🌵 | Cactus/desert |
| `biome-tundra.png` | ❄️ | Snowflake/ice crystal |

### Progress Bar Elements (4 files)
**Location**: `public/assets/ui/`
**Format**: PNG

| File | Size | Description |
|------|------|-------------|
| `vitality-bar-fill.png` | 100x8px | Green gradient `#4CAF50` to `#81C784` |
| `vitality-bar-bg.png` | 100x8px | Light gray `#E0E0E0` |
| `progress-bar-fill.png` | 200x12px | Blue gradient `#2196F3` to `#64B5F6` |
| `progress-bar-bg.png` | 200x12px | Light gray `#E0E0E0` |

**CSS Fallback**: If not provided, we'll use CSS gradient backgrounds

---

## PRIORITY 3: POLISH ONLY (Stage 6+)

### Background Images (3 files) - OPTIONAL
**Location**: `public/assets/backgrounds/`
**Format**: JPG or PNG, 375x812px

| File | Description |
|------|-------------|
| `bg-wilds.jpg` | Sky/clouds view from airship perspective |
| `bg-sanctuary.jpg` | Warm wooden deck interior with perch silhouettes |
| `bg-hatchery.jpg` | Soft orange/amber interior with nest shapes |

**CSS Fallback**: We have gradient backgrounds if these aren't delivered

### Legendary Bird Portraits (5 files) - OPTIONAL
**Location**: `public/assets/birds/legendary/`
**Format**: PNG, 256x256px

| File | Species | Notes |
|------|---------|-------|
| `legendary-prairie-chicken.png` | Greater Prairie-Chicken | Can reuse `bird-5star.png` if needed |
| `legendary-woodpecker.png` | Ivory-billed Woodpecker | Can reuse `bird-5star.png` if needed |
| `legendary-flamingo.png` | Caribbean Flamingo | Can reuse `bird-5star.png` if needed |
| `legendary-heron.png` | Great Blue Heron | Can reuse `bird-5star.png` if needed |
| `legendary-penguin.png` | Emperor Penguin | Can reuse `bird-5star.png` if needed |

**Fallback**: Will use 5-star sprite with gold tint if not provided

---

## Asset Guidelines

### Color Palette
```
Primary Background: #1A1A2E (dark blue-gray)
Secondary Background: #16213E (darker blue)
Accent: #0F3460 (deep blue)
Text Primary: #E4E4E4 (light gray)
Text Secondary: #A0A0A0 (medium gray)
Currency: #FFC107 (amber/gold)

Rarity Colors:
Common: #888888 (gray)
Uncommon: #4CAF50 (green)
Rare: #2196F3 (blue)
Epic: #9C27B0 (purple)
Legendary: #FFD700 (gold)
```

### Typography (using web fonts)
- **Headers**: Cinzel (Google Fonts) - formal, administrative
- **Body**: Roboto - clean, readable
- **Numbers**: Roboto Mono - monospace for stats

### Style Notes
- **Minimalist**: Simple shapes, clear silhouettes
- **Mobile-friendly**: Must be readable at small sizes
- **High contrast**: Dark backgrounds, light text
- **Accessibility**: Clear visual hierarchy

---

## File Checklist

### MUST HAVE (Priority 1)
- [ ] `public/assets/birds/bird-1star.png`
- [ ] `public/assets/birds/bird-2star.png`
- [ ] `public/assets/birds/bird-3star.png`
- [ ] `public/assets/birds/bird-4star.png`
- [ ] `public/assets/birds/bird-5star.png`
- [ ] `public/assets/ui/slot-empty.png`
- [ ] `public/assets/ui/slot-locked.png`
- [ ] `public/assets/ui/seeds-icon.png`

### NICE TO HAVE (Priority 2)
- [ ] `public/assets/biomes/biome-forest.png`
- [ ] `public/assets/biomes/biome-mountain.png`
- [ ] `public/assets/biomes/biome-coastal.png`
- [ ] `public/assets/biomes/biome-arid.png`
- [ ] `public/assets/biomes/biome-tundra.png`
- [ ] `public/assets/ui/vitality-bar-fill.png`
- [ ] `public/assets/ui/vitality-bar-bg.png`
- [ ] `public/assets/ui/progress-bar-fill.png`
- [ ] `public/assets/ui/progress-bar-bg.png`

### POLISH (Priority 3)
- [ ] `public/assets/backgrounds/bg-wilds.jpg`
- [ ] `public/assets/backgrounds/bg-sanctuary.jpg`
- [ ] `public/assets/backgrounds/bg-hatchery.jpg`
- [ ] `public/assets/birds/legendary/legendary-prairie-chicken.png`
- [ ] `public/assets/birds/legendary/legendary-woodpecker.png`
- [ ] `public/assets/birds/legendary/legendary-flamingo.png`
- [ ] `public/assets/birds/legendary/legendary-heron.png`
- [ ] `public/assets/birds/legendary/legendary-penguin.png`

---

## Technical Specs

### Optimization
- PNG files should be optimized (use TinyPNG or similar)
- Transparent backgrounds where specified
- No animations needed (we'll handle with CSS)
- File size target: <50KB per sprite, <200KB per background

### Delivery
1. Place files in correct folders as specified
2. Use exact filenames (case-sensitive)
3. Verify transparency on dark backgrounds
4. Test that 128px birds are visible at 64px scale

### Fallback Strategy
If assets aren't ready:
- Birds: Colored circles with star ratings
- Slots: CSS borders
- Icons: Unicode emoji
- Backgrounds: CSS gradients
- Progress bars: CSS-only

---

## Questions?

**Q: Can we use stock/CC0 assets?**
A: Yes! Just create `public/assets/CREDITS.txt` with sources.

**Q: What if we can't finish everything?**
A: Priority 1 assets are critical. Priority 2-3 have CSS fallbacks.

**Q: Do birds need different poses/animations?**
A: No. Single static sprite per rarity is fine.

**Q: What about particle effects or UI decorations?**
A: Skip for jam. We can add post-jam if time permits.

**Q: Should birds look realistic?**
A: No. Simple, iconic silhouettes work best for gameplay clarity.

---

## Reference Examples

**Good style references**:
- Monument Valley (minimalist, clean)
- Alto's Adventure (simple silhouettes)
- Reigns (iconic, clear shapes)
- Ridiculous Fishing (bold, readable)

**Bird sprite style**:
```
⭐ = Small dot-like bird (sparrow)
⭐⭐ = Clear small bird shape
⭐⭐⭐ = Distinct medium bird with details
⭐⭐⭐⭐ = Large elegant bird with pose
⭐⭐⭐⭐⭐ = Impressive, elaborate bird
```

Each should be instantly distinguishable at a glance.

---

**Total Assets**: 8 must-have, 14 nice-to-have, 8 polish
**Timeline**: Priority 1 needed in ~1 hour, rest during Stages 2-6
**Contact**: Check with dev team if specs are unclear
