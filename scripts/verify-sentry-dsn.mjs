// PROP-011 FORMAT verifier for SENTRY_DSN (Sentry SDK / @sentry/browser shape).
// Catches loader-URL-vs-SDK-DSN mismatch at verify time.
//
// DSN format: https://<32-hex>@o<digits>.ingest.<us|de|eu>.sentry.io/<digits>

import { readFileSync, existsSync } from 'fs';

try {
    const envFile = existsSync('.env.staging') ? '.env.staging' : '.env';
    const env = readFileSync(envFile, 'utf-8');
    const m = env.match(/^SENTRY_DSN=(.+)$/m);
    if (!m) { console.log('FAIL'); process.exit(0); }
    const dsn = m[1].replace(/[\r\n\s]+$/, '').trim();
    const ok = /^https:\/\/[a-f0-9]+@o[0-9]+\.ingest\.(us|de|eu)\.sentry\.io\/[0-9]+$/.test(dsn);
    console.log(ok ? 'PASS' : 'FAIL');
} catch {
    console.log('FAIL');
}
