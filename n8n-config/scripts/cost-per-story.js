// Cost-per-Story-Analyse für die Autorengeschichte
// Liest n8n-Execution-Dumps aus n8n-config/_tmp/exec_*.json,
// extrahiert Token-Counts pro LLM-Knoten + Bilder-Anzahl,
// rechnet Kosten und schreibt einen Markdown-Bericht.

const fs = require('node:fs');
const path = require('node:path');

const TMP_DIR = path.resolve(__dirname, '..', '_tmp');
const REPORT_DIR = path.resolve(__dirname, '..', '..', 'tests', 'cost-per-story');
const REPORT_FILE = path.join(REPORT_DIR, 'results.md');

// --- Preise (Stand 2026-04-29) ---
const USD_PER_1M_INPUT_PRO = 1.25;
const USD_PER_1M_OUTPUT_PRO = 10.00;
const USD_PER_1M_INPUT_FLASH = 0.30;
const USD_PER_1M_OUTPUT_FLASH = 2.50;
const USD_PER_IMAGE = 0.040;
const USD_TO_EUR = 0.92;

// Per-Knoten-Modell-Zuordnung (laut Workflow-Stand): alle aktuellen Gemini-Knoten laufen auf Pro
// Falls ein Knoten Flash-Daten liefert, erkennen wir das nicht aus runData — wir gehen pauschal
// von Pro aus, weil Memory bestätigt: 18+ Knoten auf Pro, nur einzelne ältere auf Flash.
// Sollte sich das zukünftig ändern, kann hier ein Lookup eingebaut werden.

function findTokenUsage(obj, depth = 0, results = []) {
  if (!obj || typeof obj !== 'object' || depth > 25) return results;
  for (const [k, v] of Object.entries(obj)) {
    if (k === 'tokenUsage' && v && typeof v === 'object' && 'promptTokens' in v) {
      results.push(v);
    } else if (typeof v === 'object' && v !== null) {
      findTokenUsage(v, depth + 1, results);
    }
  }
  return results;
}

function analyzeExecution(filepath) {
  const raw = JSON.parse(fs.readFileSync(filepath, 'utf8'));
  const id = raw.id;
  const runData = raw.data?.resultData?.runData ?? {};

  // Webhook-Input
  const webhookKey = Object.keys(runData).find(k => k.toLowerCase().startsWith('webhook'));
  const webhookData = webhookKey ? runData[webhookKey][0]?.data?.main?.[0]?.[0]?.json : {};
  const body = webhookData?.body ?? webhookData ?? {};

  // Per-Knoten Token-Aufschlüsselung
  const perNode = [];
  let totalInputPro = 0;
  let totalOutputPro = 0;

  for (const [nodeName, runs] of Object.entries(runData)) {
    if (!Array.isArray(runs)) continue;
    let nodeIn = 0, nodeOut = 0, nodeRuns = 0;
    for (const run of runs) {
      const usages = findTokenUsage(run);
      for (const u of usages) {
        nodeIn += u.promptTokens || 0;
        nodeOut += u.completionTokens || 0;
        nodeRuns++;
      }
    }
    if (nodeRuns > 0) {
      perNode.push({ node: nodeName, runs: nodeRuns, inputTokens: nodeIn, outputTokens: nodeOut });
      totalInputPro += nodeIn;
      totalOutputPro += nodeOut;
    }
  }

  // Bilder zählen: Anzahl Runs von "GitHub: Bild hochladen" = tatsächlich committed images
  const uploadRuns = runData['GitHub: Bild hochladen']?.length ?? 0;

  // Kosten
  const costInputUSD = (totalInputPro / 1_000_000) * USD_PER_1M_INPUT_PRO;
  const costOutputUSD = (totalOutputPro / 1_000_000) * USD_PER_1M_OUTPUT_PRO;
  const costImagesUSD = uploadRuns * USD_PER_IMAGE;
  const totalUSD = costInputUSD + costOutputUSD + costImagesUSD;
  const totalEUR = totalUSD * USD_TO_EUR;

  return {
    id,
    titel: body.Titel || '(unbekannt)',
    persona: body.Persona || '(unbekannt)',
    neurotyp: body.Neurotyp || '',
    inputTokens: totalInputPro,
    outputTokens: totalOutputPro,
    images: uploadRuns,
    costInputUSD,
    costOutputUSD,
    costImagesUSD,
    totalUSD,
    totalEUR,
    perNode: perNode.sort((a, b) => (b.outputTokens * USD_PER_1M_OUTPUT_PRO + b.inputTokens * USD_PER_1M_INPUT_PRO) - (a.outputTokens * USD_PER_1M_OUTPUT_PRO + a.inputTokens * USD_PER_1M_INPUT_PRO)),
  };
}

