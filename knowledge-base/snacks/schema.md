# Knowledge Snacks — Format-Dokumentation

## Was sind Knowledge Snacks?

Kurze, in sich geschlossene Wissenshäppchen im Social-Media-Karten-Stil. Jeder Snack enthält genau einen Fakt, Tipp, eine Zahl, einen Mythos oder eine Begriffserklärung — maximal 80 Wörter Body-Text.

## Drei Formate — eine Quelle

| Format | Pfad | Zweck |
|--------|------|-------|
| **Markdown** | `snacks/md/{thema}/*.md` | Editierbare Quelldateien |
| **JSON** | `snacks/snacks.json` | Maschinenlesbar für RAG, App, API |
| **HTML** | `snacks/index.html` | Browsbare Übersichtsseite |

## YAML-Frontmatter Schema

```yaml
---
id: "lrs-001"                              # Eindeutige ID: {thema}-{nnn}
titel: "2-3 Kinder pro Klasse haben LRS"   # Kurzer, einprägsamer Titel (max. 60 Zeichen)
kategorie: "LRS / Legasthenie"             # Themenfeld
typ: "fakt"                                # fakt | tipp | zahl | mythos | glossar
zielgruppe: ["Eltern", "Lehrkräfte"]       # Wer profitiert von diesem Snack?
tags: ["prävalenz", "grundschule"]         # 2-5 Schlagwörter für Suche/Filter
quelle: "Schulte-Körne & Galuschka (2016)" # Kurzreferenz
quelle_detail: "DOI: 10.3238/arztebl..."   # Vollständige Quellenangabe
evidenzgrad: "Kohortenstudie"              # Aus der Evidenzpyramide
schwierigkeitsgrad: "einfach"              # einfach | mittel | fachlich
herkunft_chunk: "themen/lrs-legasthenie.md#definition" # Quelldatei-Referenz
---
```

## Pflichtfelder

| Feld | Pflicht | Beschreibung |
|------|---------|-------------|
| id | Ja | Eindeutig, Format `{thema}-{nnn}` |
| titel | Ja | Max. 60 Zeichen, einprägsam |
| kategorie | Ja | Themenfeld |
| typ | Ja | Einer von: fakt, tipp, zahl, mythos, glossar |
| zielgruppe | Ja | Array: Eltern, Lehrkräfte, Therapeuten |
| tags | Ja | 2-5 Schlagwörter |
| quelle | Ja | Kurzreferenz (Autor, Jahr) |
| quelle_detail | Ja | DOI/ISBN/URL |
| evidenzgrad | Ja | Aus der Evidenzpyramide |
| schwierigkeitsgrad | Ja | einfach, mittel, fachlich |
| herkunft_chunk | Ja | Pfad zur Quelldatei |

## Snack-Typen

| Typ | Farbcode | Beschreibung |
|-----|----------|-------------|
| **fakt** | Blau | Forschungsergebnis, wissenschaftlicher Zusammenhang |
| **tipp** | Grün | Konkreter Handlungstipp für den Alltag |
| **zahl** | Gelb | Einprägsame Statistik oder Kennzahl |
| **mythos** | Rot | Verbreiteter Irrtum + Richtigstellung |
| **glossar** | Lila | Fachbegriff einfach erklärt |

## Schwierigkeitsgrade

| Grad | Zielgruppe | Sprache |
|------|-----------|---------|
| **einfach** | Eltern ohne Vorwissen | Alltagssprache, keine Fachbegriffe |
| **mittel** | Eltern mit Grundwissen, Lehrkräfte | Fachbegriffe werden erklärt |
| **fachlich** | Therapeuten, Sonderpädagogen | Fachsprache, Studiendetails |

## ID-Konvention

```
lrs-001 bis lrs-099
adhs-001 bis adhs-099
autismus-001 bis autismus-099
daz-001 bis daz-099
hoer-001 bis hoer-099
seh-001 bis seh-099
tipps-001 bis tipps-099
glossar-001 bis glossar-099
```

## Body-Text Regeln

- **Max. 80 Wörter** — ein Snack, ein Gedanke
- **In sich verständlich** — kein "wie oben erwähnt" oder "siehe auch"
- **Aktive Sprache** — "Kinder mit LRS haben..." statt "Es wurde festgestellt, dass..."
- **Bei Mythos-Typ:** Erst den Mythos nennen, dann die Richtigstellung
- **Bei Glossar-Typ:** Fachbegriff = einfache Erklärung + Beispiel
