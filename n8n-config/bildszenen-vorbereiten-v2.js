const prev = $input.first().json;

if (!prev.imageCount || prev.imageCount === 0) {
  return [{ json: { ...prev, skipImages: true } }];
}

// Style-Reference-URL aus Bildstil ableiten.
// WICHTIG: charakterfreie neutral/-Vorschauen — keine Menschen, Tiere oder Figuren auf den Stilreferenzen,
// damit Gemini keine Charakter-Eigenschaften aus der Referenz uebernimmt.
const STYLE_REFS = {
  'Aquarell':  'bilder/bildstil-vorschau/neutral/aquarell.png',
  'Cartoon':   'bilder/bildstil-vorschau/neutral/cartoon.png',
  'Buntstift': 'bilder/bildstil-vorschau/neutral/buntstift.png',
  'Pixel-Art': 'bilder/bildstil-vorschau/neutral/pixel-art.png',
  'Anime':     'bilder/bildstil-vorschau/neutral/anime.png',
  'Traumwelt': 'bilder/bildstil-vorschau/neutral/traumwelt.png',
  'Knete':     'bilder/bildstil-vorschau/neutral/knete.png',
  'Voxel':     'bilder/bildstil-vorschau/neutral/voxel.png'
};
const bildstilFromWebhook = $('Webhook: Geschichte anfordern').first().json.body?.Bildstil || prev.imageStyle || 'Cartoon';
const styleRefPath = STYLE_REFS[bildstilFromWebhook] || STYLE_REFS['Cartoon'];
const styleRefUrl = `https://rala84.github.io/lesekumpel/${styleRefPath}`;

const visualLock = prev.visualLock || prev.characterReference || '';
const imageStylePositive = prev.imageStylePositive || "children's book watercolor illustration, soft pastel colors, consistent rendering across all panels of this story: same line weight, same color palette, same character proportions and facial features";
const imageStyleNegative = prev.imageStyleNegative || "no text, no watermarks, no extra limbs, no duplicate props, no floating objects, no mixed art styles, no style drift";
const imageCount = prev.imageCount || 1;
const sceneRules = Array.isArray(prev.sceneRules) ? prev.sceneRules : [];

// ════════════════════════════════════════════════════════════════════════════════
// DIVERSITY POOLS — keep in sync with diversity-pools.js
// Multi-Achsen-Diversität: camera × lighting × composition. Jede Achse hat einen
// Pool, der pro Szene aus genau einem Wert besteht. Pro Story müssen die drei
// Achsen orthogonal variieren — siehe Constraint-Block im Compiler-Prompt unten.
// ════════════════════════════════════════════════════════════════════════════════

const CAMERA = [
  'extreme-close-up', 'close-up', 'medium-shot', 'medium-wide',
  'wide', 'extreme-wide', 'low-angle', 'high-angle',
  'bird-eye', 'worm-eye', 'over-the-shoulder', 'dutch-angle'
];

const LIGHTING = [
  'dawn', 'morning', 'midday', 'afternoon', 'golden-hour', 'dusk',
  'night', 'stormy', 'misty', 'bright-indoor', 'candlelight'
];

const COMPOSITION = [
  'foreground-subject', 'subject-in-landscape', 'close-portrait',
  'over-shoulder', 'group-shot', 'environment-trace'
];

// Story-Arc-Templates: dramaturgische Camera-Sequenz pro Bilder-Anzahl.
// Wenn ein Template aktiv ist, MUSS Bild i die camera template[i-1] haben.
// Wiederholungen in einem Template sind erlaubt (medium-wide × 2 bei 4 Bildern)
// — lighting und composition sorgen dann für die Diversität.
const STORY_ARC_TEMPLATES = {
  2: ['wide', 'close-up'],
  3: ['wide', 'medium-shot', 'close-up'],
  4: ['wide', 'medium-wide', 'close-up', 'medium-wide']
};

