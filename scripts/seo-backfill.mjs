#!/usr/bin/env node
// SEO-Backfill für bestehende Story-HTML-Dateien.
// Regex-basiert (Templates strukturell sehr uniform: alles aus demo-template.html).
// Fügt nur HEAD-Tags + JSON-LD ein, lässt Body-Struktur unverändert.

import { readFile, writeFile, readdir, stat } from 'node:fs/promises';
import { join, basename, posix } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(fileURLToPath(import.meta.url), '..', '..');
const SITE = 'https://rala84.github.io/lesekumpel';

const PERSONA_META = {
  'Pip Punkt': { age: '5–6', words: '20–50', img: `${SITE}/avatars/pip-punkt.webp`,
    bio: 'Pip macht jeden Satz kurz und klar. Punkt. Fertig.' },
  'Mia Mitte': { age: '6–7', words: '50–100', img: `${SITE}/avatars/mia-mitte.webp`,
    bio: 'Mia erzählt richtige Geschichten — mit Anfang, Mitte und Ende.' },
  'Peter Past': { age: '7–8', words: '100–150', img: `${SITE}/avatars/peter-past.webp`,
    bio: 'Peter erzählt spannende Geschichten aus der Vergangenheit.' },
  'Stella Stimmenreich': { age: '8–9', words: '150–250', img: `${SITE}/avatars/stella-stimmenreich.webp`,
    bio: 'Stella gibt jeder Figur eine eigene Stimme.' },
  'Finja Feder': { age: '9–10', words: '250–400', img: `${SITE}/avatars/finja-feder.webp`,
    bio: 'Finja schreibt wie eine echte Autorin.' },
  'Samira Wissensfreund': { age: '7–10', words: '120–250', img: `${SITE}/avatars/samira-wissensfreund.webp`,
    bio: 'Samira liebt es, spannende Fakten zu entdecken.' },
  'Holzi Pixelkopf': { age: '8–10', words: '120–250', img: `${SITE}/avatars/holzi-pixelkopf.webp`,
    bio: 'Holzi ist der sympathische Chaot der Gaming-Geschichten.' },
  'Deniz Traumfänger': { age: '7–10', words: '150–300', img: `${SITE}/avatars/deniz-traumfaenger.webp`,
    bio: 'Deniz nimmt dich mit in magische Welten voller Atmosphäre.' },
  'Jonas Entdecker': { age: '7–10', words: '100–200', img: `${SITE}/avatars/jonas-entdecker.webp`,
    bio: 'Jonas erzählt Alltagsabenteuer aus der Ich-Perspektive.' },
  // Archivierte Personas — best-effort fallbacks
  'Lea Lesestark': { age: '6–8', words: '50–150', img: `${SITE}/avatars/mia-mitte.webp`,
    bio: 'Lea erzählt Geschichten zum Lesenlernen.' },
  'Timo Taktschritt': { age: '7–9', words: '100–200', img: `${SITE}/avatars/peter-past.webp`,
    bio: 'Timo erzählt rhythmische Geschichten.' },
  'Zara Zapp': { age: '7–9', words: '100–200', img: `${SITE}/avatars/holzi-pixelkopf.webp`,
    bio: 'Zara erzählt schnelle, dynamische Geschichten.' },
  'Leo Klartext': { age: '6–8', words: '50–150', img: `${SITE}/avatars/peter-past.webp`,
    bio: 'Leo erzählt klar und direkt.' },
};

const FALLBACK_PERSONA = { age: '6–10', words: '', img: `${SITE}/avatars/peter-past.webp`,
  bio: 'Eine Geschichte aus der Lesekumpel-Bibliothek.' };

