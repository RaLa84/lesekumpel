#!/usr/bin/env node
/*
 * fix-emoji-hyphens.js
 *
 * Einmaliger, idempotenter Batch-Patch für bereits deployte Stories.
 *
 * Bug: Im Emoji-Modus waren die Silben-Bindestriche sichtbar, weil `emojiStory`
 * harte Bindestriche ("-") als Silbentrenner nutzt, während rawStory Soft Hyphens
 * (U+00AD) nutzt und processWord() nur Soft Hyphens entfernt.
 *
 * Fix: Direkt vor `const storyRaw = ...` zwei Zeilen einfügen, die emojiStory/
 * emojiSummary auf die Soft-Hyphen-Konvention normalisieren. Danach greift die
 * bestehende processWord()-Logik unverändert.
 *
 * Quelle des Fixes (für künftige Stories): n8n-config/demo-template.html
 *
 * Aufruf:  node n8n-config/scripts/fix-emoji-hyphens.js
 */

const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..', '..');
const targetDir = path.join(repoRoot, 'demo-texte');

const ANCHOR = 'const storyRaw = rawStory.replace(/\\n/g, "<br>");';
const NORMALIZE =
  '// Emoji-Text nutzt dieselbe Silbentrenner-Konvention wie rawStory:\n' +
  '        // harte Bindestriche -> Soft Hyphen (U+00AD), damit processWord() sie\n' +
  '        // korrekt entfernt (kein sichtbarer Bindestrich im Emoji-Modus).\n' +
  '        emojiStory = emojiStory.replace(/-/g, "\\u00AD");\n' +
  '        emojiSummary = emojiSummary.replace(/-/g, "\\u00AD");\n' +
  '\n        ';

const files = fs.readdirSync(targetDir).filter((f) => f.endsWith('.html'));

let patched = 0;
let skippedNoEmoji = 0;
let skippedAlready = 0;
let skippedNoAnchor = 0;

for (const file of files) {
  const full = path.join(targetDir, file);
  const src = fs.readFileSync(full, 'utf8');

  if (!src.includes('let emojiStory =')) {
    skippedNoEmoji++;
    continue;
  }
  if (src.includes('emojiStory.replace(/-/g')) {
    skippedAlready++;
    continue;
  }
  if (!src.includes(ANCHOR)) {
    console.warn('  ! Anker fehlt: ' + file);
    skippedNoAnchor++;
    continue;
  }

  // Nur das erste Vorkommen ersetzen.
  const out = src.replace(ANCHOR, NORMALIZE + ANCHOR);
  fs.writeFileSync(full, out, 'utf8');
  patched++;
}

console.log('Fertig.');
console.log('  gepatcht:            ' + patched);
console.log('  ohne emojiStory:     ' + skippedNoEmoji);
console.log('  bereits gepatcht:    ' + skippedAlready);
console.log('  Anker fehlt:         ' + skippedNoAnchor);
