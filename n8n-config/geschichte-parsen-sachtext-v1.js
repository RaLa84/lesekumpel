// Knoten: "Geschichte parsen" — Sachtext-Workflow (Samira), v1
// Abgeleitet aus dem Haupt-Parser (Node "Geschichte parsen" im Story-Generator) mit
// drei Sachtext-Erweiterungen:
//   (a) [[WUSSTEST-DU]]- und [[CHECKLISTE]]-Blöcke werden VOR dem Label-Split extrahiert
//       und aus dem Text entfernt; ein Hard-Sanitizer streicht kaputte Marker-Restzeilen.
//   (b) cleanMarkdown erhält Mini-Überschriften (**Überschrift** allein auf einer Zeile),
//       weil das Template sie als <h3> rendert.
//   (c) Rückgabe zusätzlich: sachtextBlocks { wusstestDu[], checkliste } — silbengetrennt.
const input = $('Daten vorbereiten').first().json;
const responseText = $input.item.json.text || $input.item.json.output || '';

// ═══════════════════════════════════════════════════
// (a) Bausteine extrahieren — tolerant gegen LLM-Abweichungen:
//     einfache statt doppelte Klammern, fehlender Schluss-Marker (Block endet am
//     nächsten Marker oder Textende), Bullets als - / * / • / 1. / 1)
// ═══════════════════════════════════════════════════

