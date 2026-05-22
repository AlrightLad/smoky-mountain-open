// W1.A5 — split caddynotes.js by extracting archiveNotes data into a sibling
// file. After this runs:
//   - src/pages/caddynotes-archive.js holds `var caddynotesArchive = [...]`
//   - src/pages/caddynotes.js references it via `var archiveNotes = caddynotesArchive;`
// Idempotent — re-running is a no-op once split.

import { readFileSync, writeFileSync, existsSync } from 'fs';

const SRC = 'src/pages/caddynotes.js';
const ARCHIVE = 'src/pages/caddynotes-archive.js';

const text = readFileSync(SRC, 'utf-8');
const lines = text.split('\n');

// Already split? bail.
if (lines.some(l => l.includes('var archiveNotes = caddynotesArchive'))) {
    console.log('Already split. No-op.');
    process.exit(0);
}

// Find archiveNotes start + end
let startIdx = -1, endIdx = -1;
for (let i = 0; i < lines.length; i++) {
    if (/^\s*var archiveNotes = \[/.test(lines[i])) { startIdx = i; break; }
}
if (startIdx < 0) { console.error('FAIL: var archiveNotes = [ not found'); process.exit(1); }

// Find matching closing `  ];` — match the indent of the opening line
const openIndent = lines[startIdx].match(/^(\s*)/)[1];
const closePattern = new RegExp('^' + openIndent + '\\];');
for (let i = startIdx + 1; i < lines.length; i++) {
    if (closePattern.test(lines[i])) { endIdx = i; break; }
}
if (endIdx < 0) { console.error('FAIL: closing ]; not found'); process.exit(1); }

console.log('archiveNotes block: lines ' + (startIdx + 1) + '-' + (endIdx + 1) + ' (' + (endIdx - startIdx + 1) + ' lines)');

// Build archive file
const archiveLines = lines.slice(startIdx, endIdx + 1);
// Rename var: `  var archiveNotes = [` -> `var caddynotesArchive = [`
archiveLines[0] = archiveLines[0].replace(/^\s*var archiveNotes = \[/, 'var caddynotesArchive = [');
// Also dedent the closing bracket
archiveLines[archiveLines.length - 1] = archiveLines[archiveLines.length - 1].replace(/^\s*\];/, '];');
// Dedent body too (remove 2-space indent prefix that was inside Router.register block)
for (let i = 1; i < archiveLines.length - 1; i++) {
    if (archiveLines[i].startsWith('    ')) archiveLines[i] = archiveLines[i].substring(2);
}

const archiveContent = '// ========== THE CADDY NOTES — ARCHIVE DATA ==========\n' +
    '// Auto-extracted from caddynotes.js per W1.A5 (AMD-027 page-size budget).\n' +
    '// Loaded BEFORE caddynotes.js — see vite.config.js DEFERRED_PAGES order.\n' +
    '// To add a new release entry, prepend it to the array.\n\n' +
    archiveLines.join('\n') + '\n';

writeFileSync(ARCHIVE, archiveContent, 'utf-8');
console.log('Wrote ' + ARCHIVE + ' (' + archiveLines.length + ' lines)');

// Replace archiveNotes block in caddynotes.js with one-line reference
const newLines = [
    ...lines.slice(0, startIdx),
    '  // archiveNotes data lives in caddynotes-archive.js per W1.A5 (AMD-027).',
    '  // The archive file declares `var caddynotesArchive` at module scope.',
    '  var archiveNotes = caddynotesArchive;',
    ...lines.slice(endIdx + 1),
];
writeFileSync(SRC, newLines.join('\n'), 'utf-8');
console.log('Updated ' + SRC + ' (now ' + newLines.length + ' lines)');
