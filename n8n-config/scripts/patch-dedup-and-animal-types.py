"""
Patch the Lesekumpel n8n workflow to fix:
  Issue 1 — Duplicate stories: deterministic content-hash slug + webhook responseMode -> responseNode + Respond-Node
  Issue 2 — Animals rendered as children in costume: type/species schema + type-aware charRef + scene template + safety context

Reads:  n8n-config/_tmp/workflow-current.json (backup snapshot)
Writes: n8n-config/_tmp/workflow-patched.json
PUT:    Manually invoked via curl after diff review.

Run:    python n8n-config/scripts/patch-dedup-and-animal-types.py
"""
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "_tmp" / "workflow-current.json"
DST = ROOT / "_tmp" / "workflow-patched.json"

if not SRC.exists():
    sys.exit(f"Missing {SRC} — run the GET-current step first.")

wf = json.loads(SRC.read_text(encoding="utf-8"))

# ---------- helpers ----------
def find_node(name):
    for n in wf["nodes"]:
        if n.get("name") == name:
            return n
    raise KeyError(f"Node '{name}' not found in workflow")

def replace_in_code(node_name, old, new, *, count=None):
    n = find_node(node_name)
    code = n["parameters"]["jsCode"].replace("\r\n", "\n")
    if old not in code:
        sys.exit(f"FAIL: pattern not found in node '{node_name}':\n  {old[:80]}...")
    if count is not None:
        actual = code.count(old)
        if actual != count:
            sys.exit(f"FAIL: pattern in '{node_name}' should appear {count}x but appears {actual}x")
    n["parameters"]["jsCode"] = code.replace(old, new)
    print(f"  [OK] patched '{node_name}'")

def set_jscode(node_name, new_code):
    n = find_node(node_name)
    n["parameters"]["jsCode"] = new_code
    print(f"  [OK] full replace '{node_name}'")

# ====================================================================
# ISSUE 1 — Fix A: Content-Hash-Slug
# ====================================================================
print("\n[A] Slug — Math.random -> djb2 deterministic hash")

old_slug_block = (
    "// Slug\n"
    "const umlautMap = { 'ä': 'ae', 'ö': 'oe', 'ü': 'ue', 'ß': 'ss', 'Ä': 'ae', 'Ö': 'oe', 'Ü': 'ue' };\n"
    "const slug = (title.toLowerCase()\n"
    "  .replace(/[äöüßÄÖÜ]/g, c => umlautMap[c] || c)\n"
    "  .replace(/\\s+/g, '-').replace(/[^a-z0-9-]/g, '').replace(/-+/g, '-')\n"
    "  .substring(0, 55) || 'neue-geschichte') + '-' + Math.random().toString(36).substring(2, 6);"
)

new_slug_block = (
    "// Slug — deterministic content-hash (idempotent: same inputs -> same slug, prevents duplicates from caller-retry)\n"
    "const umlautMap = { 'ä': 'ae', 'ö': 'oe', 'ü': 'ue', 'ß': 'ss', 'Ä': 'ae', 'Ö': 'oe', 'Ü': 'ue' };\n"
    "const slugBase = (title.toLowerCase()\n"
    "  .replace(/[äöüßÄÖÜ]/g, c => umlautMap[c] || c)\n"
    "  .replace(/\\s+/g, '-').replace(/[^a-z0-9-]/g, '').replace(/-+/g, '-')\n"
    "  .substring(0, 55) || 'neue-geschichte');\n"
    "const slugInput = title + '|' + persona + '|' + neurotyp + '|' + bildstilKey + '|' + description;\n"
    "let _h = 5381;\n"
    "for (let i = 0; i < slugInput.length; i++) { _h = ((_h * 33) ^ slugInput.charCodeAt(i)) | 0; }\n"
    "const slugSuffix = ((_h >>> 0).toString(36) + '0000').substring(0, 4);\n"
    "const slug = slugBase + '-' + slugSuffix;"
)

replace_in_code("Daten vorbereiten", old_slug_block, new_slug_block, count=1)

# ====================================================================
# ISSUE 2 Step 1 — Schema mit type-Feld in "Story-Elemente vorbereiten"
# ====================================================================
print("\n[2.1] Story-Elemente vorbereiten — add type/species schema")

