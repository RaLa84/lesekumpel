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

// Pflicht-Plausibilitaetsregeln, die IMMER gelten — verhindern Setting-Halluzinationen
// wie "Mensch unter Wasser neben Delfin" oder "Mensch im Lavasee".
const PLAUSIBILITY_INVARIANTS = [
  "Humans (if present in VISUAL LOCK) appear only in plausible settings; humans cannot be underwater, in lava, in outer space without a suit, inside walls, or sharing the same physical space as wild animals in their hostile habitat.",
  "For underwater animals (dolphin, whale, fish, octopus), if a human is in VISUAL LOCK, the human OBSERVES from a boat, pier, shore, or aquarium glass — never swims alongside the animal.",
  "For polar, glacier, volcano, jungle or space settings, humans wear plausible gear OR are positioned at a safe vantage point.",
  "If VISUAL LOCK lists ONLY animals or objects (no humans), do NOT add a human observer to any scene — the scene shows only the animals/objects in their natural setting."
];

const allRules = [...sceneRules, ...PLAUSIBILITY_INVARIANTS];
const rulesBlock = allRules.map((r, i) => `${i+1}. ${r}`).join('\n');

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

TASK: Output ONLY a JSON array with exactly ${imageCount} objects. Pick ${imageCount} distinct moment(s) from the story that together cover the story arc. Each scene shows exactly ONE moment — never combine two moments, never show the same character twice.

Each object has this shape (no other keys):
{
  "scene": <1-based number>,
  "momentSummary": "<one English sentence naming the single story moment this scene depicts>",
  "paragraphIndex": <integer — see PARAGRAPH-INDEX RULES above, must be >= 1, distinct, strictly increasing>,
  "action": "<the action verb, e.g. 'reaching for', 'running across', 'kneeling beside'>",
  "pose": "<short English describing body pose, e.g. 'feet slightly apart, arms outstretched'>",
  "camera": "<camera angle + framing, e.g. 'eye-level medium shot, frontal' or 'low-angle wide shot'>",
  "characters_present": ["<name>", "<name>"],
  "props_shown": [ { "name": "<prop name from VISUAL LOCK>", "hand": "left | right | both | none" } ],
  "setting_focus": "<short English noting which part of the SETTING ANCHOR is in frame, e.g. 'foreground waves, distant horizon'>",
  "mood": "<one adjective, e.g. 'curious' or 'triumphant'>",
  "framingType": "<exactly one of: overview | detail | interaction | habitat | establishing | reaction — must be UNIQUE across all ${imageCount} scenes>",
  "invariantCheck": "<one English sentence asserting this scene respects every SCENE INVARIANT above>",
  "compositionCheck": "<one English sentence asserting this scene is a full-bleed square 1:1 image with painted scene reaching all four corners, no white margin, no inner matte, no frame>"
}

FRAMING DIVERSITY (CRITICAL — failing this produces ${imageCount} near-identical images):
Some stories revolve around a single subject or repeated activity (e.g. an animal in one habitat, a character doing one thing). Even then, the ${imageCount} scenes MUST show the topic from visually distinct angles. Pick ${imageCount} different framingType values from this menu:

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
- camera, pose AND framingType MUST be unique across scenes; characters_present MAY repeat across scenes (same character in different moments).
- paragraphIndex MUST be distinct AND strictly increasing AND >= 1 — see PARAGRAPH-INDEX RULES above.

PLAUSIBILITY (final check before output — every scene must pass):
- Inspect VISUAL LOCK: are there humans, animals, both, or only objects?
- If ONLY animals are listed in VISUAL LOCK: NO scene may add a human. The image shows animals in their natural habitat, period.
- If humans are listed: their setting_focus must be a place where they could plausibly exist. No humans underwater (use boat/pier/aquarium glass instead), no humans in lava, no humans in vacuum.
- For wild-animal stories (ocean, polar ice, jungle), if a human is in VISUAL LOCK, the human is on a safe vantage point — never inside the animal's habitat alongside it.
- If you cannot satisfy plausibility, REWRITE setting_focus to a plausible alternative (boat, shore, aquarium, lookout, classroom) before emitting the scene.

Output ONLY the JSON array, no markdown, no explanation.`;

return [{ json: { ...prev, sceneUserPrompt, styleRefUrl } }];
