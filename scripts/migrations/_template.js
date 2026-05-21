#!/usr/bin/env node
/**
 * Migration template — copy this file when authoring a new migration.
 *
 * Usage:
 *   node scripts/migrations/<this-file>.js --emulator [--dry-run]
 *   node scripts/migrations/<this-file>.js --production [--dry-run]  (AMD-018 gated)
 *
 * Required env (production only):
 *   FOUNDER_AUTH_TS=<ISO timestamp> — Founder pre-authorization from task-queue/founder/
 */

const admin = require('firebase-admin');
const path = require('node:path');
const fs = require('node:fs');

const MIGRATION_NAME = path.basename(__filename, '.js');
const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');
const EMULATOR = args.includes('--emulator');
const PRODUCTION = args.includes('--production');

if (!EMULATOR && !PRODUCTION) {
  console.error('Usage: --emulator OR --production [--dry-run]');
  process.exit(2);
}

if (PRODUCTION && !DRY_RUN && !process.env.FOUNDER_AUTH_TS) {
  console.error('AMD-018 BLOCK: production migration requires FOUNDER_AUTH_TS env var.');
  process.exit(3);
}

// Initialize Admin SDK
if (EMULATOR) {
  process.env.FIRESTORE_EMULATOR_HOST = process.env.FIRESTORE_EMULATOR_HOST || 'localhost:8080';
  admin.initializeApp({ projectId: 'parbaughs-emulator' });
} else {
  admin.initializeApp({
    credential: admin.credential.cert(require('../.service-account.json')),
  });
}

const db = admin.firestore();

async function up() {
  // === FORWARD MIGRATION ===
  // Read affected docs, transform, write back.
  // Use batched writes; chunk if needed.
  console.log(`[${MIGRATION_NAME}] up() — describe what this migration does`);
  // Example:
  //   const snapshot = await db.collection('members').get();
  //   const batch = db.batch();
  //   snapshot.docs.forEach(doc => {
  //     batch.update(doc.ref, { newField: deriveFromExisting(doc.data()) });
  //   });
  //   if (!DRY_RUN) await batch.commit();
  //   console.log(`  Updated ${snapshot.size} docs`);
}

async function down() {
  // === REVERSE MIGRATION ===
  // Undo what up() did. Required for rollback if forward fails partway.
  console.log(`[${MIGRATION_NAME}] down() — reverse the forward migration`);
}

async function main() {
  const start = Date.now();
  try {
    await up();
    const duration = Date.now() - start;
    console.log(`[${MIGRATION_NAME}] complete in ${duration}ms ${DRY_RUN ? '(dry-run)' : ''}`);
    if (!DRY_RUN) {
      // Write audit log
      const log = {
        migration: MIGRATION_NAME,
        applied_at: new Date().toISOString(),
        env: EMULATOR ? 'emulator' : 'production',
        founder_auth_ts: process.env.FOUNDER_AUTH_TS || null,
        duration_ms: duration,
      };
      const logDir = path.join(__dirname, '..', '..', '.claude', 'state', 'migrations-applied');
      fs.mkdirSync(logDir, { recursive: true });
      fs.writeFileSync(
        path.join(logDir, MIGRATION_NAME + '.json'),
        JSON.stringify(log, null, 2)
      );
    }
  } catch (e) {
    console.error(`[${MIGRATION_NAME}] failed:`, e);
    process.exit(1);
  }
}

main();
