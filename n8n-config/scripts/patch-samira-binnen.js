// Ergänzt im Samira-Knoten (options.systemMessage) die "Binnen-Großbuchstaben"-Regel
// in der NO-GO-Liste. Synchron zur .md-Quelle.

const fs = require('node:fs');
const path = require('node:path');

const TMP_DIR = path.resolve(__dirname, '..', '_tmp');
const SRC = path.join(TMP_DIR, 'workflow_check.json');
const PUT_BODY = path.join(TMP_DIR, 'workflow_samira_binnen.json');
const LOCAL_MIRROR = path.resolve(__dirname, '..', 'workflows', 'lesekumpel-story-generator.json');

const NEW_LINE = `\n* **Binnen-Großbuchstaben in Wortzusammensetzungen.** Schreibe natürliches Deutsch. Erfinde keine Komposita wie "SuperSpannendes", "MegaCool", "Wahnsinns-Fakt". Wenn du Aufregung ausdrücken willst, nutze normale Wendungen ("super spannend", "wirklich aufregend", "ganz erstaunlich") oder deine etablierten Ausrufe ("Halt dich fest!", "Echt jetzt!").`;

function patchWorkflow(wf, label) {
  const samira = wf.nodes.find(n => n.name === '📚 Samira Wissensfreund (Sachtexte)');
  if (!samira) throw new Error(`[${label}] Samira-Knoten nicht gefunden`);

  const sys = samira.parameters?.options?.systemMessage;
  if (!sys) throw new Error(`[${label}] systemMessage fehlt`);
  if (sys.includes('SuperSpannendes')) {
    console.warn(`[${label}] Bereits gepatcht — überspringe`);
    return;
  }

  const anchor = '* Implizite Aussagen (der Leser soll nie raten müssen).';
  if (!sys.includes(anchor)) {
    throw new Error(`[${label}] Anchor "Implizite Aussagen..." nicht gefunden — Prompt-Struktur hat sich verändert`);
  }
  samira.parameters.options.systemMessage = sys.replace(anchor, anchor + NEW_LINE);
}

const wf = JSON.parse(fs.readFileSync(SRC, 'utf8'));
if (wf.name !== 'Lesekumpel – Neuroinclusive Story Generator') throw new Error('Falscher Workflow-Name: ' + wf.name);
patchWorkflow(wf, 'live');

const ALLOWED = new Set(['executionOrder','saveExecutionProgress','saveManualExecutions','saveDataErrorExecution','saveDataSuccessExecution','executionTimeout','errorWorkflow','timezone','callerPolicy','callerIds']);
const cleanSettings = {};
for (const [k, v] of Object.entries(wf.settings ?? {})) if (ALLOWED.has(k)) cleanSettings[k] = v;
const putBody = { name: wf.name, nodes: wf.nodes, connections: wf.connections, settings: cleanSettings, staticData: wf.staticData ?? null };
fs.writeFileSync(PUT_BODY, JSON.stringify(putBody, null, 2), 'utf8');

const local = JSON.parse(fs.readFileSync(LOCAL_MIRROR, 'utf8'));
patchWorkflow(local, 'local');
fs.writeFileSync(LOCAL_MIRROR, JSON.stringify(local, null, 2), 'utf8');

console.log(JSON.stringify({ ok: true, putBodySize: fs.statSync(PUT_BODY).size }, null, 2));
