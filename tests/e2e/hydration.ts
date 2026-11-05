import { expect, type Locator, type Page } from '@playwright/test';

/**
 * React tags hydrated DOM nodes with `__reactFiber$…` keys.
 */
export async function waitForHydration(page: Page) {
  await page.waitForFunction(() => {
    const header = document.querySelector('header');

    return header !== null && Object.keys(header).some((key) => key.startsWith('__reactFiber$'));
  });
}

/**
 * Opens the terminal with its toggle shortcut. Pressing again while the lazy
 * window is still mounting would close it (slow on Firefox), so wait for
 * hydration first and give each press time to mount before retrying (D61).
 */
export async function openWithShortcut(page: Page, window: Locator) {
  await waitForHydration(page);
  await expect(async () => {
    await page.keyboard.press('Control+/');
    await expect(window).toHaveCount(1, { timeout: 5_000 });
  }).toPass({ timeout: 30_000 });
  await expect(window).toHaveAttribute('data-status', 'open');
}