new_elements_code = '''const d = $input.item.json;
const elementsUserPrompt = `Analyze this German children's story and extract ALL visual elements needed to illustrate it consistently and physically plausibly.

Output ONLY a JSON object (no markdown, no explanation):
{
  "characters": [
    {
      "name": "Character name",
      "type": "human | animal | creature | object",
      "species": "Required for animal/creature only — concrete species, e.g., 'European eagle owl', 'tabby cat', 'house spider'",
      "role": "main/supporting",
      "ageYears": 8,
      "heightCategory": "child",
      "appearance": "Detailed English description — content depends on type (see Requirements below)"
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
    "Each rule is ONE English sentence that states a GLOBAL INVARIANT valid in EVERY scene of the story (not a specific moment or action)."
  ]
}

Requirements (MANDATORY):
- Every character MUST have a "type" field with EXACTLY one of: "human", "animal", "creature", "object".
- For type="human": ageYears (number) and heightCategory ("child"|"teen"|"adult") are REQUIRED. appearance describes hair color+style, clothing colors, skin tone, eye color, distinguishing features.
- For type="animal": species is REQUIRED (concrete real-world species). ageYears and heightCategory MUST be null. appearance describes literal animal anatomy ONLY: fur/feather color and pattern, eye color, beak/snout/paws, body proportions, distinguishing markings. NEVER describe clothing or accessories. NEVER describe the animal as wearing anything. NEVER assign human features. The animal is a real animal, not anthropomorphic — unless the story text EXPLICITLY says the animal wears clothes or walks upright.
- For type="creature": species is REQUIRED (e.g., "dragon", "unicorn"). appearance may be hybrid. Set ageYears/heightCategory to null unless the creature is clearly humanoid.
- For type="object": ageYears and heightCategory MUST be null. appearance describes material, color, shape, function.
- Every prop MUST have count (integer) and heldIn ("left hand"|"right hand"|"both hands"|"none").
- sceneRules contain 2-4 GLOBAL INVARIANTS only. Do NOT include moment-specific actions or positions.
- sceneRules MUST ALWAYS include the sentence: "Only the characters named in the story appear; do not invent extra people or animals."
- sceneRules MUST ALWAYS include the sentence: "Each named character appears at most once per image."
- For paired / count-specific props include an invariant that fixes counts and hand assignment.
- If the story doesn't mention a visual detail (hair color, fur color), invent one and keep it consistent.

Story:
${d.storyText}`;
return { json: { ...d, elementsUserPrompt } };'''
set_jscode("Story-Elemente vorbereiten", new_elements_code)

# ====================================================================
# ISSUE 2 Step 2 — Typ-bewusster charRef in "Elemente parsen"
# ====================================================================
print("\n[2.2] Elemente parsen — type-aware charRef builder")

new_parse_elements = r'''const prev = $('Story-Elemente vorbereiten').first().json;
const rawText = $input.first().json.text || '';

let storyElements = { characters: [], props: [], setting: '', sceneRules: [] };
try {
  const m = rawText.match(/\{[\s\S]*\}/);
  if (m) storyElements = JSON.parse(m[0]);
} catch(e) {}

if (!Array.isArray(storyElements.sceneRules)) storyElements.sceneRules = [];

function countWord(n) {
  if (typeof n !== "number") return "";
  const map = {1:"one",2:"two",3:"three",4:"four",5:"five",6:"six",7:"seven",8:"eight",9:"nine"};
  return map[n] || String(n);
}
function handPhrase(heldIn) {
  if (!heldIn || heldIn === "none") return "";
  if (heldIn === "both hands") return " held in both hands";
  if (heldIn === "left hand" || heldIn === "right hand") return " held in the " + heldIn;
  return " " + heldIn;
}

const clothingRegex = new RegExp("\\b(wearing|shirt|dress|trousers|pants|shorts|jacket|hoodie|coat|sweater|skirt|outfit|clothes|kleidung)\\b", "i");

function describeCharacter(c) {
  const type = (c.type || 'human').toLowerCase();
  const appearance = (c.appearance || "").trim();

  if (type === 'animal') {
    const species = c.species || 'animal';
    // Real animal — explicit anti-anthropomorphism. Do NOT add clothing.
    return c.name + " (real " + species + ", anatomically accurate animal — NOT a person, NOT a child, NOT in costume, no clothing): " + appearance;
  }

  if (type === 'creature') {
    const species = c.species || 'fantasy creature';
    return c.name + " (fantasy " + species + ", picture-book creature): " + appearance;
  }

  if (type === 'object') {
    return c.name + " (inanimate object): " + appearance;
  }

  // Default: human
  const sizeHint = c.heightCategory
    ? " (" + c.heightCategory + " character in a children picture book)"
    : " (childrens picture book character)";
  let humanAppearance = appearance;
  // Force clothing if LLM omitted it — applies to HUMANS ONLY (animals/creatures handled above).
  if (!clothingRegex.test(humanAppearance)) {
    humanAppearance = (humanAppearance ? humanAppearance + "; " : "") + "wearing a casual t-shirt and shorts/trousers, fully clothed";
  }
  return c.name + sizeHint + ": " + humanAppearance;
}

let charRef = "";
if (storyElements.characters && storyElements.characters.length > 0) {
  charRef = storyElements.characters.map(describeCharacter).join(". ");
}
if (storyElements.props && storyElements.props.length > 0) {
  charRef += ". Props: " + storyElements.props
    .map(p => {
      const word = countWord(p.count);
      const qty = word ? word + " " : "";
      const nameLower = (p.name || "").toString().toLowerCase();
      const hand = handPhrase(p.heldIn);
      const prefix = (qty + nameLower).trim();
      return prefix + hand + ": " + (p.description || "");
    })
    .join(". ");
}
if (storyElements.setting) {
  charRef += ". Setting: " + storyElements.setting;
}

const sceneRules = storyElements.sceneRules.filter(r => typeof r === "string" && r.length > 0);

// Forward a flag downstream so safety context can be type-aware
const hasNonHumanCharacter = (storyElements.characters || []).some(c => {
  const t = (c.type || 'human').toLowerCase();
  return t === 'animal' || t === 'creature';
});

return { json: { ...prev, storyElements, characterReference: charRef, sceneRules, hasNonHumanCharacter } };
'''
set_jscode("Elemente parsen", new_parse_elements)

