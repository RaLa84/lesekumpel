// Synct die Persona-Systemprompts aus prompts/*.md (Single Source of Truth) in die n8n-Knoten.
// Repo → n8n, niemals umgekehrt. Samira (agent v1.9) nutzt options.systemMessage,
// alle anderen chainLlm-Knoten messages.messageValues[0].message.
// Aufruf: node n8n-config/scripts/sync-prompts-repo-to-n8n.mjs [--dry-run]

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const DRY_RUN = process.argv.includes('--dry-run');
const CONFIG_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const REPO_DIR = path.resolve(CONFIG_DIR, '..');
const BASE = 'https://rala84.app.n8n.cloud/api/v1';
const MAIN_ID = 'eHfC95UaMbJMcLTb';
const MAIN_NAME = 'Lesekumpel – Neuroinclusive Story Generator';

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

// Knotenname -> [Prompt-Datei, Prompt-Ziel]
const MAP = [
  ['✏️ Pip Punkt (Einfach)', 'pip-punkt.md', 'message'],
  ['🌉 Mia Mitte (Flüssig)', 'mia-mitte.md', 'message'],
  ['📜 Peter Past (Erzählzeit)', 'peter-past.md', 'message'],
  ['🎭 Stella Stimmenreich (Dialoge)', 'stella-stimmenreich.md', 'message'],
  ['🪶 Finja Feder (Anspruchsvoll)', 'finja-feder.md', 'message'],
  ['📚 Samira Wissensfreund (Sachtexte)', 'samira-wissensfreund.md', 'systemMessage'],
  ['🎮 Holzi Pixelkopf (Tech/Gaming)', 'holzi-pixelkopf.md', 'message'],
  ['🌙 Deniz Traumfänger (Fantasy)', 'deniz-traumfaenger.md', 'message'],
  ['🧭 Jonas Entdecker (Abenteuer)', 'jonas-entdecker.md', 'message'],
];

const norm = (s) => s.replace(/\r\n/g, '\n').trim();

const wf = await api('GET', `/workflows/${MAIN_ID}`);
if (wf.name !== MAIN_NAME) throw new Error(`Falscher Workflow geladen: "${wf.name}"`);
console.log(`Geladen: "${wf.name}" — ${wf.nodes.length} Knoten`);

const backupDir = path.join(CONFIG_DIR, '_tmp');
fs.mkdirSync(backupDir, { recursive: true });
const stamp = new Date().toISOString().replace(/[:T]/g, '-').substring(0, 16);
fs.writeFileSync(path.join(backupDir, `backup-${MAIN_ID}-${stamp}.json`), JSON.stringify(wf, null, 2));

let changed = 0;
for (const [nodeName, file, target] of MAP) {
  const n = wf.nodes.find((x) => x.name === nodeName);
  if (!n) throw new Error(`Knoten fehlt: ${nodeName}`);
  const repoPrompt = norm(fs.readFileSync(path.join(REPO_DIR, 'prompts', file), 'utf8'));

  let current;
  if (target === 'systemMessage') {
    current = norm(n.parameters?.options?.systemMessage || '');
    if (current !== repoPrompt) { n.parameters.options.systemMessage = repoPrompt; changed++; }
  } else {
    const mv = n.parameters?.messages?.messageValues?.[0];
    if (!mv) throw new Error(`${nodeName}: messages.messageValues[0] fehlt`);
    current = norm(mv.message || '');
    if (current !== repoPrompt) { mv.message = repoPrompt; changed++; }
  }
  console.log(`${current === repoPrompt ? '=' : '→'} ${file} (${current === repoPrompt ? 'identisch' : 'aktualisiert, ' + current.length + ' → ' + repoPrompt.length + ' Zeichen'})`);
}

if (changed === 0) { console.log('Alles synchron — kein PUT nötig.'); process.exit(0); }
if (DRY_RUN) { console.log(`[dry-run] ${changed} Knoten würden aktualisiert — kein PUT.`); process.exit(0); }

await api('PUT', `/workflows/${MAIN_ID}`, {
  name: wf.name,
  nodes: wf.nodes,
  connections: wf.connections,
  settings: { executionOrder: wf.settings.executionOrder || 'v1', errorWorkflow: wf.settings.errorWorkflow },
});
console.log(`PUT erfolgreich — ${changed} Persona-Prompts aktualisiert.`);

// Verifikation
const after = await api('GET', `/workflows/${MAIN_ID}`);
let ok = true;
for (const [nodeName, file, target] of MAP) {
  const n = after.nodes.find((x) => x.name === nodeName);
  const repoPrompt = norm(fs.readFileSync(path.join(REPO_DIR, 'prompts', file), 'utf8'));
  const current = norm(target === 'systemMessage' ? n.parameters?.options?.systemMessage || '' : n.parameters?.messages?.messageValues?.[0]?.message || '');
  const pass = current === repoPrompt;
  console.log(`${pass ? '✓' : '✗'} ${file}`);
  if (!pass) ok = false;
}
if (after.settings.errorWorkflow !== wf.settings.errorWorkflow) { console.log('✗ errorWorkflow verloren!'); ok = false; }
if (after.active !== true) { console.log('✗ Workflow nicht mehr aktiv!'); ok = false; }
process.exit(ok ? 0 : 1);
