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
// 8 Style-Configs (Prompts identisch zu generate-neutral-style-refs.js)
// ============================================================================
const NO_CHARS = 'no people, no humans, no children, no faces, no animals, no creatures, no characters, no figures, no silhouettes of beings';

const STYLES = [
  { key: 'aquarell', filename: 'aquarell.png',
    positive: "traditional children's book watercolor illustration, hand-painted with warm cream paper texture filling the entire image, soft pastel palette, gentle wet-on-wet washes with visible bleeding edges, loose expressive brush strokes, soft painterly rendering, inspired by Beatrix Potter and Quentin Blake, full bleed composition extending to all four image edges, no inner framing, subjects and background reach every corner of the image, square 1:1 aspect ratio",
    subject: "Subject: a sunlit summer meadow with wildflowers and clover, soft cloudy sky, gentle warm light, no people, no animals, no characters, no faces, pure landscape still life.",
    negative: "no text, no watermarks, no labels, no captions, no margin, no frame, no vignette, no extra limbs, no floating objects, no mixed art styles, no style drift, no photorealism" },
  { key: 'cartoon', filename: 'cartoon.png',
    positive: "modern children's cartoon illustration inspired by Bluey and Peppa Pig, bold black outlines of uniform stroke width, bright saturated flat colors with one soft tonal shadow per shape, simple rounded geometric shapes, playful composition, full bleed composition extending to all four image edges, no inner framing, subjects and background reach every corner of the image, square 1:1 aspect ratio",
    subject: "Subject: an open colorful toy chest with wooden blocks, balls, a wooden train and a kite, on a wooden floor, no plush animals, no characters with faces, pure object still life.",
    negative: "no text, no watermarks, no labels, no captions, no margin, no frame, no vignette, no extra limbs, no floating objects, no mixed art styles, no style drift, no gritty textures, no realistic shading, no photorealism" },
  { key: 'buntstift', filename: 'buntstift.png',
    positive: "colored pencil drawing with warm cream paper texture filling the entire image, visible pencil grain and diagonal hatching strokes, soft muted earthy palette, slightly sketchy outlines, hand-drawn children's illustration feel, full bleed composition extending to all four image edges, no inner framing, subjects and background reach every corner of the image, square 1:1 aspect ratio",
    subject: "Subject: a single red apple with a green leaf resting on a wooden tabletop, a few colored pencils beside it, no people, no animals, no characters, pure still life.",
    negative: "no text, no watermarks, no labels, no captions, no margin, no frame, no vignette, no crayon texture, no digital smooth gradients, no vector look, no photorealism, no extra limbs, no floating objects, no mixed art styles, no style drift" },
  { key: 'pixel-art', filename: 'pixel-art.png',
    positive: "modern 32-bit style pixel art in the aesthetic of Game Boy Advance JRPGs such as Advance Wars and Fire Emblem, clearly defined dark outlines, rich but limited 32-color palette with subtle dithering for shading, uniform pixel density across the entire image, full bleed composition extending to all four image edges, no inner framing, subjects and background reach every corner of the image, square 1:1 aspect ratio",
    subject: "Subject: an isometric pixel-art meadow diorama with two trees, a few mushrooms, tall grass and a small winding stream, no characters, no creatures, no sprites of people or animals, pure landscape diorama.",
    negative: "no text, no watermarks, no labels, no captions, no margin, no frame, no vignette, no mixed pixel resolutions between regions, no smooth gradients, no anti-aliasing, no blurry edges, no 3D shading, no photorealism, no extra limbs, no floating objects, no style drift" },
  { key: 'anime', filename: 'anime.png',
    positive: "anime-style children's illustration inspired by Studio Ghibli, cel-shaded with one soft shadow layer, bright vibrant saturated colors, clean uniform line art with tapered ends, soft atmospheric perspective, full bleed composition extending to all four image edges, no inner framing, subjects and background reach every corner of the image, square 1:1 aspect ratio",
    subject: "Subject: a cloud-filled sky over distant rolling mountains with a green meadow in the foreground, a single old tree on a hill, Studio Ghibli mood, no people, no animals, no characters.",
    negative: "no text, no watermarks, no labels, no captions, no margin, no frame, no vignette, no extra limbs, no floating objects, no mixed art styles, no style drift, no gritty shading, no sketchy outlines, no photorealism" },
  { key: 'traumwelt', filename: 'traumwelt.png',
    positive: "dreamlike magical digital painting, soft glowing volumetric light, ethereal misty atmosphere, luminous pastel palette with high contrast highlights, rim lighting on foliage, inspired by Ori and the Blind Forest and Studio Ghibli night scenes, full bleed composition extending to all four image edges, no inner framing, subjects and background reach every corner of the image, square 1:1 aspect ratio",
    subject: "Subject: a misty forest clearing at night with a full moon between the trees and softly glowing floating light points drifting in the air, dewy grass, no people, no animals, no creatures, pure atmospheric landscape.",
    negative: "no text, no watermarks, no labels, no captions, no margin, no frame, no vignette, no harsh black outlines, no flat cartoon shading, no photorealism, no gritty realism, no extra limbs, no floating objects, no mixed art styles, no style drift" },
  { key: 'knete', filename: 'knete.png',
    positive: "claymation stop-motion photograph style inspired by Aardman Animations (Wallace and Gromit, Shaun the Sheep), 3D plasticine objects with visible fingerprints and clay thumbprint texture, slightly uneven handmade surfaces, warm three-point studio lighting casting soft shadows, full bleed composition extending to all four image edges, no inner framing, subjects and background reach every corner of the image, square 1:1 aspect ratio",
    subject: "Subject: a claymation red apple and a claymation green pear sitting on a claymation wooden tabletop, simple soft cloth in the background, warm studio light, no characters, no animals, pure still-life arrangement.",
    negative: "no text, no watermarks, no labels, no captions, no margin, no frame, no vignette, no 2D flat shading, no painted illustration look, no CGI plastic sheen, no photorealism, no extra limbs, no floating objects, no mixed art styles, no style drift" },
  { key: 'voxel', filename: 'voxel.png',
    positive: "low-poly voxel art illustration in the aesthetic of Crossy Road and Minecraft, 3D cube-based geometry with uniform voxel size, limited 16-color palette per material, consistent isometric 3/4 camera angle, soft ambient shading with a single directional light, full bleed composition extending to all four image edges, no inner framing, subjects and background reach every corner of the image, square 1:1 aspect ratio",
    subject: "Subject: an isometric voxel island diorama with a few trees, scattered rocks, a small blue lake and a winding sand path, no characters, no animals, no people, pure landscape voxel scene.",
    negative: "no text, no watermarks, no labels, no captions, no margin, no frame, no vignette, no smooth curved surfaces, no anti-aliasing, no photorealism, no detailed textures on voxels, no extra limbs, no floating objects, no mixed art styles, no style drift" }
];

