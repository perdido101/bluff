import { defineConfig } from 'cypress';

export default defineConfig({
  e2e: {
    baseUrl: 'http://localhost:3000',
    viewportWidth: 1280,
    viewportHeight: 720,
    video: true,
    screenshotOnRunFailure: true,
    browsers: [
      {
        name: 'chrome',
        family: 'chromium',
        channel: 'stable',
      },
      {
        name: 'firefox',
        family: 'firefox',
        channel: 'stable',
      },
      {
        name: 'edge',
        family: 'chromium',
        channel: 'stable',
      }
    ],
    setupNodeEvents(on, config) {
      require('@cypress/code-coverage/task')(on, config);
      
      // Add mobile device configuration
      on('before:browser:launch', (browser, launchOptions) => {
        if (browser.family === 'chromium') {
          launchOptions.args.push('--touch-events');
          launchOptions.args.push('--enable-viewport');
          // Add performance monitoring flags
          launchOptions.args.push('--enable-precise-memory-info');
          launchOptions.args.push('--js-flags=--expose-gc');
          launchOptions.args.push('--disable-background-timer-throttling');
        }
        return launchOptions;
      });
      
      return config;
    },
  },
  component: {
    devServer: {
      framework: 'create-react-app',
      bundler: 'webpack',
    },
  },
  retries: {
    runMode: 2,
    openMode: 0,
  },
  viewportDefaults: {
    desktop: {
      width: 1920,
      height: 1080,
    },
    tablet: {
      width: 768,
      height: 1024,
    },
    mobile: {
      width: 375,
      height: 812,
    },
  },
  experimentalWebKitSupport: true,
  defaultCommandTimeout: 10000,
  scrollBehavior: 'center',
  responseTimeout: 30000,
  pageLoadTimeout: 60000,
  numTestsKeptInMemory: 0, // Reduce memory usage during performance tests
}); 