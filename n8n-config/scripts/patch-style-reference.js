// Style-Reference-Image Pipeline (Variante E)
//
// Aktuell: Generator-Switch → Gemini Fallback Bild (googleGemini, text→image)
//          → Bild-Daten extrahieren (Gemini) [extractFromFile binary→property]
//          → GitHub: Bild hochladen
//
// Neu:     Generator-Switch → Style-Ref vorbereiten (Code, neu)
//          → Gemini Fallback Bild (httpRequest multimodal mit text+image)
//          → Bild-Daten extrahieren (Gemini) (Code, ersetzt extractFromFile)
//          → GitHub: Bild hochladen
//
// Plus: "Bildszenen vorbereiten" bekommt STYLE_REFS-Mapping und
// Style-Anker-Hinweis im scenePrompt.

const fs = require('node:fs');
const path = require('node:path');

const TMP_DIR = path.resolve(__dirname, '..', '_tmp');
const SRC = path.join(TMP_DIR, 'workflow_current.json');
const PUT_BODY = path.join(TMP_DIR, 'workflow_styleref_patched.json');
const LOCAL_MIRROR = path.resolve(__dirname, '..', 'workflows', 'lesekumpel-story-generator.json');

const STYLE_REF_PREP_ID = 'style-ref-prep';
const STYLE_REF_PREP_NAME = 'Style-Ref vorbereiten';

// --- Code für Bildszenen vorbereiten (mit STYLE_REFS) ---
const NEW_PREP_CODE = `const prev = $input.first().json;

if (!prev.imageCount || prev.imageCount === 0) {
  return [{ json: { ...prev, skipImages: true } }];
}

// Style-Reference-URL aus Bildstil ableiten
const STYLE_REFS = {
  'Aquarell':  'bilder/bildstil-vorschau/aquarell.webp',
  'Cartoon':   'bilder/bildstil-vorschau/cartoon.webp',
  'Buntstift': 'bilder/bildstil-vorschau/buntstift.webp',
  'Pixel-Art': 'bilder/bildstil-vorschau/pixel-art.webp',
  'Anime':     'bilder/bildstil-vorschau/anime.webp',
  'Traumwelt': 'bilder/bildstil-vorschau/traumwelt.webp',
  'Knete':     'bilder/bildstil-vorschau/knete.webp',
  'Voxel':     'bilder/bildstil-vorschau/voxel.webp'
};
const bildstilFromWebhook = $('Webhook: Geschichte anfordern').first().json.body?.Bildstil || prev.imageStyle || 'Cartoon';
const styleRefPath = STYLE_REFS[bildstilFromWebhook] || STYLE_REFS['Cartoon'];
const styleRefUrl = \`https://rala84.github.io/lesekumpel/\${styleRefPath}\`;

const charRef = prev.characterReference || '';
const imageStylePositive = prev.imageStylePositive || "children's book watercolor illustration, soft pastel colors, consistent rendering across all panels of this story: same line weight, same color palette, same character proportions and facial features";
const imageStyleNegative = prev.imageStyleNegative || "no text, no watermarks, no extra limbs, no duplicate props, no floating objects, no mixed art styles, no style drift";
const imageCount = prev.imageCount || 1;
const sceneRules = Array.isArray(prev.sceneRules) ? prev.sceneRules : [];

const rulesBlock = sceneRules.length > 0
  ? sceneRules.map((r, i) => \`\${i+1}. \${r}\`).join('\\n')
  : '(no explicit invariants — infer plausibility from story)';

const sceneUserPrompt = \`You are a prompt compiler for a children's book illustrator. Fill the slot template below. Do NOT write free prose.

VISUAL STYLE ANCHOR: A reference image will be attached to every generation call. That image defines the art style, color palette, line weight, character proportions, rendering technique, and overall world atmosphere. Match it strictly across all scenes — but generate completely new content (different characters, different scene, different composition) per the prompt below. Do NOT copy the reference's content; only its style.

ART STYLE (positive, supplementary to the reference image):
\${imageStylePositive}

ART STYLE (negative):
\${imageStyleNegative}

CHARACTER REFERENCE (repeat exactly in EVERY scene):
\${charRef}

SCENE INVARIANTS (global rules that apply to EVERY scene as constraints, NOT as actions to depict):
\${rulesBlock}

STORY TEXT:
\${prev.storyText || ''}

TASK: Output a JSON array with exactly \${imageCount} objects. Pick \${imageCount} distinct moment(s) from the story that together cover the story arc. Each scene shows exactly ONE moment — never combine two moments into one image, never show the same character twice.

Each object has this shape:
{
  "scene": <1-based number>,
  "momentSummary": "<one English sentence naming the single story moment this scene depicts>",
  "positive": "Match style of attached reference image (anchor). \${imageStylePositive}. Characters present (repeat description verbatim from CHARACTER REFERENCE for each — humans keep clothing, animals keep real animal anatomy with NO clothing and NO costume): <CHAR_REF_SUBSET>. Ages: <explicit age for every HUMAN character; for animals write \\"real animal — no age\\">. Composition: <camera angle>, <action verb>. Spatial: <ON|NEXT-TO|BEHIND|IN-FRONT-OF> <object>. Props in hands: left=<X or none>, right=<Y or none>. Setting: <location>. Mood: <adjective>.",
  "negative": "<ART_STYLE_NEGATIVE>, wrong ages, duplicate props, floating objects, extra characters not in the story, same character shown more than once, animals depicted as humans in costume, anthropomorphic animals unless explicitly stated in the story, deviation from reference image style",
  "invariantCheck": "<one English sentence asserting this scene respects every SCENE INVARIANT above>",
  "compositionCheck": "<one English sentence asserting this scene is a full-bleed square 1:1 image with artwork reaching all four corners, no white margin, no inner matte>"
}

CHECKS for every scene:
1. Spatial relation is explicit (ON / NEXT-TO / BEHIND / IN-FRONT-OF).
2. Every named prop shown has a hand slot (left / right / both / none).
3. Every HUMAN character has an explicit age that matches the story; animals are rendered as actual animals with real anatomy, not as humans in costume.
4. Only include characters named in the story; do not invent extras.
5. Each named character appears AT MOST ONCE in the scene — never duplicate a character.
6. Scene depicts exactly ONE moment from the story; do not combine moments.
7. Camera angle and setting vary between scenes; character appearance stays identical.

Output ONLY the JSON array, no markdown, no explanation.\`;

return [{ json: { ...prev, sceneUserPrompt, styleRefUrl } }];`;

