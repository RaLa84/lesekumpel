"""Phase 1 — Image-Pipeline Härtung.

Liest den aktuellen Workflow aus n8n-config/cache/current-workflow.json,
mutiert 9 Knoten laut Plan (Prompt-Härtung), schreibt das Ergebnis
nach n8n-config/cache/updated-workflow.json.

Kein Deploy hier — Deploy geschieht separat via curl PUT.
"""

import json
import sys
from pathlib import Path

sys.stdout.reconfigure(encoding="utf-8")

ROOT = Path(__file__).resolve().parents[2]
SRC = ROOT / "n8n-config" / "cache" / "current-workflow.json"
DST = ROOT / "n8n-config" / "cache" / "updated-workflow.json"

with SRC.open("r", encoding="utf-8") as f:
    wf = json.load(f)

assert wf["name"] == "Lesekumpel – Neuroinclusive Story Generator", f"Falscher Workflow: {wf['name']}"
assert wf["id"] == "eHfC95UaMbJMcLTb", f"Falsche ID: {wf['id']}"

nodes_by_id = {n["id"]: n for n in wf["nodes"]}


# ═══════════════════════════════════════════════════════════════
# 1. prepare-data — bildstilMap in Positive+Konsistenz / Negative splitten
# ═══════════════════════════════════════════════════════════════

NEW_BILDSTIL_BLOCK = '''const bildstilMap = {
  'Aquarell': {
    positive: "children's book watercolor illustration, soft pastel colors, warm and friendly, white background, visible paper texture, consistent rendering across all panels of this story: same line weight, same color palette, same character proportions and facial features",
    negative: "no text, no watermarks, no extra limbs, no duplicate props, no floating objects, no mixed art styles, no style drift, no digital rendering, no photorealism"
  },
  'Cartoon': {
    positive: "colorful cartoon illustration for children, bold black outlines of uniform weight, bright vivid flat colors, fun and playful digital art, consistent rendering across all panels of this story: same outline weight, same saturated palette, same character proportions and facial features",
    negative: "no text, no watermarks, no extra limbs, no duplicate props, no floating objects, no mixed art styles, no style drift, no gritty textures, no photorealism"
  },
  'Buntstift': {
    positive: "colored pencil drawing, hand-drawn children's illustration, crayon texture, sketch-like strokes, warm paper background, consistent rendering across all panels of this story: same stroke density, same muted palette, same character proportions and facial features",
    negative: "no text, no watermarks, no extra limbs, no duplicate props, no floating objects, no mixed art styles, no style drift, no digital gradients, no photorealism"
  },
  'Pixel-Art': {
    positive: "strict 32x32 sprite pixel art for kids, retro 16-bit aesthetic, no anti-aliasing, hard pixel edges, limited 16-color palette, consistent pixel grid density across all panels of this story: same sprite resolution, same color palette, same character sprite silhouette and facial features",
    negative: "no text, no watermarks, no extra limbs, no duplicate props, no floating objects, no mixed art styles, no style drift, no smooth gradients, no anti-aliasing, no photorealism, no high-res rendering"
  },
  'Anime': {
    positive: "anime-style children's illustration, cel-shaded, bright vibrant colors, cute big eyes, clean line art of uniform weight, Nintendo/Pokémon inspired, consistent rendering across all panels of this story: same line weight, same palette, same character proportions and facial features",
    negative: "no text, no watermarks, no extra limbs, no duplicate props, no floating objects, no mixed art styles, no style drift, no photorealism, no gritty shading"
  },
  'Traumwelt': {
    positive: "dreamlike magical painting, glowing light effects, ethereal atmosphere, inspired by Ori and the Blind Forest, soft luminous colors, consistent rendering across all panels of this story: same luminosity, same palette, same character proportions and facial features",
    negative: "no text, no watermarks, no extra limbs, no duplicate props, no floating objects, no mixed art styles, no style drift, no harsh outlines, no photorealism"
  },
  'Knete': {
    positive: "claymation stop-motion style, 3D clay figures, plasticine texture, handmade look, warm studio lighting, Aardman-inspired, consistent rendering across all panels of this story: same clay texture, same palette, same character proportions and facial features",
    negative: "no text, no watermarks, no extra limbs, no duplicate props, no floating objects, no mixed art styles, no style drift, no 2D flat shading, no photorealism"
  },
  'Voxel': {
    positive: "voxel art illustration, 3D blocky style, Minecraft-inspired, colorful uniform cubes, isometric camera, consistent rendering across all panels of this story: same voxel size, same palette, same character voxel silhouette and facial features",
    negative: "no text, no watermarks, no extra limbs, no duplicate props, no floating objects, no mixed art styles, no style drift, no smooth surfaces, no anti-aliasing, no photorealism"
  }
};'''