function htmlEscape(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;').replace(/"/g, '&quot;')
    .replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function getMeta(html, name) {
  const re = new RegExp(`<meta\\s+name=["']${name}["']\\s+content=["']([^"']*)["']`, 'i');
  const m = html.match(re);
  return m ? m[1].trim() : '';
}

function getTitle(html) {
  const m = html.match(/<title>([\s\S]*?)<\/title>/i);
  if (!m) return '';
  return m[1].replace(/\s+/g, ' ').trim();
}

function stripSyllableHyphens(s) {
  return String(s).replace(/(?<=[a-zA-ZäöüßÄÖÜ])-(?=[a-zA-ZäöüßÄÖÜ])/g, '');
}

function extractStoryExcerpt(html) {
  // 1) Lesekumpel-Template: Story-Text als JS-String in `let rawStory = "..."`
  const rawMatch = html.match(/let\s+rawStory\s*=\s*("(?:\\.|[^"\\])*")/);
  if (rawMatch) {
    try {
      return stripSyllableHyphens(JSON.parse(rawMatch[1])).replace(/\s+/g, ' ').trim();
    } catch { /* fall through */ }
  }
  // 2) Comic-Template: Story-Text in inputData.content.tile1 / tile2 / ...
  const tiles = [];
  const tileRe = /"tile\d+"\s*:\s*"((?:\\.|[^"\\])*)"/g;
  let tm;
  while ((tm = tileRe.exec(html)) !== null) {
    try { tiles.push(JSON.parse(`"${tm[1]}"`)); } catch { tiles.push(tm[1]); }
  }
  if (tiles.length) {
    return stripSyllableHyphens(tiles.join(' ')).replace(/\s+/g, ' ').trim();
  }
  // 3) Fallback: gerendertes <p> in story-text/story-content
  let region = html;
  const storyDiv = html.match(/<div[^>]+class="[^"]*story-(?:text|content)[^"]*"[^>]*>([\s\S]*?)<\/div>/i);
  if (storyDiv) region = storyDiv[1];
  const pMatch = region.match(/<p[^>]*>([\s\S]*?)<\/p>/i);
  if (!pMatch) return '';
  const text = pMatch[1].replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ').trim();
  // Footer-Boilerplate ausschließen
  if (/erstellt von deinem ki-lesekumpel/i.test(text)) return '';
  return text;
}

function buildSeoBlock({ title, date, author, readingLevel, neurotype, genre, slug, storyPath, excerpt }) {
  const persona = PERSONA_META[author] || FALLBACK_PERSONA;
  const age = persona.age;
  const neuroBadge = (neurotype && neurotype !== 'Standard' && neurotype !== author) ? ` (${neurotype}-optimiert)` : '';
  const descRaw = `Lesetext für ${age}-Jährige${neuroBadge}: ${title}. ${excerpt}`.trim();
  const description = descRaw.length > 157 ? descRaw.substring(0, 157).trimEnd() + '…' : descRaw;
  const keywords = [author, neurotype, genre, 'Lesetext', 'Lesen lernen', `Kinder ${age}`]
    .filter(v => v && v !== 'Standard').join(', ');
  const url = `${SITE}/${storyPath}`;
  const ogImage = persona.img;
  const readingLabel = readingLevel || (persona.words ? `${persona.words} Wörter, ${author}` : author);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: title,
    description,
    datePublished: date || '',
    inLanguage: 'de-DE',
    url,
    image: ogImage,
    author: { '@type': 'Person', name: author, image: persona.img, description: persona.bio },
    publisher: { '@type': 'Organization', name: 'Lesekumpel', url: `${SITE}/` },
    audience: { '@type': 'EducationalAudience', educationalRole: 'student', audienceType: `Kinder ${age} Jahre` }
  };
  const jsonLdSafe = JSON.stringify(jsonLd, null, 2).replace(/<\/script>/gi, '<\\/script>');

  const e = htmlEscape;
  return [
    `    <meta name="description" content="${e(description)}">`,
    `    <meta name="keywords" content="${e(keywords)}">`,
    `    <link rel="canonical" href="${url}">`,
    `    <meta name="robots" content="index, follow, max-snippet:-1, max-image-preview:large">`,
    `    <meta property="og:type" content="article">`,
    `    <meta property="og:title" content="${e(title)}">`,
    `    <meta property="og:description" content="${e(description)}">`,
    `    <meta property="og:url" content="${url}">`,
    `    <meta property="og:image" content="${ogImage}">`,
    `    <meta property="og:site_name" content="Lesekumpel">`,
    `    <meta property="og:locale" content="de_DE">`,
    date ? `    <meta property="article:published_time" content="${e(date)}">` : '',
    `    <meta property="article:author" content="${e(author)}">`,
    `    <meta name="twitter:card" content="summary_large_image">`,
    `    <meta name="twitter:title" content="${e(title)}">`,
    `    <meta name="twitter:description" content="${e(description)}">`,
    `    <meta name="twitter:image" content="${ogImage}">`,
    `    <script type="application/ld+json">`,
    jsonLdSafe.split('\n').map(l => '    ' + l).join('\n'),
    `    </script>`,
  ].filter(Boolean).join('\n');
}

