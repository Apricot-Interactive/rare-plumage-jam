// SANCTUARY - Tutorial System
// Manages the step-by-step onboarding tutorial for new players

import { gameState, saveGame, getBirdById } from '../core/state.js';
import { showTutorialModal, showBirdCelebrationModal, hideTutorialModal } from '../ui/modals.js';
import { showTutorialArrow, hideTutorialArrow, isArrowVisible } from '../ui/tutorialArrow.js';
import { createSpecimen } from '../data/species.js';
import { updateWildsUI } from '../ui/wilds.js';
import { updateSanctuaryUI } from '../ui/sanctuary.js';
import { updateHatcheryUI } from '../ui/hatchery.js';

// Tutorial step constants
export const TUTORIAL_STEPS = {
  INTRO: 0,
  FIRST_SURVEY: 1,
  BIRD_CELEBRATION: 2,
  FORAGER_ASSIGNMENT: 3,
  SELECT_BIRD: 4,
  MANUAL_TAPPING: 5,
  SANCTUARY_UNLOCK: 6,
  GROOMING: 7,
  SYSTEMS_REVIEW: 8,
  FREE_PLAY: 9,
  HATCHERY_UNLOCK: 10,
  BREEDING_TUTORIAL: 11,
  COMPLETION: 12
};

// Check if tutorial is active
export function isTutorialActive() {
  return gameState && gameState.tutorialActive && !gameState.tutorialCompleted;
}

// Get current tutorial step
export function getCurrentTutorialStep() {
  if (!isTutorialActive()) return null;
  return gameState.tutorialStep;
}

// Initialize tutorial (called on game start)
export function initTutorial() {
  if (!isTutorialActive()) return;

  console.log('Tutorial active, starting at step:', gameState.tutorialStep);

  // Start with the intro modal
  if (gameState.tutorialStep === TUTORIAL_STEPS.INTRO) {
    setTimeout(() => {
      showTutorialStep(TUTORIAL_STEPS.INTRO);
    }, 500);
  } else {
    // Resume tutorial at current step
    resumeTutorialStep(gameState.tutorialStep);
  }
}

