import { expect, type Page, test } from '@playwright/test';

import {
  isolateClient,
  logOf,
  openTerminal,
  run,
  signIn,
} from './admin-helpers';

/**
 * SPEC §15 headers and a zero-violation CSP run (D4, D56). Every page records
 * `securitypolicyviolation` events from the first byte, so a blocked script or
 * style anywhere (chunks, flight data, Motion, the terminal, admin) fails.
 */

async function watchCsp(page: Page) {
  await page.addInitScript(() => {
    const store: string[] = [];
    Object.defineProperty(window, '__cspViolations', { value: store });
    document.addEventListener('securitypolicyviolation', (event) => {
      store.push(
        `${event.violatedDirective} ${event.blockedURI || 'inline'} ${event.sourceFile}:${event.lineNumber}`,
      );
    });
  });
  const consoleErrors: string[] = [];
  page.on('console', (message) => {
    if (/content security policy/i.test(message.text())) {
      consoleErrors.push(message.text());
    }
  });
  return async () => {
    const violations = await page.evaluate(
      () =>
        (window as unknown as { __cspViolations: string[] }).__cspViolations,
    );
    return [...violations, ...consoleErrors];
  };
}

const COMMON = {
  'x-content-type-options': 'nosniff',
  'x-frame-options': 'DENY',
  'cross-origin-opener-policy': 'same-origin',
  'cross-origin-resource-policy': 'same-origin',
};

test.describe('security headers', () => {
  test('public pages carry the static CSP and the common headers', async ({
    request,
  }) => {
    for (const path of [
      '/en',
      '/pt/projects',
      '/en/projects/orbit-dashboard',
    ]) {
      const headers = (await request.get(path)).headers();
      for (const [name, value] of Object.entries(COMMON)) {
        expect(headers[name], `${path} ${name}`).toBe(value);
      }
      expect(headers['referrer-policy']).toBe(
        'strict-origin-when-cross-origin',
      );
      expect(headers['permissions-policy']).toContain('camera=()');
      const csp = headers['content-security-policy'] ?? '';
      expect(csp).toContain("default-src 'self'");
      expect(csp).toContain("object-src 'none'");
      expect(csp).toContain("frame-ancestors 'none'");
      expect(csp).toContain("base-uri 'none'");
      expect(csp).not.toContain('unsafe-eval');
      expect(csp).toMatch(/style-src 'self';/);
      expect(csp).not.toContain('nonce-');
    }
  });

  test('static assets are nosniff too', async ({ request, page }) => {
    await page.goto('/en');
    const src = await page
      .locator('script[src^="/_next/static/"]')
      .first()
      .getAttribute('src');
    expect(src).toBeTruthy();
    const headers = (await request.get(src ?? '')).headers();
    expect(headers['x-content-type-options']).toBe('nosniff');
  });

  test('the admin gets a per-request nonce and no referrer', async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name !== 'chromium', 'one browser is enough');
    await isolateClient(page);
    await signIn(page);
    const first = await page.request.get('/admin');
    const second = await page.request.get('/admin');
    const csp = first.headers()['content-security-policy'] ?? '';
    expect(csp).toMatch(/script-src 'self' 'nonce-[^']+' 'strict-dynamic';/);
    expect(csp).toMatch(/style-src 'self' 'nonce-[^']+';/);
    expect(csp).not.toEqual(second.headers()['content-security-policy']);
    expect(first.headers()['referrer-policy']).toBe('no-referrer');
    const nonce = /'nonce-([^']+)'/.exec(csp)?.[1] ?? '';
    expect(await first.text()).toContain(`nonce="${nonce}"`);
  });
});

test.describe('no CSP violations', () => {
  for (const path of [
    '/en',
    '/pt',
    '/en/projects',
    '/pt/projects/orbit-dashboard',
    '/en/accessibility',
    '/en/does-not-exist',
  ]) {
    test(`on ${path}`, async ({ page }) => {
      const violations = await watchCsp(page);
      await page.goto(path, { waitUntil: 'load' });
      await page.mouse.wheel(0, 4000);
      await page.waitForTimeout(500);
      expect(await violations()).toEqual([]);
    });
  }

  test('with the terminal and the lightbox open', async ({ page }) => {
    const violations = await watchCsp(page);
    await page.goto('/en/projects/orbit-dashboard');
    await page.getByRole('button', { name: /open image 1 of/i }).click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog')).toBeHidden();
    await openTerminal(page, '/en/projects/orbit-dashboard');
    await run(page, 'help');
    await expect(logOf(page)).toContainText('help');
    expect(await violations()).toEqual([]);
  });

  test('across the admin', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'chromium', 'one browser is enough');
    const violations = await watchCsp(page);
    await isolateClient(page);
    await signIn(page);
    await page.goto('/admin/projects', { waitUntil: 'load' });
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await page.goto('/admin/profile', { waitUntil: 'load' });
    await expect(page.locator('form[data-hydrated="true"]')).toBeVisible();
    expect(await violations()).toEqual([]);
  });
});
