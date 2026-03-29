/**
 * QA-Analyse für Lesekumpel Test-Stories
 * Prüft: Tempus, Syntax, Fokus, Wortanzahl, Autoren-Authentizität
 */
const fs = require('fs');
const path = require('path');

const content = fs.readFileSync(path.join(__dirname, 'stories-data.js'), 'utf8');
const fn = new Function(content + '; return STORIES;');
const STORIES = fn();

// === STUFEN-REGELN ===
const STUFEN = {
  '1.0': { wMin:20, wMax:40, tempus:'praesens', fokus:'Top-100-Wörter', syntax:'hauptsaetze' },
  '2.1': { wMin:40, wMax:60, tempus:'praesens', fokus:'Sonderlaute (sch,ch,eu,ei,ie,au)', syntax:'hauptsaetze' },
  '2.2': { wMin:40, wMax:60, tempus:'praesens', fokus:'Konsonantencluster (bl,gr,kn,pf,str,schr,spr)', syntax:'hauptsaetze' },
  '2.3': { wMin:40, wMax:60, tempus:'praesens', fokus:'Endungen (-en,-er,-el)', syntax:'hauptsaetze' },
  '2.4': { wMin:40, wMax:60, tempus:'praesens', fokus:'Komposita (Nomen+Nomen)', syntax:'hauptsaetze' },
  '3.1': { wMin:80, wMax:100, tempus:'praeteritum', fokus:'Starke Verben (lief,kam,sah,ging,fand,nahm,stand,sprach)', syntax:'einfach' },
  '3.2': { wMin:80, wMax:100, tempus:'praeteritum', fokus:'Vorsilben (ver-,ent-,be-,ge-)', syntax:'einfach' },
  '3.3': { wMin:80, wMax:100, tempus:'praeteritum', fokus:'Suffixe (-ung,-heit,-keit,-nis)', syntax:'objekte' },
  '3.4': { wMin:80, wMax:100, tempus:'praeteritum', fokus:'Konjunktionen (weil,dass,aber,denn,obwohl,damit)', syntax:'nebensaetze' },
  '4.1': { wMin:120, wMax:150, tempus:'praeteritum', fokus:'Trennbare Verben (auf-,mit-,herein-,zurück-)', syntax:'satzklammer' },
  '4.2': { wMin:120, wMax:150, tempus:'praeteritum', fokus:'Dialoge & Redebegleiter (rief,fragte,flüsterte,antwortete,erklärte)', syntax:'redebegleiter' },
  '4.3': { wMin:120, wMax:150, tempus:'praeteritum', fokus:'Relativsätze (der,die,das,welcher)', syntax:'relativsaetze' },
  '4.4': { wMin:120, wMax:150, tempus:'praeteritum', fokus:'Adjektive & Vergleiche (als,wie,Komparativ,Superlativ)', syntax:'vergleiche' },
  '5.1': { wMin:200, wMax:300, tempus:'praeteritum', fokus:'Synonyme & Wortfeld (präzise Verben)', syntax:'variabel' },
  '5.2': { wMin:200, wMax:300, tempus:'praeteritum', fokus:'Redewendungen (2-3 Stück, erklärt)', syntax:'variabel' },
  '5.3': { wMin:200, wMax:300, tempus:'praeteritum', fokus:'Abstrakta & Gefühle (Mut,Angst,Stolz,Scham)', syntax:'innenperspektive' },
  '5.4': { wMin:200, wMax:300, tempus:'praeteritum', fokus:'Passiv & Sachtext', syntax:'passiv' },
};

// === PERSONA-REGELN ===
const PERSONA_RULES = {
  lea: { name:'Lea Lesestark', noGos:['passiv_haeufig'], checks:['augenzwinkern','lebendige_szenen'] },
  leo: { name:'Leo Klartext', noGos:['metaphern','ironie','personifikation'], checks:['gefuehle_explizit','weil_deshalb','woerter_erklaert'] },
  timo: { name:'Timo Taktschritt', noGos:['komposita','genitiv','lange_woerter'], checks:['rhythmus','kurze_saetze'] },
  zara: { name:'Zara Zapp', noGos:['passiv','lange_absaetze','langsamer_einstieg'], checks:['action_start','kurze_absaetze','cliffhanger'] },
  jonas: { name:'Jonas Entdecker', noGos:['abstrakte_konzepte'], checks:['ich_perspektive','alltagssprache','innerer_monolog'] },
  samira: { name:'Samira Wissensfreund', noGos:['fiktive_protagonisten','metaphern_erzaehlung','ironie'], checks:['du_perspektive','fakten','fragen_an_leser'] },
  holzi: { name:'Holzi Pixelkopf', noGos:[], checks:['denglisch','gamer_sprache','dialog_nachstellung','panik_spirale'] },
  deniz: { name:'Deniz Traumfänger', noGos:['jugendsprache','comic_laute'], checks:['sinne','atmosphaere','metaphern_kinderwelt','langsames_tempo'] },
};

