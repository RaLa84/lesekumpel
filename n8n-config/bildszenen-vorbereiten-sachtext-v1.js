// Knoten: "Bildszenen vorbereiten" — Sachtext-Workflow (Samira), v1
// Abgeleitet aus bildszenen-vorbereiten-v2.js:
//   - STYLE_REFS + neuer Stil "Schaubild" (text-arme Infografiken)
//   - Stil-Lookup über prev.bildstilKey (aus "Daten vorbereiten") statt Webhook-Label
//   - Verzweigung: bildstilKey === 'Schaubild' -> eigener Infografik-Compiler-Prompt
//     (gleiches Szenen-JSON-Schema, damit "Szenen parsen" unverändert bleibt) und
//     Ersatz des VISUAL LOCK durch einen DIAGRAM LOCK ohne Charaktere.
//   - Alle anderen Stile laufen unverändert über den narrativen Compiler.
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
  'Voxel':     'bilder/bildstil-vorschau/neutral/voxel.png',
  'Schaubild': 'bilder/bildstil-vorschau/neutral/schaubild.png'
};
const webhookBildstil = $('Webhook: Geschichte anfordern').first().json.body?.Bildstil || '';
const bildstilKey = prev.bildstilKey || String(webhookBildstil).split(' ')[0] || 'Cartoon';
const styleRefPath = STYLE_REFS[bildstilKey] || STYLE_REFS['Cartoon'];
const styleRefUrl = `https://rala84.github.io/lesekumpel/${styleRefPath}`;

const imageStylePositive = prev.imageStylePositive || "children's book watercolor illustration, soft pastel colors, consistent rendering across all panels of this story: same line weight, same color palette, same character proportions and facial features";
const imageStyleNegative = prev.imageStyleNegative || "no text, no watermarks, no extra limbs, no duplicate props, no floating objects, no mixed art styles, no style drift";
const imageCount = prev.imageCount || 1;
const sceneRules = Array.isArray(prev.sceneRules) ? prev.sceneRules : [];

const numberedStory = (prev.storyText || '').split(/\n\n+/).map((p,i)=>`[${i}] ${p}`).join('\n\n');

const PARAGRAPH_RULES = `PARAGRAPH-INDEX RULES (read carefully — these are validated):

paragraphIndex is the 0-based index of the EXACT paragraph in STORY TEXT that DESCRIBES the concept shown in this image. The image will be rendered IMMEDIATELY ABOVE that paragraph in the published story.

HOW TO CHOOSE: read the scene's momentSummary, then locate the paragraph whose words actually describe that content. That paragraph's [N] is the paragraphIndex.

HARD RULES (every scene must satisfy ALL of these):
1. paragraphIndex >= 1. NEVER use 0. Texts must always begin with prose. If a scene would illustrate paragraph [0], set paragraphIndex = 1 instead and pick a concept that fits paragraph [1].
2. paragraphIndex < total number of paragraphs in STORY TEXT.
3. paragraphIndex values are DISTINCT across scenes — no two scenes share the same paragraphIndex.
4. paragraphIndex values are STRICTLY INCREASING across scenes (scene 1 < scene 2 < scene 3). Scenes follow the text order.`;

// ════════════════════════════════════════════════════════════════════════════════
// ZWEIG A — Schaubild: Infografik-Compiler (Sachtext)
// ════════════════════════════════════════════════════════════════════════════════

