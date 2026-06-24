const prevData = $('Bildszenen vorbereiten').first().json;
if (prevData.skipImages || prevData.imageCount === 0) {
  return [{ json: { ...prevData, _skipLoop: true } }];
}

const prev = $('Bildszenen vorbereiten').first().json;
const rawText = $input.first().json.text || '';
const visualLock = prev.visualLock || prev.characterReference || '';
const storyElements = prev.storyElements || {};

// ════════════════════════════════════════════════════════════════════════════════
// NEGATIVE PROMPTS BUILDER — keep in sync with negative-prompts-bauen.js
// Erzeugt dynamische Negative-Prompts aus dem VISUAL LOCK Slot-JSON.
// Adressiert Outfit-Bleed (Doenerellas Umhang am Igel), halluzinierte
// Begleitfiguren und Mensch-in-Tier-Story-Bugs.
// ════════════════════════════════════════════════════════════════════════════════

function dynClean(s) { return (s == null ? '' : String(s)).trim(); }
function dynHas(s) {
  const c = dynClean(s);
  return c.length > 0 && c.toLowerCase() !== 'none' && c.toLowerCase() !== 'null';
}
function outfitPhrases(outfit) {
  if (!outfit || typeof outfit !== 'object') return [];
  const out = [];
  for (const slot of ['top', 'bottom', 'footwear', 'accessories']) {
    if (dynHas(outfit[slot])) out.push(dynClean(outfit[slot]));
  }
  return out;
}
function buildDynamicNegatives(slots) {
  if (!slots || typeof slots !== 'object') return '';
  const chars = Array.isArray(slots.characters) ? slots.characters : [];
  const props = Array.isArray(slots.props) ? slots.props : [];
  const humans = chars.filter(c => c && c.type === 'human');
  const animals = chars.filter(c => c && c.type === 'animal');
  const creatures = chars.filter(c => c && c.type === 'creature');
  const livingCount = humans.length + animals.length + creatures.length;
  const out = [];

  for (const c of chars) {
    const phrases = outfitPhrases(c.outfit);
    const charName = dynClean(c.name) || 'character';
    for (const p of phrases) {
      out.push(`no ${p} on any character except ${charName}`);
    }
    if (c.type === 'animal' || c.type === 'creature') {
      const dfs = Array.isArray(c.distinguishingFeatures) ? c.distinguishingFeatures : [];
      for (const df of dfs) {
        const v = dynClean(df);
        if (!v || v.length > 80) continue;
        if (/wearing|wears|tied|ribbon|scarf|hat|cape|collar|accessory/i.test(v)) {
          out.push(`no ${v} on other characters`);
        }
      }
    }
  }
  if (livingCount === 1) {
    out.push('no additional human characters present');
    out.push('no additional animal characters present');
    out.push('no background figures, no bystanders, no extra silhouettes');
  }
  if (humans.length === 0 && (animals.length + creatures.length) > 0) {
    out.push('no humans, no human silhouettes, no human hands, no human feet');
    out.push('no human-made clothing on the animals unless the VISUAL LOCK says so');
  }
  for (const p of props) {
    if (!p || !dynHas(p.name)) continue;
    const count = Number.isFinite(p.count) ? p.count : 1;
    if (count === 1) {
      out.push(`exactly 1 ${dynClean(p.name)} in the image, no duplicate ${dynClean(p.name)} instances`);
    }
  }
  return out.join(', ');
}

const dynamicNegative = buildDynamicNegatives(storyElements);

// Lead-Block: erzwingt full-bleed-Komposition am Promptanfang (Modelle gewichten Anfang stärker)
const fullBleedMandate = [
  'FULL-BLEED MANDATE: This is a poster-style full-bleed illustration.',
  'The painted scene fills 100% of pixels from corner to corner of the image.',
  'Background paint and scene elements extend BEYOND all four image edges.',
  'There is no border, no margin, no white space, no matte, no frame, no rounded corners.',
  'Imagine a giant poster cropped tight to the artwork — every pixel is painted scene.'
].join(' ');

// safetyContext bleibt type-aware (Mensch+Tier-Kombination braucht andere Clothing-Klausel)
const _hasNonHuman = !!prev.hasNonHumanCharacter;
const _clothingClause = _hasNonHuman
  ? 'human characters are fully clothed in everyday outfits, animal characters are real animals with no clothing and no costume'
  : 'fully clothed characters in everyday outfits';
const safetyContext = "Wholesome G-rated illustration for a published German children's picture book, age-appropriate storybook art, " + _clothingClause;
const safetyNegative = 'no swimwear, no swimsuit, no bikini, no underwear, no nudity, no bare torso, no exposed skin beyond face and hands, no animals depicted as humans, no children wearing animal costumes';

