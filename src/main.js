// SANCTUARY - Main Entry Point
import './styles.css';
import { GAME_CONFIG, BIOMES, ENERGY_CAPACITY } from './core/constants.js';
import { initializeState, saveGame, resetGameState, gameState, addSeeds } from './core/state.js';
import { startGameLoop, startUILoop } from './core/gameLoop.js';
import { initWildsUI, updateWildsUI, checkWildsHints } from './ui/wilds.js';
import { initSanctuaryUI, updateSanctuaryUI, checkSanctuaryHints } from './ui/sanctuary.js';
import { initHatcheryUI, updateHatcheryUI, checkHatcheryHints } from './ui/hatchery.js';
import { createSpecimen } from './data/species.js';
import { formatOfflineTime } from './systems/offline.js';
import { initTutorial, isTutorialActive, getCurrentTutorialStep, TUTORIAL_STEPS } from './systems/tutorial.js';

console.log('SANCTUARY - Initializing...');
console.log('Version:', GAME_CONFIG.VERSION);

document.addEventListener('DOMContentLoaded', () => {
  init();
});

function init() {
  // Initialize game state
  initializeState();

  // Initialize UI
  initNavigation();
  initWildsUI();
  initSanctuaryUI();
  initHatcheryUI();
  initSettings();

  // Initialize tutorial if active
  if (isTutorialActive()) {
    initTutorial();
  }

  // Show offline progress modal if there was any progress (skip if tutorial active)
  if (window.offlineProgressData && !isTutorialActive()) {
    setTimeout(() => {
      showOfflineProgressModal(window.offlineProgressData);
      delete window.offlineProgressData;
    }, 500); // Delay to ensure UI is ready
  }

  // Start game loops
  startGameLoop();
  startUILoop();

  // Enable auto-save every 5 seconds
  setInterval(() => {
    saveGame();
  }, GAME_CONFIG.AUTO_SAVE_INTERVAL);

  console.log('Game initialized successfully!');
}

function initNavigation() {
  const navButtons = document.querySelectorAll('.nav-button');
  const screens = document.querySelectorAll('.screen');

  navButtons.forEach(button => {
    button.addEventListener('click', () => {
      const targetScreen = button.dataset.screen;

      // Check if locked during tutorial
      if (isTutorialActive()) {
        const currentStep = getCurrentTutorialStep();

        // During GROOMING step, prevent navigation away from sanctuary
        if (currentStep === TUTORIAL_STEPS.GROOMING && targetScreen !== 'sanctuary') {
          return;
        }

        if (targetScreen === 'sanctuary' && !gameState.sanctuaryUnlocked) {
          // Try to unlock sanctuary
          if (gameState.seeds >= 125) {
            import('./systems/tutorial.js').then(module => {
              module.handleSanctuaryUnlock();
            });
          }
          return;
        }
        if (targetScreen === 'hatchery' && !gameState.hatcheryUnlocked) {
          // Try to unlock hatchery
          if (gameState.seeds >= 400) {
            import('./systems/tutorial.js').then(module => {
              module.handleHatcheryUnlock();
            });
          } else {
            // Show message if not enough seeds
            import('./ui/modals.js').then(modalModule => {
              modalModule.showTutorialModal(
                'You don\'t have enough seeds - gather more in the wilds',
                'bold',
                () => {
                  modalModule.hideTutorialModal();
                  // Show arrow pointing to Wilds tab after message closes
                  import('./ui/tutorialArrow.js').then(arrowModule => {
                    setTimeout(() => {
                      arrowModule.showTutorialArrow('.nav-button[data-screen="wilds"]', 'down');
                    }, 300);
                  });
                }
              );
            });
          }
          return;
        }
      }

      // Update nav buttons
      navButtons.forEach(btn => btn.classList.remove('active'));
      button.classList.add('active');

      // Update screens
      screens.forEach(screen => {
        screen.classList.remove('active');
        if (screen.id === `screen-${targetScreen}`) {
          screen.classList.add('active');
        }
      });

      // Hide tutorial arrow when navigating (player took action)
      if (isTutorialActive()) {
        import('./ui/tutorialArrow.js').then(arrowModule => {
          arrowModule.hideTutorialArrow();
        });
      }

      // Update UI for the active screen
      if (targetScreen === 'wilds') {
        updateWildsUI();
        checkWildsHints(); // Start hint timer
      } else if (targetScreen === 'sanctuary') {
        updateSanctuaryUI();
        checkSanctuaryHints(); // Start hint timer
      } else if (targetScreen === 'hatchery') {
        updateHatcheryUI();
        checkHatcheryHints(); // Start hint timer
      }
    });
  });

  // Update nav button display based on tutorial state
  updateNavigationDisplay();

  // Set initial screen based on sanctuary unlock status
  setInitialScreen();
}

