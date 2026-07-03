// Baut Samira aus dem PROD-Workflow "Lesekumpel – Neuroinclusive Story Generator"
// (eHfC95UaMbJMcLTb) aus — NACHDEM der eigenständige Sachtext-Workflow
// (lesekumpel-sachtext-generator, mM13X2tdTIbFUgF4) erfolgreich getestet wurde.
//
// Änderungen:
//   1. Nodes löschen: "📚 Samira Wissensfreund (Sachtexte)", "⚙️ Gemini (Samira)",
//      "Wikipedia_Samira" + alle zugehörigen connections.
//   2. Switch "Welche Persona?": Regel outputKey=samira UND den positionsgleichen
//      Eintrag im connections.main-Array entfernen (KRITISCH: Array ist positions-
//      basiert — holzi/deniz/jonas rücken nach; wird paarweise verifiziert).
//   3. jsCode-Patches: samira aus personaMeta (Daten vorbereiten), aus
//      VALID_PERSONAS (Guardrail) und aus personaWords/personaAge (HTML assemblieren).
//   4. Dieselben Patches auf die Repo-Spiegel (daten-vorbereiten-v4.js,
//      guardrail-kind-safe-v2.js, assemble-html-v2.js) + lokalen Workflow-Mirror.
//
// SICHERUNG: Ohne --apply läuft nur ein Dry-Run (GET + Mutation + Verifikation in
// memory, KEIN PUT, keine lokalen Dateiänderungen).
//
// Aufruf: node n8n-config/scripts/remove-samira-from-main.mjs [--apply]

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const APPLY = process.argv.includes('--apply');
const CONFIG_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const BASE = 'https://rala84.app.n8n.cloud/api/v1';
const WF_ID = 'eHfC95UaMbJMcLTb';
const WF_NAME = 'Lesekumpel – Neuroinclusive Story Generator';
const LOCAL_MIRROR = path.join(CONFIG_DIR, 'workflows', 'lesekumpel-story-generator.json');

const REMOVE_NODES = ['📚 Samira Wissensfreund (Sachtexte)', '⚙️ Gemini (Samira)', 'Wikipedia_Samira'];
const SWITCH_NODE = 'Switch: Welche Persona?';

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

// ── jsCode-Patches (gelten identisch für n8n-Node und Repo-Datei) ──────────────
function patchDatenVorbereiten(code) {
  const re = /\n\s*samira: \{[\s\S]*?\},\n/;
  if (!re.test(code)) throw new Error('daten-vorbereiten: samira-Eintrag in personaMeta nicht gefunden');
  return code.replace(re, '\n');
}
function patchGuardrail(code) {
  if (!code.includes("'samira', ")) throw new Error("guardrail: 'samira' in VALID_PERSONAS nicht gefunden");
  return code.replace("'samira', ", '');
}
function patchAssemble(code) {
  let out = code;
  for (const re of [/\n\s*samira: '120–250',/, /\n\s*samira: '7–10',/]) {
    if (!re.test(out)) throw new Error('assemble: samira-Eintrag (personaWords/personaAge) nicht gefunden: ' + re);
    out = out.replace(re, '');
  }
  return out;
}
const NODE_PATCHES = {
  'Daten vorbereiten': patchDatenVorbereiten,
  'Guardrail: Kind-Safe + Matrix': patchGuardrail,
  'HTML assemblieren': patchAssemble,
};
const REPO_PATCHES = {
  'daten-vorbereiten-v4.js': patchDatenVorbereiten,
  'guardrail-kind-safe-v2.js': patchGuardrail,
  'assemble-html-v2.js': patchAssemble,
};

// 1) Live-Workflow laden + Namen verifizieren
const wf = await api('GET', `/workflows/${WF_ID}`);
if (wf.name !== WF_NAME) throw new Error(`Falscher Workflow geladen: "${wf.name}"`);
console.log(`Quelle: "${wf.name}" — ${wf.nodes.length} Knoten, aktiv: ${wf.active}${APPLY ? '' : '  [DRY-RUN]'}`);

// 2) Backup
const backupDir = path.join(CONFIG_DIR, '_tmp');
fs.mkdirSync(backupDir, { recursive: true });
const stamp = new Date().toISOString().replace(/[:T]/g, '-').substring(0, 16);
const backupPath = path.join(backupDir, `prod-vor-samira-rueckbau-${stamp}.json`);
fs.writeFileSync(backupPath, JSON.stringify(wf, null, 2));
console.log(`Backup: ${path.relative(process.cwd(), backupPath)}`);

// 3) Mutation in memory
const nodes = JSON.parse(JSON.stringify(wf.nodes));
const connections = JSON.parse(JSON.stringify(wf.connections));

// 3a) Erwartetes Ziel-Mapping des Switch VOR der Mutation festhalten (ohne samira)
const sw = nodes.find((n) => n.name === SWITCH_NODE);
if (!sw) throw new Error('Switch-Knoten nicht gefunden');
const rules = sw.parameters.rules.values;
const swMain = connections[SWITCH_NODE].main;
if (rules.length !== swMain.length) throw new Error(`Switch inkonsistent: ${rules.length} Regeln vs. ${swMain.length} Outputs`);
const samiraIdx = rules.findIndex((r) => r.outputKey === 'samira');
if (samiraIdx === -1) throw new Error('Switch-Regel outputKey=samira nicht gefunden');
const expectedPairs = rules
  .map((r, i) => ({ key: r.outputKey, target: swMain[i]?.[0]?.node }))
  .filter((_, i) => i !== samiraIdx);
