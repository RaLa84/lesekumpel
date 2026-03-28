/**
 * QA-Script für Lesekumpel Stories
 * Prüft alle 1.010 JSON-Dateien in stories/ auf Qualitätskriterien
 * Output: tests/qa-report.json + tests/qa-report.md
 */

const fs = require('fs');
const path = require('path');

const STORIES_DIR = path.join(__dirname, '..', 'stories');
const REPORT_JSON = path.join(__dirname, 'qa-report.json');
const REPORT_MD = path.join(__dirname, 'qa-report.md');

// === STUFEN-REGELN ===
const STUFEN_REGELN = {
  '1.0': { wMin: 20, wMax: 40, tempus: 'praesens' },
  '2.1': { wMin: 40, wMax: 60, tempus: 'praesens' },
  '2.2': { wMin: 40, wMax: 60, tempus: 'praesens' },
  '2.3': { wMin: 40, wMax: 60, tempus: 'praesens' },
  '2.4': { wMin: 40, wMax: 60, tempus: 'praesens' },
  '3.1': { wMin: 80, wMax: 100, tempus: 'praeteritum' },
  '3.2': { wMin: 80, wMax: 100, tempus: 'praeteritum' },
  '3.3': { wMin: 80, wMax: 100, tempus: 'praeteritum' },
  '3.4': { wMin: 80, wMax: 100, tempus: 'praeteritum' },
  '4.1': { wMin: 120, wMax: 150, tempus: 'praeteritum' },
  '4.2': { wMin: 120, wMax: 150, tempus: 'praeteritum' },
  '4.3': { wMin: 120, wMax: 150, tempus: 'praeteritum' },
  '4.4': { wMin: 120, wMax: 150, tempus: 'praeteritum' },
  '5.1': { wMin: 200, wMax: 300, tempus: 'praeteritum' },
  '5.2': { wMin: 200, wMax: 300, tempus: 'praeteritum' },
  '5.3': { wMin: 200, wMax: 300, tempus: 'praeteritum' },
  '5.4': { wMin: 200, wMax: 300, tempus: 'praeteritum' },
};

// === HILFSFUNKTIONEN ===
function countWords(text) {
  return text.split(/\s+/).filter(w => w.length > 0).length;
}

function countSentences(text) {
  return text.split(/[.!?]+/).filter(s => s.trim().length > 0).length;
}

function getSentences(text) {
  return text.split(/(?<=[.!?])\s+/).filter(s => s.trim().length > 0);
}

function getWords(text) {
  return text.split(/\s+/).filter(w => w.replace(/[^a-zA-ZäöüÄÖÜß]/g, '').length > 0);
}

function getParagraphs(text) {
  return text.split(/\n\n+/).filter(p => p.trim().length > 0);
}

// === TEST-FUNKTIONEN ===

function testMetriken(story) {
  const regeln = STUFEN_REGELN[story.stufe];
  if (!regeln) return { pass: false, issues: [`Unbekannte Stufe: ${story.stufe}`] };

  const wc = countWords(story.text);
  const issues = [];

  if (wc < regeln.wMin) issues.push(`Wörter: ${wc} < ${regeln.wMin} (zu kurz)`);
  if (wc > regeln.wMax * 1.15) issues.push(`Wörter: ${wc} > ${Math.round(regeln.wMax * 1.15)} (zu lang, >15% über Max)`);

  return { pass: issues.length === 0, wc, issues };
}

