// Fix: HTML assemblieren liest emojiSummaryText vom Summary-Emoji parsen.
// Vorher hat es nur emojiStoryText aus Emoji parsen geholt — emojiSummaryText
// blieb undefined und der Replace fiel auf summaryText (== rawSummary) zurück.

const fs = require('node:fs');
const path = require('node:path');

const TMP_DIR = path.resolve(__dirname, '..', '_tmp');
const SRC = path.join(TMP_DIR, 'workflow_check.json');
const PUT_BODY = path.join(TMP_DIR, 'workflow_html_patched.json');
const LOCAL_MIRROR = path.resolve(__dirname, '..', 'workflows', 'lesekumpel-story-generator.json');

function patchHtmlAssembler(code) {
  // 1. Daten-Injection: füge summary-emoji-Lookup hinzu
  const oldInjection = `const emojiData = $('Emoji parsen').first().json;
const data = { ...quizData, emojiStoryText: emojiData.emojiStoryText || quizData.storyText || '' };`;

  const newInjection = `const emojiData = $('Emoji parsen').first().json;
const summaryEmojiData = $('Summary-Emoji parsen').first()?.json || {};
const data = {
  ...quizData,
  emojiStoryText: emojiData.emojiStoryText || quizData.storyText || '',
  emojiSummaryText: summaryEmojiData.emojiSummaryText || quizData.summaryText || ''
};`;

  if (!code.includes(oldInjection)) {
    throw new Error('HTML assemblieren: erwarteten Injection-Block nicht gefunden');
  }
  code = code.replace(oldInjection, newInjection);

  // 2. Indent-Bug der vorherigen Patch-Zeile glätten
  code = code.replace(
    "        .replace(/\\{\\{EMOJI_SUMMARY_TEXT\\}\\}/g, JSON.stringify(data.emojiSummaryText || data.summaryText || ''))",
    "  .replace(/\\{\\{EMOJI_SUMMARY_TEXT\\}\\}/g, JSON.stringify(data.emojiSummaryText || ''))"
  );

  return code;
}

function patchWorkflow(wf, label) {
  const html = wf.nodes.find(n => n.name === 'HTML assemblieren');
  if (!html) throw new Error(`[${label}] HTML assemblieren nicht gefunden`);
  html.parameters.jsCode = patchHtmlAssembler(html.parameters.jsCode);
}

// --- Live ---
const wf = JSON.parse(fs.readFileSync(SRC, 'utf8'));
if (wf.name !== 'Lesekumpel – Neuroinclusive Story Generator') {
  throw new Error('Falscher Workflow-Name: ' + wf.name);
}
patchWorkflow(wf, 'live');

const ALLOWED = new Set(['executionOrder','saveExecutionProgress','saveManualExecutions','saveDataErrorExecution','saveDataSuccessExecution','executionTimeout','errorWorkflow','timezone','callerPolicy','callerIds']);
const cleanSettings = {};
for (const [k, v] of Object.entries(wf.settings ?? {})) if (ALLOWED.has(k)) cleanSettings[k] = v;
const putBody = { name: wf.name, nodes: wf.nodes, connections: wf.connections, settings: cleanSettings, staticData: wf.staticData ?? null };
fs.writeFileSync(PUT_BODY, JSON.stringify(putBody, null, 2), 'utf8');

// --- Local ---
const local = JSON.parse(fs.readFileSync(LOCAL_MIRROR, 'utf8'));
patchWorkflow(local, 'local');
fs.writeFileSync(LOCAL_MIRROR, JSON.stringify(local, null, 2), 'utf8');

console.log(JSON.stringify({ ok: true, putBodyPath: PUT_BODY, putBodySize: fs.statSync(PUT_BODY).size }, null, 2));
