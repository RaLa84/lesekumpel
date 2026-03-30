# /redaktion — Autonome Story-Pipeline

Führe die komplette Redaktionspipeline für Lesekumpel aus. Die Pipeline hat 6 Stufen, die nacheinander ablaufen.

## Pipeline-Ablauf

### Stufe 1: Redakteur (Ideen)
Starte den `redakteur` Agent um neue Story-Ideen zu generieren:
- Scanne bestehende Stories in `demo-texte/` und `texte/` (Metadaten aus `<meta>` Tags)
- Lies `content/backlog.json` für bestehende Ideen
- Generiere 5-10 neue Ideen und füge sie zum Backlog hinzu
- Wenn das Backlog bereits genug unbearbeitete Ideen hat (>5 mit Status "neu"), überspringe diesen Schritt

### Stufe 2: Chefredakteur (Auftrag)
Starte den `chefredakteur` Agent:
- Analysiere Katalog-Lücken (welche Stufen/Personas/Genres fehlen?)
- Wähle 1 Idee aus dem Backlog (die mit dem größten Bedarf)
- Erstelle einen konkreten Auftrag in `content/auftraege.json`

### Stufe 3: Autor (Text)
Starte den `autor` Agent:
- Nimm den Auftrag mit höchster Priorität und Status "bereit"
- Lade die Persona-Regeln aus `prompts/{persona}.md`
- Lade die Stufen-Regeln aus `prompts/stufen-regeln.md`
- Schreibe die Geschichte mit Silbentrennung
- Speichere in `content/entwuerfe/{auftrag-id}.json`

### Stufe 4: Lektor (QA)
Starte den `lektor` Agent:
- Prüfe den Entwurf gegen alle Qualitätskriterien
- Bei Fehlern: Korrigiere und speichere als neue Version
- Bei fundamentalen Problemen: Ablehnung → zurück zu Stufe 3 (max 1 Retry)
- Erstelle QA-Bericht

### Stufe 5: Anreicherung
Starte den `anreicherung` Agent:
- Generiere Quiz (3 Fragen), Wortschatz (3-6 Einträge), Tags, Bildszenen
- Speichere alles in der Entwurf-Datei

### Stufe 6: Review-Nachricht
Zeige dem User das fertige Ergebnis zur Kontrolle:

```
📖 Neue Geschichte fertig zur Review

Titel: {titel}
Autor: {persona_name} | Stufe: {stufe} | Genre: {genre}

--- Geschichte ---
{vollständiger text}

--- Zusammenfassung ---
{zusammenfassung}

--- QA-Bericht ---
{qa_bericht}

--- Anreicherung ---
Quiz: {anzahl} Fragen
Wortschatz: {anzahl} Einträge
Bildszenen: {anzahl} Szenen beschrieben

👉 Möchtest du diese Geschichte veröffentlichen?
   Sage "ja" und ich triggere die n8n-Pipeline für Bilder + HTML + Publish.
   Sage "nein" oder gib Feedback für Korrekturen.
```

## Wichtige Regeln

1. **NIEMALS** den n8n-Workflow ohne explizite User-Freigabe triggern
2. **Jede Stufe** muss erfolgreich abschließen bevor die nächste startet
3. **Alle Dateien** werden in `content/` gespeichert (nicht in demo-texte oder texte)
4. **Fortschritt** wird in den JSON-Dateien über Status-Felder nachverfolgt
5. Bei Abbruch: Der aktuelle Stand bleibt in den Dateien erhalten und kann fortgesetzt werden

## Optionale Parameter

- `/redaktion ideen` — Nur Stufe 1 (neue Ideen generieren)
- `/redaktion auftrag` — Nur Stufe 2 (nächsten Auftrag erstellen)
- `/redaktion schreiben` — Stufen 3-5 (nächsten Auftrag schreiben + QA + Anreicherung)
- `/redaktion` — Alles (Stufen 1-6)
