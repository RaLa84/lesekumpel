// Patch fuer zwei Bildqualitaets-Probleme:
//
// (1) Gruseliges Auge bei Tieren: Verhaltens-/Biologie-Infos in
//     distinguishingFeatures (z.B. "One eye remains open while...")
//     landen im VISUAL LOCK und werden vom Bildmodell visuell umgesetzt.
//     Fix: Filter in buildAnimalBlock + buildCreatureBlock, der
//     Verhaltens-Keywords erkennt und solche Eintraege ueberspringt.
//
// (2) Langweilige/identische Bilder bei Solo-Tier-Stories: SETTING ANCHOR
//     mit "identical place/light across scenes" zwingt das Bildmodell zur
//     gleichen Mikro-Location in allen Bildern. Per-Szene-setting_focus
//     wird ueberstimmt.
//     Fix-Teil-A: SETTING-ANCHOR-Header umformulieren — globale Atmosphaere
//     bleibt konstant, Mikro-Location darf pro Szene variieren.
//     Fix-Teil-B: setting_focus im Szenen-Compiler-Output prominent
//     darstellen, mit expliziter Override-Klausel.
//
// Idempotent: Marker-basierte Pruefung, wiederholbar ohne Schaden.
// Pattern wie die anderen patch-*.js Skripte.

const fs = require('node:fs');
const path = require('node:path');

const TMP_DIR = path.resolve(__dirname, '..', '_tmp');
const SRC = path.join(TMP_DIR, 'workflow_current.json');
const PUT_BODY = path.join(TMP_DIR, 'workflow_animal_distinguishing_patched.json');
const LOCAL_MIRROR = path.resolve(__dirname, '..', 'workflows', 'lesekumpel-story-generator.json');
const LOCAL_ELEMENTE = path.resolve(__dirname, '..', 'elemente-parsen-v2.js');

const ELEMENTS_PARSE_NODE = 'Elemente parsen';
const SCENES_PARSE_NODE = 'Szenen parsen';

// ============================================================================
// (1) Verhaltens-Filter fuer distinguishingFeatures (Animal + Creature)
// ============================================================================
//
// Hinweis: Filter laeuft RUNTIME im n8n-Knoten - wir injizieren eine
// Helper-Funktion + nutzen sie in buildAnimalBlock/buildCreatureBlock.
const FILTER_FN_MARKER = 'function filterVisualOnlyDF';
const FILTER_FN_CODE = `function filterVisualOnlyDF(arr) {
  // Filtert Eintraege heraus, die Verhalten/Biologie statt visueller Merkmale beschreiben.
  // Verhaltens-Eintraege ("One eye remains open while sleeping") werden vom Bildmodell
  // visuell umgesetzt und produzieren Uncanny-Valley-Artefakte.
  const BEHAVIOR_RE = /\\b(while|when|during|whenever|always|sometimes|remains?|stays?|becomes?|sleeps?|sleeping|asleep|dreams?|dreaming|swims?|swimming|flies|flying|flew|walking|running|jumping|jumps?|dancing|dances?|sings?|singing|breathes?|breathing|breath|observes?|observing|watches?|watching|listens?|listening|hunts?|hunting|hides?|hiding|eats?|eating|drinks?|drinking|rests?|resting|awake|alert|active|asleep|half\\s*of\\s*its\\s*brain|brain\\s*rests)\\b/i;
  return (arr || []).filter(s => {
    const t = String(s || '').trim();
    if (!t) return false;
    if (BEHAVIOR_RE.test(t)) return false;
    return true;
  });
}`;

// In buildAnimalBlock und buildCreatureBlock: dfArr-Construction durch
// filterVisualOnlyDF wrappen.
const DF_PATTERN_OLD = 'const dfArr = Array.isArray(c.distinguishingFeatures) ? c.distinguishingFeatures.filter(has) : [];';
const DF_PATTERN_NEW = 'const dfArr = filterVisualOnlyDF(Array.isArray(c.distinguishingFeatures) ? c.distinguishingFeatures.filter(has) : []);';

// ============================================================================
// (2A) buildSettingBlock: Anchor-Header weicher framen
// ============================================================================
const SETTING_STRING_OLD = "`SETTING ANCHOR (identical place/light across scenes):\\n  ${clean(s)}`";
const SETTING_STRING_NEW = "`SETTING ANCHOR (global atmosphere stays constant; micro-location varies per scene per 'Setting focus'):\\n  ${clean(s)}`";
const SETTING_LIST_OLD = "['SETTING ANCHOR (identical place/light across scenes):']";
const SETTING_LIST_NEW = "[\"SETTING ANCHOR (global atmosphere stays constant; micro-location varies per scene per 'Setting focus'):\"]";

// ============================================================================
// (2B) Szenen-parsen-Code: setting_focus prominent im sceneBlock
// ============================================================================
const SCENEBLOCK_OLD = `    setFocus ? \`  Setting focus: \${setFocus}\` : '',`;
const SCENEBLOCK_NEW = `    setFocus ? \`  SCENE LOCATION (overrides SETTING ANCHOR micro-location for this scene only — varies per scene): \${setFocus}\` : '',`;

