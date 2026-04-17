// Firestore rules unit tests.
//
// This file is SCAFFOLDING. v8.0.0 will populate it with 80-120 real
// rule tests covering every rule in firestore.rules after the v8
// rewrite. For v7.9.3 it verifies only that the test infrastructure
// works: @firebase/rules-unit-testing loads the current rules file,
// helpers construct authenticated/unauthenticated contexts, and one
// placeholder assertion runs against current v7.9.2 rules.
//
// Requires the Firestore emulator at localhost:8080. Start it with:
//   npm run emulator:start
//
// Run: npm run test:rules
//
// Non-goals for v7.9.3:
//   - real rule coverage (deferred to v8.0.0)
//   - a fancy test framework (plain Node runner; matches scripts/*.js
//     style and keeps the dependency surface small)

const fs = require('fs');
const path = require('path');
const {
  initializeTestEnvironment,
  assertFails,
  assertSucceeds,
} = require('@firebase/rules-unit-testing');

const RULES_FILE = path.resolve(__dirname, '..', '..', 'firestore.rules');
const PROJECT_ID = 'parbaughs-rules-test';

// ───── Test-env lifecycle ─────

let testEnv = null;

async function setup() {
  testEnv = await initializeTestEnvironment({
    projectId: PROJECT_ID,
    firestore: {
      rules: fs.readFileSync(RULES_FILE, 'utf8'),
      host: 'localhost',
      port: 8080,
    },
  });
}

async function teardown() {
  if (testEnv) {
    await testEnv.cleanup();
    testEnv = null;
  }
}

// ───── Context helpers ─────
// v8.0.0 rule tests will compose these. Kept small and obvious so
// future additions stay readable.

function unauthenticated() {
  return testEnv.unauthenticatedContext().firestore();
}

function authenticatedAs(uid, claims = {}) {
  return testEnv.authenticatedContext(uid, claims).firestore();
}

// Seed a member doc with the given platformRole (and any extra fields).
// Uses withSecurityRulesDisabled so the seed bypasses rules — this is
// the standard pattern for setting up preconditions before a rule test.
async function withPlatformRole(uid, platformRole, extraFields = {}) {
  await testEnv.withSecurityRulesDisabled(async (ctx) => {
    await ctx.firestore().collection('members').doc(uid).set({
      id: uid,
      platformRole,
      ...extraFields,
    });
  });
}

// ───── Minimal test runner ─────

const results = [];

async function runTest(name, fn) {
  try {
    await fn();
    results.push({ name, passed: true });
    console.log('  \u2713 ' + name);
  } catch (e) {
    results.push({ name, passed: false, error: e && e.message ? e.message : String(e) });
    console.log('  \u2717 ' + name);
    if (e && e.message) console.log('    ' + e.message.split('\n')[0]);
  }
}

// ───── Tests ─────

async function runAll() {
  console.log('Firestore rules tests — v7.9.3 scaffolding');
  console.log('Rules file: ' + RULES_FILE);
  console.log('');

  await setup();

  // Clear any state from prior runs in this project namespace.
  await testEnv.clearFirestore();

  // Placeholder — confirms the whole pipeline works end-to-end:
  //   (1) rules file loaded into emulator
  //   (2) unauthenticated context creation works
  //   (3) assertFails from @firebase/rules-unit-testing works
  //   (4) the current v7.9.2 rules actually deny this read
  //
  // Verifies against firestore.rules "allow read: if isAuth();" for
  // the rounds collection. Unauthenticated reads must be rejected.
  await runTest('placeholder — unauthenticated read of rounds is denied under current rules', async () => {
    const db = unauthenticated();
    await assertFails(db.collection('rounds').doc('nonexistent').get());
  });

  // Secondary placeholder — confirms authenticated context helper works
  // and that the "allow read: if true" members rule is still permissive
  // under v7.9.2. v8.0.0 rewrites this to amIReadable() which will
  // change the expected behavior — this test will need updating then.
  await runTest('placeholder — authenticated read of members is allowed under current rules', async () => {
    const db = authenticatedAs('test_uid_placeholder');
    await assertSucceeds(db.collection('members').doc('any').get());
  });

  // Confirms withPlatformRole seed helper works. v8.0.0 rule tests
  // will use this pattern heavily. For v7.9.3 we just verify round-
  // trip: seed a doc, read it back through an authenticated context.
  await runTest('placeholder — withPlatformRole seeds a member doc that an authenticated context can read', async () => {
    await withPlatformRole('seed_test_uid', 'founder', { name: 'Seeded' });
    const db = authenticatedAs('seed_test_uid');
    const snap = await assertSucceeds(db.collection('members').doc('seed_test_uid').get());
    // @firebase/rules-unit-testing returns modular (v9) Firestore snapshots,
    // where `exists` is a property, not a method.
    if (!snap.exists) throw new Error('Seeded doc not readable');
    if (snap.data().platformRole !== 'founder') {
      throw new Error('Expected platformRole=founder, got ' + snap.data().platformRole);
    }
  });

  await teardown();

  const failed = results.filter(function (r) { return !r.passed; });
  console.log('');
  if (failed.length > 0) {
    console.error(failed.length + '/' + results.length + ' tests failed');
    process.exit(1);
  }
  console.log(results.length + '/' + results.length + ' tests passed');
}

runAll().catch(function (e) {
  console.error('Unhandled error in rules test runner:');
  console.error(e && e.stack ? e.stack : e);
  process.exit(1);
});
