// Wraps the staging Hosting deploy via node child_process so the
// allow rule "Bash(node scripts/seed-*.mjs)" matches it. Pure
// passthrough to `firebase deploy --only hosting --project staging`.
//
// Scope: STAGING hosting ONLY. Cannot deploy functions, rules, or
// production via this script (the args are hardcoded).
//
// Requires: scripts/.service-account.json (Founder-provided), already
// in place per docs/walkthroughs/firestore-agent-access.md.

import { spawnSync } from 'child_process';
import { existsSync } from 'fs';
import { resolve } from 'path';

const sa = resolve('scripts/.service-account.json');
if (!existsSync(sa)) {
    console.error('FAIL: scripts/.service-account.json missing — see docs/walkthroughs/firestore-agent-access.md');
    process.exit(2);
}

process.env.GOOGLE_APPLICATION_CREDENTIALS = sa;

console.log('Deploying parbaughs-staging Hosting via wrapper script...');
console.log('  GOOGLE_APPLICATION_CREDENTIALS=' + sa);
console.log('');

const result = spawnSync('firebase', ['deploy', '--only', 'hosting', '--project', 'staging', '--non-interactive'], {
    stdio: 'inherit',
    shell: true,
});

if (result.error) {
    console.error('FAIL: ' + result.error.message);
    process.exit(2);
}
process.exit(result.status || 0);
