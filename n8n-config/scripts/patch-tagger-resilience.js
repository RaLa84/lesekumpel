// Macht Emoji-Tagger und Summary-Tagger resilient gegenüber Gemini Safety-Filter
// Blocks. Bei einem Safety-Block liefert Gemini eine leere generations-Antwort,
// und der chainLlm-Knoten crasht mit "Cannot read properties of undefined
// (reading 'message')". Mit onError=continueRegularOutput fließt stattdessen
// ein leeres item durch, das der Parser-Code via existierendem Regex-Fallback
// auffängt (rule-based emoji insertion).

const fs = require('node:fs');
const path = require('node:path');

const TMP_DIR = path.resolve(__dirname, '..', '_tmp');
const SRC = path.join(TMP_DIR, 'workflow_check.json');
const PUT_BODY = path.join(TMP_DIR, 'workflow_resilience.json');
const LOCAL_MIRROR = path.resolve(__dirname, '..', 'workflows', 'lesekumpel-story-generator.json');

function patchWorkflow(wf, label) {
  const tagger = wf.nodes.find(n => n.id === 'emoji-tagger');
  const summaryTagger = wf.nodes.find(n => n.id === 'summary-tagger');

  if (!tagger) throw new Error(`[${label}] emoji-tagger nicht gefunden`);
  if (!summaryTagger) throw new Error(`[${label}] summary-tagger nicht gefunden`);

  // n8n: onError: 'continueRegularOutput' = bei Fehler weitermachen mit normalem main-Output (leer)
  tagger.onError = 'continueRegularOutput';
  summaryTagger.onError = 'continueRegularOutput';
}

const wf = JSON.parse(fs.readFileSync(SRC, 'utf8'));
if (wf.name !== 'Lesekumpel – Neuroinclusive Story Generator') throw new Error('Falscher Workflow-Name: ' + wf.name);
patchWorkflow(wf, 'live');

const ALLOWED = new Set(['executionOrder','saveExecutionProgress','saveManualExecutions','saveDataErrorExecution','saveDataSuccessExecution','executionTimeout','errorWorkflow','timezone','callerPolicy','callerIds']);
const cleanSettings = {};
for (const [k, v] of Object.entries(wf.settings ?? {})) if (ALLOWED.has(k)) cleanSettings[k] = v;
const putBody = { name: wf.name, nodes: wf.nodes, connections: wf.connections, settings: cleanSettings, staticData: wf.staticData ?? null };
fs.writeFileSync(PUT_BODY, JSON.stringify(putBody, null, 2), 'utf8');

const local = JSON.parse(fs.readFileSync(LOCAL_MIRROR, 'utf8'));
patchWorkflow(local, 'local');
fs.writeFileSync(LOCAL_MIRROR, JSON.stringify(local, null, 2), 'utf8');

console.log(JSON.stringify({ ok: true, putBodySize: fs.statSync(PUT_BODY).size }, null, 2));
