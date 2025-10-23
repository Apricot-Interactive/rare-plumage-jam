// SANCTUARY - Game Loop
import { GAME_CONFIG } from './constants.js';
import { gameState, addSeeds } from './state.js';
import { calculateForagerIncome, updateForagerVitality } from '../systems/foragers.js';
import { updateSurveyProgress } from '../systems/surveys.js';
import { updateGrooming } from '../systems/sanctuary.js';
import { updateBreedingProgress } from '../systems/breeding.js';
import { updateForagerVitalityUI, updateSurveyProgressUI, showForagerIncomeFloatingText, checkWildsHints } from '../ui/wilds.js';
import { updatePerchCooldowns, updatePerchVitalityBars } from '../ui/sanctuary.js';
import { updateBreedingProgressBars } from '../ui/hatchery.js';
import { isTutorialActive, checkSanctuaryUnlock, checkHatcheryUnlock } from '../systems/tutorial.js';

let lastFrameTime = Date.now();
let gameLoopId = null;
let uiLoopId = null;
let lastFloatingTextTime = Date.now();
const FLOATING_TEXT_INTERVAL = 1000; // Show floating text every 1 second

export function startGameLoop() {
  if (gameLoopId) return; // Already running

  console.log('Starting game loop at 60fps');

  function loop() {
    const now = Date.now();
    const deltaTime = now - lastFrameTime;
    lastFrameTime = now;

    // Update game systems
    updateGameSystems(deltaTime);

    // Schedule next frame
    gameLoopId = requestAnimationFrame(loop);
  }

  loop();
}

export function startUILoop() {
  if (uiLoopId) return; // Already running

  console.log('Starting UI loop at 10fps');

  const interval = 1000 / GAME_CONFIG.UI_LOOP_FPS;

  function updateUI() {
    if (!gameState) return;

    // Update only dynamic parts (no full re-render)
    updateSeedsDisplay();
    updateForagerVitalityUI();
    updateSurveyProgressUI();
    updatePerchCooldowns();
    updatePerchVitalityBars();
    updateBreedingProgressBars();

    // Check for hints
    checkWildsHints();

    // Show floating text for forager income every second
    const now = Date.now();
    if (now - lastFloatingTextTime >= FLOATING_TEXT_INTERVAL) {
      showForagerIncomeFloatingText();
      lastFloatingTextTime = now;
    }

    // Schedule next update
    uiLoopId = setTimeout(updateUI, interval);
  }

  updateUI();
}

function updateGameSystems(deltaTime) {
  if (!gameState) return;

  // Update vitality drain for foragers
  updateForagerVitality(deltaTime);

  // Update vitality restore for perches
  updateGrooming(deltaTime);

  // Calculate and accumulate forager income
  const income = calculateForagerIncome();
  if (income > 0) {
    const seedsEarned = income * (deltaTime / 1000);
    addSeeds(seedsEarned);
  }

  // Update survey progress (assistants auto-observe)
  updateSurveyProgress(deltaTime);

  // Update breeding incubation progress
  updateBreedingProgress(deltaTime);
}

let lastSeedsValue = 0;

function updateSeedsDisplay() {
  const seedsElement = document.getElementById('seeds-amount');
  if (seedsElement && gameState) {
    seedsElement.textContent = Math.floor(gameState.seeds).toLocaleString();
  }

  // Update tutorial navigation display when seeds change (only if amount changed)
  if (isTutorialActive() && Math.floor(gameState.seeds) !== lastSeedsValue) {
    lastSeedsValue = Math.floor(gameState.seeds);

    import('../main.js').then(module => {
      if (module.updateNavigationDisplay) {
        module.updateNavigationDisplay();
      }
    });

    // Check for sanctuary/hatchery unlock milestones
    checkSanctuaryUnlock();
    checkHatcheryUnlock();
  }
}

export function stopGameLoop() {
  if (gameLoopId) {
    cancelAnimationFrame(gameLoopId);
    gameLoopId = null;
  }
}

export function stopUILoop() {
  if (uiLoopId) {
    clearTimeout(uiLoopId);
    uiLoopId = null;
  }
}
