# Geschäftsplan Lesekumpel — Annahmen-Dokumentation

**Stand:** Mai 2026 · **Sheet-Version:** v1.0 · **Anlass:** INSPIRED-Wettbewerb MV 2026

Dieses Dokument erläutert die Annahmen hinter `geschaeftsplan-lesekumpel.xlsx`. Die Excel-Datei selbst ist mit `build-geschaeftsplan.py` reproduzierbar.

---

## 1. Geschäftsmodell

**Lesekumpel** — neuroinklusive Lese-Bibliothek für Kinder 5–10 Jahre mit Fokus auf LRS, ADHS und Autismus.

Drei Einnahmestreams:
- **Familienpaket** 4,99 €/Monat · 15 Story-Credits · bis zu 4 Kinderkonten
- **Pro-Account** 14,99 €/Monat · 45 Credits · bis zu 30 Kinderkonten · für Lehrer:innen
- **Kaffeekasse** 1 €/2 Credits On-Demand · ohne Abo · „Spende mit Gegenleistung"

Zusätzlich: Förderprogramme (Aktion Mensch, DATIpilot) als Wachstumshebel.

---

## 2. Wachstumsannahmen (konservativ)

| Stream | Avg J1 | Avg J2 | Avg J3 | Avg J4+ |
|---|---|---|---|---|
| Premium-Abos | 50 | 300 | 1.000 | 1.700 |
| Pro-Accounts | 1 | 5 | 20 | 30 |
| Kaffeekassen/Monat | 3 | 15 | 50 | 80 |
| Free-Nutzer (Faktor) | 10× Premium | 10× | 10× | 10× |

**Premium-Wachstum** linear interpoliert: Monat 1: 0 · Monat 12: 100 · Monat 24: 500 · Monat 36: 1.700.

**Stories pro Nutzer/Monat:**
- Premium: 10 (Cap 15 — Worst-Case Cap voll genutzt nur bei Power-Usern)
- Free: 3 (Cap 5)

**Begründung der Schwellen:**
- 100 Premium nach 12 Monaten = realistische Validierungs-Phase (Bootstrap mit Lehrer-Multiplikator + SEO via User-Stories)
- 500 Premium nach 24 Monaten = organisches Wachstum durch Community-Led Growth
- 1.700 Premium nach 36 Monaten = Schwelle der Selbsttragfähigkeit (1.700 × 4,99 € ≈ 8.500 € = Skalierungs-Fixkosten)

---

## 3. Preismodell & Marge

### Familienpaket — Worst-Case-Mathematik
- Preis: 4,99 €/Monat
- Variable Kosten: 15 Stories × 0,12 € + 0,10 € Backend + 0,90 € Free-Anteil (1:9-Kohorte) + 0,32 € Stripe = **3,12 €**
- **Deckungsbeitrag: 1,87 €/Premium** · Marge ~37,5 %

### Pro-Account
- Preis: 14,99 €/Monat
- Variable Kosten: 45 × 0,12 € + 0,46 € Stripe + 3,00 € Subaccounts = **8,86 €**
- **Deckungsbeitrag: 6,13 €/Pro** · Marge ~41 %

### Kaffeekasse
- Preis: 1,00 €
- Variable Kosten: 2 × 0,12 € + 0,26 € Stripe = **0,50 €**
- **Deckungsbeitrag: 0,50 €/Kauf** · Marge 50 %

### Phase-2-Hebel
Ab Jahr 3: Modell-Wechsel auf Gemini Flash + Imagen 2 senkt Story-Kosten von 0,12 € auf **0,07 €**. Hebt Marge auf ~52 % Worst-Case. Im Sheet ab Jahr 3 angesetzt.

---

## 4. Investitionen (einmalig, Monat 1–3)

| Posten | Wert | Abschreibung | AfA/Jahr |
|---|---|---|---|
| 2× MacBooks | 4.000 € | 3 Jahre | 1.333 € |
| Monitore/Peripherie | 1.000 € | 5 Jahre | 200 € |
| Markenanmeldung DPMA | 290 € | 10 Jahre | 29 € |
| Domain/Setup | 200 € | sofort | – |
| Templates (eRecht24) | 500 € | sofort | – |
| **Summe** | **5.990 €** | | **~1.562 €/J** |

Finanzierung: Eigenmittel (Bootstrap, 3.000 € Start-Puffer plus laufende Privateinlagen Phase 1).

