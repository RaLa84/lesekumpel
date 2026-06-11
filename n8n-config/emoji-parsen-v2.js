// Knoten: "Emoji parsen" UND "Summary-Emoji parsen" — v2 (2026-06-11)
// Beide Knoten nutzen exakt diesen Code; der EINZIGE Unterschied ist der CFG-Block:
//   Emoji parsen:         { quellKnoten: 'Geschichte parsen', quellFeld: 'rawStoryText', zielFeld: 'emojiStoryText' }
//   Summary-Emoji parsen: { quellKnoten: 'Emoji parsen',      quellFeld: 'summaryText',  zielFeld: 'emojiSummaryText' }
// Bei Änderungen: Code unterhalb des CFG-Blocks in BEIDEN Knoten identisch halten.
const CFG = { quellKnoten: 'Geschichte parsen', quellFeld: 'rawStoryText', zielFeld: 'emojiStoryText' };

const origData = $(CFG.quellKnoten).first().json;
const taggerOutput = $input.item.json.text || '[]';
const rawText = origData[CFG.quellFeld] || '';

// Parse Emoji-Annotations
let annotations = [];
try {
  const m = taggerOutput.match(/\[[\s\S]*\]/);
  if (m) annotations = JSON.parse(m[0]);
} catch(e) {
  console.warn('EMOJI-PARSE: JSON parse error:', e.message);
  console.warn('EMOJI-PARSE: Tagger output was:', taggerOutput.substring(0, 500));
}

// Fallback: rule-based emoji insertion if LLM returned nothing
if (!Array.isArray(annotations) || annotations.length === 0) {
  const fallbackMap = [
    { wort: 'froh', emoji: '😊' }, { wort: 'fröhlich', emoji: '😊' },
    { wort: 'glücklich', emoji: '😊' }, { wort: 'freut', emoji: '😊' },
    { wort: 'lacht', emoji: '😊' }, { wort: 'lachte', emoji: '😊' },
    { wort: 'traurig', emoji: '😢' }, { wort: 'weint', emoji: '😢' },
    { wort: 'weinte', emoji: '😢' }, { wort: 'vermisst', emoji: '😢' },
    { wort: 'enttäuscht', emoji: '😢' },
    { wort: 'wütend', emoji: '😠' }, { wort: 'sauer', emoji: '😠' },
    { wort: 'ärgert', emoji: '😠' },
    { wort: 'Angst', emoji: '😨' }, { wort: 'erschrocken', emoji: '😨' },
    { wort: 'ängstlich', emoji: '😨' }, { wort: 'fürchtet', emoji: '😨' },
    { wort: 'überrascht', emoji: '😮' }, { wort: 'erstaunt', emoji: '😮' },
    { wort: 'nervös', emoji: '😰' }, { wort: 'unsicher', emoji: '😰' },
    { wort: 'aufgeregt', emoji: '😰' },
    { wort: 'mutig', emoji: '💪' }, { wort: 'traut', emoji: '💪' },
    { wort: 'frustriert', emoji: '😤' }, { wort: 'genervt', emoji: '😤' },
    { wort: 'erleichtert', emoji: '😌' }, { wort: 'beruhigt', emoji: '😌' },
    { wort: 'stolz', emoji: '😏' }, { wort: 'zufrieden', emoji: '😏' },
    { wort: 'liebt', emoji: '🥰' }, { wort: 'mag', emoji: '🥰' },
  ];
  const lowerText = rawText.toLowerCase();
  for (const entry of fallbackMap) {
    if (lowerText.includes(entry.wort.toLowerCase())) {
      annotations.push(entry);
    }
  }
  if (annotations.length > 0) {
    console.log('EMOJI-PARSE: Used rule-based fallback, found ' + annotations.length + ' emotion words');
  }
}

