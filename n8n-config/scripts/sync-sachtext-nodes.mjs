// Synct die 6 Code-Nodes + Samira-Systemprompt + den Style-Ref-URL-Parameter aus
// den Repo-Dateien in den bestehenden Sachtext-Workflow "Lesekumpel – Sachtext-
// Generator (Samira)" (mM13X2tdTIbFUgF4) — per PUT, ohne Neuanlage.
//
// WICHTIG (n8n-Cloud-Gotcha): Nach einem PUT auf einen AKTIVEN Workflow läuft
// weiterhin die alte kompilierte Version — deshalb wird nach erfolgreichem PUT
// automatisch deaktiviert + reaktiviert (Recompile).
//
// Aufruf: node n8n-config/scripts/sync-sachtext-nodes.mjs

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const CONFIG_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const REPO_DIR = path.resolve(CONFIG_DIR, '..');
const BASE = 'https://rala84.app.n8n.cloud/api/v1';
const WF_ID = 'mM13X2tdTIbFUgF4';
const WF_NAME = 'Lesekumpel – Sachtext-Generator (Samira)';
const SAMIRA_AGENT = '📚 Samira Wissensfreund (Sachtexte)';
const LOCAL_REF = path.join(REPO_DIR, 'n8n-config', 'workflows', 'lesekumpel-sachtext-generator.json');

const JSCODE_SWAPS = {
  'Daten vorbereiten': 'daten-vorbereiten-sachtext-v1.js',
  'Guardrail: Kind-Safe + Matrix': 'guardrail-sachtext-v1.js',
  'Geschichte parsen': 'geschichte-parsen-sachtext-v1.js',
  'Bildszenen vorbereiten': 'bildszenen-vorbereiten-sachtext-v1.js',
  'Szenen parsen': 'szenen-parsen-sachtext-v1.js',
  'HTML assemblieren': 'assemble-html-sachtext-v1.js',
};

// "Style-Ref vorbereiten" (httpRequest): URL pro Bild-Loop-Item aus dem aktuellen
// Szenen-Item ziehen (Diagramm-Szene -> Schaubild-Referenz), Fallback global.
const STYLE_REF_NODE = 'Style-Ref vorbereiten';
const STYLE_REF_URL_EXPR = "={{ $('Szenen parsen').all()[$('Bild-Loop').context.currentRunIndex]?.json.styleRefUrl || $('Bildszenen vorbereiten').first().json.styleRefUrl }}";

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

const wf = await api('GET', `/workflows/${WF_ID}`);
if (wf.name !== WF_NAME) throw new Error(`Falscher Workflow geladen: "${wf.name}"`);
console.log(`Workflow: "${wf.name}" — ${wf.nodes.length} Knoten, aktiv: ${wf.active}`);

const nodes = JSON.parse(JSON.stringify(wf.nodes));
let changed = 0;
for (const [nodeName, file] of Object.entries(JSCODE_SWAPS)) {
  const node = nodes.find((n) => n.name === nodeName);
  if (!node) throw new Error(`Code-Knoten "${nodeName}" nicht gefunden`);
  const code = fs.readFileSync(path.join(CONFIG_DIR, file), 'utf8');
  if (node.parameters.jsCode !== code) { node.parameters.jsCode = code; changed++; console.log(`jsCode aktualisiert: "${nodeName}" <- ${file}`); }
  else console.log(`jsCode unverändert: "${nodeName}"`);
}
const samira = nodes.find((n) => n.name === SAMIRA_AGENT);
if (!samira) throw new Error(`Samira-Agent "${SAMIRA_AGENT}" nicht gefunden`);
const prompt = fs.readFileSync(path.join(REPO_DIR, 'prompts', 'samira-sachtext.md'), 'utf8');
if (samira.parameters.options.systemMessage !== prompt) { samira.parameters.options.systemMessage = prompt; changed++; console.log('systemMessage aktualisiert <- prompts/samira-sachtext.md'); }
else console.log('systemMessage unverändert');

