// SANCTUARY - Hatchery UI
import { gameState, getBirdById, spendSeeds } from '../core/state.js';
import { startBreeding, manualIncubate, unlockBreedingProgram } from '../systems/breeding.js';
import { matureBird } from '../systems/sanctuary.js';
import { UNLOCK_COSTS, RARITY, TRAITS, MATURITY_COSTS } from '../core/constants.js';
import { formatCompact } from '../utils/numbers.js';

let selectedParent1 = null;
let selectedParent2 = null;
let currentSelectingProgram = null;
let currentSelectingParent = null; // 1 or 2

// Helper function to get biome emoji
function getBiomeEmoji(biome) {
  const biomeEmojis = {
    forest: '🌲',
    mountain: '🏔️',
    coastal: '🌊',
    arid: '🏜️',
    tundra: '❄️'
  };
  return biomeEmojis[biome] || '🌿';
}

// Celebration overlay function
export function showBreedingCelebration(newBird, parent1, parent2, programSlot) {
  const container = document.querySelector(`[data-program-slot="${programSlot}"]`);
  if (!container) return;

  const overlay = document.createElement('div');
  overlay.className = 'celebration-overlay breeding-celebration';
  overlay.innerHTML = `
    <div class="celebration-content">
      <div class="celebration-header">🎉 Breeding Complete! 🎉</div>
      <div class="celebration-parents">
        <div class="celebration-parent">
          <div class="parent-name">${parent1.speciesName}</div>
          <div class="parent-rarity">${RARITY[parent1.distinction]?.stars || ''}</div>
          <div class="parent-traits">${parent1.traits.map(t => TRAITS[t]?.name || t).join(', ')}</div>
        </div>
        <div class="celebration-heart">💕</div>
        <div class="celebration-parent">
          <div class="parent-name">${parent2.speciesName}</div>
          <div class="parent-rarity">${RARITY[parent2.distinction]?.stars || ''}</div>
          <div class="parent-traits">${parent2.traits.map(t => TRAITS[t]?.name || t).join(', ')}</div>
        </div>
      </div>
      <div class="celebration-offspring">
        <img src="/assets/birds/bird-${newBird.distinction}star.png" class="celebration-bird-img" />
        <div class="offspring-name">${newBird.speciesName}</div>
        <div class="offspring-rarity">${RARITY[newBird.distinction]?.stars || ''}</div>
        <div class="offspring-traits">${newBird.traits.map(t => TRAITS[t]?.name || t).join(', ')}</div>
      </div>
    </div>
  `;

  container.appendChild(overlay);

  // Fade out and remove after 4 seconds
  setTimeout(() => {
    overlay.style.opacity = '0';
    setTimeout(() => {
      overlay.remove();
      updateHatcheryUI();
    }, 500);
  }, 4000);
}

export function initHatcheryUI() {
  console.log('Initializing Hatchery UI');
  updateHatcheryUI();
}

export function updateHatcheryUI() {
  if (!gameState) return;

  renderBreedingPrograms();
  renderMatureBirds();
  updateBreedingProgressBars();

  // Tutorial: Show arrow to Parent 1 when entering hatchery during BREEDING_TUTORIAL
  import('../systems/tutorial.js').then(module => {
    if (module.isTutorialActive && module.isTutorialActive() &&
        module.getCurrentTutorialStep && module.getCurrentTutorialStep() === module.TUTORIAL_STEPS.BREEDING_TUTORIAL) {
      setTimeout(() => {
        import('../ui/tutorialArrow.js').then(arrowModule => {
          arrowModule.showTutorialArrow('.breeding-program[data-program="0"] .parent-slot:first-child .parent-action-btn', 'down');
        });
      }, 300);
    }
  });
}

