// Playwright config for Capacitor webview smoke tests.
//
// Runs against the BUILT bundle (dist/), not the Vite dev server. Verifies
// the bundle works in the same shape Capacitor will embed it (file:// load,
// PB.native.* abstractions present).
//
// Usage:
//   npm run build && npm run test:capacitor
//
// Mobile project list mirrors the iOS / Android targets Capacitor ships to:
//   - iPhone 14 (iOS minimum support)
//   - Pixel 7 (Android baseline)
//   - iPad mini (tablet form factor, optional)

const { defineConfig, devices } = require('@playwright/test');

module.exports = defineConfig({
    testDir: './tests/capacitor',
    timeout: 30000,
    retries: 1,
    workers: 1,
    reporter: [['list'], ['html', { open: 'never', outputFolder: 'playwright-report-capacitor' }]],
    use: {
        // No baseURL — tests open file:// dist/index.html directly
        trace: 'on-first-retry',
        screenshot: 'only-on-failure',
        video: 'retain-on-failure',
    },
    projects: [
        { name: 'iphone-14', use: { ...devices['iPhone 14'] } },
        { name: 'pixel-7',  use: { ...devices['Pixel 7']  } },
    ],
    // No webServer — tests run against the built bundle on disk
});
