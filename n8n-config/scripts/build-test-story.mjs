// Baut eine lokale Test-Story aus dem Template + den Daten einer echten generierten Story.
// Repliziert die Platzhalter-Ersetzung des n8n-Knotens "HTML assemblieren" so weit,
// dass die Seite lokal in Playwright/Browser geprüft werden kann (Bilder/Fonts via CDN).
// Aufruf: node n8n-config/scripts/build-test-story.mjs <template.html> <story.html> <output.html>

import fs from 'node:fs';

const [templatePath, storyPath, outPath] = process.argv.slice(2);
if (!outPath) { console.error('Usage: build-test-story.mjs <template> <story> <out>'); process.exit(1); }

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

// Restliche Platzhalter (SEO etc.) leeren — wie das Safety-Net in "HTML assemblieren"
template = template.replace(/\{\{[A-Z_]+\}\}/g, '');

// Relative Pfade (Fonts, Logo, Nav) auf die Live-Site umbiegen, damit file:// funktioniert
template = template.replaceAll('"../', '"https://rala84.github.io/lesekumpel/');

fs.writeFileSync(outPath, template);
console.log(`OK: ${outPath} (${(template.length / 1024).toFixed(0)} KB)`);
