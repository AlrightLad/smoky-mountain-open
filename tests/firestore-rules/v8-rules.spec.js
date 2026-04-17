// ═════════════════════════════════════════════════════════════════════
// Firestore rules unit tests — v8.0.0-rc1
// ═════════════════════════════════════════════════════════════════════
//
// Tests the rules in firestore.rules against the Firestore emulator.
// Covers:
//   - 14 helpers (isAuth through isBannedFromLeague)
//   - Every existing collection rule (members, rounds, chat, dms, ...)
//   - 6 new collections (platformConfig, founder_access_logs,
//     moderation_log, platform_announcements, erasure_requests,
//     transfer_requests)
//   - Section 1.8 enforcement fixes (gaps 1/2/5/7 covered; gap 6 was
//     preserved from v7.9.5; gaps 3/4/8 tested implicitly)
//   - Section 3.7 edge cases (suspended mid-rename, ban cross-league,
//     founder transfer authority)
//
// Requires the Firestore emulator at localhost:8080. Run:
//   npm run emulator:start     # in another terminal
//   npm run emulator:seed      # optional — tests seed their own state
//   npm run test:rules
//
// Each test is idempotent: it seeds the exact state it needs via
// withSecurityRulesDisabled, then runs the assertion against the
// rules-enforced context. testEnv.clearFirestore() wipes state
// between tests to avoid leakage.

const fs = require('fs');
const path = require('path');
const {
  initializeTestEnvironment,
  assertFails,
  assertSucceeds,
} = require('@firebase/rules-unit-testing');

const RULES_FILE = path.resolve(__dirname, '..', '..', 'firestore.rules');
const PROJECT_ID = 'parbaughs-rules-test';

// UIDs used throughout. Keep short + memorable for test output readability.
const FOUNDER = 'founder_uid';
const USER_A = 'user_a_uid';
const USER_B = 'user_b_uid';
const USER_C = 'user_c_uid';
const SUSP = 'suspended_uid';
const BANNED = 'banned_uid';
const COMM = 'commissioner_uid';     // per-league commissioner (platform user)
const ADMIN = 'admin_uid';            // per-league admin
const LEAGUE_A = 'league_a';
const LEAGUE_B = 'league_b';
const FOUNDING_LEAGUE = 'the-parbaughs';

// ─── Test env lifecycle ─────────────────────────────────────────────

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

// ─── Context helpers ────────────────────────────────────────────────

function unauthenticated() {
  return testEnv.unauthenticatedContext().firestore();
}

function authenticatedAs(uid, claims = {}) {
  return testEnv.authenticatedContext(uid, claims).firestore();
}

// ─── Seed helpers — bypass rules via withSecurityRulesDisabled ──────

async function seedMember(uid, fields = {}) {
  await testEnv.withSecurityRulesDisabled(async (ctx) => {
    await ctx.firestore().collection('members').doc(uid).set({
      id: uid,
      ...fields,
    });
  });
}

async function withPlatformRole(uid, platformRole, extra = {}) {
  await seedMember(uid, { platformRole, ...extra });
}

async function withSuspension(uid, suspension, extra = {}) {
  await seedMember(uid, {
    platformRole: 'suspended',
    suspension: {
      until: null,
      reason: '',
      reasonPrivate: false,
      issuedBy: FOUNDER,
      issuedAt: null,
      ...suspension,
    },
    ...extra,
  });
}

async function withBan(uid, ban, extra = {}) {
  await seedMember(uid, {
    platformRole: 'banned',
    ban: {
      reason: '',
      reasonPrivate: false,
      issuedBy: FOUNDER,
      issuedAt: null,
      ...ban,
    },
    ...extra,
  });
}

// Legacy role (no platformRole) — for fallback tests.
async function withLegacyRole(uid, role, extra = {}) {
  await testEnv.withSecurityRulesDisabled(async (ctx) => {
    const data = { id: uid, ...extra };
    if (role) data.role = role;
    await ctx.firestore().collection('members').doc(uid).set(data);
  });
}

async function withFounderConfig(founderUid) {
  await testEnv.withSecurityRulesDisabled(async (ctx) => {
    await ctx.firestore().collection('platformConfig').doc('singleton').set({
      founderUid,
      founderTransfer: null,
      platformVersion: '8.0.0',
    });
  });
}

async function withLeague(leagueId, fields = {}) {
  await testEnv.withSecurityRulesDisabled(async (ctx) => {
    await ctx.firestore().collection('leagues').doc(leagueId).set({
      name: 'Test League',
      commissioner: COMM,
      admins: [COMM],
      memberUids: [COMM],
      memberCount: 1,
      bans: [],
      visibility: 'private',
      badge: '',
      pendingCommissionerTransfer: null,
      customBranding: null,
      ...fields,
    });
  });
}

async function seedDoc(path, fields) {
  await testEnv.withSecurityRulesDisabled(async (ctx) => {
    const parts = path.split('/');
    let ref = ctx.firestore();
    for (let i = 0; i < parts.length; i += 2) {
      ref = ref.collection(parts[i]);
      if (parts[i + 1] != null) ref = ref.doc(parts[i + 1]);
    }
    await ref.set(fields);
  });
}

// ─── Minimal test runner ────────────────────────────────────────────

const results = [];

async function runTest(name, fn) {
  try {
    // Fresh state for every test — no leakage
    await testEnv.clearFirestore();
    await fn();
    results.push({ name, passed: true });
    console.log('  \u2713 ' + name);
  } catch (e) {
    const msg = e && e.message ? e.message : String(e);
    results.push({ name, passed: false, error: msg });
    console.log('  \u2717 ' + name);
    console.log('    ' + msg.split('\n')[0]);
  }
}

// Group wrapper for output readability only.
async function group(name, fn) {
  console.log('');
  console.log('── ' + name + ' ──');
  await fn();
}

// ═════════════════════════════════════════════════════════════════════
// TESTS
// ═════════════════════════════════════════════════════════════════════

