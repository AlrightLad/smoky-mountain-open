#!/usr/bin/env node
// SECURITY NOTICE
// =====================================================================
// This script contains HARDCODED operational identity values for the
// Smoke Test Account (email, username, league slug, display name).
//
// These values are PUBLIC by design and provide no security value:
//   - Email "smoke@parbaughs.test" — .test TLD, never resolves
//   - Username "smoketest" — public account identifier
//   - League slug "smoke-test-league" — public league identifier
//
// SECURITY BOUNDARY: Real Firebase access requires:
//   1. scripts/.service-account.json (gitignored, never committed)
//   2. .env.local with SMOKE_PASSWORD (gitignored, never committed)
//
// Without those gitignored files, this script cannot authenticate to
// Firebase Admin SDK and cannot create or modify any resources.
//
// AUDIT LINEAGE:
//   - V1-V6 credential hardening audit: 2026-05-04 (commit 59e8837)
//   - V2 git history scan: 0 credential leaks ever
//   - V3 source tree scan: 0 leaks beyond intentional public values
//   - Hardcoded identity values reviewed and approved per same security
//     posture as existing committed admin scripts (e.g.,
//     restore-nick-achievements.js, the-parbaughs league slug usage)
//
// RECOVERY PROCEDURE:
//   If smoke account/league corrupted, re-run this script as documented
//   in docs/SMOKE_TEST_ACCOUNT.md "How to recreate" section.
//   Script regenerates a fresh password; update .env.local with new value.
//   Idempotency check refuses to overwrite existing entities (delete
//   first via Firebase Console if true reset needed).
// =====================================================================

// scripts/create-smoke-account.js — one-shot Smoke Test Account + League creator.
//
// Usage:
//   node scripts/create-smoke-account.js
//
// What it does:
//   1. Generates a fresh high-entropy password (crypto.randomBytes-based).
//   2. Creates Firebase Auth user smoke@parbaughs.test with emailVerified=true.
//   3. Creates league doc leagues/smoke-test-league (visibility=private, no founding badge).
//   4. Creates member doc members/<uid> with leagues=[smoke-test-league] + activeLeague=smoke-test-league.
//   5. Verifies all three. On any partial failure, rolls back Auth user + Firestore docs.
//   6. Prints the four .env.local values to stdout. Password is printed ONCE — capture it.
//
// Idempotency:
//   This script ABORTS if any of {Auth user, league doc, member doc} already exists.
//   Recovery procedure (per docs/SMOKE_TEST_ACCOUNT.md): delete the existing pieces
//   in Firebase Console first, then re-run this script. Password regenerates.
//
// Service account: scripts/.service-account.json (gitignored, V6 audit confirmed).

const admin = require('firebase-admin');
const crypto = require('crypto');

const SERVICE_ACCOUNT_PATH = require('path').resolve(__dirname, '.service-account.json');

// ── Configuration (locked per Ship 5+1 STEP 2 ruling) ──────────────────
const EMAIL = 'smoke@parbaughs.test';
const DISPLAY_NAME = '[TEST] Smoke';
const USERNAME = 'smoketest';
const LEAGUE_ID = 'smoke-test-league';
const LEAGUE_NAME = 'Smoke Test League';

