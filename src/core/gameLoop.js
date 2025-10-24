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
import { reevaluateCurrentScreenHints } from '../systems/hints.js';
import { isTutorialActive, checkSanctuaryUnlock, checkHatcheryUnlock } from '../systems/tutorial.js';

let lastFrameTime = Date.now();
let gameLoopId = null;
let uiLoopId = null;
let lastFloatingTextTime = Date.now();
let lastHintCheckTime = Date.now();
const FLOATING_TEXT_INTERVAL = 1000; // Show floating text every 1 second
const HINT_CHECK_INTERVAL = 2000; // Re-evaluate hints every 2 seconds

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

    // Check for hints (initial check when screen becomes active)
    checkWildsHints();

    // Re-evaluate hints every 2 seconds (to catch passive income changes)
    const now = Date.now();
    if (now - lastHintCheckTime >= HINT_CHECK_INTERVAL) {
      reevaluateCurrentScreenHints();
      lastHintCheckTime = now;
    }

    // Show floating text for forager income every second
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
let lastNavUpdateTime = 0;
const NAV_UPDATE_THROTTLE = 500; // Only update nav every 500ms to prevent spam

function updateSeedsDisplay() {
  const seedsElement = document.getElementById('seeds-amount');
  if (seedsElement && gameState) {
    seedsElement.textContent = Math.floor(gameState.seeds).toLocaleString();
  }

  // Update tutorial navigation display when seeds change (only if amount changed)
  if (isTutorialActive() && Math.floor(gameState.seeds) !== lastSeedsValue) {
    const oldValue = lastSeedsValue;
    lastSeedsValue = Math.floor(gameState.seeds);

    // Throttle navigation updates to prevent spam (only update every 500ms)
    const now = Date.now();
    if (now - lastNavUpdateTime >= NAV_UPDATE_THROTTLE) {
      lastNavUpdateTime = now;
      import('../main.js').then(module => {
        if (module.updateNavigationDisplay) {
          module.updateNavigationDisplay();
        }
      });
    }

    // Check for sanctuary/hatchery unlock milestones
    checkSanctuaryUnlock();
    checkHatcheryUnlock();

    // Debug: Log when crossing 400 seeds
    if (oldValue < 400 && lastSeedsValue >= 400) {
      console.log('💰 CROSSED 400 SEEDS THRESHOLD');
    }
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
