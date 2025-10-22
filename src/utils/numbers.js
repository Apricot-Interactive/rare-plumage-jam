// SANCTUARY - Number Formatting Utilities

export function formatNumber(n) {
  if (n < 10000) {
    // Format with commas: 1,234
    return Math.floor(n).toLocaleString('en-US');
  }

  if (n < 1000000) {
    // Format as K: 12.5K
    return (n / 1000).toFixed(1) + 'K';
  }

  if (n < 1000000000) {
    // Format as M: 2.3M
    return (n / 1000000).toFixed(1) + 'M';
  }

  // Format as B: 1.2B
  return (n / 1000000000).toFixed(1) + 'B';
}

export function formatSeeds(n) {
  return formatNumber(n);
}

// Compact format for buttons - always uses k/m notation
export function formatCompact(n) {
  if (n < 1000) {
    return Math.floor(n).toString();
  }

  if (n < 1000000) {
    // Format as k: 12k or 1.5k
    const k = n / 1000;
    return k >= 10 ? Math.floor(k) + 'k' : k.toFixed(1) + 'k';
  }

  // Format as m: 2m or 1.5m
  const m = n / 1000000;
  return m >= 10 ? Math.floor(m) + 'm' : m.toFixed(1) + 'm';
}

export function formatPercent(n) {
  return Math.floor(n) + '%';
}

export function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}
