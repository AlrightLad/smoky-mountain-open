#!/usr/bin/env node
/**
 * Phase 1a auth-provider verify — check whether Email/Password sign-in is
 * enabled on parbaughs-staging.
 *
 * Uses firebase-admin Auth to attempt creating a test user. If
 * Email/Password provider is enabled, the create succeeds. If disabled,
 * createUser returns "operation-not-allowed". We then immediately delete
 * the test user so we don't leave fixtures behind.
 *
 * Per Founder Checklist Phase 1a: "Verify Email/Password auth provider is
 * enabled on staging via firebase-admin if reachable".
 */
const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');

const SA_PATH = path.resolve(__dirname, '.service-account.json');
const STAGING_PROJECT_ID = 'parbaughs-staging';

if (!fs.existsSync(SA_PATH)) {
    console.error('FAIL: service account JSON missing');
    process.exit(1);
}
const sa = require(SA_PATH);

const app = admin.initializeApp({
    credential: admin.credential.cert(sa),
    projectId: STAGING_PROJECT_ID,
}, 'staging-auth-probe');

const auth = app.auth();
const probeEmail = `phase1a-auth-probe+${Date.now()}@parbaughs.test`;
const probePassphrase = 'phase1a-auth-probe-' + Math.random().toString(36).slice(2);

(async () => {
    let userRecord = null;
    try {
        userRecord = await auth.createUser({
            email: probeEmail,
            password: probePassphrase,
            displayName: 'phase-1a-auth-probe',
            emailVerified: false,
            disabled: false,
        });
        console.log('OK createUser: uid=' + userRecord.uid);
        console.log('VERDICT: Email/Password provider is ENABLED on staging');
    } catch (e) {
        if (e.code === 'auth/operation-not-allowed' || /operation.not.allowed/i.test(e.message || '')) {
            console.log('VERDICT: Email/Password provider is DISABLED — Founder must enable via console');
            console.log('Console URL: https://console.firebase.google.com/project/' + STAGING_PROJECT_ID + '/authentication/providers');
        } else {
            console.error('FAIL probe:', e.code || 'unknown', '-', e.message);
        }
        process.exit(e.code === 'auth/operation-not-allowed' ? 2 : 1);
    } finally {
        if (userRecord) {
            try {
                await auth.deleteUser(userRecord.uid);
                console.log('OK delete test user');
            } catch (e2) {
                console.error('WARN: leaked test user', userRecord.uid, '-', e2.message);
            }
        }
    }
    process.exit(0);
})();