// === HILFSFUNKTIONEN ===
function countWords(text) {
  return text.split(/\s+/).filter(w => w.length > 0).length;
}

function getSentences(text) {
  return text.split(/[.!?]+/).filter(s => s.trim().length > 0);
}

function avgWordsPerSentence(text) {
  const sents = getSentences(text);
  if (sents.length === 0) return 0;
  return Math.round(countWords(text) / sents.length * 10) / 10;
}

// Präteritum-Marker (starke + schwache Verben)
const PRAETERITUM_MARKERS = /\b(war|hatte|ging|lief|kam|sah|fand|nahm|stand|sprach|sprang|rannte|rief|fragte|sagte|machte|spielte|wollte|konnte|musste|wurde|dachte|fühlte|hörte|schlug|gab|blieb|schrieb|schlief|trug|warf|griff|stieg|fiel|hielt|ließ|zog|schnitt|ritt|sang|klang|hing|schwamm|begann|verlor|vergaß|entdeckte|bemerkte|beschloss|verschwand|erschrak|verstand|erkannte|flüsterte|murmelte|antwortete|erklärte|brüllte|keuchte|seufzte|kicherte|stöhnte|lachte|weinte|zitterte|schnappte|klaute|stahl|kletterte|huschte|schlich|eilte|hastete|schlenderte|stapfte|taumelte|stolperte|preschte)\b/gi;

const PRAESENS_MARKERS = /\b(ist|hat|geht|läuft|kommt|sieht|findet|nimmt|steht|spricht|springt|rennt|ruft|fragt|sagt|macht|spielt|will|kann|muss|wird|denkt|fühlt|hört|schlägt|gibt|bleibt|schreibt|schläft|trägt|wirft|greift|steigt|fällt|hält|lässt|zieht|singt|klingt|hängt|schwimmt|beginnt|sitzt|liegt|riecht|schmeckt)\b/gi;

// === ANALYSE-FUNKTIONEN ===

function checkTempus(story) {
  const regel = STUFEN[story.stufe];
  if (!regel) return { ok: false, detail: 'Unbekannte Stufe' };

  const text = story.text;
  const praetMatches = (text.match(PRAETERITUM_MARKERS) || []).length;
  const praesMatches = (text.match(PRAESENS_MARKERS) || []).length;

  if (regel.tempus === 'praesens') {
    const ratio = praesMatches / (praesMatches + praetMatches + 0.1);
    return {
      ok: ratio > 0.5,
      detail: `Präsens: ${praesMatches}, Präteritum: ${praetMatches} (Ratio: ${Math.round(ratio*100)}%)`,
      score: ratio
    };
  } else {
    // Stufe 5.4 erlaubt Passiv (oft Präsens-Form)
    if (story.stufe === '5.4') {
      return { ok: true, detail: `Passiv/Sachtext — Tempus-Mix erlaubt (Prät: ${praetMatches}, Präs: ${praesMatches})`, score: 1 };
    }
    const ratio = praetMatches / (praesMatches + praetMatches + 0.1);
    return {
      ok: ratio > 0.4,
      detail: `Präteritum: ${praetMatches}, Präsens: ${praesMatches} (Ratio: ${Math.round(ratio*100)}%)`,
      score: ratio
    };
  }
}

