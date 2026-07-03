// Fügt Samiras Agent im Sachtext-Workflow (mM13X2tdTIbFUgF4) ein Tavily-Websuche-Tool hinzu.
// 1) Legt aus TAVILY_API_KEY (n8n-config/.env) eine n8n "Header Auth"-Credential an
//    (Authorization: Bearer <key>) — der Key landet NUR in n8n, nie in der Workflow-JSON/im Repo.
// 2) Hängt einen toolHttpRequest-Node "Websuche_Samira (Tavily)" per ai_tool an den Agenten.
// 3) PUT des Workflows (Settings-Whitelist, aktiv-Status bleibt).
//
// Idempotent: existiert der Tool-Node schon, passiert nichts (keine zweite Credential).
//
// Aufruf: node n8n-config/scripts/add-tavily-tool.mjs

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const CONFIG_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const REPO_DIR = path.resolve(CONFIG_DIR, '..');
const BASE = 'https://rala84.app.n8n.cloud/api/v1';
const WF_ID = 'mM13X2tdTIbFUgF4';
const WF_NAME = 'Lesekumpel – Sachtext-Generator (Samira)';
const AGENT = '📚 Samira Wissensfreund (Sachtexte)';
// WICHTIG: Tool-Node-Name muss alphanumerisch sein (nur [A-Za-z0-9_]) — LangChain
// nutzt ihn als Tool-Namen; Leerzeichen/Klammern -> "not a valid alphanumeric string".
const TOOL_NAME = 'Websuche_Samira';
const CRED_NAME = 'Tavily API (Samira)';
const LOCAL_REF = path.join(REPO_DIR, 'n8n-config', 'workflows', 'lesekumpel-sachtext-generator.json');

const env = fs.readFileSync(path.join(CONFIG_DIR, '.env'), 'utf8');
const API_KEY = env.match(/^N8N_API_KEY=(.+)$/m)[1].trim();
const TAVILY = (env.match(/^TAVILY_API_KEY=(.+)$/m) || [])[1]?.trim();
if (!TAVILY || TAVILY.includes('PASTE_YOUR_KEY') || TAVILY.length < 10) {
  throw new Error('TAVILY_API_KEY fehlt/Platzhalter in n8n-config/.env');
}

async function api(method, p, body) {
  const res = await fetch(BASE + p, {
    method,
    headers: { 'X-N8N-API-KEY': API_KEY, 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`${method} ${p} -> HTTP ${res.status}: ${text.substring(0, 600)}`);
  return text ? JSON.parse(text) : null;
}

// 0) Workflow laden + verifizieren
const wf = await api('GET', `/workflows/${WF_ID}`);
if (wf.name !== WF_NAME) throw new Error(`Falscher Workflow: "${wf.name}"`);
if (wf.nodes.some((n) => n.name === TOOL_NAME)) {
  console.log(`Tool-Node "${TOOL_NAME}" existiert bereits — nichts zu tun.`);
  process.exit(0);
}
const agent = wf.nodes.find((n) => n.name === AGENT);
if (!agent) throw new Error(`Agent "${AGENT}" nicht gefunden`);

// 1) Credential anlegen (Header Auth: Authorization: Bearer <key>)
const cred = await api('POST', '/credentials', {
  name: CRED_NAME,
  type: 'httpHeaderAuth',
  data: { name: 'Authorization', value: `Bearer ${TAVILY}` },
});
console.log(`✓ Credential angelegt: "${cred.name}" (id ${cred.id})`);

// 2) Tool-Node bauen (neben dem Wikipedia-Tool positionieren)
const wiki = wf.nodes.find((n) => n.name === 'Wikipedia_Samira');
const pos = wiki ? [wiki.position[0], wiki.position[1] + 176] : [1696, 1088];
const toolNode = {
  parameters: {
    toolDescription:
      'Durchsucht das Web (Tavily) nach aktuellen oder speziellen Fakten, die NICHT in Wikipedia stehen — z.B. neue Rekorde, aktuelle Ereignisse, Nischen- oder Popkultur-Themen. Nur ERGÄNZEND zu Wikipedia nutzen. Formuliere eine präzise Suchanfrage auf Deutsch. Verwende nur kindgerechte, seriöse Informationen aus den Ergebnissen.',
    method: 'POST',
    url: 'https://api.tavily.com/search',
    authentication: 'genericCredentialType',
    genericAuthType: 'httpHeaderAuth',
    sendBody: true,
    specifyBody: 'json',
    jsonBody:
      '{\n  "query": "{query}",\n  "max_results": 4,\n  "include_answer": true,\n  "search_depth": "basic",\n  "topic": "general"\n}',
    placeholderDefinitions: {
      values: [
        { name: 'query', description: 'Die Suchanfrage auf Deutsch, präzise formuliert', type: 'string' },
      ],
    },
  },
  id: cryptoRandomId(),
  name: TOOL_NAME,
  type: '@n8n/n8n-nodes-langchain.toolHttpRequest',
  typeVersion: 1.1,
  position: pos,
  credentials: { httpHeaderAuth: { id: cred.id, name: CRED_NAME } },
};

function cryptoRandomId() {
  // n8n-Node-IDs sind UUIDs; hier deterministisch-zufällig ohne Math.random-Verbot-Problem
  return 'tavily-tool-' + Buffer.from(cred.id).toString('hex').slice(0, 8);
}

const nodes = [...wf.nodes, toolNode];
const connections = JSON.parse(JSON.stringify(wf.connections));
connections[TOOL_NAME] = { ai_tool: [[{ node: AGENT, type: 'ai_tool', index: 0 }]] };

// 3) PUT (Settings-Whitelist)
const ALLOWED = new Set(['executionOrder', 'saveExecutionProgress', 'saveManualExecutions', 'saveDataErrorExecution', 'saveDataSuccessExecution', 'executionTimeout', 'errorWorkflow', 'timezone', 'callerPolicy', 'callerIds']);
const cleanSettings = {};
for (const [k, v] of Object.entries(wf.settings ?? {})) if (ALLOWED.has(k)) cleanSettings[k] = v;
await api('PUT', `/workflows/${WF_ID}`, { name: wf.name, nodes, connections, settings: cleanSettings, staticData: wf.staticData ?? null });
console.log('✓ Workflow aktualisiert (Tool angehängt)');

// 4) Verifikation + lokalen Mirror aktualisieren
const after = await api('GET', `/workflows/${WF_ID}`);
fs.writeFileSync(LOCAL_REF, JSON.stringify(after, null, 2));
const tool = after.nodes.find((n) => n.name === TOOL_NAME);
const wired = after.connections[TOOL_NAME]?.ai_tool?.[0]?.[0]?.node === AGENT;
const hasCred = !!tool?.credentials?.httpHeaderAuth?.id;
console.log('\nVerifikation:');
console.log(`  ${tool ? '✓' : '✗'} Tool-Node vorhanden`);
console.log(`  ${wired ? '✓' : '✗'} ai_tool -> Agent verdrahtet`);
console.log(`  ${hasCred ? '✓' : '✗'} Credential referenziert`);
console.log(`  aktiv: ${after.active}`);
console.log('\nHinweis: Der funktionale Test (Agent ruft die Suche wirklich auf) braucht einen echten Story-Trigger — nur mit deiner Erlaubnis.');