async function runAll() {
  console.log('v8.0.0-rc1 Firestore rules unit tests');
  console.log('Rules file: ' + RULES_FILE);

  await setup();

  // ─────────────────────────────────────────────────────────────────
  // HELPERS — via indirect testing (can't call helpers directly;
  // we assert via rules that depend on each helper)
  // ─────────────────────────────────────────────────────────────────

  await group('isAuth / auth context', async () => {
    await runTest('unauthenticated cannot read any collection', async () => {
      const db = unauthenticated();
      await assertFails(db.collection('rounds').doc('x').get());
    });

    await runTest('authenticated can read rounds (baseline)', async () => {
      await withPlatformRole(USER_A, 'user');
      const db = authenticatedAs(USER_A);
      await assertSucceeds(db.collection('rounds').doc('nonexistent').get());
    });
  });

  await group('platformRoleOf fallback — legacy role mapping', async () => {
    await runTest('explicit platformRole="user" is honored', async () => {
      await withPlatformRole(USER_A, 'user');
      const db = authenticatedAs(USER_A);
      // If recognized as "user", member read on another doc should work
      await seedMember(USER_B, { platformRole: 'user' });
      await assertSucceeds(db.collection('members').doc(USER_B).get());
    });

    await runTest('legacy role="commissioner" (no platformRole) treated as founder', async () => {
      // Pre-migration state: no platformConfig, no platformRole, just legacy role
      await withLegacyRole(USER_A, 'commissioner');
      const db = authenticatedAs(USER_A);
      // Founder-only capability: create platform_announcement
      await assertSucceeds(
        db.collection('platform_announcements').doc('a1').set({
          version: 'v8.0.0',
          title: 'Hi',
          body: 'Hi',
          audience: 'all',
        })
      );
    });

    await runTest('legacy role="member" (no platformRole) treated as user', async () => {
      await withLegacyRole(USER_A, 'member');
      const db = authenticatedAs(USER_A);
      await assertFails(
        db.collection('platform_announcements').doc('a1').set({
          version: 'v8.0.0', title: 'x', body: 'x', audience: 'all',
        })
      );
    });

    await runTest('legacy role="suspended" treated as suspended (no writes)', async () => {
      await withLegacyRole(USER_A, 'suspended');
      const db = authenticatedAs(USER_A);
      await assertFails(db.collection('members').doc(USER_A).update({ name: 'test' }));
    });

    await runTest('legacy role="removed" treated as banned (no reads of others)', async () => {
      await withLegacyRole(USER_A, 'removed');
      await seedMember(USER_B, { platformRole: 'user' });
      const db = authenticatedAs(USER_A);
      await assertFails(db.collection('members').doc(USER_B).get());
    });

    await runTest('missing both fields defaults to user', async () => {
      await seedMember(USER_A, {}); // no role, no platformRole
      const db = authenticatedAs(USER_A);
      // Should be able to act as normal user (e.g., create own invite)
      await assertSucceeds(
        db.collection('invites').doc('inv1').set({
          code: 'INV1', createdBy: USER_A, status: 'active',
        })
      );
    });
  });

  await group('amIFounder — explicit config + legacy fallback', async () => {
    await runTest('founder via platformConfig.founderUid match', async () => {
      await withFounderConfig(FOUNDER);
      await withPlatformRole(FOUNDER, 'founder');
      const db = authenticatedAs(FOUNDER);
      await assertSucceeds(
        db.collection('platform_announcements').doc('x').set({
          version: 'v8.0.0', title: 'x', body: 'x', audience: 'all',
        })
      );
    });

    await runTest('non-founder via platformConfig is blocked from founder-only writes', async () => {
      await withFounderConfig(FOUNDER);
      await withPlatformRole(USER_A, 'user');
      const db = authenticatedAs(USER_A);
      await assertFails(
        db.collection('platform_announcements').doc('x').set({
          version: 'v8.0.0', title: 'x', body: 'x', audience: 'all',
        })
      );
    });

    await runTest('founder via legacy role when platformConfig missing', async () => {
      // No platformConfig/singleton exists
      await withLegacyRole(USER_A, 'commissioner');
      const db = authenticatedAs(USER_A);
      await assertSucceeds(
        db.collection('platform_announcements').doc('y').set({
          version: 'v8.0.0', title: 'y', body: 'y', audience: 'all',
        })
      );
    });

    await runTest('platformConfig takes precedence over legacy role', async () => {
      // Legacy role says USER_A is commissioner, but platformConfig says FOUNDER is founder
      await withFounderConfig(FOUNDER);
      await withLegacyRole(USER_A, 'commissioner');
      const db = authenticatedAs(USER_A);
      await assertFails(
        db.collection('platform_announcements').doc('z').set({
          version: 'v8.0.0', title: 'z', body: 'z', audience: 'all',
        })
      );
    });
  });

  await group('amIActive vs amIReadable — suspended/banned semantics', async () => {
    await runTest('user: can read and write', async () => {
      await withPlatformRole(USER_A, 'user');
      const db = authenticatedAs(USER_A);
      await assertSucceeds(db.collection('rounds').doc('x').get());
      await assertSucceeds(db.collection('members').doc(USER_A).update({ bio: 'hi' }));
    });

    await runTest('suspended: can read but cannot write', async () => {
      await withSuspension(SUSP, { reason: 'test' });
      await seedMember(USER_B, { platformRole: 'user' });
      const db = authenticatedAs(SUSP);
      // Can read others' member doc
      await assertSucceeds(db.collection('members').doc(USER_B).get());
      // Cannot update own doc (Gap 1 fix — all writes blocked)
      await assertFails(db.collection('members').doc(SUSP).update({ bio: 'try' }));
    });

    await runTest('banned: cannot read others nor write', async () => {
      await withBan(BANNED, { reason: 'test' });
      await seedMember(USER_B, { platformRole: 'user' });
      const db = authenticatedAs(BANNED);
      // Cannot read others (Gap 2 fix)
      await assertFails(db.collection('members').doc(USER_B).get());
      // Cannot write
      await assertFails(db.collection('members').doc(BANNED).update({ bio: 'try' }));
    });

    await runTest('banned: CAN still read own member doc (ban-screen carve-out)', async () => {
      await withBan(BANNED, { reason: 'test' });
      const db = authenticatedAs(BANNED);
      await assertSucceeds(db.collection('members').doc(BANNED).get());
    });

    await runTest('banned: CAN still read own notifications (appeal outcome)', async () => {
      await withBan(BANNED, { reason: 'test' });
      await seedDoc('notifications/n1', { toUid: BANNED, title: 'Appeal denied', message: 'x' });
      const db = authenticatedAs(BANNED);
      await assertSucceeds(db.collection('notifications').doc('n1').get());
    });
  });

  // ─────────────────────────────────────────────────────────────────
  // MEMBERS
  // ─────────────────────────────────────────────────────────────────

  await group('members/{id} — read', async () => {
    await runTest('authenticated user reads another member', async () => {
      await withPlatformRole(USER_A, 'user');
      await seedMember(USER_B, { platformRole: 'user' });
      const db = authenticatedAs(USER_A);
      await assertSucceeds(db.collection('members').doc(USER_B).get());
    });

    await runTest('unauthenticated cannot read members', async () => {
      await seedMember(USER_A, { platformRole: 'user' });
      const db = unauthenticated();
      await assertFails(db.collection('members').doc(USER_A).get());
    });

    await runTest('banned user reads OWN doc (self carve-out)', async () => {
      await withBan(BANNED, {});
      const db = authenticatedAs(BANNED);
      await assertSucceeds(db.collection('members').doc(BANNED).get());
    });

    await runTest('banned user cannot read other members', async () => {
      await withBan(BANNED, {});
      await seedMember(USER_A, { platformRole: 'user' });
      const db = authenticatedAs(BANNED);
      await assertFails(db.collection('members').doc(USER_A).get());
    });
  });

  await group('members/{id} — create', async () => {
    await runTest('self-create succeeds', async () => {
      const db = authenticatedAs(USER_A);
      await assertSucceeds(db.collection('members').doc(USER_A).set({
        id: USER_A,
        name: 'Test',
        platformRole: 'user',
      }));
    });

    await runTest('self-create with platformRole=founder blocked (no self-elevation)', async () => {
      const db = authenticatedAs(USER_A);
      await assertFails(db.collection('members').doc(USER_A).set({
        id: USER_A,
        platformRole: 'founder',
      }));
    });

    await runTest('create for another user blocked', async () => {
      const db = authenticatedAs(USER_A);
      await assertFails(db.collection('members').doc(USER_B).set({
        id: USER_B, platformRole: 'user',
      }));
    });
  });

  await group('members/{id} — update (privilege immutability)', async () => {
    await runTest('self-update allowed for non-privileged fields (user)', async () => {
      await withPlatformRole(USER_A, 'user', { name: 'Alice' });
      const db = authenticatedAs(USER_A);
      await assertSucceeds(db.collection('members').doc(USER_A).update({
        bio: 'new bio',
      }));
    });

    await runTest('self-update blocked when suspended (Gap 1)', async () => {
      await withSuspension(SUSP, {});
      const db = authenticatedAs(SUSP);
      await assertFails(db.collection('members').doc(SUSP).update({
        bio: 'cannot change',
      }));
    });

    await runTest('self-elevation from user→founder blocked', async () => {
      await withPlatformRole(USER_A, 'user');
      const db = authenticatedAs(USER_A);
      await assertFails(db.collection('members').doc(USER_A).update({
        platformRole: 'founder',
      }));
    });

    await runTest('self-unlock from suspended→user blocked (edge 3.7.d)', async () => {
      await withSuspension(SUSP, {});
      const db = authenticatedAs(SUSP);
      // Even if the update path were reached, platformRole is immutable via client
      await assertFails(db.collection('members').doc(SUSP).update({
        platformRole: 'user',
      }));
    });

    await runTest('client cannot mutate suspension object (non-founder)', async () => {
      await withPlatformRole(USER_A, 'user');
      const db = authenticatedAs(USER_A);
      await assertFails(db.collection('members').doc(USER_A).update({
        suspension: { reason: 'faked', reasonPrivate: false },
      }));
    });

    await runTest('Founder can modify suspension object on another member', async () => {
      await withFounderConfig(FOUNDER);
      await withPlatformRole(FOUNDER, 'founder');
      await withSuspension(SUSP, { reason: 'original' });
      const db = authenticatedAs(FOUNDER);
      // Founder updates suspension (e.g., extending the window)
      await assertSucceeds(db.collection('members').doc(SUSP).update({
        suspension: {
          until: null, reason: 'updated', reasonPrivate: false,
          issuedBy: FOUNDER, issuedAt: null,
        },
      }));
    });

    await runTest('non-owner non-founder cannot update another member', async () => {
      await withPlatformRole(USER_A, 'user');
      await withPlatformRole(USER_B, 'user');
      const db = authenticatedAs(USER_A);
      await assertFails(db.collection('members').doc(USER_B).update({ bio: 'hi' }));
    });
  });

  await group('members/{id} — delete', async () => {
    await runTest('Founder can delete any member', async () => {
      await withFounderConfig(FOUNDER);
      await withPlatformRole(FOUNDER, 'founder');
      await seedMember(USER_A, { platformRole: 'user' });
      const db = authenticatedAs(FOUNDER);
      await assertSucceeds(db.collection('members').doc(USER_A).delete());
    });

    await runTest('regular user cannot delete own doc', async () => {
      await withPlatformRole(USER_A, 'user');
      const db = authenticatedAs(USER_A);
      await assertFails(db.collection('members').doc(USER_A).delete());
    });
  });

  // ─────────────────────────────────────────────────────────────────
  // PLATFORM CONFIG + ANNOUNCEMENTS
  // ─────────────────────────────────────────────────────────────────

  await group('platformConfig/singleton', async () => {
    await runTest('any auth user can read', async () => {
      await withFounderConfig(FOUNDER);
      await withPlatformRole(USER_A, 'user');
      const db = authenticatedAs(USER_A);
      await assertSucceeds(db.collection('platformConfig').doc('singleton').get());
    });

    await runTest('client writes denied (even Founder)', async () => {
      await withFounderConfig(FOUNDER);
      await withPlatformRole(FOUNDER, 'founder');
      const db = authenticatedAs(FOUNDER);
      await assertFails(db.collection('platformConfig').doc('singleton').update({
        founderUid: USER_A,
      }));
    });
  });

  await group('platform_announcements', async () => {
    await runTest('any auth user can read', async () => {
      await seedDoc('platform_announcements/a1', {
        version: 'v8.0.0', title: 't', body: 'b', audience: 'all',
      });
      await withPlatformRole(USER_A, 'user');
      const db = authenticatedAs(USER_A);
      await assertSucceeds(db.collection('platform_announcements').doc('a1').get());
    });

    await runTest('Founder creates announcement', async () => {
      await withFounderConfig(FOUNDER);
      await withPlatformRole(FOUNDER, 'founder');
      const db = authenticatedAs(FOUNDER);
      await assertSucceeds(db.collection('platform_announcements').doc('a1').set({
        version: 'v8.0.0', title: 't', body: 'b', audience: 'all',
      }));
    });

    await runTest('regular user cannot create announcement', async () => {
      await withFounderConfig(FOUNDER);
      await withPlatformRole(USER_A, 'user');
      const db = authenticatedAs(USER_A);
      await assertFails(db.collection('platform_announcements').doc('a1').set({
        version: 'v8.0.0', title: 't', body: 'b', audience: 'all',
      }));
    });

    await runTest('deletes denied', async () => {
      await withFounderConfig(FOUNDER);
      await withPlatformRole(FOUNDER, 'founder');
      await seedDoc('platform_announcements/a1', {
        version: 'v8.0.0', title: 't', body: 'b', audience: 'all',
      });
      const db = authenticatedAs(FOUNDER);
      await assertFails(db.collection('platform_announcements').doc('a1').delete());
    });
  });

  // ─────────────────────────────────────────────────────────────────
  // FOUNDER ACCESS LOGS
  // ─────────────────────────────────────────────────────────────────

  await group('founder_access_logs', async () => {
    await runTest('client cannot create log entries (Cloud Function only)', async () => {
      await withFounderConfig(FOUNDER);
      await withPlatformRole(FOUNDER, 'founder');
      const db = authenticatedAs(FOUNDER);
      await assertFails(db.collection('founder_access_logs').doc('l1').set({
        founderUid: FOUNDER, leagueId: LEAGUE_A, dataType: 'dm',
      }));
    });

    await runTest('member of affected league can read log', async () => {
      await seedDoc('founder_access_logs/l1', {
        founderUid: FOUNDER, leagueId: LEAGUE_A, dataType: 'dm',
      });
      await withPlatformRole(USER_A, 'user', { leagues: [LEAGUE_A] });
      const db = authenticatedAs(USER_A);
      await assertSucceeds(db.collection('founder_access_logs').doc('l1').get());
    });

    await runTest('non-member of affected league cannot read log', async () => {
      await seedDoc('founder_access_logs/l1', {
        founderUid: FOUNDER, leagueId: LEAGUE_A, dataType: 'dm',
      });
      await withPlatformRole(USER_A, 'user', { leagues: [LEAGUE_B] });
      const db = authenticatedAs(USER_A);
      await assertFails(db.collection('founder_access_logs').doc('l1').get());
    });

    await runTest('Founder can read any log', async () => {
      await withFounderConfig(FOUNDER);
      await withPlatformRole(FOUNDER, 'founder');
      await seedDoc('founder_access_logs/l1', {
        founderUid: FOUNDER, leagueId: LEAGUE_A, dataType: 'dm',
      });
      const db = authenticatedAs(FOUNDER);
      await assertSucceeds(db.collection('founder_access_logs').doc('l1').get());
    });
  });

  // ─────────────────────────────────────────────────────────────────
  // TRANSFER REQUESTS
  // ─────────────────────────────────────────────────────────────────

  await group('transfer_requests — create', async () => {
    await runTest('commissioner creates commissioner transfer for own league', async () => {
      await withPlatformRole(COMM, 'user');
      await withLeague(LEAGUE_A, { commissioner: COMM, admins: [COMM] });
      const db = authenticatedAs(COMM);
      await assertSucceeds(db.collection('transfer_requests').doc('t1').set({
        type: 'commissioner', leagueId: LEAGUE_A,
        fromUid: COMM, toUid: USER_A, status: 'pending',
      }));
    });

    await runTest('non-commissioner blocked from commissioner transfer', async () => {
      await withPlatformRole(USER_A, 'user');
      await withLeague(LEAGUE_A, { commissioner: COMM, admins: [COMM] });
      const db = authenticatedAs(USER_A);
      await assertFails(db.collection('transfer_requests').doc('t1').set({
        type: 'commissioner', leagueId: LEAGUE_A,
        fromUid: USER_A, toUid: USER_B, status: 'pending',
      }));
    });

    await runTest('Founder creates founder transfer', async () => {
      await withFounderConfig(FOUNDER);
      await withPlatformRole(FOUNDER, 'founder');
      const db = authenticatedAs(FOUNDER);
      await assertSucceeds(db.collection('transfer_requests').doc('t1').set({
        type: 'founder', fromUid: FOUNDER, toUid: USER_A, status: 'pending',
      }));
    });

    await runTest('non-founder cannot create founder transfer', async () => {
      await withFounderConfig(FOUNDER);
      await withPlatformRole(USER_A, 'user');
      const db = authenticatedAs(USER_A);
      await assertFails(db.collection('transfer_requests').doc('t1').set({
        type: 'founder', fromUid: USER_A, toUid: USER_B, status: 'pending',
      }));
    });
  });

  await group('transfer_requests — read', async () => {
    await runTest('fromUid can read', async () => {
      await withPlatformRole(COMM, 'user');
      await withLeague(LEAGUE_A, { commissioner: COMM });
      await seedDoc('transfer_requests/t1', {
        type: 'commissioner', leagueId: LEAGUE_A,
        fromUid: COMM, toUid: USER_A, status: 'pending',
      });
      const db = authenticatedAs(COMM);
      await assertSucceeds(db.collection('transfer_requests').doc('t1').get());
    });

    await runTest('toUid can read', async () => {
      await withPlatformRole(USER_A, 'user');
      await withPlatformRole(COMM, 'user');
      await withLeague(LEAGUE_A, { commissioner: COMM });
      await seedDoc('transfer_requests/t1', {
        type: 'commissioner', leagueId: LEAGUE_A,
        fromUid: COMM, toUid: USER_A, status: 'pending',
      });
      const db = authenticatedAs(USER_A);
      await assertSucceeds(db.collection('transfer_requests').doc('t1').get());
    });

    await runTest('unrelated user cannot read', async () => {
      await withPlatformRole(USER_C, 'user');
      await withLeague(LEAGUE_A, { commissioner: COMM });
      await seedDoc('transfer_requests/t1', {
        type: 'commissioner', leagueId: LEAGUE_A,
        fromUid: COMM, toUid: USER_A, status: 'pending',
      });
      const db = authenticatedAs(USER_C);
      await assertFails(db.collection('transfer_requests').doc('t1').get());
    });
  });

  await group('transfer_requests — update (accept/cancel paths)', async () => {
    await runTest('nominee accepts pending transfer', async () => {
      await withPlatformRole(COMM, 'user');
      await withPlatformRole(USER_A, 'user');
      await withLeague(LEAGUE_A, { commissioner: COMM });
      await seedDoc('transfer_requests/t1', {
        type: 'commissioner', leagueId: LEAGUE_A,
        fromUid: COMM, toUid: USER_A, status: 'pending',
      });
      const db = authenticatedAs(USER_A);
      await assertSucceeds(db.collection('transfer_requests').doc('t1').update({
        status: 'accepted', acceptedAt: new Date(),
      }));
    });

    await runTest('random user cannot update transfer_request', async () => {
      await withPlatformRole(USER_C, 'user');
      await withLeague(LEAGUE_A, { commissioner: COMM });
      await seedDoc('transfer_requests/t1', {
        type: 'commissioner', leagueId: LEAGUE_A,
        fromUid: COMM, toUid: USER_A, status: 'pending',
      });
      const db = authenticatedAs(USER_C);
      await assertFails(db.collection('transfer_requests').doc('t1').update({
        status: 'accepted',
      }));
    });

    await runTest('deletes denied', async () => {
      await withFounderConfig(FOUNDER);
      await withPlatformRole(FOUNDER, 'founder');
      await seedDoc('transfer_requests/t1', {
        type: 'founder', fromUid: FOUNDER, toUid: USER_A, status: 'pending',
      });
      const db = authenticatedAs(FOUNDER);
      await assertFails(db.collection('transfer_requests').doc('t1').delete());
    });
  });

  // ─────────────────────────────────────────────────────────────────
  // ROUNDS
  // ─────────────────────────────────────────────────────────────────

  await group('rounds', async () => {
    await runTest('league member creates own round', async () => {
      await withPlatformRole(USER_A, 'user');
      await withLeague(LEAGUE_A, { memberUids: [USER_A], admins: [COMM], commissioner: COMM });
      const db = authenticatedAs(USER_A);
      await assertSucceeds(db.collection('rounds').doc('r1').set({
        player: USER_A, leagueId: LEAGUE_A, score: 80,
      }));
    });

    await runTest('non-member cannot create round for that league', async () => {
      await withPlatformRole(USER_A, 'user');
      await withLeague(LEAGUE_A, { memberUids: [COMM], admins: [COMM], commissioner: COMM });
      const db = authenticatedAs(USER_A);
      await assertFails(db.collection('rounds').doc('r1').set({
        player: USER_A, leagueId: LEAGUE_A, score: 80,
      }));
    });

    await runTest('cannot create round for another user (player validation)', async () => {
      await withPlatformRole(USER_A, 'user');
      await withLeague(LEAGUE_A, {
        memberUids: [USER_A, USER_B], admins: [COMM], commissioner: COMM,
      });
      const db = authenticatedAs(USER_A);
      await assertFails(db.collection('rounds').doc('r1').set({
        player: USER_B, leagueId: LEAGUE_A, score: 80,
      }));
    });

    await runTest('banned-from-league member cannot create round', async () => {
      await withPlatformRole(USER_A, 'user');
      await withLeague(LEAGUE_A, {
        memberUids: [USER_A], bans: [USER_A], admins: [COMM], commissioner: COMM,
      });
      const db = authenticatedAs(USER_A);
      await assertFails(db.collection('rounds').doc('r1').set({
        player: USER_A, leagueId: LEAGUE_A, score: 80,
      }));
    });

    await runTest('round author updates own round', async () => {
      await withPlatformRole(USER_A, 'user');
      await withLeague(LEAGUE_A, {
        memberUids: [USER_A], admins: [COMM], commissioner: COMM,
      });
      await seedDoc('rounds/r1', { player: USER_A, leagueId: LEAGUE_A, score: 80 });
      const db = authenticatedAs(USER_A);
      await assertSucceeds(db.collection('rounds').doc('r1').update({ score: 79 }));
    });

    await runTest('league commissioner can update any round in their league', async () => {
      await withPlatformRole(USER_A, 'user');
      await withPlatformRole(COMM, 'user');
      await withLeague(LEAGUE_A, {
        memberUids: [USER_A, COMM], admins: [COMM], commissioner: COMM,
      });
      await seedDoc('rounds/r1', { player: USER_A, leagueId: LEAGUE_A, score: 80 });
      const db = authenticatedAs(COMM);
      await assertSucceeds(db.collection('rounds').doc('r1').update({ score: 79 }));
    });

    await runTest('random user cannot update another user round', async () => {
      await withPlatformRole(USER_A, 'user');
      await withPlatformRole(USER_C, 'user');
      await withLeague(LEAGUE_A, {
        memberUids: [USER_A, USER_C], admins: [COMM], commissioner: COMM,
      });
      await seedDoc('rounds/r1', { player: USER_A, leagueId: LEAGUE_A, score: 80 });
      const db = authenticatedAs(USER_C);
      await assertFails(db.collection('rounds').doc('r1').update({ score: 99 }));
    });

    await runTest('only author or Founder can delete a round (not even commissioner)', async () => {
      await withPlatformRole(USER_A, 'user');
      await withPlatformRole(COMM, 'user');
      await withLeague(LEAGUE_A, {
        memberUids: [USER_A, COMM], admins: [COMM], commissioner: COMM,
      });
      await seedDoc('rounds/r1', { player: USER_A, leagueId: LEAGUE_A, score: 80 });
      const db = authenticatedAs(COMM);
      await assertFails(db.collection('rounds').doc('r1').delete());
    });

    await runTest('author can delete own round', async () => {
      await withPlatformRole(USER_A, 'user');
      await withLeague(LEAGUE_A, {
        memberUids: [USER_A], admins: [COMM], commissioner: COMM,
      });
      await seedDoc('rounds/r1', { player: USER_A, leagueId: LEAGUE_A, score: 80 });
      const db = authenticatedAs(USER_A);
      await assertSucceeds(db.collection('rounds').doc('r1').delete());
    });
  });

  // ─────────────────────────────────────────────────────────────────
  // DMs
  // ─────────────────────────────────────────────────────────────────

  await group('dms — participant access', async () => {
    await runTest('participant creates DM', async () => {
      await withPlatformRole(USER_A, 'user');
      const db = authenticatedAs(USER_A);
      await assertSucceeds(
        db.collection('dms').doc(USER_A + '_' + USER_B).set({ participants: [USER_A, USER_B] })
      );
    });

    await runTest('non-participant cannot create DM with mismatched id', async () => {
      await withPlatformRole(USER_A, 'user');
      const db = authenticatedAs(USER_A);
      await assertFails(
        db.collection('dms').doc(USER_B + '_' + USER_C).set({ participants: [USER_B, USER_C] })
      );
    });

    await runTest('participant reads DM', async () => {
      await withPlatformRole(USER_A, 'user');
      await seedDoc('dms/' + USER_A + '_' + USER_B, { participants: [USER_A, USER_B] });
      const db = authenticatedAs(USER_A);
      await assertSucceeds(db.collection('dms').doc(USER_A + '_' + USER_B).get());
    });

    await runTest('non-participant cannot read DM', async () => {
      await withPlatformRole(USER_C, 'user');
      await seedDoc('dms/' + USER_A + '_' + USER_B, { participants: [USER_A, USER_B] });
      const db = authenticatedAs(USER_C);
      await assertFails(db.collection('dms').doc(USER_A + '_' + USER_B).get());
    });

    await runTest('suspended user cannot send DMs (Gap 1, decision 3.1.a refinement)', async () => {
      await withSuspension(SUSP, {});
      const db = authenticatedAs(SUSP);
      await assertFails(
        db.collection('dms').doc(SUSP + '_' + USER_A).set({ participants: [SUSP, USER_A] })
      );
    });

    await runTest('banned user cannot read own DMs (Gap 2)', async () => {
      await withBan(BANNED, {});
      await seedDoc('dms/' + BANNED + '_' + USER_A, { participants: [BANNED, USER_A] });
      const db = authenticatedAs(BANNED);
      await assertFails(db.collection('dms').doc(BANNED + '_' + USER_A).get());
    });
  });

  // ─────────────────────────────────────────────────────────────────
  // CHAT (league-scoped)
  // ─────────────────────────────────────────────────────────────────

  await group('chat — league-scoped reads and writes', async () => {
    await runTest('league member reads chat in their league', async () => {
      await withPlatformRole(USER_A, 'user');
      await withLeague(LEAGUE_A, {
        memberUids: [USER_A, COMM], admins: [COMM], commissioner: COMM,
      });
      await seedDoc('chat/m1', {
        leagueId: LEAGUE_A, authorId: COMM, text: 'hi',
      });
      const db = authenticatedAs(USER_A);
      await assertSucceeds(db.collection('chat').doc('m1').get());
    });

    await runTest('non-member cannot read another league chat', async () => {
      await withPlatformRole(USER_C, 'user');
      await withLeague(LEAGUE_A, {
        memberUids: [USER_A, COMM], admins: [COMM], commissioner: COMM,
      });
      await seedDoc('chat/m1', {
        leagueId: LEAGUE_A, authorId: COMM, text: 'hi',
      });
      const db = authenticatedAs(USER_C);
      await assertFails(db.collection('chat').doc('m1').get());
    });

    await runTest('league member posts chat with own authorId', async () => {
      await withPlatformRole(USER_A, 'user');
      await withLeague(LEAGUE_A, {
        memberUids: [USER_A, COMM], admins: [COMM], commissioner: COMM,
      });
      const db = authenticatedAs(USER_A);
      await assertSucceeds(db.collection('chat').doc('m1').set({
        leagueId: LEAGUE_A, authorId: USER_A, text: 'hi',
      }));
    });

    await runTest('cannot post chat with another user authorId', async () => {
      await withPlatformRole(USER_A, 'user');
      await withLeague(LEAGUE_A, {
        memberUids: [USER_A, USER_B], admins: [COMM], commissioner: COMM,
      });
      const db = authenticatedAs(USER_A);
      await assertFails(db.collection('chat').doc('m1').set({
        leagueId: LEAGUE_A, authorId: USER_B, text: 'forged',
      }));
    });

    await runTest('banned-from-league member cannot post chat', async () => {
      await withPlatformRole(USER_A, 'user');
      await withLeague(LEAGUE_A, {
        memberUids: [USER_A], bans: [USER_A], admins: [COMM], commissioner: COMM,
      });
      const db = authenticatedAs(USER_A);
      await assertFails(db.collection('chat').doc('m1').set({
        leagueId: LEAGUE_A, authorId: USER_A, text: 'hi',
      }));
    });

    await runTest('suspended user cannot post chat', async () => {
      await withSuspension(SUSP, {});
      await withLeague(LEAGUE_A, {
        memberUids: [SUSP], admins: [COMM], commissioner: COMM,
      });
      const db = authenticatedAs(SUSP);
      await assertFails(db.collection('chat').doc('m1').set({
        leagueId: LEAGUE_A, authorId: SUSP, text: 'hi',
      }));
    });

    await runTest('league leadership deletes chat', async () => {
      await withPlatformRole(COMM, 'user');
      await withPlatformRole(USER_A, 'user');
      await withLeague(LEAGUE_A, {
        memberUids: [USER_A, COMM], admins: [COMM], commissioner: COMM,
      });
      await seedDoc('chat/m1', {
        leagueId: LEAGUE_A, authorId: USER_A, text: 'rude',
      });
      const db = authenticatedAs(COMM);
      await assertSucceeds(db.collection('chat').doc('m1').delete());
    });
  });

  // ─────────────────────────────────────────────────────────────────
  // NOTIFICATIONS
  // ─────────────────────────────────────────────────────────────────

  await group('notifications', async () => {
    await runTest('target user reads own notification', async () => {
      await withPlatformRole(USER_A, 'user');
      await seedDoc('notifications/n1', { toUid: USER_A, title: 't', message: 'm' });
      const db = authenticatedAs(USER_A);
      await assertSucceeds(db.collection('notifications').doc('n1').get());
    });

    await runTest('non-target cannot read notification', async () => {
      await withPlatformRole(USER_B, 'user');
      await seedDoc('notifications/n1', { toUid: USER_A, title: 't', message: 'm' });
      const db = authenticatedAs(USER_B);
      await assertFails(db.collection('notifications').doc('n1').get());
    });

    await runTest('suspended user cannot create notifications', async () => {
      await withSuspension(SUSP, {});
      const db = authenticatedAs(SUSP);
      await assertFails(db.collection('notifications').doc('n1').set({
        toUid: USER_A, title: 't', message: 'm',
      }));
    });
  });

  // ─────────────────────────────────────────────────────────────────
  // INVITES
  // ─────────────────────────────────────────────────────────────────

  await group('invites', async () => {
    await runTest('active user creates invite', async () => {
      await withPlatformRole(USER_A, 'user');
      const db = authenticatedAs(USER_A);
      await assertSucceeds(db.collection('invites').doc('inv1').set({
        code: 'INV1', createdBy: USER_A, status: 'active',
      }));
    });

    await runTest('suspended user cannot create invite', async () => {
      await withSuspension(SUSP, {});
      const db = authenticatedAs(SUSP);
      await assertFails(db.collection('invites').doc('inv1').set({
        code: 'INV1', createdBy: SUSP, status: 'active',
      }));
    });

    await runTest('creator revokes own invite', async () => {
      await withPlatformRole(USER_A, 'user');
      await seedDoc('invites/inv1', {
        code: 'INV1', createdBy: USER_A, status: 'active',
      });
      const db = authenticatedAs(USER_A);
      await assertSucceeds(db.collection('invites').doc('inv1').update({
        status: 'revoked',
      }));
    });

    await runTest('non-creator non-commissioner cannot revoke invite', async () => {
      await withPlatformRole(USER_A, 'user');
      await withPlatformRole(USER_B, 'user');
      await seedDoc('invites/inv1', {
        code: 'INV1', createdBy: USER_A, status: 'active',
      });
      const db = authenticatedAs(USER_B);
      await assertFails(db.collection('invites').doc('inv1').update({
        status: 'revoked',
      }));
    });

    await runTest('only Founder can delete invite', async () => {
      await withPlatformRole(USER_A, 'user');
      await seedDoc('invites/inv1', {
        code: 'INV1', createdBy: USER_A, status: 'active',
      });
      const db = authenticatedAs(USER_A);
      await assertFails(db.collection('invites').doc('inv1').delete());
    });
  });

  // ─────────────────────────────────────────────────────────────────
  // CONFIG (Founder-only writes)
  // ─────────────────────────────────────────────────────────────────

  await group('config', async () => {
    await runTest('Founder writes config', async () => {
      await withFounderConfig(FOUNDER);
      await withPlatformRole(FOUNDER, 'founder');
      const db = authenticatedAs(FOUNDER);
      await assertSucceeds(db.collection('config').doc('api_keys').set({
        golfCourseApi: 'key',
      }));
    });

    await runTest('regular user cannot write config', async () => {
      await withFounderConfig(FOUNDER);
      await withPlatformRole(USER_A, 'user');
      const db = authenticatedAs(USER_A);
      await assertFails(db.collection('config').doc('api_keys').set({
        golfCourseApi: 'key',
      }));
    });
  });

  // ─────────────────────────────────────────────────────────────────
  // PARCOIN TRANSACTIONS (Gap 7 preserved)
  // ─────────────────────────────────────────────────────────────────

  await group('parcoin_transactions', async () => {
    await runTest('user creates own transaction', async () => {
      await withPlatformRole(USER_A, 'user');
      const db = authenticatedAs(USER_A);
      await assertSucceeds(db.collection('parcoin_transactions').doc('t1').set({
        uid: USER_A, amount: 50, reason: 'round_complete',
      }));
    });

    await runTest('Gap 7 fix: forge with different uid denied', async () => {
      await withPlatformRole(USER_A, 'user');
      const db = authenticatedAs(USER_A);
      await assertFails(db.collection('parcoin_transactions').doc('t1').set({
        uid: USER_B, amount: 50, reason: 'round_complete',
      }));
    });

    await runTest('reads scoped to own uid', async () => {
      await withPlatformRole(USER_A, 'user');
      await withPlatformRole(USER_B, 'user');
      await seedDoc('parcoin_transactions/t1', {
        uid: USER_B, amount: 50, reason: 'round',
      });
      const db = authenticatedAs(USER_A);
      await assertFails(db.collection('parcoin_transactions').doc('t1').get());
    });

    await runTest('updates denied (immutable log)', async () => {
      await withPlatformRole(USER_A, 'user');
      await seedDoc('parcoin_transactions/t1', {
        uid: USER_A, amount: 50, reason: 'round',
      });
      const db = authenticatedAs(USER_A);
      await assertFails(db.collection('parcoin_transactions').doc('t1').update({
        amount: 999,
      }));
    });

    await runTest('suspended user cannot create transaction', async () => {
      await withSuspension(SUSP, {});
      const db = authenticatedAs(SUSP);
      await assertFails(db.collection('parcoin_transactions').doc('t1').set({
        uid: SUSP, amount: 50, reason: 'round',
      }));
    });
  });

  // ─────────────────────────────────────────────────────────────────
  // LEAGUES
  // ─────────────────────────────────────────────────────────────────

  await group('leagues — read', async () => {
    await runTest('public league readable by any user', async () => {
      await withPlatformRole(USER_A, 'user');
      await withLeague(LEAGUE_A, {
        visibility: 'public', commissioner: COMM, memberUids: [COMM],
      });
      const db = authenticatedAs(USER_A);
      await assertSucceeds(db.collection('leagues').doc(LEAGUE_A).get());
    });

    await runTest('private league not readable by non-member', async () => {
      await withPlatformRole(USER_A, 'user');
      await withLeague(LEAGUE_A, {
        visibility: 'private', commissioner: COMM, memberUids: [COMM],
      });
      const db = authenticatedAs(USER_A);
      await assertFails(db.collection('leagues').doc(LEAGUE_A).get());
    });

    await runTest('private league readable by member', async () => {
      await withPlatformRole(USER_A, 'user');
      await withLeague(LEAGUE_A, {
        visibility: 'private', commissioner: COMM, memberUids: [COMM, USER_A],
      });
      const db = authenticatedAs(USER_A);
      await assertSucceeds(db.collection('leagues').doc(LEAGUE_A).get());
    });

    await runTest('Founder reads any league', async () => {
      await withFounderConfig(FOUNDER);
      await withPlatformRole(FOUNDER, 'founder');
      await withLeague(LEAGUE_A, {
        visibility: 'private', commissioner: COMM, memberUids: [COMM],
      });
      const db = authenticatedAs(FOUNDER);
      await assertSucceeds(db.collection('leagues').doc(LEAGUE_A).get());
    });

    await runTest('banned user cannot read leagues', async () => {
      await withBan(BANNED, {});
      await withLeague(LEAGUE_A, {
        visibility: 'public', commissioner: COMM, memberUids: [COMM],
      });
      const db = authenticatedAs(BANNED);
      await assertFails(db.collection('leagues').doc(LEAGUE_A).get());
    });
  });

  await group('leagues — create', async () => {
    await runTest('user creates league with self as sole commissioner + member', async () => {
      await withPlatformRole(USER_A, 'user');
      const db = authenticatedAs(USER_A);
      await assertSucceeds(db.collection('leagues').doc('new_league').set({
        name: 'New', commissioner: USER_A, memberUids: [USER_A],
        memberCount: 1, admins: [USER_A], bans: [], visibility: 'private',
      }));
    });

    await runTest('create with different commissioner fails', async () => {
      await withPlatformRole(USER_A, 'user');
      const db = authenticatedAs(USER_A);
      await assertFails(db.collection('leagues').doc('new_league').set({
        name: 'New', commissioner: USER_B, memberUids: [USER_A, USER_B],
        memberCount: 2, admins: [USER_B], bans: [],
      }));
    });

    await runTest('create with more than 1 initial member fails', async () => {
      await withPlatformRole(USER_A, 'user');
      const db = authenticatedAs(USER_A);
      await assertFails(db.collection('leagues').doc('new_league').set({
        name: 'New', commissioner: USER_A, memberUids: [USER_A, USER_B],
        memberCount: 2, admins: [USER_A], bans: [],
      }));
    });
  });

  await group('leagues — update', async () => {
    await runTest('commissioner updates own league', async () => {
      await withPlatformRole(COMM, 'user');
      await withLeague(LEAGUE_A, { commissioner: COMM });
      const db = authenticatedAs(COMM);
      await assertSucceeds(db.collection('leagues').doc(LEAGUE_A).update({
        description: 'new',
      }));
    });

    await runTest('admin (non-commissioner) cannot update league doc', async () => {
      await withPlatformRole(ADMIN, 'user');
      await withLeague(LEAGUE_A, {
        commissioner: COMM, admins: [COMM, ADMIN], memberUids: [COMM, ADMIN],
      });
      const db = authenticatedAs(ADMIN);
      await assertFails(db.collection('leagues').doc(LEAGUE_A).update({
        description: 'attempted',
      }));
    });

    await runTest('Founder updates any league', async () => {
      await withFounderConfig(FOUNDER);
      await withPlatformRole(FOUNDER, 'founder');
      await withLeague(LEAGUE_A, { commissioner: COMM });
      const db = authenticatedAs(FOUNDER);
      await assertSucceeds(db.collection('leagues').doc(LEAGUE_A).update({
        description: 'founder override',
      }));
    });
  });

  await group('leagues — delete (sole-member auto-delete, decision 6.2.a)', async () => {
    await runTest('commissioner deletes sole-member league', async () => {
      await withPlatformRole(COMM, 'user');
      await withLeague(LEAGUE_A, {
        commissioner: COMM, memberUids: [COMM], memberCount: 1, badge: '',
      });
      const db = authenticatedAs(COMM);
      await assertSucceeds(db.collection('leagues').doc(LEAGUE_A).delete());
    });

    await runTest('cannot delete league with multiple members', async () => {
      await withPlatformRole(COMM, 'user');
      await withLeague(LEAGUE_A, {
        commissioner: COMM, memberUids: [COMM, USER_A], memberCount: 2, badge: '',
      });
      const db = authenticatedAs(COMM);
      await assertFails(db.collection('leagues').doc(LEAGUE_A).delete());
    });

    await runTest('cannot delete founding league even if sole member', async () => {
      await withPlatformRole(COMM, 'user');
      await withLeague(FOUNDING_LEAGUE, {
        commissioner: COMM, memberUids: [COMM], memberCount: 1, badge: 'founding',
      });
      const db = authenticatedAs(COMM);
      await assertFails(db.collection('leagues').doc(FOUNDING_LEAGUE).delete());
    });

    await runTest('non-commissioner cannot delete', async () => {
      await withPlatformRole(USER_A, 'user');
      await withLeague(LEAGUE_A, {
        commissioner: COMM, memberUids: [COMM], memberCount: 1, badge: '',
      });
      const db = authenticatedAs(USER_A);
      await assertFails(db.collection('leagues').doc(LEAGUE_A).delete());
    });
  });

  // ─────────────────────────────────────────────────────────────────
  // LEAGUES/{id}/joinRequests (Gap 8 preserved from v7.9.5)
  // ─────────────────────────────────────────────────────────────────

  await group('leagues/{id}/joinRequests', async () => {
    await runTest('requester creates own join request', async () => {
      await withPlatformRole(USER_A, 'user');
      await withLeague(LEAGUE_A, { commissioner: COMM, memberUids: [COMM] });
      const db = authenticatedAs(USER_A);
      await assertSucceeds(
        db.collection('leagues').doc(LEAGUE_A).collection('joinRequests').doc(USER_A).set({
          uid: USER_A, name: 'A', status: 'pending',
        })
      );
    });

    await runTest('cannot create join request for another user', async () => {
      await withPlatformRole(USER_A, 'user');
      await withLeague(LEAGUE_A, { commissioner: COMM, memberUids: [COMM] });
      const db = authenticatedAs(USER_A);
      await assertFails(
        db.collection('leagues').doc(LEAGUE_A).collection('joinRequests').doc(USER_B).set({
          uid: USER_B, name: 'B', status: 'pending',
        })
      );
    });

    await runTest('existing member cannot create join request', async () => {
      await withPlatformRole(USER_A, 'user');
      await withLeague(LEAGUE_A, {
        commissioner: COMM, memberUids: [COMM, USER_A],
      });
      const db = authenticatedAs(USER_A);
      await assertFails(
        db.collection('leagues').doc(LEAGUE_A).collection('joinRequests').doc(USER_A).set({
          uid: USER_A, name: 'A', status: 'pending',
        })
      );
    });

    await runTest('banned-from-league user cannot create join request', async () => {
      await withPlatformRole(USER_A, 'user');
      await withLeague(LEAGUE_A, {
        commissioner: COMM, memberUids: [COMM], bans: [USER_A],
      });
      const db = authenticatedAs(USER_A);
      await assertFails(
        db.collection('leagues').doc(LEAGUE_A).collection('joinRequests').doc(USER_A).set({
          uid: USER_A, name: 'A', status: 'pending',
        })
      );
    });

    await runTest('requester reads own request', async () => {
      await withPlatformRole(USER_A, 'user');
      await withLeague(LEAGUE_A, { commissioner: COMM, memberUids: [COMM] });
      await seedDoc('leagues/' + LEAGUE_A + '/joinRequests/' + USER_A, {
        uid: USER_A, status: 'pending',
      });
      const db = authenticatedAs(USER_A);
      await assertSucceeds(
        db.collection('leagues').doc(LEAGUE_A).collection('joinRequests').doc(USER_A).get()
      );
    });

    await runTest('league commissioner approves join request', async () => {
      await withPlatformRole(COMM, 'user');
      await withLeague(LEAGUE_A, { commissioner: COMM, admins: [COMM] });
      await seedDoc('leagues/' + LEAGUE_A + '/joinRequests/' + USER_A, {
        uid: USER_A, status: 'pending',
      });
      const db = authenticatedAs(COMM);
      await assertSucceeds(
        db.collection('leagues').doc(LEAGUE_A).collection('joinRequests').doc(USER_A).update({
          status: 'approved',
        })
      );
    });

    await runTest('random user cannot approve join request', async () => {
      await withPlatformRole(USER_C, 'user');
      await withLeague(LEAGUE_A, { commissioner: COMM, admins: [COMM] });
      await seedDoc('leagues/' + LEAGUE_A + '/joinRequests/' + USER_A, {
        uid: USER_A, status: 'pending',
      });
      const db = authenticatedAs(USER_C);
      await assertFails(
        db.collection('leagues').doc(LEAGUE_A).collection('joinRequests').doc(USER_A).update({
          status: 'approved',
        })
      );
    });
  });

  // ─────────────────────────────────────────────────────────────────
  // LEAGUES/{id}/moderation_log
  // ─────────────────────────────────────────────────────────────────

  await group('leagues/{id}/moderation_log', async () => {
    await runTest('commissioner creates log entry', async () => {
      await withPlatformRole(COMM, 'user');
      await withLeague(LEAGUE_A, { commissioner: COMM, admins: [COMM] });
      const db = authenticatedAs(COMM);
      await assertSucceeds(
        db.collection('leagues').doc(LEAGUE_A).collection('moderation_log').doc('l1').set({
          actionType: 'kick', targetUid: USER_A, actorUid: COMM,
          reason: 'spam', reasonPrivate: false, timestamp: new Date(),
        })
      );
    });

    await runTest('log creation fails if actorUid mismatches caller', async () => {
      await withPlatformRole(COMM, 'user');
      await withLeague(LEAGUE_A, { commissioner: COMM, admins: [COMM] });
      const db = authenticatedAs(COMM);
      await assertFails(
        db.collection('leagues').doc(LEAGUE_A).collection('moderation_log').doc('l1').set({
          actionType: 'kick', targetUid: USER_A, actorUid: USER_B,
          reason: 'spam', reasonPrivate: false, timestamp: new Date(),
        })
      );
    });

    await runTest('non-leadership cannot create log entry', async () => {
      await withPlatformRole(USER_C, 'user');
      await withLeague(LEAGUE_A, { commissioner: COMM, admins: [COMM] });
      const db = authenticatedAs(USER_C);
      await assertFails(
        db.collection('leagues').doc(LEAGUE_A).collection('moderation_log').doc('l1').set({
          actionType: 'kick', targetUid: USER_A, actorUid: USER_C,
          reason: 'x', reasonPrivate: false, timestamp: new Date(),
        })
      );
    });

    await runTest('target user reads own log entry (public reason)', async () => {
      await withPlatformRole(USER_A, 'user');
      await withLeague(LEAGUE_A, { commissioner: COMM, admins: [COMM] });
      await seedDoc('leagues/' + LEAGUE_A + '/moderation_log/l1', {
        actionType: 'kick', targetUid: USER_A, actorUid: COMM,
        reason: 'spam', reasonPrivate: false, timestamp: new Date(),
      });
      const db = authenticatedAs(USER_A);
      await assertSucceeds(
        db.collection('leagues').doc(LEAGUE_A).collection('moderation_log').doc('l1').get()
      );
    });

    await runTest('target user CANNOT read private-reason log entry', async () => {
      await withPlatformRole(USER_A, 'user');
      await withLeague(LEAGUE_A, { commissioner: COMM, admins: [COMM] });
      await seedDoc('leagues/' + LEAGUE_A + '/moderation_log/l1', {
        actionType: 'ban', targetUid: USER_A, actorUid: COMM,
        reason: 'harassment', reasonPrivate: true, timestamp: new Date(),
      });
      const db = authenticatedAs(USER_A);
      await assertFails(
        db.collection('leagues').doc(LEAGUE_A).collection('moderation_log').doc('l1').get()
      );
    });

    await runTest('unrelated user cannot read log entry', async () => {
      await withPlatformRole(USER_C, 'user');
      await withLeague(LEAGUE_A, { commissioner: COMM, admins: [COMM] });
      await seedDoc('leagues/' + LEAGUE_A + '/moderation_log/l1', {
        actionType: 'kick', targetUid: USER_A, actorUid: COMM,
        reason: 'x', reasonPrivate: false, timestamp: new Date(),
      });
      const db = authenticatedAs(USER_C);
      await assertFails(
        db.collection('leagues').doc(LEAGUE_A).collection('moderation_log').doc('l1').get()
      );
    });

    await runTest('logs are immutable for commissioner (update denied)', async () => {
      await withPlatformRole(COMM, 'user');
      await withLeague(LEAGUE_A, { commissioner: COMM, admins: [COMM] });
      await seedDoc('leagues/' + LEAGUE_A + '/moderation_log/l1', {
        actionType: 'kick', targetUid: USER_A, actorUid: COMM,
        reason: 'x', reasonPrivate: false, timestamp: new Date(),
      });
      const db = authenticatedAs(COMM);
      await assertFails(
        db.collection('leagues').doc(LEAGUE_A).collection('moderation_log').doc('l1').update({
          reason: 'changed',
        })
      );
    });
  });

  // ─────────────────────────────────────────────────────────────────
  // BOUNTIES (Gap 4 preserved from v7.9.5)
  // ─────────────────────────────────────────────────────────────────

  await group('bounties — Gap 4 preserved', async () => {
    await runTest('league member creates own bounty', async () => {
      await withPlatformRole(USER_A, 'user');
      await withLeague(LEAGUE_A, { commissioner: COMM, memberUids: [USER_A, COMM], admins: [COMM] });
      const db = authenticatedAs(USER_A);
      await assertSucceeds(db.collection('bounties').doc('b1').set({
        leagueId: LEAGUE_A, createdBy: USER_A, pot: 100, status: 'active',
      }));
    });

    await runTest('cannot create bounty with forged createdBy', async () => {
      await withPlatformRole(USER_A, 'user');
      await withLeague(LEAGUE_A, { commissioner: COMM, memberUids: [USER_A, COMM], admins: [COMM] });
      const db = authenticatedAs(USER_A);
      await assertFails(db.collection('bounties').doc('b1').set({
        leagueId: LEAGUE_A, createdBy: USER_B, pot: 100, status: 'active',
      }));
    });

    await runTest('creator modifies own bounty', async () => {
      await withPlatformRole(USER_A, 'user');
      await withLeague(LEAGUE_A, { commissioner: COMM, memberUids: [USER_A, COMM], admins: [COMM] });
      await seedDoc('bounties/b1', {
        leagueId: LEAGUE_A, createdBy: USER_A, pot: 100, status: 'active',
      });
      const db = authenticatedAs(USER_A);
      await assertSucceeds(db.collection('bounties').doc('b1').update({
        pot: 150,
      }));
    });

    await runTest('claim transition: another member claims active bounty', async () => {
      await withPlatformRole(USER_A, 'user');
      await withPlatformRole(USER_B, 'user');
      await withLeague(LEAGUE_A, { commissioner: COMM, memberUids: [USER_A, USER_B, COMM], admins: [COMM] });
      await seedDoc('bounties/b1', {
        leagueId: LEAGUE_A, createdBy: USER_A, pot: 100, status: 'active',
      });
      const db = authenticatedAs(USER_B);
      await assertSucceeds(db.collection('bounties').doc('b1').update({
        status: 'claimed', claimedBy: USER_B,
      }));
    });

    await runTest('random third party cannot modify bounty', async () => {
      await withPlatformRole(USER_A, 'user');
      await withPlatformRole(USER_C, 'user');
      await withLeague(LEAGUE_A, {
        commissioner: COMM, memberUids: [USER_A, USER_C, COMM], admins: [COMM],
      });
      await seedDoc('bounties/b1', {
        leagueId: LEAGUE_A, createdBy: USER_A, pot: 100, status: 'active',
      });
      const db = authenticatedAs(USER_C);
      // Forge claim with different claimedBy than self
      await assertFails(db.collection('bounties').doc('b1').update({
        pot: 9999,  // not a claim — pure mutation
      }));
    });
  });

  // ─────────────────────────────────────────────────────────────────
  // RANGESESSIONS (Gap 6 preserved from v7.9.5)
  // ─────────────────────────────────────────────────────────────────

  await group('rangeSessions — Gap 6 preserved', async () => {
    await runTest('user creates own range session', async () => {
      await withPlatformRole(USER_A, 'user');
      const db = authenticatedAs(USER_A);
      await assertSucceeds(db.collection('rangeSessions').doc('rs1').set({
        playerId: USER_A, durationMin: 30,
      }));
    });

    await runTest('user cannot create session with different playerId', async () => {
      await withPlatformRole(USER_A, 'user');
      const db = authenticatedAs(USER_A);
      await assertFails(db.collection('rangeSessions').doc('rs1').set({
        playerId: USER_B, durationMin: 30,
      }));
    });

    await runTest('user updates own session', async () => {
      await withPlatformRole(USER_A, 'user');
      await seedDoc('rangeSessions/rs1', { playerId: USER_A, durationMin: 30 });
      const db = authenticatedAs(USER_A);
      await assertSucceeds(db.collection('rangeSessions').doc('rs1').update({
        durationMin: 45,
      }));
    });

    await runTest('user cannot update another user session', async () => {
      await withPlatformRole(USER_A, 'user');
      await withPlatformRole(USER_B, 'user');
      await seedDoc('rangeSessions/rs1', { playerId: USER_A, durationMin: 30 });
      const db = authenticatedAs(USER_B);
      await assertFails(db.collection('rangeSessions').doc('rs1').update({
        durationMin: 0,
      }));
    });

    await runTest('user cannot delete another user session', async () => {
      await withPlatformRole(USER_A, 'user');
      await withPlatformRole(USER_B, 'user');
      await seedDoc('rangeSessions/rs1', { playerId: USER_A, durationMin: 30 });
      const db = authenticatedAs(USER_B);
      await assertFails(db.collection('rangeSessions').doc('rs1').delete());
    });

    await runTest('Founder can delete any range session (erasure)', async () => {
      await withFounderConfig(FOUNDER);
      await withPlatformRole(FOUNDER, 'founder');
      await seedDoc('rangeSessions/rs1', { playerId: USER_A, durationMin: 30 });
      const db = authenticatedAs(FOUNDER);
      await assertSucceeds(db.collection('rangeSessions').doc('rs1').delete());
    });
  });

  // ─────────────────────────────────────────────────────────────────
  // TEETIMES, SCRAMBLE TEAMS, CALENDAR, TRIPS (league-scoped patterns)
  // ─────────────────────────────────────────────────────────────────

  await group('teetimes — league-scoped', async () => {
    await runTest('league member creates tee time', async () => {
      await withPlatformRole(USER_A, 'user');
      await withLeague(LEAGUE_A, {
        commissioner: COMM, memberUids: [USER_A, COMM], admins: [COMM],
      });
      const db = authenticatedAs(USER_A);
      await assertSucceeds(db.collection('teetimes').doc('tt1').set({
        leagueId: LEAGUE_A, createdBy: USER_A, course: 'course',
      }));
    });

    await runTest('non-member cannot read tee time', async () => {
      await withPlatformRole(USER_C, 'user');
      await withLeague(LEAGUE_A, {
        commissioner: COMM, memberUids: [COMM], admins: [COMM],
      });
      await seedDoc('teetimes/tt1', {
        leagueId: LEAGUE_A, createdBy: COMM, course: 'course',
      });
      const db = authenticatedAs(USER_C);
      await assertFails(db.collection('teetimes').doc('tt1').get());
    });
  });

  await group('scrambleTeams — Gap from v7.x fixed', async () => {
    await runTest('league member creates scramble team', async () => {
      await withPlatformRole(USER_A, 'user');
      await withLeague(LEAGUE_A, {
        commissioner: COMM, memberUids: [USER_A, COMM], admins: [COMM],
      });
      const db = authenticatedAs(USER_A);
      await assertSucceeds(db.collection('scrambleTeams').doc('st1').set({
        leagueId: LEAGUE_A, name: 'Team A', memberUids: [USER_A],
      }));
    });

    await runTest('team member updates own team', async () => {
      await withPlatformRole(USER_A, 'user');
      await withLeague(LEAGUE_A, {
        commissioner: COMM, memberUids: [USER_A, COMM], admins: [COMM],
      });
      await seedDoc('scrambleTeams/st1', {
        leagueId: LEAGUE_A, name: 'Team A', memberUids: [USER_A],
      });
      const db = authenticatedAs(USER_A);
      await assertSucceeds(db.collection('scrambleTeams').doc('st1').update({
        name: 'Team Alpha',
      }));
    });

    await runTest('non-team-member cannot update team', async () => {
      await withPlatformRole(USER_C, 'user');
      await withLeague(LEAGUE_A, {
        commissioner: COMM, memberUids: [USER_A, USER_C, COMM], admins: [COMM],
      });
      await seedDoc('scrambleTeams/st1', {
        leagueId: LEAGUE_A, name: 'Team A', memberUids: [USER_A],
      });
      const db = authenticatedAs(USER_C);
      await assertFails(db.collection('scrambleTeams').doc('st1').update({
        name: 'Team Hijacked',
      }));
    });
  });

  // ─────────────────────────────────────────────────────────────────
  // TRIPS AND TRIPSCORES (Gap 5 fix)
  // ─────────────────────────────────────────────────────────────────

  await group('trips / tripscores — Gap 5 fix', async () => {
    await runTest('league member reads trip', async () => {
      await withPlatformRole(USER_A, 'user');
      await withLeague(LEAGUE_A, {
        commissioner: COMM, memberUids: [USER_A, COMM], admins: [COMM],
      });
      await seedDoc('trips/tr1', { leagueId: LEAGUE_A, name: 'Trip A' });
      const db = authenticatedAs(USER_A);
      await assertSucceeds(db.collection('trips').doc('tr1').get());
    });

    await runTest('non-member cannot read trip', async () => {
      await withPlatformRole(USER_C, 'user');
      await withLeague(LEAGUE_A, {
        commissioner: COMM, memberUids: [COMM], admins: [COMM],
      });
      await seedDoc('trips/tr1', { leagueId: LEAGUE_A, name: 'Trip A' });
      const db = authenticatedAs(USER_C);
      await assertFails(db.collection('trips').doc('tr1').get());
    });

    await runTest('league member creates own tripscore with denormalized leagueId', async () => {
      await withPlatformRole(USER_A, 'user');
      await withLeague(LEAGUE_A, {
        commissioner: COMM, memberUids: [USER_A, COMM], admins: [COMM],
      });
      await seedDoc('trips/tr1', { leagueId: LEAGUE_A, name: 'Trip A' });
      const db = authenticatedAs(USER_A);
      await assertSucceeds(db.collection('tripscores').doc('ts1').set({
        tripId: 'tr1', player: USER_A, leagueId: LEAGUE_A, score: 85,
      }));
    });

    await runTest('Gap 5: non-owner cannot update tripscore for another user', async () => {
      await withPlatformRole(USER_A, 'user');
      await withPlatformRole(USER_C, 'user');
      await withLeague(LEAGUE_A, {
        commissioner: COMM, memberUids: [USER_A, USER_C, COMM], admins: [COMM],
      });
      await seedDoc('trips/tr1', { leagueId: LEAGUE_A, name: 'Trip A' });
      await seedDoc('tripscores/ts1', {
        tripId: 'tr1', player: USER_A, leagueId: LEAGUE_A, score: 85,
      });
      const db = authenticatedAs(USER_C);
      // USER_C is a league member but not the score owner and not leadership
      await assertFails(db.collection('tripscores').doc('ts1').update({ score: 99 }));
    });
  });

  // ─────────────────────────────────────────────────────────────────
  // ERASURE REQUESTS
  // ─────────────────────────────────────────────────────────────────

  await group('members/{uid}/erasure_requests', async () => {
    await runTest('user initiates own erasure request', async () => {
      await withPlatformRole(USER_A, 'user');
      const db = authenticatedAs(USER_A);
      await assertSucceeds(
        db.collection('members').doc(USER_A).collection('erasure_requests').doc('e1').set({
          requestedAt: new Date(), status: 'pending',
        })
      );
    });

    await runTest('user cannot initiate erasure for another user', async () => {
      await withPlatformRole(USER_A, 'user');
      const db = authenticatedAs(USER_A);
      await assertFails(
        db.collection('members').doc(USER_B).collection('erasure_requests').doc('e1').set({
          requestedAt: new Date(), status: 'pending',
        })
      );
    });

    await runTest('banned user cannot initiate erasure', async () => {
      await withBan(BANNED, {});
      const db = authenticatedAs(BANNED);
      await assertFails(
        db.collection('members').doc(BANNED).collection('erasure_requests').doc('e1').set({
          requestedAt: new Date(), status: 'pending',
        })
      );
    });

    await runTest('Founder reads erasure requests', async () => {
      await withFounderConfig(FOUNDER);
      await withPlatformRole(FOUNDER, 'founder');
      await seedDoc('members/' + USER_A + '/erasure_requests/e1', {
        requestedAt: new Date(), status: 'pending',
      });
      const db = authenticatedAs(FOUNDER);
      await assertSucceeds(
        db.collection('members').doc(USER_A).collection('erasure_requests').doc('e1').get()
      );
    });

    await runTest('updates and deletes are denied (Cloud Function only)', async () => {
      await withPlatformRole(USER_A, 'user');
      await seedDoc('members/' + USER_A + '/erasure_requests/e1', {
        requestedAt: new Date(), status: 'pending',
      });
      const db = authenticatedAs(USER_A);
      await assertFails(
        db.collection('members').doc(USER_A).collection('erasure_requests').doc('e1').update({
          status: 'completed',
        })
      );
    });
  });

  // ─────────────────────────────────────────────────────────────────
  // WAGERS
  // ─────────────────────────────────────────────────────────────────

  await group('wagers — participant-scoped', async () => {
    await runTest('initiator creates wager as fromUid', async () => {
      await withPlatformRole(USER_A, 'user');
      await withLeague(LEAGUE_A, {
        commissioner: COMM, memberUids: [USER_A, USER_B, COMM], admins: [COMM],
      });
      const db = authenticatedAs(USER_A);
      await assertSucceeds(db.collection('wagers').doc('w1').set({
        leagueId: LEAGUE_A, fromUid: USER_A, toUid: USER_B, amount: 50,
      }));
    });

    await runTest('cannot create wager with forged fromUid', async () => {
      await withPlatformRole(USER_A, 'user');
      await withLeague(LEAGUE_A, {
        commissioner: COMM, memberUids: [USER_A, USER_B, COMM], admins: [COMM],
      });
      const db = authenticatedAs(USER_A);
      await assertFails(db.collection('wagers').doc('w1').set({
        leagueId: LEAGUE_A, fromUid: USER_B, toUid: USER_C, amount: 50,
      }));
    });

    await runTest('wager party reads own wager', async () => {
      await withPlatformRole(USER_A, 'user');
      await withPlatformRole(USER_B, 'user');
      await withLeague(LEAGUE_A, {
        commissioner: COMM, memberUids: [USER_A, USER_B, COMM], admins: [COMM],
      });
      await seedDoc('wagers/w1', {
        leagueId: LEAGUE_A, fromUid: USER_A, toUid: USER_B, amount: 50,
      });
      const db = authenticatedAs(USER_B);
      await assertSucceeds(db.collection('wagers').doc('w1').get());
    });

    await runTest('unrelated user cannot read wager', async () => {
      await withPlatformRole(USER_C, 'user');
      await withLeague(LEAGUE_A, {
        commissioner: COMM, memberUids: [USER_A, USER_B, USER_C, COMM],
        admins: [COMM],
      });
      await seedDoc('wagers/w1', {
        leagueId: LEAGUE_A, fromUid: USER_A, toUid: USER_B, amount: 50,
      });
      const db = authenticatedAs(USER_C);
      await assertFails(db.collection('wagers').doc('w1').get());
    });
  });

  // ─────────────────────────────────────────────────────────────────
  // COURSES / PHOTOS / COURSE REVIEWS
  // ─────────────────────────────────────────────────────────────────

  await group('courses + course_reviews — global + suspended semantics', async () => {
    await runTest('user reads and writes course data', async () => {
      await withPlatformRole(USER_A, 'user');
      const db = authenticatedAs(USER_A);
      await assertSucceeds(db.collection('courses').doc('c1').set({
        name: 'Test CC', holes: 18,
      }));
    });

    await runTest('suspended user can read course but not write', async () => {
      await withSuspension(SUSP, {});
      await seedDoc('courses/c1', { name: 'Test CC' });
      const db = authenticatedAs(SUSP);
      await assertSucceeds(db.collection('courses').doc('c1').get());
      await assertFails(db.collection('courses').doc('c1').update({ name: 'hacked' }));
    });

    await runTest('banned user cannot read course', async () => {
      await withBan(BANNED, {});
      await seedDoc('courses/c1', { name: 'Test CC' });
      const db = authenticatedAs(BANNED);
      await assertFails(db.collection('courses').doc('c1').get());
    });

    await runTest('review author-only update', async () => {
      await withPlatformRole(USER_A, 'user');
      await withPlatformRole(USER_B, 'user');
      await seedDoc('course_reviews/cr1', {
        userId: USER_A, courseId: 'c1', rating: 4,
      });
      const db = authenticatedAs(USER_B);
      await assertFails(db.collection('course_reviews').doc('cr1').update({
        rating: 1,
      }));
    });
  });

  // ─────────────────────────────────────────────────────────────────
  // REPORTS + FEATURE_REQUESTS (Founder-only read)
  // ─────────────────────────────────────────────────────────────────

  await group('reports / feature_requests / errors — Founder-only', async () => {
    await runTest('user submits a report (create)', async () => {
      await withPlatformRole(USER_A, 'user');
      const db = authenticatedAs(USER_A);
      await assertSucceeds(db.collection('reports').doc('r1').set({
        reportedBy: USER_A, reportedUser: USER_B, reason: 'spam',
      }));
    });

    await runTest('regular user cannot read reports', async () => {
      await withPlatformRole(USER_A, 'user');
      await seedDoc('reports/r1', {
        reportedBy: USER_B, reportedUser: USER_C, reason: 'spam',
      });
      const db = authenticatedAs(USER_A);
      await assertFails(db.collection('reports').doc('r1').get());
    });

    await runTest('Founder reads reports', async () => {
      await withFounderConfig(FOUNDER);
      await withPlatformRole(FOUNDER, 'founder');
      await seedDoc('reports/r1', {
        reportedBy: USER_B, reportedUser: USER_C, reason: 'spam',
      });
      const db = authenticatedAs(FOUNDER);
      await assertSucceeds(db.collection('reports').doc('r1').get());
    });

    await runTest('feature requests are Founder-read-only', async () => {
      await withPlatformRole(USER_A, 'user');
      await seedDoc('feature_requests/f1', {
        request: 'auto-save', fromName: 'A',
      });
      const db = authenticatedAs(USER_A);
      await assertFails(db.collection('feature_requests').doc('f1').get());
    });
  });

  // ─────────────────────────────────────────────────────────────────
  // EDGE CASES (Section 3.7)
  // ─────────────────────────────────────────────────────────────────

  await group('Edge case 3.7.c — banned from league A, commissioner of league B', async () => {
    await runTest('USER_A banned from LEAGUE_A cannot write chat there', async () => {
      await withPlatformRole(USER_A, 'user');
      await withLeague(LEAGUE_A, {
        commissioner: COMM, memberUids: [USER_A, COMM], bans: [USER_A], admins: [COMM],
      });
      const db = authenticatedAs(USER_A);
      await assertFails(db.collection('chat').doc('m1').set({
        leagueId: LEAGUE_A, authorId: USER_A, text: 'hi',
      }));
    });

    await runTest('same USER_A as commissioner of LEAGUE_B can write normally', async () => {
      await withPlatformRole(USER_A, 'user');
      await withLeague(LEAGUE_A, {
        commissioner: COMM, memberUids: [USER_A, COMM], bans: [USER_A], admins: [COMM],
      });
      await withLeague(LEAGUE_B, {
        commissioner: USER_A, memberUids: [USER_A], admins: [USER_A],
      });
      const db = authenticatedAs(USER_A);
      await assertSucceeds(db.collection('chat').doc('m2').set({
        leagueId: LEAGUE_B, authorId: USER_A, text: 'hi',
      }));
    });
  });

  await group('Edge case 3.7.b — Founder transfer in progress', async () => {
    await runTest('outgoing founder retains authority during cooling-off', async () => {
      // platformConfig still points to OLD founder; new founder accepted but not
      // yet finalized (Cloud Function updates platformConfig after cooling-off).
      await withFounderConfig(FOUNDER);
      await withPlatformRole(FOUNDER, 'founder');
      await withPlatformRole(USER_A, 'user');  // incoming founder still a user
      await seedDoc('transfer_requests/t1', {
        type: 'founder', fromUid: FOUNDER, toUid: USER_A,
        status: 'accepted', coolingOffEndsAt: new Date(Date.now() + 7 * 86400000),
      });
      // Outgoing founder still has founder-only access
      const db = authenticatedAs(FOUNDER);
      await assertSucceeds(db.collection('platform_announcements').doc('a1').set({
        version: 'v8.0.0', title: 'x', body: 'x', audience: 'all',
      }));
    });

    await runTest('incoming founder does NOT have founder authority until completion', async () => {
      await withFounderConfig(FOUNDER);
      await withPlatformRole(FOUNDER, 'founder');
      await withPlatformRole(USER_A, 'user');
      await seedDoc('transfer_requests/t1', {
        type: 'founder', fromUid: FOUNDER, toUid: USER_A,
        status: 'accepted', coolingOffEndsAt: new Date(Date.now() + 7 * 86400000),
      });
      const db = authenticatedAs(USER_A);
      // USER_A is still platformRole=user → cannot make announcements yet
      await assertFails(db.collection('platform_announcements').doc('a1').set({
        version: 'v8.0.0', title: 'x', body: 'x', audience: 'all',
      }));
    });
  });

  // ─────────────────────────────────────────────────────────────────
  // WRAP UP
  // ─────────────────────────────────────────────────────────────────

  await teardown();

  const failed = results.filter(function (r) { return !r.passed; });
  console.log('');
  console.log('══════════════════════════════════════════════════════════');
  console.log('Results: ' + (results.length - failed.length) + '/' + results.length + ' passed');
  if (failed.length > 0) {
    console.error('Failures:');
    for (const f of failed) console.error('  ✗ ' + f.name + ' — ' + f.error);
    process.exit(1);
  }
}

runAll().catch(function (e) {
  console.error('Unhandled error in rules test runner:');
  console.error(e && e.stack ? e.stack : e);
  process.exit(1);
});
