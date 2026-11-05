import { expect, type Page } from '@playwright/test';

import { ADMIN_PASSWORD } from './auth-constants';
import { openWithShortcut } from './hydration';

export const windowOf = (page: Page) => page.locator('[data-window=terminal]');
export const inputOf = (page: Page) => page.getByRole('textbox', { name: /Command input/ });
export const passwordOf = (page: Page) => page.getByLabel('Password', { exact: true });
export const logOf = (page: Page) => page.getByRole('log', { name: 'Terminal output' });

export async function openTerminal(page: Page, path = '/en'): Promise<void> {
  await page.goto(path, { waitUntil: 'domcontentloaded' });
  await openWithShortcut(page, windowOf(page));
  await expect(inputOf(page)).toBeFocused();
}

export async function run(page: Page, line: string): Promise<void> {
  await inputOf(page).fill(line);
  await inputOf(page).press('Enter');
}

export async function submitPassword(page: Page, password: string): Promise<void> {
  await expect(passwordOf(page)).toBeFocused();
  await passwordOf(page).fill(password);
  await passwordOf(page).press('Enter');
}

/**
 * Signs in through the terminal and lands on the dashboard.
 */
export async function signIn(page: Page): Promise<void> {
  await openTerminal(page);
  await run(page, 'su julio');
  await submitPassword(page, ADMIN_PASSWORD);
  await expect(page).toHaveURL(/\/admin$/);
  await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();
}

/**
 * Gives each test its own client key, so the login rate limiter is not shared.
 */
export async function isolateClient(page: Page): Promise<void> {
  await page.context().setExtraHTTPHeaders({
    'x-forwarded-for': `10.${Math.floor(Math.random() * 250)}.${Math.floor(Math.random() * 250)}.${Math.floor(Math.random() * 250)}`,
  });
}