// ── Password generator ─────────────────────────────────────────────────
function generatePassword() {
  // 67-char alphabet: ambiguous-friendly (no 0/O/1/l/I), mixed classes.
  var ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%^&*-_=+';
  var bytes = crypto.randomBytes(32);
  var out = '';
  for (var i = 0; i < bytes.length; i++) {
    out += ALPHABET[bytes[i] % ALPHABET.length];
  }
  // Defensive class enforcement: re-shuffle if any class missing.
  if (!/[A-Z]/.test(out) || !/[a-z]/.test(out) || !/[0-9]/.test(out) || !/[!@#$%^&*\-_=+]/.test(out)) {
    return generatePassword();
  }
  return out;
}

async function main() {
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert(require(SERVICE_ACCOUNT_PATH))
    });
  }
  var auth = admin.auth();
  var db = admin.firestore();
  var serverTs = admin.firestore.FieldValue.serverTimestamp();

  // ── Pre-flight: refuse to overwrite ──────────────────────────────────
  var preflightFailed = false;
  try {
    var existing = await auth.getUserByEmail(EMAIL);
    console.error('[ABORT] Auth user already exists for', EMAIL, '(uid:', existing.uid + ')');
    console.error('        Delete via Firebase Console > Authentication > Users, then re-run.');
    preflightFailed = true;
  } catch (e) {
    if (e.code !== 'auth/user-not-found') throw e;
  }
  var leagueDoc = await db.collection('leagues').doc(LEAGUE_ID).get();
  if (leagueDoc.exists) {
    console.error('[ABORT] League doc already exists at leagues/' + LEAGUE_ID);
    console.error('        Delete via Firebase Console > Firestore, then re-run.');
    preflightFailed = true;
  }
  if (preflightFailed) process.exit(1);

  // ── Generate password ────────────────────────────────────────────────
  var password = generatePassword();

  // ── 1. Create Auth user ──────────────────────────────────────────────
  console.log('[1/3] Creating Auth user...');
  var userRecord;
  try {
    userRecord = await auth.createUser({
      email: EMAIL,
      password: password,
      displayName: DISPLAY_NAME,
      emailVerified: true,
      disabled: false
    });
    console.log('      uid:', userRecord.uid);
  } catch (e) {
    console.error('[FAIL] Auth user creation:', e.message);
    process.exit(1);
  }
  var uid = userRecord.uid;

  // Define rollback to use if Firestore steps fail
  async function rollback(reason) {
    console.error('[ROLLBACK] Reason:', reason);
    console.error('[ROLLBACK] Deleting Auth user', uid);
    try { await auth.deleteUser(uid); console.error('[ROLLBACK] Auth user deleted.'); }
    catch (e) { console.error('[ROLLBACK] Failed to delete Auth user:', e.message, '— manual cleanup needed.'); }
    console.error('[ROLLBACK] Deleting any partial Firestore docs...');
    try { await db.collection('leagues').doc(LEAGUE_ID).delete(); } catch (_) {}
    try { await db.collection('members').doc(uid).delete(); } catch (_) {}
    process.exit(1);
  }

  // ── 2. Create league doc ─────────────────────────────────────────────
  console.log('[2/3] Creating league doc leagues/' + LEAGUE_ID + '...');
  try {
    await db.collection('leagues').doc(LEAGUE_ID).set({
      name: LEAGUE_NAME,
      slug: LEAGUE_ID,
      location: 'Test',
      founded: 2026,
      badge: null,
      tier: null,
      visibility: 'private',
      commissioner: uid,
      admins: [uid],
      memberCount: 1,
      memberUids: [uid],
      inviteCode: null,
      theme: null,
      isTestLeague: true,
      createdAt: serverTs,
      settings: {
        seasons: false,
        parcoins: true,
        wagers: false,
        bounties: false,
        trashTalk: false
      }
    });
  } catch (e) {
    return rollback('league doc creation failed: ' + e.message);
  }

  // ── 3. Create member doc ─────────────────────────────────────────────
  console.log('[3/3] Creating member doc members/' + uid + '...');
  try {
    await db.collection('members').doc(uid).set({
      // identity
      id: uid,
      email: EMAIL,
      username: USERNAME,
      name: DISPLAY_NAME,

      // role + access
      role: 'member',
      founding: false,
      isFoundingFour: false,

      // progression
      level: 1,
      xp: 0,
      parcoins: 0,
      parcoinsLifetime: 0,
      earnedAchievements: [],
      equippedTitle: null,
      equippedCosmetics: {},
      displayBadges: [],
      badges: [],

      // computed stats
      computedHandicap: null,
      computedAvg: null,
      computedBest: null,
      roundCount: 0,
      totalRounds: 0,
      avgScore: null,
      bestRound: null,

      // profile content
      bio: null,
      homeCourse: null,
      theme: null,
      clubs: null,
      bag: null,
      funnyFacts: null,

      // invites + state
      invitesUsed: 0,
      maxInvites: 0,
      onboardingComplete: true,
      appearance: 'light',

      // league scoping
      leagues: [LEAGUE_ID],
      activeLeague: LEAGUE_ID,

      // audit + defensive flag
      createdAt: serverTs,
      isTestAccount: true
    });
  } catch (e) {
    return rollback('member doc creation failed: ' + e.message);
  }

  // ── Verify ───────────────────────────────────────────────────────────
  console.log('');
  console.log('Verifying...');
  var [authBack, leagueBack, memberBack] = await Promise.all([
    auth.getUser(uid),
    db.collection('leagues').doc(LEAGUE_ID).get(),
    db.collection('members').doc(uid).get()
  ]);
  if (!authBack || authBack.email !== EMAIL || !authBack.emailVerified) {
    return rollback('Auth user verification failed');
  }
  if (!leagueBack.exists || leagueBack.data().visibility !== 'private' || leagueBack.data().commissioner !== uid) {
    return rollback('league doc verification failed');
  }
  if (!memberBack.exists || memberBack.data().activeLeague !== LEAGUE_ID || !memberBack.data().isTestAccount) {
    return rollback('member doc verification failed');
  }
  console.log('  ✓ Auth user:', authBack.email, '(emailVerified=' + authBack.emailVerified + ')');
  console.log('  ✓ League doc:', leagueBack.data().name, '(visibility=' + leagueBack.data().visibility + ')');
  console.log('  ✓ Member doc:', memberBack.data().name, '(activeLeague=' + memberBack.data().activeLeague + ')');

  // ── Output the four .env.local values ────────────────────────────────
  console.log('');
  console.log('─────────────────────────────────────────────────────────────');
  console.log('  PASTE THESE FOUR LINES INTO .env.local');
  console.log('─────────────────────────────────────────────────────────────');
  console.log('SMOKE_EMAIL=' + EMAIL);
  console.log('SMOKE_PASSWORD=' + password);
  console.log('SMOKE_LEAGUE_ID=' + LEAGUE_ID);
  console.log('SMOKE_USER_UID=' + uid);
  console.log('─────────────────────────────────────────────────────────────');
  console.log('');
  console.log('Password is shown ONCE. Capture it now. If lost: delete the');
  console.log('account/league via Firebase Console and re-run this script.');
  console.log('');
}

main().catch(function(e) {
  console.error('FATAL:', e.stack || e.message || e);
  process.exit(2);
});
