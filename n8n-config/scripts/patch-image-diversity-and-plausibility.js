// Patcht den Story-Generator-Workflow fuer drei Eingriffe:
//
//   1. agent-elements (Story-Elemente extrahieren) - Systemprompt um Diversitaet,
//      Tier-Only-Regel und Setting-Plausibilitaet erweitern.
//   2. prep-scenes (Bildszenen vorbereiten) - STYLE_REFS auf charakterfreie
//      neutral/*.png Stilreferenzen umstellen, PLAUSIBILITY_INVARIANTS in
//      sceneRules injizieren.
//   3. Gemini-Fallback-Knoten - mimeType-Fallback von image/webp auf image/png
//      umstellen (passend zum neuen PNG-Format der Stilreferenzen).
//
// Idempotent: bei wiederholter Anwendung passiert nichts mehr.
//
// Pattern analog zu patch-style-ref-encode.js / patch-elements-schema.js.

const fs = require('node:fs');
const path = require('node:path');

const TMP_DIR = path.resolve(__dirname, '..', '_tmp');
const SRC = path.join(TMP_DIR, 'workflow_current.json');
const PUT_BODY = path.join(TMP_DIR, 'workflow_image_diversity_patched.json');
const LOCAL_MIRROR = path.resolve(__dirname, '..', 'workflows', 'lesekumpel-story-generator.json');

const ELEMENTS_NODE_ID = 'agent-elements';
const PREP_SCENES_NODE_ID = 'prep-scenes';
const GEMINI_NODE_NAME = 'Gemini Fallback Bild';
const ENCODE_NODE_ID = 'style-ref-encode';

// ============================================================================
// (1) Systemprompt-Erweiterung fuer agent-elements
// ============================================================================
const ELEMENTS_PROMPT_APPEND = `

DIVERSITAET (gilt nur fuer menschliche Figuren):
- Hauptfigur explizit aus dem Story-Inhalt ableiten. Wenn die Story Geschlecht, Alter oder Aussehen nennt: woertlich uebernehmen.
- Wenn die Story die Hauptfigur OFFEN laesst: zufaellig variieren ueber Geschlecht (Junge / Maedchen / divers), Hautton (hell / mittel / dunkel), Haarfarbe (blond / braun / schwarz / rot) und Haarlaenge.
- Vermeide den Default "8-jaehriges weisses Maedchen mit braunen Haaren" - das ist der Modell-Bias und fuehrt zu identisch wirkenden Figuren ueber alle Geschichten hinweg.

TIER-ONLY-REGEL bei Sachtexten und Wissens-Geschichten:
- Wenn die Story eine Sachgeschichte ueber ein Tier ist (Delfin, Pinguin, Wal, Biene, Tintenfisch etc.) und KEINE menschliche Figur namentlich benennt: extrahiere NUR das Tier, KEINEN menschlichen Beobachter. characters[] enthaelt dann ausschliesslich Eintraege mit type="animal".
- Erfinde niemals einen menschlichen Erzaehler, Beobachter oder Forscher dazu.

SETTING-PLAUSIBILITAET (zusaetzliche sceneRules bei menschlichen Figuren):
- Wenn menschliche Figuren in der Story vorkommen, fuege zusaetzlich diese Saetze in sceneRules ein:
  - "Humans appear only in plausible settings; humans cannot be underwater, in lava, in outer space, or inside walls unless the story explicitly says so."
  - "If the story describes a wild animal in its habitat (ocean, polar ice, jungle), humans observe from a plausible vantage point (boat, shore, aquarium, pier) - never share the same physical space as the wild animal in its hostile environment."`;

const ELEMENTS_PROMPT_MARKER = 'DIVERSITAET (gilt nur fuer menschliche Figuren)';

function patchElementsPrompt(node, label) {
  const messageValues = node?.parameters?.messages?.messageValues;
  if (!Array.isArray(messageValues) || messageValues.length === 0) {
    throw new Error(`[${label}] agent-elements hat keine messageValues`);
  }
  const messageNode = messageValues[0];
  if (typeof messageNode.message !== 'string') {
    throw new Error(`[${label}] agent-elements messageValues[0].message ist kein String`);
  }
  if (messageNode.message.includes(ELEMENTS_PROMPT_MARKER)) {
    return false; // bereits gepatcht
  }
  messageNode.message = messageNode.message + ELEMENTS_PROMPT_APPEND;
  return true;
}

