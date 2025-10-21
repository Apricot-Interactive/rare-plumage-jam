// SANCTUARY - Hatchery UI
import { gameState, getBirdById, spendSeeds } from '../core/state.js';
import { startBreeding, manualIncubate, unlockBreedingProgram } from '../systems/breeding.js';
import { UNLOCK_COSTS, RARITY, TRAITS } from '../core/constants.js';

let selectedParent1 = null;
let selectedParent2 = null;
let currentSelectingProgram = null;
let currentSelectingParent = null; // 1 or 2

export function initHatcheryUI() {
  console.log('Initializing Hatchery UI');
  updateHatcheryUI();
}

export function updateHatcheryUI() {
  if (!gameState) return;

  renderBreedingPrograms();
  renderMatureBirds();
  updateBreedingProgressBars();
}

export function renderBreedingPrograms() {
  const container = document.getElementById('breeding-programs-container');
  if (!container) return;

  container.innerHTML = '';

  gameState.breedingPrograms.forEach(program => {
    const programDiv = document.createElement('div');
    programDiv.className = 'breeding-program-slot';

    if (!program.unlocked) {
      // Locked slot
      programDiv.innerHTML = `
        <div class="slot-header">
          <span class="slot-title">Breeding Program ${program.program + 1}</span>
          <span class="slot-status locked">🔒 Locked</span>
        </div>
        <div class="slot-content">
          <button class="unlock-btn" data-program="${program.program}">
            Unlock for ${program.unlockCost.toLocaleString()} Seeds
          </button>
        </div>
      `;

      const unlockBtn = programDiv.querySelector('.unlock-btn');
      unlockBtn.addEventListener('click', () => {
        if (spendSeeds(program.unlockCost)) {
          unlockBreedingProgram(program.program);
          updateHatcheryUI();
        } else {
          alert('Not enough Seeds!');
        }
      });
    } else if (program.active) {
      // Active breeding
      const parent1 = getBirdById(program.lineage1Id);
      const parent2 = getBirdById(program.lineage2Id);

      const timeRemaining = Math.max(0, program.estimatedDuration - (program.progress / 100 * program.estimatedDuration));
      const minutesRemaining = Math.floor(timeRemaining / 60000);
      const secondsRemaining = Math.floor((timeRemaining % 60000) / 1000);

      programDiv.innerHTML = `
        <div class="slot-header">
          <span class="slot-title">Breeding Program ${program.program + 1}</span>
          <span class="slot-status active">🥚 Incubating</span>
        </div>
        <div class="slot-content">
          <div class="parent-info">
            <div class="parent">
              <span class="bird-name">${parent1?.speciesName || 'Unknown'}</span>
              <span class="bird-rarity">${RARITY[parent1?.distinction]?.stars || ''}</span>
            </div>
            <span class="breeding-icon">💕</span>
            <div class="parent">
              <span class="bird-name">${parent2?.speciesName || 'Unknown'}</span>
              <span class="bird-rarity">${RARITY[parent2?.distinction]?.stars || ''}</span>
            </div>
          </div>
          <div class="breeding-progress">
            <div class="progress-bar">
              <div class="progress-fill" data-program="${program.program}" style="width: ${program.progress}%"></div>
            </div>
            <div class="progress-info">
              <span class="progress-percent">${Math.floor(program.progress)}%</span>
              <span class="time-remaining">${minutesRemaining}m ${secondsRemaining}s</span>
            </div>
          </div>
          <button class="incubate-btn" data-program="${program.program}">
            Manual Incubate (+1%)
          </button>
        </div>
      `;

      const incubateBtn = programDiv.querySelector('.incubate-btn');
      incubateBtn.addEventListener('click', () => {
        manualIncubate(program.program);
        updateHatcheryUI();
      });
    } else {
      // Empty slot ready for breeding
      const parent1 = selectedParent1 && selectedParent1.programSlot === program.program ? selectedParent1.bird : null;
      const parent2 = selectedParent2 && selectedParent2.programSlot === program.program ? selectedParent2.bird : null;

      programDiv.innerHTML = `
        <div class="slot-header">
          <span class="slot-title">Breeding Program ${program.program + 1}</span>
          <span class="slot-status empty">Empty</span>
        </div>
        <div class="slot-content">
          <div class="parent-selection">
            <button class="parent-select-box" data-parent="1" data-program="${program.program}">
              ${parent1
                ? `<span class="bird-name">${parent1.speciesName}</span><span class="bird-rarity">${RARITY[parent1.distinction]?.stars || ''}</span>`
                : '<span class="select-prompt">Select Parent 1</span>'}
            </button>
            <span class="breeding-icon">💕</span>
            <button class="parent-select-box" data-parent="2" data-program="${program.program}">
              ${parent2
                ? `<span class="bird-name">${parent2.speciesName}</span><span class="bird-rarity">${RARITY[parent2.distinction]?.stars || ''}</span>`
                : '<span class="select-prompt">Select Parent 2</span>'}
            </button>
          </div>
          <button class="start-breeding-btn" data-program="${program.program}"
            ${(!parent1 || !parent2) ? 'disabled' : ''}>
            Start Breeding
          </button>
        </div>
      `;

      // Parent selection buttons
      const parent1Btn = programDiv.querySelector('[data-parent="1"]');
      const parent2Btn = programDiv.querySelector('[data-parent="2"]');

      parent1Btn.addEventListener('click', () => {
        currentSelectingProgram = program.program;
        currentSelectingParent = 1;
        showBirdSelectionModal();
      });

      parent2Btn.addEventListener('click', () => {
        currentSelectingProgram = program.program;
        currentSelectingParent = 2;
        showBirdSelectionModal();
      });

      // Start breeding button
      const startBtn = programDiv.querySelector('.start-breeding-btn');
      startBtn.addEventListener('click', () => {
        if (parent1 && parent2) {
          if (startBreeding(parent1.id, parent2.id, program.program)) {
            // Clear selections for this program
            if (selectedParent1?.programSlot === program.program) selectedParent1 = null;
            if (selectedParent2?.programSlot === program.program) selectedParent2 = null;
            updateHatcheryUI();
          } else {
            alert('Failed to start breeding. Ensure both birds are mature.');
          }
        }
      });
    }

    container.appendChild(programDiv);
  });
}

