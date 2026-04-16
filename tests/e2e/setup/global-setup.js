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
    await ping('localhost', 8080);
    await ping('localhost', 9099);
  } catch (e) {
    console.error('\n  Firebase emulator not running.');
    console.error('  Start it in another terminal:  npm run emulator:start');
    console.error('  (' + e.message + ')\n');
    process.exit(1);
  }

  const seed = require('./seed-baseline.js');
  await seed.run();
};