// ============================================================================
// Patch-Functions
// ============================================================================
function patchElementsParseCode(code, label) {
  let changed = false;

  // (1) filterVisualOnlyDF einfuegen, falls noch nicht da
  if (!code.includes(FILTER_FN_MARKER)) {
    // Vor 'function buildHumanBlock' einfuegen
    const anchor = 'function buildHumanBlock';
    if (code.includes(anchor)) {
      code = code.replace(anchor, FILTER_FN_CODE + '\n\n' + anchor);
      changed = true;
    } else {
      console.warn('[' + label + '] WARN: buildHumanBlock-Anker nicht gefunden — filterVisualOnlyDF nicht eingefuegt');
    }
  }

  // (1b) DF-Pattern in buildAnimalBlock + buildCreatureBlock ersetzen
  const occurrences = code.split(DF_PATTERN_OLD).length - 1;
  if (occurrences > 0) {
    code = code.split(DF_PATTERN_OLD).join(DF_PATTERN_NEW);
    changed = true;
    console.log('[' + label + '] DF-Pattern in ' + occurrences + ' Stellen ersetzt');
  }

  // (2A) SETTING ANCHOR Header weicher
  if (code.includes('SETTING ANCHOR (identical place/light across scenes)')) {
    if (code.includes(SETTING_STRING_OLD.replace(/`/g, ''))) {
      // verwende einfacheres replace - die Inhalte des templates landen mit echten Backticks im jsCode
      code = code.replace(
        "`SETTING ANCHOR (identical place/light across scenes):\\n  ${clean(s)}`",
        "`SETTING ANCHOR (global atmosphere stays constant; micro-location varies per scene per 'Setting focus'):\\n  ${clean(s)}`"
      );
    }
    code = code.replace(
      "['SETTING ANCHOR (identical place/light across scenes):']",
      "[\"SETTING ANCHOR (global atmosphere stays constant; micro-location varies per scene per 'Setting focus'):\"]"
    );
    changed = true;
  }

  return { code, changed };
}

function patchScenesParseCode(code, label) {
  let changed = false;

  // (2B) Setting-Focus-Zeile prominenter
  if (code.includes(SCENEBLOCK_OLD)) {
    code = code.replace(SCENEBLOCK_OLD, SCENEBLOCK_NEW);
    changed = true;
  } else if (code.includes('SCENE LOCATION (overrides SETTING ANCHOR')) {
    // bereits gepatcht
  } else {
    console.warn('[' + label + '] WARN: setFocus-Zeile nicht gefunden in Szenen parsen');
  }

  return { code, changed };
}

function patchWorkflow(wf, label) {
  const summary = { elementsParse: false, scenesParse: false };

  const ep = wf.nodes.find(n => n.name === ELEMENTS_PARSE_NODE);
  if (!ep) throw new Error('[' + label + '] ' + ELEMENTS_PARSE_NODE + ' nicht gefunden');
  const epResult = patchElementsParseCode(ep.parameters.jsCode || '', label);
  if (epResult.changed) {
    ep.parameters.jsCode = epResult.code;
    summary.elementsParse = true;
  }

  const sp = wf.nodes.find(n => n.name === SCENES_PARSE_NODE);
  if (!sp) throw new Error('[' + label + '] ' + SCENES_PARSE_NODE + ' nicht gefunden');
  const spResult = patchScenesParseCode(sp.parameters.jsCode || '', label);
  if (spResult.changed) {
    sp.parameters.jsCode = spResult.code;
    summary.scenesParse = true;
  }

  return summary;
}

// ============================================================================
// Local elemente-parsen-v2.js parallel patchen
// ============================================================================
function patchLocalElementeFile() {
  if (!fs.existsSync(LOCAL_ELEMENTE)) return { changed: false, reason: 'file not found' };
  let code = fs.readFileSync(LOCAL_ELEMENTE, 'utf8');
  const before = code;

  if (!code.includes(FILTER_FN_MARKER)) {
    const anchor = 'function buildHumanBlock';
    if (code.includes(anchor)) {
      code = code.replace(anchor, FILTER_FN_CODE + '\n\n' + anchor);
    }
  }
  code = code.split(DF_PATTERN_OLD).join(DF_PATTERN_NEW);

  // SETTING-Anchor-Header
  code = code.replace(
    /SETTING ANCHOR \(identical place\/light across scenes\)/g,
    "SETTING ANCHOR (global atmosphere stays constant; micro-location varies per scene per 'Setting focus')"
  );

  if (code !== before) {
    fs.writeFileSync(LOCAL_ELEMENTE, code, 'utf8');
    return { changed: true };
  }
  return { changed: false };
}

// ============================================================================
// Main
// ============================================================================
if (!fs.existsSync(SRC)) {
  console.error('Live-Workflow nicht gefunden: ' + SRC);
  process.exit(1);
}
const wf = JSON.parse(fs.readFileSync(SRC, 'utf8'));
if (wf.name !== 'Lesekumpel – Neuroinclusive Story Generator') {
  throw new Error('Falscher Workflow-Name: ' + wf.name);
}
const liveSummary = patchWorkflow(wf, 'live');

const ALLOWED = new Set(['executionOrder','saveExecutionProgress','saveManualExecutions','saveDataErrorExecution','saveDataSuccessExecution','executionTimeout','errorWorkflow','timezone','callerPolicy','callerIds']);
const cleanSettings = {};
for (const [k, v] of Object.entries(wf.settings ?? {})) if (ALLOWED.has(k)) cleanSettings[k] = v;
const putBody = { name: wf.name, nodes: wf.nodes, connections: wf.connections, settings: cleanSettings, staticData: wf.staticData ?? null };
fs.writeFileSync(PUT_BODY, JSON.stringify(putBody, null, 2), 'utf8');

const local = JSON.parse(fs.readFileSync(LOCAL_MIRROR, 'utf8'));
const localSummary = patchWorkflow(local, 'local');
fs.writeFileSync(LOCAL_MIRROR, JSON.stringify(local, null, 2), 'utf8');

const localElementeSummary = patchLocalElementeFile();

console.log(JSON.stringify({
  ok: true,
  liveSummary,
  localSummary,
  localElementeSummary,
  putBodyPath: PUT_BODY,
  putBodySize: fs.statSync(PUT_BODY).size
}, null, 2));
