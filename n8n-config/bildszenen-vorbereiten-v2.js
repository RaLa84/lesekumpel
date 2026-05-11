const prev = $input.first().json;

if (!prev.imageCount || prev.imageCount === 0) {
  return [{ json: { ...prev, skipImages: true } }];
}

// Style-Reference-URL aus Bildstil ableiten (unverändert)
const STYLE_REFS = {
  'Aquarell':  'bilder/bildstil-vorschau/aquarell.webp',
  'Cartoon':   'bilder/bildstil-vorschau/cartoon.webp',
  'Buntstift': 'bilder/bildstil-vorschau/buntstift.webp',
  'Pixel-Art': 'bilder/bildstil-vorschau/pixel-art.webp',
  'Anime':     'bilder/bildstil-vorschau/anime.webp',
  'Traumwelt': 'bilder/bildstil-vorschau/traumwelt.webp',
  'Knete':     'bilder/bildstil-vorschau/knete.webp',
  'Voxel':     'bilder/bildstil-vorschau/voxel.webp'
};
const bildstilFromWebhook = $('Webhook: Geschichte anfordern').first().json.body?.Bildstil || prev.imageStyle || 'Cartoon';
const styleRefPath = STYLE_REFS[bildstilFromWebhook] || STYLE_REFS['Cartoon'];
const styleRefUrl = `https://rala84.github.io/lesekumpel/${styleRefPath}`;

const visualLock = prev.visualLock || prev.characterReference || '';
const imageStylePositive = prev.imageStylePositive || "children's book watercolor illustration, soft pastel colors, consistent rendering across all panels of this story: same line weight, same color palette, same character proportions and facial features";
const imageStyleNegative = prev.imageStyleNegative || "no text, no watermarks, no extra limbs, no duplicate props, no floating objects, no mixed art styles, no style drift";
const imageCount = prev.imageCount || 1;
const sceneRules = Array.isArray(prev.sceneRules) ? prev.sceneRules : [];

const rulesBlock = sceneRules.length > 0
  ? sceneRules.map((r, i) => `${i+1}. ${r}`).join('\n')
  : '(no explicit invariants — infer plausibility from story)';

const sceneUserPrompt = `You are a scene-slot compiler for a children's book illustrator. You receive a fixed VISUAL LOCK (characters, props, setting) and your job is to choose ${imageCount} story moment(s) and fill a small action/composition slot per moment. You do NOT describe characters, outfits, props or settings — those come from the VISUAL LOCK and are inserted verbatim downstream.

VISUAL LOCK (do not paraphrase, do not list here — it is inserted automatically into every final prompt):
${visualLock}

SCENE INVARIANTS (global rules that apply to EVERY scene as constraints, NOT as actions to depict):
${rulesBlock}

ART STYLE ANCHOR (positive, supplementary to a reference image attached at render time):
${imageStylePositive}

STORY TEXT:
${prev.storyText || ''}

TASK: Output ONLY a JSON array with exactly ${imageCount} objects. Pick ${imageCount} distinct moment(s) from the story that together cover the story arc. Each scene shows exactly ONE moment — never combine two moments, never show the same character twice.

Each object has this shape (no other keys):
{
  "scene": <1-based number>,
  "momentSummary": "<one English sentence naming the single story moment this scene depicts>",
  "action": "<the action verb, e.g. 'reaching for', 'running across', 'kneeling beside'>",
  "pose": "<short English describing body pose, e.g. 'feet slightly apart, arms outstretched'>",
  "camera": "<camera angle + framing, e.g. 'eye-level medium shot, frontal' or 'low-angle wide shot'>",
  "characters_present": ["<name>", "<name>"],
  "props_shown": [ { "name": "<prop name from VISUAL LOCK>", "hand": "left | right | both | none" } ],
  "setting_focus": "<short English noting which part of the SETTING ANCHOR is in frame, e.g. 'foreground waves, distant horizon'>",
  "mood": "<one adjective, e.g. 'curious' or 'triumphant'>",
  "invariantCheck": "<one English sentence asserting this scene respects every SCENE INVARIANT above>",
  "compositionCheck": "<one English sentence asserting this scene is a full-bleed square 1:1 image with painted scene reaching all four corners, no white margin, no inner matte, no frame>"
}

HARD CONSTRAINTS (never violate):
- You MAY NOT include outfit/hair/eyes/skin/body/fur/clothing descriptions. Those live ONLY in VISUAL LOCK.
- You MAY NOT include character age, height or species in your output. Those live ONLY in VISUAL LOCK.
- You MAY NOT add characters not listed in VISUAL LOCK.
- You MAY NOT show the same named character twice in one scene.
- "characters_present" must be a strict subset of the names that appear as CHARACTER #n in the VISUAL LOCK.
- "props_shown.name" must match a PROP #n name from the VISUAL LOCK; if unsure, return an empty array.
- camera and pose MUST vary across scenes; characters_present MAY repeat across scenes (same character in different moments).

Output ONLY the JSON array, no markdown, no explanation.`;

return [{ json: { ...prev, sceneUserPrompt, styleRefUrl } }];
