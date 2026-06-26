// Spielt den Top-100-Pip-Prompt (prompts/pip-punkt-top100.md) in den Pip-Knoten des
// TOP-100-WIP-Workflows (eqd4WKexrhcxsZFd). NICHT der PROD-Workflow!
// Repo → n8n, niemals umgekehrt.
// Aufruf: node n8n-config/scripts/sync-top100-pip-prompt.mjs [--dry-run]

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const DRY_RUN = process.argv.includes('--dry-run');
const CONFIG_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const REPO_DIR = path.resolve(CONFIG_DIR, '..');
const BASE = 'https://rala84.app.n8n.cloud/api/v1';

// WICHTIG: WIP-Workflow, nicht PROD (eHfC95UaMbJMcLTb)!
const WIP_ID = 'eqd4WKexrhcxsZFd';
const WIP_NAME = 'Lesekumpel – Top 100 Wörter Generator (WIP)';
const NODE_NAME = '✏️ Pip Punkt (Einfach)';
const PROMPT_FILE = 'pip-punkt-top100.md';

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

const norm = (s) => s.replace(/\r\n/g, '\n').trim();

const wf = await api('GET', `/workflows/${WIP_ID}`);
if (wf.name !== WIP_NAME) throw new Error(`FALSCHER Workflow geladen: "${wf.name}" — erwartet "${WIP_NAME}". Abbruch.`);
console.log(`Geladen: "${wf.name}" (${WIP_ID}) — aktiv: ${wf.active}, ${wf.nodes.length} Knoten`);

const node = wf.nodes.find((x) => x.name === NODE_NAME);
if (!node) throw new Error(`Knoten fehlt: ${NODE_NAME}`);
const mv = node.parameters?.messages?.messageValues?.[0];
if (!mv) throw new Error(`${NODE_NAME}: messages.messageValues[0] fehlt`);

const repoPrompt = norm(fs.readFileSync(path.join(REPO_DIR, 'prompts', PROMPT_FILE), 'utf8'));
const current = norm(mv.message || '');

if (current === repoPrompt) { console.log('= Prompt bereits identisch — kein PUT nötig.'); process.exit(0); }
console.log(`→ Prompt unterschiedlich (${current.length} → ${repoPrompt.length} Zeichen)`);
if (DRY_RUN) { console.log('[dry-run] Würde Pip-Knoten aktualisieren — kein PUT.'); process.exit(0); }

// Backup
const backupDir = path.join(CONFIG_DIR, '_tmp');
fs.mkdirSync(backupDir, { recursive: true });
const stamp = new Date().toISOString().replace(/[:T]/g, '-').substring(0, 16);
fs.writeFileSync(path.join(backupDir, `wip-${WIP_ID}-${stamp}.json`), JSON.stringify(wf, null, 2));

mv.message = repoPrompt;

await api('PUT', `/workflows/${WIP_ID}`, {
  name: wf.name,
  nodes: wf.nodes,
  connections: wf.connections,
  settings: {
    executionOrder: wf.settings?.executionOrder || 'v1',
    ...(wf.settings?.errorWorkflow ? { errorWorkflow: wf.settings.errorWorkflow } : {}),
  },
});
console.log('PUT erfolgreich — Pip-Knoten aktualisiert.');

// Verifikation
const after = await api('GET', `/workflows/${WIP_ID}`);
const afterMsg = norm(after.nodes.find((x) => x.name === NODE_NAME)?.parameters?.messages?.messageValues?.[0]?.message || '');
const ok = after.name === WIP_NAME && afterMsg === repoPrompt && after.active === false;
console.log(`Verifikation: ${ok ? '✓' : '✗'} (Name ok: ${after.name === WIP_NAME}, Prompt ok: ${afterMsg === repoPrompt}, inaktiv: ${after.active === false})`);

// Lokale Referenzkopie aktualisieren
fs.writeFileSync(path.join(REPO_DIR, 'n8n-config', 'workflows', 'lesekumpel-top100-generator.json'), JSON.stringify(after, null, 2));
process.exit(ok ? 0 : 1);
