// Erstellt den eigenständigen, INAKTIVEN Sachtext-Workflow "Lesekumpel – Sachtext-Generator (Samira)"
// als Klon des Live-Workflows "Lesekumpel – Neuroinclusive Story Generator" (eHfC95UaMbJMcLTb).
//
// Transformation gegenüber der Quelle:
//   1. Webhook-Pfad -> lesekumpel-sachtext, neue webhookId (kein Pfad-Konflikt).
//   2. 17 Knoten entfernt: "Switch: Welche Persona?" + 8 Persona-chainLlm + deren 8 Gemini-LLMs.
//      Samira (Agent + Wikipedia-Tool + Gemini 2.5 Pro) bleibt als einziger Autor-Zweig.
//   3. Rewire: "Daten vorbereiten" -> direkt "📚 Samira Wissensfreund (Sachtexte)".
//   4. jsCode-Austausch aus den Repo-Dateien *-sachtext-v1.js (Quelle der Wahrheit):
//      Daten vorbereiten, Guardrail, Geschichte parsen, Bildszenen vorbereiten, HTML assemblieren.
//   5. Samira-Agent options.systemMessage <- prompts/samira-sachtext.md.
//   6. "GitHub: Template laden" -> demo-template-sachtext.html.
//
// Original bleibt unangetastet. Kein Trigger/Execute/Activate.
//
// Aufruf: node n8n-config/scripts/create-sachtext-workflow.mjs

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const CONFIG_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const REPO_DIR = path.resolve(CONFIG_DIR, '..');
const BASE = 'https://rala84.app.n8n.cloud/api/v1';

const SOURCE_ID = 'eHfC95UaMbJMcLTb';
const SOURCE_NAME = 'Lesekumpel – Neuroinclusive Story Generator';
const NEW_NAME = 'Lesekumpel – Sachtext-Generator (Samira)';
const NEW_WEBHOOK_PATH = 'lesekumpel-sachtext';
const SAMIRA_AGENT = '📚 Samira Wissensfreund (Sachtexte)';
const TEMPLATE_URL = 'https://raw.githubusercontent.com/RaLa84/lesekumpel/main/n8n-config/demo-template-sachtext.html';
const LOCAL_REF = path.join(REPO_DIR, 'n8n-config', 'workflows', 'lesekumpel-sachtext-generator.json');

const REMOVE_NODES = [
  'Switch: Welche Persona?',
  '✏️ Pip Punkt (Einfach)', '⚙️ Gemini (Pip)',
  '🌉 Mia Mitte (Flüssig)', '⚙️ Gemini (Mia)',
  '📜 Peter Past (Erzählzeit)', '⚙️ Gemini (Peter)',
  '🎭 Stella Stimmenreich (Dialoge)', '⚙️ Gemini (Stella)',
  '🪶 Finja Feder (Anspruchsvoll)', '⚙️ Gemini (Finja)',
  '🎮 Holzi Pixelkopf (Tech/Gaming)', '⚙️ Gemini (Holzi)',
  '🌙 Deniz Traumfänger (Fantasy)', '⚙️ Gemini (Deniz)',
  '🧭 Jonas Entdecker (Abenteuer)', '⚙️ Gemini (Jonas)',
];

const JSCODE_SWAPS = {
  'Daten vorbereiten': 'daten-vorbereiten-sachtext-v1.js',
  'Guardrail: Kind-Safe + Matrix': 'guardrail-sachtext-v1.js',
  'Geschichte parsen': 'geschichte-parsen-sachtext-v1.js',
  'Bildszenen vorbereiten': 'bildszenen-vorbereiten-sachtext-v1.js',
  'HTML assemblieren': 'assemble-html-sachtext-v1.js',
};

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

// 1) Quelle laden + Namen verifizieren
const src = await api('GET', `/workflows/${SOURCE_ID}`);
if (src.name !== SOURCE_NAME) throw new Error(`Falscher Quell-Workflow geladen: "${src.name}"`);
console.log(`Quelle geladen: "${src.name}" — ${src.nodes.length} Knoten, aktiv: ${src.active}`);