// ============================================================================
// (2) prep-scenes jsCode patchen: STYLE_REFS + PLAUSIBILITY
// ============================================================================
const STYLE_REF_REPLACEMENTS = [
  ["'bilder/bildstil-vorschau/aquarell.webp'",  "'bilder/bildstil-vorschau/neutral/aquarell.png'"],
  ["'bilder/bildstil-vorschau/cartoon.webp'",   "'bilder/bildstil-vorschau/neutral/cartoon.png'"],
  ["'bilder/bildstil-vorschau/buntstift.webp'", "'bilder/bildstil-vorschau/neutral/buntstift.png'"],
  ["'bilder/bildstil-vorschau/pixel-art.webp'", "'bilder/bildstil-vorschau/neutral/pixel-art.png'"],
  ["'bilder/bildstil-vorschau/anime.webp'",     "'bilder/bildstil-vorschau/neutral/anime.png'"],
  ["'bilder/bildstil-vorschau/traumwelt.webp'", "'bilder/bildstil-vorschau/neutral/traumwelt.png'"],
  ["'bilder/bildstil-vorschau/knete.webp'",     "'bilder/bildstil-vorschau/neutral/knete.png'"],
  ["'bilder/bildstil-vorschau/voxel.webp'",     "'bilder/bildstil-vorschau/neutral/voxel.png'"]
];

const PLAUSIBILITY_OLD_BLOCK = `const rulesBlock = sceneRules.length > 0
  ? sceneRules.map((r, i) => \`\${i+1}. \${r}\`).join('\\n')
  : '(no explicit invariants — infer plausibility from story)';`;

const PLAUSIBILITY_NEW_BLOCK = `const PLAUSIBILITY_INVARIANTS = [
  "Humans (if present in VISUAL LOCK) appear only in plausible settings; humans cannot be underwater, in lava, in outer space without a suit, inside walls, or sharing the same physical space as wild animals in their hostile habitat.",
  "For underwater animals (dolphin, whale, fish, octopus), if a human is in VISUAL LOCK, the human OBSERVES from a boat, pier, shore, or aquarium glass — never swims alongside the animal.",
  "For polar, glacier, volcano, jungle or space settings, humans wear plausible gear OR are positioned at a safe vantage point.",
  "If VISUAL LOCK lists ONLY animals or objects (no humans), do NOT add a human observer to any scene — the scene shows only the animals/objects in their natural setting."
];
const allRules = [...sceneRules, ...PLAUSIBILITY_INVARIANTS];
const rulesBlock = allRules.map((r, i) => \`\${i+1}. \${r}\`).join('\\n');`;

const PLAUSIBILITY_PROMPT_INSERTION = `
PLAUSIBILITY (final check before output — every scene must pass):
- Inspect the CHARACTER REFERENCE: are there humans, animals, both, or only objects?
- If ONLY animals are listed: NO scene may add a human. The image shows animals in their natural habitat, period.
- If humans are listed: setting must be a place where they could plausibly exist. No humans underwater (use boat/pier/aquarium glass instead), no humans in lava, no humans in vacuum.
- For wild-animal stories (ocean, polar ice, jungle), if a human is in CHARACTER REFERENCE, the human is on a safe vantage point — never inside the animal's habitat alongside it.
`;

const PLAUSIBILITY_MARKER = 'PLAUSIBILITY_INVARIANTS';
const PLAUSIBILITY_PROMPT_MARKER = 'PLAUSIBILITY (final check before output';

function patchPrepScenes(node, label) {
  if (typeof node?.parameters?.jsCode !== 'string') {
    throw new Error(`[${label}] prep-scenes hat keinen jsCode-String`);
  }
  let code = node.parameters.jsCode;
  let changed = false;

  // (a) STYLE_REFS Pfade
  for (const [from, to] of STYLE_REF_REPLACEMENTS) {
    if (code.includes(from)) {
      code = code.split(from).join(to);
      changed = true;
    }
  }

  // (b) rulesBlock-Block durch PLAUSIBILITY-Variante ersetzen
  if (!code.includes(PLAUSIBILITY_MARKER)) {
    if (code.includes(PLAUSIBILITY_OLD_BLOCK)) {
      code = code.replace(PLAUSIBILITY_OLD_BLOCK, PLAUSIBILITY_NEW_BLOCK);
      changed = true;
    } else {
      console.warn(`[${label}] WARN: rulesBlock-Vorlage nicht gefunden — moeglicherweise schon manuell veraendert. Pruefen!`);
    }
  }

  // (c) PLAUSIBILITY-Block im sceneUserPrompt-Template einfuegen, vor "Output ONLY the JSON array"
  if (!code.includes(PLAUSIBILITY_PROMPT_MARKER)) {
    const anchor = '\nOutput ONLY the JSON array';
    if (code.includes(anchor)) {
      code = code.replace(anchor, PLAUSIBILITY_PROMPT_INSERTION + anchor);
      changed = true;
    } else {
      console.warn(`[${label}] WARN: 'Output ONLY the JSON array' Anker nicht gefunden — PLAUSIBILITY-Block nicht eingefuegt`);
    }
  }

  if (changed) node.parameters.jsCode = code;
  return changed;
}

