# Jury-Q&A — Antizipierte Fragen mit vorbereiteten Antworten

Vorbereitung auf das Q&A nach dem Live-Pitch (~5–10 Min). Antworten kurz, konkret, mit Zahl oder Beispiel. **Nicht** auswendig lernen — internalisieren, dann frei sprechen.

---

## Markt & Wettbewerb

**Q: Wie unterscheidet sich Lesekumpel wirklich von Antolin / Anton / Onilo?**

> Antolin ist ein Quiz-Tool zu vorhandenen Büchern, Anton liefert Übungen — beide haben keine eigene, adaptierte Story-Bibliothek. Onilo macht animierte Bilderbücher, aber statisch. Niemand davon adaptiert Texte gleichzeitig nach Lese­niveau und Neurotyp. Das ist die einzige relevante Spalte in unserer Vergleichs­matrix, in der nur wir ein Häkchen haben.

**Q: Was, wenn OpenAI / Google morgen einfach selbst eine Kinder-Lese-App bauen?**

> Wir konkurrieren nicht mit Modell-Anbietern, wir konkurrieren mit Bildungs­produkten. Eine Lese-App ist zu 80 % Didaktik, Persona-System, Wissens­basis, Vertrieb in Schulen — nicht Modell. Unsere Wissens­datenbank, die Persona-Architektur und der Pilot mit MV-Schulen sind unsere Burggräben. Außerdem nutzen wir LLM als Werkzeug, nicht als Markt.

**Q: Wie groß ist der Markt wirklich?**

> Drei Millionen Grundschulkinder in Deutschland. Bei einer konservativen 10-%-Quote zahlender Eltern bei nur fünf Euro pro Monat sind das 18 Millionen Euro Jahresumsatz allein im B2C, allein in Deutschland. B2B-Schulen und Therapie kommen oben drauf.

---

## Geschäftsmodell

**Q: Warum nicht alles kostenpflichtig — der Vertrieb wäre einfacher?**

> Weil wir genau die Kinder erreichen wollen, deren Familien sich Bildungs-Apps nicht leisten. Eine Paywall vor dem Lesen würde unsere Zielgruppe ausschließen. Bezahlt wird für Komfort: eigene Geschichten, Schul­dashboard, Therapie­funktionen. Das ist nicht naiv — es ist die einzige Position, mit der wir glaubhaft mit Schulen, Jugend­ämtern und Stiftungen arbeiten können.

**Q: Wie sieht Ihre Unit Economics aus?**

> Variable Kosten pro Geschichte: 3 bis 5 Cent. Eine zahlende Familie liest im Monat 20–30 Geschichten — Kosten für uns: unter einem Euro. Bei einem 5-Euro-Credit-Paket bleibt Marge. Eine Schul­lizenz für 30 € pro Klasse pro Monat amortisiert sich nach den ersten zwei Wochen Nutzung.

**Q: Was kostet Customer Acquisition?**

> Im B2C über organische Kanäle (SEO, Eltern-Communities, Empfehlung) heute praktisch null. Im B2B kostet ein Schul­abschluss vielleicht 5–10 Stunden Vertriebs­arbeit, der Lifetime-Value einer Schule liegt im vier­stelligen Bereich pro Jahr. Wir haben keinen Performance-Marketing-Druck.

---

## Technologie & KI

**Q: Wie stellen Sie Qualität der KI-Geschichten sicher?**

> Drei Ebenen: Erstens die Persona-System­prompts, die Lese­stufe und Neurotyp-Regeln vorgeben. Zweitens unsere Wissens­datenbank mit Quellen aus der Lese­forschung, die in die Prompts und perspektivisch in einen RAG-Layer einfließt. Drittens menschliches Lektorat — heute durch mich, perspektivisch durch eine Lehrkraft im Beirat. Außerdem werden Geschichten mit ihrem System­prompt gespeichert; wir können also rück­wirkend Qualität messen.

**Q: Halluzinationen, kindgefährdende Inhalte?**

> Es sind erfundene Kinder­geschichten — Halluzination ist hier kein Bug, sondern Feature. Was wir verhindern müssen, sind unangemessene Inhalte. Dafür gibt es Content-Filter im LLM, klare Themen­vorgaben in der Pipeline, und menschliche Freigabe vor Veröffentlichung in der öffentlichen Bibliothek. Eltern-generierte Geschichten landen privat im Account, nicht in der Bibliothek.

