// Seeds the parbaughs-staging Firestore with the same E2E fixtures used
// by the emulator. Lets the staging URL render real-shape data instead
// of being empty.
//
// Idempotent — re-running is safe; existing docs get overwritten by
// the same fixture data.
//
// Requires: scripts/.service-account.json (per docs/walkthroughs/firestore-agent-access.md)

import { readFileSync } from 'fs';
import { createRequire } from 'module';

const require_ = createRequire(import.meta.url);
const users = require_('../tests/e2e/setup/fixtures/users.js').users;
const rounds = require_('../tests/e2e/setup/fixtures/rounds.js').rounds;
const leagues = require_('../tests/e2e/setup/fixtures/leagues.js').leagues;

const key = JSON.parse(readFileSync('scripts/.service-account.json', 'utf-8'));
const admin = (await import('firebase-admin')).default;
if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(key),
        projectId: 'parbaughs-staging',
    });
}
const db = admin.firestore();

console.log('Seeding parbaughs-staging from E2E fixtures');
console.log('  users:    ' + users.length);
console.log('  rounds:   ' + (typeof rounds === 'function' ? '<fn>' : rounds.length));
console.log('  leagues:  ' + leagues.length);
console.log('');

// Seed members
let written = 0;
for (const u of users) {
    await db.collection('members').doc(u.uid).set(u.memberDoc, { merge: true });
    written++;
}
console.log('  ✓ ' + written + ' member docs written to /members/');

// Seed leagues
written = 0;
for (const l of leagues) {
    await db.collection('leagues').doc(l.id).set(l.doc, { merge: true });
    written++;
}
console.log('  ✓ ' + written + ' league docs written to /leagues/');

// Seed rounds (rounds may be function or array)
const roundsList = typeof rounds === 'function' ? rounds(users) : rounds;
written = 0;
for (const r of roundsList) {
    if (!r.id) continue;
    await db.collection('rounds').doc(r.id).set(r, { merge: true });
    written++;
}
console.log('  ✓ ' + written + ' round docs written to /rounds/');

console.log('');
console.log('Staging Firestore seeded. Reload https://parbaughs-staging.web.app after sign-in to see data.');
