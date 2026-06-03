# Geschäftsplan Lesekumpel — Annahmen-Dokumentation

**Stand:** Mai 2026 · **Sheet-Version:** v3.0 · **Anlass:** INSPIRED-Wettbewerb MV 2026

Dieses Dokument erläutert die Annahmen hinter der Pitch-Präsentation `Pitch/finanzierungs-pitch-v2.html`. Quelle der Wahrheit für die Zahlen: dieses Dokument + Memory `project_finanzierungs_phasen.md`.

**Was sich gegenüber v2 geändert hat (Schwachstellen-Fixes):**
- **Liquidität J3:** Hardware-Vollausstattung 24 k von M1 auf M3 verschoben (nach KfW) + Mikrokredit-Aufstockung 25 k → 30 k → Liquidität durchgehend positiv
- **MwSt 7 % Bildungsmedien:** Listenpreise sind Brutto, Umsatzwerte = Netto (explizit dokumentiert)
- **DSGVO + Support:** Externer DSB ab J3 (3 k/J Pauschale) + Backoffice ab J4 von Halbtags auf Vollzeit
- **Sensitivitätsanalyse:** Bull/Base/Bear-Szenarien dokumentiert

**Was sich gegenüber v1 geändert hatte:**
- Pricing 4,99 € → 6,99 € Premium, 14,99 € → 19,99 € Pro
- Mikromezzanin verworfen → KfW-Gründerkredit 100 k (2 J tilgungsfrei)
- Lernfeld-Expansion: J3 Sprachen+DaZ, J4 Mathe
- Personal-Aufbau: Sprachen-Lead, Mathe-Lead, Marketing 3-stufig
- Hardware-Vollausstattung 6 MA in J3 (24 k €)

---

## 1. Geschäftsmodell

**Lesekumpel** — neuroinklusive Lese-, Sprach- und Lernplattform für Kinder 5–10 Jahre mit Fokus auf LRS, ADHS, Autismus und DaZ.

**Einnahmenstreams (alle Listenpreise sind Brutto inkl. 7 % MwSt):**
- **Familienpaket Premium:** 6,99 €/Monat Brutto · Cap 20 Stories · Jahres-Abo 69 € Brutto (−18 %)
- **Multi-Sprach-Tier** (ab J3): 8,99 €/Monat Brutto · alle Sprachen inkl. · Jahres-Abo 89 € Brutto (−17 %)
- **Pro-Account** (Lehrer): 19,99 €/Monat Brutto · Cap 45 Stories · Jahres-Abo 199 € Brutto (−17 %)
- **Kaffeekasse:** 1 €/2 Credits On-Demand

**MwSt-Behandlung:** Lesekumpel-Inhalte sind Bildungsmedien gemäß **§12 UStG Abs. 2 Nr. 14** und unterliegen dem ermäßigten Steuersatz von **7 %**. Alle Listenpreise sind Brutto, alle Umsatzwerte in Tabellen sind Netto.

**Force Commitments:** 60 % aller Premium- und Pro-Abos wählen Jahres-Abo (Discount-Anreiz).
**Avg Netto-Umsatz/Jahr/Kunde:** Premium J1-2: 74,95 € → J3: 78 € → J4: 85 € → J5: 89 € · Pro: 211,26 €

---

## 2. Wachstumsannahmen (konservativ, mit Sprachen J3 + Mathe J4)

| Stream | Ende J1 | Ende J2 | Ende J3 | Ende J4 | Ende J5 |
|---|---|---|---|---|---|
| Premium-Abos | 50 | 450 | 2.200 | 4.800 | 7.500 |
| Pro-Accounts | 8 | 70 | 500 | 1.200 | 2.200 |
| Avg Premium/Jahr | 20 | 250 | 1.325 | 3.500 | 6.150 |
| Avg Pro/Jahr | 4 | 39 | 285 | 850 | 1.700 |
| Free-Nutzer (Faktor) | 15× Premium | 15× | 12× | 12× | 12× |

**Wachstumstreiber:**
- **J3 Sprachen + DaZ:** TAM-Verdopplung über DACH-Markt + DaZ-Schul-Vertriebskanal mit eigenem Förderbudget. Pro:Premium-Ratio steigt von 2 % auf 4 % (DaZ-Lehrer-Boost).
- **J4 Mathe:** Retention-Hebel (Netto-Churn von 4 % auf 3 %). ARPU steigt durch Multi-Sprach-Tier-Adoption.
- **Force Commitments + Win-Back:** Effektiver Netto-Churn 4 % statt 7 % Brutto.

**Stories pro Nutzer/Monat:**
- Premium: avg 15 (Cap 20)
- Pro: avg 30 (Cap 45)
- Free: 1 (Cap 3)

