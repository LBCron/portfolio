import { useSyncExternalStore } from 'react';

import { MOTION_STORAGE_KEY } from './motion-init';

const REDUCED_QUERY = '(prefers-reduced-motion: reduce)';

function subscribe(onChange: () => void) {
  const media = window.matchMedia(REDUCED_QUERY);
  const observer = new MutationObserver(onChange);

  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['data-motion'],
  });
  media.addEventListener('change', onChange);

  return (): void => {
    observer.disconnect();
    media.removeEventListener('change', onChange);
  };
}

function isPausedSnapshot(): boolean {
  return document.documentElement.dataset.motion === 'reduced';
}

/**
 * Reads the preference right now (system setting or site toggle).
 */
export function isMotionReduced(): boolean {
  return isPausedSnapshot() || window.matchMedia(REDUCED_QUERY).matches;
}

/**
 * True when the visitor paused animations with the site toggle.
 */
export function useMotionPaused(): boolean {
  return useSyncExternalStore(subscribe, isPausedSnapshot, () => false);
}

/**
 * True when motion must be reduced: system preference or site toggle.
 */
export function useReducedMotionPreference(): boolean {
  return useSyncExternalStore(subscribe, isMotionReduced, () => false);
}

export function setMotionPaused(paused: boolean): void {
  const root = document.documentElement;

  if (paused) root.dataset.motion = 'reduced';
  else delete root.dataset.motion;

  try {
    if (paused) localStorage.setItem(MOTION_STORAGE_KEY, 'reduced');
    else localStorage.removeItem(MOTION_STORAGE_KEY);
  } catch {
    // Storage can be unavailable (private mode, disabled); the toggle still
    // works for the current page.
  }
}