---

## 5. Finanzierung Phase 3 — Mikromezzaninfonds II

**Bewusste Wahl gegen klassischen Bankkredit:**

| Aspekt | Bankkredit (verworfen) | **Mikromezzanin (gewählt)** |
|---|---|---|
| Kapital | 30.000 € | **50.000 €** |
| Zins | 5 % p.a. | 8 % p.a. fix |
| Laufzeit | 5 Jahre | **10 Jahre** |
| Tilgung | Annuität 566 €/Mon | **endfällig in Jahr 10** |
| Sicherheiten | nötig | **keine** |
| Stimmrechte | – | keine (stille Beteiligung) |
| Verwässerung | – | keine |
| Monatslast (Cashflow) | 566 € | **333 € (nur Zins)** |

### Mikromezzanin-Konditionen
- Programm: **Mikromezzaninfonds II Deutschland** (Bundesförderung)
- Antragsstelle: **MBG MV (Mittelständische Beteiligungsgesellschaft Mecklenburg-Vorpommern)**
- Variante: Erweiterte Variante (bis 150 k) — qualifiziert wegen:
  - Inklusionsorientierung (Neuroinklusion by design)
  - Strukturschwache Region (MV)
- Auszahlung: einmalig in Monat 25 (Phase-3-Start) = 50.000 €
- Zinsphase: Monat 26–143 → 333,33 €/Monat (50.000 × 8 % / 12) konstant
- Tilgungsphase: Monat 144 → einmalige Rückzahlung 50.000 €
- Gesamtkosten 10 Jahre: 39.999 € Zinsen + 50.000 € Rückzahlung = **89.999 €**

### Verwendung der 50 k €
- Marketing-Push (Merch, Messen, Discord-Community): ~15.000 €
- Erste Junior-Anstellung (Q3-Q4 J3 → 6 Monate brutto): ~18.000 €
- Liquiditätspuffer Jahr 3–4: ~17.000 €

---

## 6. Personal

| Jahr | Annahme |
|---|---|
| 1–2 | 3 Gründer:innen, Eigenleistung (Entnahme 0 €) |
| 3 | Teilzeit-Entnahme 3 × 1.000 € = 3.000 €/Monat (36.000 €/J) |
| 3 Q3+ | 1 Junior-Mitarbeiter:in 3.000 €/Mon. brutto inkl. AG-Anteil (≈ 2.300 € netto) → 9.000 € im J3 (3 Monate) |
| 4+ | Skalierung mit Userzahl (außerhalb 3-Jahres-Plan) |

**Begründung:** Bootstrap-Strategie aus [project_finanzierungs_phasen]. Vollzeit-Entnahme erst ab F8-Schwelle 8.000 Premium = realistisch ab Jahr 5–6.

---

## 7. Laufende Kosten

### Token + Bildgenerierung
| Jahr | Avg Premium | Stories Premium | Stories Free | Cost/Story | Token-Kost |
|---|---|---|---|---|---|
| 1 | 50 | 6.000 | 1.800 | 0,12 € | ~720 € |
| 2 | 300 | 36.000 | 10.800 | 0,12 € | ~9.000 € *(weniger als rechnerisch, weil Q1-Q2 noch niedriger)* |
| 3 | 1.000 | 120.000 | 36.000 | 0,07 € *(Hebel)* | ~22.000 € |

### Stripe-Gebühren
1,4 % vom Umsatz + 0,25 €/Transaktion. Bei steigendem Volumen anteilig höher.

### Hosting/Backend
- J1: 25 €/Mon (Free-Tier + Cloudfront)
- J2: 75 €/Mon (Supabase + n8n + Domains)
- J3: 400 €/Mon (Skalierung, Recommendation-Engine-Embeddings)

### Recht/Buchhaltung/Versicherung
- J1: 20 €/Mon (DPMA-Marke verteilt + Privatversicherung)
- J2: 145 €/Mon (GbR-Gründung-Anteil + Cyber + Berufshaftpflicht)
- J3: 500 €/Mon (Anwalt-AGB/DSGVO einmalig + Steuerberater + Buchhaltung + Versicherungen)

### Dev-Tools
- Claude Max (Cursor, Claude Code): ~50 €/Mon
- Canva Pro, Figma: ~30 €/Mon
- Sonstige Subscriptions: ~30 €/Mon
- Skaliert leicht J1 → J3 (100 → 150 €)

