// SANCTUARY - Hint System
// Provides contextual hints to guide player progression across all screens

import { gameState, getBirdById } from '../core/state.js';
import { isTutorialActive, getCurrentTutorialStep, TUTORIAL_STEPS } from './tutorial.js';
import { SURVEY_COSTS, UNLOCK_COSTS } from '../core/constants.js';
import { calculateForagerSlotIncome } from './foragers.js';
import { isArrowVisible } from '../ui/tutorialArrow.js';

// ========================================
// HINT REGISTRY
// ========================================
// Hints are checked in order. First matching hint wins.
// Add new hints in priority order (most important first)

const HINT_REGISTRY = [
  // ============ WILDS SCREEN HINTS ============

  // Priority 1: Assign unassigned birds to empty surveyor slots
  {
    id: 'assign-to-surveyor',
    screen: 'wilds',
    check: () => {
      // Include birds in collection AND birds on perches (which are available for assignment)
      const availableBirds = gameState.specimens.filter(bird => {
        const isOnPerch = bird.location.startsWith('perch_');
        const isInCollection = bird.location === 'collection';
        return (isInCollection || isOnPerch) && bird.vitalityPercent > 0;
      });
      if (availableBirds.length === 0) return false;

      // Check if any biome has empty surveyor
      for (const biome of gameState.biomes) {
        if (biome.unlocked && !biome.survey.surveyorId) {
          return true;
        }
      }
      return false;
    },
    apply: () => {
      for (const biome of gameState.biomes) {
        if (biome.unlocked && !biome.survey.surveyorId) {
          return document.querySelector(`.biome-card[data-biome-id="${biome.id}"] .surveyor-label`);
        }
      }
      return null;
    }
  },

  // Priority 2: Assign unassigned birds to empty forager slots
  {
    id: 'assign-to-forager',
    screen: 'wilds',
    check: () => {
      // Include birds in collection AND birds on perches (which are available for assignment)
      const availableBirds = gameState.specimens.filter(bird => {
        const isOnPerch = bird.location.startsWith('perch_');
        const isInCollection = bird.location === 'collection';
        return (isInCollection || isOnPerch) && bird.vitalityPercent > 0;
      });
      if (availableBirds.length === 0) return false;

      // Check if any biome has empty unlocked forager
      for (const biome of gameState.biomes) {
        if (!biome.unlocked) continue;
        for (let i = 0; i < biome.foragers.length; i++) {
          if (biome.foragers[i].unlocked && !biome.foragers[i].birdId) {
            return true;
          }
        }
      }
      return false;
    },
    apply: () => {
      for (const biome of gameState.biomes) {
        if (!biome.unlocked) continue;
        for (let i = 0; i < biome.foragers.length; i++) {
          if (biome.foragers[i].unlocked && !biome.foragers[i].birdId) {
            return document.querySelector(`.bird-slot[data-biome-id="${biome.id}"][data-slot-type="forager"][data-slot-index="${i}"] .slot-label`);
          }
        }
      }
      return null;
    }
  },

  // Priority 3: Need birds for empty slots (surveyor or forager)
  {
    id: 'need-birds-for-empty-slots',
    screen: 'wilds',
    check: () => {
      // Include birds in collection AND birds on perches (which are available for assignment)
      const availableBirds = gameState.specimens.filter(bird => {
        const isOnPerch = bird.location.startsWith('perch_');
        const isInCollection = bird.location === 'collection';
        return (isInCollection || isOnPerch) && bird.vitalityPercent > 0;
      });
      if (availableBirds.length > 0) return false; // Already have birds with energy (covered by priority 1-2)

      // Check if we have any empty slots (surveyor or forager)
      for (const biome of gameState.biomes) {
        if (!biome.unlocked) continue;

        // Check surveyor
        if (!biome.survey.surveyorId) return true;

        // Check foragers
        for (let i = 0; i < biome.foragers.length; i++) {
          if (biome.foragers[i].unlocked && !biome.foragers[i].birdId) {
            return true;
          }
        }
      }
      return false;
    },
    apply: () => {
      // Check if we have depleted birds that need rest instead of getting new birds
      const depletedBirds = gameState.specimens.filter(bird =>
        bird.location === 'collection' && bird.vitalityPercent <= 0
      );

      if (depletedBirds.length > 0) {
        // Check if there's actually an available perch (unlocked and either empty or with bird at 100% energy)
        const hasAvailablePerch = gameState.perches.some(perch => {
          if (!perch.unlocked) return false;
          if (!perch.birdId) return true; // Empty perch

          const perchedBird = getBirdById(perch.birdId);
          return perchedBird && perchedBird.vitalityPercent >= 100; // Fully rested bird (can swap)
        });

        // Only navigate to sanctuary if there's an available perch
        if (hasAvailablePerch) {
          return document.querySelector('.nav-button[data-screen="sanctuary"]');
        }
        // If all perches are busy recharging, don't highlight sanctuary - fall through to survey
      }

      // Otherwise pulse survey to get more birds
      return findBestSurveyTap();
    }
  },

  // Priority 4: Can afford next unlock (forager slot or biome)
  {
    id: 'unlock-ready',
    screen: 'wilds',
    check: () => {
      const nextUnlock = findNextUnlock();
      if (!nextUnlock) return false;
      return gameState.seeds >= nextUnlock.cost && nextUnlock.hasRequiredBird;
    },
    apply: () => {
      const nextUnlock = findNextUnlock();
      if (!nextUnlock) return null;
      if (gameState.seeds >= nextUnlock.cost && nextUnlock.hasRequiredBird) {
        return document.querySelector(nextUnlock.selector);
      }
      return null;
    }
  },

  // Priority 5: Need higher rarity birds for biome unlock
  {
    id: 'need-birds-for-unlock',
    screen: 'wilds',
    check: () => {
      const nextUnlock = findNextUnlock();
      if (!nextUnlock) return false;
      return !nextUnlock.hasRequiredBird;
    },
    apply: () => {
      return findBestSurveyTap();
    }
  },

  // Priority 6: Need seeds for next unlock
  {
    id: 'need-seeds-for-unlock',
    screen: 'wilds',
    check: () => {
      const nextUnlock = findNextUnlock();
      if (!nextUnlock) return false;
      return gameState.seeds < nextUnlock.cost;
    },
    apply: () => {
      // Try forager first
      const forager = findBestForagerTap();
      if (forager) return forager;

      // Fallback to survey
      return findBestSurveyTap();
    }
  },

  // ============ SANCTUARY SCREEN HINTS ============

  // Priority 1: Groom birds on perches that aren't at 100% energy
  {
    id: 'groom-depleted-bird',
    screen: 'sanctuary',
    check: () => {
      // Check if any perched bird has less than 100% vitality
      for (const perch of gameState.perches) {
        if (!perch.birdId) continue;
        const bird = getBirdById(perch.birdId);
        if (bird && bird.vitalityPercent < 100) {
          return true;
        }
      }
      return false;
    },
    apply: () => {
      // Find first perch with depleted bird
      for (const perch of gameState.perches) {
        if (!perch.birdId) continue;
        const bird = getBirdById(perch.birdId);
        if (bird && bird.vitalityPercent < 100) {
          const selector = `.perch-card[data-slot="${perch.slot}"] .perch-restore-btn`;
          const groomBtn = document.querySelector(selector);
          if (groomBtn) return groomBtn;
        }
      }
      return null;
    }
  },

  // Priority 2: Swap out depleted birds - assign depleted bird to empty perch
  {
    id: 'assign-depleted-to-perch',
    screen: 'sanctuary',
    check: () => {
      // Check if we have depleted birds in collection
      const depletedBirds = gameState.specimens.filter(bird =>
        bird.location === 'collection' && bird.vitalityPercent < 100
      );
      if (depletedBirds.length === 0) return false;

      // Check if we have a rested bird on a perch we could swap
      for (const perch of gameState.perches) {
        if (!perch.unlocked) continue;
        if (!perch.birdId) return true; // Empty perch available

        const perchedBird = getBirdById(perch.birdId);
        if (perchedBird && perchedBird.vitalityPercent >= 100) {
          return true; // Can swap this rested bird out
        }
      }
      return false;
    },
    apply: () => {
      // Find first perch that's either empty or has a fully rested bird
      for (const perch of gameState.perches) {
        if (!perch.unlocked) continue;

        if (!perch.birdId) {
          // Empty perch - highlight assign button
          const assignBtn = document.querySelector(`.perch-card[data-slot="${perch.slot}"] .perch-empty-label`);
          if (assignBtn) return assignBtn;
        } else {
          const perchedBird = getBirdById(perch.birdId);
          if (perchedBird && perchedBird.vitalityPercent >= 100) {
            // Fully rested bird - highlight bird name to swap
            const birdNameBtn = document.querySelector(`.perch-card[data-slot="${perch.slot}"] .perch-bird-name`);
            if (birdNameBtn) return birdNameBtn;
          }
        }
      }
      return null;
    }
  },

  // Priority 3: Mature birds on perches
  {
    id: 'mature-perched-bird',
    screen: 'sanctuary',
    check: () => {
      // Check if any perched bird can be matured
      for (const perch of gameState.perches) {
        if (!perch.birdId) continue;
        const bird = getBirdById(perch.birdId);
        if (bird && !bird.isMature) {
          return true;
        }
      }
      return false;
    },
    apply: () => {
      // Find first perch with immature bird
      for (const perch of gameState.perches) {
        if (!perch.birdId) continue;
        const bird = getBirdById(perch.birdId);
        if (bird && !bird.isMature) {
          const matureBtn = document.querySelector(`.perch-card[data-slot="${perch.slot}"] .perch-mature-btn`);
          if (matureBtn) return matureBtn;
        }
      }
      return null;
    }
  },

  // Priority 4: Mature birds in collection
  {
    id: 'mature-collection-bird',
    screen: 'sanctuary',
    check: () => {
      // Check if any collection bird can be matured and we have seeds
      const immatureBirds = gameState.specimens.filter(bird =>
        bird.location === 'collection' && !bird.isMature
      );
      return immatureBirds.length > 0 && gameState.seeds >= 100;
    },
    apply: () => {
      // Find first immature bird in collection view
      const collectionSection = document.querySelector('.collection-section');
      if (!collectionSection) return null;

      const matureBtn = collectionSection.querySelector('.collection-mature-btn');
      return matureBtn;
    }
  },

  // ============ HATCHERY SCREEN HINTS ============

  // (Placeholder - will add hatchery hints later)
];

