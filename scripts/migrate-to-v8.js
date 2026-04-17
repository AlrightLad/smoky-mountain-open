#!/usr/bin/env node
/* eslint-disable no-console */
// scripts/migrate-to-v8.js
//
// v8.0.0 schema migration. Translates the 34 governance decisions in
// docs/v8.0-governance-design.md and the technical mapping in
// docs/v8.0-technical-design.md Section 6 into Firestore writes.
//
// DEFAULT BEHAVIOR: dry-run. Writes nothing. Reports planned changes.
// Destructive behavior requires --execute. Production run ALSO requires
// --project parbaughs AND --founder-uid <uid>.
//
// Safety posture:
//   - dry-run default, explicit --execute to write
//   - staged writes to members_v8_staging/{uid} first
//   - atomic swap to members/{uid} only after staging verified
//   - idempotent — second --execute run finds nothing to change
//   - verification phase runs after every --execute and exits non-zero
//     on any assertion failure
//   - originals are never overwritten during a mid-run failure (staging
//     collection stays so the script can be re-run or inspected)
//
// Usage:
//
//   # Dry-run against the emulator (emulator must be running)
//   FIRESTORE_EMULATOR_HOST=localhost:8080 GCLOUD_PROJECT=parbaughs \
//     node scripts/migrate-to-v8.js --dry-run --verbose
//
//   # Actual execution against the emulator (for testing)
//   FIRESTORE_EMULATOR_HOST=localhost:8080 GCLOUD_PROJECT=parbaughs \
//     node scripts/migrate-to-v8.js --execute --verbose
//
//   # Production (requires service account creds via
//   # GOOGLE_APPLICATION_CREDENTIALS)
//   node scripts/migrate-to-v8.js \
//     --execute --project parbaughs --founder-uid <ZACH_UID>
//
// See scripts/README.md for full docs.

'use strict';

const admin = require('firebase-admin');

// ───────────────────────────────────────────────────────────────────
// CLI parsing
// ───────────────────────────────────────────────────────────────────

function parseFlags(argv) {
  const flags = {
    dryRun: true, // default
    verbose: false,
    project: null,
    founderUid: null,
  };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--dry-run') { flags.dryRun = true; }
    else if (a === '--execute') { flags.dryRun = false; }
    else if (a === '--verbose' || a === '-v') { flags.verbose = true; }
    else if (a === '--project') { flags.project = argv[++i]; }
    else if (a === '--founder-uid') { flags.founderUid = argv[++i]; }
    else if (a === '--help' || a === '-h') { printHelp(); process.exit(0); }
    else {
      console.error('Unknown flag: ' + a);
      printHelp();
      process.exit(1);
    }
  }
  return flags;
}

function printHelp() {
  console.log([
    'Usage: node scripts/migrate-to-v8.js [flags]',
    '',
    'Flags:',
    '  --dry-run           Report planned changes, no writes (default).',
    '  --execute           Actually write to Firestore.',
    '  --verbose, -v       Extra per-doc logging.',
    '  --project <id>      Target Firebase project. Required for production runs.',
    '  --founder-uid <uid> Zach\'s UID. Required for --execute production runs.',
    '  --help, -h          Print this help.',
    '',
    'Emulator runs detect FIRESTORE_EMULATOR_HOST env var; no creds required.',
    'Production runs require GOOGLE_APPLICATION_CREDENTIALS set.',
  ].join('\n'));
}

// ───────────────────────────────────────────────────────────────────
// Environment detection
// ───────────────────────────────────────────────────────────────────

function isEmulatorMode() {
  return !!process.env.FIRESTORE_EMULATOR_HOST;
}

function initAdmin(flags) {
  const emulator = isEmulatorMode();
  const project =
    flags.project
    || process.env.GCLOUD_PROJECT
    || (emulator ? 'parbaughs' : null);
  if (!project) {
    console.error('ERROR: --project required for non-emulator runs.');
    process.exit(1);
  }
  if (!admin.apps.length) {
    admin.initializeApp({ projectId: project });
  }
  return { db: admin.firestore(), project, emulator };
}

// ───────────────────────────────────────────────────────────────────
// Core mapping logic — DO NOT IMPROVISE; these rules trace to
// docs/v8.0-technical-design.md Section 6.1.a and the tightened user
// spec for v7.9.4 (stray-commissioner safety).
// ───────────────────────────────────────────────────────────────────

