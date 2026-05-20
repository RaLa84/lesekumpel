// Erstellt (oder updated) den Mini-Workflow "Lesekumpel - Stilreferenz-Generator (Neutral)"
// in n8n. Der Workflow generiert die 8 charakterfreien Stilreferenzen via gpt-image-2
// und committed sie direkt nach bilder/bildstil-vorschau/neutral/{stil}.png.
//
// Idempotent: Existiert der Workflow schon, wird er per PUT aktualisiert. Sonst per POST neu.
//
// Trigger: Manual Trigger - User loest den Workflow im n8n UI per "Execute Workflow" aus.
//
// Aufruf:
//   node n8n-config/scripts/deploy-style-ref-generator-workflow.js
//
// Benoetigt: N8N_URL + N8N_API_KEY in n8n-config/.env

const fs = require('node:fs');
const path = require('node:path');

const ENV_PATH = path.resolve(__dirname, '..', '.env');
const env = {};
for (const line of fs.readFileSync(ENV_PATH, 'utf8').split(/\r?\n/)) {
  const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
  if (m) env[m[1]] = m[2];
}
const N8N_URL = env.N8N_URL;
const N8N_API_KEY = env.N8N_API_KEY;
if (!N8N_URL || !N8N_API_KEY) {
  console.error('N8N_URL oder N8N_API_KEY fehlt in', ENV_PATH);
  process.exit(1);
}

const WORKFLOW_NAME = 'Lesekumpel – Stilreferenz-Generator (Neutral)';
const OPENAI_CRED_ID = 'l6uYdixlS8PjMxDD';   // aus story-generator-workflow
const OPENAI_CRED_NAME = 'OpenAi account';
const GITHUB_CRED_ID = 'WBP07xjckQiul5s7';
const GITHUB_CRED_NAME = 'GitHub account';

// ============================================================================
// 8 Style-Configs
// Prompts strukturiert (Label-basiert, kompakt) statt Monster-Prompt mit
// "| NEGATIVE: ..." Suffix. Hintergrund: gpt-image-2 hat kein offizielles
// Negative-Prompt-Feld; lange "no people, no animals, ..." Listen koennen
// im Moderation-System paradoxerweise als Erwaehnungen wirken.
// Statt Negationen: positiv ausschliessende Sprache ("pure landscape only",
// "object still life only").
// ============================================================================
const STYLES = [
  { key: 'aquarell', filename: 'aquarell.png',
    style: "Traditional children's book watercolor illustration, hand-painted with warm cream paper texture, soft pastel palette, gentle wet-on-wet washes, loose expressive brush strokes, painterly rendering inspired by Beatrix Potter and Quentin Blake.",
    subject: "A sunlit summer meadow with wildflowers and clover under a soft cloudy sky, gentle warm light. Pure landscape only — empty of any beings or figures." },
  { key: 'cartoon', filename: 'cartoon.png',
    style: "Modern children's cartoon illustration in the style of Bluey and Peppa Pig: bold black outlines of uniform stroke width, bright saturated flat colors with one soft tonal shadow per shape, simple rounded geometric shapes.",
    subject: "An open colorful toy chest on a wooden floor, filled with wooden blocks, balls, a wooden toy train and a kite leaning against it. Inanimate objects only — object still life." },
  { key: 'buntstift', filename: 'buntstift.png',
    style: "Colored pencil drawing on warm cream paper, visible pencil grain and diagonal hatching strokes, soft muted earthy palette, slightly sketchy hand-drawn outlines.",
    subject: "A single red apple with one green leaf resting on a wooden tabletop, a few colored pencils lying beside it. Pure still life — inanimate objects only." },
  { key: 'pixel-art', filename: 'pixel-art.png',
    style: "Modern 32-bit pixel art in the aesthetic of Game Boy Advance JRPGs such as Advance Wars and Fire Emblem: clearly defined dark outlines, rich but limited 32-color palette with subtle dithering, uniform pixel density.",
    subject: "An isometric pixel-art meadow diorama with two trees, a few mushrooms, tall grass and a small winding stream. Pure environment only — empty of any beings or characters." },
  { key: 'anime', filename: 'anime.png',
    style: "Anime-style illustration inspired by Studio Ghibli: cel-shaded with one soft shadow layer, bright vibrant saturated colors, clean uniform line art with tapered ends, soft atmospheric perspective.",
    subject: "A cloud-filled sky over distant rolling mountains with a green meadow in the foreground and a single old tree on a hill. Pure landscape only — empty of any beings or figures." },
  { key: 'traumwelt', filename: 'traumwelt.png',
    style: "Dreamlike magical digital painting, soft glowing volumetric light, ethereal misty atmosphere, luminous pastel palette with high contrast highlights, rim lighting on foliage, inspired by Ori and the Blind Forest and Studio Ghibli night scenes.",
    subject: "A misty forest clearing at night with a full moon between the trees and softly glowing floating light points drifting in the air over dewy grass. Pure landscape only — empty of any beings or characters." },
  { key: 'knete', filename: 'knete.png',
    style: "Claymation stop-motion photograph style inspired by Aardman Animations (Wallace and Gromit): 3D plasticine objects with visible fingerprints and clay thumbprint texture, slightly uneven handmade surfaces, warm three-point studio lighting with soft shadows.",
    subject: "A claymation red apple and a claymation green pear sitting on a claymation wooden tabletop, simple soft cloth in the background, warm studio light. Object still life only." },
  { key: 'voxel', filename: 'voxel.png',
    style: "Low-poly voxel art in the aesthetic of Crossy Road and Minecraft: 3D cube-based geometry with uniform voxel size, limited 16-color palette per material, consistent isometric 3/4 camera angle, soft ambient shading with a single directional light.",
    subject: "An isometric voxel island diorama with a few trees, scattered rocks, a small blue lake and a winding sand path. Pure landscape diorama only — empty of any beings." }
];