// ========================================
// MAIN HINT FUNCTIONS
// ========================================

// Track currently active hint to prevent unnecessary re-renders
let currentHintId = null;
let currentHintElement = null;

// Show appropriate hint for current screen
export function showHint(screenName) {
  // Don't show hints during early tutorial
  if (isTutorialActive() && getCurrentTutorialStep() < TUTORIAL_STEPS.FREE_PLAY) {
    return;
  }

  // Don't show hints if tutorial arrow is active (prevents flashing/conflict)
  if (isArrowVisible()) {
    // Clear any existing hints to prevent conflict with arrow
    if (currentHintId !== null) {
      clearAllHints();
    }
    return;
  }

  // Find first matching hint for this screen
  for (const hint of HINT_REGISTRY) {
    // Check if hint applies to this screen
    if (hint.screen !== screenName && hint.screen !== 'any') {
      continue;
    }

    // Check if hint condition is met
    if (!hint.check()) {
      continue;
    }

    // If this is the same hint that's already active, check if element still exists in DOM
    if (currentHintId === hint.id) {
      if (currentHintElement && document.body.contains(currentHintElement)) {
        return;
      }
      // Element was destroyed, need to re-apply
    }

    // Apply hint (highlight element)
    const element = hint.apply();
    if (element) {
      // Clear previous hint and apply new one
      clearAllHints();
      element.classList.add('hint-glow');
      currentHintId = hint.id;
      currentHintElement = element;
      return;
    }
  }

  // No matching hint found - clear all hints
  if (currentHintId !== null) {
    clearAllHints();
    currentHintId = null;
    currentHintElement = null;
  }
}

