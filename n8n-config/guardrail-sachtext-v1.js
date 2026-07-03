// Knoten: "Guardrail: Kind-Safe + Matrix" — Sachtext-Workflow (Samira), v1
// Abgeleitet aus guardrail-kind-safe-v2.js: keine Persona-Validierung (Persona ist fix
// Samira). Ungültige Textlaenge ist KEIN Fehler — "Daten vorbereiten" fällt auf Mittel
// zurück. Läuft direkt nach dem Webhook (vor "Respond: Accepted"), damit ungültige
// Requests eine 400-Antwort bekommen. Wirft nicht, sondern setzt guardError.
const wh = $input.item.json;
const input = wh.body || wh;

const title = (input['Titel'] || '').trim();
const description = (input['Kurzbeschreibung'] || '').trim();

let guardError = null;

// Content-Safety: Wortgrenzen statt Substring (Substring blockierte z. B. "Waffel" wegen "waffe")
const BLOCKED = ['gewalt', 'waffe', 'waffen', 'sex', 'drogen', 'sterben', 'stirbt', 'töten', 'tötet', 'mord'];
const haystack = (title + ' ' + description).toLowerCase();
const hit = BLOCKED.find(w => new RegExp('(^|[^a-zäöüß])' + w + '($|[^a-zäöüß])').test(haystack));
if (hit) guardError = `Inhalt nicht kindgerecht: "${hit}" gefunden`;

if (!guardError && !title) {
  guardError = 'Titel fehlt';
}

return { json: { ...wh, guardError } };