function checkWortanzahl(story) {
  const regel = STUFEN[story.stufe];
  if (!regel) return { ok: false, detail: 'Unbekannte Stufe' };

  const wc = countWords(story.text);
  const tolerance = 0.15;
  const min = Math.floor(regel.wMin * (1 - tolerance));
  const max = Math.ceil(regel.wMax * (1 + tolerance));

  return {
    ok: wc >= min && wc <= max,
    detail: `${wc} Wörter (Soll: ${regel.wMin}-${regel.wMax}, Toleranz ±15%: ${min}-${max})`,
    wc,
    deviation: wc < regel.wMin ? wc - regel.wMin : (wc > regel.wMax ? wc - regel.wMax : 0)
  };
}

function checkFokus(story) {
  const regel = STUFEN[story.stufe];
  if (!regel) return { ok: false, detail: 'Unbekannte Stufe', matches: 0 };
  const text = story.text.toLowerCase();

  let matches = 0;
  let searched = '';

  switch(story.stufe) {
    case '1.0':
      return { ok: true, detail: 'Top-100 — manuell prüfen', matches: -1 };
    case '2.1':
      matches = (text.match(/sch|ch|eu|ei|ie|au/g) || []).length;
      searched = 'sch/ch/eu/ei/ie/au';
      return { ok: matches >= 5, detail: `${matches}× Sonderlaute (${searched})`, matches };
    case '2.2':
      matches = (text.match(/bl|gr|kn|pf|str|schr|spr/g) || []).length;
      searched = 'bl/gr/kn/pf/str/schr/spr';
      return { ok: matches >= 3, detail: `${matches}× Konsonantencluster (${searched})`, matches };
    case '2.3':
      matches = (text.match(/\w+(?:en|er|el)\b/g) || []).length;
      searched = '-en/-er/-el Endungen';
      return { ok: matches >= 5, detail: `${matches}× ${searched}`, matches };
    case '2.4':
      matches = (text.match(/[A-ZÄÖÜ]\w+[a-zäöüß][A-ZÄÖÜ]\w+/g) || []).length;
      searched = 'Komposita';
      return { ok: matches >= 2, detail: `${matches}× ${searched}`, matches };
    case '3.1':
      matches = (text.match(/\b(lief|kam|sah|ging|fand|nahm|stand|sprach|sprang|schloss|rief|blieb|gab)\b/gi) || []).length;
      searched = 'starke Verben';
      return { ok: matches >= 3, detail: `${matches}× ${searched}`, matches };
    case '3.2':
      matches = (text.match(/\b(ver|ent|be|ge)\w+(?:te|en|t)\b/gi) || []).length;
      searched = 'Vorsilben-Verben';
      return { ok: matches >= 3, detail: `${matches}× ${searched}`, matches };
    case '3.3':
      matches = (text.match(/\w+(?:ung|heit|keit|nis)\b/gi) || []).length;
      searched = 'Suffix-Nomen';
      return { ok: matches >= 3, detail: `${matches}× ${searched}`, matches };
    case '3.4':
      matches = (text.match(/\b(weil|dass|aber|denn|obwohl|damit)\b/gi) || []).length;
      searched = 'Konjunktionen';
      return { ok: matches >= 3, detail: `${matches}× ${searched}`, matches };
    case '4.1':
      matches = (text.match(/\b\w+(auf|mit|herein|zurück|hinaus|hervor|an|ein|ab|hin|heraus|hinein|zusammen|her)\b/gi) || []).length;
      searched = 'trennbare Verbteile';
      return { ok: matches >= 3, detail: `${matches}× ${searched}`, matches };
    case '4.2':
      matches = (text.match(/\b(rief|fragte|flüsterte|antwortete|erklärte|murmelte|sagte|schrie|keuchte|stöhnte)\b/gi) || []).length;
      searched = 'Redebegleiter';
      return { ok: matches >= 3, detail: `${matches}× ${searched}`, matches };
    case '4.3':
      matches = (text.match(/,\s*(der|die|das|den|dem|welcher|welche|welches)\s/gi) || []).length;
      searched = 'Relativsätze';
      return { ok: matches >= 3, detail: `${matches}× ${searched}`, matches };
    case '4.4':
      matches = (text.match(/\b(\w+er als|\w+ste[rns]?\b|am \w+sten|wie ein)/gi) || []).length;
      searched = 'Komparativ/Superlativ/Vergleiche';
      return { ok: matches >= 3, detail: `${matches}× ${searched}`, matches };
    case '5.1':
      matches = (text.match(/\b(flüster|murmelt|rief|brüllt|keuch|seufz|schlender|eil|hast|schlich|stapf|taumel|spähte|lugten|schmunzel)/gi) || []).length;
      searched = 'präzise Verben';
      return { ok: matches >= 3, detail: `${matches}× ${searched}`, matches };
    case '5.2':
      // Check for explained Redewendungen
      const redewendungen = (text.match(/(das bedeutet|das heißt|das hieß|damit meinte|das bedeutete|wörtlich)/gi) || []).length;
      searched = 'erklärte Redewendungen';
      return { ok: redewendungen >= 2, detail: `${redewendungen}× ${searched}`, matches: redewendungen };
    case '5.3':
      matches = (text.match(/\b(mut|angst|stolz|scham|vertrauen|furcht|zweifel|hoffnung|erleichterung|mitgefühl|einsamkeit|verzweiflung|dankbarkeit|wut|frustration|entschlossenheit|freude|traurigkeit)\b/gi) || []).length;
      searched = 'Gefühls-/Abstrakta-Wörter';
      return { ok: matches >= 3, detail: `${matches}× ${searched}`, matches };
    case '5.4':
      matches = (text.match(/\bwird\b|\bwurde\b|\bwerden\b|\bworden\b|\bwurden\b/gi) || []).length;
      searched = 'Passiv-Formen';
      return { ok: matches >= 5, detail: `${matches}× ${searched}`, matches };
    default:
      return { ok: true, detail: 'Kein spezifischer Check', matches: -1 };
  }
}