# ====================================================================
# ISSUE 2 Step 3 — Scene-Template typ-aware in "Bildszenen vorbereiten"
# ====================================================================
print("\n[2.3] Bildszenen vorbereiten — type-aware scene template")

# Replace the "Ages" line and add the animal anatomy guidance
old_scene_chunk = (
    'Each object has this shape:\n'
    '{\n'
    '  "scene": <1-based number>,\n'
    '  "momentSummary": "<one English sentence naming the single story moment this scene depicts>",\n'
    '  "positive": "<ART_STYLE_POSITIVE>. Characters present (repeat full clothing description for each, verbatim from CHARACTER REFERENCE): <CHAR_REF_SUBSET>. Ages: <explicit age for every human>. Composition: <camera angle>, <action verb>. Spatial: <ON|NEXT-TO|BEHIND|IN-FRONT-OF> <object>. Props in hands: left=<X or none>, right=<Y or none>. Setting: <location>. Mood: <adjective>.",\n'
    '  "negative": "<ART_STYLE_NEGATIVE>, wrong ages, duplicate props, floating objects, extra characters not in the story, same character shown more than once",\n'
)
new_scene_chunk = (
    'Each object has this shape:\n'
    '{\n'
    '  "scene": <1-based number>,\n'
    '  "momentSummary": "<one English sentence naming the single story moment this scene depicts>",\n'
    '  "positive": "<ART_STYLE_POSITIVE>. Characters present (repeat description verbatim from CHARACTER REFERENCE for each — humans keep clothing, animals keep real animal anatomy with NO clothing and NO costume): <CHAR_REF_SUBSET>. Ages: <explicit age for every HUMAN character; for animals write \\"real animal — no age\\">. Composition: <camera angle>, <action verb>. Spatial: <ON|NEXT-TO|BEHIND|IN-FRONT-OF> <object>. Props in hands: left=<X or none>, right=<Y or none>. Setting: <location>. Mood: <adjective>.",\n'
    '  "negative": "<ART_STYLE_NEGATIVE>, wrong ages, duplicate props, floating objects, extra characters not in the story, same character shown more than once, animals depicted as humans in costume, anthropomorphic animals unless explicitly stated in the story",\n'
)
replace_in_code("Bildszenen vorbereiten", old_scene_chunk, new_scene_chunk, count=1)

# Also strengthen the CHECKS block
old_checks = (
    'CHECKS for every scene:\n'
    '1. Spatial relation is explicit (ON / NEXT-TO / BEHIND / IN-FRONT-OF).\n'
    '2. Every named prop shown has a hand slot (left / right / both / none).\n'
    '3. Every person has an explicit age that matches the story.\n'
    '4. Only include people named in the story; do not invent extras.\n'
    '5. Each named character appears AT MOST ONCE in the scene — never duplicate a character.\n'
    '6. Scene depicts exactly ONE moment from the story; do not combine moments.\n'
    '7. Camera angle and setting vary between scenes; character appearance stays identical.'
)
new_checks = (
    'CHECKS for every scene:\n'
    '1. Spatial relation is explicit (ON / NEXT-TO / BEHIND / IN-FRONT-OF).\n'
    '2. Every named prop shown has a hand slot (left / right / both / none).\n'
    '3. Every HUMAN character has an explicit age that matches the story; animals are rendered as actual animals with real anatomy, not as humans in costume.\n'
    '4. Only include characters named in the story; do not invent extras.\n'
    '5. Each named character appears AT MOST ONCE in the scene — never duplicate a character.\n'
    '6. Scene depicts exactly ONE moment from the story; do not combine moments.\n'
    '7. Camera angle and setting vary between scenes; character appearance stays identical.'
)
replace_in_code("Bildszenen vorbereiten", old_checks, new_checks, count=1)

