// Verifies the 4 classifier-unblock permissions are in place + working.
// Prints PASS or FAIL (single token) for founder-mark-complete.ps1.
// Detailed output to stderr so it doesn't break the parse.

import { readFileSync, existsSync } from 'fs';

const RULES_REQUIRED = [
    'firebase deploy --only hosting --project staging',
    'npx firebase deploy --only hosting --project staging',
    'node scripts/seed-staging-from-fixtures.mjs',
    'node scripts/seed-',
];

try {
    if (!existsSync('.claude/settings.local.json')) {
        console.log('FAIL');
        process.exit(0);
    }
    const settings = JSON.parse(readFileSync('.claude/settings.local.json', 'utf-8'));
    const allow = (settings.permissions && settings.permissions.allow) || [];

    let allFound = true;
    for (const needle of RULES_REQUIRED) {
        const match = allow.some(rule => rule.includes(needle));
        process.stderr.write('  ' + (match ? '✓' : '✗') + ' ' + needle + '\n');
        if (!match) allFound = false;
    }

    // Also confirm service account JSON is in place (required for deploy)
    const saExists = existsSync('scripts/.service-account.json');
    process.stderr.write('  ' + (saExists ? '✓' : '✗') + ' scripts/.service-account.json exists\n');

    console.log((allFound && saExists) ? 'PASS' : 'FAIL');
} catch {
    console.log('FAIL');
}