// ============================================================================
// (3) Gemini-Fallback + Encode-Knoten: mimeType-Fallback auf image/png
// ============================================================================
function patchGeminiMimeType(node, label) {
  if (typeof node?.parameters?.jsonBody !== 'string') return false;
  const before = node.parameters.jsonBody;
  const after = before.split("'image/webp'").join("'image/png'");
  if (before !== after) {
    node.parameters.jsonBody = after;
    return true;
  }
  return false;
}

function patchEncodeMimeType(node, label) {
  if (typeof node?.parameters?.jsCode !== 'string') return false;
  const before = node.parameters.jsCode;
  const after = before.split("'image/webp'").join("'image/png'");
  if (before !== after) {
    node.parameters.jsCode = after;
    return true;
  }
  return false;
}

// ============================================================================
// Main
// ============================================================================
function patchWorkflow(wf, label) {
  const summary = { elements: false, prepScenes: false, geminiMime: false, encodeMime: false };

  const elementsNode = wf.nodes.find(n => n.id === ELEMENTS_NODE_ID);
  if (!elementsNode) throw new Error(`[${label}] ${ELEMENTS_NODE_ID} nicht gefunden`);
  summary.elements = patchElementsPrompt(elementsNode, label);

  const prepNode = wf.nodes.find(n => n.id === PREP_SCENES_NODE_ID);
  if (!prepNode) throw new Error(`[${label}] ${PREP_SCENES_NODE_ID} nicht gefunden`);
  summary.prepScenes = patchPrepScenes(prepNode, label);

  const geminiNode = wf.nodes.find(n => n.name === GEMINI_NODE_NAME);
  if (geminiNode) summary.geminiMime = patchGeminiMimeType(geminiNode, label);

  const encodeNode = wf.nodes.find(n => n.id === ENCODE_NODE_ID);
  if (encodeNode) summary.encodeMime = patchEncodeMimeType(encodeNode, label);

  return summary;
}

// --- Live workflow (aus _tmp/workflow_current.json) ---
if (!fs.existsSync(SRC)) {
  console.error(`Live-Workflow nicht gefunden: ${SRC}`);
  console.error(`Hole zuerst per GET: n8n REST API GET /workflows/<id>  ->  ${SRC}`);
  process.exit(1);
}
const wf = JSON.parse(fs.readFileSync(SRC, 'utf8'));
if (wf.name !== 'Lesekumpel – Neuroinclusive Story Generator') {
  throw new Error('Falscher Workflow-Name: ' + wf.name);
}
const liveSummary = patchWorkflow(wf, 'live');

const ALLOWED = new Set(['executionOrder','saveExecutionProgress','saveManualExecutions','saveDataErrorExecution','saveDataSuccessExecution','executionTimeout','errorWorkflow','timezone','callerPolicy','callerIds']);
const cleanSettings = {};
for (const [k, v] of Object.entries(wf.settings ?? {})) if (ALLOWED.has(k)) cleanSettings[k] = v;
const putBody = { name: wf.name, nodes: wf.nodes, connections: wf.connections, settings: cleanSettings, staticData: wf.staticData ?? null };
fs.writeFileSync(PUT_BODY, JSON.stringify(putBody, null, 2), 'utf8');

// --- Local mirror ---
const local = JSON.parse(fs.readFileSync(LOCAL_MIRROR, 'utf8'));
const localSummary = patchWorkflow(local, 'local');
fs.writeFileSync(LOCAL_MIRROR, JSON.stringify(local, null, 2), 'utf8');

console.log(JSON.stringify({
  ok: true,
  liveSummary,
  localSummary,
  putBodyPath: PUT_BODY,
  putBodySize: fs.statSync(PUT_BODY).size
}, null, 2));
