// Triggert sequenziell 1 Story pro Persona (9 Stück) über den Produktiv-Webhook.
// WICHTIG: Niemals parallel triggern (GitHub-Race-Condition HTTP 409) — das Skript
// wartet nach jedem Trigger, bis keine Execution des Haupt-Workflows mehr läuft.
// Aufruf: node n8n-config/scripts/trigger-all-personas.mjs

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const CONFIG_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const API_BASE = 'https://rala84.app.n8n.cloud/api/v1';
const WEBHOOK = 'https://rala84.app.n8n.cloud/webhook/lesekumpel-story';
const MAIN_ID = 'eHfC95UaMbJMcLTb';
const API_KEY = fs.readFileSync(path.join(CONFIG_DIR, '.env'), 'utf8').match(/^N8N_API_KEY=(.+)$/m)[1].trim();

const STORIES = [
  { Persona: 'Pip Punkt', Neurotyp: 'Standard', Titel: 'Der kleine Igel findet einen Ball', Genre: 'Tiergeschichte', Kurzbeschreibung: 'Ein kleiner Igel findet im Garten einen roten Ball und sucht heraus, wem er gehört.', Bildstil: 'Aquarell' },
  { Persona: 'Mia Mitte', Neurotyp: 'Standard', Titel: 'Lotta und das verschwundene Pausenbrot', Genre: 'Alltagsgeschichte', Kurzbeschreibung: 'Lottas Pausenbrot ist weg! Auf dem Schulhof folgt sie den Spuren und findet eine überraschende Antwort.', Bildstil: 'Cartoon' },
  { Persona: 'Peter Past', Neurotyp: 'Standard', Titel: 'Der Tag, an dem der Leuchtturm blinkte', Genre: 'Abenteuer', Kurzbeschreibung: 'Bei Oma an der Küste entdeckte Jannik, dass der alte Leuchtturm plötzlich wieder blinkte — dabei war er doch längst stillgelegt.', Bildstil: 'Aquarell' },
  { Persona: 'Stella Stimmenreich', Neurotyp: 'Standard', Titel: 'Streit im Baumhaus', Genre: 'Freundschaft', Kurzbeschreibung: 'Drei Freunde haben sehr verschiedene Pläne für ihr neues Baumhaus — und müssen reden, bis alle zufrieden sind.', Bildstil: 'Buntstift' },
  { Persona: 'Finja Feder', Neurotyp: 'Standard', Titel: 'Das Geheimnis der alten Buche', Genre: 'Mystery', Kurzbeschreibung: 'In der höhlenartigen alten Buche im Park findet Ronja winzige Briefe — wer schreibt sie, und warum gerade ihr?', Bildstil: 'Aquarell' },
  { Persona: 'Samira Wissensfreund', Titel: 'Warum schlafen Fledermäuse kopfüber?', Genre: 'Sachtext', Kurzbeschreibung: 'Ein Sachtext über Fledermäuse: Warum hängen sie kopfüber, wie finden sie im Dunkeln den Weg?', Bildstil: 'Buntstift' },
  { Persona: 'Holzi Pixelkopf', Titel: 'Holzi und der hüpfende Pixel-Frosch', Genre: 'Gaming-Abenteuer', Kurzbeschreibung: 'In Holzis Lieblingsspiel taucht ein Frosch auf, der durch alle Level hüpft und das Punktesystem durcheinanderbringt.', Bildstil: 'Pixel-Art' },
  { Persona: 'Deniz Traumfänger', Titel: 'Die Reise zum singenden Mond', Genre: 'Traumreise', Kurzbeschreibung: 'Eine ruhige Traumreise: Du schwebst durch die Nacht zu einem Mond, der leise Melodien summt.', Bildstil: 'Aquarell' },
  { Persona: 'Jonas Entdecker', Titel: 'Mein erster Tag auf dem Flohmarkt', Genre: 'Alltagsabenteuer', Kurzbeschreibung: 'Jonas darf zum ersten Mal selbst etwas auf dem Flohmarkt verkaufen — und lernt feilschen, zählen und mutig sein.', Bildstil: 'Cartoon' },
];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function runningCount() {
  const res = await fetch(`${API_BASE}/executions?workflowId=${MAIN_ID}&status=running&limit=10`, {
    headers: { 'X-N8N-API-KEY': API_KEY },
  });
  if (!res.ok) throw new Error(`Executions-API HTTP ${res.status}`);
  const j = await res.json();
  return (j.data || []).length;
}

async function latestExecution() {
  const res = await fetch(`${API_BASE}/executions?workflowId=${MAIN_ID}&limit=1`, {
    headers: { 'X-N8N-API-KEY': API_KEY },
  });
  const j = await res.json();
  return (j.data || [])[0] || null;
}

const results = [];
for (const story of STORIES) {
  const label = `${story.Persona} — "${story.Titel}"`;
  console.log(`\n▶ Trigger: ${label}`);

  const res = await fetch(WEBHOOK, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(story),
  });
  const bodyText = await res.text();
  console.log(`  Webhook: HTTP ${res.status} ${bodyText.substring(0, 200)}`);
  if (res.status !== 202) {
    results.push({ label, status: `WEBHOOK-FEHLER HTTP ${res.status}` });
    continue;
  }

  // Warten bis die Execution fertig ist (sequenziell — kein paralleler Trigger!)
  await sleep(15000);
  const MAX_POLLS = 60; // 60 × 20s = 20 min Obergrenze pro Story
  let finished = false;
  for (let i = 0; i < MAX_POLLS; i++) {
    let n;
    try { n = await runningCount(); } catch (e) { console.log(`  Poll-Fehler: ${e.message}`); await sleep(20000); continue; }
    if (n === 0) { finished = true; break; }
    if (i % 3 === 0) console.log(`  … läuft noch (${Math.round((i * 20 + 15) / 60)} min)`);
    await sleep(20000);
  }
  if (!finished) {
    console.log('  ⚠ Timeout nach 20 min — fahre trotzdem fort');
    results.push({ label, status: 'TIMEOUT (läuft evtl. noch)' });
    continue;
  }

  const exec = await latestExecution();
  const status = exec ? `${exec.status} (Exec ${exec.id})` : 'unbekannt';
  console.log(`  ✔ Fertig: ${status}`);
  results.push({ label, status });
  await sleep(5000); // kleine Pause vor dem nächsten Trigger
}

console.log('\n══════ ERGEBNIS ══════');
for (const r of results) console.log(`${r.status.startsWith('success') ? '✓' : '✗'} ${r.label} → ${r.status}`);
