// SANCTUARY - Wilds UI (Biome-based)
import { gameState, getBirdById, addSeeds } from '../core/state.js';
import { assignForager, unassignForager, unlockForagerSlot, calculateForagerSlotIncome } from '../systems/foragers.js';
import { observeSurvey, assignSurveyor, unassignSurveyor, getBiomeTapRate, unlockBiome } from '../systems/surveys.js';
import { canPrestige, performPrestige, getPrestigeWarningMessage, PRESTIGE_COST } from '../systems/prestige.js';
import { RARITY, FORAGER_INCOME, TRAITS, ASSISTANT_TAP_RATE, UNLOCK_COSTS, SURVEY_COSTS, FORAGER_BASE_RATES, ENERGY_CAPACITY } from '../core/constants.js';
import { updateSanctuaryUI } from './sanctuary.js';
import { showHint, clearAllHints, reevaluateCurrentScreenHints } from '../systems/hints.js';
import { getBirdSpritePath } from '../utils/sprites.js';
import {
  isTutorialActive,
  getCurrentTutorialStep,
  TUTORIAL_STEPS,
  handleFirstSurveyComplete,
  handleForagerAssignment,
  handleManualTap,
  checkSanctuaryUnlock
} from '../systems/tutorial.js';

// Celebration overlay function - now fits within biome rectangle
export function showSurveyCelebration(newBird, biomeId) {
  const biomeCard = document.querySelector(`.biome-card[data-biome-id="${biomeId}"]`);
  if (!biomeCard) return;

  const overlay = document.createElement('div');
  overlay.className = 'celebration-overlay biome-celebration';
  overlay.innerHTML = `
    <div class="celebration-content biome-content">
      <div class="celebration-header">🎉 New Discovery!</div>
      <div class="bird-discovery-info">
        <img src="${getBirdSpritePath(newBird)}" class="celebration-bird-img-small" />
        <div class="bird-details">
          <div class="bird-name">${newBird.speciesName}</div>
          <div class="bird-rarity">${RARITY[newBird.distinction]?.stars || ''}</div>
          <div class="bird-traits">${newBird.traits.map(t => TRAITS[t]?.name || t).join(', ')}</div>
        </div>
      </div>
    </div>
  `;

  biomeCard.style.position = 'relative';
  biomeCard.appendChild(overlay);

  let fadeTimeout;
  let isFading = false;
  const createdAt = Date.now();

  // Function to fade out the overlay
  const fadeOut = () => {
    if (isFading) return; // Already fading
    isFading = true;
    clearTimeout(fadeTimeout); // Clear auto-fade timer
    overlay.style.transition = 'opacity 1s';
    overlay.style.opacity = '0';
    setTimeout(() => {
      overlay.remove();
      updateWildsUI();
    }, 1000);
  };

  // Click to dismiss (but ignore taps in first 500ms to prevent accidental dismissal)
  overlay.addEventListener('click', () => {
    const elapsed = Date.now() - createdAt;
    if (elapsed < 500) return; // Ignore early taps
    fadeOut();
  });

  // Auto-fade after 4 seconds
  fadeTimeout = setTimeout(fadeOut, 4000);
}

export function initWildsUI() {
  renderBiomes();
}

// Full re-render (only call when assignments change)
export function updateWildsUI() {
  clearAllHints(); // Clear hints when UI updates (player took action)
  renderBiomes();
  // Restart hint timer
  lastScreenCheck = null;
  hintShown = false;
  checkWildsHints();
}

// Selective updates for real-time changes
export function updateForagerVitalityUI() {
  if (!gameState) return;

  gameState.biomes.forEach(biome => {
    biome.foragers.forEach((forager, slotIndex) => {
      if (!forager.birdId) return;

      const bird = getBirdById(forager.birdId);
      if (!bird) return;

      const wrapper = document.querySelector(`.bird-slot[data-biome-id="${biome.id}"][data-slot-type="forager"][data-slot-index="${slotIndex}"]`);
      if (!wrapper) return;

      const vitalityRingFill = wrapper.querySelector('.vitality-ring-fill');
      if (vitalityRingFill) {
        const vitalityPercent = bird.vitalityPercent;
        // Using same radii as modal: r=31, circumference = 195
        vitalityRingFill.style.strokeDashoffset = `${195 - (195 * vitalityPercent / 100)}`;
      }

      const maturityRingFill = wrapper.querySelector('.maturity-ring-fill');
      if (maturityRingFill) {
        const maturityPercent = bird.isMature ? 100 : 0;
        // Using same radii as modal: r=25, circumference = 157
        maturityRingFill.style.strokeDashoffset = `${157 - (157 * maturityPercent / 100)}`;
      }
    });

    // Update surveyor vitality too (uses perch-sized rings)
    if (biome.survey.surveyorId) {
      const bird = getBirdById(biome.survey.surveyorId);
      if (!bird) return;

      const wrapper = document.querySelector(`.surveyor-slot[data-biome-id="${biome.id}"]`);
      if (!wrapper) return;

      const vitalityRingFill = wrapper.querySelector('.vitality-ring-fill');
      if (vitalityRingFill) {
        const vitalityPercent = bird.vitalityPercent;
        // Using perch-sized rings: r=42, circumference = 264
        vitalityRingFill.style.strokeDashoffset = `${264 - (264 * vitalityPercent / 100)}`;
      }

      const maturityRingFill = wrapper.querySelector('.maturity-ring-fill');
      if (maturityRingFill) {
        const maturityPercent = bird.isMature ? 100 : 0;
        // Using perch-sized rings: r=38, circumference = 239
        maturityRingFill.style.strokeDashoffset = `${239 - (239 * maturityPercent / 100)}`;
      }
    }
  });
}