function testTempus(story) {
  const regeln = STUFEN_REGELN[story.stufe];
  if (!regeln) return { pass: true, issues: [] };

  const text = story.text.toLowerCase();
  const praeteritumMarker = ['war ', 'hatte ', 'ging ', 'lief ', 'kam ', 'sah ', 'fand ', 'nahm ',
    'stand ', 'sprach ', 'rief ', 'sagte ', 'fragte ', 'wusste ', 'konnte ', 'wollte ',
    'musste ', 'machte ', 'spielte ', 'suchte ', 'dachte ', 'fühlte ', 'merkte '];
  const praesensMarker = ['ist ', 'hat ', 'geht ', 'läuft ', 'kommt ', 'sieht ', 'findet ',
    'steht ', 'spricht ', 'ruft ', 'sagt ', 'fragt ', 'kann ', 'will ', 'muss ',
    'macht ', 'spielt ', 'sucht ', 'denkt ', 'fühlt '];

  const praetCount = praeteritumMarker.filter(m => text.includes(m)).length;
  const praesCount = praesensMarker.filter(m => text.includes(m)).length;

  const issues = [];
  if (regeln.tempus === 'praesens' && praetCount > praesCount + 3) {
    issues.push(`Tempus: Soll Präsens, aber ${praetCount} Prät. vs ${praesCount} Präs. Marker`);
  }
  if (regeln.tempus === 'praeteritum' && praesCount > praetCount + 3) {
    issues.push(`Tempus: Soll Präteritum, aber ${praesCount} Präs. vs ${praetCount} Prät. Marker`);
  }

  return { pass: issues.length === 0, praetCount, praesCount, issues };
}