### Marketing/Merch
- J1: 10 €/Mon (Aufkleber, Visitenkarten)
- J2: 100 €/Mon (Discord-Community, ggf. Messe-Stand klein)
- J3: 500 €/Mon (Mit Mikromezzanin-Push: Merch, Messen, Verbands-Mitgliedschaften)

### Sonstige (kleiner)
- Strom/Internet (anteilig Homeoffice): 50 €/Mon J3
- Porto/Telekom: 20 €/Mon
- Reisekosten (Messen, Hochschul-Termine): 100 €/Mon J3

---

## 8. MwSt-Behandlung

**Bildungsmedien:** 7 % MwSt (statt 19 %) — siehe [reference_bildungsmedien_mwst].

Im Sheet vereinfacht:
- Alle Einnahmen sind **netto** dargestellt
- MwSt-Anteil wird in separater Zeile ausgewiesen (zur Information für Bankgespräche)
- 4,99 € brutto = 4,66 € netto + 0,33 € MwSt

Für GbR/Kleinunternehmer-Regelung (Phase 1–2):
- Optional: § 19 UStG-Befreiung bis 22.000 €/J Vorjahresumsatz
- Empfohlen erst ab Phase 2 zu prüfen — ggf. Vorsteuerabzug bei Investitionen sinnvoller

---

## 9. Erwartete Bilanz

### Kumulierte Liquidität
- Ende Jahr 1: ~−2.800 € (Eigenmittel-Defizit aus 3.000 € Startpuffer)
- Ende Jahr 2: ~+760 € (knapp positiv)
- Ende Jahr 3 mit Mikromezzanin 50k: ~+25.000 € (Auszahlung minus Verlust)
- Ende Jahr 10 (Mikromezzanin-Rückzahlung): erfordert ausreichende Reserve aus J4-J10 Cashflow

### Kumulierte Rentabilität
- Ende Jahr 1: ~−1.130 €
- Ende Jahr 2: ~+2.430 € (Eigenleistung trägt, GuV knapp positiv)
- Ende Jahr 3: ~−19.300 € (Personal-Investment, Marketing-Push, Anlauf-Verluste)
- Ende Jahr 4+: positiv bei 1.700+ Premium konstant

---

## 10. Konsistenz mit Pitch-Folien

Alle Annahmen sind konsistent mit:
- `Pitch/finanzierungs-praesentation.html` (F1 Essenz, F5 Kosten, F7 Break-Even, F8 Schwellen)
- `Pitch/06-finanzierungs-folien.md`
- `Pitch/03-pitch-deck.md` Slide 8

Kennzahlen-Sync:
- Familienpaket 4,99 € · 15 Credits · 4 Kinderkonten ✓
- Variable Kosten Premium 3,12 € (Worst-Case) ✓
- Break-Even bei 189 Premium (mit Stream-Mix) ✓
- Skalierungs-Phase: 1.700 Premium = 8.500 €/Mon Umsatz = 8.500 €/Mon Kosten ✓

---

## 11. Quellen & Referenzen

- [project_finanzierungs_phasen.md](../../C:/Users/raikl/.claude/projects/c--Users-raikl-Dev-lesekumpel/memory/project_finanzierungs_phasen.md) — 3-Phasen-Strategie
- [project_foerderprogramme.md](../../C:/Users/raikl/.claude/projects/c--Users-raikl-Dev-lesekumpel/memory/project_foerderprogramme.md) — Mikromezzanin Top-3
- [reference_bildungsmedien_mwst.md](../../C:/Users/raikl/.claude/projects/c--Users-raikl-Dev-lesekumpel/memory/reference_bildungsmedien_mwst.md) — 7 % MwSt
- Mikromezzaninfonds II: https://www.mikromezzaninfonds-deutschland.de
- MBG MV: https://www.mbg-mv.de

---

## 12. Aktualisierungs-Hinweise

Wenn sich Annahmen ändern (z.B. Preis, Wachstum, Hebel):
1. Diese `geschaeftsplan-annahmen.md` aktualisieren
2. Konstanten oben in `build-geschaeftsplan.py` anpassen
3. `python build-geschaeftsplan.py` neu ausführen
4. Commit mit Hinweis auf veränderte Annahmen