if (bildstilKey === 'Schaubild') {
  // DIAGRAM LOCK ersetzt den charakterbasierten VISUAL LOCK: Schaubilder zeigen
  // Konzepte, keine Figuren. "Szenen parsen" fügt diesen Lock in jeden Bild-Prompt ein.
  const diagramLock = `DIAGRAM LOCK (applies to every panel of this set):
This is a set of ${imageCount} schematic children's infographic panels about the non-fiction topic: "${prev.title || ''}".
All panels share ONE consistent flat vector design system: the same limited color palette (4-6 colors), the same stroke width, the same corner rounding, the same arrow style, the same numbered-marker style (plain digits in circles).
Panels depict CONCEPTS, OBJECTS, ANIMALS or NATURAL PHENOMENA schematically. There are NO named characters, NO mascots, NO human protagonists. Animals and plants appear as simplified schematic figures, not as story characters.
Absolutely NO words, letters or labels anywhere in the image — the only permitted glyphs are plain digits 1 2 3 used as step markers, and arrows.`;

  const DIAGRAM_TYPES = ['process-sequence', 'cross-section', 'comparison', 'scale-comparison', 'anatomy-schematic', 'habitat-map', 'cause-effect', 'lifecycle-circle'];
  const LAYOUTS = ['left-to-right flow', 'top-to-bottom flow', 'central subject with radial elements', 'two-panel side-by-side comparison', 'circular cycle arrangement', 'layered cutaway stack'];

  const sceneUserPrompt = `You are a diagram-slot compiler for a children's non-fiction infographic illustrator. You receive a factual text for children and your job is to choose ${imageCount} concept(s) worth explaining visually and fill one diagram slot per concept. Each panel is a text-free schematic infographic — the explanation text lives on the page next to the image, never inside the image.

${diagramLock}

STORY TEXT (paragraphs are numbered, 0-based; choose paragraphIndex per scene to match the concept):
${numberedStory}

${PARAGRAPH_RULES}

DIAGRAM DESIGN RULES (CRITICAL):
A) ONE CONCEPT PER PANEL: each panel visualizes exactly ONE fact, mechanism, comparison or sequence from its chosen paragraph. Never combine two concepts.
B) TEXT-FREE: the panel must be fully understandable WITHOUT any words. Use arrows for flow/causality, plain digits 1 2 3 in circles for sequence steps, size juxtaposition for scale comparisons, cutaways for inner structure. If a concept cannot be shown without words, pick a different concept from the same paragraph.
C) SCHEMATIC, NOT NARRATIVE: no story moments, no emotions, no characters acting. Show the thing itself: the animal's body schematic, the physical process, the size comparison, the habitat map.
D) DIVERSITY: "framingType" (= diagram type) MUST be unique across all ${imageCount} panels, and "composition" (= layout) MUST be unique across all ${imageCount} panels.

DIAGRAM TYPE pool (use for "framingType", unique per panel): ${DIAGRAM_TYPES.join(', ')}
LAYOUT pool (use for "composition", unique per panel): ${LAYOUTS.join(', ')}

TASK: Output ONLY a JSON array with exactly ${imageCount} objects. Each object has this shape (no other keys):
{
  "scene": <1-based number>,
  "momentSummary": "<one English sentence naming the single concept this panel explains and how it is shown visually, e.g. 'cutaway of a glacier showing meltwater channels flowing to the sea, arrows marking the flow'>",
  "paragraphIndex": <integer — see PARAGRAPH-INDEX RULES above, must be >= 1, distinct, strictly increasing>,
  "action": "<the visual mechanism, e.g. 'arrows showing heat rising', 'three numbered steps left to right'>",
  "pose": "flat schematic front view",
  "camera": "flat frontal diagram view",
  "lighting": "",
  "composition": "<EXACTLY one value from LAYOUT pool; unique across panels>",
  "characters_present": [],
  "props_shown": [],
  "setting_focus": "<short English naming the schematic subject(s) in frame, e.g. 'simplified penguin body schematic with fat layer cutaway'>",
  "medium": "real-scene",
  "sceneSetting": "clean flat infographic canvas with generous white space",
  "mood": "clear",
  "framingType": "<EXACTLY one value from DIAGRAM TYPE pool; unique across panels>",
  "invariantCheck": "This panel contains no words, letters or labels; only arrows and plain circled digits are used as glyphs.",
  "compositionCheck": "This panel is a full-bleed square 1:1 flat vector infographic reaching all four corners, no white margin border, no frame."
}

VERIFY before output: each panel's momentSummary must describe content from its chosen paragraph; every panel is understandable without words; framingType and composition values are unique. If any check fails, fix it before emitting.

Output ONLY the JSON array, no markdown, no explanation.`;

  return [{ json: {
    ...prev,
    visualLock: diagramLock,
    sceneUserPrompt,
    styleRefUrl,
    diversityPools: {
      camera: ['flat frontal diagram view'],
      lighting: [],
      composition: LAYOUTS,
      arcTemplate: null
    }
  } }];
}

// ════════════════════════════════════════════════════════════════════════════════
// ZWEIG B — Narrative Stile: identisch zu bildszenen-vorbereiten-v2.js
// ════════════════════════════════════════════════════════════════════════════════

const visualLock = prev.visualLock || prev.characterReference || '';

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

const STORY_ARC_TEMPLATES = {
  2: ['wide', 'close-up'],
  3: ['wide', 'medium-shot', 'close-up'],
  4: ['wide', 'medium-wide', 'close-up', 'medium-wide']
};

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

