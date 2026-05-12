// Repo-Spiegel des n8n-Knotens "Linguistik parsen" (workflow eHfC95UaMbJMcLTb, node parse-linguistik).
// Parst den JSON-Output des Linguistik-Anreicherungs-LLMs in { wortschatz, tags }.
// Wortschatz-Panel im Story-HTML wird nur für Personas mit komplexerem Vokabular befüllt;
// für die Anfänger-Personas bleibt das Array leer → der Frontend-Tab versteckt sich.

const prev = $('Geschichte parsen').first().json;
const rawText = $input.item.json.text || '';

let wortschatz = [], tags = [];
try {
  const m = rawText.match(/\{[\s\S]*\}/);
  if (m) { const p = JSON.parse(m[0]); wortschatz = p.wortschatz || []; tags = p.tags || []; }
} catch(e) { tags = [prev.genre]; }

// Persona-Filter: nur diese Personas haben einen sichtbaren Wortsammlung-Tab in der Story
const personasMitWortschatz = ['finja', 'samira', 'holzi', 'deniz'];
if (!personasMitWortschatz.includes(prev.persona)) {
  wortschatz = [];
}

return { json: { ...prev, wortschatz, tags } };