export function updateSurveyProgressUI() {
  if (!gameState) return;

  gameState.biomes.forEach(biome => {
    const biomeCard = document.querySelector(`.biome-card[data-biome-id="${biome.id}"]`);
    if (!biomeCard) return;

    const totalCost = SURVEY_COSTS[biome.id] || 360;
    const progressPercent = Math.min(100, (biome.survey.progress / totalCost) * 100);

    const progressFill = biomeCard.querySelector('.progress-bar-fill');
    if (progressFill) {
      progressFill.style.width = `${progressPercent}%`;
    }

    const progressText = biomeCard.querySelector('.progress-text');
    if (progressText) {
      const current = Math.floor(biome.survey.progress);
      progressText.textContent = `${current.toLocaleString()} / ${totalCost.toLocaleString()}`;
    }
  });
}

function renderBiomes() {
  const container = document.getElementById('wilds-container');
  if (!container || !gameState) return;

  container.innerHTML = '';

  // During tutorial, only show Forest biome
  const tutorialActive = isTutorialActive();
  const tutorialStep = getCurrentTutorialStep();

  // Find first locked biome index
  const firstLockedIndex = gameState.biomes.findIndex(b => !b.unlocked);

  gameState.biomes.forEach((biome, index) => {
    // During tutorial before FREE_PLAY, only show Forest biome
    if (tutorialActive && tutorialStep < TUTORIAL_STEPS.FREE_PLAY && biome.id !== 'forest') {
      return;
    }

    // Show unlocked biomes + first locked biome only
    if (biome.unlocked || index === firstLockedIndex) {
      const biomeCard = createBiomeCard(biome, index);
      container.appendChild(biomeCard);
    }
  });

  // Show prestige card if Tundra is unlocked (not during tutorial)
  const tundra = gameState.biomes.find(b => b.id === 'tundra');
  if (tundra && tundra.unlocked && !tutorialActive) {
    const prestigeCard = createPrestigeCard();
    container.appendChild(prestigeCard);
  }
}

function createBiomeCard(biome, index) {
  const card = document.createElement('div');
  card.className = `biome-card ${biome.unlocked ? 'unlocked' : 'locked'}`;
  card.dataset.biomeId = biome.id;

  if (!biome.unlocked) {
    // Show locked biome - lock icon on left 1/3, info on right 2/3
    const hasRequiredBird = gameState.specimens.some(
      bird => bird.distinction >= biome.unlockRequirement
    );
    const seedCost = UNLOCK_COSTS.biomeUnlock[biome.id] || 0;
    const canAfford = gameState.seeds >= seedCost;

    card.innerHTML = `
      <div class="biome-locked-content">
        <div class="biome-locked-left">
          <div class="lock-icon">🔒</div>
        </div>
        <div class="biome-locked-right">
          <h3>${biome.name}</h3>
          <div class="unlock-requirement">${RARITY[biome.unlockRequirement].stars} Bird Required</div>
          <div class="unlock-requirement">${seedCost.toLocaleString()} 🫘</div>
          ${hasRequiredBird && canAfford ? `<button class="unlock-biome-btn">Unlock Biome</button>` : ''}
        </div>
      </div>
    `;

    if (hasRequiredBird && canAfford) {
      const unlockBtn = card.querySelector('.unlock-biome-btn');
      unlockBtn.addEventListener('click', () => {
        if (unlockBiome(biome.id)) {
          renderBiomes();
        }
      });
    }

    return card;
  }

  // Unlocked biome - show full UI
  const totalCost = SURVEY_COSTS[biome.id] || 360;
  const progressPercent = Math.min(100, (biome.survey.progress / totalCost) * 100);
  const currentProgress = Math.floor(biome.survey.progress);

  // Tutorial: Hide foragers until after bird celebration (step 3+)
  const tutorialActive = isTutorialActive();
  const tutorialStep = getCurrentTutorialStep();
  const hideForagers = tutorialActive && tutorialStep < TUTORIAL_STEPS.FORAGER_ASSIGNMENT;

  card.innerHTML = `
    <div class="biome-header">
      <h3>${biome.name}</h3>
    </div>
    <div class="biome-body">
      <div class="forager-row ${hideForagers ? 'tutorial-hidden' : ''}">
        ${createForagerSlotHTML(biome, 0)}
        ${createForagerSlotHTML(biome, 1)}
        ${createForagerSlotHTML(biome, 2)}
      </div>
      <div class="survey-row">
        ${createSurveySlotHTML(biome)}
      </div>
    </div>
  `;

  // Attach event listeners
  attachBiomeEventListeners(card, biome);

  return card;
}

