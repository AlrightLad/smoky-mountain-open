// PROP-011 FORMAT verifier for SENTRY_AUTH_TOKEN
// Used by .claude/state/task-queue/founder/sentry-auth-token.md verify_command.
// Prints PASS or FAIL — single token, machine-parseable.
//
// Token format: sntr<1-2 lowercase letters>_<40+ chars>
// Examples: sntrys_..., sntryu_..., sntrxu_...

import { readFileSync } from 'fs';

try {
    const env = readFileSync('.env', 'utf-8');
    const m = env.match(/^SENTRY_AUTH_TOKEN=(.+)$/m);
    if (!m) { console.log('FAIL'); process.exit(0); }
    const token = m[1].replace(/[\r\n\s]+$/, '').trim();
    const ok = /^sntr[a-z]{1,2}_[A-Za-z0-9+/=._-]{40,}$/.test(token);
    console.log(ok ? 'PASS' : 'FAIL');
} catch {
    console.log('FAIL');
}