// 2) Backup der Quelle
const backupDir = path.join(CONFIG_DIR, '_tmp');
fs.mkdirSync(backupDir, { recursive: true });
const stamp = new Date().toISOString().replace(/[:T]/g, '-').substring(0, 16);
fs.writeFileSync(path.join(backupDir, `source-${SOURCE_ID}-${stamp}.json`), JSON.stringify(src, null, 2));

// 3) Knoten klonen
let nodes = JSON.parse(JSON.stringify(src.nodes));
const connections = JSON.parse(JSON.stringify(src.connections));

// 3a) Webhook-Pfad + neue webhookId
const webhookNodes = nodes.filter((n) => n.type === 'n8n-nodes-base.webhook');
if (webhookNodes.length === 0) throw new Error('Kein Webhook-Knoten gefunden — abgebrochen.');
for (const n of webhookNodes) {
  const oldPath = n.parameters?.path;
  n.parameters.path = NEW_WEBHOOK_PATH;
  n.webhookId = crypto.randomUUID();
  console.log(`Webhook "${n.name}": path "${oldPath}" → "${NEW_WEBHOOK_PATH}", neue webhookId`);
}

// 3b) Persona-Knoten + Switch entfernen
const byName = new Map(nodes.map((n) => [n.name, n]));
for (const name of REMOVE_NODES) {
  if (!byName.has(name)) throw new Error(`Zu entfernender Knoten fehlt in der Quelle: "${name}"`);
}
const removeSet = new Set(REMOVE_NODES);
nodes = nodes.filter((n) => !removeSet.has(n.name));
for (const name of REMOVE_NODES) delete connections[name];
for (const [srcName, conn] of Object.entries(connections)) {
  for (const [connType, outputs] of Object.entries(conn)) {
    conn[connType] = outputs.map((targets) => (targets || []).filter((t) => !removeSet.has(t.node)));
  }
  void srcName;
}
console.log(`Entfernt: ${REMOVE_NODES.length} Knoten -> ${nodes.length} verbleibend`);

// 3c) Rewire: Daten vorbereiten -> Samira-Agent
const dv = connections['Daten vorbereiten'];
if (!dv?.main?.[0]) throw new Error('Verbindung "Daten vorbereiten".main[0] nicht gefunden.');
if (dv.main[0].length !== 0) throw new Error(`"Daten vorbereiten".main[0] zeigt noch auf: ${JSON.stringify(dv.main[0])}`);
dv.main[0] = [{ node: SAMIRA_AGENT, type: 'main', index: 0 }];
console.log(`Rewire: "Daten vorbereiten" -> "${SAMIRA_AGENT}"`);

// 3d) jsCode aus Repo-Dateien einsetzen
for (const [nodeName, file] of Object.entries(JSCODE_SWAPS)) {
  const node = nodes.find((n) => n.name === nodeName);
  if (!node) throw new Error(`Code-Knoten "${nodeName}" nicht gefunden.`);
  const code = fs.readFileSync(path.join(CONFIG_DIR, file), 'utf8');
  node.parameters.jsCode = code;
  console.log(`jsCode: "${nodeName}" <- n8n-config/${file} (${code.length} Zeichen)`);
}

// 3e) Samira-Systemprompt aus prompts/samira-sachtext.md
const samiraNode = nodes.find((n) => n.name === SAMIRA_AGENT);
if (!samiraNode) throw new Error(`Samira-Agent "${SAMIRA_AGENT}" nicht gefunden.`);
if (!samiraNode.parameters?.options?.systemMessage) throw new Error('Samira-Agent hat kein options.systemMessage.');
const prompt = fs.readFileSync(path.join(REPO_DIR, 'prompts', 'samira-sachtext.md'), 'utf8');
samiraNode.parameters.options.systemMessage = prompt;
console.log(`systemMessage: Samira-Agent <- prompts/samira-sachtext.md (${prompt.length} Zeichen)`);