// Clear all hint highlights
export function clearAllHints() {
  const elements = document.querySelectorAll('.hint-glow');
  if (elements.length > 0) {
    elements.forEach(el => {
      el.classList.remove('hint-glow');
    });
    // Reset tracking when manually cleared
    currentHintId = null;
    currentHintElement = null;
  }
}

// Re-evaluate hints for current screen
export function reevaluateCurrentScreenHints() {
  // Determine current screen
  const wildsScreen = document.getElementById('screen-wilds');
  const sanctuaryScreen = document.getElementById('screen-sanctuary');
  const hatcheryScreen = document.getElementById('screen-hatchery');

  if (wildsScreen?.classList.contains('active')) {
    showHint('wilds');
  } else if (sanctuaryScreen?.classList.contains('active')) {
    showHint('sanctuary');
  } else if (hatcheryScreen?.classList.contains('active')) {
    showHint('hatchery');
  }
}

// ========================================
// HELPER FUNCTIONS
// ========================================

// Find the next unlock (forager slot or biome)
function findNextUnlock() {
  if (!gameState) return null;

  // Check forager slots in unlocked biomes first
  for (const biome of gameState.biomes) {
    if (!biome.unlocked) continue;

    for (let i = 0; i < biome.foragers.length; i++) {
      const forager = biome.foragers[i];
      if (!forager.unlocked) {
        return {
          type: 'forager',
          biomeId: biome.id,
          slotIndex: i,
          cost: forager.unlockCost,
          hasRequiredBird: true, // Forager slots don't need special birds
          selector: `.bird-slot.locked[data-biome-id="${biome.id}"][data-slot-type="forager"][data-slot-index="${i}"]`
        };
      }
    }
  }

  // Check next biome unlock
  for (const biome of gameState.biomes) {
    if (!biome.unlocked) {
      const seedCost = UNLOCK_COSTS.biomeUnlock?.[biome.id] || 0;
      const hasRequiredBird = gameState.specimens.some(
        bird => bird.distinction >= biome.unlockRequirement
      );

      return {
        type: 'biome',
        biomeId: biome.id,
        cost: seedCost,
        hasRequiredBird: hasRequiredBird,
        requiredStars: biome.unlockRequirement,
        selector: `.biome-card[data-biome-id="${biome.id}"] .unlock-biome-btn`
      };
    }
  }

  return null;
}

