// SANCTUARY - Main Entry Point
import './styles.css';
import { GAME_CONFIG } from './core/constants.js';
import { initializeState, saveGame } from './core/state.js';
import { startGameLoop, startUILoop } from './core/gameLoop.js';
import { initWildsUI, updateWildsUI } from './ui/wilds.js';

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
      }
    });
  });
}