// Insert emojis into original text (deterministic, no LLM rewriting)
let emojiText = rawText;
if (Array.isArray(annotations) && annotations.length > 0) {
  // Sort by position in text (last first to preserve indices)
  const positions = [];
  for (const a of annotations) {
    if (!a.wort || !a.emoji) continue;
    // Find all occurrences of this word in the text
    let searchFrom = 0;
    while (true) {
      const idx = emojiText.indexOf(a.wort, searchFrom);
      if (idx === -1) break;
      // Check if emoji already inserted after this word
      const afterWord = idx + a.wort.length;
      if (emojiText[afterWord] !== ' ' || !isEmoji(emojiText[afterWord + 1])) {
        positions.push({ idx: afterWord, emoji: a.emoji, wort: a.wort });
      }
      searchFrom = idx + a.wort.length + 1;
      break; // Only first occurrence per annotation
    }
  }

  // Sort descending so we insert from end to start (preserves indices)
  positions.sort((a, b) => b.idx - a.idx);

  for (const p of positions) {
    emojiText = emojiText.substring(0, p.idx) + ' ' + p.emoji + emojiText.substring(p.idx);
  }
}

function isEmoji(char) {
  if (!char) return false;
  const cp = char.codePointAt(0);
  return cp > 0x1F000;
}

// Apply Silbentrennung to emoji text
function silbentrennung(wort) {
  if (wort.length <= 3) return wort;
  if (!/^[a-zäöüß]+$/i.test(wort)) return wort;
  const w = wort.toLowerCase();
  const einheiten = [];
  let i = 0;
  while (i < w.length) {
    if (i+2 < w.length && w.substring(i, i+3) === 'sch') { einheiten.push({text:w.substring(i,i+3),typ:'K',pos:i,len:3}); i+=3; continue; }
    const zwei = i+1<w.length ? w.substring(i,i+2) : '';
    if (['ch','ck','ph','th','qu','pf'].includes(zwei)) { einheiten.push({text:zwei,typ:'K',pos:i,len:2}); i+=2; continue; }
    if (['ei','au','eu','äu','ie','ai'].includes(zwei)) { einheiten.push({text:zwei,typ:'V',pos:i,len:2}); i+=2; continue; }
    const vokal = 'aeiouyäöü'.includes(w[i]);
    einheiten.push({text:w[i],typ:vokal?'V':'K',pos:i,len:1}); i++;
  }
  const vokalIndices = [];
  for (let e=0; e<einheiten.length; e++) {
    if (einheiten[e].typ==='V') {
      if (vokalIndices.length>0 && vokalIndices[vokalIndices.length-1].end===e) vokalIndices[vokalIndices.length-1].end=e+1;
      else vokalIndices.push({start:e,end:e+1});
    }
  }
  if (vokalIndices.length<2) return wort;
  const trennstellen = [];
  for (let v=0; v<vokalIndices.length-1; v++) {
    const nachVokal = vokalIndices[v].end;
    const vorVokal = vokalIndices[v+1].start;
    const anzahlKons = vorVokal - nachVokal;
    let trennEinheit;
    if (anzahlKons===0) trennEinheit=nachVokal;
    else if (anzahlKons===1) trennEinheit=nachVokal;
    else { trennEinheit=vorVokal-1;
      if (anzahlKons>=2) { const vl=einheiten[vorVokal-2]; const lt=einheiten[vorVokal-1];
        if (vl.text==='s'&&lt.text==='t') trennEinheit=vorVokal-2;
      }
    }
    const charPos = einheiten[trennEinheit].pos;
    if (charPos>0 && charPos<wort.length) trennstellen.push(charPos);
  }
  if (!trennstellen.length) return wort;
  let erg='', letzte=0;
  for (const pos of trennstellen) { erg+=wort.substring(letzte,pos)+'-'; letzte=pos; }
  return erg+wort.substring(letzte);
}

const ergebnis = emojiText.replace(/[a-zäöüßA-ZÄÖÜ]{4,}/g, (w) => silbentrennung(w));

return { json: { ...origData, [CFG.zielFeld]: ergebnis } };
