import AxeBuilder from '@axe-core/playwright';
import { expect, type Page, test } from '@playwright/test';

/**
 * §14.9 accessibility pass: axe on the remaining route types and emulated
 * modes, reflow at 320 CSS px (400% zoom), keyboard-only flows, focus never
 * hidden under the sticky header, and the motion controls.
 */

const AXE_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice'];

const axe = (page: Page) =>
  new AxeBuilder({ page }).withTags(AXE_TAGS).exclude('[data-reveal=pending]').analyze();

const chromiumOnly = (projectName: string): void =>
  test.skip(projectName !== 'chromium', 'axe and emulation run on Chromium');

test.describe('axe on every route type', () => {
  for (const path of [
    '/pt/projects',
    '/pt/projects/orbit-dashboard',
    '/pt/accessibility',
    '/en/projects?kind=web',
    '/en/does-not-exist',
    '/pt/nao-existe',
    '/nope',
  ]) {
    test(path, async ({ page }, testInfo) => {
      chromiumOnly(testInfo.project.name);
      await page.goto(path);
      expect((await axe(page)).violations).toEqual([]);
    });
  }

  // Not forced colors: axe reads authored colors there, while Chromium does
  // force system colors (checked in the motion block below).
  for (const [label, media] of [
    ['more contrast', { contrast: 'more' }],
    ['reduced motion', { reducedMotion: 'reduce' }],
  ] as const) {
    test(`Home with ${label}`, async ({ page }, testInfo) => {
      chromiumOnly(testInfo.project.name);
      await page.emulateMedia(media);
      await page.goto('/en');
      expect((await axe(page)).violations).toEqual([]);
    });
  }
});

test.describe('reflow', () => {
  for (const [label, width] of [
    ['400% zoom (320 px)', 320],
    ['200% zoom (640 px)', 640],
  ] as const) {
    for (const path of [
      '/en',
      '/pt/projects',
      '/en/projects/orbit-dashboard',
      '/pt/accessibility',
    ]) {
      test(`${path} at ${label} has no horizontal scroll`, async ({ page }, testInfo) => {
        chromiumOnly(testInfo.project.name);
        await page.setViewportSize({ width, height: 640 });
        await page.emulateMedia({ reducedMotion: 'reduce' });
        await page.goto(path);

        const overflow = await page.evaluate(
          () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
        );

        expect(overflow).toBeLessThanOrEqual(0);
      });
    }
  }

  test('text-spacing overrides do not clip the hero or cards', async ({ browser }, testInfo) => {
    chromiumOnly(testInfo.project.name);

    // The CSP rightly blocks the injected stylesheet otherwise.
    const context = await browser.newContext({ bypassCSP: true });
    const page = await context.newPage();

    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/en/projects');
    await page.addStyleTag({
      content:
        '* { line-height: 1.5 !important; letter-spacing: 0.12em !important; word-spacing: 0.16em !important; } p { margin-bottom: 2em !important; }',
    });

    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );

    expect(overflow).toBeLessThanOrEqual(0);
    await context.close();
  });
});