function checkPersona(story) {
  const rules = PERSONA_RULES[story.persona];
  if (!rules) return { issues: [], positives: [] };

  const text = story.text;
  const issues = [];
  const positives = [];

  // NoGo-Checks
  if (rules.noGos.includes('passiv')) {
    const passivCount = (text.match(/\bwird\b|\bwurde\b|\bwerden\b|\bwurden\b/gi) || []).length;
    if (passivCount > 2 && story.stufe !== '5.4') {
      issues.push(`Passiv gefunden (${passivCount}×) — NoGo für ${rules.name}`);
    }
  }

  if (rules.noGos.includes('komposita')) {
    const komposita = (text.match(/[A-ZÄÖÜ]\w{3,}[a-zäöüß][A-ZÄÖÜ]\w+/g) || []);
    if (komposita.length > 0 && story.stufe !== '5.4') {
      issues.push(`Komposita gefunden: ${komposita.slice(0,3).join(', ')} — NoGo für ${rules.name}`);
    }
  }

  if (rules.noGos.includes('genitiv')) {
    const genitivs = (text.match(/\b(des|der)\s+\w+(?:es|s)\b/gi) || []);
    // Filter false positives
    if (genitivs.length > 2) {
      issues.push(`Mögliche Genitiv-Konstruktionen (${genitivs.length}×) — NoGo für ${rules.name}`);
    }
  }

  if (rules.noGos.includes('langsamer_einstieg')) {
    const firstSentence = text.split(/[.!?]/)[0] || '';
    const hasAction = /\b(sprang|rannte|rief|schrie|griff|schlug|stürzte|schnappte|klaute|stand|saß)\b/i.test(firstSentence);
    if (!hasAction && firstSentence.length > 10) {
      issues.push(`Erster Satz ohne Action-Verb — Zara braucht sofortigen Einstieg`);
    }
  }

  // Positive Checks
  if (rules.checks.includes('ich_perspektive')) {
    const ichCount = (text.match(/\bich\b/gi) || []).length;
    if (ichCount >= 3) positives.push(`Ich-Perspektive: ${ichCount}× "ich"`);
    else issues.push(`Wenig Ich-Perspektive (${ichCount}×) — Jonas braucht Ich-Erzähler`);
  }

  if (rules.checks.includes('du_perspektive')) {
    const duCount = (text.match(/\bdu\b|\bdein\b|\bdir\b|\bdich\b/gi) || []).length;
    if (duCount >= 2) positives.push(`Du-Perspektive: ${duCount}× du/dein/dir`);
    else issues.push(`Wenig Du-Ansprache (${duCount}×) — Samira braucht Du-Perspektive`);
  }

  if (rules.checks.includes('gefuehle_explizit')) {
    const explicit = (text.match(/(war\s+\w+,\s*weil|bedeutet:|das bedeutet|fühlte\s+\w+,\s*weil)/gi) || []).length;
    if (explicit >= 1) positives.push(`Explizite Gefühle+Begründung: ${explicit}×`);
  }

  if (rules.checks.includes('woerter_erklaert')) {
    const erklaert = (text.match(/(bedeutet:|das bedeutet|das heißt|das ist ein|— ein|— das)/gi) || []).length;
    if (erklaert >= 1) positives.push(`Wörter erklärt: ${erklaert}×`);
  }

  if (rules.checks.includes('denglisch')) {
    const denglisch = (text.match(/\b(literally|random|cringe|safe|nice|lost|gamechanger|grind|NPC|Plot Twist|Spoiler|Level|Respawn|Voice-Chat)\b/gi) || []).length;
    if (denglisch >= 2) positives.push(`Denglisch/Internet-Slang: ${denglisch}×`);
    else if (denglisch === 0) issues.push(`Kein Denglisch — Holzi braucht Internet-Slang`);
  }

  if (rules.checks.includes('gamer_sprache')) {
    const gamer = (text.match(/\b(Quest|Boss|Endgegner|Noob|Easter Egg|Tutorial|Lag|Blue Screen|Disconnect|Power-Up|Miniboss)\b/gi) || []).length;
    if (gamer >= 1) positives.push(`Gamer-Sprache: ${gamer}×`);
  }

  if (rules.checks.includes('fragen_an_leser')) {
    const fragen = (text.match(/(hast du|kennst du|weißt du|stell dir vor|halt mal|hast du das gewusst)/gi) || []).length;
    if (fragen >= 1) positives.push(`Leser-Interaktion: ${fragen}×`);
  }

  if (rules.checks.includes('sinne')) {
    const sinne = (text.match(/\b(roch|duftete|riechen|schmeckte|klang|hörte|leuchtete|schimmerte|glitzerte|fühlte sich|spürte|warm|kalt|weich|rau|laut|leise|still|dunkel|hell)\b/gi) || []).length;
    if (sinne >= 4) positives.push(`Sinneseindrücke: ${sinne}×`);
  }

  if (rules.checks.includes('kurze_saetze')) {
    const avg = avgWordsPerSentence(text);
    if (avg <= 10) positives.push(`Kurze Sätze: Ø ${avg} W./Satz`);
    else if (avg > 14) issues.push(`Zu lange Sätze: Ø ${avg} W./Satz — Timo braucht 5-10`);
  }

  if (rules.checks.includes('kurze_absaetze')) {
    const paragraphs = text.split(/\n\n|\n/).filter(p => p.trim().length > 0);
    const avgSentsPerPara = paragraphs.length > 0 ? getSentences(text).length / paragraphs.length : 0;
    if (avgSentsPerPara <= 2.5) positives.push(`Kurze Absätze: Ø ${Math.round(avgSentsPerPara*10)/10} Sätze/Absatz`);
  }

  return { issues, positives };
}