**Q: Was passiert, wenn die LLM-Preise steigen?**

> Bei aktuellem Stand sind 5 Cent pro Geschichte tolerierbar. Selbst bei einer Verzehn­fachung blieben wir profitabel. Längerfristig denken wir an selbst gehostete Open-Source-Modelle für die Standard­fälle, kommerzielle APIs für Premium.

---

## Zielgruppe & Wirkung

**Q: Wie wissen Sie, dass es bei Kindern mit LRS / ADHS / Autismus wirklich hilft?**

> Heute haben wir Praxis­berichte und Eltern-Feedback, aber noch keine kontrollierte Studie. Genau dafür wollen wir den INSPIRED-Sprung nutzen: Pilot mit drei bis fünf Grund­schulen in MV, idealerweise mit der Universität Rostock oder Greifswald als Forschungs­partner, um Wirksamkeit messbar zu machen. Bis dahin halten wir uns an die Forschung, die in unsere Persona-Regeln eingeflossen ist — z.B. Schulte-Körne zur LRS-Förderung.

**Q: Datenschutz — Sie arbeiten mit Kindern?**

> Aktuell läuft Lesekumpel als statische Site ohne Tracking, ohne Login zum Lesen, ohne Werbung. Schriften liegen lokal (DSGVO-konform). Sobald Konten kommen, wird das von Anfang an mit Datenschutz­konzept gebaut — Eltern-PIN, Daten­minimierung, Opt-in für Tracking, Hosting in der EU. Das ist im Bildungs­markt nicht optional, das ist Voraussetzung.

---

## Team

**Q: Sie sind Solo-Gründer:in?**

> *Wenn ja:* Heute ja, das ist ein Risiko und das wissen wir. Wir suchen aktiv Mit­gründer:innen aus dem pädagogischen Bereich und einen Beirat aus Lese­forschung und Schul­praxis. INSPIRED hilft uns, dieses Team in MV zu finden.
>
> *Wenn nein:* [Co-Founder benennen, Komplementarität zeigen]

**Q: Warum sollten Sie das schaffen?**

> Weil ich es schon gebaut habe. Lesekumpel ist live, mit produktiver Pipeline, mit echten Nutzer:innen. Ich habe nicht eine Idee gepitcht, ich habe ein Werkzeug gebaut, weil ich es selbst gebraucht habe. Was jetzt kommt, ist Vertrieb, Forschung und Skalierung — und genau dafür ist INSPIRED der richtige Schritt.

---

## Skalierung & Exit

**Q: Wie skaliert das international?**

> Plattform und Content-Pipeline sind sprach­agnostisch — wir können in jeder Sprache generieren. Was sprach­spezifisch ist: Persona-Schreib­regeln (z.B. Silben­trennung), Wissens­basis. Realistische Skalierung: zuerst D-A-CH (gemeinsame Sprache, ähnliche Schulsysteme), dann englisch­sprachiger Raum.

**Q: Exit-Strategie?**

> Aktuell nicht der Fokus — wir bauen ein nachhaltiges Bildungs­produkt, kein Schnellverkauf. Realistisch denkbar wären auf Sicht: strategischer Käufer im Schulbuch­verlags­bereich (Klett, Cornelsen) oder Bildungs­technologie (Cornelsen Experimenta, Sandbox-Holdings). Bis dahin wollen wir aber zuerst Wirksamkeit zeigen.

---

## Risiken (proaktiv ansprechen)

Wenn die Jury nicht fragt, *Sie* aber Vertrauen aufbauen wollen:

> Drei Risiken, die wir sehen:
>
> 1. **Akzeptanz im Schul­markt** — Schulen sind langsam, brauchen Vertrauen. Antwort: Pilot mit Forschungs­partner, peer-reviewte Ergebnisse, schritt­weiser Roll-out.
>
> 2. **Solo-Gründer-Risiko** — wir suchen aktiv Co-Founder:in und Beirat.
>
> 3. **LLM-Plattform­abhängigkeit** — Multi-Provider-Strategie, perspektivisch Open-Source-Modelle für Standard­last.
