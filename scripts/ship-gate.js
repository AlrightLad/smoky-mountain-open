#!/usr/bin/env node
// Full pre-ship validation pipeline.
// Expected state: Firebase emulator already running in another terminal.
// Usage: npm run ship-gate

const { spawnSync } = require('child_process');

function run(cmd, args) {
  console.log('\n> ' + cmd + ' ' + args.join(' '));
  const result = spawnSync(cmd, args, { stdio: 'inherit', shell: true });
  return result.status === 0;
}

async function main() {
  console.log('═══ PARBAUGHS SHIP GATE ═══');

  if (!run('npm', ['run', 'lint'])) {
    console.error('\n✗ Lint failed');
    process.exit(1);
  }

  try {
    const res = await fetch('http://localhost:8080/', { signal: AbortSignal.timeout(2000) });
    // Any response from the Firestore emulator (even 404) is proof it's alive.
    void res;
  } catch (e) {
    console.error('\n✗ Firebase emulator not running on localhost:8080');
    console.error('  Start it in another terminal:  npm run emulator:start');
    process.exit(1);
  }

  if (!run('npm', ['run', 'test:rules'])) {
    console.error('\n✗ Firestore rules tests failed');
    process.exit(1);
  }

  if (!run('npx', ['playwright', 'test'])) {
    console.error('\n✗ E2E tests failed');
    process.exit(1);
  }

  if (!run('npm', ['run', 'verify'])) {
    console.error('\n✗ Verify failed against production');
    process.exit(1);
  }

  console.log('\n✓ SHIP GATE PASSED — safe to push');
}

main().catch(e => { console.error(e); process.exit(1); });