// === HAUPTANALYSE ===
const report = {
  total: STORIES.length,
  wortanzahl: { ok: 0, fail: 0, details: [] },
  tempus: { ok: 0, fail: 0, details: [] },
  fokus: { ok: 0, fail: 0, details: [] },
  persona: { issues: 0, positives: 0, details: [] },
  byPersona: {},
  byThema: {},
  byStufe: {},
};

STORIES.forEach(s => {
  // Wortanzahl
  const wc = checkWortanzahl(s);
  if (wc.ok) report.wortanzahl.ok++;
  else {
    report.wortanzahl.fail++;
    report.wortanzahl.details.push({ id: s.id, ...wc });
  }

  // Tempus
  const tp = checkTempus(s);
  if (tp.ok) report.tempus.ok++;
  else {
    report.tempus.fail++;
    report.tempus.details.push({ id: s.id, ...tp });
  }

  // Fokus
  const fk = checkFokus(s);
  if (fk.ok) report.fokus.ok++;
  else {
    report.fokus.fail++;
    report.fokus.details.push({ id: s.id, stufe: s.stufe, ...fk });
  }

  // Persona
  const pa = checkPersona(s);
  pa.issues.forEach(i => {
    report.persona.issues++;
    report.persona.details.push({ id: s.id, type: 'issue', msg: i });
  });
  report.persona.positives += pa.positives.length;

  // Aggregate by persona
  if (!report.byPersona[s.persona]) report.byPersona[s.persona] = { total:0, wcOk:0, tempusOk:0, fokusOk:0, issues:0, positives:0 };
  report.byPersona[s.persona].total++;
  if (wc.ok) report.byPersona[s.persona].wcOk++;
  if (tp.ok) report.byPersona[s.persona].tempusOk++;
  if (fk.ok) report.byPersona[s.persona].fokusOk++;
  report.byPersona[s.persona].issues += pa.issues.length;
  report.byPersona[s.persona].positives += pa.positives.length;
});

