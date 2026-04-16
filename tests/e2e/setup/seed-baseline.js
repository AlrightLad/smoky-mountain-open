#!/usr/bin/env node
// Seeds the local Firebase emulator with synthetic test fixtures.
// Usage: node tests/e2e/setup/seed-baseline.js
// Also called from global-setup.js before Playwright test runs.
// Idempotent — safe to run repeatedly.

process.env.FIRESTORE_EMULATOR_HOST = 'localhost:8080';
process.env.FIREBASE_AUTH_EMULATOR_HOST = 'localhost:9099';
process.env.GCLOUD_PROJECT = 'parbaughs';

const admin = require('firebase-admin');
const users = require('./fixtures/users.js').users;
const rounds = require('./fixtures/rounds.js').rounds;
const leagues = require('./fixtures/leagues.js').leagues;

const PROJECT_ID = 'parbaughs';

function app() {
  if (!admin.apps.length) admin.initializeApp({ projectId: PROJECT_ID });
  return admin.app();
}

async function assertEmulator() {
  // A simple TCP reachability check via a Firestore read against the emulator.
  const db = app().firestore();
  try {
    await db.collection('_e2e_ping').limit(1).get();
  } catch (e) {
    throw new Error(
      'Firebase emulator not reachable at localhost:8080 / localhost:9099. ' +
      'Start it in another terminal: npm run emulator:start\n  (' + e.message + ')'
    );
  }
}

async function clearCollection(db, name) {
  const snap = await db.collection(name).get();
  if (snap.empty) return 0;
  // Firestore batch limit = 500.
  let count = 0;
  let batch = db.batch();
  let pending = 0;
  for (const doc of snap.docs) {
    batch.delete(doc.ref);
    pending++;
    count++;
    if (pending === 400) {
      await batch.commit();
      batch = db.batch();
      pending = 0;
    }
  }
  if (pending > 0) await batch.commit();
  return count;
}

async function clearAllAuth() {
  const auth = app().auth();
  // Delete everyone — emulator only.
  const list = await auth.listUsers(1000);
  const uids = list.users.map(u => u.uid);
  if (uids.length === 0) return 0;
  await auth.deleteUsers(uids);
  return uids.length;
}

async function seedAuth() {
  const auth = app().auth();
  for (const u of users) {
    try {
      await auth.createUser({
        uid: u.uid,
        email: u.email,
        password: u.password,
        displayName: u.memberDoc.name,
        emailVerified: true,
      });
    } catch (e) {
      // Already exists — update instead.
      if (String(e.code).indexOf('already-exists') !== -1 || String(e.message).indexOf('already') !== -1) {
        await auth.updateUser(u.uid, { email: u.email, password: u.password, displayName: u.memberDoc.name });
      } else {
        throw e;
      }
    }
  }
}

async function seedMembers(db) {
  let batch = db.batch();
  let pending = 0;
  for (const u of users) {
    batch.set(db.collection('members').doc(u.uid), u.memberDoc);
    pending++;
    if (pending === 400) { await batch.commit(); batch = db.batch(); pending = 0; }
  }
  if (pending > 0) await batch.commit();
}

async function seedRounds(db) {
  let batch = db.batch();
  let pending = 0;
  for (const r of rounds) {
    batch.set(db.collection('rounds').doc(r.id), r);
    pending++;
    if (pending === 400) { await batch.commit(); batch = db.batch(); pending = 0; }
  }
  if (pending > 0) await batch.commit();
}

async function seedLeagues(db) {
  for (const lg of leagues) {
    await db.collection('leagues').doc(lg.id).set(lg.doc);
  }
}

async function run() {
  await assertEmulator();
  const db = app().firestore();

  console.log('[seed] Clearing existing test data…');
  const [m, r, l] = await Promise.all([
    clearCollection(db, 'members'),
    clearCollection(db, 'rounds'),
    clearCollection(db, 'leagues'),
  ]);
  const a = await clearAllAuth();
  console.log('[seed]   cleared: ' + m + ' members, ' + r + ' rounds, ' + l + ' leagues, ' + a + ' auth users');

  console.log('[seed] Seeding auth users…');
  await seedAuth();

  console.log('[seed] Seeding Firestore…');
  await seedMembers(db);
  await seedRounds(db);
  await seedLeagues(db);

  console.log('[seed] Seeded ' + users.length + ' users, ' + rounds.length + ' rounds, ' + leagues.length + ' leagues');
}

module.exports = { run };

if (require.main === module) {
  run()
    .then(() => process.exit(0))
    .catch(e => { console.error('[seed] FAILED:', e.message); process.exit(1); });
}