pd_code = nodes_by_id["prepare-data"]["parameters"]["jsCode"]

# Alten bildstilMap-Block ersetzen
OLD_MAP_START = "const bildstilMap = {"
OLD_MAP_END = "};\r\n\r\n// ═══════════════════════════════════════════════════════════════\r\n// PROMPT ZUSAMMENBAUEN"
s = pd_code.find(OLD_MAP_START)
assert s != -1, "bildstilMap start not found"
e = pd_code.find("};", s)
assert e != -1, "bildstilMap end not found"
new_pd_code = pd_code[:s] + NEW_BILDSTIL_BLOCK + pd_code[e + 2:]

# imageStyle-Zeile ersetzen: const imageStyle = bildstilMap[bildstilKey] || bildstilMap['Aquarell'];
# → const styleEntry = bildstilMap[bildstilKey] || bildstilMap['Aquarell'];
#   const imageStylePositive = styleEntry.positive;
#   const imageStyleNegative = styleEntry.negative;
OLD_STYLE_LINE = "const imageStyle = bildstilMap[bildstilKey] || bildstilMap['Aquarell'];"
NEW_STYLE_LINES = (
    "const styleEntry = bildstilMap[bildstilKey] || bildstilMap['Aquarell'];\r\n"
    "const imageStylePositive = styleEntry.positive;\r\n"
    "const imageStyleNegative = styleEntry.negative;"
)
assert OLD_STYLE_LINE in new_pd_code, "imageStyle-Line nicht gefunden"
new_pd_code = new_pd_code.replace(OLD_STYLE_LINE, NEW_STYLE_LINES)

# Return-Objekt: imageStyle → imageStylePositive, imageStyleNegative
# Alt: "imageCount, bildstilKey, imageStyle, userPrompt"
OLD_RETURN = "imageCount, bildstilKey, imageStyle, userPrompt"
NEW_RETURN = "imageCount, bildstilKey, imageStylePositive, imageStyleNegative, userPrompt"
assert OLD_RETURN in new_pd_code, "Return-Line nicht gefunden"
new_pd_code = new_pd_code.replace(OLD_RETURN, NEW_RETURN)

nodes_by_id["prepare-data"]["parameters"]["jsCode"] = new_pd_code


# ═══════════════════════════════════════════════════════════════
# 2. elements-prep — User-Prompt mit ageYears, heldIn, count, sceneRules
# ═══════════════════════════════════════════════════════════════