function createPrestigeCard() {
  const card = document.createElement('div');
  card.className = 'biome-card prestige-card';

  const message = getPrestigeWarningMessage();
  if (!message) return card;

  // Check requirements separately
  const perchedBirdCount = gameState.perches.filter(p => p.birdId !== null).length;
  const hasEnoughBirds = perchedBirdCount >= 5;
  const canAfford = gameState.seeds >= PRESTIGE_COST;
  const formattedCost = PRESTIGE_COST.toLocaleString();

  // Show button if has enough birds (even if can't afford yet)
  if (hasEnoughBirds) {
    card.innerHTML = `
      <div class="prestige-content">
        <h3 class="prestige-title">Artifact Expedition</h3>
        <div class="prestige-subtitle">Unlock ${message.crystalName} Crystal</div>
        <button class="prestige-btn" ${!canAfford ? 'disabled' : ''}>
          ${canAfford ? `Launch Expedition (${formattedCost} 🫘)` : `Need ${formattedCost} 🫘`}
        </button>
      </div>
    `;

    const button = card.querySelector('.prestige-btn');
    if (canAfford) {
      button.addEventListener('click', () => {
        showPrestigeConfirmation();
      });
    }
  } else {
    // Not enough birds yet
    const remaining = Math.max(0, 5 - perchedBirdCount);

    card.innerHTML = `
      <div class="prestige-content locked">
        <h3 class="prestige-title">Artifact Expedition</h3>
        <div class="prestige-requirement">
          Select 5 birds by placing them on perches in the Sanctuary
        </div>
      </div>
    `;
  }

  return card;
}

function showPrestigeConfirmation() {
  const modal = document.getElementById('modal-overlay');
  const content = document.getElementById('modal-content');
  const message = getPrestigeWarningMessage();

  if (!message) return;

  content.innerHTML = `
    <h3>${message.title}</h3>
    <div class="prestige-warning">
      <div class="prestige-crystal-preview">
        <div class="crystal-icon-large">💎</div>
        <div class="crystal-name">${message.crystalName} Crystal</div>
      </div>
      <pre class="prestige-warning-text">${message.warning}</pre>
    </div>
    <div class="modal-actions">
      <button id="confirm-prestige-btn" class="primary-btn danger-btn">Confirm Expedition</button>
      <button id="cancel-prestige-btn">Cancel</button>
    </div>
  `;

  modal.classList.remove('hidden');

  content.querySelector('#confirm-prestige-btn').addEventListener('click', () => {
    if (performPrestige()) {
      modal.classList.add('hidden');
      // Refresh all UIs after prestige
      updateWildsUI();
      updateSanctuaryUI();
    }
  });

  content.querySelector('#cancel-prestige-btn').addEventListener('click', () => {
    modal.classList.add('hidden');
  });
}

function createForagerSlotHTML(biome, slotIndex) {
  const forager = biome.foragers[slotIndex];
  const bird = forager.birdId ? getBirdById(forager.birdId) : null;

  if (!forager.unlocked) {
    return `
      <div class="bird-slot locked" data-biome-id="${biome.id}" data-slot-type="forager" data-slot-index="${slotIndex}">
        <div class="forager-icon-wrapper">
          <div class="lock-icon-small">🔒</div>
        </div>
        <div class="slot-label">${forager.unlockCost.toLocaleString()}</div>
      </div>
    `;
  }

  if (!bird) {
    return `
      <div class="bird-slot empty" data-biome-id="${biome.id}" data-slot-type="forager" data-slot-index="${slotIndex}">
        <div class="forager-icon-wrapper">
          <svg class="bird-rings" viewBox="0 0 100 100">
            <circle class="frame-ring empty-frame" cx="50" cy="50" r="37" />
          </svg>
          <div class="forager-empty-icon">🫘</div>
        </div>
        <div class="slot-label">Forage?</div>
      </div>
    `;
  }

  const vitalityPercent = bird.vitalityPercent;
  const maturityPercent = bird.isMature ? 100 : 0;
  // Using same radii as modal: r=37, r=31, r=25
  const vitalityStrokeOffset = 195 - (195 * vitalityPercent / 100);
  const maturityStrokeOffset = 157 - (157 * maturityPercent / 100);

  return `
    <div class="bird-slot active" data-biome-id="${biome.id}" data-slot-type="forager" data-slot-index="${slotIndex}">
      <div class="forager-icon-wrapper">
        <svg class="bird-rings" viewBox="0 0 100 100">
          <circle class="frame-ring" cx="50" cy="50" r="37" />
          <circle class="vitality-ring-bg" cx="50" cy="50" r="31" />
          <circle class="vitality-ring-fill" cx="50" cy="50" r="31" style="stroke-dashoffset: ${vitalityStrokeOffset}" />
          <circle class="maturity-ring-bg" cx="50" cy="50" r="25" />
          <circle class="maturity-ring-fill" cx="50" cy="50" r="25" style="stroke-dashoffset: ${maturityStrokeOffset}" />
        </svg>
        <img src="${getBirdSpritePath(bird)}" alt="${bird.speciesName}" class="forager-bird-icon" />
      </div>
      <div class="slot-label">${bird.customDesignation || bird.speciesName}</div>
    </div>
  `;
}

