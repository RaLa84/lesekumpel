# Dokumentformat-Schema

Alle Themen-Dokumente in `themen/` und `praxis/` folgen diesem Schema, um einheitliches RAG-Retrieval zu ermöglichen.

## YAML-Frontmatter

```yaml
---
thema: "LRS / Legasthenie"
zielgruppe: ["Eltern", "Lehrkräfte", "Therapeuten"]
altersgruppe: "5-10"
letzte_aktualisierung: "2026-03-15"
---
```

| Feld | Typ | Beschreibung |
|------|-----|-------------|
| `thema` | String | Themenfeld des Dokuments |
| `zielgruppe` | Array | Für wen: Eltern, Lehrkräfte, Therapeuten |
| `altersgruppe` | String | Altersgruppe der Kinder |
| `letzte_aktualisierung` | Date | Letztes Update (ISO 8601) |

## Fakten-Abschnitte

Jeder Fakt bildet einen eigenständigen Abschnitt (= 1 Chunk für RAG):

```markdown
## [Überschrift — kurz, prägnant]

[Inhalt — klar, verständlich, 100-500 Wörter. Für Eltern in einfacher Sprache,
für Fachpersonal mit Fachbegriffen (im Glossar erklärt).]

**Quelle:** Autor, V. (Jahr). *Titel.* Verlag/Journal. DOI/ISBN/URL
**Evidenzgrad:** Meta-Analyse | RCT | Kohortenstudie | Querschnittstudie | Expertenmeinung | Praxisbericht | Leitlinie
```

## Evidenzgrade (Hierarchie)

1. **Meta-Analyse** — Systematische Zusammenfassung mehrerer Studien
2. **RCT** — Randomisierte kontrollierte Studie
3. **Kohortenstudie** — Längsschnittstudie mit Vergleichsgruppe
4. **Querschnittstudie** — Momentaufnahme ohne Verlauf
5. **Leitlinie** — S3/S2k-Leitlinie (AWMF)
6. **Expertenmeinung** — Fachbuch, Übersichtsartikel
7. **Praxisbericht** — Erfahrung aus Therapie/Unterricht

## Quellenformat

Quellenangaben folgen einem vereinfachten APA-Stil:

```
Nachname, V. (Jahr). *Titel.* Verlag. ISBN XXX-X-XXXX-XXXX-X
Nachname, V. (Jahr). Artikeltitel. *Zeitschrift*, Band(Heft), Seiten. DOI: XX.XXXX/XXXXX
Institution (Jahr). *Titel.* URL (abgerufen am TT.MM.JJJJ)
```

## Chunking-Regeln für RAG

- **1 Abschnitt = 1 Chunk** (100-500 Wörter ideal)
- Jeder Chunk ist **in sich verständlich** (kein "siehe oben")
- **Metadata pro Chunk:** Thema, Zielgruppe, Evidenzgrad, Quelle
- Überschriften sind **deskriptiv** (nicht "Punkt 3", sondern "Wortschatz als Schlüssel zum Leseverständnis bei DaZ-Kindern")

## Dateinamenskonvention

- Kleinbuchstaben, Bindestriche statt Leerzeichen
- Themen: `{thema}-{unterthema}.md` (z.B. `lrs-legasthenie.md`)
- Praxis: `tipps-{zielgruppe}.md` (z.B. `tipps-eltern.md`)
