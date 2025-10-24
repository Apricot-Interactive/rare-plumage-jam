// SANCTUARY - Species Name Generation
import { TRAIT_WEIGHTS_BY_DISTINCTION, TRAITS_BY_RARITY, TRAIT_COUNT, LEGENDARIES, ENERGY_CAPACITY } from '../core/constants.js';
import { generateId, weightedChoice, randomChoice } from '../utils/random.js';

// Bird types for species generation
const BIRD_TYPES = ['Sparrow', 'Warbler', 'Finch', 'Thrush', 'Wren', 'Robin', 'Jay', 'Lark', 'Crow', 'Owl'];

const TRAIT_ADJECTIVES = {
  alacrity: 'Swift',
  fortitude: 'Hardy',
  precision: 'Keen',
  fortune: 'Lucky',
  efficiency: 'Thrifty',
  constitution: 'Sturdy',
  synchrony: 'Synchronized',
  acuity: 'Sharp',
  luminescence: 'Glowing',
  supremacy: 'Regal'
};

export function generateSpeciesName(biome, distinction, traits) {
  const birdType = randomChoice(BIRD_TYPES);

  // Add adjective for higher rarity birds
  if (distinction >= 3 && traits && traits.length > 0) {
    const firstTrait = traits[0];
    const adjective = TRAIT_ADJECTIVES[firstTrait] || '';
    if (adjective) {
      return `${adjective} ${birdType}`;
    }
  }

  return birdType;
}

export function generateRandomTrait(distinction) {
  // Get weights for this distinction
  const weights = TRAIT_WEIGHTS_BY_DISTINCTION[distinction];
  if (!weights) return 'alacrity';

  // Choose rarity tier
  const tier = weightedChoice(weights);

  // Choose random trait from that tier
  const traitsInTier = TRAITS_BY_RARITY[tier];
  if (!traitsInTier || traitsInTier.length === 0) return 'alacrity';

  return randomChoice(traitsInTier);
}

export function createSpecimen(biome, distinction, providedTraits = null, isLegendary = false) {
  // Generate traits if not provided
  let traits = providedTraits;
  if (!traits) {
    traits = [];
    const traitCount = TRAIT_COUNT[distinction] || 1;

    for (let i = 0; i < traitCount; i++) {
      const newTrait = generateRandomTrait(distinction);
      // Avoid duplicates
      if (!traits.includes(newTrait)) {
        traits.push(newTrait);
      }
    }

    // Ensure we have at least one trait
    if (traits.length === 0) {
      traits.push('alacrity');
    }
  }

  // Generate species name
  const speciesName = generateSpeciesName(biome, distinction, traits);

  // Create specimen object
  const maxEnergy = ENERGY_CAPACITY[distinction] || ENERGY_CAPACITY[1];
  const specimen = {
    id: generateId('bird'),
    speciesName,
    customDesignation: null,
    distinction,
    biome,
    traits,
    vitality: maxEnergy,  // Absolute energy value
    vitalityPercent: 100, // Keep for backward compatibility
    isMature: false,
    cataloguedAt: Date.now(),
    location: 'collection',
    isLegendary
  };

  return specimen;
}

export function createLegendarySpecimen(biome) {
  // Get legendary data from constants
  const legendaryData = LEGENDARIES[biome];
  if (!legendaryData) {
    console.error(`No legendary defined for biome: ${biome}`);
    return null;
  }

  // Create legendary specimen
  const maxEnergy = ENERGY_CAPACITY[5]; // Legendaries are 5-star
  const specimen = {
    id: generateId('bird'),
    speciesName: legendaryData.speciesName,
    scientificName: legendaryData.scientificName,
    customDesignation: null,
    distinction: 5, // Legendaries are 5-star
    biome: legendaryData.biome,
    traits: ['luminescence', 'supremacy', 'synchrony'], // Legendaries have all epic/rare traits
    vitality: maxEnergy, // Absolute energy value
    vitalityPercent: 100, // Keep for backward compatibility
    isMature: false,
    cataloguedAt: Date.now(),
    location: 'collection',
    isLegendary: true,
    lore: legendaryData.lore
  };

  return specimen;
}
