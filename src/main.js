// SANCTUARY - Main Entry Point
import './styles.css';
import { GAME_CONFIG } from './core/constants.js';

// Game will be initialized here
console.log('SANCTUARY - Initializing...');
console.log('Version:', GAME_CONFIG.VERSION);

// Basic navigation for Stage 0 verification
document.addEventListener('DOMContentLoaded', () => {
  initNavigation();
});

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
    });
  });
}
