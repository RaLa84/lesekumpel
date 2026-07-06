// Setzt die Pip-Wortanzahl im TOP-100-WIP-Workflow (eqd4WKexrhcxsZFd) auf 10–20
// — sowohl für die Generierung ("Daten vorbereiten": personaMeta.pip.woerter)
// als auch fürs Meta-/Katalog-Label ("HTML assemblieren": personaWords.pip).
// NICHT PROD! Idempotent. Aufruf: node n8n-config/scripts/tune-top100-wordcount.mjs

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const CONFIG_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const REPO_DIR = path.resolve(CONFIG_DIR, '..');
const BASE = 'https://rala84.app.n8n.cloud/api/v1';
const WIP_ID = 'eqd4WKexrhcxsZFd';
const WIP_NAME = 'Lesekumpel – Top 100 Wörter Generator (WIP)';

const API_KEY = fs.readFileSync(path.join(CONFIG_DIR, '.env'), 'utf8').match(/^N8N_API_KEY=(.+)$/m)[1].trim();

async function api(method, p, body) {
  const res = await fetch(BASE + p, {
    method, headers: { 'X-N8N-API-KEY': API_KEY, 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`${method} ${p} -> HTTP ${res.status}: ${text.substring(0, 800)}`);
  return text ? JSON.parse(text) : null;
}

const wf = await api('GET', `/workflows/${WIP_ID}`);
if (wf.name !== WIP_NAME) throw new Error(`FALSCHER Workflow: "${wf.name}". Abbruch.`);
console.log(`Geladen: "${wf.name}" (${WIP_ID}) — aktiv: ${wf.active}`);

const edits = [
  { node: 'Daten vorbereiten', from: "woerter: '20–50'", to: "woerter: '10–20'" },
  { node: 'HTML assemblieren', from: "pip: '20–50'", to: "pip: '10–20'" },
];

let changed = 0;
for (const e of edits) {
  const n = wf.nodes.find((x) => x.name === e.node);
  if (!n) throw new Error(`Knoten fehlt: ${e.node}`);
  const code = n.parameters?.jsCode || '';
  if (code.includes(e.to)) { console.log(`= ${e.node}: bereits 10–20.`); continue; }
  if (!code.includes(e.from)) throw new Error(`${e.node}: Anker "${e.from}" nicht gefunden. Abbruch.`);
  n.parameters.jsCode = code.replace(e.from, e.to);
  changed++;
  console.log(`→ ${e.node}: "${e.from}" → "${e.to}"`);
}
if (!changed) { console.log('Nichts zu tun.'); process.exit(0); }

const backupDir = path.join(CONFIG_DIR, '_tmp');
fs.mkdirSync(backupDir, { recursive: true });
const stamp = new Date().toISOString().replace(/[:T]/g, '-').substring(0, 16);
fs.writeFileSync(path.join(backupDir, `wip-wordcount-${WIP_ID}-${stamp}.json`), JSON.stringify(wf, null, 2));

await api('PUT', `/workflows/${WIP_ID}`, {
  name: wf.name, nodes: wf.nodes, connections: wf.connections,
  settings: { executionOrder: wf.settings?.executionOrder || 'v1', ...(wf.settings?.errorWorkflow ? { errorWorkflow: wf.settings.errorWorkflow } : {}) },
});
console.log(`PUT erfolgreich — ${changed} Knoten aktualisiert.`);

const after = await api('GET', `/workflows/${WIP_ID}`);
const dv = (after.nodes.find((x) => x.name === 'Daten vorbereiten')?.parameters?.jsCode || '');
const asm = (after.nodes.find((x) => x.name === 'HTML assemblieren')?.parameters?.jsCode || '');
const ok = after.name === WIP_NAME && dv.includes("woerter: '10–20'") && asm.includes("pip: '10–20'") && after.active !== undefined;
console.log(`Verifikation: ${ok ? '✓' : '✗'} (Daten: ${dv.includes("woerter: '10–20'")}, Assemble: ${asm.includes("pip: '10–20'")})`);
fs.writeFileSync(path.join(REPO_DIR, 'n8n-config', 'workflows', 'lesekumpel-top100-generator.json'), JSON.stringify(after, null, 2));
process.exit(ok ? 0 : 1);