const PLAUSIBILITY_INVARIANTS = [
  "Humans (if present in VISUAL LOCK) appear only in plausible settings; humans cannot be underwater, in lava, in outer space without a suit, inside walls, or sharing the same physical space as wild animals in their hostile habitat.",
  "For underwater animals (dolphin, whale, fish, octopus), if a human is in VISUAL LOCK, the human OBSERVES from a boat, pier, shore, or aquarium glass — never swims alongside the animal.",
  "For polar, glacier, volcano, jungle or space settings, humans wear plausible gear OR are positioned at a safe vantage point.",
  "If VISUAL LOCK lists ONLY animals or objects (no humans), do NOT add a human observer to any scene — the scene shows only the animals/objects in their natural setting."
];

const allRules = [...sceneRules, ...PLAUSIBILITY_INVARIANTS];
const rulesBlock = allRules.map((r, i) => `${i+1}. ${r}`).join('\n');

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
${numberedStory}

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

NARRATIVE & EMOTIONAL FIDELITY (CRITICAL — the image must match what literally happens and how the character feels AT that paragraph):

A) MOOD PER BEAT: "mood" MUST reflect the character's emotional state IN the chosen paragraph at that point in the story — NOT the overall arc, NOT an earlier or later beat. If the chosen paragraph is hopeful, mood is hopeful; if it is a setback, mood is the setback emotion. Do not carry a later feeling backwards or an earlier feeling forwards.

B) OPENING SCENE: the FIRST scene establishes the story's opening situation and its tone (usually hopeful, neutral, curious or excited). It MUST NOT jump ahead to a setback, low point or the story's emotional dip — those belong to middle scenes. A children's story should not open on a sad/defeated image.

C) OUTCOME FIDELITY (image models cannot depict negations or inner nuance — you must make outcomes explicit and visual):
   - NEVER depict an outcome the text does not state. The image shows only what the paragraph factually says happens.
   - Competitions / races / contests / games: show victory, first place, a podium, a trophy, a winner's pose, or "crossing the line first/alone" ONLY if the text explicitly says the character WINS or is first.
   - If the text says the character does NOT win / is NOT first / loses / comes last / is overtaken, the scene MUST make that visible: other competitors ahead of or alongside the character, no winner's pose, no solo-triumph framing — even when the character feels happy or proud inside.
   - Translate inner nuance into concrete, paintable facts in "momentSummary", "action" and "setting_focus". Image models ignore phrases like "despite not being first" — instead write what is actually visible, e.g. "two other soapbox cars cross the finish line just ahead while he rolls over the line smiling".

D) SELF-CHECK before output: for every scene, confirm that (1) "mood" matches the chosen paragraph's emotion, (2) the depicted action/outcome is literally supported by that paragraph and adds no unstated victory or failure, and (3) scene 1 shows the opening tone. If any check fails, rewrite momentSummary / action / setting_focus / mood before emitting.

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
  "momentSummary": "<one English sentence naming the single story moment this scene depicts; state the literal visible facts of THIS paragraph, including the real outcome (who is ahead/behind, wins/loses) — never an outcome the text does not state; see NARRATIVE & EMOTIONAL FIDELITY>",
  "paragraphIndex": <integer — see PARAGRAPH-INDEX RULES above, must be >= 1, distinct, strictly increasing>,
  "action": "<the action verb, e.g. 'reaching for', 'running across', 'kneeling beside'>",
  "pose": "<short English describing body pose, e.g. 'feet slightly apart, arms outstretched'>",
  "camera": "<EXACTLY one value from CAMERA pool; if STORY-ARC TEMPLATE active, MUST equal template value for this scene index>",
  "lighting": "<EXACTLY one value from LIGHTING pool above; unique across scenes>",
  "composition": "<EXACTLY one value from COMPOSITION pool; unique across scenes>",
  "characters_present": ["<name>", "<name>"],
  "props_shown": [ { "name": "<prop name from VISUAL LOCK>", "hand": "left | right | both | none" } ],
  "setting_focus": "<short English noting which part of the SETTING ANCHOR is in frame, e.g. 'foreground waves, distant horizon'; include outcome-relevant elements when needed, e.g. 'two other cars crossing the line ahead' so the image shows the real result>",
  "medium": "<exactly one of: real-scene | on-screen-game | dream | imagination | memory — default real-scene; pick another ONLY when the chosen paragraph clearly happens inside a video game, on a screen, in a dream, in imagination, or in a recalled memory>",
  "sceneSetting": "<short English naming WHERE / in which world this single moment happens; may differ from the global SETTING ANCHOR when the moment is in a game, on a screen, in a dream, or at a different location>",
  "mood": "<one adjective matching the chosen paragraph's emotion AT this point in the story — not the overall arc; see NARRATIVE & EMOTIONAL FIDELITY (A)>",
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
