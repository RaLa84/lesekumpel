// Knoten: "HTML assemblieren" — Sachtext-Workflow (Samira), v1
// Abgeleitet aus assemble-html-v2.js: Zielverzeichnis sachtexte/, zusätzlicher
// Platzhalter {{SACHTEXT_BLOCKS_JSON}} (Kästen), SEO aus Textlaenge statt Persona-Map.
// Erwartet das Sachtext-Template demo-template-sachtext.html — bricht sonst hart ab,
// damit das Residual-Safety-Net den Kästen-Platzhalter nicht still zu '' stript.
const quizData = $('Schatz parsen').first().json;
const emojiData = $('Emoji parsen').first().json;
const summaryEmojiData = $('Summary-Emoji parsen').first()?.json || {};
const data = {
  ...quizData,
  emojiStoryText: emojiData.emojiStoryText || quizData.storyText || '',
  emojiSummaryText: summaryEmojiData.emojiSummaryText || quizData.summaryText || ''
};
// Image-Modell aus Probe-Auswertung (Scout-Pattern): gpt-image-2 oder gemini-2.5-flash-image
data.imageModel = ($('Probe auswerten').first()?.json?.imageModel) || 'unknown';

// DEFENSIV: nur Szenen referenzieren, deren Bild TATSAECHLICH hochgeladen wurde.
// Sonst entstehen leere Platzhalter, wenn einzelne Bildgenerierungen scheitern
// (z.B. leere gpt-image-2-Antwort).
// WICHTIG: $('GitHub: Bild hochladen').all() liefert im SplitInBatches-Loop nur die
// LETZTE Iteration. Stattdessen den done-Output von 'Bild-Loop' nehmen — der enthaelt
// alle durchlaufenen Szenen-Items; erfolgreich hochgeladene tragen content.path.
let uploadedScenes = new Set();
try {
  for (const it of $('Bild-Loop').all()) {
    const m = String(it.json?.content?.path || '').match(/-(\d+)\.png$/);
    if (m) uploadedScenes.add(parseInt(m[1], 10));
  }
} catch (e) { uploadedScenes = new Set(); }
const presentScenes = [...uploadedScenes].sort((a, b) => a - b);

// Bild-zu-Absatz-Mapping aus Szenen parsen (paragraphIndex je scene) — auf real
// hochgeladene Szenen gefiltert.
let imagePositions = [];
try {
  const sceneItems = $('Szenen parsen').all();
  imagePositions = sceneItems.map(it => ({
    scene: it.json.sceneIndex,
    paragraphIndex: typeof it.json.paragraphIndex === 'number' ? it.json.paragraphIndex : null
  })).filter(p => typeof p.scene === 'number' && uploadedScenes.has(p.scene));
} catch (e) { imagePositions = []; }
data.imagePositions = imagePositions;

let template = $input.item.json.data;

// Sanity: das Sachtext-Template MUSS den Kästen-Platzhalter enthalten. Fehlt er,
// wurde das falsche Template geladen (z.B. demo-template.html) — hart abbrechen.
if (!template.includes('{{SACHTEXT_BLOCKS_JSON}}')) {
  throw new Error('Falsches Template geladen: {{SACHTEXT_BLOCKS_JSON}} fehlt — erwartet wird demo-template-sachtext.html');
}

// Generate image tags — nur fuer real hochgeladene Szenen (echte Szenen-Nummern,
// Luecken wie -1,-2,-4 bleiben korrekt erhalten).
let imagesHtml = '';
for (const i of presentScenes) {
  const imgUrl = `https://rala84.github.io/lesekumpel/bilder/${data.slug}-${i}.png`;
  imagesHtml += `<img src="${imgUrl}" alt="${data.title}" class="hero-image" onerror="this.style.display='none'">\n        `;
}

// SEO-Felder aus der Textlaenge (kein Persona-/Neurotyp-Mapping im Sachtext-Workflow)
const laengenWords = { 'Kurz': '80–150', 'Mittel': '150–250', 'Lang': '250–400' };
const words = data.woerter || laengenWords[data.textlaenge] || '150–250';
const typicalAge = '7–10';
const readingLevelLabel = `${words} Wörter, ${data.personaName || 'Samira Wissensfreund'}`.trim();

const descRaw = `Sachtext für ${typicalAge}-Jährige: ${data.title || ''}. ${data.description || ''}`.trim();
const metaDescription = descRaw.length > 157 ? descRaw.substring(0, 157).trimEnd() + '…' : descRaw;
const metaKeywords = [data.personaName, 'Sachtext', 'Wissen für Kinder', 'Lesetext', 'Lesen lernen', `Kinder ${typicalAge}`]
  .filter(Boolean).join(', ');
const topic = data.description ? data.description.toString().substring(0, 60).trim() : '';
const storyPath = `sachtexte/${data.slug}.html`;
const ogImageUrl = data.personaImg || '';

