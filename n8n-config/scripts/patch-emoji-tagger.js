// Patcht den Emoji-Tagger im n8n-Workflow:
//   1) llm-emoji: gemini-2.5-flash -> gemini-2.5-pro
//   2) emoji-tagger: neuer Few-Shot-Prompt mit Edge-Case-Regeln
//
// Eingang : /tmp/workflow_current.json  (frisch via REST API GET geladen)
// Ausgang : /tmp/workflow_patched.json  (PUT-Body, nur editable Felder)
//           n8n-config/workflows/lesekumpel-story-generator.json (lokales Mirror)

const fs = require('node:fs');
const path = require('node:path');

const TMP_DIR = path.resolve(__dirname, '..', '_tmp');
const SRC = path.join(TMP_DIR, 'workflow_current.json');
const PUT_BODY = path.join(TMP_DIR, 'workflow_patched.json');
const LOCAL_MIRROR = path.resolve(__dirname, '..', 'workflows', 'lesekumpel-story-generator.json');

const NEW_PROMPT = `Du markierst Gefühls-Wörter in einem Kindertext mit passenden Emojis.

ANTWORTE NUR MIT EINEM JSON-ARRAY. Format pro Eintrag:
{"wort": "<exaktes Wort aus dem Text, in genau der Schreibweise und Flexion>", "emoji": "<ein Emoji>"}

WAS IST EIN GEFÜHL?
- Echte Emotionen und innere Zustände einer Figur: Freude, Trauer, Wut, Angst, Überraschung, Stolz, Liebe, Scham, Erleichterung, Mut, Frustration, Nachdenklichkeit.
- Auch Verben und Substantive, die ein Gefühl AUSDRÜCKEN: "freut sich", "weinte", "Angst", "Wut".

WAS IST KEIN GEFÜHL? (NICHT taggen!)
- Handlungen ohne Emotion: "rennen", "essen", "schlafen"
- Physische Zustände: "müde", "hungrig", "kalt", "kaputt", "krank"
- Sinneseindrücke ohne Emotion: "laut", "leise", "hell", "dunkel"
- Objekte und Eigenschaften: "schnell", "groß", "neu"

WICHTIGE REGELN:
1. EXAKTHEIT: Übernimm das Wort genau so, wie es im Text steht (Groß-/Kleinschreibung, Flexion). "Angst" bleibt "Angst", "ängstlich" bleibt "ängstlich", "fürchtete" bleibt "fürchtete".
2. NEGATION: Wörter in Verneinung NICHT taggen. "nicht traurig", "keine Angst", "ohne Wut" → kein Eintrag.
3. POLYSEMIE: Mehrdeutige Wörter nur taggen, wenn der Kontext eine Emotion zeigt. "mag" nur bei Personen-/Tierbezug (mag sie sehr), nicht bei Essen (mag Pizza). "stolz" nur als Gefühl, nicht als Hochmut-Beschreibung.
4. KEINE DUBLETTEN: Erscheint dasselbe Wort mehrfach im Text, nur EINEN Eintrag pro einzigartiger Schreibweise.
5. KEINE ERFINDUNGEN: Nur Wörter taggen, die wirklich im Text stehen.
6. LEERER TEXT: Wenn keine Gefühle vorkommen, antworte mit [].

EMOJI-ZUORDNUNG (mit typischen Wortvarianten):
😊 froh, glücklich, fröhlich, freut sich, freute sich, lacht, lachte, vergnügt
😢 traurig, weint, weinte, vermisst, vermisste, betrübt, Tränen
😠 wütend, sauer, ärgert sich, ärgerte sich, zornig, Wut, böse (im Sinne von zornig)
😨 Angst, ängstlich, erschrocken, fürchtet sich, fürchtete sich, Furcht, schreckt zurück
😮 überrascht, erstaunt, verblüfft, staunt, staunte
😰 unsicher, nervös, aufgeregt, unruhig, beklommen
🤔 überlegt, überlegte, grübelt, grübelte, zweifelt, nachdenklich, fragt sich
💪 mutig, traut sich, traute sich, tapfer, entschlossen
😤 frustriert, genervt, enttäuscht, sauer (im Sinne von genervt)
😌 erleichtert, beruhigt, entspannt, gelöst
😏 stolz, zufrieden, selbstsicher
🥰 liebt, mag sehr, verliebt, gern hat, herzlich

BEISPIELE:

Input: "Timo ist wütend. Er hat Angst. Das Schiff ist kaputt."
Output: [{"wort":"wütend","emoji":"😠"},{"wort":"Angst","emoji":"😨"}]

Input: "Mia freute sich riesig. Plötzlich erschrak sie und fürchtete sich."
Output: [{"wort":"freute sich","emoji":"😊"},{"wort":"erschrak","emoji":"😨"},{"wort":"fürchtete sich","emoji":"😨"}]

Input: "Lina war nicht traurig, sondern stolz auf sich. Sie überlegte kurz."
Output: [{"wort":"stolz","emoji":"😏"},{"wort":"überlegte","emoji":"🤔"}]

Input: "Der Hund lief schnell durch den Park. Es war laut und kalt."
Output: []

Input: "Pip mag Pizza. Pip mag seinen Bruder sehr."
Output: [{"wort":"mag","emoji":"🥰"}]

Antworte JETZT NUR mit dem JSON-Array für den folgenden Text — nichts davor, nichts danach, keine Code-Fences.`;