function computePlatformRoleMapping(memberData, memberUid, founderUid) {
  const role = memberData.role;
  if (role === 'commissioner') {
    if (memberUid === founderUid) {
      return {
        platformRole: 'founder',
        reason: 'legacy role=commissioner on founder uid',
      };
    }
    return {
      platformRole: 'user',
      reason: 'legacy role=commissioner on non-founder uid — demoted for safety (stray commissioner)',
    };
  }
  if (role === 'suspended') {
    return { platformRole: 'suspended', reason: 'legacy role=suspended' };
  }
  if (role === 'removed') {
    return { platformRole: 'banned', reason: 'legacy role=removed → platformRole=banned' };
  }
  // "member", missing, or anything else
  return {
    platformRole: 'user',
    reason: (role ? 'legacy role=' + role : 'no legacy role') + ' → default user',
  };
}

// Builds the NEW fields to merge onto the member doc. Does NOT touch
// legacy fields — they're kept through the v8.0–v8.1 transition
// window per governance decision 7.1.c.1.
function buildMemberMigrationPatch(memberData, newPlatformRole) {
  const patch = { platformRole: newPlatformRole };
  if (newPlatformRole === 'suspended') {
    patch.suspension = {
      until: memberData.suspendedUntil || null,
      reason: memberData.suspendedReason || '',
      reasonPrivate: false,
      issuedBy: memberData.suspendedBy || null,
      issuedAt: memberData.suspendedAt || null,
    };
  }
  if (newPlatformRole === 'banned') {
    patch.ban = {
      reason: memberData.removedReason || '',
      reasonPrivate: false,
      issuedBy: memberData.removedBy || null,
      issuedAt: memberData.removedAt || null,
    };
  }
  return patch;
}

function computeLeagueMigration(leagueData) {
  const missing = {};
  if (!Array.isArray(leagueData.bans)) missing.bans = [];
  if (!('pendingCommissionerTransfer' in leagueData)) {
    missing.pendingCommissionerTransfer = null;
  }
  if (!('customBranding' in leagueData)) {
    missing.customBranding = null;
  }
  const changed = Object.keys(missing).length > 0;
  return { changed, missing };
}

// ───────────────────────────────────────────────────────────────────
// Plan-gathering phase — read-only. Runs in dry-run and execute alike.
// ───────────────────────────────────────────────────────────────────

async function resolveFounderUid(db, flags) {
  if (flags.founderUid) return { founderUid: flags.founderUid, autoDetected: false };

  // Auto-detect only in dry-run or emulator mode. Production --execute
  // requires --founder-uid explicitly.
  if (!flags.dryRun && !isEmulatorMode()) {
    console.error('ERROR: --founder-uid required for production --execute.');
    process.exit(1);
  }

  const snap = await db.collection('members').where('role', '==', 'commissioner').get();
  if (snap.empty) {
    console.error('ERROR: No member with role="commissioner" found and --founder-uid not set.');
    console.error('       Either seed fixtures first, or pass --founder-uid explicitly.');
    process.exit(1);
  }
  if (snap.size > 1) {
    console.error('ERROR: Multiple members with role="commissioner" found:');
    snap.forEach(function (d) {
      const data = d.data();
      console.error('         ' + d.id + '  (' + (data.name || data.username || '(unnamed)') + ')');
    });
    console.error('       Pass --founder-uid explicitly.');
    process.exit(1);
  }
  const founderUid = snap.docs[0].id;
  return { founderUid, autoDetected: true, founderName: snap.docs[0].data().name || null };
}

async function planMembers(db, founderUid) {
  const snap = await db.collection('members').get();
  const plan = [];
  for (const doc of snap.docs) {
    const data = doc.data();
    const mapping = computePlatformRoleMapping(data, doc.id, founderUid);
    const existingPlatformRole = data.platformRole || null;
    plan.push({
      uid: doc.id,
      name: data.name || data.username || '(unnamed)',
      legacyRole: data.role || null,
      existingPlatformRole: existingPlatformRole,
      newPlatformRole: mapping.platformRole,
      reason: mapping.reason,
      needsWrite: existingPlatformRole !== mapping.platformRole
        || (mapping.platformRole === 'suspended' && !data.suspension)
        || (mapping.platformRole === 'banned' && !data.ban),
      originalData: data,
    });
  }
  return { plan, totalMembers: snap.size };
}

