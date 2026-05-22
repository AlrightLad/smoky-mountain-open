// PROP-011 verifier — confirms the agent has Firestore read/write
// access on parbaughs-staging via scripts/.service-account.json.
// Returns PASS / FAIL exclusively (no other output) so
// founder-mark-complete.ps1 can parse.

import { readFileSync, existsSync } from 'fs';

const KEY_PATH = 'scripts/.service-account.json';

try {
    if (!existsSync(KEY_PATH)) { console.log('FAIL'); process.exit(0); }

    const raw = readFileSync(KEY_PATH, 'utf-8');
    let key;
    try { key = JSON.parse(raw); } catch { console.log('FAIL'); process.exit(0); }

    // FORMAT check: required fields for a Firebase service account
    if (key.type !== 'service_account') { console.log('FAIL'); process.exit(0); }
    if (!key.project_id || !/^parbaughs-staging$/.test(key.project_id)) { console.log('FAIL'); process.exit(0); }
    if (!key.private_key || !/BEGIN PRIVATE KEY/.test(key.private_key)) { console.log('FAIL'); process.exit(0); }
    if (!key.client_email || !/iam\.gserviceaccount\.com$/.test(key.client_email)) { console.log('FAIL'); process.exit(0); }

    // Connectivity check: initialize firebase-admin + write + read + delete _ping doc
    const admin = (await import('firebase-admin')).default;
    if (!admin.apps.length) {
        admin.initializeApp({
            credential: admin.credential.cert(key),
            projectId: 'parbaughs-staging',
        });
    }
    const db = admin.firestore();
    const pingDoc = db.collection('_agent_ping').doc('verify-' + Date.now());
    await pingDoc.set({ ts: admin.firestore.FieldValue.serverTimestamp(), source: 'verify-firestore-agent-access' });
    const snap = await pingDoc.get();
    if (!snap.exists) { console.log('FAIL'); process.exit(0); }
    await pingDoc.delete();
    console.log('PASS');
} catch {
    console.log('FAIL');
}
