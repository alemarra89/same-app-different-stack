import { defineConfig, devices } from '@playwright/test';
export default defineConfig({
  testDir: './tests/e2e', workers: 1, reporter: 'list',
  use: { baseURL: 'http://127.0.0.1:42831', trace: 'retain-on-failure' },
  projects: [
    { name: 'mobile-chromium', use: { ...devices['Pixel 7'], browserName: 'chromium', channel: process.env.PLAYWRIGHT_CHANNEL } },
    { name: 'desktop-chromium', use: { viewport: { width: 1280, height: 900 }, browserName: 'chromium', channel: process.env.PLAYWRIGHT_CHANNEL } },
  ],
  webServer: { command: 'npm run preview -- --port 42831 --strictPort', url: 'http://127.0.0.1:42831', reuseExistingServer: false },
});
