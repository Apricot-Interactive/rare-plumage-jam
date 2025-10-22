// SANCTUARY - Wilds UI
import { gameState, getBirdById, addSeeds } from '../core/state.js';
import { assignForager, unassignForager, unlockForagerSlot, tapForagerSlot } from '../systems/foragers.js';
import { observeSurvey, assignAssistant, unassignAssistant } from '../systems/surveys.js';
import { RARITY, FORAGER_INCOME, TRAITS } from '../core/constants.js';
import { updateSanctuaryUI } from './sanctuary.js';

// Celebration overlay function
export function showSurveyCelebration(newBird, biomeId) {
  const surveyItem = document.querySelector(`.survey-item[data-survey-id="${biomeId}"]`);
  if (!surveyItem) return;

  const overlay = document.createElement('div');
  overlay.className = 'celebration-overlay survey-celebration';
  overlay.innerHTML = `
    <div class="celebration-content survey-content">
      <div class="survey-celebration-left">
        <img src="/assets/birds/bird-${newBird.distinction}star.png" class="celebration-bird-img" />
      </div>
      <div class="survey-celebration-right">
        <div class="celebration-header">🎉 New Discovery!</div>
        <div class="bird-name">${newBird.speciesName}</div>
        <div class="bird-rarity">${RARITY[newBird.distinction]?.stars || ''}</div>
        <div class="bird-traits">${newBird.traits.map(t => TRAITS[t]?.name || t).join(', ')}</div>
      </div>
    </div>
  `;

  surveyItem.style.position = 'relative';
  surveyItem.appendChild(overlay);

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
  renderForagers();
  renderSurveys();
}

// Full re-render (only call when assignments change)
export function updateWildsUI() {
  renderForagers();
  renderSurveys();
}

// Selective updates for real-time changes
export function updateForagerVitalityUI() {
  if (!gameState) return;

  gameState.foragers.forEach(forager => {
    if (!forager.birdId) return;

    const bird = getBirdById(forager.birdId);
    if (!bird) return;

    // Update vitality and maturity rings
    const wrapper = document.querySelector(`.forager-circle-wrapper[data-slot="${forager.slot}"]`);
    if (!wrapper) return;

    const vitalityRingFill = wrapper.querySelector('.vitality-ring-fill');
    if (vitalityRingFill) {
      const vitalityPercent = bird.vitalityPercent;
      vitalityRingFill.style.strokeDashoffset = `${264 - (264 * vitalityPercent / 100)}`;
    }

    const maturityRingFill = wrapper.querySelector('.maturity-ring-fill');
    if (maturityRingFill) {
      const maturityPercent = bird.isMature ? 100 : 0;
      maturityRingFill.style.strokeDashoffset = `${239 - (239 * maturityPercent / 100)}`;
    }
  });
}

export function updateSurveyProgressUI() {
  if (!gameState) return;

  gameState.surveys.forEach(survey => {
    const surveyItem = document.querySelector(`.survey-item[data-survey-id="${survey.id}"]`);
    if (!surveyItem) return;

    const progressFill = surveyItem.querySelector('.progress-bar-fill');
    if (progressFill) {
      const progressPercent = Math.floor(survey.progress);
      progressFill.style.width = `${progressPercent}%`;
    }
  });
}

// Track last income display time for each forager
const lastIncomeDisplay = {};

export function renderForagers() {
  const container = document.getElementById('foragers-container');
  if (!container || !gameState) return;

  container.innerHTML = '';

  gameState.foragers.forEach(forager => {
    const slotEl = createForagerCircle(forager);
    container.appendChild(slotEl);
  });

  // Start showing floating income numbers
  showForagerIncome();
}

