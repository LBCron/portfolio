import { expect, type Page, test } from '@playwright/test';

import { waitForHydration } from './hydration';

/**
 * Records every view transition the page starts and the pseudo-element
 * animations that run once it is ready (D62).
 */
async function recordTransitions(page: Page) {
  await page.evaluate(() => {
    const record: { started: number; animations: string[] } = {
      started: 0,
      animations: [],
    };
    Object.assign(window, { __vt: record });
    const start = document.startViewTransition.bind(document);
    document.startViewTransition = ((argument: Parameters<typeof start>[0]) => {
      const transition = start(argument);
      record.started += 1;
      void transition.ready.then(() => {
        record.animations = document.getAnimations().flatMap((animation) => {
          const effect = animation.effect;
          return effect instanceof KeyframeEffect && effect.pseudoElement
            ? [effect.pseudoElement]
            : [];
        });
      });
      return transition;
    }) as typeof document.startViewTransition;
  });
}

function recorded(page: Page) {
  return page.evaluate(
    () =>
      (window as unknown as { __vt: { started: number; animations: string[] } })
        .__vt,
  );
}

async function openOrbitFromWork(page: Page) {
  await page.goto('/en');
  await waitForHydration(page);
  const link = page.getByRole('link', {
    name: 'View details about Orbit Dashboard',
  });
  await link.scrollIntoViewIfNeeded();
  // Hovering prefetches the detail page, so it renders in the same commit.
  await link.hover();
  await recordTransitions(page);
  await expect(async () => {
    await link.click();
    await expect(page).toHaveURL(/\/en\/projects\/orbit-dashboard$/, {
      timeout: 5_000,
    });
  }).toPass({ timeout: 20_000 });
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(
    'Orbit Dashboard',
  );
}

test.describe('card → detail view transition', () => {
  test.skip(
    ({ browserName }) => browserName !== 'chromium',
    'View Transition types and classes are checked on Chromium',
  );

  test('morphs the clicked cover into the detail hero', async ({ page }) => {
    await openOrbitFromWork(page);
    await expect
      .poll(async () => (await recorded(page)).animations)
      .toContain('::view-transition-group(project-cover-orbit-dashboard)');
    const { animations } = await recorded(page);
    expect(animations).toContain(
      '::view-transition-new(project-cover-orbit-dashboard)',
    );
    // The new page starts at the top, so the hero is what the cover lands on.
    expect(await page.evaluate(() => window.scrollY)).toBe(0);
  });

  test('is instant with reduced motion', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await openOrbitFromWork(page);
    const { animations } = await recorded(page);
    expect(animations.filter((name) => name.includes('project-cover'))).toEqual(
      [],
    );
  });

  test('works as a plain link without JavaScript', async ({ browser }) => {
    const context = await browser.newContext({ javaScriptEnabled: false });
    const page = await context.newPage();
    await page.goto('/en');
    await page
      .getByRole('link', { name: 'View details about Orbit Dashboard' })
      .click();
    await expect(page).toHaveURL(/\/en\/projects\/orbit-dashboard$/);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(
      'Orbit Dashboard',
    );
    await context.close();
  });
});
