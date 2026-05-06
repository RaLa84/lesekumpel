#!/usr/bin/env node
// Generiert sitemap.xml aus den HTML-Dateien des Repos.
// Wird von .github/workflows/sitemap.yml bei jedem Push auf main ausgeführt.

import { readFile, writeFile, readdir, stat } from 'node:fs/promises';
import { join, basename } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(fileURLToPath(import.meta.url), '..', '..');
const SITE = 'https://rala84.github.io/lesekumpel';

// Statische Top-Level-Seiten mit ihrer SEO-Priorität (Index = 1.0, rechtliche Pflichtseiten = 0.3)
const STATIC_PAGES = [
  { path: 'index.html', priority: '1.0', changefreq: 'weekly' },
  { path: 'landingpage.html', priority: '0.9', changefreq: 'weekly' },
  { path: 'demo.html', priority: '0.8', changefreq: 'weekly' },
  { path: 'preise.html', priority: '0.7', changefreq: 'monthly' },
  { path: 'ueber-uns.html', priority: '0.6', changefreq: 'monthly' },
  { path: 'blog-warum-lesekumpel.html', priority: '0.6', changefreq: 'monthly' },
  { path: 'neue-geschichte.html', priority: '0.5', changefreq: 'monthly' },
  { path: 'starter.html', priority: '0.5', changefreq: 'monthly' },
  { path: 'impressum.html', priority: '0.3', changefreq: 'yearly' },
  { path: 'datenschutz.html', priority: '0.3', changefreq: 'yearly' },
];

// Story-Verzeichnisse (demo-texte bewusst weggelassen — Demo-Charakter würde Index verwässern)
const STORY_DIRS = [
  { dir: 'texte', priority: '0.8', changefreq: 'monthly' },
  { dir: 'comicgeschichten', priority: '0.8', changefreq: 'monthly' },
];

function escapeXml(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');
}

function isoDate(d) {
  return new Date(d).toISOString().slice(0, 10);
}

async function readFileMeta(filePath) {
  const html = await readFile(filePath, 'utf-8');
  const dateMeta = html.match(/<meta\s+name=["']date["']\s+content=["']([^"']*)["']/i);
  if (dateMeta && dateMeta[1]) {
    try { return isoDate(dateMeta[1]); } catch { /* fall through */ }
  }
  const st = await stat(filePath);
  return isoDate(st.mtime);
}

async function listHtml(dirAbs) {
  try {
    const entries = await readdir(dirAbs, { withFileTypes: true });
    return entries.filter(e => e.isFile() && e.name.endsWith('.html')).map(e => e.name).sort();
  } catch { return []; }
}

async function buildEntries() {
  const entries = [];
  for (const p of STATIC_PAGES) {
    const abs = join(ROOT, p.path);
    try {
      const st = await stat(abs);
      entries.push({
        loc: `${SITE}/${p.path === 'index.html' ? '' : p.path}`,
        lastmod: isoDate(st.mtime),
        changefreq: p.changefreq,
        priority: p.priority,
      });
    } catch { /* page doesn't exist — skip */ }
  }
  for (const sd of STORY_DIRS) {
    const dirAbs = join(ROOT, sd.dir);
    const files = await listHtml(dirAbs);
    for (const f of files) {
      const abs = join(dirAbs, f);
      const lastmod = await readFileMeta(abs);
      entries.push({
        loc: `${SITE}/${sd.dir}/${f}`,
        lastmod,
        changefreq: sd.changefreq,
        priority: sd.priority,
      });
    }
  }
  return entries;
}

function renderXml(entries) {
  const urls = entries.map(e => [
    '  <url>',
    `    <loc>${escapeXml(e.loc)}</loc>`,
    `    <lastmod>${e.lastmod}</lastmod>`,
    `    <changefreq>${e.changefreq}</changefreq>`,
    `    <priority>${e.priority}</priority>`,
    '  </url>',
  ].join('\n')).join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`;
}

(async () => {
  const entries = await buildEntries();
  const xml = renderXml(entries);
  const outPath = join(ROOT, 'sitemap.xml');
  await writeFile(outPath, xml, 'utf-8');
  console.log(`Wrote sitemap.xml with ${entries.length} URLs`);
  // Brief breakdown
  const byHost = entries.reduce((acc, e) => {
    const seg = e.loc.replace(`${SITE}/`, '').split('/')[0] || '(root)';
    acc[seg] = (acc[seg] || 0) + 1;
    return acc;
  }, {});
  for (const [k, v] of Object.entries(byHost)) console.log(`  ${k}: ${v}`);
})();
