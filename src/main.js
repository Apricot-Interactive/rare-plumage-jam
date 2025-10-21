// SANCTUARY - Main Entry Point
import './styles.css';
import { GAME_CONFIG } from './core/constants.js';
import { initializeState, saveGame, resetGameState } from './core/state.js';
import { startGameLoop, startUILoop } from './core/gameLoop.js';
import { initWildsUI, updateWildsUI } from './ui/wilds.js';
import { initSanctuaryUI, updateSanctuaryUI } from './ui/sanctuary.js';
import { initHatcheryUI, updateHatcheryUI } from './ui/hatchery.js';

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

function showSettingsModal() {
  const modal = document.getElementById('modal-overlay');
  const content = document.getElementById('modal-content');

  content.innerHTML = `
    <h3>Settings</h3>
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
