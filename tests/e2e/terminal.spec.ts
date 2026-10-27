import AxeBuilder from '@axe-core/playwright';
import { expect, type Page, test } from '@playwright/test';

const SHORTCUT = 'Control+/';

// Reduced motion keeps WebKit's actionability check from waiting on the hero
// loops (D36) and makes the boot lines instant; one test covers the typing.
test.beforeEach(async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
});

const windowOf = (page: Page) => page.locator('[data-window=terminal]');
const inputOf = (page: Page) =>
  page.getByRole('textbox', { name: /Command input/ });
const logOf = (page: Page) =>
  page.getByRole('log', { name: 'Terminal output' });

async function openTerminal(page: Page, path = '/en') {
  await page.goto(path, { waitUntil: 'domcontentloaded' });
  await expect(async () => {
    await page.keyboard.press(SHORTCUT);
    await expect(windowOf(page)).toHaveAttribute('data-status', 'open', {
      timeout: 1_000,
    });
  }).toPass();
  await expect(inputOf(page)).toBeFocused();
}

async function run(page: Page, line: string) {
  await inputOf(page).fill(line);
  await inputOf(page).press('Enter');
}

test.describe('entry points', () => {
  test('the dock chip, header toggle and hero button open the terminal', async ({
    page,
  }) => {
    await page.goto('/en', { waitUntil: 'domcontentloaded' });
    await page.getByRole('button', { name: 'terminal', exact: true }).click();
    await expect(windowOf(page)).toHaveAttribute('data-status', 'open');
    await page.getByRole('button', { name: 'Close terminal' }).click();
    await expect(windowOf(page)).toHaveAttribute('data-status', 'closed');

    await page.getByRole('button', { name: 'Toggle terminal' }).click();
    await expect(windowOf(page)).toHaveAttribute('data-status', 'open');
    await page.getByRole('button', { name: 'Close terminal' }).click();

    await page.getByRole('button', { name: 'Open the terminal' }).click();
    await expect(windowOf(page)).toHaveAttribute('data-status', 'open');
  });

  test('the footer mentions the shortcut', async ({ page }) => {
    await page.goto('/en', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('footer')).toContainText('to open the terminal');
    await expect(page.locator('footer kbd')).toBeVisible();
  });

  test('the dock hint appears once per session without motion preference', async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await page.goto('/en', { waitUntil: 'domcontentloaded' });
    await expect(page.getByText('Try the terminal: type help')).toBeVisible({
      timeout: 5_000,
    });
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2_500);
    await expect(page.getByText('Try the terminal: type help')).toHaveCount(0);
  });
});