async function planLeagues(db) {
  const snap = await db.collection('leagues').get();
  const plan = [];
  for (const doc of snap.docs) {
    const data = doc.data();
    const migration = computeLeagueMigration(data);
    plan.push({
      id: doc.id,
      name: data.name || '(unnamed)',
      needsWrite: migration.changed,
      missing: migration.missing,
    });
  }
  return { plan, totalLeagues: snap.size };
}

async function planPlatformConfig(db, founderUid) {
  const ref = db.collection('platformConfig').doc('singleton');
  const snap = await ref.get();
  if (!snap.exists) {
    return { needsWrite: true, action: 'CREATE', existing: null, mismatch: false };
  }
  const existing = snap.data();
  const mismatch = existing.founderUid && existing.founderUid !== founderUid;
  return { needsWrite: false, action: 'EXISTS', existing, mismatch };
}

// ───────────────────────────────────────────────────────────────────
// Reporting
// ───────────────────────────────────────────────────────────────────

function printHeader(flags, envInfo, founderInfo) {
  console.log('═══ v8.0.0 MIGRATION SCRIPT ═══');
  console.log('Mode       : ' + (flags.dryRun ? 'DRY RUN (no writes)' : 'EXECUTE (will write)'));
  console.log('Project    : ' + envInfo.project);
  console.log('Env        : ' + (envInfo.emulator ? 'EMULATOR (localhost:8080)' : 'PRODUCTION'));
  console.log('Founder UID: ' + founderInfo.founderUid
    + (founderInfo.autoDetected ? '  (auto-detected' + (founderInfo.founderName ? ', ' + founderInfo.founderName : '') + ')' : '  (explicit)'));
  console.log('');
}

function printMemberPlan(memberPlanResult, verbose) {
  const { plan, totalMembers } = memberPlanResult;
  console.log('── Member migration plan ── (' + totalMembers + ' docs)');
  for (const entry of plan) {
    const mark = entry.needsWrite ? '●' : '○';
    const legacy = (entry.legacyRole || '(unset)').padEnd(12);
    const newRole = entry.newPlatformRole.padEnd(10);
    const existing = entry.existingPlatformRole
      ? '  existing: ' + entry.existingPlatformRole
      : '';
    console.log('  ' + mark + ' ' + entry.uid.padEnd(26) + '  ' + legacy + ' → ' + newRole + existing);
    if (verbose) {
      console.log('      name: ' + entry.name + '  |  ' + entry.reason);
    }
  }
  const changes = plan.filter(function (p) { return p.needsWrite; }).length;
  console.log('  Summary: ' + changes + ' need migration, ' + (totalMembers - changes) + ' already migrated');
  console.log('');
  return changes;
}

function printLeaguePlan(leaguePlanResult, verbose) {
  const { plan, totalLeagues } = leaguePlanResult;
  console.log('── League migration plan ── (' + totalLeagues + ' docs)');
  for (const entry of plan) {
    const mark = entry.needsWrite ? '●' : '○';
    const fields = Object.keys(entry.missing);
    const msg = fields.length
      ? 'add fields: ' + fields.join(', ')
      : '(already has v8 fields)';
    console.log('  ' + mark + ' ' + entry.id.padEnd(26) + '  ' + msg);
    if (verbose) {
      console.log('      name: ' + entry.name);
    }
  }
  const changes = plan.filter(function (p) { return p.needsWrite; }).length;
  console.log('  Summary: ' + changes + ' need field backfill, ' + (totalLeagues - changes) + ' already current');
  console.log('');
  return changes;
}

function printPlatformConfigPlan(configPlanResult, founderUid) {
  console.log('── platformConfig/singleton plan ──');
  if (configPlanResult.action === 'CREATE') {
    console.log('  ● CREATE  founderUid=' + founderUid + ', platformVersion="8.0.0", founderTransfer=null');
  } else {
    const existing = configPlanResult.existing;
    console.log('  ○ EXISTS  founderUid=' + (existing.founderUid || '(unset)')
      + ', platformVersion=' + (existing.platformVersion || '(unset)'));
    if (configPlanResult.mismatch) {
      console.log('  ! WARNING: existing founderUid (' + existing.founderUid + ') does NOT match target (' + founderUid + ')');
    }
  }
  console.log('');
  return configPlanResult.needsWrite ? 1 : 0;
}

