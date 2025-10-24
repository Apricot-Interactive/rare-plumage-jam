// SANCTUARY - Modal System
// Handles all modal dialogs including tutorial, celebrations, and confirmations

import { gameState } from '../core/state.js';

// Show a simple toast notification
export function showToast(message, duration = 2000) {
  // Create toast element
  const toast = document.createElement('div');
  toast.className = 'toast-notification';
  toast.textContent = message;

  // Add to body
  document.body.appendChild(toast);

  // Trigger animation
  setTimeout(() => {
    toast.classList.add('show');
  }, 10);

  // Remove after duration
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => {
      toast.remove();
    }, 300);
  }, duration);
}

// Show a tutorial modal with text
export function showTutorialModal(text, style = 'normal', onNext = null) {
  const modal = document.getElementById('modal-overlay');
  const content = document.getElementById('modal-content');

  // Determine text styling
  const textClass = style === 'italic' ? 'modal-text-italic' : style === 'bold' ? 'modal-text-bold' : 'modal-text';

  // Convert \n to <br> for line breaks
  const formattedText = text.replace(/\n/g, '<br>');

  content.innerHTML = `
    <div class="tutorial-modal">
      <p class="${textClass}">${formattedText}</p>
      <div class="modal-actions">
        <button id="tutorial-next-btn" class="primary-btn">Next</button>
      </div>
    </div>
  `;

  modal.classList.remove('hidden');

  // Handle next button
  const nextBtn = content.querySelector('#tutorial-next-btn');
  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      console.log('Tutorial next button clicked');
      if (onNext) {
        console.log('Executing onNext callback');
        onNext();
      } else {
        console.log('No onNext callback, hiding modal');
        hideTutorialModal();
      }
    });
  } else {
    console.warn('Tutorial next button not found!');
  }
}

// Show bird celebration modal (used after survey completion or breeding)
export function showBirdCelebrationModal(bird, onNext = null) {
  const modal = document.getElementById('modal-overlay');
  const content = document.getElementById('modal-content');

  // Get star display
  const stars = '⭐'.repeat(bird.distinction);

  // Get ring display (visual indicator of distinction)
  let rings = '';
  for (let i = 0; i < bird.distinction; i++) {
    rings += `<div class="bird-ring ring-${i + 1}"></div>`;
  }

  content.innerHTML = `
    <div class="celebration-modal">
      <h3 class="modal-text-bold">Hello, ${bird.speciesName}!</h3>
      <div class="bird-celebration-card">
        <div class="bird-icon-large">
          <div class="bird-rings">${rings}</div>
          <div class="bird-sprite">🐦</div>
        </div>
        <div class="bird-celebration-name">${bird.speciesName}</div>
        <div class="bird-celebration-stars">${stars}</div>
      </div>
      <div class="modal-actions">
        <button id="celebration-next-btn" class="primary-btn">Next</button>
      </div>
    </div>
  `;

  modal.classList.remove('hidden');

  // Handle next button
  const nextBtn = content.querySelector('#celebration-next-btn');
  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      if (onNext) {
        onNext();
      } else {
        hideTutorialModal();
      }
    });
  }
}

// Hide tutorial modal
export function hideTutorialModal() {
  const modal = document.getElementById('modal-overlay');
  modal.classList.add('hidden');
}

// Track if modal click handler is attached
let modalClickHandlerAttached = false;

// Show modal (generic)
export function showModal(content, allowBackdropDismiss = true) {
  const modal = document.getElementById('modal-overlay');
  const modalContent = document.getElementById('modal-content');
  modalContent.innerHTML = content;
  modal.classList.remove('hidden');

  // Add click-outside-to-close functionality (only attach once)
  if (allowBackdropDismiss && !modalClickHandlerAttached) {
    modal.addEventListener('click', (e) => {
      // Only close if clicking the overlay itself, not the content
      if (e.target === modal) {
        hideModal();
      }
    });
    modalClickHandlerAttached = true;
  }
}

// Hide modal (generic)
export function hideModal() {
  const modal = document.getElementById('modal-overlay');
  modal.classList.add('hidden');
}

// Show narrative beat (for post-tutorial story moments)
export function showNarrativeBeat(beatId) {
  // TODO: Implement in Stage 6
  // This will use the NARRATIVE_TEXT from narrative.js
}

// Show prestige confirmation (formerly "reorganization")
export function showPrestigeConfirm() {
  // TODO: Implement in Stage 5
  // This will show the prestige confirmation with crystal preview
}
