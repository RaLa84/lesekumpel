// Fix: n8n speichert binary-data im "filesystem-v2"-Modus als File-Pointer,
// nicht als inline-base64. Ein Code-Knoten zwischen "Style-Ref vorbereiten"
// (httpRequest) und "Gemini Fallback Bild" löst den Pointer via
// this.helpers.getBinaryDataBuffer auf und schreibt das base64 in $json.

const fs = require('node:fs');
const path = require('node:path');

const TMP_DIR = path.resolve(__dirname, '..', '_tmp');
const SRC = path.join(TMP_DIR, 'workflow_current.json');
const PUT_BODY = path.join(TMP_DIR, 'workflow_styleref_v3.json');
const LOCAL_MIRROR = path.resolve(__dirname, '..', 'workflows', 'lesekumpel-story-generator.json');

const ENCODE_NODE_ID = 'style-ref-encode';
const ENCODE_NODE_NAME = 'Style-Ref Encode';

const ENCODE_CODE = `// Löst den n8n-binary-File-Pointer auf und gibt das base64 + mimeType ins json
const buffer = await this.helpers.getBinaryDataBuffer(0, 'data');
const base64 = buffer.toString('base64');
const mimeType = $input.first().binary?.data?.mimeType || 'image/webp';
return { json: { ...$input.first().json, styleRefBase64: base64, styleRefMimeType: mimeType } };`;

function patchWorkflow(wf, label) {
  const sr = wf.nodes.find(n => n.id === 'style-ref-prep');
  if (!sr) throw new Error(`[${label}] Style-Ref vorbereiten nicht gefunden`);
  const fb = wf.nodes.find(n => n.name === 'Gemini Fallback Bild');
  if (!fb) throw new Error(`[${label}] Gemini Fallback Bild nicht gefunden`);

  // 1. Neuen Encode-Knoten (idempotent)
  let added = 0;
  if (!wf.nodes.find(n => n.id === ENCODE_NODE_ID)) {
    wf.nodes.push({
      id: ENCODE_NODE_ID,
      name: ENCODE_NODE_NAME,
      type: 'n8n-nodes-base.code',
      typeVersion: 2,
      position: [sr.position[0] + 110, sr.position[1]],
      parameters: { jsCode: ENCODE_CODE }
    });
    added++;
  }

  // 2. Connection: Style-Ref vorbereiten → Style-Ref Encode → Gemini Fallback Bild
  wf.connections['Style-Ref vorbereiten'] = {
    main: [[{ node: ENCODE_NODE_NAME, type: 'main', index: 0 }]]
  };
  wf.connections[ENCODE_NODE_NAME] = {
    main: [[{ node: 'Gemini Fallback Bild', type: 'main', index: 0 }]]
  };

  // 3. Gemini Fallback Bild: Body nutzt $json.styleRefBase64 statt $binary
  fb.parameters.jsonBody = `={
  "contents": [{
    "parts": [
      { "inlineData": { "mimeType": {{ JSON.stringify($json.styleRefMimeType || 'image/webp') }}, "data": {{ JSON.stringify($json.styleRefBase64 || '') }} } },
      { "text": {{ JSON.stringify($json.imagePrompt || '') }} }
    ]
  }]
}`;

  return added;
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
