// Baut eine Story aus dem Template + den Daten einer echten generierten Story.
// Repliziert die Platzhalter-Ersetzung des n8n-Knotens "HTML assemblieren".
//
// Zwei Modi:
//   Standard:  Vorschau-Build — relative Pfade werden auf die Live-Site umgebogen,
//              damit die Datei lokal via file://-Nachbar-Server funktioniert.
//   --real:    Regeneriert eine ECHTE Story in demo-texte/ — relative Pfade bleiben,
//              SEO-Metadaten (description, keywords, reading-level, …) werden aus
//              der alten Story übernommen.
//
// Aufruf: node n8n-config/scripts/build-test-story.mjs [--real] [--dir <ordner>] <template.html> <story.html> <output.html>
//   --dir: Story-Verzeichnis für STORY_PATH im --real-Modus (Default: demo-texte;
//          für Sachtext-Backfill: --dir sachtexte)

import fs from 'node:fs';

const args = process.argv.slice(2);
const REAL = args.includes('--real');
let DIR = 'demo-texte';
const dirIdx = args.indexOf('--dir');
if (dirIdx !== -1) { DIR = args[dirIdx + 1]; args.splice(dirIdx, 2); }
const [templatePath, storyPath, outPath] = args.filter(a => a !== '--real');
if (!outPath) { console.error('Usage: build-test-story.mjs [--real] [--dir <ordner>] <template> <story> <out>'); process.exit(1); }

let template = fs.readFileSync(templatePath, 'utf8');
const story = fs.readFileSync(storyPath, 'utf8');

// JS-Injektionen aus der Story extrahieren (jeweils 1 Zeile im Story-HTML)
const jsVars = {
  RAW_STORY_TEXT: /let rawStory = (.+);/,
  EMOJI_STORY_TEXT: /let emojiStory = (.+);/,
  RAW_SUMMARY_TEXT: /let rawSummary = (.+);/,
  EMOJI_SUMMARY_TEXT: /let emojiSummary = (.+);/,
  QUIZ_DATA_JSON: /const quizData = (.+);/,
  DICTIONARY_JSON: /const rawDictionaryEntry = (.+);/,
  WEITERERZAEHLEN_JSON: /const weitererzaehlenData = (.+);/,
  SCHATZSUCHE_JSON: /const schatzsucheData = (.+);/,
  IMAGE_POSITIONS_JSON: /const imagePositions = (.+);/,
  SACHTEXT_BLOCKS_JSON: /const sachtextBlocks = (.+);/, // nur in Sachtexten vorhanden (sonst WARN, unschädlich)
};
for (const [ph, re] of Object.entries(jsVars)) {
  const m = story.match(re);
  if (!m) { console.error(`WARN: ${ph} nicht in Story gefunden`); continue; }
  template = template.replaceAll(`{{${ph}}}`, () => m[1]);
}

// Sichtbare/Meta-Werte
const grab = (re, fallback = '') => (story.match(re) || [])[1] || fallback;
const visual = {
  STORY_TITLE: grab(/<h1 id="main-title">([\s\S]*?)<\/h1>/).trim() || 'Test-Story',
  HERO_IMAGE_URL: grab(/class="hero-bg" src="([^"]+)"/),
  PERSONA_NAME: grab(/<meta name="author" content="([^"]*)"/),
  PERSONA_IMG_URL: grab(/class="author-avatar"[^>]*src="([^"]+)"/) || grab(/src="([^"]+)" alt="[^"]*" class="author-avatar"/),
  PERSONA_BIO: grab(/<p style="margin:5px 0 0 0; font-size:0\.9rem;">([\s\S]*?)<\/p>/).trim(),
  NEUROTYP: grab(/<meta name="neurotype" content="([^"]*)"/),
  GENRE: grab(/<meta name="genre" content="([^"]*)"/),
  STORY_DATE: grab(/<meta name="date" content="([^"]*)"/),
  SLUG: (grab(/rel="canonical" href="[^"]*\/([^"\/]+)\.html"/) || 'test-story'),
};
for (const [ph, val] of Object.entries(visual)) {
  template = template.replaceAll(`{{${ph}}}`, () => val);
}

// Story-Bilder (hero-image-Tags) 1:1 übernehmen
const imgs = story.match(/<img [^>]*class="hero-image"[^>]*>/g) || [];
template = template.replaceAll('{{STORY_IMAGES_HTML}}', () => imgs.join('\n        '));

// --real: SEO-/Meta-Platzhalter aus der alten Story übernehmen statt zu leeren
if (REAL) {
  const ogImage = grab(/<meta property="og:image" content="([^"]*)"/);
  const extra = {
    READING_LEVEL_LABEL: grab(/<meta name="reading-level" content="([^"]*)"/),
    META_DESCRIPTION: grab(/<meta name="description" content="([^"]*)"/),
    META_KEYWORDS: grab(/<meta name="keywords" content="([^"]*)"/),
    TOPIC: grab(/<meta name="topic" content="([^"]*)"/),
    IMAGE_MODEL: grab(/<meta name="image-model" content="([^"]*)"/),
    OG_IMAGE_URL: ogImage,
    PERSONA_AVATAR_URL: ogImage,
    STORY_PATH: DIR + '/' + visual.SLUG + '.html',
    TYPICAL_AGE: grab(/Kinder ([0-9–\-]+) Jahre/),
  };
  try {
    const raw = JSON.parse(story.match(/let rawStory = (.+);/)[1]);
    extra.WORD_COUNT = String(raw.replace(/­/g, '').split(/\s+/).filter(Boolean).length);
  } catch (e) { extra.WORD_COUNT = '0'; }
  for (const [ph, val] of Object.entries(extra)) {
    template = template.replaceAll(`{{${ph}}}`, () => val);
  }
}

// Restliche Platzhalter leeren — wie das Safety-Net in "HTML assemblieren"
template = template.replace(/\{\{[A-Z_]+\}\}/g, '');

// Nur im Vorschau-Modus: relative Pfade auf die Live-Site umbiegen
if (!REAL) {
  template = template.replaceAll('"../', '"https://rala84.github.io/lesekumpel/');
}

fs.writeFileSync(outPath, template);
console.log(`OK: ${outPath} (${(template.length / 1024).toFixed(0)} KB)`);