function createSurveySlotHTML(biome) {
  const survey = biome.survey;
  const surveyor = survey.surveyorId ? getBirdById(survey.surveyorId) : null;
  const totalCost = SURVEY_COSTS[biome.id] || 360;
  const progressPercent = Math.min(100, (survey.progress / totalCost) * 100);
  const currentProgress = Math.floor(survey.progress);

  let surveyorIconHTML = '';
  if (surveyor) {
    const vitalityPercent = surveyor.vitalityPercent;
    const maturityPercent = surveyor.isMature ? 100 : 0;
    // Using perch-sized rings: r=46, r=42, r=38
    const vitalityStrokeOffset = 264 - (264 * vitalityPercent / 100);
    const maturityStrokeOffset = 239 - (239 * maturityPercent / 100);

    surveyorIconHTML = `
      <div class="surveyor-icon-wrapper">
        <svg class="bird-rings" viewBox="0 0 100 100">
          <circle class="frame-ring" cx="50" cy="50" r="46" />
          <circle class="vitality-ring-bg" cx="50" cy="50" r="42" />
          <circle class="vitality-ring-fill" cx="50" cy="50" r="42" style="stroke-dashoffset: ${vitalityStrokeOffset}" />
          <circle class="maturity-ring-bg" cx="50" cy="50" r="38" />
          <circle class="maturity-ring-fill" cx="50" cy="50" r="38" style="stroke-dashoffset: ${maturityStrokeOffset}" />
        </svg>
        <img src="${getBirdSpritePath(surveyor)}" alt="${surveyor.speciesName}" class="surveyor-bird-icon" />
      </div>
    `;
  } else {
    surveyorIconHTML = `
      <div class="surveyor-icon-wrapper">
        <svg class="bird-rings" viewBox="0 0 100 100">
          <circle class="frame-ring empty-frame" cx="50" cy="50" r="46" />
        </svg>
        <div class="surveyor-empty-icon">🔭</div>
      </div>
    `;
  }

  return `
    <div class="survey-section">
      <div class="surveyor-slot ${surveyor ? 'active' : 'empty'}" data-biome-id="${biome.id}" data-slot-type="surveyor">
        ${surveyorIconHTML}
      </div>
      <div class="survey-progress-section">
        <div class="survey-label">Survey Progress</div>
        <div class="progress-bar">
          <div class="progress-bar-fill" style="width: ${progressPercent}%"></div>
        </div>
        <div class="progress-text">${currentProgress.toLocaleString()} / ${totalCost.toLocaleString()}</div>
        <div class="surveyor-label slot-label">${surveyor ? (surveyor.customDesignation || surveyor.speciesName) : 'Survey?'}</div>
      </div>
    </div>
  `;
}

function attachBiomeEventListeners(card, biome) {
  // Forager slot icons and labels
  card.querySelectorAll('[data-slot-type="forager"]').forEach(slotEl => {
    const slotIndex = parseInt(slotEl.dataset.slotIndex);
    const forager = biome.foragers[slotIndex];
    const iconWrapper = slotEl.querySelector('.forager-icon-wrapper');
    const label = slotEl.querySelector('.slot-label');

    if (!forager.unlocked) {
      // Locked slot - click anywhere to unlock
      slotEl.addEventListener('click', () => {
        if (unlockForagerSlot(biome.id, slotIndex)) {
          renderBiomes();
          // Re-evaluate hints after unlocking (may need to assign bird to new slot)
          setTimeout(() => {
            reevaluateCurrentScreenHints();
          }, 100);
        }
      });
    } else {
      // Icon wrapper = manual tap for seeds (adds 5 seconds of gathering)
      if (iconWrapper) {
        iconWrapper.addEventListener('click', (e) => {
          e.stopPropagation();

          // Tutorial: Disable manual tapping until tutorial step 4 (MANUAL_TAPPING)
          const tutorialActive = isTutorialActive();
          const tutorialStep = getCurrentTutorialStep();
          if (tutorialActive && tutorialStep < TUTORIAL_STEPS.MANUAL_TAPPING) {
            return; // Don't allow manual tapping yet
          }

          // Check if bird has no energy
          if (forager.birdId) {
            const bird = getBirdById(forager.birdId);
            if (bird && bird.vitalityPercent <= 0) {
              // Show popup and unassign bird
              import('./modals.js').then(modalModule => {
                modalModule.showTutorialModal(
                  'This bird is out of energy and needs to rest in the Sanctuary!',
                  'bold',
                  () => {
                    modalModule.hideTutorialModal();
                  }
                );
              });
              // Unassign the exhausted bird
              unassignForager(biome.id, slotIndex);
              updateWildsUI();
              return;
            }
          }

          let seeds = 0;
          if (forager.birdId) {
            // If bird assigned, calculate based on bird stats
            seeds = calculateForagerSlotIncome(biome.id, slotIndex, forager.birdId) * 5;

            // Deduct 2 energy points from the bird
            const bird = getBirdById(forager.birdId);
            if (bird) {
              const maxEnergy = ENERGY_CAPACITY[bird.distinction] || ENERGY_CAPACITY[1];

              // Ensure bird has vitality field (migration safety)
              if (bird.vitality === undefined) {
                bird.vitality = (bird.vitalityPercent / 100) * maxEnergy;
              }

              const beforePercent = bird.vitalityPercent;
              bird.vitality = Math.max(0, bird.vitality - 2);
              bird.vitalityPercent = (bird.vitality / maxEnergy) * 100;

              console.log(`⚡ FORAGER TAP: ${bird.distinction}⭐ ${beforePercent.toFixed(1)}% → ${bird.vitalityPercent.toFixed(1)}% (${maxEnergy} max)`);
            }
          } else {
            // If no bird, give base rate * 5 seconds
            const baseRate = FORAGER_BASE_RATES[biome.id]?.[slotIndex] || 0;
            seeds = baseRate * 5;
          }

          if (seeds > 0) {
            addSeeds(Math.floor(seeds));
            showFloatingText(iconWrapper, Math.floor(seeds));

            // Tutorial hook
            import('../systems/tutorial.js').then(module => {
              if (module.handleManualTap) {
                module.handleManualTap();
              }
            });

            // Re-evaluate hints after getting seeds (may unlock new options)
            reevaluateCurrentScreenHints();
          }
        });
      }

      // Label = assign bird
      if (label) {
        label.addEventListener('click', (e) => {
          e.stopPropagation();
          showBirdSelector(biome.id, slotIndex);
        });
      }
    }
  });

  // Surveyor slot - circle and label
  const surveyorSlot = card.querySelector('.surveyor-slot');
  if (surveyorSlot) {
    // Circle = manual observe
    surveyorSlot.addEventListener('click', (e) => {
      e.stopPropagation();
      const result = observeSurvey(biome.id);
      if (result.success) {
        updateSurveyProgressUI();
        // Survey taps are now free - no floating text needed
        // Re-evaluate hints after survey (may get new birds)
        reevaluateCurrentScreenHints();
      }
    });
  }

  // Surveyor label - separate from circle
  const surveyorLabel = card.querySelector('.surveyor-label');
  if (surveyorLabel) {
    surveyorLabel.addEventListener('click', (e) => {
      e.stopPropagation();
      showSurveyorSelector(biome.id);
    });
  }

  // Progress bar also allows manual observation
  const progressBar = card.querySelector('.progress-bar');
  if (progressBar) {
    progressBar.addEventListener('click', () => {
      const result = observeSurvey(biome.id);
      if (result.success) {
        updateSurveyProgressUI();
        // Survey taps are now free - no floating text needed
        // Re-evaluate hints after survey (may get new birds)
        reevaluateCurrentScreenHints();
      }
    });
  }
}