// Show a specific tutorial step
function showTutorialStep(step) {
  console.log('showTutorialStep called with step:', step);

  switch (step) {
    case TUTORIAL_STEPS.INTRO:
      console.log('Showing INTRO modal');
      showTutorialModal(
        'Only silence as far as you can hear. Did anything survive?',
        'italic',
        () => {
          hideTutorialModal();
          advanceTutorial(TUTORIAL_STEPS.FIRST_SURVEY);
        }
      );
      break;

    case TUTORIAL_STEPS.FIRST_SURVEY:
      console.log('Showing FIRST_SURVEY arrow');
      // Arrow points to forest surveyor slot (the tree button)
      showTutorialArrow('.biome-card[data-biome-id="forest"] .surveyor-slot', 'up');
      break;

    case TUTORIAL_STEPS.BIRD_CELEBRATION:
      console.log('BIRD_CELEBRATION step (handled elsewhere)');
      // This is called when the bird is spawned
      break;

    case TUTORIAL_STEPS.FORAGER_ASSIGNMENT:
      console.log('Showing FORAGER_ASSIGNMENT arrow');
      const selector = '.biome-card[data-biome-id="forest"] .bird-slot[data-slot-index="0"][data-slot-type="forager"] .slot-label';
      console.log('Looking for selector:', selector);
      const element = document.querySelector(selector);
      console.log('Element found:', element);
      // Arrow points to forager slot label (the "Forage?" button below the circle)
      showTutorialArrow(selector, 'down');
      break;

    case TUTORIAL_STEPS.SELECT_BIRD:
      console.log('SELECT_BIRD step - arrow should appear when modal opens');
      // Arrow will be shown when the bird selection modal opens
      break;

    case TUTORIAL_STEPS.MANUAL_TAPPING:
      showTutorialModal(
        'You\'re bringing me seeds. I can help too.',
        'bold',
        () => {
          hideTutorialModal();
          // Arrow points to the large forager icon wrapper (the circle itself)
          showTutorialArrow('.biome-card[data-biome-id="forest"] .bird-slot[data-slot-index="0"][data-slot-type="forager"] .forager-icon-wrapper', 'down');
        }
      );
      break;

    case TUTORIAL_STEPS.SANCTUARY_UNLOCK:
      // Arrow will appear when player has 125 seeds
      break;

    case TUTORIAL_STEPS.GROOMING:
      showTutorialModal(
        'You can rest in the sanctuary, Jay',
        'bold',
        () => {
          hideTutorialModal();
          console.log('GROOMING modal closed, updating sanctuary UI');
          // Update sanctuary UI to ensure perch is rendered
          updateSanctuaryUI();
          console.log('Sanctuary UI updated, waiting to show arrow');
          // Arrow points to assign guest button (already on sanctuary screen)
          // Longer delay to ensure DOM is laid out
          setTimeout(() => {
            const selector = '.perch-card[data-slot="0"] .perch-empty-label';
            console.log('Looking for element with selector:', selector);
            const element = document.querySelector(selector);
            console.log('Element found:', element);
            if (element) {
              console.log('Element rect:', element.getBoundingClientRect());
            }
            showTutorialArrow(selector, 'down');
          }, 500);
        }
      );
      break;

    case TUTORIAL_STEPS.SYSTEMS_REVIEW:
      showTutorialModal(
        'Let\'s see. FORAGE for seeds. SURVEY for more birds. REST them in the sanctuary. I need 1000 seeds before I can expand my program. I can do this.',
        'italic',
        () => {
          hideTutorialModal();
          advanceTutorial(TUTORIAL_STEPS.FREE_PLAY);
        }
      );
      break;

    case TUTORIAL_STEPS.FREE_PLAY:
      // Auto-unassign jay from perch so hint system can guide player
      const perch0 = gameState.perches.find(p => p.slot === 0);
      if (perch0 && perch0.birdId) {
        const jay = getBirdById(perch0.birdId);
        if (jay) {
          jay.location = 'collection';
          perch0.birdId = null;
          perch0.assignedAt = null;
          console.log('Tutorial: Auto-unassigned jay from perch for free play');
        }
      }

      // Show arrow pointing to hatchery lock immediately
      setTimeout(() => {
        showTutorialArrow('.nav-button[data-screen="hatchery"]', 'down');
      }, 300);
      break;

    case TUTORIAL_STEPS.HATCHERY_UNLOCK:
      showTutorialModal(
        'Our sanctuary is growing. It\'s time to restart the breeding program.',
        'italic',
        () => {
          hideTutorialModal();
          advanceTutorial(TUTORIAL_STEPS.BREEDING_TUTORIAL);
        }
      );
      break;

    case TUTORIAL_STEPS.BREEDING_TUTORIAL:
      // Check if already on hatchery, otherwise wait for navigation
      const hatcheryScreen = document.getElementById('screen-hatchery');
      if (hatcheryScreen && hatcheryScreen.classList.contains('active')) {
        // Arrow points to Parent 1
        setTimeout(() => {
          showTutorialArrow('.breeding-program[data-program="0"] .parent-slot:first-child .parent-action-btn', 'down');
        }, 300);
      }
      // If not on hatchery, arrow will appear when player navigates there (via updateHatcheryUI)
      break;

    case TUTORIAL_STEPS.COMPLETION:
      showTutorialModal(
        'OK that\'s everything from the manual. Remember - 5 habitats. 5 artifacts. 5 legendary guardians. I can do this. I can save them. I can save us.',
        'italic',
        () => {
          hideTutorialModal();
          completeTutorial();
        }
      );
      break;
  }
}

// Resume tutorial at a specific step
function resumeTutorialStep(step) {
  // This is called when loading a save mid-tutorial
  // We need to show the appropriate UI state
  showTutorialStep(step);
}

// Advance to next tutorial step
export function advanceTutorial(nextStep) {
  if (!isTutorialActive()) {
    console.log('Tutorial not active, cannot advance');
    return;
  }

  console.log('Advancing tutorial from step', gameState.tutorialStep, 'to step', nextStep);

  gameState.tutorialStep = nextStep;
  saveGame();

  console.log('Tutorial advanced to step:', nextStep);

  // Hide any existing arrows
  hideTutorialArrow();

  // Update all UIs FIRST
  updateWildsUI();
  updateSanctuaryUI();
  updateHatcheryUI();

  // Update navigation display
  import('../main.js').then(module => {
    if (module.updateNavigationDisplay) {
      module.updateNavigationDisplay();
    }
  });

  // Show next step AFTER a delay to allow DOM to be created and laid out
  // This is crucial for steps that need to point arrows at newly created elements
  setTimeout(() => {
    showTutorialStep(nextStep);
  }, 100);
}

// Complete the tutorial
function completeTutorial() {
  if (!gameState) return;

  gameState.tutorialCompleted = true;
  gameState.tutorialActive = false;
  saveGame();

  console.log('Tutorial completed!');

  // Update all UIs to show full functionality
  updateWildsUI();
  updateSanctuaryUI();
  updateHatcheryUI();
}