function testFokusPhaenomene(story) {
  const text = story.text.toLowerCase();
  const words = getWords(story.text);
  const issues = [];
  let fokusCount = 0;

  switch (story.stufe) {
    case '2.1': { // Mehrgrapheme
      const patterns = ['sch', 'ch', 'eu', 'ei', 'ie', 'au'];
      fokusCount = patterns.reduce((c, p) => c + (text.match(new RegExp(p, 'g')) || []).length, 0);
      if (fokusCount < 4) issues.push(`Mehrgrapheme: nur ${fokusCount} Treffer (min 4)`);
      break;
    }
    case '2.2': { // Konsonantencluster
      const patterns = ['bl', 'gr', 'kn', 'pf', 'str', 'schr', 'spr'];
      fokusCount = patterns.reduce((c, p) => c + (text.match(new RegExp('\\b\\w*' + p, 'g')) || []).length, 0);
      if (fokusCount < 3) issues.push(`Konsonantencluster: nur ${fokusCount} Treffer (min 3)`);
      break;
    }
    case '2.3': { // Endungen
      fokusCount = words.filter(w => w.match(/(en|er|el)$/i)).length;
      if (fokusCount < 4) issues.push(`Endungen (-en/-er/-el): nur ${fokusCount} Wörter (min 4)`);
      break;
    }
    case '2.4': { // Komposita
      fokusCount = words.filter(w => w.replace(/[^a-zA-ZäöüÄÖÜß]/g, '').length > 8).length;
      if (fokusCount < 2) issues.push(`Komposita: nur ${fokusCount} lange Wörter (min 2)`);
      break;
    }
    case '3.2': { // Vorsilben
      const prefixes = ['ver', 'ent', 'be', 'ge'];
      fokusCount = words.filter(w => prefixes.some(p => w.toLowerCase().startsWith(p) && w.length > p.length + 2)).length;
      if (fokusCount < 3) issues.push(`Vorsilben: nur ${fokusCount} Treffer (min 3)`);
      break;
    }
    case '3.3': { // Suffixe
      fokusCount = words.filter(w => w.match(/(ung|heit|keit|nis)$/i)).length;
      if (fokusCount < 2) issues.push(`Suffixe (-ung/-heit/-keit/-nis): nur ${fokusCount} (min 2)`);
      break;
    }
    case '3.4': { // Konjunktionen
      const konj = ['weil', 'dass', 'aber', 'denn', 'obwohl', 'damit'];
      fokusCount = konj.reduce((c, k) => c + (text.match(new RegExp('\\b' + k + '\\b', 'g')) || []).length, 0);
      if (fokusCount < 3) issues.push(`Konjunktionen: nur ${fokusCount} Treffer (min 3)`);
      break;
    }
    case '4.1': { // Trennbare Verben
      const particles = ['auf', 'mit', 'an', 'ein', 'aus', 'her', 'hin', 'zurück', 'weg', 'ab', 'zu'];
      // Check for particles at end of sentence or separated
      fokusCount = particles.reduce((c, p) => c + (text.match(new RegExp('\\b' + p + '[.!?,]', 'g')) || []).length, 0);
      // Also check infinitive forms like "aufzumachen"
      fokusCount += words.filter(w => particles.some(p => w.toLowerCase().startsWith(p) && w.length > p.length + 4)).length;
      if (fokusCount < 3) issues.push(`Trennbare Verben: nur ${fokusCount} Treffer (min 3)`);
      break;
    }
    case '4.2': { // Dialoge
      const redeVerben = ['sagte', 'fragte', 'rief', 'flüsterte', 'antwortete', 'erklärte', 'murmelte', 'schrie'];
      fokusCount = redeVerben.reduce((c, v) => c + (text.match(new RegExp(v, 'gi')) || []).length, 0);
      const hasQuotes = (text.match(/['"'„"«»]/g) || []).length;
      if (fokusCount < 2 && hasQuotes < 2) issues.push(`Dialoge: nur ${fokusCount} Redebegleiter und ${hasQuotes} Anführungszeichen`);
      break;
    }
    case '4.3': { // Relativsätze
      fokusCount = (text.match(/, (der|die|das|den|dem|welcher|welche|welches) /g) || []).length;
      if (fokusCount < 2) issues.push(`Relativsätze: nur ${fokusCount} Treffer (min 2)`);
      break;
    }
    case '4.4': { // Vergleiche
      const compMarkers = (text.match(/\b\w+er als\b/g) || []).length;
      const supMarkers = (text.match(/\bam \w+sten\b/g) || []).length;
      const wieMarkers = (text.match(/\bwie ein\b/g) || []).length;
      fokusCount = compMarkers + supMarkers + wieMarkers;
      if (fokusCount < 2) issues.push(`Vergleiche/Komparativ: nur ${fokusCount} Treffer (min 2)`);
      break;
    }
    case '5.1': { // Verb-Diversität
      const verbs = words.filter(w => w.match(/(te|ten|te$|en$|t$)/i) && w.length > 3);
      const uniqueVerbs = new Set(verbs.map(v => v.toLowerCase()));
      fokusCount = uniqueVerbs.size;
      if (fokusCount < 8) issues.push(`Verb-Diversität: nur ${fokusCount} unique Verben (min 8)`);
      break;
    }
    case '5.2': { // Redewendungen
      // Look for explanation markers that suggest idioms are being explained
      const redewendungMarkers = ['bedeutet', 'heißt so viel wie', 'das heißt', 'man sagt', 'sprichwort', 'redewendung'];
      fokusCount = redewendungMarkers.reduce((c, m) => c + (text.match(new RegExp(m, 'gi')) || []).length, 0);
      if (fokusCount < 1) issues.push(`Redewendungen: keine Erklärungsmarker gefunden`);
      break;
    }
    case '5.3': { // Abstrakta
      const abstrakta = ['mut', 'angst', 'freude', 'stolz', 'scham', 'neid', 'trauer', 'hoffnung',
        'vertrauen', 'einsamkeit', 'freiheit', 'zugehörigkeit', 'unsicherheit', 'erleichterung',
        'geborgenheit', 'sehnsucht', 'eifersucht', 'wut', 'traurigkeit', 'glück'];
      fokusCount = abstrakta.filter(a => text.includes(a)).length;
      if (fokusCount < 2) issues.push(`Abstrakta: nur ${fokusCount} Gefühlswörter (min 2)`);
      break;
    }
    case '5.4': { // Passiv
      fokusCount = (text.match(/\b(wird|wurde|werden|wurden|worden|geworden)\b/g) || []).length;
      if (fokusCount < 3) issues.push(`Passiv: nur ${fokusCount} Passiv-Marker (min 3)`);
      break;
    }
  }

  return { pass: issues.length === 0, fokusCount, issues };
}

function testPersonaRegeln(story) {
  const text = story.text;
  const textLower = text.toLowerCase();
  const issues = [];

  switch (story.persona) {
    case 'leo': {
      // Keine Metaphern
      const metapherMarker = ['wie ein ', 'als ob ', 'als wäre ', 'als hätte ', 'als könnte '];
      const metaphern = metapherMarker.filter(m => textLower.includes(m));
      if (metaphern.length > 0 && story.stufe !== '4.4') { // 4.4 erlaubt wörtliche Vergleiche
        issues.push(`Leo: Mögliche Metaphern: ${metaphern.join(', ')}`);
      }
      // Gefühle begründet
      const hatWeil = (textLower.match(/\bweil\b/g) || []).length;
      if (hatWeil < 1 && story.stufe >= '3.4') issues.push(`Leo: Kein "weil" für Gefühlsbegründung`);
      break;
    }
    case 'timo': {
      // Kein Genitiv
      if (textLower.match(/\bdes\b/) || textLower.match(/\bder (katze|mutter|schwester|frau|stadt)\b/)) {
        issues.push('Timo: Möglicher Genitiv gefunden');
      }
      // Keine langen Komposita
      const words = getWords(text);
      const longWords = words.filter(w => w.replace(/[^a-zA-ZäöüÄÖÜß]/g, '').length > 12);
      if (longWords.length > 0) issues.push(`Timo: Lange Komposita: ${longWords.join(', ')}`);
      // Gleichmäßige Satzlänge
      const sentences = getSentences(text);
      const lengths = sentences.map(s => countWords(s));
      if (lengths.length > 2) {
        const avg = lengths.reduce((a, b) => a + b, 0) / lengths.length;
        const stddev = Math.sqrt(lengths.reduce((s, l) => s + (l - avg) ** 2, 0) / lengths.length);
        if (stddev > 4) issues.push(`Timo: Ungleichmäßige Satzlänge (StdDev: ${stddev.toFixed(1)}, Soll <4)`);
      }
      break;
    }
    case 'mia': {
      // Wort-Erklärungen
      const erklaerungen = ['bedeutet', 'heißt', 'das ist ein', 'das ist eine', 'das sind', 'man nennt'];
      const hatErklaerung = erklaerungen.some(e => textLower.includes(e));
      if (!hatErklaerung && parseFloat(story.stufe) >= 4.0) {
        issues.push('Mia: Keine Wort-Erklärungen gefunden (ab Stufe 4 erwartet)');
      }
      break;
    }
    case 'jonas': {
      // Ich-Perspektive
      const ichCount = (text.match(/\bIch\b/g) || []).length + (text.match(/\bich\b/g) || []).length;
      if (ichCount < 2) issues.push(`Jonas: Nur ${ichCount}x "ich" — Ich-Perspektive fehlt?`);
      break;
    }
    case 'holzi': {
      const slangWords = ['cringe', 'npc', 'level', 'bug', 'quest', 'gamer', 'noob', 'nice', 'literally',
        'random', 'lost', 'safe', 'flex', 'gg', 'rip', 'achievement', 'respawn', 'speedrun', 'grind'];
      const found = slangWords.filter(w => textLower.includes(w));
      if (found.length < 1) issues.push('Holzi: Kein Gamer-Slang gefunden');
      break;
    }
    case 'zara': {
      const paragraphs = getParagraphs(text);
      if (paragraphs.length > 0) {
        const avgSentencesPerPara = countSentences(text) / paragraphs.length;
        if (avgSentencesPerPara > 3.5) issues.push(`Zara: Ø ${avgSentencesPerPara.toFixed(1)} Sätze/Absatz (Soll ≤2.5)`);
      }
      break;
    }
    case 'samira': {
      const fragen = ['hast du', 'wusstest du', 'weißt du', 'kennst du', 'glaubst du', 'kein witz', 'halt dich fest'];
      const found = fragen.filter(f => textLower.includes(f));
      if (found.length < 1) issues.push('Samira: Keine Leserfragen gefunden');
      break;
    }
  }

  return { pass: issues.length === 0, issues };
}

function testNamesDiversitaet(stories) {
  // Group by persona, extract capitalized words that look like names
  const namesByPersona = {};
  const commonWords = new Set(['der', 'die', 'das', 'ein', 'eine', 'und', 'aber', 'weil', 'dass',
    'sie', 'er', 'es', 'ich', 'du', 'wir', 'ihr', 'den', 'dem', 'des', 'mit', 'von',
    'auf', 'für', 'ist', 'war', 'hat', 'hatte', 'als', 'wie', 'nach', 'vor', 'über',
    'unter', 'durch', 'ohne', 'gegen', 'zwischen', 'stell', 'dir', 'kein', 'keine',
    'nicht', 'noch', 'schon', 'auch', 'nur', 'sehr', 'ganz', 'dann', 'wenn', 'denn',
    'dort', 'hier', 'jetzt', 'nun', 'immer', 'nie', 'mehr', 'viel', 'wenig', 'gut',
    'the', 'and', 'minecraft', 'creeper', 'enderman', 'nether', 'capybara', 'döner']);

  stories.forEach(s => {
    if (!namesByPersona[s.persona]) namesByPersona[s.persona] = {};
    // Find capitalized words in middle of sentences (likely names)
    const nameMatches = s.text.match(/(?<=[.!?]\s+|^)[A-ZÄÖÜ][a-zäöüß]+|(?<=\s)[A-ZÄÖÜ][a-zäöüß]{2,}/g) || [];
    nameMatches.forEach(n => {
      if (!commonWords.has(n.toLowerCase()) && n.length > 2) {
        namesByPersona[s.persona][n] = (namesByPersona[s.persona][n] || 0) + 1;
      }
    });
  });

  const results = {};
  for (const [persona, names] of Object.entries(namesByPersona)) {
    const sorted = Object.entries(names).sort((a, b) => b[1] - a[1]).slice(0, 15);
    results[persona] = sorted.map(([name, count]) => `${name}(${count})`);
  }
  return results;
}

function testJsonKonsistenz(story, filename) {
  const issues = [];
  const requiredFields = ['id', 'titel', 'autor', 'persona', 'stufe', 'thema', 'genre', 'datum', 'text', 'zusammenfassung'];
  requiredFields.forEach(f => {
    if (!story[f]) issues.push(`Fehlt: ${f}`);
  });

  // Check filename matches content
  const expectedPersona = filename.match(/-([a-z]+)-\d/)?.[1];
  const expectedStufe = filename.match(/-(\d\.\d)\.json$/)?.[1];
  if (expectedPersona && expectedPersona !== story.persona) {
    issues.push(`Dateiname sagt ${expectedPersona}, JSON sagt ${story.persona}`);
  }
  if (expectedStufe && expectedStufe !== story.stufe) {
    issues.push(`Dateiname sagt Stufe ${expectedStufe}, JSON sagt ${story.stufe}`);
  }

  return { pass: issues.length === 0, issues };
}

function testDuplikate(stories) {
  // Check for identical texts
  const textMap = {};
  const dupes = [];
  stories.forEach(s => {
    const key = s.text.substring(0, 100);
    if (textMap[key]) {
      dupes.push({ file1: textMap[key], file2: s.id, snippet: key.substring(0, 50) });
    } else {
      textMap[key] = s.id;
    }
  });
  return dupes;
}

// === HAUPTLAUF ===
console.log('QA-Script startet...');
const files = fs.readdirSync(STORIES_DIR).filter(f => f.endsWith('.json'));
console.log(`${files.length} Dateien gefunden.`);

const allStories = [];
const allIssues = [];
const stats = {
  total: 0,
  valid: 0,
  broken: 0,
  metriken: { pass: 0, fail: 0 },
  tempus: { pass: 0, fail: 0 },
  fokus: { pass: 0, fail: 0 },
  persona: { pass: 0, fail: 0 },
  json: { pass: 0, fail: 0 },
};

files.forEach(f => {
  stats.total++;
  let story;
  try {
    story = JSON.parse(fs.readFileSync(path.join(STORIES_DIR, f), 'utf8'));
    if (!story.text || story.text.length < 10) throw new Error('Leerer Text');
    stats.valid++;
  } catch (e) {
    stats.broken++;
    allIssues.push({ file: f, category: 'BROKEN', issues: [e.message] });
    return;
  }

  allStories.push(story);

  const storyIssues = [];

  // 1. Metriken
  const metriken = testMetriken(story);
  if (metriken.pass) stats.metriken.pass++; else { stats.metriken.fail++; storyIssues.push(...metriken.issues); }

  // 2. Tempus
  const tempus = testTempus(story);
  if (tempus.pass) stats.tempus.pass++; else { stats.tempus.fail++; storyIssues.push(...tempus.issues); }

  // 3. Fokus-Phänomene
  const fokus = testFokusPhaenomene(story);
  if (fokus.pass) stats.fokus.pass++; else { stats.fokus.fail++; storyIssues.push(...fokus.issues); }

  // 4. Persona-Regeln
  const persona = testPersonaRegeln(story);
  if (persona.pass) stats.persona.pass++; else { stats.persona.fail++; storyIssues.push(...persona.issues); }

  // 5. JSON-Konsistenz
  const json = testJsonKonsistenz(story, f);
  if (json.pass) stats.json.pass++; else { stats.json.fail++; storyIssues.push(...json.issues); }

  if (storyIssues.length > 0) {
    allIssues.push({ file: f, id: story.id, persona: story.persona, stufe: story.stufe, thema: story.thema, issues: storyIssues });
  }
});

// 6. Duplikate
const dupes = testDuplikate(allStories);

// 7. Namen-Diversität
const namesDiversity = testNamesDiversitaet(allStories);

// === REPORT GENERIEREN ===
const report = { stats, allIssues, dupes, namesDiversity, timestamp: new Date().toISOString() };
fs.writeFileSync(REPORT_JSON, JSON.stringify(report, null, 2));

// === MARKDOWN REPORT ===
let md = `# QA-Report: Lesekumpel Stories\n\n`;
md += `**Datum:** ${new Date().toISOString().split('T')[0]}\n`;
md += `**Dateien:** ${stats.total} | **Valide:** ${stats.valid} | **Kaputt:** ${stats.broken}\n\n`;

md += `## Ergebnisübersicht\n\n`;
md += `| Test | Bestanden | Durchgefallen | Quote |\n`;
md += `|---|---|---|---|\n`;
for (const [name, s] of Object.entries(stats).filter(([k]) => !['total', 'valid', 'broken'].includes(k))) {
  const total = s.pass + s.fail;
  const quote = total > 0 ? ((s.pass / total) * 100).toFixed(1) : '—';
  md += `| ${name} | ${s.pass} | ${s.fail} | ${quote}% |\n`;
}

md += `\n## Auffälligkeiten (${allIssues.length} Texte mit Problemen)\n\n`;

// Group issues by category
const byCategory = {};
allIssues.forEach(i => {
  i.issues.forEach(issue => {
    const cat = issue.split(':')[0];
    if (!byCategory[cat]) byCategory[cat] = [];
    byCategory[cat].push({ file: i.file || i.id, issue });
  });
});

for (const [cat, items] of Object.entries(byCategory).sort((a, b) => b[1].length - a[1].length)) {
  md += `### ${cat} (${items.length})\n\n`;
  items.slice(0, 20).forEach(i => md += `- \`${i.file}\`: ${i.issue}\n`);
  if (items.length > 20) md += `- ... und ${items.length - 20} weitere\n`;
  md += `\n`;
}

if (dupes.length > 0) {
  md += `## Duplikate (${dupes.length})\n\n`;
  dupes.forEach(d => md += `- \`${d.file1}\` ≈ \`${d.file2}\`: "${d.snippet}..."\n`);
  md += `\n`;
}

md += `## Namens-Diversität pro Persona\n\n`;
for (const [persona, names] of Object.entries(namesDiversity).sort()) {
  md += `**${persona}:** ${names.join(', ')}\n\n`;
}

fs.writeFileSync(REPORT_MD, md);
console.log(`\nReport geschrieben:`);
console.log(`  ${REPORT_JSON}`);
console.log(`  ${REPORT_MD}`);
console.log(`\n=== ZUSAMMENFASSUNG ===`);
console.log(`Dateien: ${stats.total} | Valide: ${stats.valid} | Kaputt: ${stats.broken}`);
console.log(`Metriken: ${stats.metriken.pass}/${stats.valid} OK | Tempus: ${stats.tempus.pass}/${stats.valid} OK`);
console.log(`Fokus: ${stats.fokus.pass}/${stats.valid} OK | Persona: ${stats.persona.pass}/${stats.valid} OK`);
console.log(`JSON: ${stats.json.pass}/${stats.valid} OK | Duplikate: ${dupes.length}`);
console.log(`Texte mit Problemen: ${allIssues.length}`);