function setInitialScreen() {
  const navButtons = document.querySelectorAll('.nav-button');
  const screens = document.querySelectorAll('.screen');

  // Default to Sanctuary if unlocked, otherwise Wilds
  const defaultScreen = gameState.sanctuaryUnlocked ? 'sanctuary' : 'wilds';

  // Update nav buttons
  navButtons.forEach(btn => {
    if (btn.dataset.screen === defaultScreen) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });

  // Update screens
  screens.forEach(screen => {
    if (screen.id === `screen-${defaultScreen}`) {
      screen.classList.add('active');
    } else {
      screen.classList.remove('active');
    }
  });

  // Update UI for the active screen
  if (defaultScreen === 'wilds') {
    updateWildsUI();
    checkWildsHints();
  } else if (defaultScreen === 'sanctuary') {
    updateSanctuaryUI();
  }
}

// Update navigation button display during tutorial
// Track last state to avoid spamming console logs
let lastNavState = { sanctuary: null, hatchery: null };

export function updateNavigationDisplay() {
  const sanctuaryBtn = document.querySelector('.nav-button[data-screen="sanctuary"]');
  const hatcheryBtn = document.querySelector('.nav-button[data-screen="hatchery"]');

  if (!isTutorialActive()) {
    // Normal display
    if (sanctuaryBtn) sanctuaryBtn.textContent = 'Sanctuary';
    if (hatcheryBtn) hatcheryBtn.textContent = 'Hatchery';
    return;
  }

  // Tutorial mode - show locks with simple text (no div wrapper)
  const sanctuaryState = gameState.sanctuaryUnlocked ? 'unlocked' : 'locked';
  const hatcheryState = gameState.hatcheryUnlocked ? 'unlocked' : 'locked';

  // Only log when state changes
  if (lastNavState.sanctuary !== sanctuaryState || lastNavState.hatchery !== hatcheryState) {
    console.log('updateNavigationDisplay:', {
      sanctuary: sanctuaryState,
      hatchery: hatcheryState
    });
    lastNavState = { sanctuary: sanctuaryState, hatchery: hatcheryState };
  }

  if (sanctuaryBtn && !gameState.sanctuaryUnlocked) {
    sanctuaryBtn.textContent = '🔒 125 🫘';
    sanctuaryBtn.style.fontSize = '12px';
    sanctuaryBtn.style.textTransform = 'none';
  } else if (sanctuaryBtn) {
    sanctuaryBtn.textContent = 'Sanctuary';
    sanctuaryBtn.style.fontSize = '';
    sanctuaryBtn.style.textTransform = '';
  }

  if (hatcheryBtn && !gameState.hatcheryUnlocked) {
    hatcheryBtn.textContent = '🔒 400 🫘';
    hatcheryBtn.style.fontSize = '12px';
    hatcheryBtn.style.textTransform = 'none';
  } else if (hatcheryBtn) {
    hatcheryBtn.textContent = 'Hatchery';
    hatcheryBtn.style.fontSize = '';
    hatcheryBtn.style.textTransform = '';
  }
}

function initSettings() {
  const settingsBtn = document.getElementById('settings-btn');
  const modal = document.getElementById('modal-overlay');
  const content = document.getElementById('modal-content');

  settingsBtn.addEventListener('click', () => {
    showSettingsModal();
  });
}