NEW_ELEMENTS_PREP_CODE = '''const d = $input.item.json;
const elementsUserPrompt = `Analyze this German children's story and extract ALL visual elements needed to illustrate it consistently and physically plausibly.

Output ONLY a JSON object (no markdown, no explanation):
{
  "characters": [
    {
      "name": "Character name",
      "role": "main/supporting",
      "ageYears": 8,
      "heightCategory": "child",
      "appearance": "Detailed English description: gender, hair color+style, skin tone, eye color, clothing with colors and details, distinguishing features, body type"
    }
  ],
  "props": [
    {
      "name": "Item name",
      "count": 1,
      "heldIn": "right hand",
      "description": "Detailed English visual description with colors, size, shape, material"
    }
  ],
  "setting": "Detailed English description of the main location, time of day, weather, key environmental details",
  "sceneRules": [
    "Each rule is ONE English sentence stating a physical constraint the illustrations must satisfy: explicit spatial relation (ON, NEXT-TO, BEHIND, IN-FRONT-OF), explicit prop count, explicit age. Example: \\"The girl stands NEXT TO the raised garden bed with both feet on the ground.\\""
  ]
}

Requirements (MANDATORY):
- Every character MUST have ageYears (number) and heightCategory ("child"|"teen"|"adult").
- Every character MUST have hair color+style, clothing colors, at least one distinguishing feature.
- Every prop MUST have count (integer) and heldIn ("left hand"|"right hand"|"both hands"|"none").
- sceneRules MUST contain 2-4 concrete physical constraint sentences derived from the story. If a character interacts with a structure (bed, table, car, stage), the rule MUST state the exact spatial relation. If there are paired props (shield+lance, cup+saucer), the rule MUST fix counts and hand assignment. If only children appear in the story, include a rule: "Only the named children from the story appear; no extra characters."
- If the story doesn't mention a detail (like hair color), invent one and keep it consistent.

Story:
${d.storyText}`;
return { json: { ...d, elementsUserPrompt } };'''

nodes_by_id["elements-prep"]["parameters"]["jsCode"] = NEW_ELEMENTS_PREP_CODE


# ═══════════════════════════════════════════════════════════════
# 3. agent-elements — Systemprompt härten
# ═══════════════════════════════════════════════════════════════

NEW_AGENT_ELEMENTS_SYS = (
    "Du bist ein visueller Charakterdesigner für Kinderbücher und sorgst für physische Plausibilität.\n"
    "Extrahiere detaillierte, konsistente visuelle Beschreibungen aller Figuren, Gegenstände und Schauplätze.\n\n"
    "PFLICHT:\n"
    "- Jede Figur hat eine explizite Alterszahl (ageYears) und Größenkategorie (heightCategory).\n"
    "- Jedes Prop hat count (Anzahl) und heldIn (Hand-Slot).\n"
    "- sceneRules enthält 2-4 kurze englische Constraint-Sätze: explizite Räumlichkeit (ON/NEXT-TO/BEHIND/IN-FRONT-OF), explizite Objektanzahl, explizite Altersangabe.\n"
    "- Wenn eine Figur mit einer Struktur interagiert (Beet, Tisch, Bühne, Auto), MUSS die räumliche Relation in sceneRules stehen.\n"
    "- Wenn nur Kinder in der Geschichte sind, nimm einen Satz auf: \"Only children from the story appear; no extra characters.\"\n"
    "- Bei paarigen Werkzeugen (Schild/Lanze, Tasse/Teller) MUSS count und heldIn stimmen.\n\n"
    "Antworte NUR mit dem JSON-Objekt — kein Markdown, keine Erklärungen."
)

nodes_by_id["agent-elements"]["parameters"]["messages"]["messageValues"][0]["message"] = NEW_AGENT_ELEMENTS_SYS


# ═══════════════════════════════════════════════════════════════
# 4. parse-elements — sceneRules durchreichen
# ═══════════════════════════════════════════════════════════════

NEW_PARSE_ELEMENTS_CODE = '''const prev = $('Story-Elemente vorbereiten').first().json;
const rawText = $input.first().json.text || '';

let storyElements = { characters: [], props: [], setting: '', sceneRules: [] };
try {
  const m = rawText.match(/\\{[\\s\\S]*\\}/);
  if (m) storyElements = JSON.parse(m[0]);
} catch(e) {}

if (!Array.isArray(storyElements.sceneRules)) storyElements.sceneRules = [];

let charRef = '';
if (storyElements.characters && storyElements.characters.length > 0) {
  charRef = storyElements.characters
    .map(c => {
      const age = c.ageYears ? ` (age ${c.ageYears}, ${c.heightCategory || 'child'})` : '';
      return c.name + age + ': ' + (c.appearance || '');
    })
    .join('. ');
}
if (storyElements.props && storyElements.props.length > 0) {
  charRef += '. Props: ' + storyElements.props
    .map(p => {
      const cnt = (typeof p.count === 'number') ? `x${p.count}` : '';
      const hand = p.heldIn ? ` [${p.heldIn}]` : '';
      return `${p.name}${cnt}${hand}: ${p.description || ''}`;
    })
    .join('. ');
}
if (storyElements.setting) {
  charRef += '. Setting: ' + storyElements.setting;
}

const sceneRules = storyElements.sceneRules.filter(r => typeof r === 'string' && r.length > 0);

return { json: { ...prev, storyElements, characterReference: charRef, sceneRules } };'''

