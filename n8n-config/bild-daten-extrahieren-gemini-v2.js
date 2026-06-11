// Knoten: "Bild-Daten extrahieren (Gemini)" — v2 (2026-06-11)
// Parst die Gemini-multimodal-Response: extrahiert die base64-Bild-Daten aus
// candidates[0].content.parts[*].inlineData.data und setzt sie als $json.data.
// Wirft NICHT mehr bei fehlendem Bild — gibt data:'' zurück, der IF-Knoten
// "Bilddaten vorhanden?" überspringt dann den Upload (Story wird trotzdem committed).
const inputJson = $input.first().json;
const parts = inputJson?.candidates?.[0]?.content?.parts || [];
const imagePart = parts.find(p => p && p.inlineData && p.inlineData.data);
const data = imagePart ? imagePart.inlineData.data : '';
if (!imagePart) {
  console.warn('Bild-Daten extrahieren (Gemini): kein inlineData in der Response — Bild wird übersprungen');
}
return { json: { ...inputJson, data } };