export function renderBreedingPrograms() {
  const container = document.getElementById('breeding-programs-container');
  if (!container) return;

  container.innerHTML = '';

  // Only show programs up to the first locked one
  // (i.e., don't show locked program 2 until program 1 is unlocked)
  let showProgram = true;

  gameState.breedingPrograms.forEach(program => {
    // If we encounter a locked program, hide all subsequent programs
    if (!program.unlocked && program.program > 0) {
      // Check if the previous program is unlocked
      const previousProgram = gameState.breedingPrograms[program.program - 1];
      if (previousProgram && !previousProgram.unlocked) {
        showProgram = false;
      }
    }

    if (!showProgram) {
      return; // Skip rendering this program
    }

    const programDiv = document.createElement('div');
    programDiv.className = 'breeding-program-slot';
    programDiv.dataset.programSlot = program.program;

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
              ${parent1 ? `<span class="bird-rarity-biome">${RARITY[parent1.distinction]?.stars || ''} ${getBiomeEmoji(parent1.biome)}</span>` : ''}
            </div>
            <span class="breeding-icon">💕</span>
            <div class="parent">
              <span class="bird-name">${parent2?.speciesName || 'Unknown'}</span>
              ${parent2 ? `<span class="bird-rarity-biome">${RARITY[parent2.distinction]?.stars || ''} ${getBiomeEmoji(parent2.biome)}</span>` : ''}
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
        updateBreedingProgressBars();
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
                ? `<span class="bird-name">${parent1.speciesName}</span><span class="bird-rarity-biome">${RARITY[parent1.distinction]?.stars || ''} ${getBiomeEmoji(parent1.biome)}</span>${!parent1.isMature ? (() => {
                  const totalCost = MATURITY_COSTS[parent1.distinction] || 100;
                  const costPerTap = Math.ceil(totalCost * 0.1);
                  const maturityPercent = parent1.maturityProgress || 0;
                  const canAfford = gameState.seeds >= costPerTap;
                  return '<button class="mature-btn-inline" data-bird-id="' + parent1.id + '" ' + (!canAfford ? 'disabled' : '') + ' title="Maturity: ' + maturityPercent + '%">' + formatCompact(costPerTap) + '🫘</button>';
                })() : ''}`
                : '<span class="select-prompt">Select Parent 1</span>'}
            </button>
            <span class="breeding-icon">💕</span>
            <button class="parent-select-box" data-parent="2" data-program="${program.program}">
              ${parent2
                ? `<span class="bird-name">${parent2.speciesName}</span><span class="bird-rarity-biome">${RARITY[parent2.distinction]?.stars || ''} ${getBiomeEmoji(parent2.biome)}</span>${!parent2.isMature ? (() => {
                  const totalCost = MATURITY_COSTS[parent2.distinction] || 100;
                  const costPerTap = Math.ceil(totalCost * 0.1);
                  const maturityPercent = parent2.maturityProgress || 0;
                  const canAfford = gameState.seeds >= costPerTap;
                  return '<button class="mature-btn-inline" data-bird-id="' + parent2.id + '" ' + (!canAfford ? 'disabled' : '') + ' title="Maturity: ' + maturityPercent + '%">' + formatCompact(costPerTap) + '🫘</button>';
                })() : ''}`
                : '<span class="select-prompt">Select Parent 2</span>'}
            </button>
          </div>
          <button class="start-breeding-btn" data-program="${program.program}">
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

      // Mature button handlers (if present)
      const matureBtns = programDiv.querySelectorAll('.mature-btn-inline');
      matureBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation(); // Don't trigger parent box click
          const birdId = btn.dataset.birdId;
          const bird = getBirdById(birdId);
          if (bird && matureBird(birdId)) {
            updateHatcheryUI();
          } else {
            alert('Not enough Seeds for maturation!');
          }
        });
      });

      // Start breeding button
      const startBtn = programDiv.querySelector('.start-breeding-btn');
      startBtn.addEventListener('click', () => {
        // Check if we have both parents
        if (!parent1 || !parent2) {
          showBreedingRequirementsModal('You must select two parents before breeding.');
          return;
        }

        // Check if both parents are mature
        if (!parent1.isMature || !parent2.isMature) {
          showBreedingRequirementsModal('Both parents must be 100% mature before breeding. Use the Mature button to mature them.');
          return;
        }

        // Attempt to start breeding
        if (startBreeding(parent1.id, parent2.id, program.program)) {
          // Clear selections for this program
          if (selectedParent1?.programSlot === program.program) selectedParent1 = null;
          if (selectedParent2?.programSlot === program.program) selectedParent2 = null;
          updateHatcheryUI();
        } else {
          showBreedingRequirementsModal('Failed to start breeding. Please ensure both birds are available and mature.');
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
            const vitalityPercent = bird.vitalityPercent;
            const maturityPercent = bird.isMature ? 100 : 0;
            const vitalityStrokeOffset = 195 - (195 * vitalityPercent / 100);
            const maturityStrokeOffset = 157 - (157 * maturityPercent / 100);
            return `
              <div class="bird-selection-item ${isAssigned ? 'assigned' : ''}" data-bird-id="${bird.id}">
                <div class="btn-bird-icon-wrapper">
                  <svg class="bird-rings" viewBox="0 0 100 100">
                    <!-- Frame Ring (outermost, drawn first) -->
                    <circle class="frame-ring ${isAssigned ? 'greyed' : ''}" cx="50" cy="50" r="37" />
                    <!-- Vitality Ring (middle, green) -->
                    <circle class="vitality-ring-bg" cx="50" cy="50" r="31" />
                    <circle class="vitality-ring-fill ${isAssigned ? 'greyed' : ''}" cx="50" cy="50" r="31"
                            style="stroke-dashoffset: ${vitalityStrokeOffset}" />
                    <!-- Maturity Ring (innermost, blue, drawn last) -->
                    <circle class="maturity-ring-bg" cx="50" cy="50" r="25" />
                    <circle class="maturity-ring-fill ${isAssigned ? 'greyed' : ''}" cx="50" cy="50" r="25"
                            style="stroke-dashoffset: ${maturityStrokeOffset}" />
                  </svg>
                  <img src="/assets/birds/bird-${bird.distinction}star.png" class="btn-bird-icon ${isAssigned ? 'greyed' : ''}" />
                </div>
                <div class="bird-info">
                  <span class="bird-name">${bird.customDesignation || bird.speciesName}</span>
                  <span class="bird-rarity" style="color: ${RARITY[bird.distinction]?.color}">${RARITY[bird.distinction]?.stars}</span>
                  <span class="bird-biome">🌿 ${bird.biome.charAt(0).toUpperCase() + bird.biome.slice(1)}</span>
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
            const vitalityPercent = bird.vitalityPercent;
            const maturityPercent = bird.isMature ? 100 : 0;
            const vitalityStrokeOffset = 195 - (195 * vitalityPercent / 100);
            const maturityStrokeOffset = 157 - (157 * maturityPercent / 100);
            return `
              <div class="bird-selection-item immature" data-bird-id="${bird.id}">
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
                <div class="bird-info">
                  <span class="bird-name">${bird.customDesignation || bird.speciesName}</span>
                  <span class="bird-rarity" style="color: ${RARITY[bird.distinction]?.color}">${RARITY[bird.distinction]?.stars}</span>
                  <span class="bird-biome">🌿 ${bird.biome.charAt(0).toUpperCase() + bird.biome.slice(1)}</span>
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

      // Allow selection of immature birds - they can be matured in the parent box
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
      then spend Seeds to mature it for breeding.
    </p>
    <div class="modal-actions">
      <button id="close-message-btn">Understood</button>
    </div>
  `;

  content.querySelector('#close-message-btn').addEventListener('click', () => {
    modal.classList.add('hidden');
  });
}

function showBreedingRequirementsModal(message) {
  const modal = document.getElementById('modal-overlay');
  const content = document.getElementById('modal-content');

  content.innerHTML = `
    <h3>Cannot Start Breeding</h3>
    <p class="modal-message">
      ${message}
    </p>
    <div class="modal-actions">
      <button id="close-message-btn">Understood</button>
    </div>
  `;

  modal.classList.remove('hidden');

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

      // Update timer display
      const programDiv = document.querySelector(`[data-program-slot="${program.program}"]`);
      if (programDiv) {
        const timeRemaining = Math.max(0, program.estimatedDuration - (program.progress / 100 * program.estimatedDuration));
        const minutesRemaining = Math.floor(timeRemaining / 60000);
        const secondsRemaining = Math.floor((timeRemaining % 60000) / 1000);

        const timeRemainingEl = programDiv.querySelector('.time-remaining');
        const progressPercentEl = programDiv.querySelector('.progress-percent');

        if (timeRemainingEl) {
          timeRemainingEl.textContent = `${minutesRemaining}m ${secondsRemaining}s`;
        }
        if (progressPercentEl) {
          progressPercentEl.textContent = `${Math.floor(program.progress)}%`;
        }
      }
    }
  });
}