function buildPrompt(s) {
  return `${s.positive} . ${s.subject} | NEGATIVE: ${s.negative}, ${NO_CHARS}`;
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

const extractCode = `// Holt b64_json aus OpenAI-Response und kombiniert es mit dem Filename aus dem urspruenglichen Item
const openaiResp = $input.first().json;
const b64 = openaiResp?.data?.[0]?.b64_json;
if (!b64) {
  throw new Error('Keine b64_json-Daten in OpenAI-Response: ' + JSON.stringify(openaiResp).slice(0, 300));
}

// Filename aus dem korrespondierenden items-prep Item holen (gleicher Run-Index)
const meta = $('Stile vorbereiten').item.json;
return { json: { filename: meta.filename, key: meta.key, b64 } };`;

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
    id: 'image-gen',
    name: 'Bild generieren',
    type: 'n8n-nodes-base.httpRequest',
    typeVersion: 4.2,
    position: [800, 320],
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
    maxTries: 3,
    waitBetweenTries: 3000
  },
  {
    id: 'extract',
    name: 'b64 extrahieren',
    type: 'n8n-nodes-base.code',
    typeVersion: 2,
    position: [1040, 320],
    parameters: { jsCode: extractCode }
  },
  {
    id: 'commit',
    name: 'GitHub: Stilreferenz committen',
    type: 'n8n-nodes-base.github',
    typeVersion: 1.1,
    position: [1280, 320],
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
    waitBetweenTries: 3000
  }
];

const connections = {
  'Manuell starten':                 { main: [[{ node: 'Stile vorbereiten', type: 'main', index: 0 }]] },
  'Stile vorbereiten':               { main: [[{ node: 'Bild generieren',   type: 'main', index: 0 }]] },
  'Bild generieren':                 { main: [[{ node: 'b64 extrahieren',   type: 'main', index: 0 }]] },
  'b64 extrahieren':                 { main: [[{ node: 'GitHub: Stilreferenz committen', type: 'main', index: 0 }]] }
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
