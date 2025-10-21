// SANCTUARY - Game Loop
import { GAME_CONFIG } from './constants.js';
import { gameState, addSeeds } from './state.js';
import { calculateForagerIncome, updateForagerVitality } from '../systems/foragers.js';
import { updateSurveyProgress } from '../systems/surveys.js';
import { updateGrooming } from '../systems/sanctuary.js';
import { updateBreedingProgress } from '../systems/breeding.js';
import { updateForagerVitalityUI, updateSurveyProgressUI } from '../ui/wilds.js';
import { updatePerchCooldowns } from '../ui/sanctuary.js';
import { updateBreedingProgressBars } from '../ui/hatchery.js';

let lastFrameTime = Date.now();
let gameLoopId = null;
let uiLoopId = null;

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
    updateBreedingProgressBars();

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

function updateSeedsDisplay() {
  const seedsElement = document.getElementById('seeds-amount');
  if (seedsElement && gameState) {
    seedsElement.textContent = Math.floor(gameState.seeds).toLocaleString();
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
