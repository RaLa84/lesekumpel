// Vergleicht die Persona-Systemprompts in den n8n-Knoten mit den Dateien in prompts/*.md
// und schreibt n8n-config/prompt-drift-report.md.
// Aufruf: node n8n-config/scripts/prompt-drift-report.mjs

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const CONFIG_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const REPO_DIR = path.resolve(CONFIG_DIR, '..');
const BASE = 'https://rala84.app.n8n.cloud/api/v1';
const MAIN_ID = 'eHfC95UaMbJMcLTb';

const API_KEY = fs.readFileSync(path.join(CONFIG_DIR, '.env'), 'utf8').match(/^N8N_API_KEY=(.+)$/m)[1].trim();
const res = await fetch(`${BASE}/workflows/${MAIN_ID}`, { headers: { 'X-N8N-API-KEY': API_KEY } });
if (!res.ok) throw new Error(`GET workflow -> HTTP ${res.status}`);
const wf = await res.json();
if (!wf.name.includes('Neuroinclusive Story Generator')) throw new Error(`Falscher Workflow: ${wf.name}`);

// Knotenname -> Prompt-Datei
const MAP = [
  ['✏️ Pip Punkt (Einfach)', 'pip-punkt.md'],
  ['🌉 Mia Mitte (Flüssig)', 'mia-mitte.md'],
  ['📜 Peter Past (Erzählzeit)', 'peter-past.md'],
  ['🎭 Stella Stimmenreich (Dialoge)', 'stella-stimmenreich.md'],
  ['🪶 Finja Feder (Anspruchsvoll)', 'finja-feder.md'],
  ['📚 Samira Wissensfreund (Sachtexte)', 'samira-wissensfreund.md'],
  ['🎮 Holzi Pixelkopf (Tech/Gaming)', 'holzi-pixelkopf.md'],
  ['🌙 Deniz Traumfänger (Fantasy)', 'deniz-traumfaenger.md'],
  ['🧭 Jonas Entdecker (Abenteuer)', 'jonas-entdecker.md'],
];

const norm = (s) => s.replace(/\r\n/g, '\n').trim();
const dumpDir = path.join(CONFIG_DIR, '_tmp', 'node-prompts');
fs.mkdirSync(dumpDir, { recursive: true });

let report = `# Prompt-Drift-Report: n8n-Knoten vs. prompts/*.md

Generiert am ${new Date().toISOString().substring(0, 10)} aus Workflow "${wf.name}".

Die Persona-Systemprompts existieren doppelt: hartkodiert in den n8n-Knoten UND als Dateien in \`prompts/\`.
Dieser Report zeigt, wie weit beide auseinanderliegen. Die Knoten-Versionen liegen als Kopien in
\`n8n-config/_tmp/node-prompts/\` — Diff z. B. mit \`git diff --no-index prompts/pip-punkt.md n8n-config/_tmp/node-prompts/pip-punkt.md\`.

**Offene Entscheidung:** Welche Version ist die gewollte? Danach entweder (a) Prompts zur Laufzeit
per HTTP aus dem Repo laden oder (b) Sync-Skript Repo → n8n etablieren.

| Persona | Knoten (Zeichen) | Repo (Zeichen) | Identisch? | Abweichende Zeilen |
|---------|-----------------|----------------|------------|--------------------|
`;

for (const [nodeName, file] of MAP) {
  const n = wf.nodes.find((x) => x.name === nodeName);
  if (!n) { report += `| ${file} | KNOTEN FEHLT | – | – | – |\n`; continue; }
  const nodePrompt = norm(n.parameters?.options?.systemMessage || n.parameters?.messages?.messageValues?.[0]?.message || '');
  const repoPath = path.join(REPO_DIR, 'prompts', file);
  const repoPrompt = fs.existsSync(repoPath) ? norm(fs.readFileSync(repoPath, 'utf8')) : '';
  fs.writeFileSync(path.join(dumpDir, file), nodePrompt + '\n');

  const identical = nodePrompt === repoPrompt;
  let diffLines = 0;
  if (!identical) {
    const a = new Set(nodePrompt.split('\n'));
    const b = new Set(repoPrompt.split('\n'));
    for (const l of a) if (!b.has(l)) diffLines++;
    for (const l of b) if (!a.has(l)) diffLines++;
  }
  report += `| ${file.replace('.md', '')} | ${nodePrompt.length} | ${repoPrompt.length} | ${identical ? 'ja ✓' : 'NEIN'} | ${identical ? 0 : diffLines} |\n`;
}

report += `
## Befund (2026-06-11)

Stichprobe peter-past: Die Repo-Datei enthält eine komplette **REDEWIEDERGABE**-Sektion
(indirekte Rede im Präsens etc.), die im n8n-Knoten fehlt → **das Repo ist die neuere Version**,
die Verbesserungen wurden nie nach n8n synchronisiert.

Achtung bei Samira: Der Knoten-Prompt ist bewusst für den Agent-Knoten (v1.9, Wikipedia-Tool)
angepasst — NICHT blind aus dem Repo überschreiben.

Empfehlung: Sync-Skript Repo → n8n (Skill-Personas 1:1, Samira manuell prüfen).
`;

fs.writeFileSync(path.join(CONFIG_DIR, 'prompt-drift-report.md'), report);
console.log(report);
