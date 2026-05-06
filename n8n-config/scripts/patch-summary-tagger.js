// Erweitert den Workflow: Summary wird zusätzlich durchs Emoji-Tagging geschickt.
//
// Neue Knoten:
//   - 😊 Summary-Tagger (chainLlm, Klon des Emoji-Taggers)
//   - Summary-Emoji parsen (Code, Klon des Emoji-Parsers, arbeitet auf summaryText)
//
// Connection-Updates:
//   - Emoji parsen → Summary-Tagger (statt Linguistik-Anreicherung)
//   - Summary-Tagger → Summary-Emoji parsen
//   - Summary-Emoji parsen → 📚 Linguistik-Anreicherung
//   - ⚙️ Gemini (Emoji) LM → beide Tagger
//
// Plus: HTML assemblieren bekommt eine Replace-Zeile für {{EMOJI_SUMMARY_TEXT}}.
//
// Idempotent: erkennt, wenn Summary-Tagger schon existiert, und überspringt das Klonen.

const fs = require('node:fs');
const path = require('node:path');

const TMP_DIR = path.resolve(__dirname, '..', '_tmp');
const SRC = path.join(TMP_DIR, 'workflow_current.json');
const PUT_BODY = path.join(TMP_DIR, 'workflow_patched.json');
const LOCAL_MIRROR = path.resolve(__dirname, '..', 'workflows', 'lesekumpel-story-generator.json');

const SUMMARY_TAGGER_ID = 'summary-tagger';
const SUMMARY_TAGGER_NAME = '😊 Summary-Tagger';
const SUMMARY_PARSER_ID = 'summary-emoji-parse';
const SUMMARY_PARSER_NAME = 'Summary-Emoji parsen';
const LINGUISTIK_NAME = '📚 Linguistik-Anreicherung';

function patchWorkflow(wf, label) {
  const taggerSrc = wf.nodes.find(n => n.id === 'emoji-tagger');
  const parserSrc = wf.nodes.find(n => n.id === 'emoji-parse');
  const lmName = '⚙️ Gemini (Emoji)';

  if (!taggerSrc || !parserSrc) {
    throw new Error(`[${label}] Quell-Knoten emoji-tagger/emoji-parse nicht gefunden`);
  }

  // 1. Knoten klonen (idempotent)
  let added = 0;
  if (!wf.nodes.find(n => n.id === SUMMARY_TAGGER_ID)) {
    const clone = JSON.parse(JSON.stringify(taggerSrc));
    clone.id = SUMMARY_TAGGER_ID;
    clone.name = SUMMARY_TAGGER_NAME;
    clone.position = [taggerSrc.position[0] + 540, taggerSrc.position[1]];
    clone.parameters.text = '={{ $json.summaryText }}';
    wf.nodes.push(clone);
    added++;
  }

  if (!wf.nodes.find(n => n.id === SUMMARY_PARSER_ID)) {
    const clone = JSON.parse(JSON.stringify(parserSrc));
    clone.id = SUMMARY_PARSER_ID;
    clone.name = SUMMARY_PARSER_NAME;
    clone.position = [parserSrc.position[0] + 540, parserSrc.position[1]];
    // jsCode anpassen: arbeitet auf summaryText, nutzt origData von Emoji parsen
    let code = parserSrc.parameters.jsCode;
    code = code.replace(
      "const origData = $('Geschichte parsen').first().json;",
      "const origData = $('Emoji parsen').first().json;"
    );
    code = code.replace(
      'const rawText = origData.rawStoryText || \'\';',
      "const rawText = origData.summaryText || '';"
    );
    code = code.replace(
      'const emojiStoryText = emojiText.replace(',
      'const emojiSummaryText = emojiText.replace('
    );
    code = code.replace(
      'return { json: { ...origData, emojiStoryText } };',
      'return { json: { ...origData, emojiSummaryText } };'
    );
    clone.parameters.jsCode = code;
    wf.nodes.push(clone);
    added++;
  }

  // 2. Connections umbauen
  // Emoji parsen → Summary-Tagger (statt Linguistik)
  wf.connections['Emoji parsen'] = {
    main: [[{ node: SUMMARY_TAGGER_NAME, type: 'main', index: 0 }]],
  };
  // Summary-Tagger → Summary-Emoji parsen
  wf.connections[SUMMARY_TAGGER_NAME] = {
    main: [[{ node: SUMMARY_PARSER_NAME, type: 'main', index: 0 }]],
  };
  // Summary-Emoji parsen → Linguistik-Anreicherung
  wf.connections[SUMMARY_PARSER_NAME] = {
    main: [[{ node: LINGUISTIK_NAME, type: 'main', index: 0 }]],
  };
  // LM-Knoten → beide Tagger
  const lmConn = wf.connections[lmName] || { ai_languageModel: [[]] };
  if (!lmConn.ai_languageModel) lmConn.ai_languageModel = [[]];
  if (!lmConn.ai_languageModel[0]) lmConn.ai_languageModel[0] = [];
  const targets = lmConn.ai_languageModel[0];
  if (!targets.find(t => t.node === '😊 Emoji-Tagger')) {
    targets.push({ node: '😊 Emoji-Tagger', type: 'ai_languageModel', index: 0 });
  }
  if (!targets.find(t => t.node === SUMMARY_TAGGER_NAME)) {
    targets.push({ node: SUMMARY_TAGGER_NAME, type: 'ai_languageModel', index: 0 });
  }
  wf.connections[lmName] = lmConn;

  // 3. HTML assemblieren patchen — Replace-Zeile für EMOJI_SUMMARY_TEXT hinzufügen
  const htmlNode = wf.nodes.find(n => n.name === 'HTML assemblieren');
  if (htmlNode && htmlNode.parameters?.jsCode) {
    let html = htmlNode.parameters.jsCode;
    if (!html.includes('EMOJI_SUMMARY_TEXT')) {
      html = html.replace(
        '.replace(/\\{\\{RAW_SUMMARY_TEXT\\}\\}/g, JSON.stringify(data.summaryText || \'\'))',
        '.replace(/\\{\\{RAW_SUMMARY_TEXT\\}\\}/g, JSON.stringify(data.summaryText || \'\'))\n        .replace(/\\{\\{EMOJI_SUMMARY_TEXT\\}\\}/g, JSON.stringify(data.emojiSummaryText || data.summaryText || \'\'))'
      );
      htmlNode.parameters.jsCode = html;
    }
  }

  return added;
}

// --- Live workflow patchen ---
const wf = JSON.parse(fs.readFileSync(SRC, 'utf8'));
if (wf.name !== 'Lesekumpel – Neuroinclusive Story Generator') {
  throw new Error(`Unerwarteter Workflow-Name: ${wf.name}`);
}
const liveAdded = patchWorkflow(wf, 'live');

// PUT-Body bauen
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

// --- Lokale Mirror-Datei ---
const local = JSON.parse(fs.readFileSync(LOCAL_MIRROR, 'utf8'));
const localAdded = patchWorkflow(local, 'local');
fs.writeFileSync(LOCAL_MIRROR, JSON.stringify(local, null, 2), 'utf8');

console.log(JSON.stringify({
  ok: true,
  liveNodesAdded: liveAdded,
  localNodesAdded: localAdded,
  liveTotalNodes: wf.nodes.length,
  putBodyPath: PUT_BODY,
  putBodySize: fs.statSync(PUT_BODY).size,
}, null, 2));
