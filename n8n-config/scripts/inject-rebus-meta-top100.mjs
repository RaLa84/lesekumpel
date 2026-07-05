// Injiziert <meta name="rebus-icons" content="1"> in den "HTML assemblieren"-Knoten
// des TOP-100-WIP-Workflows (eqd4WKexrhcxsZFd) — NICHT PROD!
// Dadurch aktiviert das geteilte Story-Template die Rebus-Icons nur für Top-100-Stories.
// Idempotent (überspringt, wenn schon vorhanden). Aufruf: node n8n-config/scripts/inject-rebus-meta-top100.mjs

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const CONFIG_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const REPO_DIR = path.resolve(CONFIG_DIR, '..');
const BASE = 'https://rala84.app.n8n.cloud/api/v1';

const WIP_ID = 'eqd4WKexrhcxsZFd';
const WIP_NAME = 'Lesekumpel – Top 100 Wörter Generator (WIP)';
const NODE_NAME = 'HTML assemblieren';

const API_KEY = fs.readFileSync(path.join(CONFIG_DIR, '.env'), 'utf8').match(/^N8N_API_KEY=(.+)$/m)[1].trim();

async function api(method, p, body) {
  const res = await fetch(BASE + p, {
    method,
    headers: { 'X-N8N-API-KEY': API_KEY, 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`${method} ${p} -> HTTP ${res.status}: ${text.substring(0, 800)}`);
  return text ? JSON.parse(text) : null;
}

const wf = await api('GET', `/workflows/${WIP_ID}`);
if (wf.name !== WIP_NAME) throw new Error(`FALSCHER Workflow: "${wf.name}" — erwartet "${WIP_NAME}". Abbruch.`);
console.log(`Geladen: "${wf.name}" (${WIP_ID}) — aktiv: ${wf.active}`);

const node = wf.nodes.find((n) => n.name === NODE_NAME);
if (!node) throw new Error(`Knoten fehlt: ${NODE_NAME}`);
let code = node.parameters?.jsCode;
if (typeof code !== 'string') throw new Error(`${NODE_NAME}: jsCode fehlt`);

if (code.includes('rebus-icons')) { console.log('= Meta-Injektion bereits vorhanden — nichts zu tun.'); process.exit(0); }

const anchor = "const htmlBase64 = Buffer.from(template, 'utf8').toString('base64');";
if (!code.includes(anchor)) throw new Error('Anker (htmlBase64-Zeile) nicht gefunden — Knoten geändert? Abbruch.');

// Meta vor der base64-Berechnung ins <head> einfügen (nur Top-100).
const injection = "// Rebus-Icons für Top-100-Stories aktivieren (geteiltes Template liest dieses Meta-Flag):\ntemplate = template.replace('</head>', '  <meta name=\"rebus-icons\" content=\"1\">\\n</head>');\n";
node.parameters.jsCode = code.replace(anchor, injection + anchor);

// Backup
const backupDir = path.join(CONFIG_DIR, '_tmp');
fs.mkdirSync(backupDir, { recursive: true });
const stamp = new Date().toISOString().replace(/[:T]/g, '-').substring(0, 16);
fs.writeFileSync(path.join(backupDir, `wip-rebus-${WIP_ID}-${stamp}.json`), JSON.stringify(wf, null, 2));

await api('PUT', `/workflows/${WIP_ID}`, {
  name: wf.name,
  nodes: wf.nodes,
  connections: wf.connections,
  settings: {
    executionOrder: wf.settings?.executionOrder || 'v1',
    ...(wf.settings?.errorWorkflow ? { errorWorkflow: wf.settings.errorWorkflow } : {}),
  },
});
console.log('PUT erfolgreich — Meta-Injektion eingebaut.');

const after = await api('GET', `/workflows/${WIP_ID}`);
const ok = after.name === WIP_NAME && after.active === false &&
  (after.nodes.find((n) => n.name === NODE_NAME)?.parameters?.jsCode || '').includes('rebus-icons');
console.log(`Verifikation: ${ok ? '✓' : '✗'} (Name ok: ${after.name === WIP_NAME}, inaktiv: ${after.active === false}, Meta drin: ${(after.nodes.find((n) => n.name === NODE_NAME)?.parameters?.jsCode || '').includes('rebus-icons')})`);

fs.writeFileSync(path.join(REPO_DIR, 'n8n-config', 'workflows', 'lesekumpel-top100-generator.json'), JSON.stringify(after, null, 2));
process.exit(ok ? 0 : 1);