// 3f) Template-URL auf Sachtext-Template
const tplNode = nodes.find((n) => n.name === 'GitHub: Template laden');
if (!tplNode) throw new Error('Knoten "GitHub: Template laden" nicht gefunden.');
tplNode.parameters.url = TEMPLATE_URL;
console.log(`Template-URL: ${TEMPLATE_URL}`);

// 4) POST-Payload: nur erlaubte Felder (id/active/tags/... weglassen → sonst HTTP 400)
const payload = {
  name: NEW_NAME,
  nodes,
  connections,
  settings: {
    executionOrder: src.settings?.executionOrder || 'v1',
    ...(src.settings?.errorWorkflow ? { errorWorkflow: src.settings.errorWorkflow } : {}),
  },
};

// 5) Kopie anlegen (inaktiv)
const created = await api('POST', '/workflows', payload);
console.log(`\n✓ Kopie erstellt: "${created.name}"`);
console.log(`  ID:     ${created.id}`);
console.log(`  Aktiv:  ${created.active}`);
console.log(`  Editor: ${BASE.replace('/api/v1', '')}/workflow/${created.id}`);
console.log(`  Webhook (nach Aktivierung): ${BASE.replace('/api/v1', '')}/webhook/${NEW_WEBHOOK_PATH}`);

// 6) Lokale Referenzkopie speichern
const full = await api('GET', `/workflows/${created.id}`);
fs.writeFileSync(LOCAL_REF, JSON.stringify(full, null, 2));
console.log(`\nLokale Referenz gespeichert: n8n-config/workflows/lesekumpel-sachtext-generator.json`);

// 7) Verifikation
const wh = full.nodes.find((n) => n.type === 'n8n-nodes-base.webhook');
const expectedCount = src.nodes.length - REMOVE_NODES.length;
const connStr = JSON.stringify(full.connections);
const staleRefs = REMOVE_NODES.filter((n) => connStr.includes(JSON.stringify(n)));
const fullSamira = full.nodes.find((n) => n.name === SAMIRA_AGENT);
const dvTarget = full.connections['Daten vorbereiten']?.main?.[0]?.[0]?.node;
const fullTpl = full.nodes.find((n) => n.name === 'GitHub: Template laden');
const codeOk = Object.entries(JSCODE_SWAPS).every(([nodeName, file]) => {
  const node = full.nodes.find((n) => n.name === nodeName);
  return node?.parameters?.jsCode === fs.readFileSync(path.join(CONFIG_DIR, file), 'utf8');
});

const checks = {
  [`Name === "${NEW_NAME}"`]: full.name === NEW_NAME,
  'active === false': full.active === false,
  [`webhook.path === "${NEW_WEBHOOK_PATH}"`]: wh?.parameters?.path === NEW_WEBHOOK_PATH,
  [`Knotenzahl ${full.nodes.length} === ${expectedCount}`]: full.nodes.length === expectedCount,
  'keine Verbindung referenziert entfernte Knoten': staleRefs.length === 0,
  '"Daten vorbereiten" -> Samira-Agent': dvTarget === SAMIRA_AGENT,
  'systemMessage === prompts/samira-sachtext.md': fullSamira?.parameters?.options?.systemMessage === prompt,
  'Template-URL == demo-template-sachtext.html': fullTpl?.parameters?.url === TEMPLATE_URL,
  'jsCode aller 5 Code-Knoten == Repo-Dateien': codeOk,
};
console.log('\nVerifikation:');
let ok = true;
for (const [label, val] of Object.entries(checks)) {
  console.log(`  ${val ? '✓' : '✗'} ${label}`);
  if (!val) ok = false;
}
if (staleRefs.length) console.log(`  Stale-Referenzen: ${staleRefs.join(', ')}`);
console.log(ok ? '\n✓ alles korrekt' : '\n✗ Abweichung!');
process.exit(ok ? 0 : 1);