// Helper to show floating text animation
export function showFloatingText(element, amount, isNegative = false) {
  const floating = document.createElement('div');
  floating.textContent = amount >= 0 ? `+${amount}` : `${amount}`;
  floating.className = 'floating-income';
  const color = isNegative || amount < 0 ? '#ff6b6b' : 'var(--currency)';
  floating.style.cssText = `
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    color: ${color};
    font-weight: bold;
    font-size: 18px;
    pointer-events: none;
    animation: floatUp 1s ease-out forwards;
    z-index: 100;
  `;

  element.style.position = 'relative';
  element.appendChild(floating);

  setTimeout(() => floating.remove(), 1000);
}

// Keep for backwards compat
function showFloatingIncome(element, amount) {
  showFloatingText(element, amount, false);
}

// Show floating text for forager income (called from game loop)
export function showForagerIncomeFloatingText() {
  if (!gameState) return;

  gameState.biomes.forEach(biome => {
    if (!biome.unlocked) return;

    biome.foragers.forEach((forager, slotIndex) => {
      if (!forager.birdId) return;

      const income = calculateForagerSlotIncome(biome.id, slotIndex, forager.birdId);
      if (income <= 0) return;

      // Find the forager slot element using correct attributes
      const foragerSlot = document.querySelector(`.bird-slot[data-biome-id="${biome.id}"][data-slot-type="forager"][data-slot-index="${slotIndex}"]`);
      if (foragerSlot) {
        showFloatingText(foragerSlot, Math.floor(income));
      }
    });
  });
}