console.log(`Switch: entferne Regel ${samiraIdx} (samira); ${expectedPairs.length} Regeln bleiben`);

// 3b) Switch-Regel + positionsgleichen connections-Eintrag entfernen
rules.splice(samiraIdx, 1);
swMain.splice(samiraIdx, 1);

// 3c) Samira-Knoten + deren connections entfernen
const removeSet = new Set(REMOVE_NODES);
for (const name of REMOVE_NODES) {
  if (!nodes.some((n) => n.name === name)) throw new Error(`Knoten fehlt: "${name}"`);
}
const keptNodes = nodes.filter((n) => !removeSet.has(n.name));
for (const name of REMOVE_NODES) delete connections[name];
for (const conn of Object.values(connections)) {
  for (const [type, outputs] of Object.entries(conn)) {
    conn[type] = outputs.map((targets) => (targets || []).filter((t) => !removeSet.has(t.node)));
  }
}
console.log(`Knoten: ${nodes.length} -> ${keptNodes.length}`);

// 3d) jsCode-Patches
for (const [nodeName, patch] of Object.entries(NODE_PATCHES)) {
  const node = keptNodes.find((n) => n.name === nodeName);
  if (!node) throw new Error(`Code-Knoten "${nodeName}" nicht gefunden`);
  node.parameters.jsCode = patch(node.parameters.jsCode);
  console.log(`jsCode gepatcht: "${nodeName}"`);
}

// 4) Verifikation (in memory)
const connStr = JSON.stringify(connections);
const nodesStr = JSON.stringify(keptNodes);
const pairsOk = sw.parameters.rules.values.every((r, i) => {
  const target = connections[SWITCH_NODE].main[i]?.[0]?.node;
  const exp = expectedPairs[i];
  return r.outputKey === exp.key && target === exp.target;
});
const checks = {
  'Regelzahl === Output-Zahl === 8': sw.parameters.rules.values.length === 8 && connections[SWITCH_NODE].main.length === 8,
  'Regel[i] <-> Ziel[i] paarweise unverändert (ohne samira)': pairsOk,
  'keine samira-Referenz mehr in connections': !REMOVE_NODES.some((n) => connStr.includes(JSON.stringify(n))),
  'keine samira-Knoten mehr': !REMOVE_NODES.some((n) => nodesStr.includes(JSON.stringify(n))),
};
console.log('\nVerifikation (in memory):');
let ok = true;
for (const [label, val] of Object.entries(checks)) {
  console.log(`  ${val ? '✓' : '✗'} ${label}`);
  if (!val) ok = false;
}
if (!ok) throw new Error('Verifikation fehlgeschlagen — kein PUT.');

if (!APPLY) {
  // Kein process.exit(): triggert auf Windows eine libuv-Assertion nach fetch()
  console.log('\nDRY-RUN beendet — nichts geändert. Mit --apply ausführen, um PROD zu patchen.');
} else {
await applyChanges();
}

async function applyChanges() {
// 5) PUT (Settings-Whitelist wie patch-samira-binnen.js)
const ALLOWED = new Set(['executionOrder', 'saveExecutionProgress', 'saveManualExecutions', 'saveDataErrorExecution', 'saveDataSuccessExecution', 'executionTimeout', 'errorWorkflow', 'timezone', 'callerPolicy', 'callerIds']);
const cleanSettings = {};
for (const [k, v] of Object.entries(wf.settings ?? {})) if (ALLOWED.has(k)) cleanSettings[k] = v;
await api('PUT', `/workflows/${WF_ID}`, { name: wf.name, nodes: keptNodes, connections, settings: cleanSettings, staticData: wf.staticData ?? null });
console.log('\n✓ PUT erfolgreich');

// 6) Repo-Spiegel patchen
for (const [file, patch] of Object.entries(REPO_PATCHES)) {
  const p = path.join(CONFIG_DIR, file);
  fs.writeFileSync(p, patch(fs.readFileSync(p, 'utf8')), 'utf8');
  console.log(`Repo-Datei gepatcht: n8n-config/${file}`);
}

// 7) Lokalen Workflow-Mirror aktualisieren + Nach-Verifikation
const after = await api('GET', `/workflows/${WF_ID}`);
fs.writeFileSync(LOCAL_MIRROR, JSON.stringify(after, null, 2));
const afterSw = after.nodes.find((n) => n.name === SWITCH_NODE);
const afterPairsOk = afterSw.parameters.rules.values.every((r, i) => {
  const target = after.connections[SWITCH_NODE].main[i]?.[0]?.node;
  const exp = expectedPairs[i];
  return r.outputKey === exp.key && target === exp.target;
});
console.log(`\nNach-Verifikation (live): Knoten ${after.nodes.length}, Switch-Paare ok: ${afterPairsOk}, aktiv: ${after.active}`);
console.log('Lokaler Mirror aktualisiert: n8n-config/workflows/lesekumpel-story-generator.json');
if (!afterPairsOk) {
  console.error(`✗ ABWEICHUNG — Backup wiederherstellen: ${backupPath}`);
  process.exitCode = 1;
  return;
}
console.log('\n✓ Rückbau abgeschlossen. Danach: neue-autorengeschichte.html (PERSONAS/PERSONA_LABELS) anpassen, prompts/samira-wissensfreund.md nach prompts/backup/ verschieben, PROD mit je einer Skill- und Bonus-Persona testen.');
}
