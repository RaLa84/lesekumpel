// Knoten: "Daten vorbereiten" — v5 (2026-07-05)
// v4 + optionales Webhook-Feld "Hauptfigur" (Avatar als Hauptfigur, nur Skill-Personas):
// baut den deutschen HAUPTFIGUR-Block für den Text-Prompt und avatarCharacter
// (Story-Elements-Slot-Schema) für den deterministischen VISUAL-LOCK-Override
// in "Elemente parsen". Ohne Hauptfigur-Feld ist das Verhalten identisch zu v4.
// Webhook input is now read explicitly because 📝 Titel korrigieren sits between Webhook and this node
const webhookInput = $('Webhook: Geschichte anfordern').first().json;
const input = webhookInput.body || webhookInput;
// Corrected title from 📝 Titel korrigieren chainLlm (with quote-strip + fallback)
const correctedTitle = ($input.item.json.text || '').trim().replace(/^["']|["']$/g, '');
const title = correctedTitle || (input['Titel'] || '').trim();
const personaRaw = (input['Persona'] || 'Peter Past').trim();
const persona = personaRaw.split(' ')[0].toLowerCase();
const neurotyp = (input['Neurotyp'] || 'Standard').trim();
const bildstilRaw = (input['Bildstil'] || 'Aquarell').trim();
const bildstilKey = bildstilRaw.split(' ')[0];
const description = (input['Kurzbeschreibung'] || '').trim();

// Hauptfigur (Avatar) — optional, nur für Skill-Personas (Guardrail hat Format/Safety geprüft)
const SKILL_IDS = ['pip', 'mia', 'peter', 'stella', 'finja'];
const hauptfigurRaw = input['Hauptfigur'] || null;
let hauptfigur = null;
if (hauptfigurRaw && typeof hauptfigurRaw === 'object' && !Array.isArray(hauptfigurRaw) && SKILL_IDS.includes(persona)) {
  const hfName = String(hauptfigurRaw.name || '').trim().slice(0, 40);
  if (hfName) {
    hauptfigur = {
      name: hfName,
      typ: hauptfigurRaw.typ === 'fantasie' ? 'fantasie' : 'mensch',
      alter: (typeof hauptfigurRaw.alter === 'number' && hauptfigurRaw.alter >= 5 && hauptfigurRaw.alter <= 12) ? hauptfigurRaw.alter : null,
      merkmale: (hauptfigurRaw.merkmale && typeof hauptfigurRaw.merkmale === 'object') ? hauptfigurRaw.merkmale : {}
    };
  }
}

// Slug — deterministic content-hash (idempotent: same inputs -> same slug, prevents duplicates from caller-retry)
const umlautMap = { 'ä': 'ae', 'ö': 'oe', 'ü': 'ue', 'ß': 'ss', 'Ä': 'ae', 'Ö': 'oe', 'Ü': 'ue' };
const slugBase = (title.toLowerCase()
  .replace(/[äöüßÄÖÜ]/g, c => umlautMap[c] || c)
  .replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '').replace(/-+/g, '-')
  .substring(0, 55) || 'neue-geschichte');
// Avatar fließt in den Slug-Hash ein — sonst dedupen unterschiedliche Avatare auf denselben Slug
const avatarKey = hauptfigur
  ? '|HF:' + [hauptfigur.name, hauptfigur.typ]
      .concat(Object.keys(hauptfigur.merkmale).sort().map(k => k + ':' + hauptfigur.merkmale[k]))
      .join(',')
  : '';
const slugInput = title + '|' + persona + '|' + neurotyp + '|' + bildstilKey + '|' + description + avatarKey;
let _h = 5381;
for (let i = 0; i < slugInput.length; i++) { _h = ((_h * 33) ^ slugInput.charCodeAt(i)) | 0; }
const slugSuffix = ((_h >>> 0).toString(36) + '0000').substring(0, 4);
const slug = slugBase + '-' + slugSuffix;

// ═══════════════════════════════════════════════════════════════
// PERSONA-META — Skill-Personas + Bonus-Personas
// ═══════════════════════════════════════════════════════════════

const personaMeta = {
  // ── Skill-Personas (mit Neurotyp-Varianten im Systemprompt) ──
  pip: {
    name: 'Pip Punkt', typ: 'skill', woerter: '20–50', tempus: 'Präsens',
    imgUrl: 'https://rala84.github.io/lesekumpel/avatars/pip-punkt.webp',
    bio: 'Pip macht jeden Satz kurz und klar. Punkt. Fertig. Bei Pip kannst du jedes Wort lesen — und bist stolz darauf!'
  },
  mia: {
    name: 'Mia Mitte', typ: 'skill', woerter: '50–100', tempus: 'Präsens',
    imgUrl: 'https://rala84.github.io/lesekumpel/avatars/mia-mitte.webp',
    bio: 'Mia erzählt richtige Geschichten — mit Anfang, Mitte und Ende. Bei ihr fühlst du dich schon wie ein echter Leser!'
  },
  peter: {
    name: 'Peter Past', typ: 'skill', woerter: '100–150', tempus: 'Durchgehend Präteritum (Vergangenheit)',
    imgUrl: 'https://rala84.github.io/lesekumpel/avatars/peter-past.webp',
    bio: 'Peter erzählt spannende Geschichten aus der Vergangenheit. Bei ihm lernst du, wie echte Erzählungen klingen.'
  },
  stella: {
    name: 'Stella Stimmenreich', typ: 'skill', woerter: '150–250', tempus: 'Frei wählbar',
    imgUrl: 'https://rala84.github.io/lesekumpel/avatars/stella-stimmenreich.webp',
    bio: 'Stella gibt jeder Figur eine eigene Stimme. Bei ihr reden die Charaktere — laut, leise, lustig und ernst.'
  },
  finja: {
    name: 'Finja Feder', typ: 'skill', woerter: '250–400', tempus: 'Frei wählbar',
    imgUrl: 'https://rala84.github.io/lesekumpel/avatars/finja-feder.webp',
    bio: 'Finja schreibt wie eine echte Autorin. Bei ihr liest du Geschichten, die dich zum Nachdenken bringen.'
  },
  // ── Bonus-Personas (fixer Stil, kein Neurotyp-Parameter) ──
  samira: {
    name: 'Samira Wissensfreund', typ: 'bonus', woerter: '120–250',
    bonus: true,
    imgUrl: 'https://rala84.github.io/lesekumpel/avatars/samira-wissensfreund.webp',
    bio: 'Samira liebt es, spannende Fakten zu entdecken und sie so zu erzählen, dass du staunst!'
  },
  holzi: {
    name: 'Holzi Pixelkopf', typ: 'bonus', woerter: '120–250',
    bonus: true,
    imgUrl: 'https://rala84.github.io/lesekumpel/avatars/holzi-pixelkopf.webp',
    bio: 'Holzi ist der sympathische Chaot, der Gaming-Geschichten erzählt mit maximaler Action und minimaler Planung.'
  },
  deniz: {
    name: 'Deniz Traumfänger', typ: 'bonus', woerter: '150–300',
    bonus: true,
    imgUrl: 'https://rala84.github.io/lesekumpel/avatars/deniz-traumfaenger.webp',
    bio: 'Deniz nimmt dich mit in magische Welten voller Atmosphäre und Gefühle.'
  },
  jonas: {
    name: 'Jonas Entdecker', typ: 'bonus', woerter: '100–200',
    bonus: true,
    imgUrl: 'https://rala84.github.io/lesekumpel/avatars/jonas-entdecker.webp',
    bio: 'Jonas erzählt Alltagsabenteuer aus der Ich-Perspektive — ehrlich, lustig und immer zum Mitfühlen.'
  }
};

const bildstilMap = {
  'Aquarell': {
    positive: "traditional children's book watercolor illustration, hand-painted with warm cream paper texture filling the entire image, soft pastel palette, gentle wet-on-wet washes with visible bleeding edges, loose expressive brush strokes, soft painterly rendering, inspired by Beatrix Potter and Quentin Blake, consistent palette and brush handling across all panels of this story, same character proportions and facial features in every panel, full bleed composition extending to all four image edges, no inner framing, subjects and background reach every corner of the image, square 1:1 aspect ratio",
    negative: "no text, no watermarks, no labels, no tags, no annotations, no nameplates, no UI overlays, no callouts, no captions, no speech bubbles, no sign text, no alphanumeric text in image, no letterboxing, no black bars, no white margin, no cream margin, no paper border, no inner matte, no mat board, no illustration frame, no vignette, no aspect-ratio padding, no hard black outlines, no digital vector look, no CGI, no 3D shading, no photorealism, no extra limbs, no duplicate props, no floating objects, no mixed art styles, no style drift"
  },
  'Cartoon': {
    positive: "modern children's cartoon illustration inspired by Bluey and Peppa Pig, bold black outlines of uniform stroke width, bright saturated flat colors with one soft tonal shadow per shape, simple rounded geometric shapes, playful expressions, consistent outline weight and palette across all panels of this story, same character proportions and facial features in every panel, full bleed composition extending to all four image edges, no inner framing, subjects and background reach every corner of the image, square 1:1 aspect ratio",
    negative: "no text, no watermarks, no labels, no tags, no annotations, no nameplates, no UI overlays, no callouts, no captions, no speech bubbles, no sign text, no alphanumeric text in image, no letterboxing, no black bars, no white margin, no cream margin, no paper border, no inner matte, no mat board, no illustration frame, no vignette, no aspect-ratio padding, no extra limbs, no duplicate props, no floating objects, no mixed art styles, no style drift, no gritty textures, no realistic shading, no photorealism"
  },
  'Buntstift': {
    positive: "colored pencil drawing with warm cream paper texture filling the entire image, visible pencil grain and diagonal hatching strokes, soft muted earthy palette, slightly sketchy outlines, hand-drawn children's illustration feel, consistent stroke density and palette across all panels of this story, same character proportions and facial features in every panel, full bleed composition extending to all four image edges, no inner framing, subjects and background reach every corner of the image, square 1:1 aspect ratio",
    negative: "no text, no watermarks, no labels, no tags, no annotations, no nameplates, no UI overlays, no callouts, no captions, no speech bubbles, no sign text, no alphanumeric text in image, no letterboxing, no black bars, no white margin, no cream margin, no paper border, no inner matte, no mat board, no illustration frame, no vignette, no aspect-ratio padding, no crayon texture, no digital smooth gradients, no vector look, no photorealism, no extra limbs, no duplicate props, no floating objects, no mixed art styles, no style drift"
  },
  'Pixel-Art': {
    positive: "modern 32-bit style pixel art in the aesthetic of Game Boy Advance JRPGs such as Advance Wars and Fire Emblem, detailed character sprites with clearly defined dark outlines, rich but limited 32-color palette with subtle dithering for shading, uniform pixel density across the entire image, consistent sprite resolution and palette across all panels of this story, same character sprite silhouette and facial features in every panel, 3/4 front view or side view composition, full bleed composition extending to all four image edges, no inner framing, subjects and background reach every corner of the image, square 1:1 aspect ratio",
    negative: "no text, no watermarks, no labels, no tags, no annotations, no nameplates, no UI overlays, no callouts, no captions, no speech bubbles, no sign text, no alphanumeric text in image, no letterboxing, no black bars, no white margin, no cream margin, no paper border, no inner matte, no mat board, no illustration frame, no vignette, no aspect-ratio padding, no mixed pixel resolutions between regions, no smooth gradients, no anti-aliasing, no blurry edges, no 3D shading, no photorealism, no high-res rendering, no extra limbs, no duplicate props, no floating objects, no style drift"
  },
  'Anime': {
    positive: "anime-style children's illustration inspired by Studio Ghibli and modern Pokémon anime, cel-shaded with one soft shadow layer, bright vibrant saturated colors, clean uniform line art with tapered ends, expressive large eyes with highlights, soft blushed cheeks, consistent line weight and palette across all panels of this story, same character proportions and facial features in every panel, full bleed composition extending to all four image edges, no inner framing, subjects and background reach every corner of the image, square 1:1 aspect ratio",
    negative: "no text, no watermarks, no labels, no tags, no annotations, no nameplates, no UI overlays, no callouts, no captions, no speech bubbles, no sign text, no alphanumeric text in image, no letterboxing, no black bars, no white margin, no cream margin, no paper border, no inner matte, no mat board, no illustration frame, no vignette, no aspect-ratio padding, no extra limbs, no duplicate props, no floating objects, no mixed art styles, no style drift, no gritty shading, no sketchy outlines, no photorealism"
  },
  'Traumwelt': {
    positive: "dreamlike magical digital painting, soft glowing volumetric light, ethereal misty atmosphere, luminous pastel palette with high contrast highlights, rim lighting on characters, inspired by Ori and the Blind Forest and Studio Ghibli night scenes, consistent luminosity and palette across all panels of this story, same character proportions and facial features in every panel, full bleed composition extending to all four image edges, no inner framing, subjects and background reach every corner of the image, square 1:1 aspect ratio",
    negative: "no text, no watermarks, no labels, no tags, no annotations, no nameplates, no UI overlays, no callouts, no captions, no speech bubbles, no sign text, no alphanumeric text in image, no letterboxing, no black bars, no white margin, no cream margin, no paper border, no inner matte, no mat board, no illustration frame, no vignette, no aspect-ratio padding, no harsh black outlines, no flat cartoon shading, no photorealism, no gritty realism, no extra limbs, no duplicate props, no floating objects, no mixed art styles, no style drift"
  },
  'Knete': {
    positive: "claymation stop-motion photograph style inspired by Aardman Animations (Wallace and Gromit, Shaun the Sheep), 3D plasticine figures with visible fingerprints and clay thumbprint texture, slightly uneven handmade surfaces, warm three-point studio lighting casting soft shadows, consistent clay palette and lighting across all panels of this story, same character proportions and facial features in every panel, full bleed composition extending to all four image edges, no inner framing, subjects and background reach every corner of the image, square 1:1 aspect ratio",
    negative: "no text, no watermarks, no labels, no tags, no annotations, no nameplates, no UI overlays, no callouts, no captions, no speech bubbles, no sign text, no alphanumeric text in image, no letterboxing, no black bars, no white margin, no cream margin, no paper border, no inner matte, no mat board, no illustration frame, no vignette, no aspect-ratio padding, no 2D flat shading, no painted illustration look, no CGI plastic sheen, no photorealism, no extra limbs, no duplicate props, no floating objects, no mixed art styles, no style drift"
  },
  'Voxel': {
    positive: "low-poly voxel art illustration in the aesthetic of Crossy Road and Minecraft, 3D cube-based geometry with uniform voxel size, limited 16-color-per-character palette, consistent isometric 3/4 camera angle, soft ambient shading with a single directional light, consistent voxel size and palette across all panels of this story, same character voxel silhouette and facial features in every panel, full bleed composition extending to all four image edges, no inner framing, subjects and background reach every corner of the image, square 1:1 aspect ratio",
    negative: "no text, no watermarks, no labels, no tags, no annotations, no nameplates, no UI overlays, no callouts, no captions, no speech bubbles, no sign text, no alphanumeric text in image, no letterboxing, no black bars, no white margin, no cream margin, no paper border, no inner matte, no mat board, no illustration frame, no vignette, no aspect-ratio padding, no smooth curved surfaces, no anti-aliasing, no photorealism, no detailed textures on voxels, no extra limbs, no duplicate props, no floating objects, no mixed art styles, no style drift"
  }
};

// ═══════════════════════════════════════════════════════════════
// AVATAR-HAUPTFIGUR — Mapping deutsche Enum-Ids → Bild-Deskriptoren
// Einzige Quelle der Übersetzung (Frontend sendet nur Ids, avatar-svg.js).
// WICHTIG: Alle Phrasen rein visuell halten — keine Verben aus BEHAVIOR_RE
// ("Elemente parsen" filterVisualOnlyDF), sonst fliegen sie aus dem VISUAL LOCK.
// ═══════════════════════════════════════════════════════════════

const AVATAR_VISUALS = {
  hautton: { hell: 'fair', mittel: 'light medium', tan: 'tan', dunkel: 'brown', 'sehr-dunkel': 'deep brown' },
  frisur: {
    kurz:         { style: 'short neat hair', length: 'short' },
    'glatt-lang': { style: 'straight hair', length: 'long' },
    bob:          { style: 'bob cut', length: 'chin-length' },
    locken:       { style: 'curly hair', length: 'medium-length' },
    zoepfe:       { style: 'two braided pigtails with small yellow hair ties', length: 'medium-length' },
    afro:         { style: 'round afro', length: 'short' }
  },
  haarfarbe: { blond: 'blond', hellbraun: 'light brown', dunkelbraun: 'dark brown', schwarz: 'black', rot: 'copper red' },
  brille: { rund: 'round glasses with a thin dark frame', eckig: 'rectangular glasses with a thin dark frame' },
  hoergeraet: { ja: 'a small sky-blue hearing aid behind the left ear' },
  oberteil: { rot: 'red t-shirt', blau: 'blue t-shirt', gruen: 'green t-shirt', gelb: 'bright yellow t-shirt', lila: 'purple t-shirt', orange: 'orange t-shirt' },
  accessoire: {
    muetze: 'a red knitted beanie with a small white pompom',
    cap: 'a blue baseball cap',
    schleife: 'a pink hair bow',
    kopfhoerer: 'yellow over-ear headphones worn around the neck'
  },
  wesen: { drache: 'dragon', roboter: 'robot', fuchs: 'fox', fee: 'fairy', einhorn: 'unicorn' },
  farbe: { rot: 'warm red', blau: 'sky blue', gruen: 'fresh green', lila: 'purple', tuerkis: 'bright turquoise', rosa: 'soft pink', orange: 'warm orange' },
  merkmal: {
    fluegel: 'small rounded wings folded on the back',
    antenne: 'a single antenna with a glowing round tip on top of the head',
    krone: 'a tiny golden crown',
    sterne: 'star-shaped lighter markings on the body'
  }
};

const AVATAR_LABELS_DE = {
  frisur: { kurz: 'kurz geschnitten', 'glatt-lang': 'lang und glatt', bob: 'als Bob geschnitten', locken: 'lockig', zoepfe: 'zu zwei Zöpfen geflochten', afro: 'als Afro' },
  haarfarbe: { blond: 'blonden', hellbraun: 'hellbraunen', dunkelbraun: 'dunkelbraunen', schwarz: 'schwarzen', rot: 'roten' },
  wesen: { drache: 'kleiner Drache', roboter: 'kleiner Roboter', fuchs: 'kleiner Fuchs', fee: 'kleine Fee', einhorn: 'kleines Einhorn' },
  farbe: { rot: 'rot', blau: 'blau', gruen: 'grün', lila: 'lila', tuerkis: 'türkis', rosa: 'rosa', orange: 'orange' },
  merkmal: { fluegel: 'kleinen Flügeln', antenne: 'einer leuchtenden Antenne', krone: 'einer kleinen goldenen Krone', sterne: 'Sternen-Mustern' }
};

// avatarCharacter im exakten Slot-Schema von "Story-Elemente vorbereiten" —
// "Elemente parsen" ersetzt damit die role:'main'-Figur (buildHumanBlock/
// buildCreatureBlock rendern das Objekt unverändert in den VISUAL LOCK).
function buildAvatarCharacter(hf) {
  if (!hf) return null;
  const m = hf.merkmale;
  const V = AVATAR_VISUALS;
  if (hf.typ === 'fantasie') {
    return {
      name: hf.name, type: 'creature', role: 'main',
      species: 'small friendly ' + (V.wesen[m.wesen] || 'fantasy creature'),
      ageYears: null,
      body: { heightCategory: 'child', build: 'small rounded' },
      hair: null,
      eyes: { color: 'large friendly dark' },
      skin: null,
      outfit: null,
      fur: { color: V.farbe[m.farbe] || 'fresh green', pattern: 'plain smooth' },
      distinguishingFeatures: [V.merkmal[m.merkmal]].filter(Boolean)
    };
  }
  const frisur = V.frisur[m.frisur] || V.frisur.kurz;
  const acc = [];
  if (m.brille && m.brille !== 'keine' && V.brille[m.brille]) acc.push(V.brille[m.brille]);
  if (m.accessoire && m.accessoire !== 'keins' && V.accessoire[m.accessoire]) acc.push(V.accessoire[m.accessoire]);
  return {
    name: hf.name, type: 'human', role: 'main',
    species: null,
    ageYears: hf.alter || 8,
    body: { heightCategory: 'child', build: 'average' },
    hair: { color: V.haarfarbe[m.haarfarbe] || 'dark brown', style: frisur.style, length: frisur.length },
    eyes: { color: 'warm brown' },
    skin: { tone: V.hautton[m.hautton] || 'fair' },
    outfit: {
      top: V.oberteil[m.oberteil] || 'blue t-shirt',
      bottom: 'blue denim trousers',
      footwear: 'white sneakers',
      accessories: acc.length ? acc.join('; ') : 'none'
    },
    fur: null,
    distinguishingFeatures: m.hoergeraet === 'ja' ? [V.hoergeraet.ja] : []
  };
}

// Deutscher HAUPTFIGUR-Block für den Text-Prompt (nur Skill-Zweig).
// Ohne Hauptfigur: leerer String → Prompt byte-identisch zu v4.
function buildHauptfigurBlock(hf) {
  if (!hf) return '';
  const m = hf.merkmale;
  const L = AVATAR_LABELS_DE;
  let beschreibung;
  if (hf.typ === 'fantasie') {
    beschreibung = `Sie ist ein ${L.wesen[m.wesen] || 'kleines Fantasiewesen'} (${L.farbe[m.farbe] || 'grün'}) mit ${L.merkmal[m.merkmal] || 'einem besonderen Merkmal'}.`;
  } else {
    const teile = [`${L.haarfarbe[m.haarfarbe] || 'dunkelbraunen'} Haaren (${L.frisur[m.frisur] || 'kurz geschnitten'})`];
    if (m.brille && m.brille !== 'keine') teile.push('einer Brille');
    if (m.hoergeraet === 'ja') teile.push('einem Hörgerät');
    const aufzaehlung = teile.length > 1
      ? teile.slice(0, -1).join(', ') + ' und ' + teile[teile.length - 1]
      : teile[0];
    const alterTxt = hf.alter ? ` (${hf.alter} Jahre)` : '';
    beschreibung = `Sie ist ein Kind${alterTxt} mit ${aufzaehlung}.`;
  }
  return `
HAUPTFIGUR (verbindlich): Die Hauptfigur dieser Geschichte heißt "${hf.name}". ${beschreibung} Verwende GENAU diesen Namen für die Hauptfigur und erfinde keinen anderen Namen für sie. Erwähne ihr Aussehen im Text nur, wenn es natürlich zur Geschichte passt.
`;
}

// ═══════════════════════════════════════════════════════════════
// PROMPT ZUSAMMENBAUEN
// ═══════════════════════════════════════════════════════════════

const p = personaMeta[persona] || personaMeta.peter;
const styleEntry = bildstilMap[bildstilKey] || bildstilMap['Aquarell'];
const imageStylePositive = styleEntry.positive;
const imageStyleNegative = styleEntry.negative;

// Wortanzahl mit Neurotyp-Aufschlag
const basisMin = parseInt(p.woerter.split('–')[0]) || 50;
const basisMax = parseInt(p.woerter.split('–')[1]) || 100;
const neurotypAufschlag = (neurotyp === 'Autismus') ? 0.3 : 0; // +30% für Emotionserklärungen
const effMin = Math.round(basisMin * (1 + neurotypAufschlag));
const effMax = Math.round(basisMax * (1 + neurotypAufschlag));
const effWoerter = `${effMin}–${effMax}`;

// Bildanzahl: 0 wenn "Nur Text" gewählt, sonst nach Wortanzahl
const mitBildern = input['mitBildern'] !== false && input['mitBildern'] !== 'false';
const imageCount = mitBildern ? (basisMax <= 50 ? 2 : basisMax <= 150 ? 4 : basisMax <= 300 ? 5 : 6) : 0;

// Kein Emoji-Hinweis im Prompt — Emojis werden nachträglich per Emoji-Tagger hinzugefügt
const emojiHinweis = '';

// Eröffnungs-Varianz für Bonus-Personas: würfle Typ 1–7 aus dem Toolkit im Systemprompt
const openerType = (p.typ === 'bonus') ? Math.floor(Math.random() * 7) + 1 : null;

// User-Prompt: radikal einfach
let userPrompt;

if (p.typ === 'skill') {
  // Skill-Personas: Neurotyp als Modus
  userPrompt = `DU BIST ${p.name}.
Schreib im Modus: ${neurotyp}.
Dein Systemprompt definiert deinen Stil und die Neurotyp-Anpassung — halte dich daran.${emojiHinweis}

Titel: "${title}"
Kurzbeschreibung: ${description || 'Keine Beschreibung angegeben'}${buildHauptfigurBlock(hauptfigur)}
Wortanzahl: ${effWoerter}
Tempus: ${p.tempus}
Absaetze: Schreibe mindestens ${imageCount + 1} eigenstaendige Absaetze, getrennt durch jeweils eine Leerzeile. Jeder Absatz erzaehlt einen klar abgegrenzten Moment der Geschichte. Das ist wichtig fuer die Bildplatzierung — die ${imageCount} Bilder werden jeweils vor einem Absatz im Text angezeigt, und das erste Bild kommt fruehestens nach Absatz 1.

AUFBAU (diese Labels verwenden):
GESCHICHTE: [vollständiger Text]
ZUSAMMENFASSUNG: [2–3 Sätze]\n\nWICHTIG: Verwende die Labels GESCHICHTE: und ZUSAMMENFASSUNG: GENAU mit Doppelpunkt. Keine Markdown-Heading-Marker (#, ##, ###), kein Fettdruck, keine Sterne im Story-Text.`;
} else {
  // Bonus-Personas: kein Neurotyp, Stil kommt komplett aus Systemprompt
  userPrompt = `DU BIST ${p.name}.
Dein Stil aus dem Systemprompt hat VORRANG.

WICHTIG: Verwende ERÖFFNUNGSTYP #${openerType} aus deinem Stil-Toolkit für den ersten Satz dieser Geschichte.

Titel: "${title}"
Kurzbeschreibung: ${description || 'Keine Beschreibung angegeben'}
Wortanzahl: ${p.woerter}
Absaetze: Schreibe mindestens ${imageCount + 1} eigenstaendige Absaetze, getrennt durch jeweils eine Leerzeile. Jeder Absatz erzaehlt einen klar abgegrenzten Moment der Geschichte. Das ist wichtig fuer die Bildplatzierung — die ${imageCount} Bilder werden jeweils vor einem Absatz im Text angezeigt, und das erste Bild kommt fruehestens nach Absatz 1.

AUFBAU (diese Labels verwenden):
GESCHICHTE: [vollständiger Text]
ZUSAMMENFASSUNG: [2–3 Sätze]\n\nWICHTIG: Verwende die Labels GESCHICHTE: und ZUSAMMENFASSUNG: GENAU mit Doppelpunkt. Keine Markdown-Heading-Marker (#, ##, ###), kein Fettdruck, keine Sterne im Story-Text.`;
}

return { json: {
  title, persona, neurotyp, description, slug,
  date: new Date().toISOString(),
  personaName: p.name, personaType: p.typ,
  personaImg: p.imgUrl, personaBio: p.bio,
  imageCount, bildstilKey, imageStylePositive, imageStyleNegative, userPrompt,
  openerType,
  // Avatar-Hauptfigur (null wenn nicht gesetzt) — konsumiert von
  // "Story-Elemente vorbereiten" (Prompt-Hinweis) und "Elemente parsen" (Override)
  avatarCharacter: buildAvatarCharacter(hauptfigur),
  hauptfigurName: hauptfigur ? hauptfigur.name : null
}};