function showBirdSelector(biomeId, slotIndex) {
  if (!gameState) return;

  const biome = gameState.biomes.find(b => b.id === biomeId);
  if (!biome) return;

  const forager = biome.foragers[slotIndex];
  const currentBird = forager?.birdId ? getBirdById(forager.birdId) : null;

  // Get ALL birds and categorize them
  // Birds on perches are considered available (not "in use")
  const allBirds = gameState.specimens
    .filter(bird => bird.id !== currentBird?.id)
    .map(bird => {
      const isOnPerch = bird.location.startsWith('perch_');
      const isInCollection = bird.location === 'collection';
      const isAvailableLocation = isInCollection || isOnPerch;

      return {
        bird,
        isAvailable: isAvailableLocation && bird.vitalityPercent > 0,
        needsRest: isAvailableLocation && bird.vitalityPercent <= 0,
        isAssigned: !isAvailableLocation,
        locationLabel: getBirdLocationLabel(bird)
      };
    });

  const modal = document.getElementById('modal-overlay');
  const content = document.getElementById('modal-content');

  let optionsHTML = '';

  if (currentBird) {
    optionsHTML += `
      <button class="bird-select-btn unassign-option" data-action="unassign">
        <span class="btn-icon">✖️</span>
        <span class="btn-content">
          <span class="btn-title">Unassign</span>
          <span class="btn-subtitle">Return to collection</span>
        </span>
      </button>
    `;
  }

  // Sort each category by distinction (highest stars first)
  const availableBirds = allBirds.filter(b => b.isAvailable)
    .sort((a, b) => b.bird.distinction - a.bird.distinction);
  const assignedBirds = allBirds.filter(b => b.isAssigned)
    .sort((a, b) => b.bird.distinction - a.bird.distinction);
  const exhaustedBirds = allBirds.filter(b => b.needsRest)
    .sort((a, b) => b.bird.distinction - a.bird.distinction);

  if (availableBirds.length > 0) {
    optionsHTML += `<div class="section-label">Available</div>`;
    availableBirds.forEach(({ bird }) => {
      optionsHTML += createBirdSelectButton(bird, false);
    });
  }

  if (assignedBirds.length > 0) {
    optionsHTML += `<div class="section-label">Assigned</div>`;
    assignedBirds.forEach(({ bird, locationLabel }) => {
      optionsHTML += createBirdSelectButton(bird, true, locationLabel);
    });
  }

  if (exhaustedBirds.length > 0) {
    optionsHTML += `<div class="section-label">Needs Rest</div>`;
    exhaustedBirds.forEach(({ bird }) => {
      optionsHTML += createBirdSelectButton(bird, false, null, false, true);
    });
  }

  if (allBirds.length === 0 && !currentBird) {
    optionsHTML += `<p class="empty-message">No birds available</p>`;
  }

  content.innerHTML = `
    <h3>${biome.name} - Forager ${slotIndex + 1}</h3>
    <div class="bird-selection-grid">
      ${optionsHTML}
    </div>
    <div class="modal-actions">
      <button id="cancel-btn">Cancel</button>
    </div>
  `;

  modal.classList.remove('hidden');

  // Tutorial: When modal opens at FORAGER_ASSIGNMENT step, advance to SELECT_BIRD and show arrow
  if (isTutorialActive() && getCurrentTutorialStep() === TUTORIAL_STEPS.FORAGER_ASSIGNMENT) {
    setTimeout(() => {
      import('../systems/tutorial.js').then(module => {
        module.advanceTutorial(TUTORIAL_STEPS.SELECT_BIRD);
        // Show arrow pointing to the Forest Jay bird button
        setTimeout(() => {
          import('../ui/tutorialArrow.js').then(arrowModule => {
            arrowModule.showTutorialArrow('.bird-select-btn[data-bird-id]', 'down');
          });
        }, 200);
      });
    }, 100);
  }

  // Unassign handler
  const unassignBtn = content.querySelector('[data-action="unassign"]');
  if (unassignBtn) {
    unassignBtn.addEventListener('click', () => {
      if (unassignForager(biomeId, slotIndex)) {
        updateWildsUI();
        modal.classList.add('hidden');
      }
    });
  }

  // Bird selection handlers
  content.querySelectorAll('[data-bird-id]').forEach(btn => {
    btn.addEventListener('click', () => {
      const birdId = btn.dataset.birdId;
      const location = btn.dataset.location;
      const isExhausted = btn.dataset.exhausted === 'true';

      if (isExhausted) {
        // Show popup instructing to rest in sanctuary
        import('./modals.js').then(modalModule => {
          modalModule.showTutorialModal(
            'This bird is out of energy and needs to rest in the Sanctuary before it can be assigned!',
            'bold',
            () => {
              modalModule.hideTutorialModal();
            }
          );
        });
        return;
      }

      if (location) {
        showReassignmentConfirmation(
          birdId,
          location,
          `${biome.name} Forager ${slotIndex + 1}`,
          () => assignForager(biomeId, slotIndex, birdId),
          modal
        );
      } else {
        if (assignForager(biomeId, slotIndex, birdId)) {
          updateWildsUI();
          updateSanctuaryUI();
          modal.classList.add('hidden');
        }
      }
    });
  });

  content.querySelector('#cancel-btn').addEventListener('click', () => {
    modal.classList.add('hidden');
  });
}

function showSurveyorSelector(biomeId) {
  if (!gameState) return;

  const biome = gameState.biomes.find(b => b.id === biomeId);
  if (!biome) return;

  const currentSurveyor = biome.survey.surveyorId ? getBirdById(biome.survey.surveyorId) : null;

  // Birds on perches are considered available (not "in use")
  const allBirds = gameState.specimens
    .filter(bird => bird.id !== currentSurveyor?.id)
    .map(bird => {
      const isOnPerch = bird.location.startsWith('perch_');
      const isInCollection = bird.location === 'collection';
      const isAvailableLocation = isInCollection || isOnPerch;

      return {
        bird,
        isAvailable: isAvailableLocation && bird.vitalityPercent > 0,
        needsRest: isAvailableLocation && bird.vitalityPercent <= 0,
        isAssigned: !isAvailableLocation,
        locationLabel: getBirdLocationLabel(bird)
      };
    });

  const modal = document.getElementById('modal-overlay');
  const content = document.getElementById('modal-content');

  let optionsHTML = '';

  if (currentSurveyor) {
    optionsHTML += `
      <button class="bird-select-btn unassign-option" data-action="unassign">
        <span class="btn-icon">✖️</span>
        <span class="btn-content">
          <span class="btn-title">Unassign</span>
          <span class="btn-subtitle">Return to collection</span>
        </span>
      </button>
    `;
  }

  // Sort each category by distinction (highest stars first)
  const availableBirds = allBirds.filter(b => b.isAvailable)
    .sort((a, b) => b.bird.distinction - a.bird.distinction);
  const assignedBirds = allBirds.filter(b => b.isAssigned)
    .sort((a, b) => b.bird.distinction - a.bird.distinction);
  const exhaustedBirds = allBirds.filter(b => b.needsRest)
    .sort((a, b) => b.bird.distinction - a.bird.distinction);

  if (availableBirds.length > 0) {
    optionsHTML += `<div class="section-label">Available Birds</div>`;
    availableBirds.forEach(({ bird }) => {
      optionsHTML += createBirdSelectButton(bird, false, null, true);
    });
  }

  if (assignedBirds.length > 0) {
    optionsHTML += `<div class="section-label">In Use</div>`;
    assignedBirds.forEach(({ bird, locationLabel }) => {
      optionsHTML += createBirdSelectButton(bird, true, locationLabel, true);
    });
  }

  if (exhaustedBirds.length > 0) {
    optionsHTML += `<div class="section-label">Needs Rest</div>`;
    exhaustedBirds.forEach(({ bird }) => {
      optionsHTML += createBirdSelectButton(bird, false, null, true, true);
    });
  }

  if (allBirds.length === 0 && !currentSurveyor) {
    optionsHTML += `<p class="empty-message">No birds available</p>`;
  }

  content.innerHTML = `
    <h3>${biome.name} - Surveyor</h3>
    <div class="bird-selection-grid">
      ${optionsHTML}
    </div>
    <div class="modal-actions">
      <button id="cancel-btn">Cancel</button>
    </div>
  `;

  modal.classList.remove('hidden');

  const unassignBtn = content.querySelector('[data-action="unassign"]');
  if (unassignBtn) {
    unassignBtn.addEventListener('click', () => {
      if (unassignSurveyor(biomeId)) {
        updateWildsUI();
        modal.classList.add('hidden');
      }
    });
  }

  content.querySelectorAll('[data-bird-id]').forEach(btn => {
    btn.addEventListener('click', () => {
      const birdId = btn.dataset.birdId;
      const location = btn.dataset.location;
      const isExhausted = btn.dataset.exhausted === 'true';

      if (isExhausted) {
        // Show popup instructing to rest in sanctuary
        import('./modals.js').then(modalModule => {
          modalModule.showTutorialModal(
            'This bird is out of energy and needs to rest in the Sanctuary before it can be assigned!',
            'bold',
            () => {
              modalModule.hideTutorialModal();
            }
          );
        });
        return;
      }

      if (location) {
        showReassignmentConfirmation(
          birdId,
          location,
          `${biome.name} Surveyor`,
          () => assignSurveyor(biomeId, birdId),
          modal
        );
      } else {
        if (assignSurveyor(biomeId, birdId)) {
          updateWildsUI();
          updateSanctuaryUI();
          modal.classList.add('hidden');
        }
      }
    });
  });

  content.querySelector('#cancel-btn').addEventListener('click', () => {
    modal.classList.add('hidden');
  });
}