---

## 3. Preismodell & Marge

### Familienpaket Premium — Worst-Case-Mathematik

- Preis: 6,99 €/Monat
- Variable Kosten: 20 Stories × 0,07 € (ab J3) + 0,12 € Backend + 0,90 € Free-Anteil + 0,32 € Stripe = **2,74 €**
- **Deckungsbeitrag: 4,25 €/Premium** · Marge ~61 %

### Multi-Sprach-Tier (ab J3)

- Preis: 8,99 €/Monat
- Variable Kosten: 20 × 0,07 € + 0,15 € TTS-Lizenzen + 0,12 € Backend + 0,90 € Free-Anteil + 0,38 € Stripe = **2,95 €**
- **Deckungsbeitrag: 6,04 €/Premium** · Marge ~67 %

### Pro-Account

- Preis: 19,99 €/Monat
- Variable Kosten: 45 × 0,07 € + 0,52 € Stripe + 3,00 € Subaccounts = **6,67 €**
- **Deckungsbeitrag: 13,32 €/Pro** · Marge ~67 %

### Kaffeekasse

- Preis: 1,00 € · Variable Kosten: 2 × 0,07 € + 0,26 € Stripe = **0,40 €**
- **Deckungsbeitrag: 0,60 €/Kauf** · Marge 60 %

### Token-Hebel

| Phase | Story-Kosten | Begründung |
|---|---|---|
| J1 | 0,12 €/Story | GPT-4 + Imagen 2 |
| J2 | 0,09 €/Story | Modell-Wechsel + erste Cache-Effekte (−25 %) |
| ab J3 | 0,07 €/Story | Gemini Flash + Recommendation-Cache (voller Hebel) |

---

## 4. Investitionen + Sacheinlage + Einmal-Aufwand

**BWL-Logik:** Nur Anlagegüter der Gesellschaft (Nutzungsdauer > 1 Jahr) sind echte Investitionen.

**Echte Investitionen (Anlagegüter):**

| Posten | Phase | Wert | Nutzungsdauer | AfA/Jahr |
|---|---|---|---|---|
| DPMA-Markenanmeldung | J1 (M1) | 290 € | 10 Jahre | 29 € |
| Hardware-Vollausstattung 6 MA | J3 | 24.000 € | 3 Jahre | 8.000 € |
| Hardware-Erweiterung (Mathe-Lead + Marketing-VZ) | J4 | 8.000 € | 3 Jahre | +2.667 € |
| Hardware-Refresh Gründer-Notebooks | J5 | 8.000 € | 3 Jahre | +2.667 € |
| **Summe Investitionen** | | **40.290 €** | | |

**Hardware pro MA:** ~4.000 € (Notebook Business 1.800 + 2 Monitore 700 + Headset 200 + Tisch+Stuhl 800 + Software-Lizenzen 500).

**Sacheinlage Phase 2 (bei GbR-Gründung):** ~1.000 €
- Alte Hardware der Gründer:innen, eingebracht als Sacheinlage zum Gesellschaftsvermögen.

**Einmal-Aufwand Phase 1:** ~700 €
- Domain/Hosting-Setup, Rechts-Templates eRecht24.

---

## 5. Finanzierung — KfW-Gründerkredit (statt Mikromezzanin)

**Bewusste Wahl gegen Mikromezzanin:**

| Aspekt | Mikromezzanin (verworfen) | **KfW-Gründerkredit (gewählt)** |
|---|---|---|
| Kapital | 50.000 € | **100.000 €** |
| Zins | 8 % p.a. fix | **5 % p.a. fix** |
| Laufzeit | 10 Jahre | 10 Jahre |
| Tilgungsfreiheit | endfällig (10 J) | **2 Jahre tilgungsfrei**, dann Annuität |
| Haftung | 100 % Gründer | 80 % KfW-Haftungsfreistellung |
| Verwässerung | 0 % (stille Beteiligung) | 0 % (klassischer Kredit) |
| Zinslast 5 J | ~32.000 € | **~16.000 € (bis M50)** |
| Antragsdauer | 8–12 Wochen | 4–6 Wochen (über Hausbank) |

**KfW-Mechanik:**
- Auszahlung M27 (Anfang J3)
- 2 Jahre tilgungsfrei (M27–M50): nur ~417 €/Mon Zinsen
- Annuität ab M51 (Mitte J5): ~1.260 €/Mon über 8 Jahre
- Persönliche Bürgschaft 4 Gesellschafter:innen gesamtschuldnerisch

**Gesamter Finanzierungsmix über 5 Jahre:**

