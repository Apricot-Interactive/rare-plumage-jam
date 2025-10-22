// SANCTUARY - Main Entry Point
import './styles.css';
import { GAME_CONFIG, BIOMES } from './core/constants.js';
import { initializeState, saveGame, resetGameState, gameState, addSeeds } from './core/state.js';
import { startGameLoop, startUILoop } from './core/gameLoop.js';
import { initWildsUI, updateWildsUI } from './ui/wilds.js';
import { initSanctuaryUI, updateSanctuaryUI } from './ui/sanctuary.js';
import { initHatcheryUI, updateHatcheryUI } from './ui/hatchery.js';
import { createSpecimen } from './data/species.js';

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
  initOrientationLock();

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

      // Update UI for the active screen
      if (targetScreen === 'wilds') {
        updateWildsUI();
      } else if (targetScreen === 'sanctuary') {
        updateSanctuaryUI();
      } else if (targetScreen === 'hatchery') {
        updateHatcheryUI();
      }
    });
  });
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
    resetGameState();
    modal.classList.add('hidden');

    // Refresh all UI
    updateWildsUI();
    updateSanctuaryUI();
    updateHatcheryUI();

    console.log('Game reset successfully!');
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
    bird.vitalityPercent = 100;
    bird.isMature = true;
    bird.restoreCooldownUntil = 0;
    count++;
  });

  saveGame();

  console.log(`CHEAT: Maxed ${count} birds (100% vitality + mature)`);

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

function initOrientationLock() {
  const overlay = document.getElementById('orientation-overlay');

  function checkOrientation() {
    const isMobile = window.innerWidth <= 768;
    const isLandscape = window.innerWidth > window.innerHeight;

    if (isMobile && isLandscape) {
      overlay.classList.remove('hidden');
    } else {
      overlay.classList.add('hidden');
    }
  }

  window.addEventListener('resize', checkOrientation);
  window.addEventListener('orientationchange', checkOrientation);
  checkOrientation();
}