function createForagerCircle(forager) {
  const wrapper = document.createElement('div');
  wrapper.className = 'forager-circle-wrapper';
  wrapper.dataset.slot = forager.slot;

  const bird = forager.birdId ? getBirdById(forager.birdId) : null;

  if (!forager.unlocked) {
    // Locked circle
    wrapper.innerHTML = `
      <div class="forager-circle locked" data-slot="${forager.slot}">
        <div class="vitality-ring"></div>
        <div class="circle-content">
          <div class="lock-icon">🔒</div>
        </div>
      </div>
      <div class="forager-label locked-label">${forager.unlockCost.toLocaleString()} Seeds</div>
    `;

    const circle = wrapper.querySelector('.forager-circle');
    const label = wrapper.querySelector('.forager-label');

    const unlockHandler = () => {
      if (unlockForagerSlot(forager.slot)) {
        renderForagers();
      }
    };

    circle.addEventListener('click', unlockHandler);
    label.addEventListener('click', unlockHandler);
  } else if (!bird) {
    // Empty circle - tap for Seeds, label to assign
    const tapReward = [10, 100, 1000][forager.slot];
    wrapper.innerHTML = `
      <div class="forager-circle empty" data-slot="${forager.slot}">
        <svg class="bird-rings" viewBox="0 0 100 100">
          <!-- Frame Ring only for empty slots -->
          <circle class="frame-ring empty-frame" cx="50" cy="50" r="40" />
        </svg>
        <img src="/assets/ui/slot-empty.png" alt="Empty" class="forager-bird-icon" />
      </div>
      <div class="forager-label" data-action="assign">Assign Bird</div>
    `;

    const circle = wrapper.querySelector('.forager-circle');
    circle.addEventListener('click', () => {
      // Always give manual tap reward
      const seeds = tapForagerSlot(forager.slot);
      if (seeds > 0) {
        addSeeds(seeds);
        showFloatingIncome(circle, seeds);
      }
    });

    const label = wrapper.querySelector('.forager-label');
    label.addEventListener('click', (e) => {
      e.stopPropagation();
      showBirdSelector(forager.slot);
    });
  } else {
    // Assigned bird - tap for Seeds, label to reassign
    const vitalityPercent = bird.vitalityPercent;
    const maturityPercent = bird.isMature ? 100 : 0;
    const tapReward = [10, 100, 1000][forager.slot];
    const vitalityStrokeOffset = 264 - (264 * vitalityPercent / 100);
    const maturityStrokeOffset = 239 - (239 * maturityPercent / 100);

    wrapper.innerHTML = `
      <div class="forager-circle active" data-slot="${forager.slot}">
        <svg class="bird-rings" viewBox="0 0 100 100">
          <!-- Frame Ring (outermost, drawn first) -->
          <circle class="frame-ring" cx="50" cy="50" r="46" />
          <!-- Vitality Ring (middle, green) -->
          <circle class="vitality-ring-bg" cx="50" cy="50" r="42" />
          <circle class="vitality-ring-fill" cx="50" cy="50" r="42"
                  style="stroke-dashoffset: ${vitalityStrokeOffset}" />
          <!-- Maturity Ring (innermost, blue, drawn last) -->
          <circle class="maturity-ring-bg" cx="50" cy="50" r="38" />
          <circle class="maturity-ring-fill" cx="50" cy="50" r="38"
                  style="stroke-dashoffset: ${maturityStrokeOffset}" />
        </svg>
        <img src="/assets/birds/bird-${bird.distinction}star.png" alt="${bird.speciesName}" class="forager-bird-icon" />
      </div>
      <div class="forager-label" data-action="assign">${bird.customDesignation || bird.speciesName}</div>
    `;

    const circle = wrapper.querySelector('.forager-circle');
    circle.addEventListener('click', () => {
      // Always give manual tap reward
      const seeds = tapForagerSlot(forager.slot);
      if (seeds > 0) {
        addSeeds(seeds);
        showFloatingIncome(circle, seeds);
      }
    });

    const label = wrapper.querySelector('.forager-label');
    label.addEventListener('click', (e) => {
      e.stopPropagation();
      showBirdSelector(forager.slot);
    });
  }

  return wrapper;
}

function getForagerIncome(bird) {
  return FORAGER_INCOME[bird.distinction] || 0;
}

// Show floating income numbers periodically
function showForagerIncome() {
  if (!gameState) return;

  gameState.foragers.forEach(forager => {
    if (!forager.birdId) return;

    const bird = getBirdById(forager.birdId);
    if (!bird || bird.vitalityPercent <= 0) return;

    const income = getForagerIncome(bird);
    if (income <= 0) return;

    // Show income every 1 second
    const now = Date.now();
    const lastDisplay = lastIncomeDisplay[forager.slot] || 0;

    if (now - lastDisplay >= 1000) {
      const wrapper = document.querySelector(`[data-slot="${forager.slot}"]`);
      if (wrapper) {
        const circle = wrapper.querySelector('.forager-circle');
        showFloatingIncome(circle, income);
        lastIncomeDisplay[forager.slot] = now;
      }
    }
  });

  // Continue showing income
  requestAnimationFrame(showForagerIncome);
}

