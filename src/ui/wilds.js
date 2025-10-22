// SANCTUARY - Wilds UI (Biome-based)
import { gameState, getBirdById, addSeeds } from '../core/state.js';
import { assignForager, unassignForager, unlockForagerSlot } from '../systems/foragers.js';
import { observeSurvey, assignSurveyor, unassignSurveyor, getBiomeTapRate, unlockBiome } from '../systems/surveys.js';
import { canPrestige, performPrestige, getPrestigeWarningMessage } from '../systems/prestige.js';
import { RARITY, FORAGER_INCOME, TRAITS, ASSISTANT_TAP_RATE } from '../core/constants.js';
import { updateSanctuaryUI } from './sanctuary.js';

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
        <img src="/assets/birds/bird-${newBird.distinction}star.png" class="celebration-bird-img-small" />
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

  // Fade out and remove after 4 seconds
  setTimeout(() => {
    overlay.style.opacity = '0';
    setTimeout(() => {
      overlay.remove();
      updateWildsUI();
    }, 500);
  }, 4000);
}

export function initWildsUI() {
  renderBiomes();
}

// Full re-render (only call when assignments change)
export function updateWildsUI() {
  renderBiomes();
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

    const progressFill = biomeCard.querySelector('.progress-bar-fill');
    if (progressFill) {
      const progressPercent = Math.floor(biome.survey.progress);
      progressFill.style.width = `${progressPercent}%`;
    }
  });
}