const wf = JSON.parse(fs.readFileSync(SRC, 'utf8'));

if (wf.name !== 'Lesekumpel – Neuroinclusive Story Generator') {
  throw new Error(`Unerwarteter Workflow-Name: ${wf.name}`);
}

let llmPatched = 0;
let chainPatched = 0;

for (const node of wf.nodes) {
  if (node.id === 'llm-emoji') {
    if (node.parameters?.modelName !== 'models/gemini-2.5-flash') {
      console.warn(`llm-emoji modelName ist bereits "${node.parameters?.modelName}" — patche trotzdem auf pro`);
    }
    node.parameters.modelName = 'models/gemini-2.5-pro';
    llmPatched++;
  }
  if (node.id === 'emoji-tagger') {
    const mv = node.parameters?.messages?.messageValues;
    if (!Array.isArray(mv) || mv.length === 0) {
      throw new Error('emoji-tagger: messageValues nicht gefunden');
    }
    mv[0].message = NEW_PROMPT;
    chainPatched++;
  }
}

if (llmPatched !== 1 || chainPatched !== 1) {
  throw new Error(`Erwarte je 1 Patch, gefunden llm=${llmPatched} chain=${chainPatched}`);
}

// PUT-Body: n8n akzeptiert nur diese Top-Level-Felder
// settings darf nur bekannte API-Felder enthalten (UI-Felder wie timeSavedMode/availableInMCP werden abgelehnt)
const ALLOWED_SETTINGS_KEYS = new Set([
  'executionOrder',
  'saveExecutionProgress',
  'saveManualExecutions',
  'saveDataErrorExecution',
  'saveDataSuccessExecution',
  'executionTimeout',
  'errorWorkflow',
  'timezone',
  'callerPolicy',
  'callerIds',
]);
const cleanSettings = {};
for (const [k, v] of Object.entries(wf.settings ?? {})) {
  if (ALLOWED_SETTINGS_KEYS.has(k)) cleanSettings[k] = v;
}

const putBody = {
  name: wf.name,
  nodes: wf.nodes,
  connections: wf.connections,
  settings: cleanSettings,
  staticData: wf.staticData ?? null,
};
fs.writeFileSync(PUT_BODY, JSON.stringify(putBody, null, 2), 'utf8');

// Lokale Mirror-Datei: gleichen Patch anwenden, aber Datei-Struktur unverändert lassen
const local = JSON.parse(fs.readFileSync(LOCAL_MIRROR, 'utf8'));
let localLlm = 0, localChain = 0;
for (const node of local.nodes ?? []) {
  if (node.id === 'llm-emoji') { node.parameters.modelName = 'models/gemini-2.5-pro'; localLlm++; }
  if (node.id === 'emoji-tagger') {
    const mv = node.parameters?.messages?.messageValues;
    if (Array.isArray(mv) && mv.length > 0) { mv[0].message = NEW_PROMPT; localChain++; }
  }
}
fs.writeFileSync(LOCAL_MIRROR, JSON.stringify(local, null, 2), 'utf8');

console.log(JSON.stringify({
  ok: true,
  liveLlmPatched: llmPatched,
  liveChainPatched: chainPatched,
  localLlmPatched: localLlm,
  localChainPatched: localChain,
  putBodyPath: PUT_BODY,
  putBodySize: fs.statSync(PUT_BODY).size,
}, null, 2));
