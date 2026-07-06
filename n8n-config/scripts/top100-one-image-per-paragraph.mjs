// Top-100-WIP (eqd4WKexrhcxsZFd): genau EIN Bild pro Abschnitt.
//  - "Bildszenen vorbereiten": imageCount = Absatzzahl; Szenen-Prompt auf 1:1 (Szene i = Absatz i, 0-basiert).
//  - "Szenen parsen": assignParagraphIndices -> Szene i -> paragraphIndex i.
// NICHT PROD. Idempotent. Ersetzungen liegen als Dateien (Escaping-sicher).
// Aufruf: node n8n-config/scripts/top100-one-image-per-paragraph.mjs <snippet-dir>

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const CONFIG = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const REPO = path.resolve(CONFIG, '..');
const BASE = 'https://rala84.app.n8n.cloud/api/v1';
const WIP_ID = 'eqd4WKexrhcxsZFd';
const WIP_NAME = 'Lesekumpel – Top 100 Wörter Generator (WIP)';
const SNIP = process.argv[2];
if (!SNIP) { console.error('Snippet-Verzeichnis als Argument angeben.'); process.exit(1); }

const KEY = fs.readFileSync(path.join(CONFIG, '.env'), 'utf8').match(/^N8N_API_KEY=(.+)$/m)[1].trim();
async function api(method, p, body) {
  const res = await fetch(BASE + p, { method, headers: { 'X-N8N-API-KEY': KEY, 'Content-Type': 'application/json' }, body: body ? JSON.stringify(body) : undefined });
  const t = await res.text();
  if (!res.ok) throw new Error(`${method} ${p} -> ${res.status}: ${t.slice(0, 600)}`);
  return t ? JSON.parse(t) : null;
}
function loadPair(name) {
  const raw = fs.readFileSync(path.join(SNIP, name), 'utf8').replace(/\r\n/g, '\n');
  const i = raw.indexOf('\n<<<NEW>>>\n');
  if (i < 0) throw new Error('Marker fehlt in ' + name);
  return { old: raw.slice(0, i), neu: raw.slice(i + '\n<<<NEW>>>\n'.length).replace(/\n$/, '') };
}

const PLAN = [
  { node: 'Bildszenen vorbereiten', files: ['r_imagecount.txt', 'r_task.txt', 'r_rules.txt', 'r_examples.txt'] },
  { node: 'Szenen parsen', files: ['r_assign.txt'] },
];

const wf = await api('GET', `/workflows/${WIP_ID}`);
if (wf.name !== WIP_NAME) throw new Error(`FALSCHER Workflow: "${wf.name}". Abbruch.`);
console.log(`Geladen: "${wf.name}" (aktiv: ${wf.active})`);

let changed = 0;
for (const step of PLAN) {
  const node = wf.nodes.find(n => n.name === step.node);
  if (!node) throw new Error('Knoten fehlt: ' + step.node);
  let code = (node.parameters.jsCode || '').replace(/\r\n/g, '\n');
  for (const f of step.files) {
    const { old, neu } = loadPair(f);
    if (code.includes(neu)) { console.log(`= ${step.node}/${f}: bereits angewandt.`); continue; }
    if (!code.includes(old)) throw new Error(`${step.node}/${f}: OLD nicht gefunden. Abbruch (nichts geändert).`);
    code = code.replace(old, neu);
    changed++;
    console.log(`→ ${step.node}/${f}: ersetzt.`);
  }
  node.parameters.jsCode = code;
}
if (!changed) { console.log('Nichts zu tun.'); process.exit(0); }

const backupDir = path.join(CONFIG, '_tmp');
fs.mkdirSync(backupDir, { recursive: true });
const stamp = new Date().toISOString().replace(/[:T]/g, '-').substring(0, 16);
fs.writeFileSync(path.join(backupDir, `wip-1img-${WIP_ID}-${stamp}.json`), JSON.stringify(wf, null, 2));

await api('PUT', `/workflows/${WIP_ID}`, {
  name: wf.name, nodes: wf.nodes, connections: wf.connections,
  settings: { executionOrder: wf.settings?.executionOrder || 'v1', ...(wf.settings?.errorWorkflow ? { errorWorkflow: wf.settings.errorWorkflow } : {}) },
});
console.log(`PUT erfolgreich — ${changed} Ersetzungen.`);

const after = await api('GET', `/workflows/${WIP_ID}`);
const bz = after.nodes.find(n => n.name === 'Bildszenen vorbereiten').parameters.jsCode;
const sp = after.nodes.find(n => n.name === 'Szenen parsen').parameters.jsCode;
const ok = after.name === WIP_NAME
  && bz.includes('genau ein Bild pro Abschnitt')
  && bz.includes('EXACTLY ONE PER PARAGRAPH')
  && sp.includes('_t100P');
console.log(`Verifikation: ${ok ? '✓' : '✗'}`);
fs.writeFileSync(path.join(REPO, 'n8n-config', 'workflows', 'lesekumpel-top100-generator.json'), JSON.stringify(after, null, 2));
process.exit(ok ? 0 : 1);