// === OUTPUT ===
console.log('╔══════════════════════════════════════════════════╗');
console.log('║   LESEKUMPEL QA-ANALYSE — 205 Stories            ║');
console.log('╚══════════════════════════════════════════════════╝\n');

console.log('━━━ 1. WORTANZAHL ━━━');
console.log(`  ✓ OK: ${report.wortanzahl.ok}/${report.total} (${Math.round(report.wortanzahl.ok/report.total*100)}%)`);
console.log(`  ✗ Abweichung: ${report.wortanzahl.fail}`);
if (report.wortanzahl.details.length > 0) {
  console.log('  Probleme:');
  report.wortanzahl.details.forEach(d => console.log(`    ${d.id}: ${d.detail}`));
}

console.log('\n━━━ 2. TEMPUS ━━━');
console.log(`  ✓ OK: ${report.tempus.ok}/${report.total} (${Math.round(report.tempus.ok/report.total*100)}%)`);
console.log(`  ✗ Abweichung: ${report.tempus.fail}`);
if (report.tempus.details.length > 0) {
  console.log('  Probleme (Top 10):');
  report.tempus.details.slice(0, 10).forEach(d => console.log(`    ${d.id}: ${d.detail}`));
}

console.log('\n━━━ 3. FOKUS (Linguistischer Schwerpunkt) ━━━');
console.log(`  ✓ OK: ${report.fokus.ok}/${report.total} (${Math.round(report.fokus.ok/report.total*100)}%)`);
console.log(`  ✗ Abweichung: ${report.fokus.fail}`);
if (report.fokus.details.length > 0) {
  console.log('  Probleme:');
  report.fokus.details.forEach(d => console.log(`    ${d.id} (${d.stufe}): ${d.detail}`));
}

console.log('\n━━━ 4. AUTOREN-AUTHENTIZITÄT ━━━');
console.log(`  Persona-Marker erkannt: ${report.persona.positives}`);
console.log(`  Persona-Verstöße: ${report.persona.issues}`);
if (report.persona.details.length > 0) {
  console.log('  Verstöße:');
  report.persona.details.forEach(d => console.log(`    ${d.id}: ${d.msg}`));
}

console.log('\n━━━ 5. ÜBERSICHT PRO PERSONA ━━━');
console.log('  Persona          | Stories | WC-OK | Tempus | Fokus | Auth+ | Auth-');
console.log('  -----------------|---------|-------|--------|-------|-------|------');
Object.entries(report.byPersona).sort().forEach(([p, d]) => {
  const name = (PERSONA_RULES[p]?.name || p).padEnd(17);
  console.log(`  ${name}| ${String(d.total).padStart(4)}    | ${String(d.wcOk).padStart(3)}/  | ${String(d.tempusOk).padStart(4)}/  | ${String(d.fokusOk).padStart(3)}/  | ${String(d.positives).padStart(4)}  | ${String(d.issues).padStart(3)}`);
});

// Gesamtnote
const totalChecks = report.total * 3; // wc + tempus + fokus
const totalOk = report.wortanzahl.ok + report.tempus.ok + report.fokus.ok;
const pct = Math.round(totalOk / totalChecks * 100);
console.log(`\n━━━ GESAMTERGEBNIS ━━━`);
console.log(`  ${totalOk}/${totalChecks} Checks bestanden (${pct}%)`);
console.log(`  Persona-Verstöße: ${report.persona.issues}`);
console.log(`  Note: ${pct >= 90 ? 'SEHR GUT' : pct >= 75 ? 'GUT' : pct >= 60 ? 'BEFRIEDIGEND' : 'NACHARBEIT NÖTIG'}`);