// Prompt-Format: kompakt, mit Labels. Quadratisches Format wird durch size-Param erzwungen.
function buildPrompt(s) {
  return `Style: ${s.style}\nScene: ${s.subject}\nComposition: square 1:1, full bleed to all four edges, no inner frame, no margin, no text or watermarks.`;
}

// ============================================================================
// Workflow-Knoten-Konstruktion
// ============================================================================
const itemsArray = STYLES.map(s => ({
  key: s.key,
  filename: s.filename,
  prompt: buildPrompt(s)
}));

const itemsPrepCode = `// Erzeugt 8 Items, eines pro Stilreferenz
const items = ${JSON.stringify(itemsArray, null, 2)};
return items.map(item => ({ json: item }));`;

const extractCode = `// Holt b64_json aus OpenAI-Response. Wenn der Aufruf gescheitert ist (z.B. Safety-Block),
// gibt der HTTP-Knoten bei onError=continueRegularOutput ein Error-Objekt statt b64-Daten zurueck.
// In dem Fall ueberspringen wir das Item still, damit nachgelagerte Knoten gar nicht laufen.
const openaiResp = $input.first().json;
const b64 = openaiResp?.data?.[0]?.b64_json;
const meta = $('Stile vorbereiten').item.json;

if (!b64) {
  console.warn('Stilreferenz uebersprungen (keine b64-Daten): ' + meta.key + ' - ' + JSON.stringify(openaiResp).slice(0, 200));
  return []; // Item droppen, GitHub-Knoten laeuft fuer dieses Item nicht
}

return { json: { filename: meta.filename, key: meta.key, b64 } };`;

// Topologie (sequentielle Schleife mit 14s Wait pro Iteration):
//
//   Manuell starten -> Stile vorbereiten -> Loop -> [main:done?]
//                                            |
//                                          [main:next] -> Bild generieren -> b64 extrahieren -> GitHub commit -> Wait 14s -> Loop
//
// Das garantiert exakt 1 OpenAI-Aufruf alle ~14s = max ~4.3 Aufrufe/min,
// sicher unter dem Rate-Limit von 5/min fuer gpt-image-2.
const nodes = [
  {
    id: 'trigger',
    name: 'Manuell starten',
    type: 'n8n-nodes-base.manualTrigger',
    typeVersion: 1,
    position: [320, 320],
    parameters: {}
  },
  {
    id: 'items-prep',
    name: 'Stile vorbereiten',
    type: 'n8n-nodes-base.code',
    typeVersion: 2,
    position: [560, 320],
    parameters: { jsCode: itemsPrepCode }
  },
  {
    id: 'loop',
    name: 'Loop pro Stil',
    type: 'n8n-nodes-base.splitInBatches',
    typeVersion: 3,
    position: [800, 320],
    parameters: { batchSize: 1, options: {} }
  },
  {
    id: 'image-gen',
    name: 'Bild generieren',
    type: 'n8n-nodes-base.httpRequest',
    typeVersion: 4.2,
    position: [1040, 320],
    parameters: {
      method: 'POST',
      url: 'https://api.openai.com/v1/images/generations',
      authentication: 'predefinedCredentialType',
      nodeCredentialType: 'openAiApi',
      sendBody: true,
      specifyBody: 'json',
      jsonBody: '={\n  "model": "gpt-image-2",\n  "prompt": {{ JSON.stringify($json.prompt) }},\n  "size": "1024x1024",\n  "quality": "low",\n  "moderation": "low",\n  "n": 1\n}',
      options: { timeout: 120000 }
    },
    credentials: {
      openAiApi: { id: OPENAI_CRED_ID, name: OPENAI_CRED_NAME }
    },
    retryOnFail: true,
    maxTries: 5,
    waitBetweenTries: 15000,
    onError: 'continueRegularOutput'
  },
  {
    id: 'extract',
    name: 'b64 extrahieren',
    type: 'n8n-nodes-base.code',
    typeVersion: 2,
    position: [1280, 320],
    parameters: { jsCode: extractCode }
  },
  {
    id: 'commit',
    name: 'GitHub: Stilreferenz committen',
    type: 'n8n-nodes-base.github',
    typeVersion: 1.1,
    position: [1520, 320],
    parameters: {
      authentication: 'oAuth2',
      resource: 'file',
      owner: { __rl: true, value: 'RaLa84', mode: 'name' },
      repository: { __rl: true, value: 'lesekumpel', mode: 'list', cachedResultName: 'lesekumpel', cachedResultUrl: 'https://github.com/RaLa84/lesekumpel' },
      filePath: '=bilder/bildstil-vorschau/neutral/{{ $json.filename }}',
      fileContent: '={{ $json.b64 }}',
      commitMessage: '=Stilreferenz neutral: {{ $json.filename }}'
    },
    credentials: {
      githubOAuth2Api: { id: GITHUB_CRED_ID, name: GITHUB_CRED_NAME }
    },
    retryOnFail: true,
    maxTries: 3,
    waitBetweenTries: 3000,
    onError: 'continueRegularOutput'
  },
  {
    id: 'wait',
    name: 'Pause 14s',
    type: 'n8n-nodes-base.wait',
    typeVersion: 1.1,
    position: [1760, 320],
    parameters: { amount: 14, unit: 'seconds' },
    webhookId: 'style-ref-wait-' + Date.now()
  }
];

