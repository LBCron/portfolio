import { defineConfig, devices } from '@playwright/test';

import {
  ADMIN_PASSWORD,
  SESSION_SECRET,
  WEBHOOK_SECRET,
} from './tests/e2e/auth-constants';

const PORT = Number(process.env.E2E_PORT ?? 3100);
const baseURL = `http://localhost:${PORT}`;

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 1,
  workers: 2,
  timeout: 60_000,
  expect: { timeout: 10_000 },
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL,
    trace: 'retain-on-failure',
    actionTimeout: 15_000,
    navigationTimeout: 30_000,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
      testIgnore: 'stack.perf.spec.ts',
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
      testIgnore: 'stack.perf.spec.ts',
    },
    {
      name: 'mobile',
      use: { ...devices['Pixel 7'] },
      testIgnore: 'stack.perf.spec.ts',
    },
    {
      name: 'perf',
      dependencies: ['chromium', 'webkit', 'mobile'],
      use: {
        ...devices['Desktop Chrome'],
        trace: 'off',
        video: 'off',
        screenshot: 'off',
      },
      testMatch: 'stack.perf.spec.ts',
    },
  ],
  webServer: {
    command: `bun run start -p ${PORT}`,
    url: `${baseURL}/en`,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    env: {
      CONTENT_SOURCE: 'fixtures',
      ADMIN_PASSWORD,
      SESSION_SECRET,
      ADMIN_FIXTURE_WRITES: '1',
      SANITY_WEBHOOK_SECRET: WEBHOOK_SECRET,
    },
  },
});