// --- Code für Style-Ref vorbereiten (NEU) ---
const STYLE_REF_PREP_CODE = `// Holt das Style-Reference-Image und base64-encoded es für den nächsten Gemini-Call
const url = $json.styleRefUrl || $('Bildszenen vorbereiten').first().json.styleRefUrl;
if (!url) {
  return { json: { ...$json, styleRefBase64: '', styleRefMimeType: 'image/webp' } };
}
const res = await fetch(url);
if (!res.ok) {
  return { json: { ...$json, styleRefBase64: '', styleRefMimeType: 'image/webp' } };
}
const buffer = Buffer.from(await res.arrayBuffer());
const base64 = buffer.toString('base64');
const mime = res.headers.get('content-type') || 'image/webp';
return { json: { ...$json, styleRefBase64: base64, styleRefMimeType: mime } };`;

// --- Neuer Code für Bild-Daten extrahieren (Gemini) — parst multimodal-Response ---
const NEW_EXTRACT_CODE = `// Parst die Gemini-multimodal-Response: extrahiert die base64-Bild-Daten aus
// candidates[0].content.parts[*].inlineData.data und setzt sie als \\$json.data
// (kompatibel mit dem GitHub-Upload-Knoten der \\$json.data direkt nutzt)
const inputJson = $input.first().json;
const parts = inputJson?.candidates?.[0]?.content?.parts || [];
const imagePart = parts.find(p => p && p.inlineData && p.inlineData.data);
if (!imagePart) {
  throw new Error('Gemini-Response enthält kein Bild — candidates[0].content.parts hat kein inlineData');
}
const data = imagePart.inlineData.data;
return { json: { ...inputJson, data } };`;

