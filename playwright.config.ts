import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  webServer: {
    command: 'npx vite preview --port 4173 --strictPort',
    url: 'http://localhost:4173',
    reuseExistingServer: !process.env.CI,
  },
  use: { baseURL: 'http://localhost:4173' },
  // Canvas Tab/Enter timing has a rare race (map arrival announce vs title
  // teardown); one retry absorbs it without hiding real breakage.
  retries: 1,
  workers: 1,
  projects: [
    { name: 'chromium', use: { browserName: 'chromium' } },
    {
      name: 'mobile-portrait',
      use: { browserName: 'chromium', viewport: { width: 390, height: 844 }, hasTouch: true },
    },
  ],
});