export function renderMatureBirds() {
  // This section is now hidden, birds are selected via modal
  const container = document.getElementById('mature-birds-container');
  if (container) {
    container.innerHTML = '';
  }
}

function showBirdSelectionModal() {
  const modal = document.getElementById('modal-overlay');
  const content = document.getElementById('modal-content');

  // Sort birds: mature & available first, then mature & assigned, then immature
  const allBirds = [...gameState.specimens].sort((a, b) => {
    const aAvailable = a.isMature && a.location === 'collection';
    const bAvailable = b.isMature && b.location === 'collection';
    const aAssigned = a.isMature && a.location !== 'collection';
    const bAssigned = b.isMature && b.location !== 'collection';

    if (aAvailable && !bAvailable) return -1;
    if (!aAvailable && bAvailable) return 1;
    if (aAssigned && !bAssigned && !bAvailable) return -1;
    if (!aAssigned && bAssigned && !aAvailable) return 1;
    return 0;
  });

  const matureBirds = allBirds.filter(b => b.isMature);
  const immatureBirds = allBirds.filter(b => !b.isMature);

  content.innerHTML = `
    <h3>Select Parent ${currentSelectingParent}</h3>
    <div class="bird-selection-list">
      ${matureBirds.length > 0 ? `
        <div class="bird-selection-section">
          <h4 class="section-label">Mature Birds</h4>
          ${matureBirds.map(bird => {
            const isAvailable = bird.location === 'collection';
            const isAssigned = !isAvailable;
            return `
              <div class="bird-selection-item ${isAssigned ? 'assigned' : ''}" data-bird-id="${bird.id}">
                <div class="bird-info">
                  <span class="bird-name">${bird.customDesignation || bird.speciesName}</span>
                  <span class="bird-rarity" style="color: ${RARITY[bird.distinction]?.color}">${RARITY[bird.distinction]?.stars}</span>
                </div>
                <div class="bird-location-info">
                  ${isAssigned ? `<span class="location-label">Assigned: ${formatLocation(bird.location)}</span>` : ''}
                </div>
              </div>
            `;
          }).join('')}
        </div>
      ` : ''}
      ${immatureBirds.length > 0 ? `
        <div class="bird-selection-section">
          <h4 class="section-label">Immature Birds</h4>
          ${immatureBirds.map(bird => {
            return `
              <div class="bird-selection-item immature" data-bird-id="${bird.id}">
                <div class="bird-info">
                  <span class="bird-name">${bird.customDesignation || bird.speciesName}</span>
                  <span class="bird-rarity" style="color: ${RARITY[bird.distinction]?.color}">${RARITY[bird.distinction]?.stars}</span>
                </div>
                <div class="bird-location-info">
                  <span class="immature-label">Not mature</span>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      ` : ''}
    </div>
    <div class="modal-actions">
      <button id="cancel-selection-btn">Cancel</button>
    </div>
  `;

  modal.classList.remove('hidden');

  // Add click handlers for bird selection
  content.querySelectorAll('.bird-selection-item').forEach(item => {
    item.addEventListener('click', () => {
      const birdId = item.dataset.birdId;
      const bird = getBirdById(birdId);

      if (!bird) return;

      // Check if bird is immature
      if (!bird.isMature) {
        showImmatureBirdMessage();
        return;
      }

      // Assign bird as parent
      if (currentSelectingParent === 1) {
        selectedParent1 = { bird, programSlot: currentSelectingProgram };
      } else {
        selectedParent2 = { bird, programSlot: currentSelectingProgram };
      }

      modal.classList.add('hidden');
      updateHatcheryUI();
    });
  });

  // Cancel button
  content.querySelector('#cancel-selection-btn').addEventListener('click', () => {
    modal.classList.add('hidden');
  });
}

function showImmatureBirdMessage() {
  const modal = document.getElementById('modal-overlay');
  const content = document.getElementById('modal-content');

  content.innerHTML = `
    <h3>Bird Not Mature</h3>
    <p class="modal-message">
      This bird is not yet mature and cannot breed.
    </p>
    <p class="modal-message">
      Visit the Sanctuary to nurture it. Assign the bird to a Perch slot to restore vitality,
      then spend 100 Seeds to mature it for breeding.
    </p>
    <div class="modal-actions">
      <button id="close-message-btn">Understood</button>
    </div>
  `;

  content.querySelector('#close-message-btn').addEventListener('click', () => {
    modal.classList.add('hidden');
  });
}

function formatLocation(location) {
  if (location === 'collection') return 'Collection';
  if (location.startsWith('forager_')) return `Forager ${parseInt(location.split('_')[1]) + 1}`;
  if (location.startsWith('perch_')) return `Perch ${parseInt(location.split('_')[1]) + 1}`;
  if (location.startsWith('assistant_')) return `Survey: ${location.split('_')[1]}`;
  if (location.startsWith('breeding_')) return `Breeding ${parseInt(location.split('_')[1]) + 1}`;
  return location;
}

export function updateBreedingProgressBars() {
  gameState.breedingPrograms.forEach(program => {
    if (program.active) {
      const progressFill = document.querySelector(`.progress-fill[data-program="${program.program}"]`);
      if (progressFill) {
        progressFill.style.width = `${Math.min(100, program.progress)}%`;
      }
    }
  });
}
