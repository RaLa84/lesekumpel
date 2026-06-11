// Patch 2026-06-11: Robustheit + Kosten (siehe Plan "n8n-Workflow-Analyse & Verbesserungsplan")
//
// Paket 1 — Robustheit:
//  - Guardrail direkt hinter den Webhook (vor Respond), neuer IF "Eingabe gültig?" + "Respond: Rejected" (400)
//  - Blockliste mit Wortgrenzen (guardrail-kind-safe-v2.js)
//  - retryOnFail (3×/3s) auf GitHub- und Bild-HTTP-Knoten
//  - onError=continueRegularOutput auf Bild-Knoten + IF "Bilddaten vorhanden?" → Story wird auch ohne Bild committed
//  - Toter Knoten "Webhook-Antwort" entfernt
//  - Error-Workflow "Lesekumpel – Error Handler" (GitHub-Issue bei Fehlschlag) angelegt + verknüpft
// Paket 2 — Kosten:
//  - Explizite modelName auf allen Gemini-Knoten; Enrichment-/Trivial-Tasks auf gemini-2.5-flash
// Paket 3 — Wartbarkeit:
//  - "Emoji parsen"/"Summary-Emoji parsen" vereinheitlicht (emoji-parsen-v2.js, nur CFG-Block unterscheidet sich)
//
// Aufruf: node n8n-config/scripts/patch-2026-06-11-robustheit.mjs [--dry-run]

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const DRY_RUN = process.argv.includes('--dry-run');
const CONFIG_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const BASE = 'https://rala84.app.n8n.cloud/api/v1';
const MAIN_ID = 'eHfC95UaMbJMcLTb';
const MAIN_NAME = 'Lesekumpel – Neuroinclusive Story Generator';
const ERROR_WF_NAME = 'Lesekumpel – Error Handler';

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

const uuid = () => crypto.randomUUID();

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

// ── 2. Error-Workflow anlegen (falls noch nicht vorhanden) ────────────────
const ghRef = node('GitHub: HTML committen'); // typeVersion + Credentials wiederverwenden
const list = await api('GET', '/workflows?limit=200');
let errWf = (list.data || []).find((w) => w.name === ERROR_WF_NAME);
if (errWf) {
  console.log(`Error-Workflow existiert bereits: ${errWf.id}`);
} else if (DRY_RUN) {
  console.log('[dry-run] Würde Error-Workflow anlegen');
  errWf = { id: 'DRY-RUN-ID' };
} else {
  errWf = await api('POST', '/workflows', {
    name: ERROR_WF_NAME,
    nodes: [
      {
        id: uuid(), name: 'Error Trigger', type: 'n8n-nodes-base.errorTrigger',
        typeVersion: 1, position: [0, 0], parameters: {},
      },
      {
        id: uuid(), name: 'GitHub: Issue anlegen', type: 'n8n-nodes-base.github',
        typeVersion: ghRef.typeVersion, position: [280, 0],
        parameters: {
          authentication: 'oAuth2',
          resource: 'issue',
          operation: 'create',
          owner: { __rl: true, value: 'RaLa84', mode: 'name' },
          repository: { __rl: true, value: 'lesekumpel', mode: 'name' },
          title: "=⚠️ n8n-Fehler: {{ $json.workflow.name }} — {{ $json.execution?.lastNodeExecuted || 'unbekannter Knoten' }}",
          body: "=**Workflow:** {{ $json.workflow.name }}\n**Fehlgeschlagener Knoten:** {{ $json.execution?.lastNodeExecuted || '–' }}\n**Fehler:** {{ $json.execution?.error?.message || '–' }}\n**Execution:** {{ $json.execution?.url || $json.execution?.id || '–' }}",
        },
        credentials: ghRef.credentials,
        retryOnFail: true, maxTries: 3, waitBetweenTries: 3000,
      },
    ],
    connections: { 'Error Trigger': { main: [[{ node: 'GitHub: Issue anlegen', type: 'main', index: 0 }]] } },
    settings: { executionOrder: 'v1' },
  });
  console.log(`Error-Workflow angelegt: ${errWf.id}`);
}