// CHEAT - DO NOT SHIP: Track biome progression for spawn cheats
let cheatBiomeIndex = 0;

function showSettingsModal() {
  const modal = document.getElementById('modal-overlay');
  const content = document.getElementById('modal-content');

  content.innerHTML = `
    <h3>Settings</h3>

    <!-- CHEAT BUTTONS - DO NOT SHIP -->
    <div class="settings-section">
      <h4 style="color: #ff4444; font-size: 12px; margin-bottom: 10px;">⚠️ CHEATS - DO NOT SHIP</h4>
      <div class="cheat-buttons">
        <button id="cheat-add-seeds" class="cheat-btn" title="Add 1,000,000 Seeds">
          🫘🫘🫘
        </button>
        <button id="cheat-max-birds" class="cheat-btn" title="Max all birds vitality & maturity">
          💯
        </button>
      </div>
      <div class="cheat-buttons" style="margin-top: 10px;">
        <button id="cheat-spawn-1star" class="cheat-btn" title="Spawn 1⭐ bird">1⭐</button>
        <button id="cheat-spawn-2star" class="cheat-btn" title="Spawn 2⭐ bird">2⭐</button>
        <button id="cheat-spawn-3star" class="cheat-btn" title="Spawn 3⭐ bird">3⭐</button>
        <button id="cheat-spawn-4star" class="cheat-btn" title="Spawn 4⭐ bird">4⭐</button>
        <button id="cheat-spawn-5star" class="cheat-btn" title="Spawn 5⭐ bird">5⭐</button>
      </div>
    </div>

    <div class="settings-options">
      <button id="reset-account-btn" class="settings-option-btn danger-btn">
        <span class="option-icon">🔄</span>
        <span class="option-content">
          <span class="option-title">Reset Account</span>
          <span class="option-subtitle">Start over with a new game</span>
        </span>
      </button>
    </div>
    <div class="modal-actions">
      <button id="close-settings-btn">Close</button>
    </div>
  `;

  modal.classList.remove('hidden');

  // CHEAT - DO NOT SHIP: Add seeds cheat
  content.querySelector('#cheat-add-seeds').addEventListener('click', () => {
    cheatAddSeeds();
  });

  // CHEAT - DO NOT SHIP: Max birds cheat
  content.querySelector('#cheat-max-birds').addEventListener('click', () => {
    cheatMaxBirds();
  });

  // CHEAT - DO NOT SHIP: Spawn bird cheats
  for (let i = 1; i <= 5; i++) {
    content.querySelector(`#cheat-spawn-${i}star`).addEventListener('click', () => {
      cheatSpawnBird(i);
    });
  }

  // Handle reset account
  content.querySelector('#reset-account-btn').addEventListener('click', () => {
    showResetConfirmation();
  });

  // Handle close
  content.querySelector('#close-settings-btn').addEventListener('click', () => {
    modal.classList.add('hidden');
  });
}

function showResetConfirmation() {
  const modal = document.getElementById('modal-overlay');
  const content = document.getElementById('modal-content');

  content.innerHTML = `
    <h3>⚠️ Reset Account?</h3>
    <div class="confirmation-message">
      <p><strong>Are you sure you want to reset your account?</strong></p>
      <p>This will delete all your progress, birds, and resources. This action cannot be undone!</p>
    </div>
    <div class="modal-actions">
      <button id="confirm-reset-btn" class="danger-btn">Yes, Reset Everything</button>
      <button id="cancel-reset-btn">Cancel</button>
    </div>
  `;

  // Handle confirm
  content.querySelector('#confirm-reset-btn').addEventListener('click', () => {
    // Clear any tutorial arrows first
    import('./ui/tutorialArrow.js').then(module => {
      module.hideTutorialArrow();
    });

    resetGameState();

    console.log('Game reset successfully! Reloading page...');

    // Force refresh the page to ensure clean state
    window.location.reload();
  });

  // Handle cancel - go back to settings
  content.querySelector('#cancel-reset-btn').addEventListener('click', () => {
    showSettingsModal();
  });
}

