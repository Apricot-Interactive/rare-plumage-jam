// Generate placeholder PNG assets for the game
const { createCanvas } = require('canvas');
const fs = require('fs');
const path = require('path');

const OUTPUT_DIR = path.join(__dirname, '..', 'public', 'assets');

// Ensure directories exist
function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

// Create a solid color PNG
function createColorPNG(width, height, color, outputPath, options = {}) {
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');

  // Fill background
  if (options.transparent) {
    ctx.clearRect(0, 0, width, height);
  } else {
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, width, height);
  }

  // Draw circle if specified
  if (options.circle) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(width / 2, height / 2, Math.min(width, height) / 2 - 4, 0, Math.PI * 2);
    ctx.fill();

    // Add border
    ctx.strokeStyle = options.borderColor || '#ffffff';
    ctx.lineWidth = 3;
    ctx.stroke();
  }

  // Draw bird silhouette (simple triangle shape)
  if (options.bird) {
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = color;
    ctx.beginPath();

    // Simple bird body
    ctx.arc(width / 2, height / 2, width / 3, 0, Math.PI * 2);
    ctx.fill();

    // Wing
    ctx.beginPath();
    ctx.moveTo(width / 2, height / 2);
    ctx.lineTo(width * 0.2, height * 0.3);
    ctx.lineTo(width * 0.3, height * 0.6);
    ctx.closePath();
    ctx.fill();

    // Tail
    ctx.beginPath();
    ctx.moveTo(width / 2, height / 2);
    ctx.lineTo(width * 0.8, height * 0.7);
    ctx.lineTo(width * 0.7, height * 0.8);
    ctx.closePath();
    ctx.fill();
  }

  // Add text label
  if (options.text) {
    ctx.fillStyle = '#000000';
    ctx.font = `${options.fontSize || 12}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(options.text, width / 2, height / 2);
  }

  // Draw icon shape
  if (options.icon) {
    ctx.fillStyle = color;
    ctx.fillRect(width * 0.2, height * 0.2, width * 0.6, height * 0.6);
  }

  // Save to file
  ensureDir(path.dirname(outputPath));
  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync(outputPath, buffer);
  console.log(`✓ Created: ${path.relative(process.cwd(), outputPath)}`);
}

console.log('🎨 Generating placeholder assets...\n');

// PRIORITY 1: Bird Sprites (128x128px)
console.log('📦 Priority 1: Bird Sprites');
const birdColors = {
  '1star': '#888888',  // Gray (Common)
  '2star': '#4CAF50',  // Green (Uncommon)
  '3star': '#2196F3',  // Blue (Rare)
  '4star': '#9C27B0',  // Purple (Epic)
  '5star': '#FFD700'   // Gold (Legendary)
};

Object.entries(birdColors).forEach(([name, color]) => {
  createColorPNG(
    128, 128, color,
    path.join(OUTPUT_DIR, 'birds', `bird-${name}.png`),
    { bird: true, transparent: false }
  );
});

// PRIORITY 1: Slot Indicators (128x128px)
console.log('\n📦 Priority 1: Slot Indicators');
createColorPNG(
  128, 128, 'transparent',
  path.join(OUTPUT_DIR, 'ui', 'slot-empty.png'),
  { circle: true, borderColor: '#666666', transparent: true }
);

createColorPNG(
  128, 128, 'rgba(100, 100, 100, 0.5)',
  path.join(OUTPUT_DIR, 'ui', 'slot-locked.png'),
  { icon: true, text: '🔒', fontSize: 48 }
);

// PRIORITY 1: Seeds Icon (32x32px)
console.log('\n📦 Priority 1: Seeds Icon');
createColorPNG(
  32, 32, '#FFC107',
  path.join(OUTPUT_DIR, 'ui', 'seeds-icon.png'),
  { circle: true, transparent: false }
);

// PRIORITY 2: Biome Icons (64x64px)
console.log('\n📦 Priority 2: Biome Icons');
const biomes = [
  { name: 'forest', color: '#2E7D32', emoji: '🌲' },
  { name: 'mountain', color: '#5D4037', emoji: '⛰️' },
  { name: 'coastal', color: '#0277BD', emoji: '🌊' },
  { name: 'arid', color: '#F57C00', emoji: '🌵' },
  { name: 'tundra', color: '#B0BEC5', emoji: '❄️' }
];

biomes.forEach(({ name, color, emoji }) => {
  createColorPNG(
    64, 64, color,
    path.join(OUTPUT_DIR, 'biomes', `biome-${name}.png`),
    { circle: true, text: emoji, fontSize: 32 }
  );
});

// PRIORITY 2: Progress Bars (various sizes)
console.log('\n📦 Priority 2: Progress Bars');
createColorPNG(
  100, 8, '#4CAF50',
  path.join(OUTPUT_DIR, 'ui', 'vitality-bar-fill.png'),
  {}
);

createColorPNG(
  100, 8, '#E0E0E0',
  path.join(OUTPUT_DIR, 'ui', 'vitality-bar-bg.png'),
  {}
);

createColorPNG(
  200, 12, '#2196F3',
  path.join(OUTPUT_DIR, 'ui', 'progress-bar-fill.png'),
  {}
);

createColorPNG(
  200, 12, '#E0E0E0',
  path.join(OUTPUT_DIR, 'ui', 'progress-bar-bg.png'),
  {}
);

// PRIORITY 3: Legendary Portraits (256x256px)
console.log('\n📦 Priority 3: Legendary Portraits');
const legendaries = [
  'prairie-chicken',
  'woodpecker',
  'flamingo',
  'heron',
  'penguin'
];

legendaries.forEach(name => {
  createColorPNG(
    256, 256, '#FFD700',
    path.join(OUTPUT_DIR, 'birds', 'legendary', `legendary-${name}.png`),
    { bird: true, circle: false }
  );
});

console.log('\n✅ All placeholder assets generated!');
console.log('\nAssets created:');
console.log('  - 5 bird sprites (128x128px)');
console.log('  - 2 slot indicators (128x128px)');
console.log('  - 1 seeds icon (32x32px)');
console.log('  - 5 biome icons (64x64px)');
console.log('  - 4 progress bar elements');
console.log('  - 5 legendary portraits (256x256px)');
console.log('\nTotal: 22 placeholder assets\n');