nodes_by_id["parse-elements"]["parameters"]["jsCode"] = NEW_PARSE_ELEMENTS_CODE


# ═══════════════════════════════════════════════════════════════
# 5. prep-scenes — Slot-Template statt freier LLM-Prosa
# ═══════════════════════════════════════════════════════════════

NEW_PREP_SCENES_CODE = '''const prev = $input.first().json;

if (!prev.imageCount || prev.imageCount === 0) {
  return [{ json: { ...prev, skipImages: true } }];
}

const charRef = prev.characterReference || '';
const imageStylePositive = prev.imageStylePositive || "children's book watercolor illustration, soft pastel colors, consistent rendering across all panels of this story: same line weight, same color palette, same character proportions and facial features";
const imageStyleNegative = prev.imageStyleNegative || "no text, no watermarks, no extra limbs, no duplicate props, no floating objects, no mixed art styles, no style drift";
const imageCount = prev.imageCount || 1;
const sceneRules = Array.isArray(prev.sceneRules) ? prev.sceneRules : [];

const rulesBlock = sceneRules.length > 0
  ? sceneRules.map((r, i) => `${i+1}. ${r}`).join('\\n')
  : '(no explicit rules — infer plausibility from story)';

const sceneUserPrompt = `You are a prompt compiler for a children's book illustrator. Fill the slot template below. Do NOT write free prose.

ART STYLE (positive):
${imageStylePositive}

ART STYLE (negative):
${imageStyleNegative}

CHARACTER REFERENCE (repeat exactly in EVERY scene):
${charRef}

PHYSICAL RULES (EVERY scene MUST satisfy all of these):
${rulesBlock}

STORY TEXT:
${prev.storyText || ''}

TASK: Output a JSON array with exactly ${imageCount} objects. Each object has this shape:
{
  "scene": <1-based number>,
  "positive": "<ART_STYLE_POSITIVE>. Character: <CHAR_REF>. Ages: <explicit age for every human>. Composition: <camera angle>, <action verb>. Spatial: <ON|NEXT-TO|BEHIND|IN-FRONT-OF> <object>. Props in hands: left=<X or none>, right=<Y or none>. Setting: <location>. Mood: <adjective>.",
  "negative": "<ART_STYLE_NEGATIVE>, wrong ages, duplicate props, floating objects, adults unless story specifies",
  "physicalCheck": "<one English sentence asserting this scene satisfies every PHYSICAL RULE listed above>"
}

CHECKS for every scene:
1. Spatial relation is explicit (ON / NEXT-TO / BEHIND / IN-FRONT-OF).
2. Every named prop has a hand slot (left / right / both / none).
3. Every person has an explicit age that matches the story.
4. Only include people named in the story; do not invent extras.
5. Camera angle and setting vary between scenes; character appearance stays identical.

Output ONLY the JSON array, no markdown, no explanation.`;

return [{ json: { ...prev, sceneUserPrompt } }];'''

nodes_by_id["prep-scenes"]["parameters"]["jsCode"] = NEW_PREP_SCENES_CODE


# ═══════════════════════════════════════════════════════════════
# 6. agent-szenen — Systemprompt härten
# ═══════════════════════════════════════════════════════════════

