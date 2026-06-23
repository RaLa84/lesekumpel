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
];

function isoDate(d) {
  return new Date(d).toISOString().slice(0, 10);
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

      stories.push({
        path: `${cfg.dir}/${name}`,
        type: cfg.type,
        title: cleanTitle(match1(html, /<title>([^<]+)<\/title>/i), name),
        author: match1(html, /<meta\s+name=["']author["']\s+content=["']([^"']+)["']/i),
        date,
        readingLevel: match1(html, /<meta\s+name=["']reading-level["']\s+content=["']([^"']+)["']/i),
        neurotype: match1(html, /<meta\s+name=["']neurotype["']\s+content=["']([^"']+)["']/i),
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
