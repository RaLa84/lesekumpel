# Stufe 2 — Vollständige Ideenskizze

**Deadline:** 30.05.2026
**Einreichung:** Per E-Mail an zfe@uni-rostock.de
**Format:** PDF, ca. 5–8 Seiten (Empfehlung — vom ZfE die offizielle „Gliederungshilfe zur Ideenskizze" anfordern und gegen­prüfen)

---

# Lesekumpel — Lernen ohne Tränen

*Eine KI-gestützte Lese-Bibliothek, die jede Geschichte automatisch an Leseniveau und Neurotyp anpasst.*

---

## 1. Executive Summary

Lesekumpel ist eine browserbasierte Lese-Plattform für Kinder im Alter von 5 bis 10 Jahren. Eine automatisierte KI-Content-Pipeline erzeugt zu jedem Story-Konzept gleichzeitig **fünf Lesestufen** und **vier Neurotyp-Varianten** (Standard, ADHS-, Autismus-Spektrum-, LRS-optimiert). Damit löst Lesekumpel ein Problem, an dem klassische Leseförderung scheitert: Texte sind entweder zu schwer oder so aufgebaut, dass sie genau die Kinder ausschließen, die zusätzliche Unterstützung brauchen.

Die Plattform ist live, betreibt sich technisch zu Marginalkosten (Static Site auf GitHub Pages + serverlose KI-Pipeline) und ist seit dem Start ohne Marketing organisch genutzt worden. Das Geschäftsmodell ist Freemium: Lesen bleibt dauerhaft kostenlos, eigene KI-Geschichten kosten Credits, B2B-Lizenzen für Schulen, Logopädie- und Therapiepraxen finanzieren Betrieb und Weiterentwicklung.

Wir bewerben uns bei INSPIRED, weil wir den nächsten Schritt — Wirksamkeits­studie an MV-Pilotschulen, Eltern-/Lehrkräfte-Dashboard, Spracherkennung — nicht im Alleingang gehen wollen.

## 2. Problem

**Die deutsche Lese-Krise ist messbar:**
- IGLU 2021: 25 % der Viertklässler:innen erreichen nicht den Mindest­standard im Leseverständnis. Tendenz seit 2001 negativ.
- IQB-Bildungstrend 2021: rund ein Fünftel verfehlt die Mindest­standards in Deutsch.
- Mecklenburg-Vorpommern liegt bei zentralen Bildungs­indikatoren bundesweit im hinteren Drittel.

**Bestehende Angebote treffen die Lücke nicht:**

| Angebot | Schwäche aus Lesekumpel-Sicht |
|---------|-------------------------------|
| Antolin (Schulbuchverlage) | Nur Quiz zu vorhandenen Büchern, keine adaptiven Texte |
| Onilo, Amira | Statische Auswahl, keine Adaption an Neurotyp |
| LRS-Software (z.B. Tintenklecks, Celeco) | Therapiefokus, hochpreisig, keine Story-Erlebnisse |
| Allgemeine Apps (Anton, Scoyo) | Neurotypisch normiert, gamifiziert mit Belohnungs­druck |
| Generative-KI-Geschichten (z.B. Bedtime Story) | Nicht didaktisch, keine Lesestufen, keine Neurotyp-Logik |

**Die Lücke:** Eine Plattform, die hochwertige Geschichten in der Bandbreite anbietet, die ein heterogener Klassenverband oder eine Familie mit mehreren Kindern braucht — und dabei explizit Kinder mit LRS, ADHS und Autismus-Spektrum als Standard­zielgruppe mitdenkt, nicht als Nachgedanke.

## 3. Lösung

Lesekumpel ist eine Web-App (PWA-fähig), die ohne Installation auf jedem Gerät läuft.

**Kern-Innovation: Doppelte Adaption pro Story**

Jede Geschichte wird über eine N8N-Workflow-Pipeline mit LLM (Claude / GPT) generiert. Der Generator kombiniert zwei orthogonale Achsen:

- **5 Skill-Personas** als Lesestufen, von ~20 Wörtern Präsens (Pip Punkt) bis 250–400 Wörter mit Tempus­wechseln (Finja Feder).
- **4 Neurotyp-Varianten**: Standard, ADHS, Autismus-Spektrum, LRS — jeweils mit eigenen Schreib­regeln (z.B. ADHS: Cliffhanger pro Absatz, Autismus: explizite emotionale Markierungen, keine Ironie­fallen, LRS: kürzere Sätze, häufige Wörter, optionale Silben­trennung).

Hinzu kommen **4 Bonus-Personas** mit fixem Stil (Edutainment, Gaming-Humor, Traumreisen, Alltags-Abenteuer), freischaltbar als Belohnung.

**Was Kinder konkret bekommen:**
- Story-Bibliothek mit aktuell ~70 Geschichten, wachsend täglich
- Wahl der Persona / Lesestufe + Modus
- Dyslexie-freundliche Schrift (Atkinson Hyperlegible), umschaltbar
- Kein Login zum Lesen, keine Werbung, kein Tracking
- Spätere Phasen: Spracherkennung, Wort-Tracking, Eltern-Dashboard, RAG-Chatbot für Eltern und Lehrkräfte

## 4. Innovationsgehalt

| Dimension | Innovation |
|-----------|-----------|
| **Inhaltlich** | Erste deutschsprachige Plattform, die Geschichten *gleichzeitig* nach Leseniveau und Neurotyp adaptiert. |
| **Methodisch** | Eigene Wissensdatenbank mit Quellen aus Legasthenie­forschung (z.B. Schulte-Körne), ADHS-Pädagogik, autismus­spezifischer Lese­förderung — direkt operationalisiert in Persona-System­prompts und (perspektivisch) RAG-Chatbot. |
| **Technisch** | Serverlose Architektur: GitHub Pages + N8N-Pipeline + LLM-API. Marginalkosten pro Geschichte unter 5 Cent. |
| **Sozial** | „Lesen kostenlos" als dauerhaftes Versprechen — Bezahlung nur für Komfort­funktionen (eigene Geschichten, Schul­dashboard). Kein Kind wird durch Paywalls vom Üben ausgeschlossen. |

## 5. Markt und Wettbewerb

**Marktgröße Deutschland:**
- ~3,0 Mio Grundschüler:innen
- 4–7 % mit diagnostizierter LRS (~150.000–200.000 Kinder)
- 4–6 % mit ADHS (Diagnose), Dunkelziffer höher
- ~1 % im Autismus-Spektrum
- Hinzu kommen alle weiteren leseschwachen Kinder ohne Diagnose

**Adressierbare Käuferschichten:**
- B2C: Eltern, die für eigene Geschichten zahlen (Credits)
- B2B Schulen: Klassen-Lizenzen, Lehrkräfte-Dashboard
- B2B Therapie: Logopädie, Ergotherapie, Lerntherapie-Praxen
- B2I (Institutionen): Stadt­bibliotheken, Familien­zentren, LRS-Förderzentren
- Förder­träger: Stiftungen (Stiftung Lesen, Telekom-Stiftung), Bildungs­ministerien

**Wettbewerbs­matrix:**
- Antolin/Onilo: marktführend, aber statisch + paywall + auf konkrete Bücher angewiesen
- Anton: kostenlos, aber primär Übungs-App, keine Story-Bibliothek
- LRS-Software: teuer (50–200 €/Jahr), Therapie­fokus, kein Spaß­faktor
- KI-Story-Apps (StoryAI etc.): nicht didaktisch, englischsprachig dominiert

Lesekumpel besetzt die noch unbesetzte Schnittstelle: KI-Skalierung + Lese­didaktik + Inklusion + Frust­freiheit.

## 6. Geschäftsmodell

**Ertragsströme:**

1. **Freemium B2C — Credits**
   - Lesen aller Geschichten kostenlos
   - Konto-Funktionen (Favoriten, Fortschritt) kostenlos nach Registrierung
   - Eigene KI-Geschichten kosten Credits (z.B. 5 € = 50 Credits = ~50 Geschichten)

2. **B2B-Schullizenz**
   - Pro Klasse / Schule: ~10–30 €/Monat
   - Inklusive Lehrkräfte-Dashboard (Auswahl, Zuweisung, Fortschritt)
   - Pilot­phase: vergünstigt oder kostenlos im Tausch gegen Wirksamkeits­daten

3. **B2B-Therapielizenz**
   - Pro Praxis: ~15–40 €/Monat
   - Erweiterte LRS-Funktionen (Tracking, Übungs­zuweisungen, Eltern­berichte)

4. **Förderprojekte / Drittmittel**
   - EU-Bildungs­programme, Stiftungen, Landes­programme MV
   - Kofinanzierung der Wirksamkeits­studie

**Kostenstruktur (geplant):**
- Variable Kosten pro Story: ~3–5 Cent (LLM-API)
- Fixkosten heute: <50 €/Monat (Hosting, Domain, N8N)
- Skalierungskosten ab ~10.000 MAU: Cloud-Backend, ggf. selbst gehostete LLMs

**Break-Even-Logik:** Bereits ~200 zahlende Schul­lizenzen oder ~1.000 zahlende Eltern decken eine Vollzeit-Stelle.

## 7. Stand der Umsetzung

| Bereich | Status | Belege |
|---------|--------|--------|
| Plattform live | ✅ | https://rala84.github.io/lesekumpel/ |
| Content-Pipeline | ✅ produktiv | N8N-Workflow, ~70 Geschichten generiert |
| Persona-System | ✅ 5 Skill + 4 Bonus | Prompt-Verzeichnis, Versionierung |
| Design System | ✅ | DSGVO-konforme Schriften, dyslexie­freundlich |
| Wissensdatenbank | 🔄 in Aufbau | 40+ Expert:innen-Profile, evidenz­basierte Themen­chunks |
| Eltern-/Schul-Konto | 🔄 Konzept | Mockup vorhanden |
| Spracherkennung | 🔄 Konzept | Web Speech API + Whisper API geplant |
| RAG-Chatbot Eltern­beratung | 🔄 Konzept | Architektur dokumentiert |

## 8. Roadmap (12 Monate ab Q3 2026)

| Quartal | Meilensteine |
|---------|--------------|
| **Q3 2026** | Eltern-Konto + Fortschrittstracking · Lehrkräfte-Dashboard MVP · 200 Geschichten |
| **Q4 2026** | Pilot mit 3–5 Grundschulen in MV · Wirksamkeits­studie Setup mit Universität Rostock/Greifswald |
| **Q1 2027** | Spracherkennung + Wort-Tracking MVP · RAG-Chatbot Eltern­beratung Beta |
| **Q2 2027** | Studienergebnisse · GmbH-Gründung · erste B2B-Lizenz­verträge |

## 9. Team

**Gründung / Umsetzung:**
- [Vor- und Nachname] — Idee, Produkt, Engineering, Content-Pipeline
- [Optional: Co-Founder mit pädagogischem / didaktischem Hintergrund]

**Beirat / Unterstützer:innen (Wunschbild):**
- Lese-/Legasthenie­forschung (Universität)
- Erfahrene Grundschul­lehrkraft
- Logopädie / Lerntherapie
- Erziehungs­berechtigte:r mit eigenem neuro­divergenten Kind (Zielgruppen-Insider)

## 10. Wirkung und Vision

**Direkte Wirkung:**
- Kinder mit Lese­schwierigkeiten erleben Erfolg statt Frust
- Eltern bekommen ein Werkzeug, das ohne Streit funktioniert
- Lehrkräfte erhalten Material, das Heterogenität ernst nimmt

**Mittelbare Wirkung:**
- Beitrag zur Reduktion der Lese­krise — gerade in MV
- Validierungs­plattform für inklusive Lese­didaktik (Forschungs­kooperation möglich)
- Open-Source-Komponenten denkbar (Persona-Schemas, Wissens­basis)

**Langfristige Vision:**
Lesekumpel als europäisches Inklusions-Standard­werkzeug für Lese­förderung — beginnend in MV, skalierend nach D-A-CH und (sprach­abhängig) ins europäische Ausland.

## 11. Was wir von INSPIRED brauchen

1. **Jury-Feedback** zur Geschäfts­modell-Validierung — speziell der B2B-Schul­lizenz
2. **MV-Netzwerk**: Universität Rostock & Greifswald (Lese­forschung), Pilotschulen, Lehrer­fortbildung
3. **Coaching** in der Rock-it Week — Schwerpunkt: Vertrieb in den Bildungs­markt, Förder­mittel­akquise
4. **Sichtbarkeit** — Lese­krise und Inklusion sollten ein politisches Thema in MV sein, das ist eine Gelegenheit dafür

---

*Anhang: Screenshots der Plattform · Architekturdiagramm · Persona-Übersicht · Beispielausschnitte aus Geschichten in vier Neurotyp-Varianten · Quellenverzeichnis Wissens­datenbank*