# ====================================================================
# ISSUE 2 Step 4 — Type-aware safetyContext in "Szenen parsen"
# ====================================================================
print("\n[2.4] Szenen parsen — type-aware safetyContext (clothing applies to humans only)")

old_safety = (
    "// Central youth-protection framing — applied to every prompt regardless of story or style\n"
    "const safetyContext = \"Wholesome G-rated illustration for a published German children's picture book, age-appropriate storybook art, fully clothed characters in everyday outfits\";\n"
    "const safetyNegative = 'no swimwear, no swimsuit, no bikini, no underwear, no nudity, no bare torso, no exposed skin beyond face and hands';"
)
new_safety = (
    "// Central youth-protection framing — applied to every prompt regardless of story or style\n"
    "// Clothing wording is type-aware: only enforced when human characters are present.\n"
    "const _hasNonHuman = !!prev.hasNonHumanCharacter;\n"
    "const _clothingClause = _hasNonHuman\n"
    "  ? 'human characters are fully clothed in everyday outfits, animal characters are real animals with no clothing and no costume'\n"
    "  : 'fully clothed characters in everyday outfits';\n"
    "const safetyContext = \"Wholesome G-rated illustration for a published German children's picture book, age-appropriate storybook art, \" + _clothingClause;\n"
    "const safetyNegative = 'no swimwear, no swimsuit, no bikini, no underwear, no nudity, no bare torso, no exposed skin beyond face and hands, no animals depicted as humans, no children wearing animal costumes';"
)
replace_in_code("Szenen parsen", old_safety, new_safety, count=1)

# ====================================================================
# ISSUE 1 Fix C — Webhook responseMode + Respond-to-Webhook node
# ====================================================================
print("\n[C] Webhook responseMode -> responseNode + Respond-Node insertion")

webhook = find_node("Webhook: Geschichte anfordern")
old_mode = webhook["parameters"].get("responseMode")
if old_mode != "lastNode":
    print(f"  [SKIP] webhook responseMode is already '{old_mode}', not patching")
else:
    webhook["parameters"]["responseMode"] = "responseNode"
    print("  [OK] webhook responseMode set to 'responseNode'")

    # Add Respond-Node directly after webhook
    respond_node = {
        "parameters": {
            "respondWith": "json",
            "responseBody": '={ "status": "accepted", "slug": "{{ \\"pending\\" }}" }',
            "options": {}
        },
        "id": "respond-immediate-001",
        "name": "Respond: Accepted",
        "type": "n8n-nodes-base.respondToWebhook",
        "typeVersion": 1,
        "position": [webhook["position"][0] + 250, webhook["position"][1] - 150]
    }
    # Avoid duplicate insertion
    if not any(n.get("name") == "Respond: Accepted" for n in wf["nodes"]):
        wf["nodes"].append(respond_node)
        print("  [OK] added 'Respond: Accepted' node")
    else:
        print("  [SKIP] 'Respond: Accepted' already present")

    # Wire connections: Webhook -> Respond AND keep existing Webhook -> next-node
    conns = wf.setdefault("connections", {})
    wh_name = "Webhook: Geschichte anfordern"
    wh_conn = conns.setdefault(wh_name, {}).setdefault("main", [[]])
    # Existing first-output array
    if not wh_conn:
        wh_conn.append([])
    first_out = wh_conn[0]
    if not any(c.get("node") == "Respond: Accepted" for c in first_out):
        first_out.append({"node": "Respond: Accepted", "type": "main", "index": 0})
        print("  [OK] connected webhook -> Respond: Accepted")
    else:
        print("  [SKIP] webhook->Respond connection already present")

# ====================================================================
# Save patched workflow
# ====================================================================
DST.write_text(json.dumps(wf, indent=2, ensure_ascii=False), encoding="utf-8")
print(f"\n[DONE] wrote patched workflow to {DST}")
print(f"  Nodes: {len(wf['nodes'])}")
print(f"  Workflow name: {wf.get('name')}")