test.describe('keyboard only', () => {
  test.beforeEach(async ({ page }, testInfo) => {
    test.skip(testInfo.project.name === 'mobile', 'keyboard flows target desktop');
    await page.emulateMedia({ reducedMotion: 'reduce' });
  });

  test('the skip link is the first stop and moves focus to main', async ({ page, browserName }) => {
    test.skip(browserName === 'webkit', 'WebKit skips links on Tab unless the OS setting is on');
    await page.goto('/en');
    await page.keyboard.press('Tab');

    const skip = page.getByRole('link', { name: 'Skip to main content' });

    await expect(skip).toBeFocused();
    await expect(skip).toBeInViewport();
    await page.keyboard.press('Enter');
    await expect(page.locator('main#main')).toBeFocused();
  });

  test('the projects filter is one tab stop with arrow keys', async ({ page }) => {
    await page.goto('/en/projects');

    const group = page.getByRole('radiogroup', { name: /filter/i });
    const radios = group.getByRole('radio');

    await expect(radios.first()).toHaveAttribute('tabindex', '0');
    await expect(radios.nth(1)).toHaveAttribute('tabindex', '-1');
    await radios.first().focus();
    await page.keyboard.press('ArrowRight');
    await expect(radios.nth(1)).toBeFocused();
    await page.keyboard.press('End');
    await expect(radios.last()).toBeFocused();
    await page.keyboard.press('Home');
    await expect(radios.first()).toBeFocused();
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press(' ');
    await expect(page).toHaveURL(/\?kind=/);
    await expect(page.getByRole('radio', { checked: true }).first()).toHaveAttribute(
      'tabindex',
      '0',
    );
  });

  test('the gallery lightbox opens, pages and restores focus', async ({ page }) => {
    await page.goto('/en/projects/orbit-dashboard');

    const opener = page.getByRole('button', { name: /open image 1 of/i });

    await opener.focus();
    await page.keyboard.press('Enter');

    const dialog = page.getByRole('dialog');

    await expect(dialog).toBeVisible();
    await expect(dialog.locator(':focus')).toHaveCount(1);
    await page.keyboard.press('ArrowRight');
    await expect(dialog).toContainText(/2/);
    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
    await expect(opener).toBeFocused();
  });

  test('the language switcher roves with arrows', async ({ page }) => {
    await page.goto('/en');

    const group = page.getByRole('banner').getByRole('group', { name: 'Language' });
    const links = group.getByRole('link');

    await expect(links.nth(1)).toHaveAttribute('tabindex', '-1');
    await links.first().focus();
    await page.keyboard.press('ArrowRight');
    await expect(links.nth(1)).toBeFocused();
  });

  test('focus is never hidden under the sticky header', async ({ page, browserName }) => {
    test.skip(browserName === 'webkit', 'Tab skips links on WebKit');
    await page.goto('/en/projects/orbit-dashboard');

    const hidden: string[] = [];
    for (let step = 0; step < 40; step++) {
      await page.keyboard.press('Tab');
      await page.waitForTimeout(150);

      // Obscured = the topmost element at the focus target's centre belongs
      // to the sticky header rather than to the target.
      const result = await page.evaluate(() => {
        const element = document.activeElement as HTMLElement | null;
        const header = document.querySelector('header');

        if (!element || !header || header.contains(element)) return null;

        const rect = element.getBoundingClientRect();

        if (rect.height === 0 || rect.bottom < 0) return null;

        const x = rect.left + rect.width / 2;
        const y = Math.max(rect.top + rect.height / 2, 0);
        const top = document.elementFromPoint(x, y);

        return top && !element.contains(top) && header.contains(top)
          ? element.outerHTML.slice(0, 80)
          : null;
      });

      if (result) hidden.push(result);
    }
    expect(hidden).toEqual([]);
  });

  test('without JavaScript every language and filter link is reachable', async ({ browser }) => {
    const context = await browser.newContext({ javaScriptEnabled: false });
    const page = await context.newPage();

    await page.goto('/en/projects');
    for (const locator of [
      page.getByRole('radiogroup').getByRole('radio'),
      page.getByRole('banner').getByRole('group').getByRole('link'),
    ]) {
      for (const tabindex of await locator.evaluateAll((nodes) =>
        nodes.map((node) => node.getAttribute('tabindex')),
      )) {
        expect(tabindex === null || tabindex === '0').toBe(true);
      }
    }
    await context.close();
  });
});

test.describe('motion', () => {
  const infinite = (page: Page): Promise<number> =>
    page.evaluate(
      () =>
        document
          .getAnimations()
          .filter(
            (animation) =>
              animation.playState === 'running'
              && animation.effect?.getTiming().iterations === Infinity,
          ).length,
    );

  test('reduced motion stops every looping animation', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/en');
    await page.waitForTimeout(500);
    expect(await infinite(page)).toBe(0);
  });

  test('the Pause animations toggle stops them without the media query', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await page.goto('/en');

    const toggle = page.getByRole('contentinfo').getByRole('button', { name: 'Pause animations' });

    await toggle.evaluate((element) => {
      element.scrollIntoView({ block: 'center' });
      (element as HTMLButtonElement).click();
    });
    await expect(toggle).toHaveAttribute('aria-pressed', 'true');
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(500);
    expect(await infinite(page)).toBe(0);
  });

  test('focus rings stay visible in forced colors', async ({ page }, testInfo) => {
    chromiumOnly(testInfo.project.name);
    await page.emulateMedia({ forcedColors: 'active' });
    await page.goto('/en/projects');

    const link = page.getByRole('radiogroup').getByRole('radio').first();

    await link.focus();

    const outline = await link.evaluate((element) => {
      const style = getComputedStyle(element);

      return { style: style.outlineStyle, width: style.outlineWidth };
    });

    expect(outline.style).not.toBe('none');
    expect(Number.parseFloat(outline.width)).toBeGreaterThanOrEqual(2);
  });
});
