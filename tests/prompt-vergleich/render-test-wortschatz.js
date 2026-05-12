// Quick Render: Template -> Test-HTML mit gefuelltem Wortschatz
// Zweck: lokale Verifikation der neuen Wortsammlung-Panel-Logik und
// des "Woerter hoeren"-Bugfixes. Schreibt Output nach OUTPUT_PATH.

const fs = require('fs');
const path = require('path');

const TEMPLATE = path.join(__dirname, '..', '..', 'n8n-config', 'demo-template.html');
const OUTPUT_PATH = path.join(__dirname, 'test-wortschatz-rendered.html');
const OUTPUT_EMPTY_PATH = path.join(__dirname, 'test-wortschatz-empty.html');

const data = {
  title: 'Lilith und das Piraten-Kaenguru',
  date: '2026-05-12',
  personaName: 'Finja Feder',
  personaImg: '../../avatars/finja.webp',
  personaBio: 'Anspruchsvolles Lesen mit reichhaltigem Wortschatz.',
  neurotyp: 'Standard',
  genre: 'Alltag',
  slug: 'test-wortschatz',
  storyText: 'Papas Jacke ist an. Die Schuhe stehen bereit. "Wir fahren in den Freizeitpark!", ruft Lilith und strahlt über das ganze Gesicht.\n\nSie hüpft auf einem Bein zur Tür. Dabei macht sie ein Geräusch wie ein quietschendes Huhn. "Ich bin ein Piraten-Känguru!", kichert sie und wackelt mit den Armen.\n\nPapa lacht. Er findet ihre Aufregung ansteckend. Er nimmt Lilith an die Hand und sagt: "Na los, mein Pirat. Das Abenteuer wartet auf uns."',
  emojiStoryText: '',
  summaryText: 'Lilith freut sich auf den Freizeitpark und tut so, als sei sie ein Piraten-Kaenguru.',
  emojiSummaryText: '',
  quizData: [
    { q: 'Wohin fahren Lilith und Papa?', a: ['Freund', 'Freizeitpark', 'Spaziergang'], correct: 1 }
  ],
  weitererzaehlenData: null,
  schatzsucheData: null,
  wortschatz: [
    { wort: 'bereit', silben: 'be-reit', bedeutung: 'fertig, startklar' },
    { wort: 'strahlt', silben: 'strahlt', bedeutung: 'leuchtet vor Freude' },
    { wort: 'quietschend', silben: 'quiet-schend', bedeutung: 'ein hohes, reibendes Geräusch machend' },
    { wort: 'Aufregung', silben: 'Auf-re-gung', bedeutung: 'ein Gefühl von starker Spannung und Freude' },
    { wort: 'ansteckend', silben: 'an-ste-ckend', bedeutung: 'andere Menschen mitreißen oder beeinflussen' },
    { wort: 'Abenteuer', silben: 'A-ben-teu-er', bedeutung: 'ein aufregendes oder mutiges Erlebnis' }
  ],
  wordCount: 80,
  imageModel: 'test',
  imageCount: 0,
  description: 'Test-Story fuer Wortsammlung-Panel'
};

function htmlEscape(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;').replace(/"/g, '&quot;')
    .replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

let tpl = fs.readFileSync(TEMPLATE, 'utf8');

const personaWords = { pip:'20–50', mia:'50–100', peter:'100–150', stella:'150–250', finja:'250–400' };
const personaAge = { pip:'5–6', mia:'6–7', peter:'7–8', stella:'8–9', finja:'9–10' };
const personaKey = (data.personaName || 'finja').toLowerCase().split(' ')[0];
const words = personaWords[personaKey] || '50–150';
const typicalAge = personaAge[personaKey] || '6–10';
const readingLevelLabel = `${words} Wörter, ${data.personaName || ''}`.trim();

const replacements = {
  STORY_TITLE: htmlEscape(data.title),
  STORY_DATE: data.date,
  PERSONA_NAME: htmlEscape(data.personaName),
  PERSONA_IMG_URL: data.personaImg,
  PERSONA_BIO: htmlEscape(data.personaBio),
  NEUROTYP: htmlEscape(data.neurotyp),
  GENRE: htmlEscape(data.genre),
  STORY_IMAGES_HTML: '',
  HERO_IMAGE_URL: '',
  RAW_STORY_TEXT: JSON.stringify(data.storyText),
  EMOJI_STORY_TEXT: JSON.stringify(data.emojiStoryText),
  RAW_SUMMARY_TEXT: JSON.stringify(data.summaryText),
  EMOJI_SUMMARY_TEXT: JSON.stringify(data.emojiSummaryText),
  QUIZ_DATA_JSON: JSON.stringify(data.quizData),
  WEITERERZAEHLEN_JSON: JSON.stringify(data.weitererzaehlenData),
  SCHATZSUCHE_JSON: JSON.stringify(data.schatzsucheData),
  DICTIONARY_JSON: JSON.stringify(data.wortschatz),
  WORD_COUNT: String(data.wordCount),
  IMAGE_MODEL: data.imageModel,
  SLUG: data.slug,
  RELATED_STORIES_HTML: '',
  READING_LEVEL_LABEL: htmlEscape(readingLevelLabel),
  META_DESCRIPTION: htmlEscape(data.description),
  META_KEYWORDS: 'Test',
  STORY_PATH: 'tests/prompt-vergleich/test-wortschatz-rendered.html',
  TOPIC: htmlEscape(data.description),
  OG_IMAGE_URL: '',
  PERSONA_AVATAR_URL: '',
  TYPICAL_AGE: htmlEscape(typicalAge)
};

for (const [k, v] of Object.entries(replacements)) {
  tpl = tpl.replace(new RegExp(`\\{\\{${k}\\}\\}`, 'g'), v);
}
tpl = tpl.replace(/\{\{[A-Z_]+\}\}/g, '');

fs.writeFileSync(OUTPUT_PATH, tpl, 'utf8');
console.log('Rendered:', OUTPUT_PATH);

// Zweite Variante: leeres wortschatz-Array (Empty-State)
let tpl2 = fs.readFileSync(TEMPLATE, 'utf8');
const replacementsEmpty = { ...replacements, DICTIONARY_JSON: '[]', PERSONA_NAME: 'Pip Punkt' };
for (const [k, v] of Object.entries(replacementsEmpty)) {
  tpl2 = tpl2.replace(new RegExp(`\\{\\{${k}\\}\\}`, 'g'), v);
}
tpl2 = tpl2.replace(/\{\{[A-Z_]+\}\}/g, '');
fs.writeFileSync(OUTPUT_EMPTY_PATH, tpl2, 'utf8');
console.log('Rendered (empty):', OUTPUT_EMPTY_PATH);
