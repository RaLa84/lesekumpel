# Pitch/Finanzen — Lesekumpel Geschäftsplan

Vollwertiger 4-Tab-Geschäftsplan im deutschen HGB-Standard (Personal/Investitionen, Annuitätendarlehen-Tilgung, Liquiditätsplan, Rentabilitätsplan). Anlass: INSPIRED Ideenwettbewerb MV 2026 — die Jury (BWL-Professor an Hochschule) erwartet diese Sicht.

## Dateien

| Datei | Zweck |
|---|---|
| [`geschaeftsplan-lesekumpel.xlsx`](geschaeftsplan-lesekumpel.xlsx) | **Hauptdatei** — 5 Tabs (Übersicht + 4 Plan-Tabs) |
| [`geschaeftsplan-annahmen.md`](geschaeftsplan-annahmen.md) | Annahmen-Dokumentation (Wachstum, Preise, Investitionen, Mikromezzanin) |
| [`build-geschaeftsplan.py`](build-geschaeftsplan.py) | Python-Script zur Excel-Generierung (reproduzierbar) |
| `cost-per-story/` | Ältere Token-Kosten-Analyse (historisch, nicht mehr aktuell) |

## Sheet-Struktur

### Tab 1 — Übersicht
Kompakte Zusammenfassung: Geschäftsmodell, Pricing, Phasen, Break-Even, Sheet-Navigation.

### Tab 2 — Personal, Investitionen etc.
- Investitionen einmalig (5.990 €): MacBooks, Monitore, Marke DPMA, Domain, Templates
- Kalkulatorische Abschreibungen pro Anlagegut
- Einnahmen Jahr 1-3 (Premium, Pro, Kaffeekasse, Förderung)
- Ausgaben Jahr 1-3 (Token, Stripe, Hosting, Recht, Tools, Marketing, Personal, Zins)

### Tab 3 — Mikromezzanin
Tilgungsplan über 120 Monate (Monat 25-144).
- Kapital 50.000 € · 8 % p.a. fix · 10 Jahre endfällig
- Anbieter: **MBG MV** (Mittelständische Beteiligungsgesellschaft Mecklenburg-Vorpommern)
- Programm: Mikromezzaninfonds II Deutschland
- **Bewusste Wahl gegen Bankkredit:** keine Sicherheiten, stille Beteiligung (keine Stimmrechte), inklusions-orientiert

### Tab 4 — Liquiditätsplan (Cashflow)
- Monat 1-12 monatlich detailliert
- Jahr 2-10 als Jahressummen
- **Hier:** Tilgung sichtbar, Investitionen als Vollausgaben, AfA NICHT enthalten
- Liquidität laufend + kumuliert (inkl. 3.000 € Startkapital)

### Tab 5 — Rentabilitätsplan (GuV)
- Gleiche Periodenstruktur wie Liquiditätsplan
- **Hier:** AfA sichtbar, Zinsen sichtbar, Tilgung NICHT enthalten (Tilgung ist keine Aufwendung)
- Rentabilität laufend + kumuliert

## Öffnen

- **Microsoft Excel** (Win/Mac): Doppelklick auf `.xlsx`
- **Google Sheets**: Drive → Hochladen → öffnen mit Google Tabellen
- **LibreOffice Calc**: kompatibel, Format bleibt erhalten

## Neu generieren (bei Annahmen-Änderungen)

```bash
cd Pitch/Finanzen
python build-geschaeftsplan.py
```

Voraussetzung: `pip install openpyxl` (Python 3.9+).

Alle Annahmen sind als Konstanten am Anfang von [`build-geschaeftsplan.py`](build-geschaeftsplan.py) definiert. Änderungen dort → Script neu ausführen → committen.

## Konsistenz mit Pitch-Folien

Die Excel verwendet dieselben Annahmen wie die Pitch-Präsentation ([`../finanzierungs-praesentation.html`](../finanzierungs-praesentation.html)):

| Kennzahl | Wert |
|---|---|
| Familienpaket | 4,99 €/Monat · 15 Credits · 4 Kinderkonten |
| Variable Kosten Premium | 3,12 € (Worst-Case) |
| Break-Even | 189 Premium (mit Stream-Mix) |
| Skalierungs-Schwelle | 1.700 Premium = 8.500 €/Mon. Umsatz = 8.500 € Kosten |
| Mikromezzanin | 50.000 € · 8 % · 10 J endfällig |

Bei Diskrepanzen: Annahmen in [`geschaeftsplan-annahmen.md`](geschaeftsplan-annahmen.md) zentral pflegen und sowohl Excel als auch Pitch-Folien aktualisieren.