// ───────────────────────────────────────────────────────────────────
// Execute phase — writes, staging, atomic swap, verification
// ───────────────────────────────────────────────────────────────────

async function stageMemberWrites(db, memberPlan) {
  console.log('── Phase A: Stage member writes to members_v8_staging/ ──');
  let staged = 0;
  for (const entry of memberPlan.plan) {
    if (!entry.needsWrite) continue;
    const patch = buildMemberMigrationPatch(entry.originalData, entry.newPlatformRole);
    const stagedDoc = Object.assign({}, entry.originalData, patch);
    await db.collection('members_v8_staging').doc(entry.uid).set(stagedDoc);
    staged++;
    if (staged % 10 === 0) console.log('    staged ' + staged + '…');
  }
  console.log('  ✓ ' + staged + ' members staged');
  return staged;
}

async function verifyStaging(db, memberPlan) {
  console.log('── Phase B: Verify staging before swap ──');
  const stagedSnap = await db.collection('members_v8_staging').get();
  const stagedByUid = {};
  stagedSnap.forEach(function (d) { stagedByUid[d.id] = d.data(); });
  const problems = [];
  for (const entry of memberPlan.plan) {
    if (!entry.needsWrite) continue;
    const s = stagedByUid[entry.uid];
    if (!s) {
      problems.push(entry.uid + ': missing from staging');
      continue;
    }
    if (s.platformRole !== entry.newPlatformRole) {
      problems.push(entry.uid + ': platformRole mismatch (staged=' + s.platformRole + ', expected=' + entry.newPlatformRole + ')');
    }
  }
  if (problems.length > 0) {
    console.error('  ✗ Staging verification FAILED:');
    for (const p of problems) console.error('      ' + p);
    console.error('  Originals untouched. Abort.');
    process.exit(1);
  }
  console.log('  ✓ staging verified (' + Object.keys(stagedByUid).length + ' docs)');
  return stagedByUid;
}

async function swapMembers(db, memberPlan, stagedByUid) {
  console.log('── Phase C: Atomic swap staging → members/ ──');
  let batch = db.batch();
  let opsInBatch = 0;
  let swapped = 0;
  for (const entry of memberPlan.plan) {
    if (!entry.needsWrite) continue;
    const stagedDoc = stagedByUid[entry.uid];
    batch.set(db.collection('members').doc(entry.uid), stagedDoc, { merge: false });
    opsInBatch++;
    swapped++;
    if (opsInBatch >= 400) {
      await batch.commit();
      batch = db.batch();
      opsInBatch = 0;
    }
  }
  if (opsInBatch > 0) await batch.commit();
  console.log('  ✓ ' + swapped + ' member docs overwritten from staging');
}

async function backfillLeagues(db, leaguePlan) {
  console.log('── Phase D: League field backfill ──');
  let updated = 0;
  for (const entry of leaguePlan.plan) {
    if (!entry.needsWrite) continue;
    await db.collection('leagues').doc(entry.id).update(entry.missing);
    updated++;
  }
  console.log('  ✓ ' + updated + ' league docs updated');
}

async function writePlatformConfig(db, configPlan, founderUid) {
  console.log('── Phase E: platformConfig/singleton ──');
  if (!configPlan.needsWrite) {
    console.log('  ○ already exists, no write');
    return;
  }
  await db.collection('platformConfig').doc('singleton').set({
    founderUid: founderUid,
    founderTransfer: null,
    platformVersion: '8.0.0',
    lockedAt: admin.firestore.FieldValue.serverTimestamp(),
  });
  console.log('  ✓ platformConfig/singleton created');
}

// ───────────────────────────────────────────────────────────────────
// Post-migration verification (Section 6.1.d)
// ───────────────────────────────────────────────────────────────────