| Phase | Quelle | Betrag |
|---|---|---|
| J1 | Eigenmittel (4 Gründer) | 2.500 € |
| J2 (M13) | Mikrokredit Start | 10.000 € |
| J2 (M19) | Mikrokredit-Aufstockung (nach 6 Tilgungen) | +20.000 € |
| J3 (M27) | KfW-Gründerkredit | 100.000 € |
| J3 | Förderung (z. B. DATIpilot) | 3.000 € |
| **Total externes Kapital** | | **135.500 €** |
| davon Kredit | | 132.500 € |

**Aktion Mensch ausgeschlossen** — kein Träger-Anschluss verfügbar.

---

## 6. Personal-Plan

**Stunden-Verteilung Gründer:innen:**
- J1-J2: 20h externer Teilzeit-Job + 20h Lesekumpel (Eigenleistung, keine Bezahlung)
- J3: 20h externer Job + 30h Lesekumpel · 1.500 €/Mon brutto je Gründer
- J4: 15h externer Job + 35h Lesekumpel · 2.500 €/Mon brutto je Gründer
- J5: Vollzeit Lesekumpel (40h) · 3.500 €/Mon brutto je Gründer

**Team-Aufbau:**

| Rolle | J1 | J2 | J3 | J4 | J5 |
|---|---|---|---|---|---|
| 4 Gründer-Bezahlung/Jahr | 0 | 0 | 72.000 € | 120.000 € | **240.000 €** *(@ 5.000 €/Mon)* |
| Backoffice (HT J3-J4 → VZ ab J5) | 0 | 0 | 18.000 € | 18.000 € | **36.000 €** |
| Sprachen-Lead Halbtags | 0 | 0 | 24.000 € | 24.000 € | 24.000 € |
| Mathe-Lead Halbtags (ab M40) | 0 | 0 | 0 | 14.000 € | 24.000 € |
| Marketing (HT → VZ → Sr.) | 0 | 0 | 12.000 € | 36.000 € | 42.000 € |
| Externer DSB (Datenschutz) | 0 | 0 | 3.000 € | 3.000 € | 3.000 € |
| **Intermediate Engineer** *(NEU J5)* | 0 | 0 | 0 | 0 | **65.000 €** |
| **Content Manager** *(NEU J5)* | 0 | 0 | 0 | 0 | **40.000 €** |
| **Customer-Success Pro** *(NEU J5)* | 0 | 0 | 0 | 0 | **50.000 €** |
| **Total Personal/Jahr** | 0 € | 0 € | **129.000 €** | **233.000 €** | **524.000 €** |
| **Team-Größe** | 4 | 4 | 6 + DSB | 7 + DSB | **10 + DSB** |

---

## 7. Churn-Modell mit Win-Back

| Jahr | Brutto-Churn/Mon | Win-Back-Rate | Netto-Churn |
|---|---|---|---|
| J1 | 7 % | 0 % | 7 % |
| J2 | 6 % | 0 % | 6 % |
| J3 | 5 % | 20 % | **4 %** |
| J4 | 5 % | 30 % | **3,5 %** |
| J5 | 5 % | 40 % | **3 %** |

**Win-Back-Kampagnen:**
- **August–September:** Schulbeginn-Kampagne (35 % Marketing-Budget)
- **Februar–März:** Halbjahres-Zeugnis-Kampagne (25 % Marketing-Budget)
- **Rest:** Always-On (40 %)

**KEINE** Geschenk-Saison (Lesekumpel positioniert sich nicht als Geschenk-Produkt).

---

## 8. CRM- und Marketing-Tools (laufende Kosten)

| Phase | Tool | €/Monat |
|---|---|---|
| J1 | MailerLite Free | 0 € |
| J2 | MailerLite Growing | 30 € |
| J3 | MailerLite Advanced | 50 € |
| J4-J5 | HubSpot Marketing Hub Starter | 80 € |

**Marketing-Budget je Jahr:** J1 0,12 k · J2 10 k · J3 30 k · J4 30 k · J5 15 k €

---

## 9. Lernfeld-Expansion Investitionen

| Position | J3 | J4 | J5 |
|---|---|---|---|
| TTS-Voice-Lizenzen (ElevenLabs Pro) | 4.000 € | 4.000 € | 5.000 € |
| Native-Speaker-QA (einmalig J3) | 8.000 € | 0 € | 0 € |
| Token-Mehrkosten Sprachen + Mathe | 5.000 € | 8.000 € | 10.000 € |
| Mathe-Setup einmalig | 0 € | 5.000 € | 0 € |
| **Total Lernfeld-Invest** | **17.000 €** | **17.000 €** | **15.000 €** |

---

## 10. Steuern (UG ab J3)

- Körperschaftsteuer 15 % + Gewerbesteuer ~14 % = **~29 % Effektiv-Steuersatz** auf positiven EBT
- Verlustvortrag J3 (~−46 k Op-Marge) reduziert J4-Steuerlast
- AfA: Marke 29 €/J, Hardware ~8.000 €/J ab J3

