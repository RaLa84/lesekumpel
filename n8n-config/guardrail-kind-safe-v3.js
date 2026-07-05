// Knoten: "Guardrail: Kind-Safe + Matrix" — v3 (2026-07-05)
// v2 + Validierung des optionalen Felds "Hauptfigur" (Avatar als Hauptfigur).
// Läuft DIREKT nach dem Webhook (vor "Respond: Accepted"), damit ungültige
// Requests eine 400-Antwort bekommen statt "Accepted". Wirft deshalb NICHT,
// sondern setzt guardError — der IF-Knoten "Eingabe gültig?" routet danach.
const wh = $input.item.json;
const input = wh.body || wh;

const title = (input['Titel'] || '').trim();
const description = (input['Kurzbeschreibung'] || '').trim();
const personaRaw = (input['Persona'] || 'Peter Past').trim();
const persona = personaRaw.split(' ')[0].toLowerCase();

let guardError = null;

// Content-Safety: Wortgrenzen statt Substring (Substring blockierte z. B. "Waffel" wegen "waffe")
const BLOCKED = ['gewalt', 'waffe', 'waffen', 'sex', 'drogen', 'sterben', 'stirbt', 'töten', 'tötet', 'mord'];
const blockHit = s => BLOCKED.find(w => new RegExp('(^|[^a-zäöüß])' + w + '($|[^a-zäöüß])').test(String(s).toLowerCase()));
const hit = blockHit(title + ' ' + description);
if (hit) guardError = `Inhalt nicht kindgerecht: "${hit}" gefunden`;

// Persona existiert? (gleiche Normalisierung wie in "Daten vorbereiten")
const VALID_PERSONAS = ['pip', 'mia', 'peter', 'stella', 'finja', 'samira', 'holzi', 'deniz', 'jonas'];
if (!guardError && !VALID_PERSONAS.includes(persona)) {
  guardError = `Unbekannte Persona: "${personaRaw}". Gültig: ${VALID_PERSONAS.join(', ')}`;
}

if (!guardError && !title) {
  guardError = 'Titel fehlt';
}

// Hauptfigur (Avatar) — optionales Feld: nur Safety + Format prüfen.
// Die Enum-Ids mappt "Daten vorbereiten" (unbekannte Ids fallen dort auf Defaults).
// Whitelist [a-z0-9-] auf allen Merkmal-Werten = Injection-Barriere;
// nur "name" ist Freitext und wird gegen die Blockliste + Länge geprüft.
const hf = input['Hauptfigur'];
if (!guardError && hf != null) {
  if (typeof hf !== 'object' || Array.isArray(hf)) {
    guardError = 'Hauptfigur: ungültiges Format';
  } else {
    const hfName = String(hf.name || '').trim();
    if (!hfName || hfName.length > 40) {
      guardError = 'Hauptfigur: Name fehlt oder ist zu lang (max. 40 Zeichen)';
    } else if (blockHit(hfName)) {
      guardError = 'Hauptfigur-Name nicht kindgerecht';
    } else if (!['mensch', 'tier', 'fantasie'].includes(hf.typ)) {
      guardError = `Hauptfigur: unbekannter Typ "${hf.typ}"`;
    } else if (Object.entries(hf.merkmale || {}).some(([k, v]) =>
        !/^[a-z-]{1,20}$/.test(k) || !/^[a-z0-9-]{1,20}$/.test(String(v)))) {
      guardError = 'Hauptfigur: ungültiges Merkmal';
    }
  }
}

return { json: { ...wh, guardError } };