function showFloatingIncome(element, amount) {
  const floating = document.createElement('div');
  floating.textContent = `+${amount}`;
  floating.className = 'floating-income';

  element.style.position = 'relative';
  element.appendChild(floating);

  setTimeout(() => floating.remove(), 1000);
}

function showBirdSelector(slot) {
  if (!gameState) return;

  const forager = gameState.foragers.find(f => f.slot === slot);
  const currentBird = forager?.birdId ? getBirdById(forager.birdId) : null;

  // Get ALL birds and categorize them (excluding the current bird in this slot)
  const allBirds = gameState.specimens
    .filter(bird => bird.id !== currentBird?.id) // Don't show current bird in the list
    .map(bird => {
      const isAvailable = bird.location === 'collection';
      let locationLabel = '';

      if (!isAvailable) {
        if (bird.location.startsWith('forager_')) {
          const foragerSlot = parseInt(bird.location.split('_')[1]);
          locationLabel = `Foraging (Slot ${foragerSlot + 1})`;
        } else if (bird.location.startsWith('perch_')) {
          const perchSlot = parseInt(bird.location.split('_')[1]);
          locationLabel = `Perch ${perchSlot + 1}`;
        } else if (bird.location.startsWith('assistant_')) {
          const biomeId = bird.location.split('_')[1];
          const biomeName = biomeId.charAt(0).toUpperCase() + biomeId.slice(1);
          locationLabel = `${biomeName} Assistant`;
        }
      }

      return { bird, isAvailable, locationLabel };
    });

  // Create modal
  const modal = document.getElementById('modal-overlay');
  const content = document.getElementById('modal-content');

  let optionsHTML = '';

  // Add "Unassign" option if there's a bird assigned
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

  // Add all birds (available first, then unavailable)
  const availableBirds = allBirds.filter(b => b.isAvailable);
  const unavailableBirds = allBirds.filter(b => !b.isAvailable);

  if (availableBirds.length > 0) {
    optionsHTML += `<div class="section-label">Available Birds</div>`;
    availableBirds.forEach(({ bird }) => {
      const traitNames = bird.traits.map(t => TRAITS[t]?.name || t).join(', ');
      const vitalityPercent = bird.vitalityPercent;
      const maturityPercent = bird.isMature ? 100 : 0;
      const vitalityStrokeOffset = 195 - (195 * vitalityPercent / 100);
      const maturityStrokeOffset = 157 - (157 * maturityPercent / 100);
      optionsHTML += `
        <button class="bird-select-btn" data-bird-id="${bird.id}">
          <div class="btn-bird-icon-wrapper">
            <svg class="bird-rings" viewBox="0 0 100 100">
              <!-- Frame Ring (outermost, drawn first) -->
              <circle class="frame-ring" cx="50" cy="50" r="37" />
              <!-- Vitality Ring (middle, green) -->
              <circle class="vitality-ring-bg" cx="50" cy="50" r="31" />
              <circle class="vitality-ring-fill" cx="50" cy="50" r="31"
                      style="stroke-dashoffset: ${vitalityStrokeOffset}" />
              <!-- Maturity Ring (innermost, blue, drawn last) -->
              <circle class="maturity-ring-bg" cx="50" cy="50" r="25" />
              <circle class="maturity-ring-fill" cx="50" cy="50" r="25"
                      style="stroke-dashoffset: ${maturityStrokeOffset}" />
            </svg>
            <img src="/assets/birds/bird-${bird.distinction}star.png" class="btn-bird-icon" />
          </div>
          <span class="btn-content">
            <span class="btn-title">${bird.customDesignation || bird.speciesName}</span>
            <span class="btn-subtitle">${RARITY[bird.distinction].stars} - ${getForagerIncome(bird)} Seeds/sec</span>
          </span>
        </button>
      `;
    });
  }

  if (unavailableBirds.length > 0) {
    optionsHTML += `<div class="section-label">In Use</div>`;
    unavailableBirds.forEach(({ bird, locationLabel }) => {
      const traitNames = bird.traits.map(t => TRAITS[t]?.name || t).join(', ');
      const vitalityPercent = bird.vitalityPercent;
      const maturityPercent = bird.isMature ? 100 : 0;
      const vitalityStrokeOffset = 195 - (195 * vitalityPercent / 100);
      const maturityStrokeOffset = 157 - (157 * maturityPercent / 100);
      optionsHTML += `
        <button class="bird-select-btn unavailable" data-bird-id="${bird.id}" data-location="${locationLabel}">
          <div class="btn-bird-icon-wrapper">
            <svg class="bird-rings" viewBox="0 0 100 100">
              <!-- Frame Ring (outermost, drawn first) -->
              <circle class="frame-ring greyed" cx="50" cy="50" r="37" />
              <!-- Vitality Ring (middle, green) -->
              <circle class="vitality-ring-bg" cx="50" cy="50" r="31" />
              <circle class="vitality-ring-fill greyed" cx="50" cy="50" r="31"
                      style="stroke-dashoffset: ${vitalityStrokeOffset}" />
              <!-- Maturity Ring (innermost, blue, drawn last) -->
              <circle class="maturity-ring-bg" cx="50" cy="50" r="25" />
              <circle class="maturity-ring-fill greyed" cx="50" cy="50" r="25"
                      style="stroke-dashoffset: ${maturityStrokeOffset}" />
            </svg>
            <img src="/assets/birds/bird-${bird.distinction}star.png" class="btn-bird-icon greyed" />
          </div>
          <span class="btn-content">
            <span class="btn-title">${bird.customDesignation || bird.speciesName}</span>
            <span class="btn-subtitle">${RARITY[bird.distinction].stars} - ${getForagerIncome(bird)} Seeds/sec</span>
            <span class="btn-location">${locationLabel}</span>
          </span>
        </button>
      `;
    });
  }

  if (allBirds.length === 0 && !currentBird) {
    optionsHTML += `<p class="empty-message">No birds available</p>`;
  }

  content.innerHTML = `
    <h3>Forager Position ${slot + 1}</h3>
    <div class="bird-selection-grid">
      ${optionsHTML}
    </div>
    <div class="modal-actions">
      <button id="cancel-btn">Cancel</button>
    </div>
  `;

  modal.classList.remove('hidden');

  // Handle unassign
  const unassignBtn = content.querySelector('[data-action="unassign"]');
  if (unassignBtn) {
    unassignBtn.addEventListener('click', () => {
      if (unassignForager(slot)) {
        updateWildsUI();
        modal.classList.add('hidden');
      }
    });
  }

  // Handle bird selection (both available and unavailable)
  content.querySelectorAll('[data-bird-id]').forEach(btn => {
    btn.addEventListener('click', () => {
      const birdId = btn.dataset.birdId;
      const location = btn.dataset.location;

      // If bird is unavailable, show confirmation dialog
      if (location) {
        showForagerReassignmentConfirmation(slot, birdId, location, modal);
      } else {
        // Available bird - assign directly
        if (assignForager(slot, birdId)) {
          updateWildsUI();
          updateSanctuaryUI(); // Also update sanctuary in case bird was moved from there
          modal.classList.add('hidden');
        }
      }
    });
  });

  // Handle cancel
  content.querySelector('#cancel-btn').addEventListener('click', () => {
    modal.classList.add('hidden');
  });
}