// Frame-Bias-Negationen (zusätzlich zum imageStyleNegative)
const frameNegative = 'no canvas border, no torn paper edge, no rounded corners, no shadow box, no drop shadow around image, no decorative frame, no book page edge, no album cover frame, no inset background, no centered medallion composition, no white halo around subject';

const imageStylePositive = prev.imageStylePositive || "children's book illustration, consistent rendering across all panels";
const imageStyleNegative = prev.imageStyleNegative || "no text, no watermarks, no extra limbs";

let scenes = [];
try { const m = rawText.match(/\[[\s\S]*\]/); if (m) scenes = JSON.parse(m[0]); } catch(e) {}

if (!Array.isArray(scenes) || scenes.length === 0) {
  // Fallback: single generic scene
  scenes = [{
    scene: 1,
    momentSummary: 'A friendly scene from the story',
    action: 'standing',
    pose: 'natural relaxed pose',
    camera: 'eye-level medium shot',
    characters_present: [],
    props_shown: [],
    setting_focus: '',
    mood: 'warm'
  }];
}

function clean(s) { return (s == null ? '' : String(s)).trim(); }
function has(s) { return clean(s).length > 0; }

// ════════════════════════════════════════════════════════════════════════════
// paragraphIndex robust bestimmen — wird NIE null.
// Bisheriger Bug: dieser Node ließ den vom Szenen-LLM gelieferten paragraphIndex
// fallen → assemble-html bekam undefined → null → falsche Bildplatzierung.
// Jetzt: LLM-Wert übernehmen (0-basiert, in-range), sonst per Token-Overlap zum
// passenden Absatz matchen; danach Constraints erzwingen (steigend, distinct, <P).
// ════════════════════════════════════════════════════════════════════════════
const STOP = new Set('der die das und ein eine einen einem einer dem den des ist war sind sich auf aus von zu mit im in es er sie wir ihr nicht aber wie als dann noch nur auch schon sehr ganz mehr was wer wann dass weil denn doch mal beim zum zur vom uber unter vor nach bei ohne um an am hat hatte wird wurde sein ihre seine'.split(/\s+/));
function tokenize(s) {
  return clean(s).toLowerCase()
    .replace(/­/g, '').replace(/-/g, '')
    .replace(/[^a-zäöüß0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length >= 3 && !STOP.has(w))
    .map(w => w.replace(/(en|er|es|em|st|e|n|s)$/, ''));
}
function assignParagraphIndices(sceneList, storyText) {
  const paras = String(storyText || '').split(/\n\n+/);
  const P = paras.length;
  const n = sceneList.length;
  if (P <= 1) return sceneList.map(() => 0);
  // Mehr Szenen als Absätze: gleichmäßig, Duplikate am Ende erlaubt
  if (n >= P) return sceneList.map((_, i) => Math.min(P - 1, Math.round(i * (P - 1) / Math.max(1, n - 1))));
  const paraTokens = paras.map(p => new Set(tokenize(p)));
  // Kandidat je Szene: gültiger LLM-Wert bevorzugt, sonst bester Token-Overlap
  const cand = sceneList.map(s => {
    const v = s.paragraphIndex;
    if (typeof v === 'number' && isFinite(v) && v >= 0 && v < P) return Math.floor(v);
    const sceneText = [s.momentSummary, s.action, s.setting_focus, s.sceneSetting,
      Array.isArray(s.characters_present) ? s.characters_present.join(' ') : '',
      Array.isArray(s.props_shown) ? s.props_shown.map(p => p && p.name).join(' ') : ''].join(' ');
    const st = tokenize(sceneText);
    let best = 0, bestScore = -1;
    for (let i = 0; i < P; i++) {
      let sc = 0; for (const t of st) if (paraTokens[i].has(t)) sc++;
      if (sc > bestScore) { bestScore = sc; best = i; }
    }
    return best;
  });
  // Constraints: 0-basiert, strikt steigend, distinct, < P (Platz für Folge-Szenen lassen)
  const idx = []; let prevIdx = -1;
  for (let i = 0; i < n; i++) {
    let v = Math.max(cand[i], prevIdx + 1);
    const maxAllowed = P - 1 - (n - 1 - i);
    if (v > maxAllowed) v = maxAllowed;
    if (v < 0) v = 0;
    idx.push(v); prevIdx = v;
  }
  return idx;
}
const _paraIdx = assignParagraphIndices(scenes, prev.storyText);

return scenes.map((s, _sceneArrIdx) => {
  const sceneNo     = (typeof s.scene === 'number' && s.scene > 0) ? s.scene : 1;
  const summary     = clean(s.momentSummary) || 'A moment from the story';
  const action      = clean(s.action) || 'standing';
  const pose        = clean(s.pose)   || 'natural relaxed pose';
  const camera      = clean(s.camera) || 'medium-shot';
  const lighting    = clean(s.lighting) || '';
  const composition = clean(s.composition) || '';
  const chars       = Array.isArray(s.characters_present) ? s.characters_present.filter(has) : [];
  const props       = Array.isArray(s.props_shown) ? s.props_shown.filter(p => p && has(p.name)) : [];
  const setFocus    = clean(s.setting_focus);
  const mood        = clean(s.mood) || 'warm';
  const medium      = clean(s.medium) || 'real-scene';
  const sceneSetting = clean(s.sceneSetting);

  // Bei nicht-realem Medium (Spiel/Screen/Traum/Vorstellung/Erinnerung) wird das
  // Moment NICHT als reales Ereignis gerendert, sondern als das jeweilige Medium.
  // Verhindert z.B. "Kind wirft echte Tomate" obwohl der Wurf im Spiel passiert.
  const MEDIUM_DIRECTIVE = {
    'on-screen-game': 'DEPICT AS: this moment happens inside a video game. Render it as game graphics shown on a screen (TV, monitor, handheld or phone). In-game characters and objects are game sprites / game art, NOT real. If a real-world character is present they appear in front of the screen (e.g. holding a controller); the game action stays on the screen. This is NOT a real-world event.',
    'dream':       'DEPICT AS: this moment is a dream. Render it with a soft, dreamlike atmosphere (gentle glow, slightly surreal), clearly not a literal real-world event.',
    'imagination': 'DEPICT AS: this moment is the character imagining something. Render the imagined content as a soft daydream, clearly distinct from reality.',
    'memory':      'DEPICT AS: this moment is a remembered past scene, rendered with a gentle nostalgic tone.'
  };
  const mediumDirective = (medium && medium !== 'real-scene') ? (MEDIUM_DIRECTIVE[medium] || '') : '';

  const propsLine = props.length > 0
    ? props.map(p => `${clean(p.name)} (${clean(p.hand) || 'in hand'})`).join(', ')
    : 'no held props this scene';
  const charsLine = chars.length > 0 ? chars.join(', ') : 'characters from VISUAL LOCK';

  const sceneBlock = [
    `SCENE ${sceneNo}: ${summary}`,
    `  Action:        ${action}`,
    `  Pose:          ${pose}`,
    `  Camera:        ${camera}`,
    lighting    ? `  Lighting:      ${lighting}`    : '',
    composition ? `  Composition:   ${composition}` : '',
    `  In frame:      ${charsLine}`,
    `  Props shown:   ${propsLine}`,
    setFocus ? `  Setting focus: ${setFocus}` : '',
    sceneSetting ? `  Scene setting: ${sceneSetting}` : '',
    (medium && medium !== 'real-scene') ? `  Medium:        ${medium}` : '',
    `  Mood:          ${mood}`
  ].filter(Boolean).join('\n');

  // Finaler Prompt: FULL-BLEED Lead → safetyContext → VISUAL LOCK → SCENE → [MEDIUM] → STYLE → NEGATIVE
  const positiveSections = [
    fullBleedMandate,
    safetyContext + '.',
    visualLock,
    sceneBlock,
    mediumDirective,
    'ART STYLE: ' + imageStylePositive
  ].filter(Boolean);
  const positive = positiveSections.join('\n\n');

  // Timeline-Negativ: keine Props aus anderen Story-Momenten (z.B. spät gekauftes Eis)
  const timelineNegative = 'no objects that belong to other story moments, no props the character only obtains later in the story';
  const fullNegative = [imageStyleNegative, safetyNegative, frameNegative, dynamicNegative, timelineNegative].filter(has).join(', ');
  const finalPrompt  = positive + '\n\n| NEGATIVE: ' + fullNegative;

  return {
    json: {
      ...prev,
      sceneIndex: sceneNo,
      paragraphIndex: _paraIdx[_sceneArrIdx],
      imagePrompt: finalPrompt,
      imageFilename: prev.slug + '-' + sceneNo + '.png',
      imageGithubPath: 'bilder/' + prev.slug + '-' + sceneNo + '.png',
      geminiRequestBody: {
        contents: [{ role: 'user', parts: [{ text: finalPrompt }] }],
        generationConfig: { responseModalities: ['image', 'text'] }
      }
    }
  };
});
