const prev = $('Story-Elemente vorbereiten').first().json;
const rawText = $input.first().json.text || '';

let storyElements = { characters: [], props: [], setting: '', sceneRules: [] };
try {
  const m = rawText.match(/\{[\s\S]*\}/);
  if (m) storyElements = JSON.parse(m[0]);
} catch(e) {}

if (!Array.isArray(storyElements.sceneRules)) storyElements.sceneRules = [];
if (!Array.isArray(storyElements.characters)) storyElements.characters = [];
if (!Array.isArray(storyElements.props))      storyElements.props      = [];

const clothingRegex = new RegExp("\\b(wearing|shirt|dress|trousers|pants|shorts|jacket|hoodie|coat|sweater|skirt|outfit|clothes|kleidung)\\b", "i");

function clean(s) {
  return (s == null ? '' : String(s)).trim();
}
function has(s) { return clean(s).length > 0 && clean(s).toLowerCase() !== 'null'; }

function indent2(s) {
  return clean(s).split('\n').map(l => '    ' + l).join('\n');
}

function buildHumanBlock(c, idx) {
  const lines = [];
  const name  = clean(c.name) || ('Character #' + idx);
  const age   = (typeof c.ageYears === 'number' && c.ageYears > 0) ? (c.ageYears + '-year-old ') : '';
  const heightCat = clean(c.body && c.body.heightCategory) || 'child';
  const build     = clean(c.body && c.body.build) || 'average';
  lines.push(`CHARACTER #${idx} — ${name} (${age}${heightCat}):`);
  lines.push(`  BODY:    ${build} ${heightCat} build`);
  if (c.hair) {
    const h = [clean(c.hair.color), clean(c.hair.style), clean(c.hair.length)].filter(has).join(', ');
    if (h) lines.push(`  HAIR:    ${h}`);
  }
  if (c.eyes && has(c.eyes.color)) lines.push(`  EYES:    ${clean(c.eyes.color)}`);
  if (c.skin && has(c.skin.tone))  lines.push(`  SKIN:    ${clean(c.skin.tone)}`);

  // OUTFIT — verbatim slots. Force fallback wenn LLM nichts geliefert hat.
  const o = c.outfit || {};
  let top         = clean(o.top);
  let bottom      = clean(o.bottom);
  let footwear    = clean(o.footwear);
  let accessories = clean(o.accessories) || 'none';
  if (!has(top))      top      = 'plain casual t-shirt in a neutral color';
  if (!has(bottom))   bottom   = 'plain casual trousers';
  if (!has(footwear)) footwear = 'simple closed shoes';
  lines.push(`  OUTFIT (identical in every scene — never alter):`);
  lines.push(`    TOP:         ${top}`);
  lines.push(`    BOTTOM:      ${bottom}`);
  lines.push(`    FOOTWEAR:    ${footwear}`);
  lines.push(`    ACCESSORIES: ${accessories}`);

  const dfArr = Array.isArray(c.distinguishingFeatures) ? c.distinguishingFeatures.filter(has) : [];
  if (dfArr.length > 0) lines.push(`  DISTINGUISHING: ${dfArr.join('; ')}`);
  return lines.join('\n');
}

function buildAnimalBlock(c, idx) {
  const lines = [];
  const name    = clean(c.name) || ('Animal #' + idx);
  const species = clean(c.species) || 'animal';
  lines.push(`CHARACTER #${idx} — ${name} (real ${species}, anatomically accurate animal — NOT a person, NOT a child, NOT in costume, no clothing):`);
  if (c.fur) {
    const f = [clean(c.fur.color), clean(c.fur.pattern)].filter(has).join(', ');
    if (f) lines.push(`  FUR/PLUMAGE: ${f}`);
  }
  if (c.eyes && has(c.eyes.color)) lines.push(`  EYES:        ${clean(c.eyes.color)}`);
  if (c.body && has(c.body.build)) lines.push(`  BODY:        ${clean(c.body.build)}`);
  const dfArr = Array.isArray(c.distinguishingFeatures) ? c.distinguishingFeatures.filter(has) : [];
  if (dfArr.length > 0) lines.push(`  DISTINGUISHING: ${dfArr.join('; ')}`);
  return lines.join('\n');
}