function showForagerReassignmentConfirmation(targetSlot, birdId, currentLocation, parentModal) {
  const bird = getBirdById(birdId);
  if (!bird) return;

  const content = document.getElementById('modal-content');

  content.innerHTML = `
    <h3>Reassign Bird?</h3>
    <div class="confirmation-message">
      <p><strong>${bird.customDesignation || bird.speciesName}</strong> is currently at <strong>${currentLocation}</strong>.</p>
      <p>Do you want to reassign it to <strong>Forager Position ${targetSlot + 1}</strong>?</p>
    </div>
    <div class="modal-actions">
      <button id="confirm-reassign-btn" class="primary-btn">Yes, Reassign</button>
      <button id="cancel-reassign-btn">Cancel</button>
    </div>
  `;

  // Handle confirm
  content.querySelector('#confirm-reassign-btn').addEventListener('click', () => {
    if (assignForager(targetSlot, birdId)) {
      updateWildsUI();
      updateSanctuaryUI(); // Also update sanctuary in case bird was moved from there
      parentModal.classList.add('hidden');
    }
  });

  // Handle cancel - go back to bird selector
  content.querySelector('#cancel-reassign-btn').addEventListener('click', () => {
    showBirdSelector(targetSlot);
  });
}

function showFloatingText(element, text) {
  const floating = document.createElement('div');
  floating.textContent = text;
  floating.style.cssText = `
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    color: var(--currency);
    font-weight: bold;
    font-size: 24px;
    pointer-events: none;
    animation: floatUp 1s ease-out forwards;
    z-index: 100;
  `;

  element.style.position = 'relative';
  element.appendChild(floating);

  setTimeout(() => floating.remove(), 1000);
}

