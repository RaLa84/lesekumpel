// Schema-validierter JSON-Output für "Story-Elemente extrahieren":
//   - Neuer Knoten "Elemente: Schema" (outputParserStructured) mit JSON-Schema
//   - chainLlm-Knoten "🧩 Story-Elemente extrahieren": hasOutputParser = true
//   - Connection: Schema-Knoten → chainLlm via ai_outputParser
//   - "Elemente parsen"-Code: liest jetzt das strukturierte `output`-Feld,
//     fällt bei Bedarf auf den alten Regex-Parser zurück (Backward-Compat)
//
// Wirkung: Das LLM bekommt automatisch Format-Instructions vom Output-Parser
// injiziert; ungültiges JSON wird auf Modell-Ebene bereits stark reduziert,
// und falls doch invalid → der Output-Parser gibt einen klaren Error statt
// silently halben Daten.

const fs = require('node:fs');
const path = require('node:path');

const TMP_DIR = path.resolve(__dirname, '..', '_tmp');
const SRC = path.join(TMP_DIR, 'workflow_current.json');
const PUT_BODY = path.join(TMP_DIR, 'workflow_elements_patched.json');
const LOCAL_MIRROR = path.resolve(__dirname, '..', 'workflows', 'lesekumpel-story-generator.json');

const SCHEMA_NODE_ID = 'elements-schema';
const SCHEMA_NODE_NAME = 'Elemente: Schema';
const ELEMENTS_LLM_NAME = '🧩 Story-Elemente extrahieren';
const ELEMENTS_LLM_ID = 'agent-elements';

// JSON-Schema für Story-Elemente
const ELEMENTS_SCHEMA = {
  type: 'object',
  required: ['characters', 'props', 'setting', 'sceneRules'],
  properties: {
    characters: {
      type: 'array',
      items: {
        type: 'object',
        required: ['name', 'type', 'role', 'appearance'],
        properties: {
          name: { type: 'string' },
          type: { type: 'string', enum: ['human', 'animal', 'creature', 'object'] },
          species: { type: ['string', 'null'] },
          role: { type: 'string' },
          ageYears: { type: ['integer', 'null'] },
          heightCategory: { type: ['string', 'null'] },
          appearance: { type: 'string' }
        }
      }
    },
    props: {
      type: 'array',
      items: {
        type: 'object',
        required: ['name', 'count', 'heldIn', 'description'],
        properties: {
          name: { type: 'string' },
          count: { type: 'integer' },
          heldIn: { type: 'string' },
          description: { type: 'string' }
        }
      }
    },
    setting: { type: 'string' },
    sceneRules: { type: 'array', items: { type: 'string' } }
  }
};

// Neuer "Elemente parsen" Code: strukturierte Daten zuerst, Regex-Fallback wenn nötig
const NEW_ELEMENTS_PARSE_CODE = `const prev = $('Story-Elemente vorbereiten').first().json;
const inputJson = $input.first().json;

let storyElements = { characters: [], props: [], setting: '', sceneRules: [] };

// 1. Versuch: strukturierter Output vom Output-Parser
if (inputJson.output && typeof inputJson.output === 'object') {
  storyElements = {
    characters: Array.isArray(inputJson.output.characters) ? inputJson.output.characters : [],
    props: Array.isArray(inputJson.output.props) ? inputJson.output.props : [],
    setting: inputJson.output.setting || '',
    sceneRules: Array.isArray(inputJson.output.sceneRules) ? inputJson.output.sceneRules : []
  };
} else {
  // 2. Fallback: alter Regex-/JSON.parse-Pfad falls Output-Parser nicht aktiv
  const rawText = inputJson.text || '';
  try {
    const m = rawText.match(/\\{[\\s\\S]*\\}/);
    if (m) storyElements = JSON.parse(m[0]);
  } catch(e) {}
}

function describeCharacter(c) {
  const name = c.name || 'Character';
  const typeStr = c.type === 'animal' && c.species
    ? \` (\${c.species} — real animal, no clothing, no anthropomorphism unless story explicitly says so)\`
    : c.type === 'creature' && c.species
    ? \` (\${c.species})\`
    : c.type === 'object'
    ? ' (object — describe physical appearance only)'
    : c.heightCategory
    ? \` (\${c.heightCategory} character in a children picture book)\`
    : ' (childrens picture book character)';
  const ageInfo = c.ageYears != null ? \` Age: \${c.ageYears}.\` : '';
  return \`\${name}\${typeStr}: \${c.appearance || ''}.\${ageInfo}\`;
}

let charRef = '';
if (storyElements.characters && storyElements.characters.length > 0) {
  charRef = storyElements.characters.map(describeCharacter).join('. ');
}

if (storyElements.props && storyElements.props.length > 0) {
  charRef += '. Props: ' + storyElements.props.map(p => \`\${p.count} \${p.name.toLowerCase()}\${p.heldIn && p.heldIn !== 'none' ? ' held in the ' + p.heldIn : ''}: \${p.description}\`).join('. ');
}

if (storyElements.setting) {
  charRef += '. Setting: ' + storyElements.setting;
}

const sceneRules = storyElements.sceneRules || [];

const hasNonHumanCharacter = (storyElements.characters || []).some(c => {
  return c.type === 'animal' || c.type === 'creature' || c.type === 'object';
});

return { json: { ...prev, storyElements, characterReference: charRef, sceneRules, hasNonHumanCharacter } };`;

function patchWorkflow(wf, label) {
  const llm = wf.nodes.find(n => n.id === ELEMENTS_LLM_ID || n.name === ELEMENTS_LLM_NAME);
  if (!llm) throw new Error(`[${label}] ${ELEMENTS_LLM_NAME} nicht gefunden`);
  const parseNode = wf.nodes.find(n => n.name === 'Elemente parsen');
  if (!parseNode) throw new Error(`[${label}] Elemente parsen nicht gefunden`);

  // 1. Schema-Knoten (idempotent)
  let added = 0;
  if (!wf.nodes.find(n => n.id === SCHEMA_NODE_ID)) {
    wf.nodes.push({
      id: SCHEMA_NODE_ID,
      name: SCHEMA_NODE_NAME,
      type: '@n8n/n8n-nodes-langchain.outputParserStructured',
      typeVersion: 1.2,
      position: [llm.position[0] + 240, llm.position[1] + 200],
      parameters: {
        schemaType: 'manual',
        inputSchema: JSON.stringify(ELEMENTS_SCHEMA, null, 2)
      }
    });
    added++;
  }

  // 2. chainLlm-Knoten erweitern
  llm.parameters.hasOutputParser = true;

  // 3. Connection: Schema → chainLlm via ai_outputParser
  wf.connections[SCHEMA_NODE_NAME] = {
    ai_outputParser: [[{ node: ELEMENTS_LLM_NAME, type: 'ai_outputParser', index: 0 }]]
  };

  // 4. Elemente parsen Code anpassen
  parseNode.parameters.jsCode = NEW_ELEMENTS_PARSE_CODE;

  return added;
}

// --- Live ---
const wf = JSON.parse(fs.readFileSync(SRC, 'utf8'));
if (wf.name !== 'Lesekumpel – Neuroinclusive Story Generator') {
  throw new Error('Falscher Workflow-Name: ' + wf.name);
}
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
