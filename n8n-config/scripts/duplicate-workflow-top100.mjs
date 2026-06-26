// Dupliziert den Live-Workflow "Lesekumpel – Neuroinclusive Story Generator" zu einer
// eigenständigen, INAKTIVEN Kopie "Lesekumpel – Top 100 Wörter Generator (WIP)".
// Die Kopie bekommt einen eigenen Webhook-Pfad (lesekumpel-top100), damit kein Pfad-Konflikt
// mit dem Original entsteht. Credentials-Referenzen der Knoten bleiben erhalten (geerbt).
// Original bleibt unangetastet. Kein Trigger/Execute/Activate.
//
// Aufruf: node n8n-config/scripts/duplicate-workflow-top100.mjs

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const CONFIG_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const REPO_DIR = path.resolve(CONFIG_DIR, '..');
const BASE = 'https://rala84.app.n8n.cloud/api/v1';

const SOURCE_ID = 'eHfC95UaMbJMcLTb';
const SOURCE_NAME = 'Lesekumpel – Neuroinclusive Story Generator';
const NEW_NAME = 'Lesekumpel – Top 100 Wörter Generator (WIP)';
const NEW_WEBHOOK_PATH = 'lesekumpel-top100';

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

// 1) Quelle laden + verifizieren
const src = await api('GET', `/workflows/${SOURCE_ID}`);
if (src.name !== SOURCE_NAME) throw new Error(`Falscher Quell-Workflow geladen: "${src.name}"`);
console.log(`Quelle geladen: "${src.name}" — ${src.nodes.length} Knoten, aktiv: ${src.active}`);

// 2) Backup der Quelle
const backupDir = path.join(CONFIG_DIR, '_tmp');
fs.mkdirSync(backupDir, { recursive: true });
const stamp = new Date().toISOString().replace(/[:T]/g, '-').substring(0, 16);
fs.writeFileSync(path.join(backupDir, `source-${SOURCE_ID}-${stamp}.json`), JSON.stringify(src, null, 2));

// 3) Knoten klonen + Webhook-Pfad/-Id anpassen
const nodes = JSON.parse(JSON.stringify(src.nodes));
const webhookNodes = nodes.filter((n) => n.type === 'n8n-nodes-base.webhook');
if (webhookNodes.length === 0) throw new Error('Kein Webhook-Knoten gefunden — abgebrochen.');
for (const n of webhookNodes) {
  const oldPath = n.parameters?.path;
  n.parameters.path = NEW_WEBHOOK_PATH;
  n.webhookId = crypto.randomUUID();
  console.log(`Webhook "${n.name}": path "${oldPath}" → "${NEW_WEBHOOK_PATH}", neue webhookId`);
}

// 4) POST-Payload: nur erlaubte Felder (id/active/tags/... weglassen → sonst HTTP 400)
const payload = {
  name: NEW_NAME,
  nodes,
  connections: src.connections,
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
fs.writeFileSync(path.join(REPO_DIR, 'n8n-config', 'workflows', 'lesekumpel-top100-generator.json'), JSON.stringify(full, null, 2));
console.log(`\nLokale Referenz gespeichert: n8n-config/workflows/lesekumpel-top100-generator.json`);

// 7) Verifikation
const wh = full.nodes.find((n) => n.type === 'n8n-nodes-base.webhook');
const ok = full.name === NEW_NAME && full.active === false && wh?.parameters?.path === NEW_WEBHOOK_PATH && full.nodes.length === src.nodes.length;
console.log(`\nVerifikation: ${ok ? '✓ alles korrekt' : '✗ Abweichung!'}`);
console.log(`  Name === "${NEW_NAME}": ${full.name === NEW_NAME}`);
console.log(`  active === false: ${full.active === false}`);
console.log(`  webhook.path === "${NEW_WEBHOOK_PATH}": ${wh?.parameters?.path === NEW_WEBHOOK_PATH}`);
console.log(`  Knotenzahl ${full.nodes.length} === ${src.nodes.length}: ${full.nodes.length === src.nodes.length}`);
process.exit(ok ? 0 : 1);