function createBirdSelectButton(bird, isUnavailable, locationLabel = '', isSurveyor = false, isExhausted = false) {
  const vitalityPercent = bird.vitalityPercent;
  const maturityPercent = bird.isMature ? 100 : 0;
  const vitalityStrokeOffset = 195 - (195 * vitalityPercent / 100);
  const maturityStrokeOffset = 157 - (157 * maturityPercent / 100);

  const greyedClass = (isUnavailable || isExhausted) ? 'greyed' : '';
  const unavailableClass = isUnavailable ? 'unavailable' : '';
  const exhaustedClass = isExhausted ? 'exhausted' : '';

  const income = FORAGER_INCOME[bird.distinction] || 0;
  const tapRate = ASSISTANT_TAP_RATE[bird.distinction] || 0;
  const subtitle = isSurveyor
    ? `${RARITY[bird.distinction].stars} - ${tapRate.toFixed(2)} taps/sec`
    : `${RARITY[bird.distinction].stars} - ${income} Seeds/sec`;

  const locationText = isExhausted ? 'Out of energy' : locationLabel;

  return `
    <button class="bird-select-btn ${unavailableClass} ${exhaustedClass}" data-bird-id="${bird.id}" ${isUnavailable ? `data-location="${locationLabel}"` : ''} ${isExhausted ? 'data-exhausted="true"' : ''}>
      <div class="btn-bird-icon-wrapper">
        <svg class="bird-rings" viewBox="0 0 100 100">
          <circle class="frame-ring ${greyedClass}" cx="50" cy="50" r="37" />
          <circle class="vitality-ring-bg" cx="50" cy="50" r="31" />
          <circle class="vitality-ring-fill ${greyedClass}" cx="50" cy="50" r="31" style="stroke-dashoffset: ${vitalityStrokeOffset}" />
          <circle class="maturity-ring-bg" cx="50" cy="50" r="25" />
          <circle class="maturity-ring-fill ${greyedClass}" cx="50" cy="50" r="25" style="stroke-dashoffset: ${maturityStrokeOffset}" />
        </svg>
        <img src="${getBirdSpritePath(bird)}" class="btn-bird-icon ${greyedClass}" />
      </div>
      <span class="btn-content">
        <span class="btn-title">${bird.customDesignation || bird.speciesName}</span>
        <span class="btn-subtitle">${subtitle}</span>
        ${(isUnavailable || isExhausted) ? `<span class="btn-location">${locationText}</span>` : ''}
      </span>
    </button>
  `;
}

function getBirdLocationLabel(bird) {
  if (bird.location === 'collection') return '';

  if (bird.location.startsWith('forager_')) {
    const parts = bird.location.split('_');
    const biomeId = parts[1];
    const slotIndex = parseInt(parts[2]);
    const biomeName = biomeId.charAt(0).toUpperCase() + biomeId.slice(1);
    return `${biomeName} Forager ${slotIndex + 1}`;
  }

  if (bird.location.startsWith('surveyor_')) {
    const biomeId = bird.location.split('_')[1];
    const biomeName = biomeId.charAt(0).toUpperCase() + biomeId.slice(1);
    return `${biomeName} Survey`;
  }

  if (bird.location.startsWith('perch_')) {
    const slot = parseInt(bird.location.split('_')[1]);
    return `Perch ${slot + 1}`;
  }

  if (bird.location.startsWith('breeding_')) {
    const program = parseInt(bird.location.split('_')[1]);
    return `Breeding Program ${program + 1}`;
  }

  return 'Unknown';
}

