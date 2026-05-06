// Patcht zwei Fixes am Emoji-Tagger:
//   FIX A: "Emoji parsen"-Knoten — entfernt das `break;` das nur das erste
//          Vorkommen eines Wortes taggt. Nach dem Fix werden alle Vorkommen
//          getaggt.
//   FIX B: "Emoji-Tagger"-Prompt — "müde" wird aus der "NICHT taggen"-Liste
//          entfernt und als Gefühl mit 😴 in der Emoji-Zuordnung erlaubt.
//          Plus ein neues Few-Shot-Beispiel.

const fs = require('node:fs');
const path = require('node:path');

const TMP_DIR = path.resolve(__dirname, '..', '_tmp');
const SRC = path.join(TMP_DIR, 'workflow_current.json');
const PUT_BODY = path.join(TMP_DIR, 'workflow_patched.json');
const LOCAL_MIRROR = path.resolve(__dirname, '..', 'workflows', 'lesekumpel-story-generator.json');

// --- FIX B: neuer Prompt-Text ---
const NEW_PROMPT = `Du markierst Gefühls-Wörter in einem Kindertext mit passenden Emojis.

ANTWORTE NUR MIT EINEM JSON-ARRAY. Format pro Eintrag:
{"wort": "<exaktes Wort aus dem Text, in genau der Schreibweise und Flexion>", "emoji": "<ein Emoji>"}

WAS IST EIN GEFÜHL?
- Echte Emotionen und innere Zustände einer Figur: Freude, Trauer, Wut, Angst, Überraschung, Stolz, Liebe, Scham, Erleichterung, Mut, Frustration, Nachdenklichkeit, Müdigkeit/Erschöpfung.
- Auch Verben und Substantive, die ein Gefühl AUSDRÜCKEN: "freut sich", "weinte", "Angst", "Wut", "fühlt sich müde".

WAS IST KEIN GEFÜHL? (NICHT taggen!)
- Handlungen ohne Emotion: "rennen", "essen", "schlafen"
- Physische Zustände: "hungrig", "kalt", "kaputt", "krank"
- Sinneseindrücke ohne Emotion: "laut", "leise", "hell", "dunkel"
- Objekte und Eigenschaften: "schnell", "groß", "neu"

WICHTIGE REGELN:
1. EXAKTHEIT: Übernimm das Wort genau so, wie es im Text steht (Groß-/Kleinschreibung, Flexion). "Angst" bleibt "Angst", "ängstlich" bleibt "ängstlich", "fürchtete" bleibt "fürchtete".
2. NEGATION: Wörter in Verneinung NICHT taggen. "nicht traurig", "keine Angst", "ohne Wut" → kein Eintrag.
3. POLYSEMIE: Mehrdeutige Wörter nur taggen, wenn der Kontext eine Emotion zeigt. "mag" nur bei Personen-/Tierbezug (mag sie sehr), nicht bei Essen (mag Pizza). "stolz" nur als Gefühl, nicht als Hochmut-Beschreibung. "müde" nur als Gefühl einer Figur ("fühlt sich müde"), nicht als Beschreibung eines Objekts.
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
😴 müde, erschöpft, schlapp, fühlt sich müde
🥰 liebt, mag sehr, verliebt, gern hat, herzlich

BEISPIELE:

Input: "Timo ist wütend. Er hat Angst. Das Schiff ist kaputt."
Output: [{"wort":"wütend","emoji":"😠"},{"wort":"Angst","emoji":"😨"}]

Input: "Mia freute sich riesig. Plötzlich erschrak sie und fürchtete sich."
Output: [{"wort":"freute sich","emoji":"😊"},{"wort":"erschrak","emoji":"😨"},{"wort":"fürchtete sich","emoji":"😨"}]

Input: "Lina war nicht traurig, sondern stolz auf sich. Sie überlegte kurz."
Output: [{"wort":"stolz","emoji":"😏"},{"wort":"überlegte","emoji":"🤔"}]

Input: "Mats fühlt sich müde nach der Schule. Er ist auch traurig."
Output: [{"wort":"müde","emoji":"😴"},{"wort":"traurig","emoji":"😢"}]

Input: "Der Hund lief schnell durch den Park. Es war laut und kalt."
Output: []

Input: "Pip mag Pizza. Pip mag seinen Bruder sehr."
Output: [{"wort":"mag","emoji":"🥰"}]

Antworte JETZT NUR mit dem JSON-Array für den folgenden Text — nichts davor, nichts danach, keine Code-Fences.`;

