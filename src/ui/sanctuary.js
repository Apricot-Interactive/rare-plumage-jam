// SANCTUARY - Sanctuary UI (Perches, Collection, Bonuses)
import { gameState, getBirdById } from '../core/state.js';
import { assignPerch, unassignPerch, unlockPerchSlot, instantRestore, matureBird, calculateGuestBonuses } from '../systems/sanctuary.js';
import { RARITY, TRAITS } from '../core/constants.js';
import { updateWildsUI } from './wilds.js';

export function initSanctuaryUI() {
  renderPerches();
  renderCollection();
  renderBonuses();
}

export function updateSanctuaryUI() {
  renderPerches();
  renderCollection();
  renderBonuses();
}

// Render perch slots
export function renderPerches() {
  const container = document.getElementById('perches-container');
  if (!container || !gameState) return;

  container.innerHTML = '';

  gameState.perches.forEach(perch => {
    const perchEl = createPerchSlot(perch);
    container.appendChild(perchEl);
  });
}

function createPerchSlot(perch) {
  const wrapper = document.createElement('div');
  wrapper.className = 'perch-card';
  wrapper.dataset.slot = perch.slot;

  const bird = perch.birdId ? getBirdById(perch.birdId) : null;

  if (!perch.unlocked) {
    // Locked perch
    wrapper.classList.add('locked');
    wrapper.innerHTML = `
      <div class="perch-card-top">
        <div class="perch-lock-icon">🔒</div>
      </div>
      <div class="perch-card-bottom">
        <div class="perch-unlock-cost">${perch.unlockCost.toLocaleString()} Seeds</div>
      </div>
    `;

    wrapper.addEventListener('click', () => {
      if (unlockPerchSlot(perch.slot)) {
        updateSanctuaryUI();
      }
    });
  } else if (!bird) {
    // Empty perch
    wrapper.classList.add('empty');
    wrapper.innerHTML = `
      <div class="perch-card-top">
        <div class="perch-empty-icon">🪹</div>
      </div>
      <div class="perch-card-bottom">
        <div class="perch-empty-label">Assign Guest</div>
      </div>
    `;

    wrapper.addEventListener('click', () => {
      showBirdSelector(perch.slot);
    });
  } else {
    // Occupied perch
    wrapper.classList.add('occupied');

    const cooldownSeconds = Math.ceil(perch.restoreCooldown / 1000);
    const traitNames = bird.traits.map(t => TRAITS[t]?.name || t).join(', ');

    const maturityPercent = bird.isMature ? 100 : 0;
    const vitalityStrokeOffset = 377 - (377 * bird.vitalityPercent / 100);
    const maturityStrokeOffset = 327 - (327 * maturityPercent / 100);

    wrapper.innerHTML = `
      <div class="perch-card-top">
        <div class="perch-vitality-ring-wrapper">
          <svg class="bird-rings" viewBox="0 0 100 100">
            <!-- Maturity Ring (innermost, blue) -->
            <circle class="maturity-ring-bg" cx="50" cy="50" r="52" />
            <circle class="maturity-ring-fill" cx="50" cy="50" r="52"
                    style="stroke-dashoffset: ${maturityStrokeOffset}" />
            <!-- Vitality Ring (middle, green) -->
            <circle class="vitality-ring-bg" cx="50" cy="50" r="60" />
            <circle class="vitality-ring-fill" cx="50" cy="50" r="60"
                    style="stroke-dashoffset: ${vitalityStrokeOffset}" />
            <!-- Frame Ring (outermost) -->
            <circle class="frame-ring" cx="50" cy="50" r="68" />
          </svg>
          <img src="/assets/birds/bird-${bird.distinction}star.png" alt="${bird.speciesName}" class="perch-bird-image" />
        </div>
      </div>
      <div class="perch-card-bottom">
        <div class="perch-bird-name">${bird.customDesignation || bird.speciesName}</div>
        <div class="perch-bird-rarity">${RARITY[bird.distinction].stars}</div>
        <div class="perch-bird-traits">${traitNames}</div>
        <div class="perch-card-actions">
          <button class="perch-restore-btn" ${perch.restoreCooldown > 0 ? 'disabled' : ''}>
            ${perch.restoreCooldown > 0 ? `${cooldownSeconds}s` : `🪮`}
          </button>
          <button class="perch-reassign-btn">❌</button>
        </div>
      </div>
    `;

    // Restore button
    const restoreBtn = wrapper.querySelector('.perch-restore-btn');
    restoreBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (instantRestore(perch.slot)) {
        updateSanctuaryUI();
      }
    });

    // Reassign button
    const reassignBtn = wrapper.querySelector('.perch-reassign-btn');
    reassignBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      showBirdSelector(perch.slot);
    });
  }

  return wrapper;
}

