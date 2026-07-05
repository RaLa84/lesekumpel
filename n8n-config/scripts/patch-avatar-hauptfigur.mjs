// Patch 2026-07-05: Avatar-Hauptfigur ("Mein Avatar ist die Hauptfigur")
//
// Neues optionales Webhook-Feld "Hauptfigur" { name, typ, alter, merkmale } —
// 4 Code-Knoten werden auf die neuen Versionen gehoben:
//  - Guardrail: Kind-Safe + Matrix  → guardrail-kind-safe-v3.js   (Feld-Validierung)
//  - Daten vorbereiten              → daten-vorbereiten-v5.js     (HAUPTFIGUR-Block + avatarCharacter + Slug)
//  - Story-Elemente vorbereiten     → story-elements-vorbereiten-v3.js (KNOWN MAIN CHARACTER)
//  - Elemente parsen                → elemente-parsen-v3.js       (deterministischer main-Override → VISUAL LOCK)
// Ohne Hauptfigur-Feld verhält sich der Workflow identisch zu vorher.
//
// Sicherungen: Name-Verifikation, Backup nach _tmp/, Drift-Check gegen die
// alten Referenzdateien (Abbruch bei unerwartetem Live-Stand, außer --force),
// Repo-Spiegel (workflows/lesekumpel-story-generator.json) wird aus der
// PUT-Verifikation neu geschrieben.
//
// Aufruf: node n8n-config/scripts/patch-avatar-hauptfigur.mjs [--dry-run] [--force]

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const DRY_RUN = process.argv.includes('--dry-run');
const FORCE = process.argv.includes('--force');
const CONFIG_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const BASE = 'https://rala84.app.n8n.cloud/api/v1';
const MAIN_ID = 'eHfC95UaMbJMcLTb';
const MAIN_NAME = 'Lesekumpel – Neuroinclusive Story Generator';
const MIRROR_PATH = path.join(CONFIG_DIR, 'workflows', 'lesekumpel-story-generator.json');

const envText = fs.readFileSync(path.join(CONFIG_DIR, '.env'), 'utf8');
const API_KEY = envText.match(/^N8N_API_KEY=(.+)$/m)[1].trim();

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

// ── 1. Haupt-Workflow laden + verifizieren + sichern ──────────────────────
const wf = await api('GET', `/workflows/${MAIN_ID}`);
if (wf.name !== MAIN_NAME) throw new Error(`Falscher Workflow geladen: "${wf.name}" (erwartet: "${MAIN_NAME}")`);
console.log(`Geladen: "${wf.name}" — ${wf.nodes.length} Knoten`);

const backupDir = path.join(CONFIG_DIR, '_tmp');
fs.mkdirSync(backupDir, { recursive: true });
const stamp = new Date().toISOString().replace(/[:T]/g, '-').substring(0, 16);
const backupPath = path.join(backupDir, `backup-${MAIN_ID}-${stamp}.json`);
fs.writeFileSync(backupPath, JSON.stringify(wf, null, 2));
console.log(`Backup: ${backupPath}`);

const node = (name) => {
  const n = wf.nodes.find((x) => x.name === name);
  if (!n) throw new Error(`Knoten fehlt: ${name}`);
  return n;
};

// ── 2. Knoten-Code austauschen (mit Drift-Check gegen alte Referenz) ──────
const PATCHES = [
  { nodeName: 'Guardrail: Kind-Safe + Matrix', oldFile: 'guardrail-kind-safe-v2.js', newFile: 'guardrail-kind-safe-v3.js' },
  { nodeName: 'Daten vorbereiten', oldFile: 'daten-vorbereiten-v4.js', newFile: 'daten-vorbereiten-v5.js' },
  { nodeName: 'Story-Elemente vorbereiten', oldFile: 'story-elements-vorbereiten-v2.js', newFile: 'story-elements-vorbereiten-v3.js' },
  { nodeName: 'Elemente parsen', oldFile: 'elemente-parsen-v2.js', newFile: 'elemente-parsen-v3.js' },
];