async function processFile(filePath, opts) {
  const html = await readFile(filePath, 'utf-8');
  if (/<meta\s+name=["']description["']/i.test(html) && !opts.force) {
    return { filePath, skipped: 'description already present' };
  }

  const title = getTitle(html);
  if (!title) return { filePath, skipped: 'no <title>' };

  const author = getMeta(html, 'author');
  const date = getMeta(html, 'date');
  const readingLevel = getMeta(html, 'reading-level');
  const neurotype = getMeta(html, 'neurotype');
  const genre = getMeta(html, 'genre');

  // Determine story path relative to site root
  const fileName = basename(filePath);
  const dirName = filePath.replace(/\\/g, '/').split('/').slice(-2, -1)[0];
  const slug = fileName.replace(/\.html$/, '');
  const storyPath = `${dirName}/${fileName}`;

  const excerpt = extractStoryExcerpt(html);
  const seoBlock = buildSeoBlock({ title, date, author, readingLevel, neurotype, genre, slug, storyPath, excerpt });

  // Insert SEO block right after </title>
  const insertion = `\n${seoBlock}\n`;
  const titleCloseRe = /<\/title>/i;
  if (!titleCloseRe.test(html)) return { filePath, skipped: 'no </title>' };

  let newHtml;
  if (opts.force && /<meta\s+name=["']description["']/i.test(html)) {
    // Strip existing SEO block (between </title> and the JSON-LD script close, or first non-SEO marker)
    // Conservative: only strip the lines we previously added (heuristic: stop at </script> following ld+json, or at <style|<link|<meta name="date")
    newHtml = html.replace(
      /(<\/title>)([\s\S]*?)(<style|<link rel="stylesheet"|<meta name="date"|<meta name="charset"|<script(?! type="application\/ld\+json"))/i,
      (_m, p1, _mid, p3) => `${p1}${insertion}    ${p3}`
    );
    if (newHtml === html) newHtml = html.replace(titleCloseRe, `</title>${insertion}`);
  } else {
    newHtml = html.replace(titleCloseRe, `</title>${insertion}`);
  }

  if (newHtml === html) return { filePath, skipped: 'no change produced' };

  if (!opts.dryRun) {
    await writeFile(filePath, newHtml, 'utf-8');
  }
  return { filePath, changed: true, bytesAdded: newHtml.length - html.length, title, author };
}

async function listHtml(dir) {
  const out = [];
  let entries;
  try { entries = await readdir(dir, { withFileTypes: true }); }
  catch { return out; }
  for (const e of entries) {
    if (e.isFile() && e.name.endsWith('.html')) out.push(join(dir, e.name));
  }
  return out;
}

function parseArgs(argv) {
  const opts = { dirs: [], dryRun: false, force: false, all: false };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--dry-run') opts.dryRun = true;
    else if (a === '--force') opts.force = true;
    else if (a === '--all') opts.all = true;
    else if (a === '--dir') opts.dirs.push(argv[++i]);
    else if (a.startsWith('--dir=')) opts.dirs.push(a.slice(6));
    else { console.error(`Unknown arg: ${a}`); process.exit(2); }
  }
  if (opts.all) opts.dirs = ['texte', 'demo-texte', 'comicgeschichten'];
  if (opts.dirs.length === 0) {
    console.error('Usage: node scripts/seo-backfill.mjs --dir <name> [--dry-run] [--force]');
    console.error('   or: node scripts/seo-backfill.mjs --all [--dry-run] [--force]');
    process.exit(2);
  }
  return opts;
}

(async () => {
  const opts = parseArgs(process.argv);
  const summary = { changed: 0, skipped: 0, files: 0, byDir: {} };
  for (const dirName of opts.dirs) {
    const fullDir = join(ROOT, dirName);
    const files = await listHtml(fullDir);
    summary.byDir[dirName] = { changed: 0, skipped: 0, total: files.length };
    for (const f of files) {
      summary.files++;
      const res = await processFile(f, opts);
      if (res.changed) {
        summary.changed++;
        summary.byDir[dirName].changed++;
        if (opts.dryRun) console.log(`[dry] ${dirName}/${basename(f)} | +${res.bytesAdded}B | ${res.author || '?'}`);
      } else {
        summary.skipped++;
        summary.byDir[dirName].skipped++;
        if (process.env.VERBOSE) console.log(`[skip] ${dirName}/${basename(f)} | ${res.skipped}`);
      }
    }
  }
  console.log('\nSummary:');
  for (const [d, s] of Object.entries(summary.byDir)) {
    console.log(`  ${d}: changed=${s.changed} skipped=${s.skipped} total=${s.total}`);
  }
  console.log(`Total: ${summary.changed} changed, ${summary.skipped} skipped, ${summary.files} files`);
  if (opts.dryRun) console.log('(dry-run — no files written)');
})();
