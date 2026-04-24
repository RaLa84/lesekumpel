"""Phase 1.5 — Mats-doppel-Fix: Scene-Invarianten statt Moment-Constraints.

Bisher erzeugte agent-elements sceneRules wie 'Mats sitzt im Cockpit'
UND 'Mats isst Doener' parallel. prep-scenes verlangte dann 'EVERY
scene MUST satisfy all of these', was Gemini zwang, mehrere Story-
Momente in ein Bild zu packen -> Mats zweimal.

Fix: sceneRules werden zu globalen Invarianten umdefiniert (gelten fuer
ALLE Bilder - z.B. Character-Bestand, Alter, Settings). Moment-
spezifische Aktionen (wer steht wo, wer haelt was) werden pro Szene
vom Szenen-Extraktor aus der Story gewaehlt. Zusaetzliche Regel:
jede Figur erscheint HOECHSTENS EINMAL pro Bild.
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

assert wf["name"] == "Lesekumpel – Neuroinclusive Story Generator"
nodes = {n["id"]: n for n in wf["nodes"]}


# ─────────────────────────────────────────────────────────────
# 1. agent-elements Systemprompt — sceneRules = Invarianten
# ─────────────────────────────────────────────────────────────

NEW_AGENT_ELEMENTS_SYS = (
    "Du bist ein visueller Charakterdesigner für Kinderbücher und sorgst für physische Plausibilität.\n"
    "Extrahiere detaillierte, konsistente visuelle Beschreibungen aller Figuren, Gegenstände und Schauplätze.\n\n"
    "PFLICHT:\n"
    "- Jede Figur hat eine explizite Alterszahl (ageYears) und Größenkategorie (heightCategory).\n"
    "- Jedes Prop hat count (Anzahl) und heldIn (Hand-Slot).\n"
    "- sceneRules sind GLOBALE INVARIANTEN, die in JEDEM Bild der Story gelten müssen. KEINE moment-spezifischen Aktionen oder Positionen einer einzelnen Story-Szene (wie 'Mats sitzt im Cockpit').\n"
    "- sceneRules enthält 2-4 Invarianten-Sätze auf Englisch, z.B.:\n"
    "  - \"All human characters are 8 years old and child-sized.\"\n"
    "  - \"Only the characters named in the story appear; do not invent extra people.\"\n"
    "  - \"Each named character appears at most once per image.\"\n"
    "  - \"Paired props like shield and lance are always count=1 each; the shield is in the left hand, the lance in the right.\"\n"
    "- sceneRules enthält IMMER den Satz: \"Only the characters named in the story appear; do not invent extra people.\"\n"
    "- sceneRules enthält IMMER den Satz: \"Each named character appears at most once per image.\"\n\n"
    "Antworte NUR mit dem JSON-Objekt — kein Markdown, keine Erklärungen."
)
nodes["agent-elements"]["parameters"]["messages"]["messageValues"][0]["message"] = NEW_AGENT_ELEMENTS_SYS


# ─────────────────────────────────────────────────────────────
# 2. elements-prep — User-Prompt: sceneRules = Invarianten
# ─────────────────────────────────────────────────────────────

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
    "Each rule is ONE English sentence that states a GLOBAL INVARIANT valid in EVERY scene of the story (not a specific moment or action). Example: \\"All human characters are children aged 8.\\" or \\"Paired props shield and lance are count=1 each with shield in left hand, lance in right hand.\\""
  ]
}

Requirements (MANDATORY):
- Every character MUST have ageYears (number) and heightCategory ("child"|"teen"|"adult").
- Every character MUST have hair color+style, clothing colors, at least one distinguishing feature.
- Every prop MUST have count (integer) and heldIn ("left hand"|"right hand"|"both hands"|"none").
- sceneRules contain 2-4 GLOBAL INVARIANTS only. Do NOT include moment-specific actions ("Mats sits in the cockpit") or positions ("Mia stands next to the bed") — those belong to individual scenes, not invariants.
- sceneRules MUST ALWAYS include the sentence: "Only the characters named in the story appear; do not invent extra people."
- sceneRules MUST ALWAYS include the sentence: "Each named character appears at most once per image."
- For paired / count-specific props include an invariant that fixes counts and hand assignment.
- If the story doesn't mention a visual detail (hair color, outfit color), invent one and keep it consistent.

Story:
${d.storyText}`;
return { json: { ...d, elementsUserPrompt } };'''

nodes["elements-prep"]["parameters"]["jsCode"] = NEW_ELEMENTS_PREP_CODE


# ─────────────────────────────────────────────────────────────
# 3. agent-szenen Systemprompt — Scene = 1 moment, no duplication
# ─────────────────────────────────────────────────────────────

NEW_AGENT_SZENEN_SYS = (
    "You are a prompt compiler for a children's book illustrator. Your job is to fill slot templates.\n\n"
    "RULES — every scene MUST satisfy all 6 checks:\n"
    "1. Spatial relation is explicit (ON / NEXT-TO / BEHIND / IN-FRONT-OF / HELD-BY).\n"
    "2. Every named prop in the scene has a hand slot (left / right / both / none).\n"
    "3. Every person has an explicit age that matches the story.\n"
    "4. Only include people named in the story. Do not invent extra characters.\n"
    "5. Every named character who appears in the scene MUST wear the exact clothing colors and items specified in CHARACTER REFERENCE. Repeat the clothing description verbatim in the scene prompt.\n"
    "6. Each named character appears AT MOST ONCE per scene. Never show the same character twice in the same image.\n\n"
    "ONE MOMENT RULE: Each scene depicts EXACTLY ONE moment from the story. Never combine two different moments (e.g. 'flying the plane' AND 'eating a döner') into one image. When multiple scenes exist, distribute them across the story arc (beginning / middle / end).\n\n"
    "INVARIANTS: SCENE INVARIANTS in the user prompt apply to EVERY scene as global constraints (character count, ages, paired-prop counts). They do NOT describe a specific moment; do not pack multiple invariants' actions into the same image.\n\n"
    "VARIATION RULE: change camera angle and setting between scenes. Keep character appearance identical (hair, clothing, skin, age, build) across all scenes of the same story.\n\n"
    "STYLE RULE: The art style prefix is identical verbatim across all scenes of the same story.\n\n"
    "TEXT RULE: The scene prompt you output must use natural English prose only. Never include bracketed role tags like [right hand], never use alphanumeric quantity suffixes like x1 / x2 / x3. Describe quantities with words (one, two, three). The final image must contain NO artificial labels, UI overlays, callouts, or speech bubbles.\n\n"
    "ASPECT RULE: Every scene is a square 1:1 full-bleed composition — the artwork extends all the way to every image edge. Never describe white margins, paper borders, inner mattes, illustration frames, or vignettes. The subject and background must reach all four corners of the image.\n\n"
    "Output ONLY the JSON array, no markdown, no explanations."
)
nodes["agent-szenen"]["parameters"]["messages"]["messageValues"][0]["message"] = NEW_AGENT_SZENEN_SYS


# ─────────────────────────────────────────────────────────────
# 4. prep-scenes sceneUserPrompt — Invariants + one moment per scene
# ─────────────────────────────────────────────────────────────

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
  : '(no explicit invariants — infer plausibility from story)';

const sceneUserPrompt = `You are a prompt compiler for a children's book illustrator. Fill the slot template below. Do NOT write free prose.

ART STYLE (positive):
${imageStylePositive}

ART STYLE (negative):
${imageStyleNegative}

CHARACTER REFERENCE (repeat exactly in EVERY scene):
${charRef}

SCENE INVARIANTS (global rules that apply to EVERY scene as constraints, NOT as actions to depict):
${rulesBlock}

STORY TEXT:
${prev.storyText || ''}

TASK: Output a JSON array with exactly ${imageCount} objects. Pick ${imageCount} distinct moment(s) from the story that together cover the story arc. Each scene shows exactly ONE moment — never combine two moments into one image, never show the same character twice.

Each object has this shape:
{
  "scene": <1-based number>,
  "momentSummary": "<one English sentence naming the single story moment this scene depicts>",
  "positive": "<ART_STYLE_POSITIVE>. Characters present (repeat full clothing description for each, verbatim from CHARACTER REFERENCE): <CHAR_REF_SUBSET>. Ages: <explicit age for every human>. Composition: <camera angle>, <action verb>. Spatial: <ON|NEXT-TO|BEHIND|IN-FRONT-OF> <object>. Props in hands: left=<X or none>, right=<Y or none>. Setting: <location>. Mood: <adjective>.",
  "negative": "<ART_STYLE_NEGATIVE>, wrong ages, duplicate props, floating objects, extra characters not in the story, same character shown more than once",
  "invariantCheck": "<one English sentence asserting this scene respects every SCENE INVARIANT above>",
  "compositionCheck": "<one English sentence asserting this scene is a full-bleed square 1:1 image with artwork reaching all four corners, no white margin, no inner matte>"
}

CHECKS for every scene:
1. Spatial relation is explicit (ON / NEXT-TO / BEHIND / IN-FRONT-OF).
2. Every named prop shown has a hand slot (left / right / both / none).
3. Every person has an explicit age that matches the story.
4. Only include people named in the story; do not invent extras.
5. Each named character appears AT MOST ONCE in the scene — never duplicate a character.
6. Scene depicts exactly ONE moment from the story; do not combine moments.
7. Camera angle and setting vary between scenes; character appearance stays identical.

Output ONLY the JSON array, no markdown, no explanation.`;

return [{ json: { ...prev, sceneUserPrompt } }];'''

nodes["prep-scenes"]["parameters"]["jsCode"] = NEW_PREP_SCENES_CODE


DST.parent.mkdir(exist_ok=True, parents=True)
with DST.open("w", encoding="utf-8") as f:
    json.dump(wf, f, ensure_ascii=False, indent=2)

print(f"OK — patched 4 nodes (agent-elements, elements-prep, agent-szenen, prep-scenes), written to {DST}")