// HTML-Escape für Attribut-Kontexte (Titel/Beschreibung können Quotes enthalten)
function htmlEscape(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;').replace(/"/g, '&quot;')
    .replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

template = template
  .replace(/\{\{STORY_TITLE\}\}/g, htmlEscape(data.title))
  .replace(/\{\{STORY_DATE\}\}/g, data.date || '')
  .replace(/\{\{PERSONA_NAME\}\}/g, htmlEscape(data.personaName))
  .replace(/\{\{PERSONA_IMG_URL\}\}/g, data.personaImg || '')
  .replace(/\{\{PERSONA_BIO\}\}/g, htmlEscape(data.personaBio))
  .replace(/\{\{NEUROTYP\}\}/g, htmlEscape(data.neurotyp || 'Standard'))
  .replace(/\{\{GENRE\}\}/g, htmlEscape(data.genre))
  .replace(/\{\{STORY_IMAGES_HTML\}\}/g, imagesHtml.trim())
  .replace(/\{\{HERO_IMAGE_URL\}\}/g, `https://rala84.github.io/lesekumpel/bilder/${data.slug}-${presentScenes[0] || 1}.png`)
  .replace(/\{\{RAW_STORY_TEXT\}\}/g, JSON.stringify(data.storyText || ''))
  .replace(/\{\{EMOJI_STORY_TEXT\}\}/g, JSON.stringify(data.emojiStoryText || ''))
  .replace(/\{\{RAW_SUMMARY_TEXT\}\}/g, JSON.stringify(data.summaryText || ''))
  .replace(/\{\{EMOJI_SUMMARY_TEXT\}\}/g, JSON.stringify(data.emojiSummaryText || ''))
  .replace(/\{\{QUIZ_DATA_JSON\}\}/g, JSON.stringify(data.quizData || []))
  // Weiterdenken ergibt bei Sachtexten keinen Sinn (kein Erzähl-Weiterspinnen) -> immer null,
  // damit das Template den Tab gar nicht erst anbietet (zusätzlich per CSS versteckt)
  .replace(/\{\{WEITERERZAEHLEN_JSON\}\}/g, 'null')
  .replace(/\{\{SCHATZSUCHE_JSON\}\}/g, JSON.stringify(data.schatzsucheData || null))
  .replace(/\{\{DICTIONARY_JSON\}\}/g, JSON.stringify(data.wortschatz || []))
  .replace(/\{\{IMAGE_POSITIONS_JSON\}\}/g, JSON.stringify(data.imagePositions || []))
  .replace(/\{\{SACHTEXT_BLOCKS_JSON\}\}/g, JSON.stringify(data.sachtextBlocks || { wusstestDu: [], checkliste: null, quellen: [] }))
  .replace(/\{\{WORD_COUNT\}\}/g, String(data.wordCount || 0))
  .replace(/\{\{IMAGE_MODEL\}\}/g, data.imageModel || '')
  .replace(/\{\{SLUG\}\}/g, data.slug || '')
  .replace(/\{\{RELATED_STORIES_HTML\}\}/g, '')
  // SEO/Meta-Platzhalter
  .replace(/\{\{READING_LEVEL_LABEL\}\}/g, htmlEscape(readingLevelLabel))
  .replace(/\{\{META_DESCRIPTION\}\}/g, htmlEscape(metaDescription))
  .replace(/\{\{META_KEYWORDS\}\}/g, htmlEscape(metaKeywords))
  .replace(/\{\{STORY_PATH\}\}/g, storyPath)
  .replace(/\{\{TOPIC\}\}/g, htmlEscape(topic))
  .replace(/\{\{OG_IMAGE_URL\}\}/g, ogImageUrl)
  .replace(/\{\{PERSONA_AVATAR_URL\}\}/g, ogImageUrl)
  .replace(/\{\{TYPICAL_AGE\}\}/g, htmlEscape(typicalAge));

// Safety-Net: verbliebene Platzhalter loggen und auf '' stripen
const residuals = template.match(/\{\{[A-Z_]+\}\}/g);
if (residuals) {
  const unique = [...new Set(residuals)];
  console.warn('HTML assemblieren (Sachtext): unresolved placeholders ->', unique.join(', '));
  template = template.replace(/\{\{[A-Z_]+\}\}/g, '');
}

const htmlBase64 = Buffer.from(template, 'utf8').toString('base64');
const storyUrl = `https://rala84.github.io/lesekumpel/sachtexte/${data.slug}.html`;

return { json: { ...data, htmlBase64, filePath: `sachtexte/${data.slug}.html`, commitMessage: `Sachtext: ${data.title} — ${data.personaName} (${data.textlaenge || 'Mittel'})`.trim(), storyUrl } };
