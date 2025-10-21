// Quick script to generate biome placeholder images
import { createCanvas } from 'canvas';
import { writeFileSync, mkdirSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const biomes = [
  { id: 'forest', color: '#2d5016', icon: '🌲' },
  { id: 'mountain', color: '#5a4a42', icon: '⛰️' },
  { id: 'coastal', color: '#1e5a8e', icon: '🌊' },
  { id: 'arid', color: '#c19a6b', icon: '🏜️' },
  { id: 'tundra', color: '#b0c4de', icon: '❄️' }
];

const outputDir = join(__dirname, 'public', 'assets', 'biomes');

// Ensure directory exists
mkdirSync(outputDir, { recursive: true });

console.log('Generating biome placeholder images...');

biomes.forEach(biome => {
  const canvas = createCanvas(128, 128);
  const ctx = canvas.getContext('2d');

  // Background circle
  ctx.fillStyle = biome.color;
  ctx.beginPath();
  ctx.arc(64, 64, 60, 0, Math.PI * 2);
  ctx.fill();

  // Border
  ctx.strokeStyle = '#444444';
  ctx.lineWidth = 3;
  ctx.stroke();

  // Icon/emoji
  ctx.font = 'bold 48px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#ffffff';
  ctx.fillText(biome.icon, 64, 64);

  // Save
  const buffer = canvas.toBuffer('image/png');
  const filePath = join(outputDir, `${biome.id}.png`);
  writeFileSync(filePath, buffer);
  console.log(`✓ Generated ${biome.id}.png`);
});

console.log('Done! All biome icons generated.');