// SplitInBatches hat 2 Output-Slots:
//   main[0] = "done" (alle Items durch, einmaliger Output am Ende)
//   main[1] = "loop"  (jedes naechste Item)
// Wir verbinden main[1] -> Bild generieren -> ... -> Wait -> zurueck zu Loop
const connections = {
  'Manuell starten':                 { main: [[{ node: 'Stile vorbereiten', type: 'main', index: 0 }]] },
  'Stile vorbereiten':               { main: [[{ node: 'Loop pro Stil',     type: 'main', index: 0 }]] },
  'Loop pro Stil':                   { main: [
                                         [],  // main[0] = done (kein Folge-Knoten)
                                         [{ node: 'Bild generieren', type: 'main', index: 0 }]  // main[1] = loop
                                       ] },
  'Bild generieren':                 { main: [[{ node: 'b64 extrahieren', type: 'main', index: 0 }]] },
  'b64 extrahieren':                 { main: [[{ node: 'GitHub: Stilreferenz committen', type: 'main', index: 0 }]] },
  'GitHub: Stilreferenz committen':  { main: [[{ node: 'Pause 14s', type: 'main', index: 0 }]] },
  'Pause 14s':                       { main: [[{ node: 'Loop pro Stil', type: 'main', index: 0 }]] }
};

const workflowBody = {
  name: WORKFLOW_NAME,
  nodes,
  connections,
  settings: { executionOrder: 'v1' },
  staticData: null
};

// ============================================================================
// n8n REST API: existiert Workflow schon? -> PUT, sonst POST
// ============================================================================
async function apiGet(url) {
  const r = await fetch(`${N8N_URL}/api/v1${url}`, {
    headers: { 'X-N8N-API-KEY': N8N_API_KEY, 'Accept': 'application/json' }
  });
  if (!r.ok) throw new Error(`GET ${url} -> ${r.status} ${await r.text()}`);
  return r.json();
}

async function apiPost(url, body) {
  const r = await fetch(`${N8N_URL}/api/v1${url}`, {
    method: 'POST',
    headers: { 'X-N8N-API-KEY': N8N_API_KEY, 'Accept': 'application/json', 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  if (!r.ok) throw new Error(`POST ${url} -> ${r.status} ${await r.text()}`);
  return r.json();
}

async function apiPut(url, body) {
  const r = await fetch(`${N8N_URL}/api/v1${url}`, {
    method: 'PUT',
    headers: { 'X-N8N-API-KEY': N8N_API_KEY, 'Accept': 'application/json', 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  if (!r.ok) throw new Error(`PUT ${url} -> ${r.status} ${await r.text()}`);
  return r.json();
}

(async () => {
  const list = await apiGet('/workflows?limit=250');
  const existing = (list.data || []).find(w => w.name === WORKFLOW_NAME);

  if (existing) {
    console.log(`Workflow existiert (id=${existing.id}). Update via PUT.`);
    const updated = await apiPut(`/workflows/${existing.id}`, workflowBody);
    console.log(`OK. workflow.id=${updated.id} name="${updated.name}"`);
    console.log('');
    console.log('Naechster Schritt: Im n8n UI oeffnen und "Execute Workflow" klicken:');
    console.log(`   ${N8N_URL}/workflow/${updated.id}`);
  } else {
    console.log('Workflow existiert noch nicht. Erstelle via POST.');
    const created = await apiPost('/workflows', workflowBody);
    console.log(`OK. workflow.id=${created.id} name="${created.name}"`);
    console.log('');
    console.log('Naechster Schritt: Im n8n UI oeffnen und "Execute Workflow" klicken:');
    console.log(`   ${N8N_URL}/workflow/${created.id}`);
  }
})().catch(err => {
  console.error('FEHLER:', err.message);
  process.exit(1);
});