// Handle first survey completion (spawns Forest Jay)
export function handleFirstSurveyComplete() {
  if (!isTutorialActive()) return false;
  if (gameState.tutorialStep !== TUTORIAL_STEPS.FIRST_SURVEY) return false;

  // Hide arrow
  hideTutorialArrow();

  // Create guaranteed Forest Jay (1 star)
  const forestJay = createSpecimen('forest', 1, null, false);
  forestJay.speciesName = 'Forest Jay';
  forestJay.traits = ['alacrity']; // Ensure it has alacrity

  gameState.specimens.push(forestJay);

  // Add to catalogued species
  if (!gameState.cataloguedSpecies.includes('Forest Jay')) {
    gameState.cataloguedSpecies.push('Forest Jay');
  }

  saveGame();

  // Show celebration modal
  setTimeout(() => {
    console.log('Showing bird celebration modal for Forest Jay');
    showBirdCelebrationModal(forestJay, () => {
      console.log('Bird celebration modal Next clicked');
      hideTutorialModal();
      console.log('Modal hidden, advancing to FORAGER_ASSIGNMENT step');
      // advanceTutorial will update UI and then show the arrow after a delay
      advanceTutorial(TUTORIAL_STEPS.FORAGER_ASSIGNMENT);
    });
  }, 300);

  return true;
}

// Handle forager assignment during tutorial
export function handleForagerAssignment(biomeId, slot) {
  if (!isTutorialActive()) return;

  if (gameState.tutorialStep === TUTORIAL_STEPS.SELECT_BIRD) {
    if (biomeId === 'forest' && slot === 0) {
      // Hide arrow
      hideTutorialArrow();

      // Update UI to show the assigned bird
      updateWildsUI();

      // Advance to manual tapping step (with small delay for UI to render)
      setTimeout(() => {
        advanceTutorial(TUTORIAL_STEPS.MANUAL_TAPPING);
      }, 300);
    }
  }
}

// Handle manual tap during tutorial
export function handleManualTap() {
  if (!isTutorialActive()) return;

  if (gameState.tutorialStep === TUTORIAL_STEPS.MANUAL_TAPPING) {
    // Hide arrow on first tap
    hideTutorialArrow();

    // Advance to sanctuary unlock when player has 125 seeds
    if (gameState.seeds >= 125) {
      advanceTutorial(TUTORIAL_STEPS.SANCTUARY_UNLOCK);
    }
  }
}

// Check if sanctuary unlock should be shown
export function checkSanctuaryUnlock() {
  if (!isTutorialActive()) return;

  if (gameState.tutorialStep === TUTORIAL_STEPS.MANUAL_TAPPING && gameState.seeds >= 125) {
    advanceTutorial(TUTORIAL_STEPS.SANCTUARY_UNLOCK);
  }

  if (gameState.tutorialStep === TUTORIAL_STEPS.SANCTUARY_UNLOCK && gameState.seeds >= 125) {
    // Show arrow pointing to sanctuary lock (only if not already visible)
    if (!isArrowVisible()) {
      showTutorialArrow('.nav-button[data-screen="sanctuary"]', 'down');
    }
  }
}

// Handle sanctuary unlock
export function handleSanctuaryUnlock() {
  if (!isTutorialActive()) return;

  if (gameState.tutorialStep === TUTORIAL_STEPS.SANCTUARY_UNLOCK) {
    // Deduct seeds
    import('../core/state.js').then(stateModule => {
      stateModule.spendSeeds(125);
    });

    gameState.sanctuaryUnlocked = true;

    // Unassign jay from forager slot to avoid "already in use" prompt
    const forestBiome = gameState.biomes.find(b => b.id === 'forest');
    if (forestBiome && forestBiome.foragers[0].birdId) {
      const jayId = forestBiome.foragers[0].birdId;
      const jay = getBirdById(jayId);
      if (jay) {
        forestBiome.foragers[0].birdId = null;
        forestBiome.foragers[0].assignedAt = null;
        forestBiome.foragers[0].accumulatedSeeds = 0;
        jay.location = 'collection';
        // Set jay's vitality to 50% to demonstrate grooming
        jay.vitalityPercent = 50;
      }
    }

    // Set Forest survey to 85% complete (153/180) to give player a head start
    if (forestBiome && forestBiome.survey) {
      forestBiome.survey.progress = 153;
    }

    saveGame();

    // Hide arrow
    hideTutorialArrow();

    // Navigate to sanctuary screen
    document.querySelector('.nav-button[data-screen="sanctuary"]').click();

    // Show grooming tutorial modal after navigation
    setTimeout(() => {
      advanceTutorial(TUTORIAL_STEPS.GROOMING);
    }, 500);
  }
}

