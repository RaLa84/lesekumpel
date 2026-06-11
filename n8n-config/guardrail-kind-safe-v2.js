// Knoten: "Guardrail: Kind-Safe + Matrix" — v2 (2026-06-11)
// Läuft jetzt DIREKT nach dem Webhook (vor "Respond: Accepted"), damit ungültige
// Requests eine 400-Antwort bekommen statt "Accepted". Wirft deshalb NICHT mehr,
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
const haystack = (title + ' ' + description).toLowerCase();
const hit = BLOCKED.find(w => new RegExp('(^|[^a-zäöüß])' + w + '($|[^a-zäöüß])').test(haystack));
if (hit) guardError = `Inhalt nicht kindgerecht: "${hit}" gefunden`;

// Persona existiert? (gleiche Normalisierung wie in "Daten vorbereiten")
const VALID_PERSONAS = ['pip', 'mia', 'peter', 'stella', 'finja', 'samira', 'holzi', 'deniz', 'jonas'];
if (!guardError && !VALID_PERSONAS.includes(persona)) {
  guardError = `Unbekannte Persona: "${personaRaw}". Gültig: ${VALID_PERSONAS.join(', ')}`;
}

if (!guardError && !title) {
  guardError = 'Titel fehlt';
}

return { json: { ...wh, guardError } };
