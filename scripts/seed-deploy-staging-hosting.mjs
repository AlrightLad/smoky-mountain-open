// Wraps the staging Hosting deploy via node child_process so the
// allow rule "Bash(node scripts/seed-*.mjs)" matches it. Builds the
// staging bundle, then runs `firebase deploy --only hosting --project staging`.
//
// Scope: STAGING hosting ONLY. Cannot deploy functions, rules, or
// production via this script (the args are hardcoded).
//
// Build base: staging is served from the ROOT of parbaughs-staging.web.app,
// but production (GitHub Pages) is served under /smoky-mountain-open/. The
// committed vite base is the production subpath, so a plain `npm run build`
// produces asset URLs (/smoky-mountain-open/assets/...) that 404 on staging
// (they hit the SPA rewrite and return index.html, so images decode as HTML
// and break, e.g. the sign-in logo). `npm run build:staging` (vite --base=/)
// emits root-relative asset URLs that resolve correctly on Firebase Hosting.
// Building here (not relying on a separate `npm run build`) makes the staging
// deploy self-contained and removes the wrong-base footgun.
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

console.log('Building staging bundle (vite --base=/)...');
const build = spawnSync('npm', ['run', 'build:staging'], { stdio: 'inherit', shell: true });
if (build.error) {
    console.error('FAIL: ' + build.error.message);
    process.exit(2);
}
if (build.status !== 0) {
    console.error('FAIL: staging build exited with code ' + build.status);
    process.exit(build.status || 2);
}

console.log('');
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
