# Lesekumpel — Textqualität verbessern

## Was ist Lesekumpel?

Eine Lese-Lern-App für Kinder (5–10 Jahre) mit verschiedenen Neurotyp-Profilen. Ein n8n-Workflow generiert Geschichten über die Gemini Flash API. Der Workflow:

1. Webhook → empfängt Titel, Genre, Stufe (Schwierigkeitsgrad 1.0–5.4), Persona (Autor-Charakter), Bildstil
2. "Daten vorbereiten" (JS-Node) → baut aus Inputs einen `userPrompt`
3. Gemini Flash → generiert Text basierend auf Systemprompt (Persona) + User-Prompt (Regeln)
4. Switch → routet zu persona-spezifischen Gemini-Knoten mit eigenem Systemprompt
5. Guardrail → Prüfung

Es gibt 10 Personas, die zu verschiedenen Neurotypen gehören:
- **Neurotypisch:** Lea Lesestark, Deniz Traumfänger
- **ADHS:** Zara Zapp, Holzi Pixelkopf
- **Autismus-Spektrum:** Leo Klartext, Samira Wissensfreund
- **LRS/Legasthenie:** Timo Taktschritt
- **DaZ (Deutsch als Zweitsprache):** Mia Brücke, Jonas Entdecker

Jede Persona hat einen eigenen Stil (definiert im Systemprompt). Samira schreibt Sachtexte, alle anderen erzählen Geschichten.

---

## Problem: Die generierten Texte sind qualitativ nicht gut genug

Die Sprache klingt steril und unnatürlich. Die Persona-Stimme geht verloren. Das Modell produziert regelkonformen aber leblosen Text. Drei Ursachen:

### 1. Constraint Saturation — Zu viele gleichgewichtete Regeln

Der aktuelle User-Prompt enthält ~45 Zeilen mit 6 PFLICHT-Blöcken: Natürlichkeit, Kindermund-Test, Kindgerecht, Silbentrennung, Faktentreue, Satzqualität, Zeichensetzung. Alles ist PFLICHT, also ist nichts priorisiert. Das Modell optimiert auf Regelerfüllung statt auf Textqualität und produziert kurze, sterile Sätze die keine Regel verletzen.

### 2. Persona-Blindheit im User-Prompt

Die Persona wird im User-Prompt nicht erwähnt. Der Systemprompt definiert den Stil, aber der User-Prompt überschreibt ihn mit PFLICHT-Blöcken. Das Modell behandelt die Persona-Stimme als nachrangig.

### 3. Monolithische Regeln für alle Personas

Jede Persona bekommt identische Regeln. Samira (Sachtext) bekommt Dialog-Regeln ("Keine Anführungszeichen für wörtliche Rede"), obwohl sie keine Dialoge schreibt. Erzählende Personas bekommen Sachtext-Hinweise die irrelevant sind. Außerdem gibt es inkompatible Persona-Stufen-Kombinationen (Deniz + Sachtext-Stufe 5.4 ergibt keinen Sinn, Samira + Dialog-Stufe 4.2 auch nicht).

---

## Lösung: 5 Maßnahmen

### Maßnahme 1 — Prioritäts-Hierarchie statt Einheits-PFLICHT

Die Regeln in der "Daten vorbereiten"-Node in drei Stufen aufteilen:

- **Kern** (MUSS): Wortanzahl-Range, Tempus, Syntax-Komplexität — die harten Metriken der Lesestufe
- **Fokus** (SOLL): Das Lernziel der Stufe (z.B. "Konjunktionen einbauen") — gezielt aber natürlich
- **Leitlinie** (KANN): Satzqualität, Pronomen-Klarheit, Fakten-Treue — flexibel bei Stilkonflikten

Das `stufeData`-Objekt bekommt statt einem flachen `regeln`-String drei Felder: `kern` (Objekt mit woerter/tempus/syntax), `fokus` (String), `leitlinie` (String).

### Maßnahme 2 — Expliziter Persona-Vorrang im User-Prompt

Ein Block am Anfang des User-Prompts der dem Modell explizit sagt: "Du bist [Persona-Name]. Dein Stil aus dem Systemprompt hat Vorrang. Die folgenden Regeln sind Leitplanken, keine Schablone. Ein lebendiger Satz der 2 Wörter über der Metrik liegt ist besser als ein toter Satz der perfekt passt."

