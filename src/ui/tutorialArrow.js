// SANCTUARY - Tutorial Arrow Component
// Displays an animated bouncing arrow that points to UI elements

let currentArrowElement = null;
let currentResizeHandler = null;

// Wait for element to be laid out with valid dimensions
function waitForLayout(element, callback, attempts = 0) {
  const rect = element.getBoundingClientRect();
  const hasValidDimensions = rect.width > 0 && rect.height > 0 && (rect.left !== 0 || rect.top !== 0);

  if (hasValidDimensions) {
    console.log(`waitForLayout succeeded after ${attempts} attempts:`, {
      rect: { left: rect.left, top: rect.top, width: rect.width, height: rect.height }
    });
    callback();
  } else if (attempts < 50) { // Try for up to 500ms
    setTimeout(() => waitForLayout(element, callback, attempts + 1), 10);
  } else {
    console.warn('Element never got valid dimensions after 50 attempts, positioning anyway:', {
      rect: { left: rect.left, top: rect.top, width: rect.width, height: rect.height }
    });
    callback();
  }
}

// Show tutorial arrow pointing to a specific element
export function showTutorialArrow(targetSelector, direction = 'down') {
  console.log('showTutorialArrow called', { targetSelector, direction });

  // Remove any existing arrow
  hideTutorialArrow();
  console.log('Existing arrow hidden');

  // Find target element
  const targetElement = document.querySelector(targetSelector);
  console.log('Target element:', targetElement);

  if (!targetElement) {
    console.warn('Tutorial arrow target not found:', targetSelector);
    return;
  }

  // Create arrow element
  const arrow = document.createElement('div');
  arrow.className = 'tutorial-arrow';
  arrow.dataset.direction = direction;

  // Arrow icons based on direction
  const arrowIcons = {
    up: '↑',
    down: '↓',
    left: '←',
    right: '→'
  };

  arrow.textContent = arrowIcons[direction] || '↓';
  console.log('Arrow element created:', arrow);

  // Add to body
  document.body.appendChild(arrow);
  currentArrowElement = arrow;
  console.log('Arrow added to body');

  // Wait for target to have valid layout before positioning
  waitForLayout(targetElement, () => {
    // Position arrow relative to target
    positionArrow(arrow, targetElement, direction);
    console.log('Arrow positioned after layout');

    // Reposition on window resize
    currentResizeHandler = () => positionArrow(arrow, targetElement, direction);
    window.addEventListener('resize', currentResizeHandler);
    console.log('Resize handler attached');

    // Show arrow with animation
    setTimeout(() => {
      arrow.classList.add('visible');
      console.log('Arrow visible class added');
    }, 50);
  });
}

// Position arrow relative to target element
function positionArrow(arrow, target, direction) {
  const rect = target.getBoundingClientRect();
  console.log('Positioning arrow', {
    direction,
    rect: { left: rect.left, top: rect.top, right: rect.right, bottom: rect.bottom, width: rect.width, height: rect.height }
  });

  let left, top;

  switch (direction) {
    case 'up':
      left = rect.left + rect.width / 2;
      top = rect.bottom + 20;
      break;

    case 'down':
      left = rect.left + rect.width / 2;
      top = rect.top - 25; // Arrow bottom just above target
      break;

    case 'left':
      left = rect.right + 20;
      top = rect.top + rect.height / 2;
      break;

    case 'right':
      left = rect.left - 60;
      top = rect.top + rect.height / 2;
      break;
  }

  arrow.style.left = `${left}px`;
  arrow.style.top = `${top}px`;

  console.log('Arrow positioned at', { left, top });
}

// Hide tutorial arrow
export function hideTutorialArrow() {
  if (currentArrowElement) {
    // Remove resize handler
    if (currentResizeHandler) {
      window.removeEventListener('resize', currentResizeHandler);
      currentResizeHandler = null;
    }

    // Remove element
    currentArrowElement.remove();
    currentArrowElement = null;
  }
}

// Check if arrow is currently shown
export function isArrowVisible() {
  return currentArrowElement !== null;
}
