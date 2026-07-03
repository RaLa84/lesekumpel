// Knoten: "Daten vorbereiten" — Sachtext-Workflow (Samira), v1
// Abgeleitet aus daten-vorbereiten-v4.js: fixe Persona Samira, Textlaenge (Kurz/Mittel/Lang)
// statt Persona/Neurotyp, Bildstil-Map inkl. neuem Stil "Schaubild".
const webhookInput = $('Webhook: Geschichte anfordern').first().json;
const input = webhookInput.body || webhookInput;
// Corrected title from 📝 Titel korrigieren chainLlm (with quote-strip + fallback)
const correctedTitle = ($input.item.json.text || '').trim().replace(/^["']|["']$/g, '');
const title = correctedTitle || (input['Titel'] || '').trim();
const textlaengeRaw = (input['Textlaenge'] || 'Mittel').trim();
const bildstilRaw = (input['Bildstil'] || 'Aquarell').trim();
const bildstilKey = bildstilRaw.split(' ')[0];
const description = (input['Kurzbeschreibung'] || '').trim();

// ═══════════════════════════════════════════════════════════════
// TEXTLÄNGE — ersetzt die Persona-/Neurotyp-Logik des Haupt-Workflows
// ═══════════════════════════════════════════════════════════════

const laengenMap = {
  'Kurz':   { woerter: '80–150',  kapitel: '2–3' },
  'Mittel': { woerter: '150–250', kapitel: '3–4' },
  'Lang':   { woerter: '250–400', kapitel: '4–6' }
};
const textlaenge = laengenMap[textlaengeRaw] ? textlaengeRaw : 'Mittel';
const laenge = laengenMap[textlaenge];

const samira = {
  name: 'Samira Wissensfreund', typ: 'bonus',
  imgUrl: 'https://rala84.github.io/lesekumpel/avatars/samira-wissensfreund.webp',
  bio: 'Samira liebt es, spannende Fakten zu entdecken und sie so zu erzählen, dass du staunst!'
};

// Slug — deterministic content-hash (idempotent: same inputs -> same slug, prevents duplicates from caller-retry)
const umlautMap = { 'ä': 'ae', 'ö': 'oe', 'ü': 'ue', 'ß': 'ss', 'Ä': 'ae', 'Ö': 'oe', 'Ü': 'ue' };
const slugBase = (title.toLowerCase()
  .replace(/[äöüßÄÖÜ]/g, c => umlautMap[c] || c)
  .replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '').replace(/-+/g, '-')
  .substring(0, 55) || 'neuer-sachtext');
const slugInput = title + '|samira|' + textlaenge + '|' + bildstilKey + '|' + description;
let _h = 5381;
for (let i = 0; i < slugInput.length; i++) { _h = ((_h * 33) ^ slugInput.charCodeAt(i)) | 0; }
const slugSuffix = ((_h >>> 0).toString(36) + '0000').substring(0, 4);
const slug = slugBase + '-' + slugSuffix;

// ═══════════════════════════════════════════════════════════════
// BILDSTILE — 8 narrative Stile (identisch zum Haupt-Workflow) + "Schaubild"
// ═══════════════════════════════════════════════════════════════

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
  },
};

// Diagramm-Stil (KEIN User-Bildstil mehr): wird automatisch fuer maximal EINE
// Szene pro Sachtext verwendet, wenn der Szenen-Compiler sie als imageKind=diagram
// markiert (Prozess/Vergleich/Querschnitt/Zyklus). Text-arme Infografik: Pfeile +
// Zahlmarker 1/2/3 erlaubt, Woerter/Labels verboten (KI-Bildtext auf Deutsch ist
// unzuverlaessig — der Erklaertext kommt aus den HTML-Kaesten der Sachtext-Seite).
const DIAGRAM_STYLE = {
  positive: "flat vector infographic illustration for a children's science book, clean schematic diagram aesthetic, bold simple geometric shapes with clear color coding, generous white space, soft rounded corners on shapes, clear directional arrows showing flow or causality, simple numbered step markers (plain digits 1 2 3 in circles) where a sequence is shown, cross-section and cutaway views where helpful, one clear focal concept per image, full bleed composition extending to all four image edges, no inner framing, square 1:1 aspect ratio",
  negative: "no words, no letters, no sentences, no labels, no tags, no annotations, no nameplates, no UI overlays, no callouts, no captions, no speech bubbles, no sign text, no paragraphs of text, no watermarks, no letterboxing, no black bars, no white margin border, no paper border, no inner matte, no mat board, no illustration frame, no vignette, no aspect-ratio padding, no photorealism, no 3D rendering, no gritty textures, no sketchy outlines, no human characters, no cartoon mascots, no extra arrows, no duplicate step markers, no mixed art styles, no style drift"
};