// ========================================
// CHEAT FUNCTIONS - DO NOT SHIP
// ========================================

// CHEAT - DO NOT SHIP: Add 1,000,000 seeds
function cheatAddSeeds() {
  if (!gameState) return;

  addSeeds(1000000);
  saveGame();

  console.log('CHEAT: Added 1,000,000 seeds');

  // Update all UIs
  updateWildsUI();
  updateSanctuaryUI();
  updateHatcheryUI();
}

// CHEAT - DO NOT SHIP: Set all birds to 100% vitality and mature
function cheatMaxBirds() {
  if (!gameState) return;

  let count = 0;
  gameState.specimens.forEach(bird => {
    const maxEnergy = ENERGY_CAPACITY[bird.distinction] || ENERGY_CAPACITY[1];
    bird.vitality = maxEnergy;  // Set to full energy
    bird.vitalityPercent = 100;
    bird.isMature = true;
    bird.maturityProgress = 100;
    bird.restoreCooldownUntil = 0;
    count++;
  });

  saveGame();

  console.log(`CHEAT: Maxed ${count} birds (full vitality + mature)`);

  // Update all UIs
  updateWildsUI();
  updateSanctuaryUI();
  updateHatcheryUI();
}

// CHEAT - DO NOT SHIP: Spawn a bird of specified distinction
function cheatSpawnBird(distinction) {
  if (!gameState) return;

  // Get next biome in rotation
  const biomes = BIOMES.map(b => b.id);
  const biome = biomes[cheatBiomeIndex % biomes.length];
  cheatBiomeIndex++;

  // Create specimen with random traits
  const newBird = createSpecimen(biome, distinction, null, false);

  if (newBird) {
    gameState.specimens.push(newBird);

    // Add to catalogued species if new
    if (!gameState.cataloguedSpecies.includes(newBird.speciesName)) {
      gameState.cataloguedSpecies.push(newBird.speciesName);
    }

    saveGame();

    console.log(`CHEAT: Spawned ${distinction}⭐ ${newBird.speciesName} (${biome})`);

    // Update all UIs
    updateWildsUI();
    updateSanctuaryUI();
    updateHatcheryUI();
  }
}

// ========================================
// END CHEAT FUNCTIONS
// ========================================

// ========================================
// OFFLINE PROGRESS MODAL
// ========================================

function showOfflineProgressModal(data) {
  const { seedsEarned, surveysCompleted, breedingsCompleted, timeAway } = data;
  const modal = document.getElementById('modal-overlay');
  const content = document.getElementById('modal-content');

  const timeAwayStr = formatOfflineTime(timeAway);

  let progressSummary = [];
  if (seedsEarned > 0) {
    progressSummary.push(`<div class="offline-stat">💰 ${seedsEarned.toLocaleString()} Seeds earned</div>`);
  }
  if (surveysCompleted > 0) {
    progressSummary.push(`<div class="offline-stat">🔍 ${surveysCompleted} Survey${surveysCompleted > 1 ? 's' : ''} completed</div>`);
  }
  if (breedingsCompleted > 0) {
    progressSummary.push(`<div class="offline-stat">🥚 ${breedingsCompleted} Bird${breedingsCompleted > 1 ? 's' : ''} hatched</div>`);
  }

  const summaryHTML = progressSummary.length > 0
    ? progressSummary.join('')
    : '<div class="offline-stat">No significant progress</div>';

  content.innerHTML = `
    <h3>⏱️ Welcome Back!</h3>
    <div class="offline-summary">
      <div class="offline-time">You were away for <strong>${timeAwayStr}</strong></div>
      <div class="offline-stats">
        ${summaryHTML}
      </div>
    </div>
    <div class="modal-actions">
      <button id="continue-btn" class="primary-btn">Continue</button>
    </div>
  `;

  modal.classList.remove('hidden');

  content.querySelector('#continue-btn').addEventListener('click', () => {
    modal.classList.add('hidden');
  });
}
