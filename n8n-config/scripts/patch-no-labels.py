"""Phase 1.4 — Text/Labels in den Bildern eliminieren.

Gemini rendert Label-artige Strings wie 'Karottex1 [right hand]' als
Text ins Bild. Drei zusammenhaengende Aenderungen:
1. parse-elements: Props in natuerliche Sprache formatieren (keine x1/[brackets])
2. prepare-data bildstilMap: Negatives um Label/Overlay-Begriffe erweitern
3. agent-szenen: neue TEXT RULE im Systemprompt
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
# 1. parse-elements — Props in natuerlicher Sprache
# ─────────────────────────────────────────────────────────────

NEW_PARSE_ELEMENTS_CODE = '''const prev = $('Story-Elemente vorbereiten').first().json;
const rawText = $input.first().json.text || '';

let storyElements = { characters: [], props: [], setting: '', sceneRules: [] };
try {
  const m = rawText.match(/\\{[\\s\\S]*\\}/);
  if (m) storyElements = JSON.parse(m[0]);
} catch(e) {}

if (!Array.isArray(storyElements.sceneRules)) storyElements.sceneRules = [];

function countWord(n) {
  if (typeof n !== 'number') return '';
  const map = {1:'one',2:'two',3:'three',4:'four',5:'five',6:'six',7:'seven',8:'eight',9:'nine'};
  return map[n] || String(n);
}
function handPhrase(heldIn) {
  if (!heldIn || heldIn === 'none') return '';
  if (heldIn === 'both hands') return ' held in both hands';
  if (heldIn === 'left hand' || heldIn === 'right hand') return ' held in the ' + heldIn;
  return ' ' + heldIn;
}

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
      const word = countWord(p.count);
      const qty = word ? word + ' ' : '';
      const nameLower = (p.name || '').toString().toLowerCase();
      const hand = handPhrase(p.heldIn);
      const prefix = (qty + nameLower).trim();
      return prefix + hand + ': ' + (p.description || '');
    })
    .join('. ');
}
if (storyElements.setting) {
  charRef += '. Setting: ' + storyElements.setting;
}

const sceneRules = storyElements.sceneRules.filter(r => typeof r === 'string' && r.length > 0);

return { json: { ...prev, storyElements, characterReference: charRef, sceneRules } };'''

nodes["parse-elements"]["parameters"]["jsCode"] = NEW_PARSE_ELEMENTS_CODE


# ─────────────────────────────────────────────────────────────
# 2. prepare-data bildstilMap — Negatives um Label-Begriffe erweitern
# ─────────────────────────────────────────────────────────────

pd_code = nodes["prepare-data"]["parameters"]["jsCode"]

# Der gemeinsame Label-Zusatz, der in jedes negative eingefuegt wird
LABEL_NEG = "no labels, no tags, no annotations, no nameplates, no UI overlays, no callouts, no captions, no speech bubbles, no sign text, no alphanumeric text in image"

# Wir haengen den Zusatz direkt nach "no text, no watermarks," ein — diese Sequenz ist in jedem Stil vorhanden
OLD_PREFIX = "no text, no watermarks,"
NEW_PREFIX = "no text, no watermarks, " + LABEL_NEG + ","

# Count wie oft der prefix vorkommt (sollte 8 sein)
occ = pd_code.count(OLD_PREFIX)
assert occ == 8, f"Expected 8 negative prefixes, found {occ}"
new_pd_code = pd_code.replace(OLD_PREFIX, NEW_PREFIX)
nodes["prepare-data"]["parameters"]["jsCode"] = new_pd_code


# ─────────────────────────────────────────────────────────────
# 3. agent-szenen Systemprompt — TEXT RULE ergaenzen
# ─────────────────────────────────────────────────────────────

NEW_AGENT_SZENEN_SYS = (
    "You are a prompt compiler for a children's book illustrator. Your job is to fill slot templates.\n\n"
    "RULES — every scene MUST satisfy all 5 checks:\n"
    "1. Spatial relation is explicit (ON / NEXT-TO / BEHIND / IN-FRONT-OF / HELD-BY).\n"
    "2. Every named prop has a hand slot (left / right / both / none).\n"
    "3. Every person has an explicit age that matches the story.\n"
    "4. Only include people named in the story. Do not invent extra characters.\n"
    "5. Every named character who appears in the scene MUST wear the exact clothing colors and items specified in CHARACTER REFERENCE. Repeat the clothing description verbatim in the scene prompt.\n\n"
    "VARIATION RULE: change camera angle and setting between scenes. Keep character appearance identical (hair, clothing, skin, age, build) across all scenes of the same story.\n\n"
    "STYLE RULE: The art style prefix is identical verbatim across all scenes of the same story.\n\n"
    "TEXT RULE: The scene prompt you output must use natural English prose only. Never include bracketed role tags like [right hand], never use alphanumeric quantity suffixes like x1 / x2 / x3. Describe quantities with words (one, two, three). The final image must contain NO text, labels, callouts, or speech bubbles.\n\n"
    "ASPECT RULE: Every scene is a square 1:1 full-bleed composition — the artwork extends all the way to every image edge. Never describe white margins, paper borders, inner mattes, illustration frames, or vignettes. The subject and background must reach all four corners of the image.\n\n"
    "Output ONLY the JSON array, no markdown, no explanations."
)
nodes["agent-szenen"]["parameters"]["messages"]["messageValues"][0]["message"] = NEW_AGENT_SZENEN_SYS


DST.parent.mkdir(exist_ok=True, parents=True)
with DST.open("w", encoding="utf-8") as f:
    json.dump(wf, f, ensure_ascii=False, indent=2)

print(f"OK — patched 3 nodes (parse-elements, prepare-data, agent-szenen), written to {DST}")
