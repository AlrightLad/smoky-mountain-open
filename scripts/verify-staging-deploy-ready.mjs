// Verify staging Firebase Hosting deploy is live + serving current build.
// Used by .claude/state/task-queue/founder/staging-deploy-token.md verify_command.

const URL = 'https://parbaughs-staging.web.app/';

try {
    const r = await fetch(URL, { method: 'HEAD' });
    if (!r.ok) { console.log('FAIL'); process.exit(0); }
    // Also check for a parbaughs marker in the actual HTML
    const r2 = await fetch(URL);
    const text = await r2.text();
    if (/parbaughs|Parbaughs|The Clubhouse/i.test(text)) {
        console.log('PASS');
    } else {
        console.log('FAIL');
    }
} catch {
    console.log('FAIL');
}
