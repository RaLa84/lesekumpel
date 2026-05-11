const prevData = $('Bildszenen vorbereiten').first().json;
if (prevData.skipImages || prevData.imageCount === 0) {
  return [{ json: { ...prevData, _skipLoop: true } }];
}

const prev = $('Bildszenen vorbereiten').first().json;
const rawText = $input.first().json.text || '';
const visualLock = prev.visualLock || prev.characterReference || '';

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

return scenes.map(s => {
  const sceneNo  = (typeof s.scene === 'number' && s.scene > 0) ? s.scene : 1;
  const summary  = clean(s.momentSummary) || 'A moment from the story';
  const action   = clean(s.action) || 'standing';
  const pose     = clean(s.pose)   || 'natural relaxed pose';
  const camera   = clean(s.camera) || 'eye-level medium shot';
  const chars    = Array.isArray(s.characters_present) ? s.characters_present.filter(has) : [];
  const props    = Array.isArray(s.props_shown) ? s.props_shown.filter(p => p && has(p.name)) : [];
  const setFocus = clean(s.setting_focus);
  const mood     = clean(s.mood) || 'warm';

  const propsLine = props.length > 0
    ? props.map(p => `${clean(p.name)} (${clean(p.hand) || 'in hand'})`).join(', ')
    : 'no held props this scene';
  const charsLine = chars.length > 0 ? chars.join(', ') : 'characters from VISUAL LOCK';

  const sceneBlock = [
    `SCENE ${sceneNo}: ${summary}`,
    `  Action:        ${action}`,
    `  Pose:          ${pose}`,
    `  Camera:        ${camera}`,
    `  In frame:      ${charsLine}`,
    `  Props shown:   ${propsLine}`,
    setFocus ? `  Setting focus: ${setFocus}` : '',
    `  Mood:          ${mood}`
  ].filter(Boolean).join('\n');

  // Finaler Prompt: FULL-BLEED Lead → safetyContext → VISUAL LOCK → SCENE → STYLE → NEGATIVE
  const positiveSections = [
    fullBleedMandate,
    safetyContext + '.',
    visualLock,
    sceneBlock,
    'ART STYLE: ' + imageStylePositive
  ].filter(Boolean);
  const positive = positiveSections.join('\n\n');

  const fullNegative = [imageStyleNegative, safetyNegative, frameNegative].filter(has).join(', ');
  const finalPrompt  = positive + '\n\n| NEGATIVE: ' + fullNegative;

  return {
    json: {
      ...prev,
      sceneIndex: sceneNo,
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