// ── 3. Knoten-Code aktualisieren ──────────────────────────────────────────
const guardCode = fs.readFileSync(path.join(CONFIG_DIR, 'guardrail-kind-safe-v2.js'), 'utf8');
const emojiCode = fs.readFileSync(path.join(CONFIG_DIR, 'emoji-parsen-v2.js'), 'utf8');
const CFG_STORY = "const CFG = { quellKnoten: 'Geschichte parsen', quellFeld: 'rawStoryText', zielFeld: 'emojiStoryText' };";
const CFG_SUMMARY = "const CFG = { quellKnoten: 'Emoji parsen', quellFeld: 'summaryText', zielFeld: 'emojiSummaryText' };";
if (!emojiCode.includes(CFG_STORY)) throw new Error('CFG-Zeile in emoji-parsen-v2.js nicht gefunden');
const summaryCode = emojiCode.replace(CFG_STORY, CFG_SUMMARY);
const geminiExtractCode = fs.readFileSync(path.join(CONFIG_DIR, 'bild-daten-extrahieren-gemini-v2.js'), 'utf8');

node('Guardrail: Kind-Safe + Matrix').parameters.jsCode = guardCode;
node('Emoji parsen').parameters.jsCode = emojiCode;
node('Summary-Emoji parsen').parameters.jsCode = summaryCode;
node('Bild-Daten extrahieren (Gemini)').parameters.jsCode = geminiExtractCode;

// ── 4. Retries + onError ──────────────────────────────────────────────────
for (const n of ['GitHub: HTML committen', 'GitHub: Bild hochladen', 'GitHub: Template laden', 'Gemini: Bild generieren', 'Gemini Fallback Bild']) {
  Object.assign(node(n), { retryOnFail: true, maxTries: 3, waitBetweenTries: 3000 });
}
for (const n of ['Gemini: Bild generieren', 'Gemini Fallback Bild', 'GitHub: Bild hochladen']) {
  node(n).onError = 'continueRegularOutput';
}

// ── 5. Explizite Gemini-Modelle (Flash für Enrichment-/Trivial-Tasks) ─────
const FLASH_NODES = [
  '⚙️ Gemini (Linguistik)', '⚙️ Gemini (Quiz)', '⚙️ Gemini (Szenen)', '⚙️ Gemini (Elemente)',
  '⚙️ Gemini (Weiterdenken)', '⚙️ Gemini (Schatz)', '⚙️ Gemini (Titel)', '⚙️ Gemini (Sanity)', '⚙️ Gemini (Emoji)',
];
for (const n of FLASH_NODES) node(n).parameters.modelName = 'models/gemini-2.5-flash';

// ── 6. Neue Knoten: Eingabe-Validierung + Bilddaten-Check ─────────────────
const ifTypeVersion = node('skipImages?').typeVersion; // gleiche IF-Version wie bestehender IF-Knoten
const whPos = node('Webhook: Geschichte anfordern').position;
const guard = node('Guardrail: Kind-Safe + Matrix');
guard.position = [whPos[0] + 200, whPos[1]];

const respAccepted = node('Respond: Accepted');
respAccepted.position = [whPos[0] + 620, whPos[1] - 60];

const ifValid = {
  id: uuid(), name: 'Eingabe gültig?', type: 'n8n-nodes-base.if', typeVersion: ifTypeVersion,
  position: [whPos[0] + 410, whPos[1]],
  parameters: {
    conditions: {
      options: { caseSensitive: true, leftValue: '', typeValidation: 'loose', version: 2 },
      conditions: [{
        id: uuid(),
        leftValue: "={{ $json.guardError || '' }}",
        rightValue: '',
        operator: { type: 'string', operation: 'empty', singleValue: true },
      }],
      combinator: 'and',
    },
    options: {},
  },
};

const respRejected = {
  id: uuid(), name: 'Respond: Rejected', type: 'n8n-nodes-base.respondToWebhook',
  typeVersion: respAccepted.typeVersion, position: [whPos[0] + 620, whPos[1] + 140],
  parameters: {
    respondWith: 'json',
    responseBody: "={{ JSON.stringify({ status: 'rejected', error: $json.guardError }) }}",
    options: { responseCode: 400 },
  },
};

const ext1 = node('Bild-Daten extrahieren');
const ifImg = {
  id: uuid(), name: 'Bilddaten vorhanden?', type: 'n8n-nodes-base.if', typeVersion: ifTypeVersion,
  position: [ext1.position[0] + 200, ext1.position[1] + 160],
  parameters: {
    conditions: {
      options: { caseSensitive: true, leftValue: '', typeValidation: 'loose', version: 2 },
      conditions: [{
        id: uuid(),
        leftValue: "={{ $json.data || '' }}",
        rightValue: '',
        operator: { type: 'string', operation: 'notEmpty', singleValue: true },
      }],
      combinator: 'and',
    },
    options: {},
  },
};