test.describe('shell', () => {
  test('boots with the banner and the welcome lines', async ({ page }) => {
    await openTerminal(page);
    await expect(logOf(page)).toContainText(
      'Welcome. This terminal knows everything on this site.',
    );
    await expect(logOf(page)).toContainText('Type help to get started.');
  });

  test('types the boot lines unless a key skips them', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await openTerminal(page);
    await expect(logOf(page)).toContainText('Type help to get started.', {
      timeout: 5_000,
    });
  });

  test('help lists the groups; its chips run commands', async ({ page }) => {
    await openTerminal(page);
    await run(page, 'help');
    for (const group of ['Navigate', 'Explore', 'Site', 'Fun']) {
      await expect(logOf(page)).toContainText(group);
    }
    await logOf(page)
      .getByRole('button', { name: 'about', exact: true })
      .click();
    await expect(logOf(page)).toContainText('visitor@julio-muller:~$ about');
  });

  test('quick action chips run their command', async ({ page }) => {
    await openTerminal(page);
    await page
      .getByRole('list', { name: 'Quick commands' })
      .getByRole('button', { name: 'projects' })
      .click();
    await expect(logOf(page)).toContainText('orbit-dashboard');
    await expect(logOf(page)).not.toContainText('scratch-pad');
  });

  test('unknown commands suggest and unsupported syntax explains', async ({
    page,
  }) => {
    await openTerminal(page);
    await run(page, 'hepl');
    await expect(logOf(page)).toContainText('command not found: hepl');
    await expect(logOf(page)).toContainText('Did you mean help?');
    await run(page, 'ls; pwd');
    await expect(logOf(page)).toContainText('Chaining commands');
  });

  test('names reserved for later are plain unknown commands', async ({
    page,
  }) => {
    await openTerminal(page);
    await run(page, 'admin');
    await expect(logOf(page)).toContainText('command not found: admin');
  });

  test('navigates the virtual file system and follows the title', async ({
    page,
  }) => {
    await openTerminal(page);
    await run(page, 'cd projects');
    await expect(
      page.getByRole('toolbar', { name: 'Window controls' }),
    ).toContainText('visitor@julio-muller: ~/projects');
    await run(page, 'ls');
    await expect(logOf(page)).toContainText('pay-bridge.md');
    await run(page, 'cat pay-bridge.md');
    await expect(logOf(page)).toContainText('Pay');
    await run(page, 'cd ..');
    await expect(
      page.getByRole('toolbar', { name: 'Window controls' }),
    ).toContainText('visitor@julio-muller: ~');
  });

  test('Tab completes, lists candidates on a second Tab, and leaves when idle', async ({
    page,
  }) => {
    await openTerminal(page);
    const input = inputOf(page);
    await input.fill('cd pro');
    await input.press('Tab');
    await expect(input).toHaveValue('cd projects/');

    await input.fill('s');
    await input.press('Tab');
    await input.press('Tab');
    await expect(logOf(page)).toContainText('skills');
    await expect(logOf(page)).toContainText('socials');

    await input.fill('');
    await input.press('Tab');
    await expect(input).not.toBeFocused();
  });

  test('history, line editing and clearing', async ({ page }) => {
    await openTerminal(page);
    await run(page, 'pwd');
    await run(page, 'whoami');
    const input = inputOf(page);
    await input.press('ArrowUp');
    await expect(input).toHaveValue('whoami');
    await input.press('ArrowUp');
    await expect(input).toHaveValue('pwd');
    await input.press('ArrowDown');
    await input.press('ArrowDown');
    await expect(input).toHaveValue('');

    await input.fill('hello big world');
    await input.press('Control+w');
    await expect(input).toHaveValue('hello big ');
    await input.press('Control+a');
    await input.press('Control+k');
    await expect(input).toHaveValue('');
    await input.fill('abc');
    await input.press('Control+u');
    await expect(input).toHaveValue('');

    await input.fill('typed');
    await input.press('Control+c');
    await expect(logOf(page)).toContainText('typed^C');
    await expect(input).toHaveValue('');

    await input.press('Control+l');
    await expect(logOf(page)).not.toContainText('whoami');
  });

  test('a multi-line paste runs only the first line', async ({ page }) => {
    await openTerminal(page);
    await inputOf(page).evaluate((element) => {
      const data = new DataTransfer();
      data.setData('text', 'echo first\nwhoami');
      element.dispatchEvent(
        new ClipboardEvent('paste', {
          clipboardData: data,
          bubbles: true,
          cancelable: true,
        }),
      );
    });
    await expect(logOf(page)).toContainText('Only the first line');
    await expect(logOf(page)).toContainText('first');
    await expect(logOf(page)).not.toContainText('whoami');
  });

  test('open navigates while the window stays', async ({ page }) => {
    await openTerminal(page);
    await run(page, 'open pay-bridge');
    await expect(page).toHaveURL(/\/en\/projects\/pay-bridge$/);
    await expect(windowOf(page)).toHaveAttribute('data-status', 'open');
    await expect(logOf(page)).toContainText('Opening');
    await run(page, 'projects open orbit-dashboard');
    await expect(page).toHaveURL(/\/en\/projects\/orbit-dashboard$/);
  });

  test('goto scrolls to a section', async ({ page }) => {
    await openTerminal(page);
    await run(page, 'goto stack');
    await expect(page).toHaveURL(/#stack$/);
    await expect(page.locator('#stack')).toBeInViewport();
  });

  test('goto from a project page goes home first', async ({ page }) => {
    await openTerminal(page, '/en/projects/pay-bridge');
    await run(page, 'goto contact');
    await expect(page).toHaveURL(/\/en#contact$/);
  });

  test('lang switches the site and keeps the session', async ({ page }) => {
    await openTerminal(page);
    await run(page, 'lang pt');
    await expect(page).toHaveURL(/\/pt/);
    await expect(windowOf(page)).toHaveAttribute('data-status', 'open');
    // The log and the input names are localized too.
    const log = page.getByRole('log', { name: 'Saída do terminal' });
    const input = page.getByRole('textbox', { name: /Entrada de comando/ });
    await expect(log).toContainText('Language switched to Português.');
    await input.fill('help');
    await input.press('Enter');
    await expect(log).toContainText('Navegar');
    await input.fill('hepl');
    await input.press('Enter');
    await expect(log).toContainText('comando não encontrado: hepl');
  });

  test('resume --download opens the PDF route in a new tab', async ({
    page,
  }) => {
    await openTerminal(page);
    const popup = page.waitForEvent('popup');
    await run(page, 'resume --download');
    await popup;
    await expect(logOf(page)).toContainText('Downloading the résumé');
  });

  test('git log, neofetch and skills show only snapshot data', async ({
    page,
  }) => {
    await openTerminal(page);
    await run(page, 'git log --oneline');
    await expect(logOf(page)).toContainText('(HEAD -> main)');
    await run(page, 'neofetch');
    await expect(logOf(page)).toContainText('Curitiba');
    await run(page, 'skills --category frontend');
    await expect(logOf(page)).toContainText('React');
  });

  test('persists across reload; closing ends the log but keeps history', async ({
    page,
  }) => {
    await openTerminal(page);
    await run(page, 'echo remembered');
    await page.reload({ waitUntil: 'domcontentloaded' });
    await expect(windowOf(page)).toHaveAttribute('data-status', 'open');
    await expect(logOf(page)).toContainText('remembered');

    await page.getByRole('button', { name: 'Close terminal' }).click();
    await page.getByRole('button', { name: 'terminal', exact: true }).click();
    await expect(logOf(page)).not.toContainText('remembered');
    await expect(logOf(page)).toContainText('Type help to get started.');
    await inputOf(page).press('ArrowUp');
    await expect(inputOf(page)).toHaveValue('echo remembered');
  });

  test('exit closes, minimize and maximize drive the window', async ({
    page,
    isMobile,
  }) => {
    await openTerminal(page);
    if (!isMobile) {
      await run(page, 'maximize');
      await expect(
        page.getByRole('button', { name: 'Restore terminal' }),
      ).toBeVisible();
    }
    await run(page, 'minimize');
    await expect(windowOf(page)).toHaveAttribute('data-status', 'minimized');
    await page.getByRole('button', { name: 'terminal (minimized)' }).click();
    await run(page, 'exit');
    await expect(windowOf(page)).toHaveAttribute('data-status', 'closed');
  });
});

test.describe('snapshot endpoint', () => {
  test('is public, noindex and free of hidden or private data', async ({
    request,
  }) => {
    for (const locale of ['en', 'pt']) {
      const response = await request.get(
        `/api/terminal-content?locale=${locale}`,
      );
      expect(response.status()).toBe(200);
      expect(response.headers()['x-robots-tag']).toContain('noindex');
      const body = await response.text();
      expect(body).not.toContain('scratch-pad');
      expect(body).not.toContain('Sofia Demo');
      expect(body).not.toContain('phone');
      expect(JSON.parse(body)).toMatchObject({ locale });
    }
  });

  test('rejects unknown locales', async ({ request }) => {
    expect(
      (await request.get('/api/terminal-content?locale=xx')).status(),
    ).toBe(404);
    expect((await request.get('/api/terminal-content')).status()).toBe(404);
  });
});

test.describe('mobile', () => {
  test.beforeEach(({ isMobile }) => {
    test.skip(!isMobile, 'covered by the desktop projects');
  });

  test('uses 16px input text and quick actions in the sheet', async ({
    page,
  }) => {
    await openTerminal(page);
    await expect(inputOf(page)).toHaveCSS('font-size', '16px');
    await page
      .getByRole('list', { name: 'Quick commands' })
      .getByRole('button', { name: 'contact' })
      .click();
    await expect(logOf(page)).toContainText('hello@example.com');
  });
});

test.describe('accessibility', () => {
  test('has no axe violations with output on screen', async ({
    page,
    browserName,
  }) => {
    test.skip(browserName === 'webkit', 'axe runs on Chromium projects (D23)');
    await openTerminal(page);
    await run(page, 'help');
    await run(page, 'projects');
    await run(page, 'tree');
    await expect(logOf(page)).toContainText('orbit-dashboard');
    await windowOf(page).evaluate((element) =>
      Promise.all(
        element
          .getAnimations({ subtree: true })
          .map((animation) => animation.finished),
      ),
    );
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
      .exclude('[data-reveal=pending]')
      .analyze();
    expect(results.violations).toEqual([]);
  });
});