function renderBiomes() {
  const container = document.getElementById('wilds-container');
  if (!container || !gameState) return;

  container.innerHTML = '';

  // Find first locked biome index
  const firstLockedIndex = gameState.biomes.findIndex(b => !b.unlocked);

  gameState.biomes.forEach((biome, index) => {
    // Show unlocked biomes + first locked biome only
    if (biome.unlocked || index === firstLockedIndex) {
      const biomeCard = createBiomeCard(biome, index);
      container.appendChild(biomeCard);
    }
  });

  // Show prestige card if Tundra is unlocked
  const tundra = gameState.biomes.find(b => b.id === 'tundra');
  if (tundra && tundra.unlocked) {
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

    card.innerHTML = `
      <div class="biome-locked-content">
        <div class="biome-locked-left">
          <div class="lock-icon">🔒</div>
        </div>
        <div class="biome-locked-right">
          <h3>${biome.name}</h3>
          <div class="unlock-requirement">${RARITY[biome.unlockRequirement].stars} Bird Required</div>
          ${hasRequiredBird ? '<button class="unlock-biome-btn">Unlock Biome</button>' : ''}
        </div>
      </div>
    `;

    if (hasRequiredBird) {
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
  const progressPercent = Math.floor(biome.survey.progress);

  card.innerHTML = `
    <div class="biome-header">
      <h3>${biome.name}</h3>
    </div>
    <div class="biome-body">
      <div class="forager-row">
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

  const eligible = canPrestige();
  const message = getPrestigeWarningMessage();

  if (eligible && message) {
    card.innerHTML = `
      <div class="prestige-content">
        <div class="prestige-icon">🌟</div>
        <h3 class="prestige-title">Prestige</h3>
        <div class="prestige-subtitle">Unlock ${message.crystalName} Crystal</div>
        <button class="prestige-btn">Perform Prestige</button>
      </div>
    `;

    const button = card.querySelector('.prestige-btn');
    button.addEventListener('click', () => {
      showPrestigeConfirmation();
    });
  } else {
    // Not eligible yet
    const perchedBirdCount = gameState.perches.filter(p => p.birdId !== null).length;
    const remaining = Math.max(0, 5 - perchedBirdCount);

    card.innerHTML = `
      <div class="prestige-content locked">
        <div class="prestige-icon-locked">⭐</div>
        <h3 class="prestige-title">Prestige</h3>
        <div class="prestige-requirement">
          ${remaining > 0 ? `Place ${remaining} more bird${remaining > 1 ? 's' : ''} on perches` : 'Ready to prestige!'}
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
      <button id="confirm-prestige-btn" class="primary-btn danger-btn">Confirm Prestige</button>
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
          <img src="/assets/ui/slot-empty.png" alt="Empty" class="forager-bird-icon" />
        </div>
        <div class="slot-label">Forager</div>
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
        <img src="/assets/birds/bird-${bird.distinction}star.png" alt="${bird.speciesName}" class="forager-bird-icon" />
      </div>
      <div class="slot-label">${bird.customDesignation || bird.speciesName}</div>
    </div>
  `;
}

function createSurveySlotHTML(biome) {
  const survey = biome.survey;
  const surveyor = survey.surveyorId ? getBirdById(survey.surveyorId) : null;
  const progressPercent = Math.floor(survey.progress);

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
        <img src="/assets/birds/bird-${surveyor.distinction}star.png" alt="${surveyor.speciesName}" class="surveyor-bird-icon" />
      </div>
    `;
  } else {
    surveyorIconHTML = `
      <div class="surveyor-icon-wrapper">
        <svg class="bird-rings" viewBox="0 0 100 100">
          <circle class="frame-ring empty-frame" cx="50" cy="50" r="46" />
        </svg>
        <img src="/assets/biomes/${biome.id}.png" alt="${biome.name}" class="surveyor-bird-icon" />
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
        <div class="progress-text">${progressPercent}%</div>
        <div class="surveyor-label slot-label">${surveyor ? (surveyor.customDesignation || surveyor.speciesName) : 'Assign Surveyor'}</div>
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
        }
      });
    } else {
      // Icon wrapper = manual tap for seeds
      if (iconWrapper) {
        iconWrapper.addEventListener('click', (e) => {
          e.stopPropagation();
          const tapRewards = [10, 100, 1000];
          const seeds = tapRewards[slotIndex] || 10;
          addSeeds(seeds);
          showFloatingIncome(iconWrapper, seeds);
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
      if (observeSurvey(biome.id)) {
        updateSurveyProgressUI();
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
      if (observeSurvey(biome.id)) {
        updateSurveyProgressUI();
      }
    });
  }
}

// Helper to show floating income animation
function showFloatingIncome(element, amount) {
  const floating = document.createElement('div');
  floating.textContent = `+${amount}`;
  floating.className = 'floating-income';
  floating.style.cssText = `
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    color: var(--currency);
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

function showBirdSelector(biomeId, slotIndex) {
  if (!gameState) return;

  const biome = gameState.biomes.find(b => b.id === biomeId);
  if (!biome) return;

  const forager = biome.foragers[slotIndex];
  const currentBird = forager?.birdId ? getBirdById(forager.birdId) : null;

  // Get ALL birds and categorize them
  const allBirds = gameState.specimens
    .filter(bird => bird.id !== currentBird?.id)
    .map(bird => ({
      bird,
      isAvailable: bird.location === 'collection',
      locationLabel: getBirdLocationLabel(bird)
    }));

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

  const availableBirds = allBirds.filter(b => b.isAvailable);
  const unavailableBirds = allBirds.filter(b => !b.isAvailable);

  if (availableBirds.length > 0) {
    optionsHTML += `<div class="section-label">Available Birds</div>`;
    availableBirds.forEach(({ bird }) => {
      optionsHTML += createBirdSelectButton(bird, false);
    });
  }

  if (unavailableBirds.length > 0) {
    optionsHTML += `<div class="section-label">In Use</div>`;
    unavailableBirds.forEach(({ bird, locationLabel }) => {
      optionsHTML += createBirdSelectButton(bird, true, locationLabel);
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

  const allBirds = gameState.specimens
    .filter(bird => bird.id !== currentSurveyor?.id)
    .map(bird => ({
      bird,
      isAvailable: bird.location === 'collection',
      locationLabel: getBirdLocationLabel(bird)
    }));

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

  const availableBirds = allBirds.filter(b => b.isAvailable);
  const unavailableBirds = allBirds.filter(b => !b.isAvailable);

  if (availableBirds.length > 0) {
    optionsHTML += `<div class="section-label">Available Birds</div>`;
    availableBirds.forEach(({ bird }) => {
      optionsHTML += createBirdSelectButton(bird, false, null, true);
    });
  }

  if (unavailableBirds.length > 0) {
    optionsHTML += `<div class="section-label">In Use</div>`;
    unavailableBirds.forEach(({ bird, locationLabel }) => {
      optionsHTML += createBirdSelectButton(bird, true, locationLabel, true);
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

function createBirdSelectButton(bird, isUnavailable, locationLabel = '', isSurveyor = false) {
  const vitalityPercent = bird.vitalityPercent;
  const maturityPercent = bird.isMature ? 100 : 0;
  const vitalityStrokeOffset = 195 - (195 * vitalityPercent / 100);
  const maturityStrokeOffset = 157 - (157 * maturityPercent / 100);

  const greyedClass = isUnavailable ? 'greyed' : '';
  const unavailableClass = isUnavailable ? 'unavailable' : '';

  const income = FORAGER_INCOME[bird.distinction] || 0;
  const tapRate = ASSISTANT_TAP_RATE[bird.distinction] || 0;
  const subtitle = isSurveyor
    ? `${RARITY[bird.distinction].stars} - ${tapRate.toFixed(2)} taps/sec`
    : `${RARITY[bird.distinction].stars} - ${income} Seeds/sec`;

  return `
    <button class="bird-select-btn ${unavailableClass}" data-bird-id="${bird.id}" ${isUnavailable ? `data-location="${locationLabel}"` : ''}>
      <div class="btn-bird-icon-wrapper">
        <svg class="bird-rings" viewBox="0 0 100 100">
          <circle class="frame-ring ${greyedClass}" cx="50" cy="50" r="37" />
          <circle class="vitality-ring-bg" cx="50" cy="50" r="31" />
          <circle class="vitality-ring-fill ${greyedClass}" cx="50" cy="50" r="31" style="stroke-dashoffset: ${vitalityStrokeOffset}" />
          <circle class="maturity-ring-bg" cx="50" cy="50" r="25" />
          <circle class="maturity-ring-fill ${greyedClass}" cx="50" cy="50" r="25" style="stroke-dashoffset: ${maturityStrokeOffset}" />
        </svg>
        <img src="/assets/birds/bird-${bird.distinction}star.png" class="btn-bird-icon ${greyedClass}" />
      </div>
      <span class="btn-content">
        <span class="btn-title">${bird.customDesignation || bird.speciesName}</span>
        <span class="btn-subtitle">${subtitle}</span>
        ${isUnavailable ? `<span class="btn-location">${locationLabel}</span>` : ''}
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
    return `${biomeName} Surveyor`;
  }

  if (bird.location.startsWith('perch_')) {
    const slot = parseInt(bird.location.split('_')[1]);
    return `Perch ${slot + 1}`;
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