function extractBlocks(text) {
  const wusstestDu = [];
  let checkliste = null;
  const spans = [];

  const openRe = /\[\[?\s*(WUSSTEST[-_\s]?DU|CHECKLISTE)\s*(?::\s*([^\]\n]*))?\s*\]\]?/gi;
  const opens = [];
  let m;
  while ((m = openRe.exec(text)) !== null) {
    opens.push({ type: m[1].toUpperCase().startsWith('C') ? 'checkliste' : 'wusstestDu', titel: (m[2] || '').trim(), start: m.index, contentStart: m.index + m[0].length });
  }

  for (let i = 0; i < opens.length; i++) {
    const o = opens[i];
    const nextOpen = (i + 1 < opens.length) ? opens[i + 1].start : text.length;
    const closeRe = /\[\[?\s*\/\s*(WUSSTEST[-_\s]?DU|CHECKLISTE)\s*\]\]?/gi;
    closeRe.lastIndex = o.contentStart;
    const c = closeRe.exec(text);
    const contentEnd = (c && c.index < nextOpen) ? c.index : nextOpen;
    const spanEnd = (c && c.index < nextOpen) ? c.index + c[0].length : nextOpen;
    const content = text.substring(o.contentStart, contentEnd).trim();
    spans.push({ start: o.start, end: spanEnd });

    if (o.type === 'wusstestDu') {
      const t = content.replace(/\s+/g, ' ').trim();
      if (t && wusstestDu.length < 3) wusstestDu.push(t);
    } else if (!checkliste) {
      const lines = content.split('\n').map(l => l.trim()).filter(Boolean);
      let punkte = lines
        .map(l => { const bm = l.match(/^(?:[-*•]|\d+[.)])\s+(.*)$/); return bm ? bm[1].trim() : null; })
        .filter(Boolean);
      if (punkte.length < 2) punkte = lines; // kein Bullet-Format geliefert -> Zeilen als Punkte
      punkte = punkte.filter(Boolean).slice(0, 6);
      if (punkte.length >= 2) {
        checkliste = { titel: o.titel || 'Das merkst du dir', punkte };
      }
    }
  }

  // Gefundene Blöcke aus dem Text entfernen (rückwärts, damit Indizes stabil bleiben)
  let cleaned = text;
  for (let i = spans.length - 1; i >= 0; i--) {
    cleaned = cleaned.substring(0, spans[i].start) + cleaned.substring(spans[i].end);
  }
  // Hard-Sanitizer: Restzeilen mit Marker-Fragmenten dürfen den Story-Text nie verunreinigen
  cleaned = cleaned.split('\n').filter(l => !/\[\[?\s*\/?\s*(WUSSTEST|CHECKLISTE|KASTEN)/i.test(l)).join('\n');

  return { cleaned, wusstestDu, checkliste };
}

const extracted = extractBlocks(responseText);
const textOhneBloecke = extracted.cleaned;

// Tolerant label matcher — accepts Markdown markers (# ## ### ** **), with or without colon,
// with or without German hyphenation (GE-SCHICH-TE, ZU-SAM-MEN-FAS-SUNG).
function findLabelPositions(text, labelPattern) {
  const re = new RegExp("(?:#{1,3}\\s*|\\*\\*\\s*)?" + labelPattern + "(?::|\\s)\\s*\\*?\\*?", "i");
  const m = text.match(re);
  if (!m) return null;
  return { start: m.index, end: m.index + m[0].length };
}
const geschPattern = "GE\\s*-?\\s*SCHICH\\s*-?\\s*TE";
const zusamPattern = "ZU\\s*-?\\s*SAM\\s*-?\\s*MEN\\s*-?\\s*FAS\\s*-?\\s*SUNG";
const gesch = findLabelPositions(textOhneBloecke, geschPattern);
const zusam = findLabelPositions(textOhneBloecke, zusamPattern);

let rawStory, summaryText;
if (gesch && zusam && zusam.start > gesch.end) {
  rawStory = textOhneBloecke.substring(gesch.end, zusam.start).trim();
  summaryText = textOhneBloecke.substring(zusam.end).trim();
} else if (gesch) {
  rawStory = textOhneBloecke.substring(gesch.end).trim();
  summaryText = '';
} else {
  rawStory = textOhneBloecke.trim();
  summaryText = '';
}

// ═══════════════════════════════════════════════════
// (b) Markdown strippen — aber Mini-Überschriften erhalten.
// Eine Zeile, die KOMPLETT aus **Text** besteht, ist eine Sachtext-Mini-Überschrift
// und wird vom Template als <h3> gerendert. Nur Inline-Markdown wird entfernt.
// ═══════════════════════════════════════════════════

function cleanMarkdown(s) {
  return s.split('\n').map(line => {
    if (/^\s*\*\*[^*]+\*\*\s*$/.test(line)) return line.trim();
    return line
      .replace(/^[#*]+\s*/, '')
      .replace(/\*\*([^*]+)\*\*/g, '$1')
      .replace(/\*([^*]+)\*/g, '$1');
  }).join('\n').trim();
}
rawStory = cleanMarkdown(rawStory);
summaryText = cleanMarkdown(summaryText) || rawStory.split('\n').find(l => !/^\*\*/.test(l)) || rawStory.split('\n')[0];

// ═══════════════════════════════════════════════════
// Deutsche Silbentrennung v2 (Digraphen-aware) — identisch zum Haupt-Workflow
// ═══════════════════════════════════════════════════

function silbentrennung(wort) {
  if (wort.length <= 3) return wort;
  if (!/^[a-zäöüß]+$/i.test(wort)) return wort;

  const w = wort.toLowerCase();

  // Schritt 1: Wort in Einheiten zerlegen (Digraphen als eine Einheit)
  const einheiten = [];
  let i = 0;
  while (i < w.length) {
    // Trigraph: sch
    if (i + 2 < w.length && w.substring(i, i + 3) === 'sch') {
      einheiten.push({ text: w.substring(i, i + 3), typ: 'K', pos: i, len: 3 });
      i += 3; continue;
    }
    // Digraphen: ch, ck, ph, th, qu, pf, ng, nk
    const zwei = i + 1 < w.length ? w.substring(i, i + 2) : '';
    if (['ch', 'ck', 'ph', 'th', 'qu', 'pf'].includes(zwei)) {
      einheiten.push({ text: zwei, typ: 'K', pos: i, len: 2 });
      i += 2; continue;
    }
    // Doppelvokale: ei, au, eu, äu, ie, ai
    if (['ei', 'au', 'eu', 'äu', 'ie', 'ai'].includes(zwei)) {
      einheiten.push({ text: zwei, typ: 'V', pos: i, len: 2 });
      i += 2; continue;
    }
    // Einzelbuchstabe
    const vokal = 'aeiouyäöü'.includes(w[i]);
    einheiten.push({ text: w[i], typ: vokal ? 'V' : 'K', pos: i, len: 1 });
    i++;
  }

  // Schritt 2: Vokalgruppen finden (aufeinanderfolgende V-Einheiten)
  const vokalIndices = [];
  for (let e = 0; e < einheiten.length; e++) {
    if (einheiten[e].typ === 'V') {
      // Gehört zur vorherigen Vokalgruppe?
      if (vokalIndices.length > 0 && vokalIndices[vokalIndices.length - 1].end === e) {
        vokalIndices[vokalIndices.length - 1].end = e + 1;
      } else {
        vokalIndices.push({ start: e, end: e + 1 });
      }
    }
  }

  if (vokalIndices.length < 2) return wort;

  // Schritt 3: Trennstellen zwischen Vokalgruppen
  const trennstellen = [];
  for (let v = 0; v < vokalIndices.length - 1; v++) {
    const nachVokal = vokalIndices[v].end;       // erste Konsonant-Einheit nach Vokal
    const vorVokal = vokalIndices[v + 1].start;  // erste Vokal-Einheit der nächsten Silbe
    const anzahlKons = vorVokal - nachVokal;

    let trennEinheit;
    if (anzahlKons === 0) {
      // Vokal-Vokal: trenne dazwischen
      trennEinheit = nachVokal;
    } else if (anzahlKons === 1) {
      // 1 Konsonant(engruppe): gehört zur nächsten Silbe
      trennEinheit = nachVokal;
    } else {
      // 2+ Konsonanten: letzter Konsonant (oder letzte Digraph-Einheit) zur nächsten Silbe
      trennEinheit = vorVokal - 1;

      // st bleibt zusammen (st gehört zur nächsten Silbe)
      if (anzahlKons >= 2) {
        const vorletzte = einheiten[vorVokal - 2];
        const letzte = einheiten[vorVokal - 1];
        if (vorletzte.text === 's' && letzte.text === 't') {
          trennEinheit = vorVokal - 2;
        }
      }
    }

    // Position im Original-Wort
    const charPos = einheiten[trennEinheit].pos;
    if (charPos > 0 && charPos < wort.length) {
      trennstellen.push(charPos);
    }
  }

  // Schritt 4: Wort zusammenbauen
  if (trennstellen.length === 0) return wort;

  let ergebnis = '';
  let letzte = 0;
  for (const pos of trennstellen) {
    ergebnis += wort.substring(letzte, pos) + '­';
    letzte = pos;
  }
  ergebnis += wort.substring(letzte);

  return ergebnis;
}

function textSilbentrennung(text) {
  return text.replace(/[a-zäöüßA-ZÄÖÜ]{4,}/g, (wort) => silbentrennung(wort));
}

const storyText = textSilbentrennung(rawStory);
const wordCount = rawStory.split(/\s+/).length;

// (c) Bausteine mit Silbentrennung für die Anzeige
const sachtextBlocks = {
  wusstestDu: extracted.wusstestDu.map(t => textSilbentrennung(t)),
  checkliste: extracted.checkliste
    ? { titel: extracted.checkliste.titel, punkte: extracted.checkliste.punkte.map(p => textSilbentrennung(p)) }
    : null
};

return { json: { ...input, storyText, rawStoryText: rawStory, summaryText, wordCount, sachtextBlocks } };