const styleRefNode = nodes.find((n) => n.name === STYLE_REF_NODE);
if (!styleRefNode) throw new Error(`Knoten "${STYLE_REF_NODE}" nicht gefunden`);
if (styleRefNode.parameters.url !== STYLE_REF_URL_EXPR) { styleRefNode.parameters.url = STYLE_REF_URL_EXPR; changed++; console.log(`Parameter aktualisiert: "${STYLE_REF_NODE}".url -> per-Szene-Expression`); }
else console.log(`Parameter unverändert: "${STYLE_REF_NODE}".url`);

// Szenen-LLM: Gemini-Safety-Filter blockt Kinderbuch-Illustrationsprompts (VISUAL LOCK
// mit Kind-Beschreibungen) teils falsch-positiv -> leere Antwort (generations [[]],
// 0 completionTokens) -> ChainLlm-Crash. Safety auf BLOCK_NONE (Inhalte sind ohnehin
// durch Guardrail + kindgerechte Prompts abgesichert).
const SAFETY_VALUES = ['HARM_CATEGORY_HARASSMENT', 'HARM_CATEGORY_HATE_SPEECH', 'HARM_CATEGORY_SEXUALLY_EXPLICIT', 'HARM_CATEGORY_DANGEROUS_CONTENT']
  .map((category) => ({ category, threshold: 'BLOCK_NONE' }));
const szenenLlm = nodes.find((n) => n.name === '⚙️ Gemini (Szenen)');
if (!szenenLlm) throw new Error('Knoten "⚙️ Gemini (Szenen)" nicht gefunden');
const wantSafety = JSON.stringify({ values: SAFETY_VALUES });
if (JSON.stringify(szenenLlm.parameters.options?.safetySettings || null) !== wantSafety) {
  szenenLlm.parameters.options = { ...(szenenLlm.parameters.options || {}), safetySettings: { values: SAFETY_VALUES } };
  changed++; console.log('Parameter aktualisiert: "⚙️ Gemini (Szenen)".options.safetySettings -> BLOCK_NONE');
} else console.log('Parameter unverändert: "⚙️ Gemini (Szenen)".safetySettings');

// Crash-Netz: liefert das LLM trotzdem nichts, soll der Extraktor weiterlaufen
// (Szenen parsen hat einen Fallback: leeres rawText -> 1 generische Szene) statt
// den ganzen Lauf zu killen.
const extraktor = nodes.find((n) => n.name === '🎨 Szenen-Extraktor');
if (!extraktor) throw new Error('Knoten "🎨 Szenen-Extraktor" nicht gefunden');
if (extraktor.onError !== 'continueRegularOutput') {
  extraktor.onError = 'continueRegularOutput';
  changed++; console.log('Parameter aktualisiert: "🎨 Szenen-Extraktor".onError -> continueRegularOutput');
} else console.log('Parameter unverändert: "🎨 Szenen-Extraktor".onError');

if (changed === 0) { console.log('\nKeine Änderungen — nichts zu tun.'); }
else {
  const ALLOWED = new Set(['executionOrder', 'saveExecutionProgress', 'saveManualExecutions', 'saveDataErrorExecution', 'saveDataSuccessExecution', 'executionTimeout', 'errorWorkflow', 'timezone', 'callerPolicy', 'callerIds']);
  const cleanSettings = {};
  for (const [k, v] of Object.entries(wf.settings ?? {})) if (ALLOWED.has(k)) cleanSettings[k] = v;
  await api('PUT', `/workflows/${WF_ID}`, { name: wf.name, nodes, connections: wf.connections, settings: cleanSettings, staticData: wf.staticData ?? null });
  console.log(`\n✓ PUT erfolgreich (${changed} Änderung(en))`);
  // Recompile erzwingen: PUT auf aktiven Workflow greift erst nach Reaktivierung
  if (wf.active) {
    await api('POST', `/workflows/${WF_ID}/deactivate`);
    await api('POST', `/workflows/${WF_ID}/activate`);
    console.log('✓ Workflow reaktiviert (Recompile)');
  }
  const after = await api('GET', `/workflows/${WF_ID}`);
  fs.writeFileSync(LOCAL_REF, JSON.stringify(after, null, 2));
  console.log(`Lokaler Mirror aktualisiert (aktiv: ${after.active}): n8n-config/workflows/lesekumpel-sachtext-generator.json`);
}