// --- FIX A: Code-Patch für Emoji-Parsen ---
// Suche nach der Zeile mit "break; // Only first occurrence per annotation"
// und ersetze sie + die vorhergehende searchFrom-Zeile-Logik
function patchEmojiParserCode(code) {
  const old = `      searchFrom = idx + a.wort.length + 1;
      break; // Only first occurrence per annotation`;
  const replacement = `      searchFrom = idx + a.wort.length;
      // No break: tag all occurrences in the text`;

  if (!code.includes(old)) {
    throw new Error('Emoji-Parsen-Code: erwarteten Block nicht gefunden für Patch');
  }
  return code.replace(old, replacement);
}

// --- Workflow patchen ---
const wf = JSON.parse(fs.readFileSync(SRC, 'utf8'));

if (wf.name !== 'Lesekumpel – Neuroinclusive Story Generator') {
  throw new Error(`Unerwarteter Workflow-Name: ${wf.name}`);
}

let chainPatched = 0;
let parserPatched = 0;

for (const node of wf.nodes) {
  if (node.id === 'emoji-tagger') {
    const mv = node.parameters?.messages?.messageValues;
    if (!Array.isArray(mv) || mv.length === 0) {
      throw new Error('emoji-tagger: messageValues nicht gefunden');
    }
    mv[0].message = NEW_PROMPT;
    chainPatched++;
  }
  if (node.id === 'emoji-parse' || node.name === 'Emoji parsen') {
    if (!node.parameters?.jsCode) {
      throw new Error('Emoji parsen: jsCode nicht gefunden');
    }
    node.parameters.jsCode = patchEmojiParserCode(node.parameters.jsCode);
    parserPatched++;
  }
}

if (chainPatched !== 1 || parserPatched !== 1) {
  throw new Error(`Erwarte je 1 Patch, gefunden chain=${chainPatched} parser=${parserPatched}`);
}

// --- PUT-Body bauen (n8n akzeptiert nur diese Felder) ---
const ALLOWED_SETTINGS_KEYS = new Set([
  'executionOrder', 'saveExecutionProgress', 'saveManualExecutions',
  'saveDataErrorExecution', 'saveDataSuccessExecution', 'executionTimeout',
  'errorWorkflow', 'timezone', 'callerPolicy', 'callerIds',
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

// --- Lokale Mirror-Datei spiegeln ---
const local = JSON.parse(fs.readFileSync(LOCAL_MIRROR, 'utf8'));
let localChain = 0, localParser = 0;
for (const node of local.nodes ?? []) {
  if (node.id === 'emoji-tagger') {
    const mv = node.parameters?.messages?.messageValues;
    if (Array.isArray(mv) && mv.length > 0) { mv[0].message = NEW_PROMPT; localChain++; }
  }
  if (node.id === 'emoji-parse' || node.name === 'Emoji parsen') {
    if (node.parameters?.jsCode) {
      try {
        node.parameters.jsCode = patchEmojiParserCode(node.parameters.jsCode);
        localParser++;
      } catch (e) {
        console.warn('Lokale Datei: Patch übersprungen —', e.message);
      }
    }
  }
}
fs.writeFileSync(LOCAL_MIRROR, JSON.stringify(local, null, 2), 'utf8');

console.log(JSON.stringify({
  ok: true,
  liveTaggerPatched: chainPatched,
  liveParserPatched: parserPatched,
  localTaggerPatched: localChain,
  localParserPatched: localParser,
  putBodySize: fs.statSync(PUT_BODY).size,
}, null, 2));
