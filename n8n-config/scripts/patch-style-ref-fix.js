// Fix: "Style-Ref vorbereiten"-Knoten von Code (mit fetch) zu httpRequest umbauen.
// fetch() ist in n8n's Code-Sandbox nicht verfügbar. Stattdessen ein
// httpRequest-Knoten der das Bild als binary holt — n8n speichert binary
// automatisch als base64 unter $binary.data.data, und der nachfolgende
// "Gemini Fallback Bild"-httpRequest referenziert das direkt im Body.

const fs = require('node:fs');
const path = require('node:path');

const TMP_DIR = path.resolve(__dirname, '..', '_tmp');
const SRC = path.join(TMP_DIR, 'workflow_current.json');
const PUT_BODY = path.join(TMP_DIR, 'workflow_styleref_v2.json');
const LOCAL_MIRROR = path.resolve(__dirname, '..', 'workflows', 'lesekumpel-story-generator.json');

function patchWorkflow(wf, label) {
  // 1. Style-Ref vorbereiten: Code → httpRequest
  const sr = wf.nodes.find(n => n.id === 'style-ref-prep');
  if (!sr) throw new Error(`[${label}] Style-Ref vorbereiten nicht gefunden`);
  sr.type = 'n8n-nodes-base.httpRequest';
  sr.typeVersion = 4.2;
  sr.parameters = {
    method: 'GET',
    url: '={{ $json.styleRefUrl || $(\'Bildszenen vorbereiten\').first().json.styleRefUrl }}',
    options: {
      response: {
        response: {
          responseFormat: 'file',
          outputPropertyName: 'data'
        }
      },
      timeout: 30000
    }
  };
  // Keine Auth nötig (öffentliche GitHub-Pages-URL)
  delete sr.credentials;

  // 2. Gemini Fallback Bild: Body so umbauen, dass er $binary.data nutzt
  const fb = wf.nodes.find(n => n.name === 'Gemini Fallback Bild');
  if (!fb) throw new Error(`[${label}] Gemini Fallback Bild nicht gefunden`);
  fb.parameters.jsonBody = `={
  "contents": [{
    "parts": [
      { "inlineData": { "mimeType": {{ JSON.stringify($binary.data.mimeType || 'image/webp') }}, "data": {{ JSON.stringify($binary.data.data || '') }} } },
      { "text": {{ JSON.stringify($json.imagePrompt || '') }} }
    ]
  }]
}`;

  return 0;
}

// --- Live ---
const wf = JSON.parse(fs.readFileSync(SRC, 'utf8'));
if (wf.name !== 'Lesekumpel – Neuroinclusive Story Generator') throw new Error('Falscher Workflow-Name: ' + wf.name);
patchWorkflow(wf, 'live');

const ALLOWED = new Set(['executionOrder','saveExecutionProgress','saveManualExecutions','saveDataErrorExecution','saveDataSuccessExecution','executionTimeout','errorWorkflow','timezone','callerPolicy','callerIds']);
const cleanSettings = {};
for (const [k, v] of Object.entries(wf.settings ?? {})) if (ALLOWED.has(k)) cleanSettings[k] = v;
const putBody = { name: wf.name, nodes: wf.nodes, connections: wf.connections, settings: cleanSettings, staticData: wf.staticData ?? null };
fs.writeFileSync(PUT_BODY, JSON.stringify(putBody, null, 2), 'utf8');

// --- Local mirror ---
const local = JSON.parse(fs.readFileSync(LOCAL_MIRROR, 'utf8'));
patchWorkflow(local, 'local');
fs.writeFileSync(LOCAL_MIRROR, JSON.stringify(local, null, 2), 'utf8');

console.log(JSON.stringify({ ok: true, putBodySize: fs.statSync(PUT_BODY).size }, null, 2));