function patchWorkflow(wf, label) {
  // 1. Bildszenen vorbereiten — neuer Code mit STYLE_REFS
  const prep = wf.nodes.find(n => n.name === 'Bildszenen vorbereiten');
  if (!prep) throw new Error(`[${label}] Bildszenen vorbereiten nicht gefunden`);
  prep.parameters.jsCode = NEW_PREP_CODE;

  // 2. Style-Ref vorbereiten (NEU, idempotent)
  const fb = wf.nodes.find(n => n.name === 'Gemini Fallback Bild');
  if (!fb) throw new Error(`[${label}] Gemini Fallback Bild nicht gefunden`);

  let added = 0;
  if (!wf.nodes.find(n => n.id === STYLE_REF_PREP_ID)) {
    wf.nodes.push({
      id: STYLE_REF_PREP_ID,
      name: STYLE_REF_PREP_NAME,
      type: 'n8n-nodes-base.code',
      typeVersion: 2,
      position: [fb.position[0] - 220, fb.position[1]],
      parameters: { jsCode: STYLE_REF_PREP_CODE }
    });
    added++;
  }

  // 3. Gemini Fallback Bild → httpRequest mit multimodal Body
  fb.type = 'n8n-nodes-base.httpRequest';
  fb.typeVersion = 4.2;
  fb.parameters = {
    method: 'POST',
    url: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent',
    sendHeaders: true,
    headerParameters: {
      parameters: [
        { name: 'x-goog-api-key', value: '={{ $credentials.googlePalmApi.apiKey }}' }
      ]
    },
    sendBody: true,
    specifyBody: 'json',
    jsonBody: `={
  "contents": [{
    "parts": [
      { "inlineData": { "mimeType": {{ JSON.stringify($json.styleRefMimeType || 'image/webp') }}, "data": {{ JSON.stringify($json.styleRefBase64 || '') }} } },
      { "text": {{ JSON.stringify($json.imagePrompt || '') }} }
    ]
  }]
}`,
    options: { timeout: 120000 }
  };
  // Credentials: googlePalmApi behalten (HTTP-Request-Knoten kann das via expression {{ $credentials }} nutzen — für Header-Auth)
  // Aber: predefinedCredentialType ist sauberer. Setzen wir das.
  fb.credentials = {}; // Reset alte (LangChain-style)
  fb.parameters.authentication = 'predefinedCredentialType';
  fb.parameters.nodeCredentialType = 'googlePalmApi';
  fb.credentials = {
    googlePalmApi: {
      id: '6COxa9BJR4aj2W2w',
      name: 'Google Gemini(PaLM) Api account'
    }
  };
  // Mit predefinedCredentialType wird der API-Key automatisch als Authorization-Header oder ?key= gesetzt.
  // Falls der googlePalmApi-Credential das nicht richtig macht, müssten wir auf genericCredentialType wechseln.
  // Wir vertrauen erstmal auf die n8n-Standard-Behandlung.
  delete fb.parameters.headerParameters; // weil predefinedCredentialType das selbst handhabt

  // 4. Bild-Daten extrahieren (Gemini) — von extractFromFile zu code
  const ext = wf.nodes.find(n => n.name === 'Bild-Daten extrahieren (Gemini)');
  if (!ext) throw new Error(`[${label}] Bild-Daten extrahieren (Gemini) nicht gefunden`);
  ext.type = 'n8n-nodes-base.code';
  ext.typeVersion = 2;
  ext.parameters = { jsCode: NEW_EXTRACT_CODE };

  // 5. Connections: Generator-Switch (Branch 3) → Style-Ref vorbereiten → Gemini Fallback Bild
  const gsConn = wf.connections['Generator-Switch'];
  if (gsConn?.main?.[2]) {
    // Branch 3 zeigt aktuell auf 'Gemini Fallback Bild' → umleiten auf Style-Ref vorbereiten
    gsConn.main[2] = [{ node: STYLE_REF_PREP_NAME, type: 'main', index: 0 }];
  }
  wf.connections[STYLE_REF_PREP_NAME] = {
    main: [[{ node: 'Gemini Fallback Bild', type: 'main', index: 0 }]]
  };
  // Gemini Fallback Bild → Bild-Daten extrahieren (Gemini) bleibt unverändert

  return added;
}

// --- Live ---
const wf = JSON.parse(fs.readFileSync(SRC, 'utf8'));
if (wf.name !== 'Lesekumpel – Neuroinclusive Story Generator') throw new Error('Falscher Workflow-Name: ' + wf.name);
const liveAdded = patchWorkflow(wf, 'live');

const ALLOWED = new Set(['executionOrder','saveExecutionProgress','saveManualExecutions','saveDataErrorExecution','saveDataSuccessExecution','executionTimeout','errorWorkflow','timezone','callerPolicy','callerIds']);
const cleanSettings = {};
for (const [k, v] of Object.entries(wf.settings ?? {})) if (ALLOWED.has(k)) cleanSettings[k] = v;
const putBody = { name: wf.name, nodes: wf.nodes, connections: wf.connections, settings: cleanSettings, staticData: wf.staticData ?? null };
fs.writeFileSync(PUT_BODY, JSON.stringify(putBody, null, 2), 'utf8');

// --- Local mirror ---
const local = JSON.parse(fs.readFileSync(LOCAL_MIRROR, 'utf8'));
const localAdded = patchWorkflow(local, 'local');
fs.writeFileSync(LOCAL_MIRROR, JSON.stringify(local, null, 2), 'utf8');

console.log(JSON.stringify({
  ok: true,
  liveAdded,
  localAdded,
  liveTotalNodes: wf.nodes.length,
  putBodyPath: PUT_BODY,
  putBodySize: fs.statSync(PUT_BODY).size
}, null, 2));