---

## 11. Finale 5-Jahres-Ergebnisse (Konsens)

| Kennzahl | J1 | J2 | J3 | J4 | J5 |
|---|---|---|---|---|---|
| Brutto-Umsatz (Netto) | 2.200 € | 25.700 € | 153.300 € | 483.900 € | **943.400 €** |
| Personalausgaben | 0 € | 0 € | **129.000 €** | **233.000 €** | **524.000 €** |
| Kreditkosten | 0 € | 4.400 € | 13.100 € | 13.700 € | 13.100 € |
| EBITDA operativ | −1.900 € | −4.200 € | +66.300 € | +328.200 € | +701.700 € |
| Operative Marge (nach Personal) | −1.900 € | −4.200 € | **−62.700 €** | **+95.200 €** | **+177.700 €** |
| Cashflow Jahr | −1.900 € | +21.800 € | +35.300 € | **+74.700 €** | **+134.200 €** |
| Liquidität Ende | +600 € | **+22.400 €** | **+57.700 €** | **+132.400 €** | **+266.600 €** |
| **Liquidität J3 M1-M3** *(Stress-Test)* | | | **+12k / +0,6k / +80k** | | |

**Pitch-Story für die Jury:**

> *„Aus 2.500 € Eigenmitteln + 132.500 € Kredit (Mikrokredit 30k + KfW 100k) zu 943 k € Umsatz und 267 k € Liquidität in Jahr 5. 4 Vollzeit-Gründer:innen + Senior-Team. Kein VC, keine Verwässerung, kein Burnout-Risiko durch externes Job-Standbein in Phase 1-2. Liquidität durchgehend positiv — Stress-Test J3 M1-M3 bestanden."*

---

## 12. Sensitivitätsanalyse — Bull / Base / Bear

Drei Szenarien zur Stress-Test-Validierung der Base-Annahmen:

| Szenario | Conversion | Win-Back | KfW-Timing | Premium J5 | Umsatz J5 | Op-Marge J5 | Liquidität J5 |
|---|---|---|---|---|---|---|---|
| **🚀 Bull** | 12 % | 30 % | M27 (pünktlich) | ~10.000 | ~1,3 M € | +500 k € | ~600 k € |
| **🎯 Base** | 8–11 % | 20 % | M27 | 7.500 | 921 k € | +374 k € | 349 k € |
| **🛡 Bear** | 4–5 % *(halb.)* | 10 % | +6 Mo Verzögerung | ~3.800 | ~480 k € | +90 k € | ~100 k € |

**Was Bear robust hält:**
- Externes Job-Standbein der Gründer:innen verhindert Nullfall-Existenz
- EXIST-Stipendium als KfW-Backup bei Antrags-Ablehnung
- Plan verlängert sich um 12-18 Monate, Geschäft bleibt tragfähig
- Personal-Aufbau kann verlangsamt werden (Backoffice bleibt Halbtags, kein Marketing-VZ)

**Sensitivitäts-Treiber (geordnet nach Impact):**
1. **Conversion Free→Premium** (größter Hebel) — wenn halb so hoch → Premium halbiert → ARPU-Mix verschiebt sich
2. **Pro-Adoption (DaZ-Markt)** — bei Verzögerung: Pro-Ratio bleibt bei 2 % statt 4 %
3. **KfW-Timing** — bei Ablehnung/Verzögerung: Vollzeit-Übergang verschoben um 12 Monate
4. **Win-Back-Effektivität** — wirkt linear auf Netto-Churn

---

## 13. Konsistenz-Mapping

| Quelle | Inhalt |
|---|---|
| `Pitch/finanzierungs-pitch-v2.html` | 10-Folien-Pitch + 9 Anhangs-Folien (Master-Stand) |
| `Memory: project_finanzierungs_phasen.md` | Vollständige Strategie + Lessons aus Iterationen |
| `Pitch/Finanzen/geschaeftsplan-annahmen.md` | Dieses Dokument — Detail-Annahmen + Mathematik |
| `Pitch/Finanzen/calc-monatsdaten.py` | Reproduzierbares Berechnungs-Skript für Anhangs-Daten |
| `Pitch/Finanzen/monatsdaten.json` | Generierte Monats-Werte aller 8 Kennzahlen |
| `Pitch/finanzierungs-praesentation.html` *(alt)* | Archiv-Version v1, nicht mehr aktuell |

Bei Wertänderungen: zuerst calc-monatsdaten.py anpassen → re-run → JSON aktualisiert → dann Memory + Annahmen-MD + Pitch-HTML synchronisieren.
