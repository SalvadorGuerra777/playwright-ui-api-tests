import { defineConfig, devices } from '@playwright/test';

export const UI_URL = process.env.UI_URL ?? 'https://practicesoftwaretesting.com';
export const API_URL = process.env.API_URL ?? 'https://api.practicesoftwaretesting.com';

// The app is a shared public demo whose response times vary a lot (from under 1s
// to 20s+), so timeouts are more generous than for an app we control, and CI runs
// one worker to avoid adding load to it.
export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  timeout: 60_000,
  expect: { timeout: 15_000 },
  reporter: process.env.CI
    ? [['github'], ['list'], ['html', { open: 'never' }]]
    : [['list'], ['html', { open: 'never' }]],
  use: {
    testIdAttribute: 'data-test',
    navigationTimeout: 45_000,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'api',
      testDir: './tests/api',
      use: { baseURL: API_URL },
    },
    {
      name: 'ui',
      testDir: './tests/ui',
      use: { ...devices['Desktop Chrome'], baseURL: UI_URL },
    },
  ],
});