function showReassignmentConfirmation(birdId, currentLocation, targetLocation, assignCallback, parentModal) {
  const bird = getBirdById(birdId);
  if (!bird) return;

  const content = document.getElementById('modal-content');

  content.innerHTML = `
    <h3>Reassign Bird?</h3>
    <div class="confirmation-message">
      <p><strong>${bird.customDesignation || bird.speciesName}</strong> is currently at <strong>${currentLocation}</strong>.</p>
      <p>Do you want to reassign it to <strong>${targetLocation}</strong>?</p>
    </div>
    <div class="modal-actions">
      <button id="confirm-reassign-btn" class="primary-btn">Yes, Reassign</button>
      <button id="cancel-reassign-btn">Cancel</button>
    </div>
  `;

  content.querySelector('#confirm-reassign-btn').addEventListener('click', () => {
    if (assignCallback()) {
      updateWildsUI();
      updateSanctuaryUI();
      parentModal.classList.add('hidden');
    }
  });

  content.querySelector('#cancel-reassign-btn').addEventListener('click', () => {
    parentModal.classList.add('hidden');
  });
}

// ========================================
// HINT SYSTEM - Golden glow guide
// ========================================

let hintTimeout = null;
let lastScreenCheck = null;
let hintShown = false;

// Check if player needs a hint (called when Wilds screen is active)
export function checkWildsHints() {
  // Don't show hints during early tutorial steps (before FREE_PLAY)
  const tutorialStep = getCurrentTutorialStep();
  if (isTutorialActive() && tutorialStep < TUTORIAL_STEPS.FREE_PLAY) return;

  // Don't show hints if we're not on Wilds screen
  const wildsScreen = document.getElementById('screen-wilds');
  if (!wildsScreen || !wildsScreen.classList.contains('active')) {
    // Don't clear hints - let the other screen's hint system handle it
    if (hintTimeout) clearTimeout(hintTimeout);
    hintTimeout = null;
    lastScreenCheck = null;
    hintShown = false;
    return;
  }

  // Start 2-second timer when screen becomes active (only once)
  if (lastScreenCheck === null && !hintShown) {
    lastScreenCheck = Date.now();
    if (hintTimeout) clearTimeout(hintTimeout);
    hintTimeout = setTimeout(() => {
      showHint('wilds');
      hintShown = true;
    }, 2000);
  }
}

// ========================================
// EXHAUSTED BIRD HANDLER
// ========================================

// Handle birds that just ran out of energy
export function handleExhaustedBirds(exhaustedBirds) {
  console.log(`📢 handleExhaustedBirds called with ${exhaustedBirds.length} birds`);

  // Only show notifications if on Wilds screen
  const wildsScreen = document.getElementById('screen-wilds');
  if (!wildsScreen || !wildsScreen.classList.contains('active')) {
    console.log('Not on Wilds screen, skipping exhausted notification');
    return;
  }

  exhaustedBirds.forEach(({ bird, biomeId, type, slotIndex }) => {
    console.log(`Unassigning exhausted ${type}: ${bird.speciesName} from ${biomeId}`);
    // Unassign the bird
    if (type === 'forager') {
      unassignForager(biomeId, slotIndex);
    } else if (type === 'surveyor') {
      unassignSurveyor(biomeId);
    }
  });

  // Update UI to show unassigned birds FIRST
  console.log('Updating Wilds UI after exhaustion');
  updateWildsUI();

  // Then show notifications AFTER UI is rendered
  setTimeout(() => {
    exhaustedBirds.forEach(({ bird, biomeId, type }) => {
      const activityText = type === 'forager' ? 'Foraging' : 'Surveying';
      console.log(`Showing exhausted notification for ${bird.speciesName}`);
      showExhaustedNotification(bird, activityText, biomeId);
    });
  }, 100);
}

// Show a somber notification for exhausted birds
function showExhaustedNotification(bird, activityText, biomeId) {
  const biomeCard = document.querySelector(`.biome-card[data-biome-id="${biomeId}"]`);
  if (!biomeCard) return;

  const notification = document.createElement('div');
  notification.className = 'exhausted-notification';
  notification.innerHTML = `
    <div class="exhausted-content">
      <div class="exhausted-icon">😴</div>
      <div class="exhausted-text">
        <div class="exhausted-bird-name">${bird.customDesignation || bird.speciesName}</div>
        <div class="exhausted-message">stopped ${activityText}</div>
        <div class="exhausted-hint">Recover energy in the Sanctuary</div>
      </div>
    </div>
  `;

  biomeCard.style.position = 'relative';
  biomeCard.appendChild(notification);

  // Fade in
  setTimeout(() => {
    notification.style.opacity = '1';
  }, 50);

  let fadeTimeout;
  let isFading = false;
  const createdAt = Date.now();

  // Function to fade out the notification
  const fadeOut = () => {
    if (isFading) return; // Already fading
    isFading = true;
    clearTimeout(fadeTimeout); // Clear auto-fade timer
    notification.style.transition = 'opacity 1s';
    notification.style.opacity = '0';
    setTimeout(() => {
      notification.remove();
    }, 1000);
  };

  // Click to dismiss (but ignore taps in first 500ms to prevent accidental dismissal)
  notification.addEventListener('click', () => {
    const elapsed = Date.now() - createdAt;
    if (elapsed < 500) return; // Ignore early taps
    fadeOut();
  });

  // Auto-fade after 4 seconds
  fadeTimeout = setTimeout(fadeOut, 4000);
}