NEW_AGENT_SZENEN_SYS = (
    "You are a prompt compiler for a children's book illustrator. Your job is to fill slot templates.\n\n"
    "RULES — every scene MUST satisfy all 4 checks:\n"
    "1. Spatial relation is explicit (ON / NEXT-TO / BEHIND / IN-FRONT-OF / HELD-BY).\n"
    "2. Every named prop has a hand slot (left / right / both / none).\n"
    "3. Every person has an explicit age that matches the story.\n"
    "4. Only include people named in the story. Do not invent extra characters.\n\n"
    "VARIATION RULE: change camera angle and setting between scenes. Keep character appearance identical (hair, clothing, skin, age, build).\n\n"
    "STYLE RULE: The art style prefix is identical verbatim across all scenes of the same story.\n\n"
    "Output ONLY the JSON array, no markdown, no explanations."
)

nodes_by_id["agent-szenen"]["parameters"]["messages"]["messageValues"][0]["message"] = NEW_AGENT_SZENEN_SYS


# ═══════════════════════════════════════════════════════════════
# 7. parse-scenes — positive + NEGATIVE zusammenbauen
# ═══════════════════════════════════════════════════════════════

NEW_PARSE_SCENES_CODE = '''const prevData = $('Bildszenen vorbereiten').first().json;
if (prevData.skipImages || prevData.imageCount === 0) {
  return [{ json: { ...prevData, _skipLoop: true } }];
}

const prev = $('Bildszenen vorbereiten').first().json;
const rawText = $input.first().json.text || '';
const charRef = prev.characterReference || '';

let scenes = [];
try { const m = rawText.match(/\\[[\\s\\S]*\\]/); if (m) scenes = JSON.parse(m[0]); } catch(e) {}

if (!Array.isArray(scenes) || scenes.length === 0) {
  scenes = [{
    scene: 1,
    positive: (prev.imageStylePositive || "children's book illustration") + ". Character: " + charRef + ". A friendly scene from the story '" + (prev.title || '') + "', child-safe.",
    negative: prev.imageStyleNegative || "no text, no watermarks, no extra limbs"
  }];
}

return scenes.map(s => {
  let positive = s.positive || s.prompt || '';
  const negative = s.negative || prev.imageStyleNegative || '';

  if (charRef && !positive.includes(charRef.substring(0, 30))) {
    positive = charRef + '. Scene: ' + positive;
  }

  const finalPrompt = negative
    ? (positive + ' | NEGATIVE: ' + negative)
    : positive;

  return {
    json: {
      ...prev,
      sceneIndex: s.scene,
      imagePrompt: finalPrompt,
      imageFilename: prev.slug + '-' + s.scene + '.png',
      imageGithubPath: 'bilder/' + prev.slug + '-' + s.scene + '.png',
      geminiRequestBody: {
        contents: [{ role: 'user', parts: [{ text: finalPrompt }] }],
        generationConfig: { responseModalities: ['image', 'text'] }
      }
    }
  };
});'''

nodes_by_id["parse-scenes"]["parameters"]["jsCode"] = NEW_PARSE_SCENES_CODE


# ═══════════════════════════════════════════════════════════════
# 8. llm-szenen — Temperature senken
# ═══════════════════════════════════════════════════════════════

nodes_by_id["llm-szenen"]["parameters"]["options"] = {"temperature": 0.2, "topP": 0.8}


# ═══════════════════════════════════════════════════════════════
# 9. llm-elements — Temperature senken
# ═══════════════════════════════════════════════════════════════

nodes_by_id["llm-elements"]["parameters"]["options"] = {"temperature": 0.1, "topP": 0.8}


# ═══════════════════════════════════════════════════════════════
# Save
# ═══════════════════════════════════════════════════════════════

DST.parent.mkdir(exist_ok=True, parents=True)
with DST.open("w", encoding="utf-8") as f:
    json.dump(wf, f, ensure_ascii=False, indent=2)

print(f"OK — {len(wf['nodes'])} nodes, mutated 9, written to {DST}")
print("Touched nodes:", ["prepare-data", "elements-prep", "agent-elements", "parse-elements",
                         "prep-scenes", "agent-szenen", "parse-scenes", "llm-szenen", "llm-elements"])