function fmt(n, dec = 2) { return n.toFixed(dec); }
function fmtMoney(usd) { return `$${fmt(usd, 4)} (${fmt(usd * USD_TO_EUR, 4)} €)`; }
function pad(s, n) { return String(s).padEnd(n); }

// --- Run ---
const files = fs.readdirSync(TMP_DIR)
  .filter(f => /^exec_\d+\.json$/.test(f))
  .map(f => path.join(TMP_DIR, f));

if (files.length === 0) {
  console.error('Keine exec_*.json in', TMP_DIR);
  process.exit(1);
}

const results = files.map(analyzeExecution).sort((a, b) => Number(a.id) - Number(b.id));

// Aggregate
const sum = arr => arr.reduce((a, b) => a + b, 0);
const stats = arr => {
  const sorted = [...arr].sort((a, b) => a - b);
  const n = arr.length;
  const mean = sum(arr) / n;
  const median = n % 2 ? sorted[(n-1)/2] : (sorted[n/2-1] + sorted[n/2]) / 2;
  const variance = sum(arr.map(x => (x - mean) ** 2)) / n;
  return { mean, median, min: sorted[0], max: sorted[n-1], stdev: Math.sqrt(variance) };
};

const totalCosts = results.map(r => r.totalEUR);
const inputs = results.map(r => r.inputTokens);
const outputs = results.map(r => r.outputTokens);
const images = results.map(r => r.images);
const costStats = stats(totalCosts);
const inputStats = stats(inputs);
const outputStats = stats(outputs);
const imageStats = stats(images);

// Top-3-teuerste Knoten (über alle Stories aggregiert)
const nodeAgg = {};
for (const r of results) {
  for (const n of r.perNode) {
    if (!nodeAgg[n.node]) nodeAgg[n.node] = { runs: 0, inputTokens: 0, outputTokens: 0 };
    nodeAgg[n.node].runs += n.runs;
    nodeAgg[n.node].inputTokens += n.inputTokens;
    nodeAgg[n.node].outputTokens += n.outputTokens;
  }
}
const nodeAggList = Object.entries(nodeAgg).map(([node, d]) => ({
  node,
  runs: d.runs,
  inputTokens: d.inputTokens,
  outputTokens: d.outputTokens,
  costUSD: (d.inputTokens / 1_000_000) * USD_PER_1M_INPUT_PRO + (d.outputTokens / 1_000_000) * USD_PER_1M_OUTPUT_PRO,
})).sort((a, b) => b.costUSD - a.costUSD);

// --- Markdown-Bericht ---
const today = new Date().toISOString().slice(0, 10);
let md = '';
md += `# Cost-per-Story — Autorengeschichte\n\n`;
md += `> **Stand:** ${today}\n`;
md += `> **Stichprobe:** ${results.length} erfolgreiche Executions (IDs ${results.map(r => r.id).join(', ')})\n`;
md += `> **Quelle:** n8n-REST-API \`includeData=true\`, ausgewertet mit \`n8n-config/scripts/cost-per-story.js\`\n\n`;

md += `## Preise\n\n`;
md += `| Service | Input | Output |\n`;
md += `|---|---|---|\n`;
md += `| Gemini 2.5 Pro | $${USD_PER_1M_INPUT_PRO}/1M | $${USD_PER_1M_OUTPUT_PRO}/1M |\n`;
md += `| OpenAI gpt-image-1 / Gemini Image | — | $${USD_PER_IMAGE}/Bild |\n\n`;
md += `Wechselkurs: 1 USD ≈ ${USD_TO_EUR} €\n\n`;
md += `Annahme: Alle LLM-Knoten laufen auf Gemini 2.5 Pro (Workflow-Stand 2026-04-26 nach letztem Refactoring).\n\n`;

md += `## Stories im Detail\n\n`;
md += `| ID | Titel | Persona | Input Tokens | Output Tokens | Bilder | Kosten (USD) | Kosten (EUR) |\n`;
md += `|---|---|---|---:|---:|---:|---:|---:|\n`;
for (const r of results) {
  md += `| ${r.id} | ${r.titel.slice(0, 40)} | ${r.persona} | ${r.inputTokens.toLocaleString('de-DE')} | ${r.outputTokens.toLocaleString('de-DE')} | ${r.images} | $${fmt(r.totalUSD, 4)} | ${fmt(r.totalEUR, 4)} € |\n`;
}
md += `\n`;