// Pool-Filter aus Story-Setting (location, timeOfDay, weather).
// Konservativ: lieber etwas mehr erlauben als zu eng zu filtern.
function buildAllowedLighting(setting, minCount) {
  const loc = String(setting?.location || '').toLowerCase();
  const tod = String(setting?.timeOfDay || '').toLowerCase();
  const weather = String(setting?.weather || '').toLowerCase();

  let lighting = [...LIGHTING];

  if (/\bdawn|sunrise|early morning\b/.test(tod)) {
    lighting = lighting.filter(l => ['dawn', 'morning', 'misty'].includes(l));
  } else if (/\bmorning\b/.test(tod)) {
    lighting = lighting.filter(l => ['dawn', 'morning', 'midday', 'misty', 'bright-indoor'].includes(l));
  } else if (/\bmidday|noon\b/.test(tod)) {
    lighting = lighting.filter(l => ['morning', 'midday', 'afternoon', 'bright-indoor'].includes(l));
  } else if (/\bafternoon\b/.test(tod)) {
    lighting = lighting.filter(l => ['midday', 'afternoon', 'golden-hour', 'bright-indoor'].includes(l));
  } else if (/\bevening|sunset|dusk|golden hour\b/.test(tod)) {
    lighting = lighting.filter(l => ['afternoon', 'golden-hour', 'dusk', 'candlelight'].includes(l));
  } else if (/\bnight|midnight|after dark\b/.test(tod)) {
    lighting = lighting.filter(l => ['dusk', 'night', 'candlelight', 'stormy'].includes(l));
  }

  if (/\bstorm|thunder|heavy rain|blizzard\b/.test(weather)) {
    lighting = ['stormy', 'misty', 'night'];
  } else if (/\bfog|mist|nebel\b/.test(weather)) {
    lighting = lighting.filter(l => ['misty', 'dawn', 'dusk', 'night'].includes(l));
    if (lighting.length === 0) lighting = ['misty'];
  }

  if (/\bindoor|inside|room|kitchen|bedroom|classroom|library|house interior\b/.test(loc)) {
    lighting = lighting.filter(l => ['bright-indoor', 'candlelight', 'morning', 'afternoon', 'dusk', 'night'].includes(l));
    if (lighting.length === 0) lighting = ['bright-indoor'];
  }

  if (/\bunderwater|under water|sea floor|inside an aquarium\b/.test(loc)) {
    lighting = lighting.filter(l => ['misty', 'dusk', 'morning'].includes(l));
    if (lighting.length === 0) lighting = ['misty'];
  }

  // Mindest-Pool-Größe: pro Bild ein unique lighting-Wert. Bei N-Bild-Stories
  // brauchen wir mindestens N unique Werte (mind. 4).
  const target = Math.max(4, minCount || 4);
  if (lighting.length < target) {
    const fallback = ['morning', 'afternoon', 'golden-hour', 'misty', 'dawn', 'dusk', 'night', 'bright-indoor', 'midday'];
    for (const f of fallback) {
      if (!lighting.includes(f)) lighting.push(f);
      if (lighting.length >= target) break;
    }
  }
  return lighting;
}

const storyElements = prev.storyElements || {};
const allowedLighting = buildAllowedLighting(storyElements.setting || {}, imageCount);
const arcTemplate = STORY_ARC_TEMPLATES[imageCount] || null;

// ════════════════════════════════════════════════════════════════════════════════
// Pflicht-Plausibilitaetsregeln (BLEIBEN UNVERAENDERT)
// ════════════════════════════════════════════════════════════════════════════════

const PLAUSIBILITY_INVARIANTS = [
  "Humans (if present in VISUAL LOCK) appear only in plausible settings; humans cannot be underwater, in lava, in outer space without a suit, inside walls, or sharing the same physical space as wild animals in their hostile habitat.",
  "For underwater animals (dolphin, whale, fish, octopus), if a human is in VISUAL LOCK, the human OBSERVES from a boat, pier, shore, or aquarium glass — never swims alongside the animal.",
  "For polar, glacier, volcano, jungle or space settings, humans wear plausible gear OR are positioned at a safe vantage point.",
  "If VISUAL LOCK lists ONLY animals or objects (no humans), do NOT add a human observer to any scene — the scene shows only the animals/objects in their natural setting."
];