// Add CSS animation for floating text
const style = document.createElement('style');
style.textContent = `
  @keyframes floatUp {
    from {
      opacity: 1;
      transform: translate(-50%, -50%);
    }
    to {
      opacity: 0;
      transform: translate(-50%, -150%);
    }
  }
`;
document.head.appendChild(style);

export function renderSurveys() {
  const container = document.getElementById('surveys-container');
  if (!container || !gameState) return;

  container.innerHTML = '';

  gameState.surveys.forEach(survey => {
    const surveyEl = createSurveyItem(survey);
    container.appendChild(surveyEl);
  });
}

function createSurveyItem(survey) {
  const item = document.createElement('div');
  item.className = 'survey-item';
  item.dataset.surveyId = survey.id;

  const assistant = survey.assistantId ? getBirdById(survey.assistantId) : null;
  const biomeName = survey.biome.charAt(0).toUpperCase() + survey.biome.slice(1);
  const progressPercent = Math.floor(survey.progress);

  // Build biome circle content
  let biomeCircleHTML = '';
  if (assistant) {
    // Show bird with 3-ring system
    const vitalityPercent = assistant.vitalityPercent;
    const maturityPercent = assistant.isMature ? 100 : 0;
    const vitalityStrokeOffset = 264 - (264 * vitalityPercent / 100);
    const maturityStrokeOffset = 239 - (239 * maturityPercent / 100);

    biomeCircleHTML = `
      <svg class="bird-rings" viewBox="0 0 100 100">
        <!-- Frame Ring (outermost, drawn first) -->
        <circle class="frame-ring" cx="50" cy="50" r="46" />
        <!-- Vitality Ring (middle, green) -->
        <circle class="vitality-ring-bg" cx="50" cy="50" r="42" />
        <circle class="vitality-ring-fill" cx="50" cy="50" r="42"
                style="stroke-dashoffset: ${vitalityStrokeOffset}" />
        <!-- Maturity Ring (innermost, blue, drawn last) -->
        <circle class="maturity-ring-bg" cx="50" cy="50" r="38" />
        <circle class="maturity-ring-fill" cx="50" cy="50" r="38"
                style="stroke-dashoffset: ${maturityStrokeOffset}" />
      </svg>
      <img src="/assets/birds/bird-${assistant.distinction}star.png" alt="${assistant.speciesName}" class="survey-bird-icon" />
    `;
  } else {
    // Show biome icon (empty)
    biomeCircleHTML = `
      <svg class="bird-rings" viewBox="0 0 100 100">
        <!-- Frame Ring only for empty slots -->
        <circle class="frame-ring empty-frame" cx="50" cy="50" r="46" />
      </svg>
      <img src="/assets/biomes/${survey.biome}.png" alt="${biomeName}" class="survey-bird-icon" />
    `;
  }

  item.innerHTML = `
    <div class="survey-layout">
      <div class="biome-circle" data-biome="${survey.id}">
        ${biomeCircleHTML}
      </div>
      <div class="survey-info">
        <div class="biome-label">${biomeName}</div>
        <div class="progress-bar">
          <div class="progress-bar-fill" style="width: ${progressPercent}%"></div>
        </div>
        <div class="assistant-button" data-biome="${survey.id}">
          ${assistant ? (assistant.customDesignation || assistant.speciesName) : 'Assign Assistant'}
        </div>
      </div>
    </div>
  `;

  // Biome circle tap for observation
  const biomeCircle = item.querySelector('.biome-circle');
  biomeCircle.addEventListener('click', () => {
    if (observeSurvey(survey.id)) {
      renderSurveys();
    }
  });

  // Assistant button for assignment
  const assignBtn = item.querySelector('.assistant-button');
  assignBtn.addEventListener('click', () => {
    showAssistantSelector(survey.id);
  });

  return item;
}