function showBirdSelector(slot) {
  if (!gameState) return;

  const perch = gameState.perches.find(p => p.slot === slot);
  const currentBird = perch?.birdId ? getBirdById(perch.birdId) : null;

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
      const vitalityStrokeOffset = 190 - (190 * vitalityPercent / 100);
      const maturityStrokeOffset = 170 - (170 * maturityPercent / 100);
      optionsHTML += `
        <button class="bird-select-btn" data-bird-id="${bird.id}">
          <div class="btn-bird-icon-wrapper">
            <svg class="bird-rings" viewBox="0 0 100 100">
              <!-- Maturity Ring (innermost, blue) -->
              <circle class="maturity-ring-bg" cx="50" cy="50" r="27" />
              <circle class="maturity-ring-fill" cx="50" cy="50" r="27"
                      style="stroke-dashoffset: ${maturityStrokeOffset}" />
              <!-- Vitality Ring (middle, green) -->
              <circle class="vitality-ring-bg" cx="50" cy="50" r="30" />
              <circle class="vitality-ring-fill" cx="50" cy="50" r="30"
                      style="stroke-dashoffset: ${vitalityStrokeOffset}" />
              <!-- Frame Ring (outermost) -->
              <circle class="frame-ring" cx="50" cy="50" r="33" />
            </svg>
            <img src="/assets/birds/bird-${bird.distinction}star.png" class="btn-bird-icon" />
          </div>
          <span class="btn-content">
            <span class="btn-title">${bird.customDesignation || bird.speciesName}</span>
            <span class="btn-subtitle">${RARITY[bird.distinction].stars} - ${traitNames}</span>
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
      const vitalityStrokeOffset = 190 - (190 * vitalityPercent / 100);
      const maturityStrokeOffset = 170 - (170 * maturityPercent / 100);
      optionsHTML += `
        <button class="bird-select-btn unavailable" data-bird-id="${bird.id}" data-location="${locationLabel}">
          <div class="btn-bird-icon-wrapper">
            <svg class="bird-rings" viewBox="0 0 100 100">
              <!-- Maturity Ring (innermost, blue) -->
              <circle class="maturity-ring-bg" cx="50" cy="50" r="27" />
              <circle class="maturity-ring-fill greyed" cx="50" cy="50" r="27"
                      style="stroke-dashoffset: ${maturityStrokeOffset}" />
              <!-- Vitality Ring (middle, green) -->
              <circle class="vitality-ring-bg" cx="50" cy="50" r="30" />
              <circle class="vitality-ring-fill greyed" cx="50" cy="50" r="30"
                      style="stroke-dashoffset: ${vitalityStrokeOffset}" />
              <!-- Frame Ring (outermost) -->
              <circle class="frame-ring greyed" cx="50" cy="50" r="33" />
            </svg>
            <img src="/assets/birds/bird-${bird.distinction}star.png" class="btn-bird-icon greyed" />
          </div>
          <span class="btn-content">
            <span class="btn-title">${bird.customDesignation || bird.speciesName}</span>
            <span class="btn-subtitle">${RARITY[bird.distinction].stars} - ${traitNames}</span>
            <span class="btn-location">${locationLabel}</span>
          </span>
        </button>
      `;
    });
  }

  if (allBirds.length === 0) {
    optionsHTML += `<p class="empty-message">No birds available</p>`;
  }

  content.innerHTML = `
    <h3>Perch ${slot + 1}</h3>
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
      if (unassignPerch(slot)) {
        updateSanctuaryUI();
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
        showReassignmentConfirmation(slot, birdId, location, modal);
      } else {
        // Available bird - assign directly
        if (assignPerch(slot, birdId)) {
          updateSanctuaryUI();
          updateWildsUI(); // Also update wilds in case bird was moved from there
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

function showReassignmentConfirmation(targetSlot, birdId, currentLocation, parentModal) {
  const bird = getBirdById(birdId);
  if (!bird) return;

  const content = document.getElementById('modal-content');

  content.innerHTML = `
    <h3>Reassign Bird?</h3>
    <div class="confirmation-message">
      <p><strong>${bird.customDesignation || bird.speciesName}</strong> is currently at <strong>${currentLocation}</strong>.</p>
      <p>Do you want to reassign it to <strong>Perch ${targetSlot + 1}</strong>?</p>
    </div>
    <div class="modal-actions">
      <button id="confirm-reassign-btn" class="primary-btn">Yes, Reassign</button>
      <button id="cancel-reassign-btn">Cancel</button>
    </div>
  `;

  // Handle confirm
  content.querySelector('#confirm-reassign-btn').addEventListener('click', () => {
    if (assignPerch(targetSlot, birdId)) {
      updateSanctuaryUI();
      updateWildsUI(); // Also update wilds in case bird was moved from there
      parentModal.classList.add('hidden');
    }
  });

  // Handle cancel - go back to bird selector
  content.querySelector('#cancel-reassign-btn').addEventListener('click', () => {
    showBirdSelector(targetSlot);
  });
}

// Render collection list
export function renderCollection() {
  const container = document.getElementById('collection-container');
  if (!container || !gameState) return;

  container.innerHTML = '';

  // Show ALL birds, not just those in collection
  const allBirds = gameState.specimens;

  if (allBirds.length === 0) {
    container.innerHTML = '<p class="empty-message">No birds</p>';
    return;
  }

  allBirds.forEach(bird => {
    const item = createCollectionItem(bird);
    container.appendChild(item);
  });
}

function createCollectionItem(bird) {
  const item = document.createElement('div');
  item.className = 'collection-item';

  // Determine if bird is available or in use
  const isAvailable = bird.location === 'collection';
  let locationLabel = '';

  if (!isAvailable) {
    if (bird.location.startsWith('forager_')) {
      const slot = parseInt(bird.location.split('_')[1]);
      locationLabel = `Foraging (Slot ${slot + 1})`;
      item.classList.add('in-use');
    } else if (bird.location.startsWith('perch_')) {
      const slot = parseInt(bird.location.split('_')[1]);
      locationLabel = `Perch ${slot + 1}`;
      item.classList.add('in-use');
    } else if (bird.location.startsWith('assistant_')) {
      const biomeId = bird.location.split('_')[1];
      const biomeName = biomeId.charAt(0).toUpperCase() + biomeId.slice(1);
      locationLabel = `${biomeName} Assistant`;
      item.classList.add('in-use');
    }
  }

  const maturityLabel = bird.isMature ? '✓ Mature' : '○ Immature';
  const vitalityPercent = bird.vitalityPercent;
  const maturityPercent = bird.isMature ? 100 : 0;
  const vitalityStrokeOffset = 264 - (264 * vitalityPercent / 100);
  const maturityStrokeOffset = 239 - (239 * maturityPercent / 100);

  item.innerHTML = `
    <div class="collection-bird-info">
      <div class="collection-bird-icon-wrapper">
        <svg class="bird-rings" viewBox="0 0 100 100">
          <!-- Maturity Ring (innermost, blue) -->
          <circle class="maturity-ring-bg" cx="50" cy="50" r="38" />
          <circle class="maturity-ring-fill ${!isAvailable ? 'greyed' : ''}" cx="50" cy="50" r="38"
                  style="stroke-dashoffset: ${maturityStrokeOffset}" />
          <!-- Vitality Ring (middle, green) -->
          <circle class="vitality-ring-bg" cx="50" cy="50" r="42" />
          <circle class="vitality-ring-fill ${!isAvailable ? 'greyed' : ''}" cx="50" cy="50" r="42"
                  style="stroke-dashoffset: ${vitalityStrokeOffset}" />
          <!-- Frame Ring (outermost) -->
          <circle class="frame-ring" cx="50" cy="50" r="46" />
        </svg>
        <img src="/assets/birds/bird-${bird.distinction}star.png" class="collection-bird-icon ${!isAvailable ? 'greyed' : ''}" />
      </div>
      <div class="collection-bird-details">
        <div class="collection-bird-name">${bird.customDesignation || bird.speciesName}</div>
        <div class="collection-bird-stats">${RARITY[bird.distinction].stars} | ${Math.floor(bird.vitalityPercent)}% vitality | ${maturityLabel}</div>
        ${locationLabel ? `<div class="collection-bird-location">${locationLabel}</div>` : ''}
      </div>
    </div>
    <div class="collection-actions">
      ${!bird.isMature && isAvailable ? `<button class="mature-btn" data-bird-id="${bird.id}">Mature (100 🫘)</button>` : ''}
    </div>
  `;

  // Mature button
  const matureBtn = item.querySelector('.mature-btn');
  if (matureBtn) {
    matureBtn.addEventListener('click', () => {
      if (matureBird(bird.id)) {
        updateSanctuaryUI();
      }
    });
  }

  return item;
}

// Update perch cooldowns dynamically (selective update)
export function updatePerchCooldowns() {
  if (!gameState) return;

  gameState.perches.forEach(perch => {
    if (!perch.unlocked || !perch.birdId) return;

    const wrapper = document.querySelector(`.perch-card[data-slot="${perch.slot}"]`);
    if (!wrapper) return;

    const restoreBtn = wrapper.querySelector('.perch-restore-btn');
    if (!restoreBtn) return;

    const cooldownSeconds = Math.ceil(perch.restoreCooldown / 1000);

    if (perch.restoreCooldown > 0) {
      restoreBtn.disabled = true;
      restoreBtn.textContent = `${cooldownSeconds}s`;
    } else {
      restoreBtn.disabled = false;
      restoreBtn.textContent = '🪮';
    }
  });
}

// Render active bonuses
export function renderBonuses() {
  const container = document.getElementById('bonuses-display');
  if (!container || !gameState) return;

  const bonuses = calculateGuestBonuses();

  container.innerHTML = '';

  // Filter out zero bonuses and format
  const activeBonuses = Object.entries(bonuses)
    .filter(([key, value]) => value > 0)
    .map(([key, value]) => {
      const label = key
        .split('_')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');

      const sign = value > 0 ? '+' : '';
      const percent = (value * 100).toFixed(0);

      return { label, value: `${sign}${percent}%` };
    });

  if (activeBonuses.length === 0) {
    container.innerHTML = '<div class="no-bonuses">No active bonuses</div>';
    return;
  }

  activeBonuses.forEach(bonus => {
    const tag = document.createElement('div');
    tag.className = 'bonus-tag';
    tag.textContent = `${bonus.label}: ${bonus.value}`;
    container.appendChild(tag);
  });
}