const norm = (s) => String(s || '').replace(/\r\n/g, '\n').trim();

for (const p of PATCHES) {
  const n = node(p.nodeName);
  const live = norm(n.parameters.jsCode);
  const oldRef = norm(fs.readFileSync(path.join(CONFIG_DIR, p.oldFile), 'utf8'));
  if (live !== oldRef) {
    const msg = `Drift: Live-Code von "${p.nodeName}" weicht von ${p.oldFile} ab — Live-Stand prüfen!`;
    if (!FORCE) {
      fs.writeFileSync(path.join(backupDir, `drift-${p.nodeName.replace(/[^a-z0-9]+/gi, '-')}.js`), n.parameters.jsCode);
      throw new Error(msg + ` (Live-Code nach _tmp/ geschrieben; mit --force überschreiben)`);
    }
    console.warn(`⚠ ${msg} (--force: wird überschrieben)`);
  }
  n.parameters.jsCode = fs.readFileSync(path.join(CONFIG_DIR, p.newFile), 'utf8');
  console.log(`✓ ${p.nodeName} ← ${p.newFile}`);
}

// ── 3. Deploy ─────────────────────────────────────────────────────────────
const payload = { name: wf.name, nodes: wf.nodes, connections: wf.connections, settings: wf.settings };

if (DRY_RUN) {
  fs.writeFileSync(path.join(backupDir, 'dry-run-avatar-payload.json'), JSON.stringify(payload, null, 2));
  console.log(`[dry-run] Payload geschrieben (${wf.nodes.length} Knoten) — kein PUT ausgeführt`);
} else {
  await deploy();
}

async function deploy() {

try {
  await api('PUT', `/workflows/${MAIN_ID}`, payload);
} catch (e) {
  // Falls die API unbekannte Settings-Felder ablehnt: auf Minimal-Settings zurückfallen
  if (String(e.message).includes('settings')) {
    console.warn('PUT mit vollen Settings abgelehnt, versuche Minimal-Settings:', e.message);
    payload.settings = { executionOrder: (wf.settings && wf.settings.executionOrder) || 'v1', errorWorkflow: wf.settings && wf.settings.errorWorkflow };
    await api('PUT', `/workflows/${MAIN_ID}`, payload);
  } else {
    throw e;
  }
}
console.log('PUT erfolgreich.');

// PUT deaktiviert den Workflow (n8n-API-Verhalten) — ggf. reaktivieren
let after = await api('GET', `/workflows/${MAIN_ID}`);
if (!after.active) {
  await api('POST', `/workflows/${MAIN_ID}/activate`);
  after = await api('GET', `/workflows/${MAIN_ID}`);
  console.log('Workflow reaktiviert.');
}

// ── 4. Verifikation + Repo-Spiegel aktualisieren ──────────────────────────
const checks = [
  ['Name unverändert', after.name === MAIN_NAME],
  ['Knotenzahl unverändert', after.nodes.length === wf.nodes.length],
  ['Workflow noch aktiv', after.active === true],
];
for (const p of PATCHES) {
  const liveAfter = norm(after.nodes.find((n) => n.name === p.nodeName)?.parameters?.jsCode);
  const newRef = norm(fs.readFileSync(path.join(CONFIG_DIR, p.newFile), 'utf8'));
  checks.push([`${p.nodeName} = ${p.newFile}`, liveAfter === newRef]);
}
let ok = true;
for (const [label, pass] of checks) {
  console.log(`${pass ? '✓' : '✗'} ${label}`);
  if (!pass) ok = false;
}

if (ok) {
  fs.writeFileSync(MIRROR_PATH, JSON.stringify(after, null, 2));
  console.log(`Repo-Spiegel aktualisiert: ${MIRROR_PATH}`);
}
process.exitCode = ok ? 0 : 1;
}
