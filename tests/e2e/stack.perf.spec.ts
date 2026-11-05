import { expect, type Page, test } from '@playwright/test';

async function waitFrames(page: Page, count: number) {
  await page.evaluate(
    (frames) =>
      new Promise<void>((resolve) => {
        let n = 0;
        const tick = () => {
          n += 1;

          if (n < frames) {
            requestAnimationFrame(tick);

            return;
          }

          resolve();
        };

        requestAnimationFrame(tick);
      }),
    count,
  );
}

test('geoid holds 50 fps under 4× CPU throttle', async ({ page }) => {
  await page.goto('/en', { waitUntil: 'domcontentloaded' });
  await page.locator('#stack').evaluate((el) => {
    el.scrollIntoView({ block: 'center' });
  });
  await expect(page.locator('[data-cloud-item]').first()).toBeAttached();
  await page.waitForFunction(() => {
    const el = document.querySelector('[data-cloud-item]') as HTMLElement | null;

    return Boolean(el?.style.transform.includes('translate3d'));
  });
  await page.evaluate(() =>
    Promise.all(
      [...document.querySelectorAll<HTMLImageElement>('#stack img')].map((img) =>
        img.decode().catch(() => undefined),
      ),
    ),
  );
  await waitFrames(page, 60);

  const session = await page.context().newCDPSession(page);

  await session.send('Emulation.setCPUThrottlingRate', { rate: 4 });
  await waitFrames(page, 90);

  const fps = await page.evaluate(async () => {
    let frames = 0;
    const start = performance.now();

    await new Promise<void>((resolve) => {
      const tick = (now: number) => {
        if (now - start >= 1000) {
          resolve();

          return;
        }

        frames += 1;
        requestAnimationFrame(tick);
      };

      requestAnimationFrame(tick);
    });

    return frames;
  });

  expect(fps).toBeGreaterThanOrEqual(50);
});