// Handle perch assignment during tutorial
export function handlePerchAssignment(slot) {
  if (!isTutorialActive()) return;

  if (gameState.tutorialStep === TUTORIAL_STEPS.GROOMING && slot === 0) {
    // Hide arrow
    hideTutorialArrow();

    // Show arrow pointing to brush icon
    setTimeout(() => {
      showTutorialArrow('.perch-card[data-slot="0"] .perch-restore-btn', 'down');
    }, 500);
  }
}

// Handle manual restore during tutorial
export function handleManualRestore() {
  if (!isTutorialActive()) return;

  if (gameState.tutorialStep === TUTORIAL_STEPS.GROOMING) {
    // Track brush taps
    if (!gameState.tutorialBrushTaps) {
      gameState.tutorialBrushTaps = 0;
    }
    gameState.tutorialBrushTaps++;

    console.log(`Brush taps: ${gameState.tutorialBrushTaps}/5`);

    // Require at least 5 taps before advancing
    if (gameState.tutorialBrushTaps >= 5) {
      // Hide arrow
      hideTutorialArrow();

      // Reset counter
      gameState.tutorialBrushTaps = 0;

      // Show systems review modal
      setTimeout(() => {
        advanceTutorial(TUTORIAL_STEPS.SYSTEMS_REVIEW);
      }, 500);
    }
  }
}

// Check if hatchery unlock should be shown
export function checkHatcheryUnlock() {
  if (!isTutorialActive()) return;

  if (gameState.tutorialStep === TUTORIAL_STEPS.FREE_PLAY && gameState.seeds >= 1000) {
    // Show arrow pointing to hatchery lock (only if not already visible)
    if (!isArrowVisible()) {
      showTutorialArrow('.nav-button[data-screen="hatchery"]', 'down');
    }
  }
}

// Handle hatchery unlock
export function handleHatcheryUnlock() {
  if (!isTutorialActive()) return;

  if (gameState.tutorialStep === TUTORIAL_STEPS.FREE_PLAY) {
    gameState.hatcheryUnlocked = true;
    saveGame();

    // Hide arrow
    hideTutorialArrow();

    // Show hatchery unlock modal
    setTimeout(() => {
      advanceTutorial(TUTORIAL_STEPS.HATCHERY_UNLOCK);
    }, 500);
  }
}

// Handle parent assignment during tutorial
export function handleParentAssignment(program, parentNum) {
  if (!isTutorialActive()) return;

  if (gameState.tutorialStep === TUTORIAL_STEPS.BREEDING_TUTORIAL && program === 0 && parentNum === 1) {
    // Hide arrow
    hideTutorialArrow();

    // Check if bird is mature
    const breedingProgram = gameState.breedingPrograms[0];
    const birdId = breedingProgram.lineage1Id;
    const bird = getBirdById(birdId);

    if (bird && !bird.isMature) {
      // Show maturity modal
      setTimeout(() => {
        showTutorialModal(
          'You need to get a little bigger first. Here, eat these seeds.',
          'bold',
          () => {
            hideTutorialModal();
            // Show arrow pointing to maturity button
            setTimeout(() => {
              showTutorialArrow('.breeding-program[data-program="0"] .parent-slot:first-child .maturity-btn', 'down');
            }, 300);
          }
        );
      }, 500);
    }
  }
}

// Handle maturity increase during tutorial
export function handleMaturityIncrease() {
  if (!isTutorialActive()) return;

  if (gameState.tutorialStep === TUTORIAL_STEPS.BREEDING_TUTORIAL) {
    // Hide arrow
    hideTutorialArrow();
  }
}

// Handle breeding completion during tutorial
export function handleBreedingComplete() {
  if (!isTutorialActive()) return;

  if (gameState.tutorialStep === TUTORIAL_STEPS.BREEDING_TUTORIAL) {
    // Advance to completion (will show modal)
    setTimeout(() => {
      advanceTutorial(TUTORIAL_STEPS.COMPLETION);
    }, 500);
  }
}

// Generic milestone celebrations (called outside tutorial)
export function showBiomeUnlockCelebration(biomeName) {
  if (isTutorialActive()) return; // Don't show during tutorial

  showTutorialModal(
    `Congratulations on unlocking the ${biomeName} biome!`,
    'bold',
    () => hideTutorialModal()
  );
}

export function showStarRarityCelebration(stars) {
  if (isTutorialActive()) return; // Don't show during tutorial

  showTutorialModal(
    `Congratulations on unlocking a ${stars} star bird!`,
    'bold',
    () => hideTutorialModal()
  );
}
