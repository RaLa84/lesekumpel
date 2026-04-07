const raw = $input.item.json;
const input = raw.body || raw;

const title = (input['Titel'] || '').trim();
const genre = (input['Genre'] || 'Abenteuer').trim();
const personaRaw = (input['Persona'] || 'Peter Past').trim();
const persona = personaRaw.split(' ')[0].toLowerCase();
const neurotyp = (input['Neurotyp'] || 'Standard').trim();
const bildstilRaw = (input['Bildstil'] || 'Aquarell').trim();
const bildstilKey = bildstilRaw.split(' ')[0];
const description = (input['Kurzbeschreibung'] || '').trim();

// Slug
const umlautMap = { 'ä': 'ae', 'ö': 'oe', 'ü': 'ue', 'ß': 'ss', 'Ä': 'ae', 'Ö': 'oe', 'Ü': 'ue' };
const slug = (title.toLowerCase()
  .replace(/[äöüßÄÖÜ]/g, c => umlautMap[c] || c)
  .replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '').replace(/-+/g, '-')
  .substring(0, 55) || 'neue-geschichte') + '-' + Math.random().toString(36).substring(2, 6);

// ═══════════════════════════════════════════════════════════════
// PERSONA-META — Skill-Personas + Bonus-Personas
// ═══════════════════════════════════════════════════════════════

const personaMeta = {
  // ── Skill-Personas (mit Neurotyp-Varianten im Systemprompt) ──
  pip: {
    name: 'Pip Punkt', typ: 'skill', woerter: '20–50',
    imgUrl: 'https://rala84.github.io/lesekumpel/avatars/pip-punkt.webp',
    bio: 'Pip macht jeden Satz kurz und klar. Punkt. Fertig. Bei Pip kannst du jedes Wort lesen — und bist stolz darauf!'
  },
  mia: {
    name: 'Mia Mitte', typ: 'skill', woerter: '50–100',
    imgUrl: 'https://rala84.github.io/lesekumpel/avatars/mia-mitte.webp',
    bio: 'Mia erzählt richtige Geschichten — mit Anfang, Mitte und Ende. Bei ihr fühlst du dich schon wie ein echter Leser!'
  },
  peter: {
    name: 'Peter Past', typ: 'skill', woerter: '100–150',
    imgUrl: 'https://rala84.github.io/lesekumpel/avatars/peter-past.webp',
    bio: 'Peter erzählt spannende Geschichten aus der Vergangenheit. Bei ihm lernst du, wie echte Erzählungen klingen.'
  },
  stella: {
    name: 'Stella Stimmenreich', typ: 'skill', woerter: '150–250',
    imgUrl: 'https://rala84.github.io/lesekumpel/avatars/stella-stimmenreich.webp',
    bio: 'Stella gibt jeder Figur eine eigene Stimme. Bei ihr reden die Charaktere — laut, leise, lustig und ernst.'
  },
  finja: {
    name: 'Finja Feder', typ: 'skill', woerter: '250–400',
    imgUrl: 'https://rala84.github.io/lesekumpel/avatars/finja-feder.webp',
    bio: 'Finn schreibt wie ein echter Autor. Bei ihm liest du Geschichten, die dich zum Nachdenken bringen.'
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
  'Aquarell': "children's book watercolor illustration, soft pastel colors, warm and friendly, white background, no text in image",
  'Cartoon': "colorful cartoon illustration for children, bold outlines, bright vivid colors, fun and playful, digital art, no text in image",
  'Buntstift': "colored pencil drawing, hand-drawn children's illustration, crayon texture, sketch-like, warm paper background, no text in image",
  'Pixel-Art': "pixel art illustration for kids, retro gaming style, colorful blocky pixels, 16-bit aesthetic, cheerful, no text in image",
  'Anime': "anime-style children's illustration, bright vibrant colors, cute big eyes, cel-shading, Nintendo/Pokémon inspired, cheerful, no text in image",
  'Traumwelt': "dreamlike magical painting, glowing light effects, ethereal atmosphere, inspired by Ori and the Blind Forest, soft luminous colors, no text in image",
  'Knete': "claymation stop-motion style, 3D clay figures, plasticine texture, handmade look, warm lighting, Aardman-inspired, no text in image",
  'Voxel': "voxel art illustration, 3D blocky style, Minecraft-inspired, colorful cubes, isometric view, cheerful, no text in image"
};

// ═══════════════════════════════════════════════════════════════
// PROMPT ZUSAMMENBAUEN
// ═══════════════════════════════════════════════════════════════

const p = personaMeta[persona] || personaMeta.peter;
const imageStyle = bildstilMap[bildstilKey] || bildstilMap['Aquarell'];

// Wortanzahl mit Neurotyp-Aufschlag
const basisMin = parseInt(p.woerter.split('–')[0]) || 50;
const basisMax = parseInt(p.woerter.split('–')[1]) || 100;
const neurotypAufschlag = (neurotyp === 'Autismus') ? 0.3 : 0; // +30% für Emotionserklärungen
const effMin = Math.round(basisMin * (1 + neurotypAufschlag));
const effMax = Math.round(basisMax * (1 + neurotypAufschlag));
const effWoerter = `${effMin}–${effMax}`;

// Bildanzahl nach Wortanzahl
const imageCount = basisMax <= 50 ? 1 : basisMax <= 150 ? 2 : 3;

// Kein Emoji-Hinweis im Prompt — Emojis werden nachträglich per Emoji-Tagger hinzugefügt
const emojiHinweis = '';

// User-Prompt: radikal einfach
let userPrompt;

if (p.typ === 'skill') {
  // Skill-Personas: Neurotyp als Modus
  userPrompt = `DU BIST ${p.name}.
Schreib im Modus: ${neurotyp}.
Dein Systemprompt definiert deinen Stil und die Neurotyp-Anpassung — halte dich daran.${emojiHinweis}

Geschichte: "${title}"
Genre: ${genre}
Kurzbeschreibung: ${description || 'Keine Beschreibung angegeben'}
Wortanzahl: ${effWoerter}

AUFBAU (diese Labels verwenden):
GESCHICHTE: [vollständiger Text]
ZUSAMMENFASSUNG: [2–3 Sätze]`;
} else {
  // Bonus-Personas: kein Neurotyp, Stil kommt komplett aus Systemprompt
  userPrompt = `DU BIST ${p.name}.
Dein Stil aus dem Systemprompt hat VORRANG.

Geschichte: "${title}"
Genre: ${genre}
Kurzbeschreibung: ${description || 'Keine Beschreibung angegeben'}
Wortanzahl: ${p.woerter}

AUFBAU (diese Labels verwenden):
GESCHICHTE: [vollständiger Text]
ZUSAMMENFASSUNG: [2–3 Sätze]`;
}

return { json: {
  title, genre, persona, neurotyp, description, slug,
  date: new Date().toISOString().split('T')[0],
  personaName: p.name, personaType: p.typ,
  personaImg: p.imgUrl, personaBio: p.bio,
  imageCount, bildstilKey, imageStyle, userPrompt
}};