const allRules = [...sceneRules, ...PLAUSIBILITY_INVARIANTS];
const rulesBlock = allRules.map((r, i) => `${i+1}. ${r}`).join('\n');

// ════════════════════════════════════════════════════════════════════════════════
// Compiler-Prompt für den Szenen-LLM
// ════════════════════════════════════════════════════════════════════════════════

const arcConstraintBlock = arcTemplate
  ? `STORY-ARC TEMPLATE (CAMERA SEQUENCE — HARD CONSTRAINT, follow exactly in order):
${arcTemplate.map((cam, i) => `  Scene ${i+1}: camera="${cam}"`).join('\n')}
Each scene's "camera" field MUST equal the value above for that scene index.`
  : `STORY-ARC TEMPLATE: none for this image count. Choose camera values freely from the CAMERA pool, but all values across scenes must be unique.`;

const sceneUserPrompt = `You are a scene-slot compiler for a children's book illustrator. You receive a fixed VISUAL LOCK (characters, props, setting) and your job is to choose ${imageCount} story moment(s) and fill a small action/composition slot per moment. You do NOT describe characters, outfits, props or settings — those come from the VISUAL LOCK and are inserted verbatim downstream.

VISUAL LOCK (do not paraphrase, do not list here — it is inserted automatically into every final prompt):
${visualLock}

SCENE INVARIANTS (global rules that apply to EVERY scene as constraints, NOT as actions to depict):
${rulesBlock}

ART STYLE ANCHOR (positive, supplementary to a reference image attached at render time):
${imageStylePositive}

STORY TEXT (paragraphs are numbered, 0-based; choose paragraphIndex per scene to match the moment):
${(prev.storyText || '').split(/\n\n+/).map((p,i)=>`[${i}] ${p}`).join('\n\n')}

PARAGRAPH-INDEX RULES (read carefully — these are validated):

paragraphIndex is the 0-based index of the EXACT paragraph in STORY TEXT that DESCRIBES the moment shown in this image. The image will be rendered IMMEDIATELY ABOVE that paragraph in the published story.

HOW TO CHOOSE: read the scene's momentSummary, then locate the paragraph whose words actually describe that action. That paragraph's [N] is the paragraphIndex.

HARD RULES (every scene must satisfy ALL of these):
1. paragraphIndex >= 1. NEVER use 0. Stories must always begin with prose. If a scene would illustrate paragraph [0], set paragraphIndex = 1 instead and pick a moment that fits paragraph [1].
2. paragraphIndex < total number of paragraphs in STORY TEXT.
3. paragraphIndex values are DISTINCT across scenes — no two scenes share the same paragraphIndex.
4. paragraphIndex values are STRICTLY INCREASING across scenes (scene 1 < scene 2 < scene 3). Scenes follow the story chronologically.

EXAMPLE A (6-paragraph story, 3 scenes):
  [0] Setup
  [1] First action — the heroine finds the object
  [2] Build-up
  [3] Climax — she returns the object
  [4] Resolution
  [5] Reflection
  → Scene 1 (finding) paragraphIndex=1
  → Scene 2 (returning) paragraphIndex=3
  → Scene 3 (reflecting) paragraphIndex=5

EXAMPLE B (4-paragraph story, 2 scenes):
  [0] Setup
  [1] Main action begins
  [2] Resolution
  [3] Reflection
  → Scene 1 paragraphIndex=1
  → Scene 2 paragraphIndex=2

EXAMPLE C (3-paragraph story, 1 scene):
  [0] Setup
  [1] Action
  [2] End
  → Scene 1 paragraphIndex=1  (the single image shows the main action, never above paragraph 0)

VERIFY before output: each scene's momentSummary must describe content from its chosen paragraph. If they don't match, fix paragraphIndex.

MULTI-AXIS DIVERSITY (CRITICAL — three orthogonal axes that create visually distinct images):

Each scene MUST pick exactly one value per axis from the pools below.

CAMERA pool (12 values): ${CAMERA.join(', ')}
LIGHTING pool (filtered for this story's setting — only these values are plausible): ${allowedLighting.join(', ')}
COMPOSITION pool (6 values): ${COMPOSITION.join(', ')}

${arcConstraintBlock}

DIVERSITY CONSTRAINTS (validated):
- "lighting" values MUST be unique across all ${imageCount} scenes.
- "composition" values MUST be unique across all ${imageCount} scenes.
- "framingType" values MUST be unique across all ${imageCount} scenes (separate semantic axis, see below).

If the story spans a long time (e.g. a day), let "lighting" progress naturally (e.g. morning → afternoon → golden-hour → dusk). If it spans a short time (e.g. one moment), pick lightings that are atmospherically different but still plausible.

TASK: Output ONLY a JSON array with exactly ${imageCount} objects. Pick ${imageCount} distinct moment(s) from the story that together cover the story arc. Each scene shows exactly ONE moment — never combine two moments, never show the same character twice.

Each object has this shape (no other keys):
{
  "scene": <1-based number>,
  "momentSummary": "<one English sentence naming the single story moment this scene depicts>",
  "paragraphIndex": <integer — see PARAGRAPH-INDEX RULES above, must be >= 1, distinct, strictly increasing>,
  "action": "<the action verb, e.g. 'reaching for', 'running across', 'kneeling beside'>",
  "pose": "<short English describing body pose, e.g. 'feet slightly apart, arms outstretched'>",
  "camera": "<EXACTLY one value from CAMERA pool; if STORY-ARC TEMPLATE active, MUST equal template value for this scene index>",
  "lighting": "<EXACTLY one value from LIGHTING pool above; unique across scenes>",
  "composition": "<EXACTLY one value from COMPOSITION pool; unique across scenes>",
  "characters_present": ["<name>", "<name>"],
  "props_shown": [ { "name": "<prop name from VISUAL LOCK>", "hand": "left | right | both | none" } ],
  "setting_focus": "<short English noting which part of the SETTING ANCHOR is in frame, e.g. 'foreground waves, distant horizon'>",
  "medium": "<exactly one of: real-scene | on-screen-game | dream | imagination | memory — default real-scene; pick another ONLY when the chosen paragraph clearly happens inside a video game, on a screen, in a dream, in imagination, or in a recalled memory>",
  "sceneSetting": "<short English naming WHERE / in which world this single moment happens; may differ from the global SETTING ANCHOR when the moment is in a game, on a screen, in a dream, or at a different location>",
  "mood": "<one adjective, e.g. 'curious' or 'triumphant'>",
  "framingType": "<exactly one of: overview | detail | interaction | habitat | establishing | reaction — must be UNIQUE across all ${imageCount} scenes>",
  "invariantCheck": "<one English sentence asserting this scene respects every SCENE INVARIANT above>",
  "compositionCheck": "<one English sentence asserting this scene is a full-bleed square 1:1 image with painted scene reaching all four corners, no white margin, no inner matte, no frame>"
}

FRAMING DIVERSITY (semantic axis — distinct from camera, also unique across scenes):
Pick ${imageCount} different framingType values from this menu:

  - overview     → wide framing, full context visible, distant camera, subject small in frame
  - detail       → tight close-up on ONE feature, body part or single action; near camera; rest of body/scene cropped out
  - interaction  → two or more named characters relating to each other in the same frame
  - habitat      → subject is small/medium and the environment dominates the composition (landscape feel)
  - establishing → mid-distance view that introduces the situation, often with negative space
  - reaction     → focus on a face/expression or emotional response, eye-level

You may NOT reuse the same pose phrasing across scenes. If two scenes describe the same physical posture ("vertical logging posture", "sitting at the desk", "standing with arms outstretched"), you have failed this constraint — rewrite so each scene has a uniquely different physical configuration AND a different framingType. Body part visible, distance from camera, and field of view must all shift between scenes.

HARD CONSTRAINTS (never violate):
- You MAY NOT include outfit/hair/eyes/skin/body/fur/clothing descriptions. Those live ONLY in VISUAL LOCK.
- You MAY NOT include character age, height or species in your output. Those live ONLY in VISUAL LOCK.
- You MAY NOT add characters not listed in VISUAL LOCK.
- You MAY NOT show the same named character twice in one scene.
- "characters_present" must be a strict subset of the names that appear as CHARACTER #n in the VISUAL LOCK.
- "props_shown.name" must match a PROP #n name from the VISUAL LOCK; if unsure, return an empty array.
- "camera" MUST be from the CAMERA pool (enum); if STORY-ARC TEMPLATE is active, MUST equal template value.
- "lighting" MUST be from the (filtered) LIGHTING pool and UNIQUE across scenes.
- "composition" MUST be from the COMPOSITION pool and UNIQUE across scenes.
- "framingType" MUST be UNIQUE across scenes.
- "medium" is one of the five allowed values; use "real-scene" unless the paragraph clearly happens elsewhere (game / screen / dream / imagination / memory).
- props_shown respects the PROP TIMELINE (no props from later paragraphs) AND includes the moment's focal object — see PROP TIMELINE & FOCUS below.
- paragraphIndex MUST be distinct AND strictly increasing AND >= 1 — see PARAGRAPH-INDEX RULES above.

WORLD / MEDIUM (read the chosen paragraph carefully):
- Most moments are "real-scene". Set "medium" to something else ONLY when the paragraph's action happens inside a video game, on a TV/computer/phone/handheld screen, in a dream, in the character's imagination, or in a remembered past.
- Crucial example: if the text says the character throws a tomato AT A TARGET IN A GAME (or scores, jumps, shoots, defeats something "im Spiel"), the medium is "on-screen-game" — the tomato and the target are game graphics on a screen, NOT a real thrown object in the room. Never render an in-game or imagined action as a literal real-world event.
- "sceneSetting" names this moment's place/world. For real-scene it is a sub-location of the global SETTING ANCHOR; otherwise it names the other world (e.g. "inside the platformer game level shown on the TV").

PROP TIMELINE & FOCUS (validated against the story):
- props_shown may ONLY contain props that already exist at this scene's paragraphIndex. Read the chosen paragraph AND all earlier paragraphs. If a prop carries a "FIRST APPEARS: from paragraph N onward" note in the VISUAL LOCK, include it ONLY when N <= this scene's paragraphIndex. A prop the character only buys, finds, builds or receives in a LATER paragraph MUST NOT appear (e.g. an ice cream bought at the end must not be held during an earlier negotiation).
- The FOCAL object of the moment — the physical thing the momentSummary is about (e.g. the toy car being haggled over) — MUST be listed in props_shown if it is a PROP in the VISUAL LOCK.

PLAUSIBILITY (final check before output — every scene must pass):
- Inspect VISUAL LOCK: are there humans, animals, both, or only objects?
- If ONLY animals are listed in VISUAL LOCK: NO scene may add a human. The image shows animals in their natural habitat, period.
- If humans are listed: their setting_focus must be a place where they could plausibly exist. No humans underwater (use boat/pier/aquarium glass instead), no humans in lava, no humans in vacuum.
- For wild-animal stories (ocean, polar ice, jungle), if a human is in VISUAL LOCK, the human is on a safe vantage point — never inside the animal's habitat alongside it.
- If you cannot satisfy plausibility, REWRITE setting_focus to a plausible alternative (boat, shore, aquarium, lookout, classroom) before emitting the scene.

Output ONLY the JSON array, no markdown, no explanation.`;

return [{ json: {
  ...prev,
  sceneUserPrompt,
  styleRefUrl,
  // Pool-Definitionen für nachgelagerte Audit-/Validierungs-Stages durchreichen
  diversityPools: {
    camera: CAMERA,
    lighting: allowedLighting,
    composition: COMPOSITION,
    arcTemplate: arcTemplate
  }
} }];
