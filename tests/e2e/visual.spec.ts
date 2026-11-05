import { expect, type Page, test } from '@playwright/test';

/**
 * §18 visual snapshots of the hero and the project cards at 375, 768 and 1440
 * px (D61). Baselines are Linux PNGs: CI compares them, and locally they run
 * only with VISUAL=1 (add --update-snapshots to regenerate). The
 * `visual-baselines` workflow regenerates them on the CI image.
 */

const WIDTHS = [375, 768, 1440] as const;

test.skip(
  !process.env['CI'] && !process.env['VISUAL'],
  'visual baselines are checked in CI (set VISUAL=1 to run locally)',
);

async function settle(page: Page, width: number, path: string): Promise<void> {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.setViewportSize({ width, height: width < 768 ? 812 : 900 });
  await page.goto(path);
  await page.evaluate(() => document.fonts.ready);
  await page.waitForLoadState('networkidle');
}

for (const width of WIDTHS) {
  test(`hero ${width}`, async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'chromium', 'one renderer');
    await settle(page, width, '/en');
    await expect(page).toHaveScreenshot(`hero-${width}.png`, {
      // The dock hint and its chip depend on session timing.
      mask: [page.locator('[role="status"]')],
    });
  });

  test(`cards ${width}`, async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'chromium', 'one renderer');
    await settle(page, width, '/en/projects');

    const firstCard = page.locator('main ul > li').first();

    await firstCard.scrollIntoViewIfNeeded();
    await expect(firstCard).toHaveScreenshot(`card-${width}.png`);
  });
}