md += `## Aggregate\n\n`;
md += `| Metrik | Mittelwert | Median | Min | Max | Stdabw. |\n`;
md += `|---|---:|---:|---:|---:|---:|\n`;
md += `| Input-Tokens | ${Math.round(inputStats.mean).toLocaleString('de-DE')} | ${Math.round(inputStats.median).toLocaleString('de-DE')} | ${inputStats.min.toLocaleString('de-DE')} | ${inputStats.max.toLocaleString('de-DE')} | ${Math.round(inputStats.stdev).toLocaleString('de-DE')} |\n`;
md += `| Output-Tokens | ${Math.round(outputStats.mean).toLocaleString('de-DE')} | ${Math.round(outputStats.median).toLocaleString('de-DE')} | ${outputStats.min.toLocaleString('de-DE')} | ${outputStats.max.toLocaleString('de-DE')} | ${Math.round(outputStats.stdev).toLocaleString('de-DE')} |\n`;
md += `| Bilder | ${fmt(imageStats.mean, 1)} | ${imageStats.median} | ${imageStats.min} | ${imageStats.max} | ${fmt(imageStats.stdev, 1)} |\n`;
md += `| **Cost (EUR)** | **${fmt(costStats.mean, 4)} €** | ${fmt(costStats.median, 4)} € | ${fmt(costStats.min, 4)} € | ${fmt(costStats.max, 4)} € | ${fmt(costStats.stdev, 4)} € |\n\n`;

md += `## Top-Knoten nach Kosten (über alle Stories)\n\n`;
md += `| # | Knoten | Runs | Input | Output | Kosten (USD) |\n`;
md += `|---|---|---:|---:|---:|---:|\n`;
nodeAggList.slice(0, 8).forEach((n, i) => {
  md += `| ${i+1} | ${n.node} | ${n.runs} | ${n.inputTokens.toLocaleString('de-DE')} | ${n.outputTokens.toLocaleString('de-DE')} | $${fmt(n.costUSD, 4)} |\n`;
});
md += `\n`;

md += `## Hochrechnung pro User pro Monat (basierend auf Mittelwert)\n\n`;
const meanCost = costStats.mean;
md += `Bei **${fmt(meanCost, 4)} € pro Story** im Mittel:\n\n`;
md += `| User-Profil | Stories/Monat | Kosten/Monat |\n`;
md += `|---|---:|---:|\n`;
md += `| Casual | 5 | ${fmt(meanCost * 5, 2)} € |\n`;
md += `| Regular | 20 | ${fmt(meanCost * 20, 2)} € |\n`;
md += `| Power | 60 | ${fmt(meanCost * 60, 2)} € |\n\n`;

md += `## Beobachtungen\n\n`;
md += `- Stichprobe enthält ${results.filter(r => r.images > 0).length} von ${results.length} Stories **mit** Bildern, ${results.filter(r => r.images === 0).length} ohne (Bilder-Pipeline war im Stichproben-Zeitraum teilweise aktiv).\n`;
md += `- Größter Kostenfaktor: **${nodeAggList[0]?.node}** mit $${fmt(nodeAggList[0]?.costUSD || 0, 4)} über alle ${results.length} Stories.\n`;
md += `- Bilder kosten in ${results.filter(r => r.images > 0).length} der Stories durchschnittlich ${fmt(USD_PER_IMAGE * (sum(images) / Math.max(1, results.filter(r => r.images > 0).length)) * USD_TO_EUR, 4)} € pro Story (nur Stories mit Bildern).\n\n`;

md += `## Nächste Schritte\n\n`;
md += `1. Schätzung der drei Stub-Modi (Top 100, Lesestufen, Geschichte bauen) — Anteile dieser Cost-Basis.\n`;
md += `2. User-Profile (Casual/Regular/Power) verfeinern — was ist realistisch?\n`;
md += `3. Optimierungs-Hebel identifizieren: welche Knoten könnten von Pro auf Flash gewechselt werden?\n`;

// Sicherstellen, dass Verzeichnis existiert
fs.mkdirSync(REPORT_DIR, { recursive: true });
fs.writeFileSync(REPORT_FILE, md, 'utf8');

console.log('Bericht geschrieben nach:', REPORT_FILE);
console.log('Stichprobe:', results.length, 'Stories');
console.log('Mittlere Kosten:', fmt(costStats.mean, 4), '€ (Min:', fmt(costStats.min, 4), '€, Max:', fmt(costStats.max, 4), '€)');