### Maßnahme 3 — Persona-Typ-Module statt monolithischer Regeln

Zwei Regelsets je nach Persona-Typ:

- **Erzählend** (Lea, Timo, Zara, Leo, Mia, Deniz, Jonas, Holzi): Dialog-Regeln, Kindermund-Test, Redebegleiter
- **Sachtext** (Samira): Präsens-Override, Du-Perspektive, keine fiktiven Protagonisten, bildhafte Vergleiche

Ein `personaTyp`-Mapping und ein `personaRegelModule`-Objekt. Der Prompt-Builder wählt das passende Modul. Negativ-Beispiele (VERBOTEN/SCHLECHT/FALSCH) raus aus dem User-Prompt, rein in die Systemprompts der jeweiligen Persona — dort sind sie Schulung, kein akutes Constraint.

### Maßnahme 4 — Kompatibilitätsmatrix Persona × Stufe

Eine Matrix die definiert, welche Stufen pro Persona verfügbar sind. Beispiele:
- Deniz (Traumreisen): Stufen 1.0–5.3 aber NICHT 5.4 (Sachtext)
- Samira (Sachtext): Alle Stufen, aber immer im Sachtext-Modus (Präsens-Override)
- Holzi (Gaming-Action): Stufen 2.1+ (Stufe 1.0 ist zu kurz für Action)

Bei ungültiger Kombination: Fallback auf nächste kompatible Stufe oder Fehlermeldung.

Zusätzlich Stufen-Overrides pro Persona-Typ möglich:
- Samira bekommt immer Präsens unabhängig von Stufen-Tempus
- Timo bekommt engere Silbenrhythmus-Regeln auf jeder Stufe

### Maßnahme 5 — Neurotyp-spezifische QA-Knoten

Nach jedem persona-spezifischen Gemini-Knoten im Switch einen QA-Knoten der neurotyp-spezifisch prüft:

- **Autismus-Spektrum (Leo, Samira):** Enthält der Text unmarkierte Metaphern oder Ironie? Sind Gefühle explizit benannt und begründet? Ist der Aufbau linear?
- **ADHS (Zara, Holzi):** Gibt es Absätze länger als 3 Sätze ohne Spannungselement? Ist das Tempo hoch genug? Gibt es Cliffhanger/Wendungen?
- **LRS (Timo):** Sind die Silbenstrukturen rhythmisch gleichmäßig? Ist der Text "klatschtauglich"?
- **DaZ (Mia, Jonas):** Werden schwierige Wörter im Kontext erklärt? Ist der Satzbau durchsichtig?
- **Neurotypisch (Lea, Deniz):** Standard-Qualitätsprüfung (Natürlichkeit, Vollständigkeit, Spannung)

---

## Prompt-Architektur nach Refactoring

Der User-Prompt wird vom Prompt-Builder in dieser Reihenfolge zusammengebaut:

```
1. Kreativ-Auftrag     — WAS (Titel, Genre, Beschreibung, Stufe)
2. Persona-Vorrang      — WER hat Priorität (Persona-Name, Stil-vor-Regel-Satz)
3. Kern-Regeln          — MUSS (Wortanzahl, Tempus, Syntax)
4. Fokus                — SOLL (Lernziel der Stufe)
5. Persona-Typ-Modul    — NUR RELEVANTE Regeln (Dialog ODER Sachtext)
6. Leitlinien           — KANN (flexibel bei Stilkonflikten)
7. Silbentrennung       — Technisch
8. Aufbau-Labels        — Output-Format
```

Das Signal ans Modell dreht sich von "Erfülle alles oder du machst Fehler" zu "Sei du selbst, halte den Rahmen ein."

---

## Betroffene Dateien

- **"Daten vorbereiten"-Node** im n8n-Workflow: stufeData-Struktur, personaTyp-Mapping, Kompatibilitätsmatrix, Prompt-Builder-Funktion
- **Systemprompts der Personas**: Negativ-Beispiele aus dem User-Prompt hierher verschieben, positive Stil-Anker (2–3 Beispielsätze pro Persona auf verschiedenen Stufen) ergänzen
- **Neue QA-Knoten**: Nach dem Switch je nach Neurotyp spezialisierte Prüfung
