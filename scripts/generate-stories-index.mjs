#!/usr/bin/env node
// Generiert stories-index.json: ein kompakter Metadaten-Index aller Demo-/Story-
// Geschichten, damit demo.html EINE Datei laedt statt ~231 HTML-Dateien einzeln.
// Wird von .github/workflows/sitemap.yml bei jedem Push auf main ausgefuehrt.
//
// Spiegelt die Parsing-/Titel-Logik aus demo.html (loadMeta + formatName), damit
// der Index exakt das liefert, was die Seite sonst clientseitig zusammensucht.

import { readFile, writeFile, readdir, stat } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(fileURLToPath(import.meta.url), '..', '..');

// Gleiche Quell-Ordner wie demo.html (FOLDERS) — comicgeschichten = Comic, sonst Text
const FOLDERS = [
  { dir: 'demo-texte', type: 'text' },
  { dir: 'texte', type: 'text' },
  { dir: 'comicgeschichten', type: 'comic' },
  { dir: 'sachtexte', type: 'sachtext' },
];

// Alt-Sachtexte: Samira-Texte liegen historisch in demo-texte/ und bleiben dort
// (keine Redirects auf GitHub Pages) — sie werden per Autor als Sachtext klassifiziert.
const SACHTEXT_AUTHOR = 'Samira Wissensfreund';

function isoDate(d) {
  return new Date(d).toISOString().slice(0, 10);
}

// ── Laut-Profil ───────────────────────────────────────────────────────────
// Gespiegelt aus lautlese.js (LAUT_INVENTORY / matchesGrapheme / profileStory).
// Bei Änderungen dort bitte hier mitpflegen — eine Quelle der Wahrheit ist
// lautlese.js (Browser), diese Kopie hält den Build-Index synchron.
const LAUT_INVENTORY = [
  { id: 'ei' }, { id: 'au' }, { id: 'ie' }, { id: 'sch' }, { id: 'ch' },
  { id: 'st', initialOnly: true }, { id: 'sp', initialOnly: true },
  { id: 'ck' }, { id: 'pf' }, { id: 'ng' }, { id: 'eu' }, { id: 'äu' }, { id: 'qu' },
];

function cleanWordLL(raw) {
  return (raw || '')
    .replace(/\*\*/g, '').replace(/\*/g, '')
    .replace(/­/g, '')
    .replace(/[.,!?:;„“"»«‚'()\[\]…]/g, '')
    .replace(/[–—]/g, '')
    .trim();
}
function tokenizeLL(text) {
  return String(text || '').split(/\s+/).map(cleanWordLL).filter(Boolean);
}
function matchesGrapheme(word, g) {
  const lw = word.toLowerCase();
  if (g.initialOnly) return lw.indexOf(g.id) === 0;
  if (g.id === 'ch') return /(^|[^s])ch/.test(lw);
  return lw.indexOf(g.id) !== -1;
}
function profileStory(rawStory) {
  const words = tokenizeLL(rawStory);
  const profile = {};
  for (const g of LAUT_INVENTORY) {
    const seen = new Set();
    let n = 0;
    for (const w of words) {
      if (w.length < 2) continue;
      const key = w.toLowerCase();
      if (seen.has(key)) continue;
      if (matchesGrapheme(w, g)) { seen.add(key); n++; }
    }
    if (n > 0) profile[g.id] = n;
  }
  return profile;
}

// rawStory-Stringliteral aus dem HTML ziehen und entschärfen
function extractRawStory(html) {
  const m = html.match(/let\s+rawStory\s*=\s*"((?:[^"\\]|\\.)*)"/);
  if (!m) return '';
  try { return JSON.parse('"' + m[1] + '"'); } catch { return ''; }
}

// Skill-Persona → Niveau-Phase (1–5) für laut-/niveau-passende Vorschläge
const PERSONA_PHASE = [
  [/pip\s*punkt/i, 1], [/mia\s*mitte/i, 2], [/peter\s*past/i, 3],
  [/stella/i, 4], [/finja/i, 5],
];
function niveauPhase(readingLevel) {
  for (const [re, p] of PERSONA_PHASE) if (re.test(readingLevel || '')) return p;
  return null;
}

function formatName(filename) {
  return filename
    .replace(/\.html$/, '')
    .replace(/-[0-9a-z]{4,}$/, '')
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (l) => l.toUpperCase());
}

function cleanTitle(raw, fallbackName) {
  let t = (raw || '')
    .replace(/\s*[—–-]\s*Lesetext\s+für\s+[^|]*\|\s*Lesekumpel.*$/i, '')
    .replace(/\s*\(.*?\)\s*[—–-]\s*[^|]*\|\s*Lesekumpel.*$/i, '')
    .replace(/\s*[—–-]\s*[^|]*\|\s*Lesekumpel.*$/i, '')
    .replace(/\s*[—–-]\s*Lesekumpel\s*v?2?\s*$/i, '')
    .trim();
  return t || formatName(fallbackName);
}

function match1(html, re) {
  const m = html.match(re);
  return m && m[1] ? m[1].trim() : '';
}

async function listHtml(dirAbs) {
  try {
    const entries = await readdir(dirAbs, { withFileTypes: true });
    return entries.filter((e) => e.isFile() && e.name.endsWith('.html')).map((e) => e.name).sort();
  } catch {
    return [];
  }
}

async function buildStories() {
  const stories = [];
  for (const cfg of FOLDERS) {
    const dirAbs = join(ROOT, cfg.dir);
    for (const name of await listHtml(dirAbs)) {
      const abs = join(dirAbs, name);
      let html;
      try { html = await readFile(abs, 'utf-8'); } catch { continue; }

      const dateRaw = match1(html, /<meta\s+name=["']date["']\s+content=["']([^"']+)["']/i);
      if (!dateRaw) continue; // wie demo.html: nur Stories mit date-Meta in den Katalog

      let date;
      try { date = isoDate(dateRaw); } catch { continue; }

      const readingLevel = match1(html, /<meta\s+name=["']reading-level["']\s+content=["']([^"']+)["']/i);
      const lautProfil = profileStory(extractRawStory(html));
      const author = match1(html, /<meta\s+name=["']author["']\s+content=["']([^"']+)["']/i);
      const type = author === SACHTEXT_AUTHOR ? 'sachtext' : cfg.type;
      // Top-100-Stories tragen das rebus-icons-Meta (nur der Top-100-Workflow setzt es).
      const top100 = /<meta\s+name=["']rebus-icons["']\s+content=["']1["']/i.test(html);

      stories.push({
        path: `${cfg.dir}/${name}`,
        type,
        title: cleanTitle(match1(html, /<title>([^<]+)<\/title>/i), name),
        author,
        date,
        readingLevel,
        neurotype: match1(html, /<meta\s+name=["']neurotype["']\s+content=["']([^"']+)["']/i),
        niveau: niveauPhase(readingLevel),
        lautProfil,
        ...(top100 ? { top100: true } : {}),
      });
    }
  }
  // Neueste zuerst
  stories.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
  return stories;
}

(async () => {
  const stories = await buildStories();
  const out = { generated: new Date().toISOString(), count: stories.length, stories };
  await writeFile(join(ROOT, 'stories-index.json'), JSON.stringify(out), 'utf-8');
  console.log(`Wrote stories-index.json with ${stories.length} stories`);
  const byType = stories.reduce((a, s) => ((a[s.type] = (a[s.type] || 0) + 1), a), {});
  for (const [k, v] of Object.entries(byType)) console.log(`  ${k}: ${v}`);
})();