// ═══════════════════════════════════════════════════════════════
// PROMPT ZUSAMMENBAUEN
// ═══════════════════════════════════════════════════════════════

// 'Schaubild' ist kein User-Bildstil mehr (alte Formulare/Caches defensiv auf Default)
const effBildstilKey = bildstilMap[bildstilKey] ? bildstilKey : 'Aquarell';
const styleEntry = bildstilMap[effBildstilKey];
const imageStylePositive = styleEntry.positive;
const imageStyleNegative = styleEntry.negative;

const basisMax = parseInt(laenge.woerter.split('–')[1]) || 250;

// Bildanzahl: 0 wenn "Nur Text" gewählt, sonst nach Wortanzahl (Formel wie Haupt-Workflow)
const mitBildern = input['mitBildern'] !== false && input['mitBildern'] !== 'false';
const imageCount = mitBildern ? (basisMax <= 50 ? 2 : basisMax <= 150 ? 4 : basisMax <= 300 ? 5 : 6) : 0;

// Eröffnungs-Varianz: würfle Typ 1–7 aus dem Toolkit im Systemprompt
const openerType = Math.floor(Math.random() * 7) + 1;

const userPrompt = `DU BIST ${samira.name}.
Dein Stil aus dem Systemprompt hat VORRANG.

WICHTIG: Verwende ERÖFFNUNGSTYP #${openerType} aus deinem Stil-Toolkit für den ersten Satz dieses Sachtextes.

Titel: "${title}"
Kurzbeschreibung: ${description || 'Keine Beschreibung angegeben'}
Wortanzahl: ${laenge.woerter} (nur der Sachtext selbst, ohne Zusammenfassung und Bausteine)
Mini-Kapitel: Gliedere den Sachtext in ${laenge.kapitel} kurze Mini-Kapitel. Jedes Mini-Kapitel beginnt mit einer eigenen Mini-Überschrift im Format **Überschrift** allein auf einer Zeile.
Absaetze: Schreibe mindestens ${Math.max(imageCount + 1, 3)} eigenstaendige Absaetze, getrennt durch jeweils eine Leerzeile (Mini-Überschriften zählen nicht als Absatz). Jeder Absatz behandelt einen klar abgegrenzten Aspekt des Themas. Das ist wichtig fuer die Bildplatzierung — die ${imageCount} Bilder werden jeweils vor einem Absatz im Text angezeigt, und das erste Bild kommt fruehestens nach Absatz 1.

AUFBAU (diese Labels verwenden):
GESCHICHTE: [vollständiger Sachtext]
ZUSAMMENFASSUNG: [2–3 Sätze]

Danach die PFLICHT-BAUSTEINE genau wie im Systemprompt definiert: 1–2 [[WUSSTEST-DU]]-Blöcke und genau 1 [[CHECKLISTE: Titel]]-Block.

WICHTIG: Verwende die Labels GESCHICHTE: und ZUSAMMENFASSUNG: GENAU mit Doppelpunkt. Mini-Überschriften als **Überschrift** allein auf einer Zeile sind erlaubt — sonst kein Markdown: keine Heading-Marker (#, ##, ###), kein Fettdruck und keine Sterne im Fließtext.`;

return { json: {
  title, persona: 'samira', neurotyp: 'Standard', textlaenge, description, slug,
  date: new Date().toISOString(),
  personaName: samira.name, personaType: samira.typ,
  personaImg: samira.imgUrl, personaBio: samira.bio,
  woerter: laenge.woerter,
  imageCount, bildstilKey: effBildstilKey, imageStylePositive, imageStyleNegative,
  diagramStylePositive: DIAGRAM_STYLE.positive,
  diagramStyleNegative: DIAGRAM_STYLE.negative,
  userPrompt, openerType
}};