function showAssistantSelector(biomeId) {
  if (!gameState) return;

  const survey = gameState.surveys.find(s => s.id === biomeId);
  const currentAssistant = survey?.assistantId ? getBirdById(survey.assistantId) : null;

  // Get ALL birds and categorize them (excluding the current bird in this slot)
  const allBirds = gameState.specimens
    .filter(bird => bird.id !== currentAssistant?.id) // Don't show current bird in the list
    .map(bird => {
      const isAvailable = bird.location === 'collection';
      let locationLabel = '';

      if (!isAvailable) {
        if (bird.location.startsWith('forager_')) {
          const foragerSlot = parseInt(bird.location.split('_')[1]);
          locationLabel = `Foraging (Slot ${foragerSlot + 1})`;
        } else if (bird.location.startsWith('perch_')) {
          const perchSlot = parseInt(bird.location.split('_')[1]);
          locationLabel = `Perch ${perchSlot + 1}`;
        } else if (bird.location.startsWith('assistant_')) {
          const assistantBiomeId = bird.location.split('_')[1];
          const assistantBiomeName = assistantBiomeId.charAt(0).toUpperCase() + assistantBiomeId.slice(1);
          locationLabel = `${assistantBiomeName} Assistant`;
        }
      }

      return { bird, isAvailable, locationLabel };
    });

  // Create modal
  const modal = document.getElementById('modal-overlay');
  const content = document.getElementById('modal-content');

  let optionsHTML = '';

  // Add "Unassign" option if there's an assistant assigned
  if (currentAssistant) {
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

  // Add all birds (available first, then unavailable)
  const availableBirds = allBirds.filter(b => b.isAvailable);
  const unavailableBirds = allBirds.filter(b => !b.isAvailable);

  if (availableBirds.length > 0) {
    optionsHTML += `<div class="section-label">Available Birds</div>`;
    availableBirds.forEach(({ bird }) => {
      const traitNames = bird.traits.map(t => TRAITS[t]?.name || t).join(', ');
      const vitalityPercent = bird.vitalityPercent;
      const maturityPercent = bird.isMature ? 100 : 0;
      const vitalityStrokeOffset = 195 - (195 * vitalityPercent / 100);
      const maturityStrokeOffset = 157 - (157 * maturityPercent / 100);
      optionsHTML += `
        <button class="bird-select-btn" data-bird-id="${bird.id}">
          <div class="btn-bird-icon-wrapper">
            <svg class="bird-rings" viewBox="0 0 100 100">
              <!-- Frame Ring (outermost, drawn first) -->
              <circle class="frame-ring" cx="50" cy="50" r="37" />
              <!-- Vitality Ring (middle, green) -->
              <circle class="vitality-ring-bg" cx="50" cy="50" r="31" />
              <circle class="vitality-ring-fill" cx="50" cy="50" r="31"
                      style="stroke-dashoffset: ${vitalityStrokeOffset}" />
              <!-- Maturity Ring (innermost, blue, drawn last) -->
              <circle class="maturity-ring-bg" cx="50" cy="50" r="25" />
              <circle class="maturity-ring-fill" cx="50" cy="50" r="25"
                      style="stroke-dashoffset: ${maturityStrokeOffset}" />
            </svg>
            <img src="/assets/birds/bird-${bird.distinction}star.png" class="btn-bird-icon" />
          </div>
          <span class="btn-content">
            <span class="btn-title">${bird.customDesignation || bird.speciesName}</span>
            <span class="btn-subtitle">${RARITY[bird.distinction].stars} - ${getObservationRate(bird)} obs/sec</span>
          </span>
        </button>
      `;
    });
  }

  if (unavailableBirds.length > 0) {
    optionsHTML += `<div class="section-label">In Use</div>`;
    unavailableBirds.forEach(({ bird, locationLabel }) => {
      const traitNames = bird.traits.map(t => TRAITS[t]?.name || t).join(', ');
      const vitalityPercent = bird.vitalityPercent;
      const maturityPercent = bird.isMature ? 100 : 0;
      const vitalityStrokeOffset = 195 - (195 * vitalityPercent / 100);
      const maturityStrokeOffset = 157 - (157 * maturityPercent / 100);
      optionsHTML += `
        <button class="bird-select-btn unavailable" data-bird-id="${bird.id}" data-location="${locationLabel}">
          <div class="btn-bird-icon-wrapper">
            <svg class="bird-rings" viewBox="0 0 100 100">
              <!-- Frame Ring (outermost, drawn first) -->
              <circle class="frame-ring greyed" cx="50" cy="50" r="37" />
              <!-- Vitality Ring (middle, green) -->
              <circle class="vitality-ring-bg" cx="50" cy="50" r="31" />
              <circle class="vitality-ring-fill greyed" cx="50" cy="50" r="31"
                      style="stroke-dashoffset: ${vitalityStrokeOffset}" />
              <!-- Maturity Ring (innermost, blue, drawn last) -->
              <circle class="maturity-ring-bg" cx="50" cy="50" r="25" />
              <circle class="maturity-ring-fill greyed" cx="50" cy="50" r="25"
                      style="stroke-dashoffset: ${maturityStrokeOffset}" />
            </svg>
            <img src="/assets/birds/bird-${bird.distinction}star.png" class="btn-bird-icon greyed" />
          </div>
          <span class="btn-content">
            <span class="btn-title">${bird.customDesignation || bird.speciesName}</span>
            <span class="btn-subtitle">${RARITY[bird.distinction].stars} - ${getObservationRate(bird)} obs/sec</span>
            <span class="btn-location">${locationLabel}</span>
          </span>
        </button>
      `;
    });
  }

  if (allBirds.length === 0 && !currentAssistant) {
    optionsHTML += `<p class="empty-message">No birds available</p>`;
  }

  const biomeName = biomeId.charAt(0).toUpperCase() + biomeId.slice(1);
  content.innerHTML = `
    <h3>${biomeName} Survey</h3>
    <div class="bird-selection-grid">
      ${optionsHTML}
    </div>
    <div class="modal-actions">
      <button id="cancel-btn">Cancel</button>
    </div>
  `;

  modal.classList.remove('hidden');

  // Handle unassign
  const unassignBtn = content.querySelector('[data-action="unassign"]');
  if (unassignBtn) {
    unassignBtn.addEventListener('click', () => {
      if (unassignAssistant(biomeId)) {
        updateWildsUI();
        modal.classList.add('hidden');
      }
    });
  }

  // Handle bird selection (both available and unavailable)
  content.querySelectorAll('[data-bird-id]').forEach(btn => {
    btn.addEventListener('click', () => {
      const birdId = btn.dataset.birdId;
      const location = btn.dataset.location;

      // If bird is unavailable, show confirmation dialog
      if (location) {
        showAssistantReassignmentConfirmation(biomeId, birdId, location, modal);
      } else {
        // Available bird - assign directly
        if (assignAssistant(biomeId, birdId)) {
          updateWildsUI();
          updateSanctuaryUI(); // Also update sanctuary in case bird was moved from there
          modal.classList.add('hidden');
        }
      }
    });
  });

  // Handle cancel
  content.querySelector('#cancel-btn').addEventListener('click', () => {
    modal.classList.add('hidden');
  });
}

function showAssistantReassignmentConfirmation(biomeId, birdId, currentLocation, parentModal) {
  const bird = getBirdById(birdId);
  if (!bird) return;

  const biomeName = biomeId.charAt(0).toUpperCase() + biomeId.slice(1);
  const content = document.getElementById('modal-content');

  content.innerHTML = `
    <h3>Reassign Bird?</h3>
    <div class="confirmation-message">
      <p><strong>${bird.customDesignation || bird.speciesName}</strong> is currently at <strong>${currentLocation}</strong>.</p>
      <p>Do you want to reassign it to <strong>${biomeName} Survey</strong>?</p>
    </div>
    <div class="modal-actions">
      <button id="confirm-reassign-btn" class="primary-btn">Yes, Reassign</button>
      <button id="cancel-reassign-btn">Cancel</button>
    </div>
  `;

  // Handle confirm
  content.querySelector('#confirm-reassign-btn').addEventListener('click', () => {
    if (assignAssistant(biomeId, birdId)) {
      updateWildsUI();
      updateSanctuaryUI(); // Also update sanctuary in case bird was moved from there
      parentModal.classList.add('hidden');
    }
  });

  // Handle cancel - go back to assistant selector
  content.querySelector('#cancel-reassign-btn').addEventListener('click', () => {
    showAssistantSelector(biomeId);
  });
}

function getObservationRate(bird) {
  const { ASSISTANT_TAP_RATE } = { ASSISTANT_TAP_RATE: { 1: 0.2, 2: 0.333, 3: 0.5, 4: 1.0, 5: 2.0 } };
  const rate = ASSISTANT_TAP_RATE[bird.distinction] || 0;
  return rate.toFixed(2);
}
