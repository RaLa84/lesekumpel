# Knowledge Base: Lesenlernen bei Kindern mit besonderen Bedürfnissen

Strukturierte Wissensdatenbank für den Lesekumpel RAG-Chatbot.

## Ziel

Eltern und Lehrkräften/Therapeuten evidenzbasiertes Wissen zu Leseförderung bei Kindern mit besonderen Bedürfnissen zur Verfügung stellen — über einen KI-Chatbot, der auf dieser Knowledge Base per RAG (Retrieval-Augmented Generation) arbeitet.

## Grundsatz

**Kein Fakt ohne Quelle.** Jeder Absatz in den Themen-Dokumenten enthält eine `**Quelle:**`-Zeile mit vollständiger Referenz (Autor, Jahr, Titel, DOI/ISBN/URL).

## Themenfelder

| Thema | Datei | Beschreibung |
|-------|-------|-------------|
| LRS / Legasthenie | `themen/lrs-legasthenie.md` | Lese-Rechtschreib-Störung, Dyslexie |
| ADHS & Lesen | `themen/adhs-lesen.md` | Aufmerksamkeitsdefizit, Komorbidität mit LRS |
| Autismus & Lesen | `themen/autismus-lesen.md` | Leseverständnis, Hyperlexie |
| DaZ & Lesen | `themen/daz-lesen.md` | Deutsch als Zweitsprache, Wortschatz |
| Hörbehinderung | `themen/hoerbehinderung-lesen.md` | Gehörlose/schwerhörige Kinder |
| Sehbehinderung | `themen/sehbehinderung-lesen.md` | Blinde/sehbehinderte Kinder, Braille |

## Verzeichnisstruktur

```
knowledge-base/
├── quellen/
│   ├── experten.md              # Kuratierte Expertenliste (Stand: 2026-03-15)
│   └── quellenregister.md       # Alle Quellen mit DOI/ISBN/URL
├── themen/                      # Fakten + Quellenverweise pro Thema
├── praxis/                      # Praxistipps für Eltern und Lehrkräfte
├── meta/
│   ├── glossar.md               # Fachbegriffe erklärt
│   └── schema.md                # Datenformat-Dokumentation
└── README.md                    # Diese Datei
```

## Dokumentformat

Siehe `meta/schema.md` für das vollständige Format. Kurzfassung:

- YAML-Frontmatter mit Thema, Zielgruppe, Altersgruppe, Datum
- Jeder Fakt ist ein eigenständiger Abschnitt (chunk-freundlich für RAG)
- Jeder Abschnitt endet mit `**Quelle:**` und `**Evidenzgrad:**`

## Zielgruppen des Chatbots

- **Eltern** — alltagstaugliche Tipps in einfacher Sprache
- **Lehrkräfte & Therapeuten** — evidenzbasierte Methoden und Förderkonzepte

## Status

- [x] Verzeichnisstruktur angelegt
- [x] Expertenliste mit 40+ Einträgen recherchiert und dokumentiert
- [ ] Quellenregister befüllen
- [ ] Themen-Dokumente befüllen (LRS als Pilot)
- [ ] Praxistipps erstellen
- [ ] Glossar erstellen
- [ ] RAG-Pipeline aufsetzen
