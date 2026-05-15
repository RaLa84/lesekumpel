// Daten aus Quiz parsen + emojiStoryText aus Emoji parsen
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

let template = $input.item.json.data;

// Generate image tags
const imageCount = data.imageCount || 0;
let imagesHtml = '';
for (let i = 1; i <= imageCount; i++) {
  const imgUrl = `https://rala84.github.io/lesekumpel/bilder/${data.slug}-${i}.png`;
  imagesHtml += `<img src="${imgUrl}" alt="${data.title}" class="hero-image" onerror="this.style.display='none'">\n        `;
}

// SEO-Felder lokal berechnen (Daten vorbereiten liefert sie aktuell nicht)
const personaWords = {
  pip: '20–50', mia: '50–100', peter: '100–150', stella: '150–250', finja: '250–400',
  samira: '120–250', holzi: '120–250', deniz: '150–300', jonas: '100–200'
};
const personaAge = {
  pip: '5–6', mia: '6–7', peter: '7–8', stella: '8–9', finja: '9–10',
  samira: '7–10', holzi: '8–10', deniz: '7–10', jonas: '7–10'
};
const personaKey = (data.persona || 'peter').toString().toLowerCase();
const words = personaWords[personaKey] || '50–150';
const typicalAge = personaAge[personaKey] || '6–10';
const readingLevelLabel = `${words} Wörter, ${data.personaName || ''}`.trim();

const isSkill = data.personaType === 'skill';
const neuroBadge = (isSkill && data.neurotyp && data.neurotyp !== 'Standard') ? ` (${data.neurotyp}-optimiert)` : '';
const descRaw = `Lesetext für ${typicalAge}-Jährige${neuroBadge}: ${data.title || ''}. ${data.description || ''}`.trim();
const metaDescription = descRaw.length > 157 ? descRaw.substring(0, 157).trimEnd() + '…' : descRaw;
const metaKeywords = [data.personaName, data.neurotyp, data.genre, 'Lesetext', 'Lesen lernen', `Kinder ${typicalAge}`]
  .filter(v => v && v !== 'Standard').join(', ');
const topic = data.description ? data.description.toString().substring(0, 60).trim() : '';
const storyPath = `demo-texte/${data.slug}.html`;
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
  .replace(/\{\{NEUROTYP\}\}/g, htmlEscape(data.neurotyp))
  .replace(/\{\{GENRE\}\}/g, htmlEscape(data.genre))
  .replace(/\{\{STORY_IMAGES_HTML\}\}/g, imagesHtml.trim())
  .replace(/\{\{HERO_IMAGE_URL\}\}/g, `https://rala84.github.io/lesekumpel/bilder/${data.slug}-1.png`)
  .replace(/\{\{RAW_STORY_TEXT\}\}/g, JSON.stringify(data.storyText || ''))
  .replace(/\{\{EMOJI_STORY_TEXT\}\}/g, JSON.stringify(data.emojiStoryText || ''))
  .replace(/\{\{RAW_SUMMARY_TEXT\}\}/g, JSON.stringify(data.summaryText || ''))
  .replace(/\{\{EMOJI_SUMMARY_TEXT\}\}/g, JSON.stringify(data.emojiSummaryText || ''))
  .replace(/\{\{QUIZ_DATA_JSON\}\}/g, JSON.stringify(data.quizData || []))
  .replace(/\{\{WEITERERZAEHLEN_JSON\}\}/g, JSON.stringify(data.weitererzaehlenData || null))
  .replace(/\{\{SCHATZSUCHE_JSON\}\}/g, JSON.stringify(data.schatzsucheData || null))
  .replace(/\{\{DICTIONARY_JSON\}\}/g, JSON.stringify(data.wortschatz || []))
  .replace(/\{\{IMAGE_POSITIONS_JSON\}\}/g, JSON.stringify(data.imagePositions || []))
  .replace(/\{\{WORD_COUNT\}\}/g, String(data.wordCount || 0))
  .replace(/\{\{IMAGE_MODEL\}\}/g, data.imageModel || '')
  .replace(/\{\{SLUG\}\}/g, data.slug || '')
  .replace(/\{\{RELATED_STORIES_HTML\}\}/g, '')
  // SEO/Meta-Platzhalter (vorher unersetzt — Workflow-Leak-Bug)
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
  console.warn('HTML assemblieren: unresolved placeholders ->', unique.join(', '));
  template = template.replace(/\{\{[A-Z_]+\}\}/g, '');
}

const htmlBase64 = Buffer.from(template, 'utf8').toString('base64');
const storyUrl = `https://rala84.github.io/lesekumpel/demo-texte/${data.slug}.html`;

return { json: { ...data, htmlBase64, filePath: `demo-texte/${data.slug}.html`, commitMessage: `Demo-Text: ${data.title} — ${data.personaName} ${data.neurotyp || ''}`.trim(), storyUrl } };