wf.nodes.push(ifValid, respRejected, ifImg);
wf.nodes = wf.nodes.filter((n) => n.name !== 'Webhook-Antwort'); // toter Knoten

// ── 7. Verbindungen umbauen ───────────────────────────────────────────────
const C = wf.connections;
const to = (name) => [{ node: name, type: 'main', index: 0 }];

C['Webhook: Geschichte anfordern'] = { main: [to('Guardrail: Kind-Safe + Matrix')] };
C['Guardrail: Kind-Safe + Matrix'] = { main: [to('Eingabe gültig?')] };
C['Eingabe gültig?'] = { main: [to('Respond: Accepted'), to('Respond: Rejected')] };
C['Respond: Accepted'] = { main: [to('📝 Titel korrigieren')] };
C['Daten vorbereiten'] = { main: [to('Switch: Welche Persona?')] };
delete C['Ergebnis aufbauen']; // ging nur zum gelöschten "Webhook-Antwort"
C['Bild-Daten extrahieren'] = { main: [to('Bilddaten vorhanden?')] };
C['Bild-Daten extrahieren (Gemini)'] = { main: [to('Bilddaten vorhanden?')] };
C['Bilddaten vorhanden?'] = { main: [to('GitHub: Bild hochladen'), to('Bild-Loop')] };

// ── 8. Deploy ─────────────────────────────────────────────────────────────
const payload = {
  name: wf.name,
  nodes: wf.nodes,
  connections: wf.connections,
  settings: { ...wf.settings, errorWorkflow: errWf.id },
};

if (DRY_RUN) {
  fs.writeFileSync(path.join(backupDir, 'dry-run-payload.json'), JSON.stringify(payload, null, 2));
  console.log(`[dry-run] Payload geschrieben (${wf.nodes.length} Knoten) — kein PUT ausgeführt`);
  process.exit(0);
}

try {
  await api('PUT', `/workflows/${MAIN_ID}`, payload);
} catch (e) {
  // Falls die API unbekannte Settings-Felder ablehnt: auf Minimal-Settings zurückfallen
  if (String(e.message).includes('settings')) {
    console.warn('PUT mit vollen Settings abgelehnt, versuche Minimal-Settings:', e.message);
    payload.settings = { executionOrder: wf.settings.executionOrder || 'v1', errorWorkflow: errWf.id };
    await api('PUT', `/workflows/${MAIN_ID}`, payload);
  } else {
    throw e;
  }
}
console.log('PUT erfolgreich.');

// ── 9. Verifikation ───────────────────────────────────────────────────────
const after = await api('GET', `/workflows/${MAIN_ID}`);
const checks = [
  ['Name unverändert', after.name === MAIN_NAME],
  ['Knotenzahl 78 (76 − 1 tot + 3 neu)', after.nodes.length === wf.nodes.length],
  ['errorWorkflow gesetzt', after.settings.errorWorkflow === errWf.id],
  ['Webhook → Guardrail', after.connections['Webhook: Geschichte anfordern'].main[0][0].node === 'Guardrail: Kind-Safe + Matrix'],
  ['IF Eingabe gültig? existiert', after.nodes.some((n) => n.name === 'Eingabe gültig?')],
  ['Webhook-Antwort entfernt', !after.nodes.some((n) => n.name === 'Webhook-Antwort')],
  ['HTML-Commit hat Retry', after.nodes.find((n) => n.name === 'GitHub: HTML committen').retryOnFail === true],
  ['Bild-Gen onError', after.nodes.find((n) => n.name === 'Gemini: Bild generieren').onError === 'continueRegularOutput'],
  ['Gemini (Emoji) auf Flash', after.nodes.find((n) => n.name === '⚙️ Gemini (Emoji)').parameters.modelName === 'models/gemini-2.5-flash'],
  ['Workflow noch aktiv', after.active === true],
];
let ok = true;
for (const [label, pass] of checks) {
  console.log(`${pass ? '✓' : '✗'} ${label}`);
  if (!pass) ok = false;
}
process.exit(ok ? 0 : 1);