async function verifyMigration(db, founderUid) {
  console.log('── Phase F: Post-migration verification ──');
  let ok = 0;
  let failed = 0;

  async function check(name, fn) {
    try {
      const result = await fn();
      if (result === true) {
        console.log('  ✓ ' + name);
        ok++;
      } else {
        console.error('  ✗ ' + name + (result ? ' — ' + result : ''));
        failed++;
      }
    } catch (e) {
      console.error('  ✗ ' + name + ' — ' + (e.message || e));
      failed++;
    }
  }

  await check('every member has platformRole set', async function () {
    const snap = await db.collection('members').get();
    const missing = [];
    snap.forEach(function (d) { if (!d.data().platformRole) missing.push(d.id); });
    return missing.length === 0 || ('missing on: ' + missing.join(', '));
  });

  await check('every member.platformRole is one of {founder, user, suspended, banned}', async function () {
    const valid = new Set(['founder', 'user', 'suspended', 'banned']);
    const snap = await db.collection('members').get();
    const bad = [];
    snap.forEach(function (d) {
      const role = d.data().platformRole;
      if (role && !valid.has(role)) bad.push(d.id + '=' + role);
    });
    return bad.length === 0 || ('invalid: ' + bad.join(', '));
  });

  await check('exactly one member has platformRole=founder', async function () {
    const snap = await db.collection('members').where('platformRole', '==', 'founder').get();
    if (snap.size === 1) return true;
    return snap.size + ' members found, expected 1';
  });

  await check('no member has role=commissioner with platformRole!=founder', async function () {
    const snap = await db.collection('members').where('role', '==', 'commissioner').get();
    const bad = [];
    snap.forEach(function (d) {
      if (d.data().platformRole !== 'founder') bad.push(d.id);
    });
    return bad.length === 0 || ('inconsistent on: ' + bad.join(', '));
  });

  await check('platformConfig/singleton exists with founderUid matching plan', async function () {
    const s = await db.collection('platformConfig').doc('singleton').get();
    if (!s.exists) return 'missing';
    if (!s.data().founderUid) return 'founderUid field missing';
    if (s.data().founderUid !== founderUid) return 'founderUid=' + s.data().founderUid + ', expected ' + founderUid;
    return true;
  });

  await check('every league has bans array field', async function () {
    const snap = await db.collection('leagues').get();
    const bad = [];
    snap.forEach(function (d) { if (!Array.isArray(d.data().bans)) bad.push(d.id); });
    return bad.length === 0 || ('missing on: ' + bad.join(', '));
  });

  console.log('');
  if (failed > 0) {
    console.error('Verification: ' + ok + ' passed, ' + failed + ' FAILED.');
    process.exit(1);
  }
  console.log('Verification: ' + ok + '/' + ok + ' checks passed.');
}

// ───────────────────────────────────────────────────────────────────
// Main
// ───────────────────────────────────────────────────────────────────

async function main() {
  const flags = parseFlags(process.argv.slice(2));
  const envInfo = initAdmin(flags);
  const { db } = envInfo;

  const founderInfo = await resolveFounderUid(db, flags);
  printHeader(flags, envInfo, founderInfo);

  const memberPlan = await planMembers(db, founderInfo.founderUid);
  const leaguePlan = await planLeagues(db);
  const configPlan = await planPlatformConfig(db, founderInfo.founderUid);

  const memberChanges = printMemberPlan(memberPlan, flags.verbose);
  const leagueChanges = printLeaguePlan(leaguePlan, flags.verbose);
  const configChanges = printPlatformConfigPlan(configPlan, founderInfo.founderUid);

  const totalChanges = memberChanges + leagueChanges + configChanges;
  console.log('── Overall ──');
  console.log('Total writes planned: ' + totalChanges);
  console.log('');

  if (flags.dryRun) {
    console.log('Dry run complete. No writes performed.');
    console.log('To execute against the current project, re-run with --execute.');
    if (!isEmulatorMode()) {
      console.log('Production --execute additionally requires --founder-uid <uid>.');
    }
    return;
  }

  if (totalChanges === 0) {
    console.log('No changes needed. Migration already complete.');
    // Still run verification — defense in depth.
    await verifyMigration(db, founderInfo.founderUid);
    return;
  }

  // Execute phases
  const staged = await stageMemberWrites(db, memberPlan);
  if (staged > 0) {
    const stagedByUid = await verifyStaging(db, memberPlan);
    await swapMembers(db, memberPlan, stagedByUid);
  }
  await backfillLeagues(db, leaguePlan);
  await writePlatformConfig(db, configPlan, founderInfo.founderUid);
  await verifyMigration(db, founderInfo.founderUid);

  console.log('');
  console.log('✓ Migration complete.');
}

main().catch(function (e) {
  console.error('Migration script error:');
  console.error(e && e.stack ? e.stack : e);
  process.exit(1);
});