function buildCreatureBlock(c, idx) {
  const lines = [];
  const name    = clean(c.name) || ('Creature #' + idx);
  const species = clean(c.species) || 'fantasy creature';
  lines.push(`CHARACTER #${idx} — ${name} (fantasy ${species}, picture-book creature):`);
  if (c.body) {
    const b = [clean(c.body.heightCategory), clean(c.body.build)].filter(has).join(', ');
    if (b) lines.push(`  BODY:    ${b}`);
  }
  if (c.fur) {
    const f = [clean(c.fur.color), clean(c.fur.pattern)].filter(has).join(', ');
    if (f) lines.push(`  HIDE:    ${f}`);
  }
  if (c.eyes && has(c.eyes.color)) lines.push(`  EYES:    ${clean(c.eyes.color)}`);
  if (c.outfit && (has(c.outfit.top) || has(c.outfit.bottom))) {
    lines.push(`  OUTFIT:`);
    if (has(c.outfit.top))    lines.push(`    TOP:    ${clean(c.outfit.top)}`);
    if (has(c.outfit.bottom)) lines.push(`    BOTTOM: ${clean(c.outfit.bottom)}`);
  }
  const dfArr = Array.isArray(c.distinguishingFeatures) ? c.distinguishingFeatures.filter(has) : [];
  if (dfArr.length > 0) lines.push(`  DISTINGUISHING: ${dfArr.join('; ')}`);
  return lines.join('\n');
}

function buildObjectBlock(c, idx) {
  const name = clean(c.name) || ('Object #' + idx);
  const df   = Array.isArray(c.distinguishingFeatures) ? c.distinguishingFeatures.filter(has) : [];
  const detail = df.length > 0 ? df.join('; ') : 'inanimate object from the story';
  return `CHARACTER #${idx} — ${name} (inanimate object): ${detail}`;
}

function buildCharacterBlock(c, idx) {
  const t = (c && c.type || 'human').toString().toLowerCase();
  if (t === 'animal')   return buildAnimalBlock(c, idx);
  if (t === 'creature') return buildCreatureBlock(c, idx);
  if (t === 'object')   return buildObjectBlock(c, idx);
  return buildHumanBlock(c, idx);
}

function buildPropBlock(p, idx) {
  const lines = [];
  const name = clean(p.name) || ('Prop #' + idx);
  lines.push(`PROP #${idx} — ${name}:`);
  if (has(p.color))    lines.push(`  COLOR:    ${clean(p.color)}`);
  if (has(p.material)) lines.push(`  MATERIAL: ${clean(p.material)}`);
  if (has(p.size))     lines.push(`  SIZE:     ${clean(p.size)}`);
  if (has(p.shape))    lines.push(`  SHAPE:    ${clean(p.shape)}`);
  if (typeof p.count === 'number') lines.push(`  COUNT:    ${p.count}`);
  if (has(p.heldBy))   lines.push(`  HELD BY:  ${clean(p.heldBy)} (${clean(p.heldIn) || 'see story'})`);
  else if (has(p.heldIn) && clean(p.heldIn) !== 'none') lines.push(`  HELD IN:  ${clean(p.heldIn)}`);
  return lines.join('\n');
}

function buildSettingBlock(s) {
  if (!s) return '';
  if (typeof s === 'string') {
    return `SETTING ANCHOR (identical place/light across scenes):\n  ${clean(s)}`;
  }
  const lines = ['SETTING ANCHOR (identical place/light across scenes):'];
  if (has(s.location))       lines.push(`  LOCATION:        ${clean(s.location)}`);
  if (has(s.timeOfDay))      lines.push(`  TIME-OF-DAY:     ${clean(s.timeOfDay)}`);
  if (has(s.weather))        lines.push(`  WEATHER:         ${clean(s.weather)}`);
  if (has(s.lightDirection)) lines.push(`  LIGHT DIRECTION: ${clean(s.lightDirection)} (consistent shadow direction)`);
  return lines.join('\n');
}

const characterBlocks = storyElements.characters.map((c, i) => buildCharacterBlock(c, i + 1));
const propBlocks      = storyElements.props.map((p, i) => buildPropBlock(p, i + 1));
const settingBlock    = buildSettingBlock(storyElements.setting);

const visualLockSections = [];
if (characterBlocks.length > 0) visualLockSections.push(characterBlocks.join('\n\n'));
if (propBlocks.length > 0)      visualLockSections.push(propBlocks.join('\n\n'));
if (settingBlock)               visualLockSections.push(settingBlock);

const visualLock = visualLockSections.length > 0
  ? '=== VISUAL LOCK (REPEAT VERBATIM IN EVERY SCENE — NEVER ALTER) ===\n\n'
    + visualLockSections.join('\n\n')
    + '\n\n=== END VISUAL LOCK ==='
  : '';

// characterReference bleibt als String erhalten (downstream-Kompat) — jetzt = VISUAL LOCK
const characterReference = visualLock;

const sceneRules = storyElements.sceneRules.filter(r => typeof r === 'string' && r.length > 0);

const hasNonHumanCharacter = (storyElements.characters || []).some(c => {
  const t = (c.type || 'human').toString().toLowerCase();
  return t === 'animal' || t === 'creature';
});

return { json: { ...prev, storyElements, characterReference, visualLock, sceneRules, hasNonHumanCharacter } };
