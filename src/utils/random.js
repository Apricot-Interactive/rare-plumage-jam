// SANCTUARY - Random Utilities

export function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function randomFloat(min, max) {
  return Math.random() * (max - min) + min;
}

export function randomChoice(array) {
  return array[Math.floor(Math.random() * array.length)];
}

export function weightedChoice(weights) {
  const total = Object.values(weights).reduce((sum, w) => sum + w, 0);
  let random = Math.random() * total;

  for (const [key, weight] of Object.entries(weights)) {
    random -= weight;
    if (random <= 0) {
      return key;
    }
  }

  return Object.keys(weights)[0];
}

export function rollProbability(chance) {
  return Math.random() < chance;
}

export function generateId(prefix = 'bird') {
  return `${prefix}_${Date.now()}_${randomInt(1000, 9999)}`;
}
