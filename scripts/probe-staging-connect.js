#!/usr/bin/env node
/**
 * Phase 1a connectivity smoke — verify parbaughs-staging is reachable end-to-end.
 *
 * Uses firebase-admin with the production service account (same auth) but
 * targets the staging project via projectId override. Writes a probe doc to
 * /_probes/{timestamp} and reads it back. Cleans up after itself.
 *
 * Per Founder Checklist Phase 1a step: "Run a minimal connectivity smoke:
 * read parbaughs-staging Firestore (auth as service account if available)".
 *
 * Exit 0 if write+read+delete all succeed.
 * Exit 1 if any step fails. Error messages indicate which.
 */
const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');

const SA_PATH = path.resolve(__dirname, '.service-account.json');
const STAGING_PROJECT_ID = 'parbaughs-staging';

if (!fs.existsSync(SA_PATH)) {
    console.error('FAIL: service account JSON missing at', SA_PATH);
    console.error('Cannot probe without auth. Surface as Founder gap.');
    process.exit(1);
}

const sa = require(SA_PATH);

// Initialize admin SDK targeting STAGING project explicitly. The service
// account JSON identifies the production project by default — overriding
// projectId is required to write to staging.
const app = admin.initializeApp({
    credential: admin.credential.cert(sa),
    projectId: STAGING_PROJECT_ID,
}, 'staging-probe');

const db = app.firestore();
const probeId = `probe-${Date.now()}`;
const probePayload = {
    purpose: 'phase-1a-connectivity-smoke',
    written_at: new Date().toISOString(),
    note: 'safe to delete; auto-cleaned by probe script',
};

(async () => {
    let writeOk = false;
    let readOk = false;
    let deleteOk = false;
    let probeUrl = null;
    try {
        // Write
        await db.collection('_probes').doc(probeId).set(probePayload);
        writeOk = true;
        console.log('OK write: _probes/' + probeId);

        // Read back
        const snap = await db.collection('_probes').doc(probeId).get();
        if (snap.exists && snap.data().purpose === probePayload.purpose) {
            readOk = true;
            console.log('OK read: payload matches');
            probeUrl = `https://console.firebase.google.com/project/${STAGING_PROJECT_ID}/firestore/data/~2F_probes~2F${probeId}`;
        } else {
            console.error('FAIL read: doc missing or mismatched');
        }

        // Cleanup
        await db.collection('_probes').doc(probeId).delete();
        deleteOk = true;
        console.log('OK delete: probe doc removed');
    } catch (e) {
        console.error('FAIL:', e.code || 'unknown', '-', e.message);
        if (e.code === 'permission-denied') {
            console.error('Likely Firestore rules block writes to /_probes/. Rules need to be deployed.');
        }
        if (e.code === 'NOT_FOUND' || /not been used in project/i.test(e.message)) {
            console.error('Likely Firestore not enabled OR project ID mismatch.');
        }
        if (writeOk && !deleteOk) {
            console.error('LEAKED probe doc:', probeId, '— manually delete via Firebase console');
        }
        process.exit(1);
    }

    console.log('');
    console.log('CONNECTIVITY SMOKE: PASS');
    console.log('  write=' + writeOk + ' read=' + readOk + ' delete=' + deleteOk);
    process.exit(0);
})();