// Find best survey slot to tap
function findBestSurveyTap() {
  // Prioritize surveys with incomplete progress
  for (const biome of gameState.biomes) {
    if (!biome.unlocked) continue;

    const totalCost = SURVEY_COSTS[biome.id] || 360;
    if (biome.survey.progress < totalCost) {
      const surveySlot = document.querySelector(`.biome-card[data-biome-id="${biome.id}"] .surveyor-slot`);
      if (surveySlot) {
        return surveySlot;
      }
    }
  }

  return null;
}

// Find best forager slot to tap
function findBestForagerTap() {
  let highestForager = null;
  let highestIncome = 0;

  for (const biome of gameState.biomes) {
    if (!biome.unlocked) continue;

    for (let i = 0; i < biome.foragers.length; i++) {
      const forager = biome.foragers[i];
      if (forager.unlocked && forager.birdId) {
        const income = calculateForagerSlotIncome(biome.id, i, forager.birdId);
        if (income > highestIncome) {
          highestIncome = income;
          highestForager = { biomeId: biome.id, slotIndex: i };
        }
      }
    }
  }

  if (highestForager) {
    const iconWrapper = document.querySelector(`.bird-slot[data-biome-id="${highestForager.biomeId}"][data-slot-type="forager"][data-slot-index="${highestForager.slotIndex}"] .forager-icon-wrapper`);
    return iconWrapper;
  }

  return null;
}
