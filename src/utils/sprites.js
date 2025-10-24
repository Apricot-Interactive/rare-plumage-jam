// SPRITES - Bird sprite path utilities

/**
 * Get the sprite path for a bird based on its biome and legendary status
 * @param {Object} bird - The bird specimen
 * @returns {string} - Path to the bird sprite
 */
export function getBirdSpritePath(bird) {
  if (!bird || !bird.biome) {
    console.warn('getBirdSpritePath: Invalid bird or missing biome', bird);
    return '/assets/birds/forest-1.png'; // Fallback
  }

  const biome = bird.biome.toLowerCase();

  // Legendary birds use the legendary sprite
  if (bird.isLegendary) {
    return `/assets/birds/${biome}-legendary.png`;
  }

  // For common birds, use the bird's ID to consistently select one of the 3 variations
  // This ensures each bird always shows the same sprite
  const birdIdHash = hashBirdId(bird.id);
  const variation = (birdIdHash % 3) + 1; // 1, 2, or 3

  return `/assets/birds/${biome}-${variation}.png`;
}

/**
 * Simple hash function to convert bird ID to a number
 * @param {string} id - Bird ID (e.g., 'bird_001')
 * @returns {number} - Hash value
 */
function hashBirdId(id) {
  if (!id) return 0;

  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    const char = id.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }

  return Math.abs(hash);
}
