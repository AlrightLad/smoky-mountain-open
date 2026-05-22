// Playwright globalSetup — runs once before the whole test suite.
// Verifies the Firebase emulator is up, then seeds baseline fixtures.

const http = require('http');

function ping(host, port) {
  return new Promise((resolve, reject) => {
    const req = http.get({ host, port, path: '/', timeout: 2000 }, res => {
      res.resume();
      resolve(true);
    });
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('timeout')); });
  });
}

module.exports = async () => {
  try {
    // 127.0.0.1 not localhost — see tests/e2e/helpers/auth.js for the
    // Windows + Node 20+ IPv6 resolution bug behind this.
    await ping('127.0.0.1', 8080);
    await ping('127.0.0.1', 9099);
  } catch (e) {
    console.error('\n  Firebase emulator not running.');
    console.error('  Start it in another terminal:  npm run emulator:start');
    console.error('  (' + e.message + ')\n');
    process.exit(1);
  }

  const seed = require('./seed-baseline.js');
  await seed.run();
};
