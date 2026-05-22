// Generic block-extractor for W1.A5 page splits.
// Usage: node scripts/refactor-extract-block.mjs <src> <out> <startLine> <endLine> <header>
// Lines are 1-indexed and inclusive on both ends.
// The source file gets the extracted range REPLACED with a one-line marker comment.

import { readFileSync, writeFileSync } from 'fs';

const [, , src, out, startStr, endStr, header] = process.argv;
if (!src || !out || !startStr || !endStr) {
    console.error('Usage: node refactor-extract-block.mjs <src> <out> <startLine> <endLine> [header]');
    process.exit(2);
}
const start = parseInt(startStr, 10);
const end = parseInt(endStr, 10);
const headerText = header || ('// Extracted from ' + src + ' per W1.A5 (AMD-027 page-size budget).');

const text = readFileSync(src, 'utf-8');
const lines = text.split('\n');
if (start < 1 || end > lines.length || start > end) {
    console.error('Bad line range: src has ' + lines.length + ' lines; requested ' + start + '-' + end);
    process.exit(2);
}

const extracted = lines.slice(start - 1, end);
const outContent = headerText + '\n\n' + extracted.join('\n') + '\n';
writeFileSync(out, outContent, 'utf-8');
console.log('Wrote ' + out + ' (' + extracted.length + ' lines)');

const marker = '// Extracted to ' + out + ' per W1.A5. Originally lines ' + start + '-' + end + ' of this file.';
const newLines = [
    ...lines.slice(0, start - 1),
    marker,
    ...lines.slice(end),
];
writeFileSync(src, newLines.join('\n'), 'utf-8');
console.log('Updated ' + src + ' (' + lines.length + ' -> ' + newLines.length + ' lines)');
