// SANCTUARY - Wilds UI
import { gameState, getBirdById, addSeeds } from '../core/state.js';
import { assignForager, unassignForager, unlockForagerSlot, tapForagerSlot } from '../systems/foragers.js';
import { RARITY, FORAGER_INCOME } from '../core/constants.js';

export function initWildsUI() {
  renderForagers();
  // renderSurveys(); // Stage 2
}

export function updateWildsUI() {
  renderForagers();
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
      <div class="forager-label">${forager.unlockCost.toLocaleString()} Seeds</div>
    `;

    const circle = wrapper.querySelector('.forager-circle');
    circle.addEventListener('click', () => {
      if (unlockForagerSlot(forager.slot)) {
        renderForagers();
      }
    });
  } else if (!bird) {
    // Empty circle - tap for Seeds, label to assign
    const tapReward = [10, 100, 1000][forager.slot];
    wrapper.innerHTML = `
      <div class="forager-circle empty" data-slot="${forager.slot}">
        <div class="vitality-ring"></div>
        <div class="circle-content">
          <img src="/assets/ui/slot-empty.png" alt="Empty" class="empty-icon" />
        </div>
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
    const tapReward = [10, 100, 1000][forager.slot];
    wrapper.innerHTML = `
      <div class="forager-circle active" data-slot="${forager.slot}">
        <svg class="vitality-ring" viewBox="0 0 100 100">
          <circle class="vitality-ring-bg" cx="50" cy="50" r="45" />
          <circle class="vitality-ring-fill" cx="50" cy="50" r="45"
                  style="stroke-dashoffset: ${283 - (283 * vitalityPercent / 100)}" />
        </svg>
        <div class="circle-content">
          <img src="/assets/birds/bird-${bird.distinction}star.png" alt="${bird.speciesName}" class="bird-sprite" />
        </div>
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

  // Get available birds from collection
  const availableBirds = gameState.specimens.filter(b => b.location === 'collection');

  // Create modal
  const modal = document.getElementById('modal-overlay');
  const content = document.getElementById('modal-content');

  let optionsHTML = '';

  // Add "Unassign" option if there's a bird assigned
  if (currentBird) {
    optionsHTML += `
      <button class="bird-select-btn unassign-option" data-action="unassign" style="padding: 12px; text-align: left; background: var(--bg-secondary); border: 2px solid var(--error); border-radius: 4px; cursor: pointer; margin-bottom: 12px;">
        <div style="display: flex; align-items: center; gap: 12px;">
          <div style="width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; font-size: 24px;">✖️</div>
          <div>
            <div style="font-weight: 500; color: var(--error);">Unassign</div>
            <div style="font-size: 12px; color: var(--text-secondary);">Remove bird from this position</div>
          </div>
        </div>
      </button>
    `;
  }

  // Add available birds
  if (availableBirds.length > 0) {
    optionsHTML += `
      <div style="font-size: 12px; color: var(--text-secondary); margin-bottom: 8px; text-transform: uppercase; letter-spacing: 1px;">Available Birds</div>
      ${availableBirds.map(bird => `
        <button class="bird-select-btn" data-bird-id="${bird.id}" style="padding: 12px; text-align: left; background: var(--bg-accent); border: 1px solid var(--border-light); border-radius: 4px; cursor: pointer; margin-bottom: 4px;">
          <div style="display: flex; align-items: center; gap: 12px;">
            <img src="/assets/birds/bird-${bird.distinction}star.png" style="width: 32px; height: 32px;" />
            <div>
              <div style="font-weight: 500;">${bird.customDesignation || bird.speciesName}</div>
              <div style="font-size: 12px; color: var(--text-secondary);">${RARITY[bird.distinction].stars} - ${getForagerIncome(bird)} Seeds/sec</div>
            </div>
          </div>
        </button>
      `).join('')}
    `;
  } else if (!currentBird) {
    optionsHTML += `
      <p style="text-align: center; color: var(--text-muted); padding: 20px;">No birds available in collection</p>
    `;
  }

  content.innerHTML = `
    <h3>Forager Position ${slot + 1}</h3>
    <div class="bird-selection-grid" style="display: grid; grid-template-columns: 1fr; gap: 0; margin: 16px 0;">
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
        renderForagers();
        modal.classList.add('hidden');
      }
    });
  }

  // Handle bird selection
  content.querySelectorAll('[data-bird-id]').forEach(btn => {
    btn.addEventListener('click', () => {
      const birdId = btn.dataset.birdId;
      if (assignForager(slot, birdId)) {
        renderForagers();
        modal.classList.add('hidden');
      }
    });
  });

  // Handle cancel
  content.querySelector('#cancel-btn').addEventListener('click', () => {
    modal.classList.add('hidden');
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
  // TODO: Implement in Stage 2
}
