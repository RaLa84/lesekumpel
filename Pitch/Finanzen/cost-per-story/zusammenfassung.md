# Lesekumpel — Geschäftsmodell-Übersicht

> **Stand:** 2026-04-29 · Detaildaten in [results.md](results.md)

## TL;DR

- **Variable Kosten pro Story**: 0,073–0,105 € (gemessen für Autorengeschichte, geschätzt für andere Modi)
- **Fixkosten**: 322 € (Anlauf) / 381 € (Wachstum) — inkl. 250 € Dev-Tool-Subscriptions
- **Pricing**: Free + Premium 7,99 €/Monat mit Cap auf 30 LLM-Stories
- **Break-Even**: bei **94 Premium-Usern** (≈ 940 Total bei 10 % Conversion)
- **Vollzeit-tragfähig**: ab ~1.000 Premium-Usern (~3.800 €/Monat Profit)
- **Werbung wird nicht empfohlen** (Regulation, Vertrauen, niedrige CPMs); stattdessen **+35 % Umsatz** durch Family Plan, Print-Add-On, Schul-Lizenzen erreichbar

---

## 1. Kostenstruktur

### Variable Kosten pro Story (LLM + Bilder)

| Modus | €/Story | Quelle |
|---|---:|---|
| Autorengeschichte | **0,105 €** | gemessen (Stichprobe 10 Stories, IDs 1493–1506) |
| Lesestufen | 0,073 € | geschätzt (Autorengeschichte LLM + 1 Bild) |
| Geschichte bauen | 0,077 € | geschätzt (5 Iterationen + 1 Bild) |
| Top 100 Basiswörter | ~0 € | vorgenerierte Texte/Wimmelbilder, einmalige CapEx ~3,85 € alle 3 Monate |

Top-Kostenfaktor: **Bilder** (~67 % der Kosten bei Autorengeschichte). Modell: Gemini 2.5 Pro für LLM ($1,25/M Input, $10/M Output) + ~$0,04 pro Bild.

### Fixkosten pro Monat

| Posten | Anlauf | Wachstum | Kommentar |
|---|---:|---:|---|
| n8n Cloud | 24 € | 60 € | Starter → Pro ab ~80 Power-Usern |
| Vercel Pro | 18 € | 18 € | Hobby ist kommerziell verboten |
| Supabase Pro | 23 € | 23 € | Free pausiert nach 7 Tagen |
| Resend | 0 € | 18 € | Free reicht initial bis 3.000 Mails |
| Cloudflare R2 (Storage) | 5 € | 10 € | Bilder skalieren mit Story-Anzahl |
| Domain | 1 € | 1 € | |
| Top-100-Content (CapEx) | 1,28 € | 1,28 € | 3-Monats-Erneuerungs-Zyklus |
| **Dev-Tool-Subscriptions** | **250 €** | **250 €** | Claude, Gemini, OpenAI, Cursor & Co. — Solopreneur-Stack |
| **Total** | **322 €** | **381 €** | |

### Pro-User-Kosten (laufend)

| User-Typ | Variable | Backend | **Total/Monat** |
|---|---:|---:|---:|
| Free (nur lesen) | 0 € | 0,10 € | **0,10 €** |
| Premium (Worst Case mit Cap auf 30 Stories) | 2,91 € | 0,10 € | **3,01 €** |

→ Effektive Kosten **pro Premium-User in einer 1:9 Kohorte** (1 Premium + 9 Free): 3,01 € + (9 × 0,10 €) = **3,91 €**

---

## 2. Break-Even-Analyse

### Annahmen

- Premium-Pricing: **7,99 €/Monat**
- Conversion: **10 %** (1 Premium auf 9 Free) — realistisch für Bildungs-Apps mit Eltern-Wert
- Cap: 30 LLM-Stories/Premium/Monat (Top 100 unbegrenzt, weil vorgeneriert)
- Worst-Case-Annahme: alle Premium-User schöpfen Cap voll aus (Power-Profil)

### Formel

```
Cost   = 381 € (Fix) + 3,91 € × P  (P = Anzahl Premium-User)
Income = 7,99 € × P
Break-Even:  381 € + 3,91 P = 7,99 P  →  P = 94
```

### Profitabilitäts-Kurve

| Premium | Free | Total | Cost | Income | **Profit/Monat** |
|---:|---:|---:|---:|---:|---:|
| 50 | 450 | 500 | 572 € | 400 € | −173 € |
| **94** | **846** | **940** | **740 €** | **751 €** | **±0 € (Break-Even)** |
| 100 | 900 | 1.000 | 762 € | 799 € | +37 € |
| 250 | 2.250 | 2.500 | 1.334 € | 1.998 € | +664 € |
| 500 | 4.500 | 5.000 | 2.286 € | 3.995 € | +1.709 € |
| **1.000** | **9.000** | **10.000** | **4.191 €** | **7.990 €** | **+3.799 € — Vollzeit-tragfähig** |
| 2.000 | 18.000 | 20.000 | 8.001 € | 15.980 € | +7.979 € |

### Zeit-Marken (grob)

| Marke | Premium | Total | Bedeutung |
|---|---:|---:|---|
| **Beta-Phase** | <50 | <500 | Verlust akzeptabel, Lernen |
| **Break-Even** | 94 | ≈ 940 | erreichbar in 6–12 Monaten mit gutem SEO/Insta |
| **Tools+ tragen** | 250 | ≈ 2.500 | Subscriptions decken sich selbst |
| **Vollzeit-Schwelle** | 1.000 | ≈ 10.000 | ~3.800 € Profit deckt Lebenshaltung |
| **Komfortable Vollzeit** | 2.000 | ≈ 20.000 | ~8.000 € Profit, Investitions-Spielraum |

### Skalierungs-Schwellen mit Mehrkosten

| Schwelle | Was passiert |
|---|---|
| ~300 Premium (9.000 Stories/Monat) | n8n Pro (10.000 Exec) wird knapp → Business-Plan |
| ~3.000 Free | Resend Pro (50.000 Mails) wird knapp |
| ~10.000 Total | Vercel/Supabase Compute → höhere Tarife |

---

## 3. Zusätzliche Einnahmequellen

### Werbung: NICHT empfohlen

| Grund | Detail |
|---|---|
| **Regulatorisch heikel** | DSGVO verbietet Behavioral Targeting bei Kindern <16; KJM/ZAW restriktiv |
| **Niedrige CPMs** | Kinder-Bereich 0,50–2 € CPM (vs. 5–15 € Erwachsene). Bei 100.000 Views: nur 50–200 €/Monat |
| **Vertrauens-Schaden** | Eltern, die für Bildung zahlen, akzeptieren keine Ads vor ihren Kindern → Conversion sinkt |

### Empfohlene Streams (bei 1.000 Premium / 10.000 Total)

| Stream | Mechanik | Aufwand | Risiko | **Zusatz/Monat** |
|---|---|---|---|---:|
| **Family Plan** (14,99 €/Mon., 4 Profile) | 30 % Premium-Switch → 300 × 7 € Aufpreis | mittel | niedrig | **+2.100 €** |
| **Yearly Plan** (79 €/Jahr, −20 %) | 40 % Switch → bessere Retention, Cash vorab | niedrig | niedrig | LTV +30 % |
| **Print-Add-On** (eigenes Buch, 19,99 €) | 3–5 % Premium × 1 Buch × ~10 € Marge | hoch (Logistik) | mittel | **+300–500 €** |
| **Schul-Lizenzen** (Klassen-Abo, 25 €/Monat) | 10 Klassen, B2B-Vertrieb | hoch | mittel | **+250 €** |
| **Geschenk-Codes** (Großeltern-Markt) | Saison-Spike Weihnachten / Geburtstag | mittel | niedrig | **+200–500 €** (saisonal) |
| **Affiliate Buchempfehlungen** | Amazon/Carlsen Affiliate am Story-Ende, 3–7 % | niedrig | niedrig | **+30–80 €** |
| **B2B / Stiftungen** (Bibliotheken, Bildungsträger) | wenige große Deals | sehr hoch | hoch | **+500–2.000 €** |

### Realistisches Gesamt-Bild

```
Premium-Subscriptions  (1.000 × 7,99 €):  7.990 €
+ Family-Upgrade       (300 × 7 €):       2.100 €
+ Print-Add-On                              400 €
+ Schul-Lizenzen                            250 €
+ Affiliate                                  50 €
─────────────────────────────────────────────────
Total Income/Monat:                      ~10.790 €
                          (= +35 % vs. Premium-only)
```

### Roadmap der Einnahmequellen

| Phase | Premium-Marke | Streams | Begründung |
|---|---:|---|---|
| **1. MVP** | 0–500 | Premium nur | Fokus auf Conversion + Retention, kein Stream-Splitting |
| **2. Festigen** | 500–1.000 | + Family Plan, Yearly | bestehende User mehr monetarisieren, niedriger Aufwand |
| **3. Erweitern** | 1.000–2.500 | + Print-Add-On, Geschenk-Codes | tiefere Wertschöpfung, Saison-Hebel |
| **4. Diversifizieren** | 2.500+ | + Schul-Lizenzen, B2B-Stiftungen | neue Kanäle, Risiko-Streuung |

---

## Wichtigste Annahmen, die zu validieren sind

1. **Conversion-Rate 10 %** — Branchenmittel für Bildungs-Apps, aber stark vom Onboarding abhängig. 5 % wäre kritisch, 15 % wäre exzellent.
2. **Power-User-Anteil 100 %** — der Worst Case nimmt an, alle Premium nutzen Cap voll aus. Realität: viele bleiben unter 30 Stories → bessere Marge.
3. **30-Story-Cap** — wirksam? Soft Cap mit Pay-per-Use über 30 wäre profitabler.
4. **Dev-Tool-Subscriptions 250 €** — eigentlich Solopreneur-Kosten. Bei Wachstum wird hier mehr investiert (Designer, Texter), aber entsprechend mehr Wert.
5. **Free-User Backend 0,10 €** — Schätzung. Mit konkreten Vercel/Supabase-Logs validierbar, sobald App live ist.

---

## Schlussbild

Das Modell ist **wirtschaftlich tragfähig ab ~1.000 zahlenden Usern** — eine erreichbare Schwelle mit konsequentem SEO/Insta-Aufbau in 12–18 Monaten. Der **Premium-Stream allein ist die kürzeste Strecke zur Profitabilität**; die anderen Streams sind **Multiplikatoren**, die pro bestehendem User mehr Wert ziehen, ohne neue Akquise-Kosten zu erzeugen.

Der größte Hebel zur Verbesserung ist **die Conversion-Rate** (10 % → 12 % wäre +20 % Umsatz), nicht der Preis.
