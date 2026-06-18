# INSPIRED Landesentscheid — Ideenskizze Antworten

**Kategorie:** Forschende, Absolvent:innen & Externe
**Stand:** 2026-06-10 · **Sitz:** Mecklenburg-Vorpommern

Strukturierter Fließtext zu den 8 Fragen + Zusatzangaben.
Datenbasis: aktueller Pitch (`finanzierungs-pitch-v2.html`, `wettbewerbsanalyse-praesentation.html`, Pitch-PDF v4), Annahmen-MD (`Finanzen/geschaeftsplan-annahmen.md`), Vorrunden-Sieg Wismar.

---

## 1. Titel und Kurzbezeichnung

**Lesekumpel — neuroinklusive Lese-App für Grundschulkinder.**

Browserbasierte Plattform, die jede Geschichte automatisch an Leseniveau und neurodivergentes Verarbeitungsprofil (Standard, ADHS, Autismus-Spektrum, LRS) anpasst. Sitz in Mecklenburg-Vorpommern, Plattform live unter [lesekumpel.de](https://lesekumpel.de), erster Pilot an einer Grundschule auf der Insel Poel.

---

## 2. Beschreibung der Geschäftsidee & der Innovation

**Was wir bauen.** Lesekumpel ist eine Web-Plattform für Kinder im Grundschulalter, die Texte zur Leseförderung über eine KI-Pipeline individualisiert generiert. Aus einem Geschichtskonzept entstehen automatisch zwanzig Varianten — fünf Lesestufen multipliziert mit vier Verarbeitungsprofilen. Damit erhält jedes Kind die Version, die zu seinem aktuellen Können und zu seinem Nervensystem passt. Die Pipeline läuft auf einer serverlosen Architektur (statische Website auf GitHub Pages, N8N-Workflow, LLM-API) mit aktuellen Marginalkosten von rund 12 Cent je Geschichte und ist seit Mai 2026 produktiv. Über Modellwechsel und Caching-Effekte planen wir die Story-Kosten ab Phase 3 auf 7 Cent zu senken.

**Drei Innovationsachsen, die zusammen den Wettbewerbsvorsprung bilden.**

*Erstens: doppelte Adaption pro Geschichte.* Klassische Leseförderung nivelliert ausschließlich über Schwierigkeit. Lesekumpel nivelliert parallel über Schwierigkeit und über Verarbeitungsstil. Ein ADHS-Profil bekommt kurze Absätze mit Cliffhanger-Logik, ein Autismus-Profil bekommt sachliche Sprache mit expliziten Emotions-Markern und ohne ironische Doppeldeutigkeit, ein LRS-Profil bekommt rhythmische Kurzsätze und optionale Silbenhilfen. Diese Regeln sind in versionierten Persona-Systemprompts kodifiziert und basieren auf etablierter Lese- und Sonderpädagogik-Forschung (u. a. Schulte-Körne, Klicpera, IQB-Bildungsstandards).

*Zweitens: generativer Content statt statischer Bibliothek.* Etablierte Anbieter wie Antolin (121.000 Quiz-Titel, Marktführer seit 25 Jahren), Onilo oder Polylino arbeiten mit lizenzierten Verlagskatalogen. Das ist hochwertig, aber starr — eine neue Boardstory bei Onilo durchläuft Lizenz-, Illustrations- und Animationsstufen über Monate. Unsere Pipeline produziert eine fertige, geprüfte Geschichte in unter zwei Minuten. Das senkt die Hürde für Themenvielfalt vom Verlagsvertrag auf den Wunsch eines einzelnen Kindes.

*Drittens: Eltern als zahlende Zielgruppe statt Schulträger.* Polylino verkauft ausschließlich an Schulträger, Antolin nach eigener Aussage „explizit nicht an Eltern". Die meisten Wettbewerber sind auf das B2B-Schulgeschäft optimiert, weil dort die größeren Einzelumsätze liegen — aber dort liegt eben auch die längste Vertriebszyklus-Dauer. Wir bauen umgekehrt: Familienpaket Premium 6,99 €/Monat als primäres Produkt, Pro-Account für Lehrkräfte 19,99 €/Monat als ergänzende Schiene. Eltern entscheiden in Tagen, Schulträger in Schuljahren — und der Eltern-Markt liegt strukturell frei.

**Warum die Nische geschützt ist.** Unser Markt sind die rund 25 Prozent Grundschüler, die nicht sicher lesen — im DACH-Raum etwa 1,5 Millionen Kinder, in Mecklenburg-Vorpommern allein rund 20.000 Kinder mit erkanntem Leseförderbedarf. Für Marktführer wie Antolin wäre eine konsequente Neurotyp-Differenzierung ein Eingriff in das bestehende Produkt: Quiz-Logik, Bibliotheks-Indexierung und Verlagsbeziehungen müssten überarbeitet werden. Das ist das klassische Innovator's Dilemma — die Stärken von gestern blockieren den Schritt von heute. Auch eKidz, das wissenschaftlich fundierte Lesediagnose-Tool mit Backing der Universität Regensburg, ist positionell verriegelt: Wer Kindern Diagnostik verkauft, kann nicht gleichzeitig glaubwürdig Selbstwirksamkeit anbieten. Google Read Along zeigt drittens, dass die Konzept-Blaupause technisch funktioniert (neun Sprachen, on-device-Spracherkennung) — aber Deutsch ist nicht dabei, weil der deutschsprachige Markt für Google strategisch zu klein ist. Damit bleibt eine konkret beschreibbare Lücke: deutschsprachig, neurotyp-differenziert, B2C-First.

**Markenkern „Anders Lesen".** Über die produktseitige Innovation hinaus positionieren wir uns bewusst außerhalb des klassischen Schulsystems. Viele neurodivergente Kinder und ihre Familien fühlen sich vom Regelangebot nicht erreicht. Diese Positionierung können etablierte Wettbewerber nicht spiegeln, weil ihr Geschäftsmodell auf der Bestätigung durch die Institution Schule beruht — wir liegen außerhalb dieser Abhängigkeit.

**Vom Lesekumpel zum Lernkumpel.** Die Persona-Engine ist nicht auf Lesen beschränkt. Ab Jahr 3 erweitern wir um Sprachen einschließlich Deutsch-als-Zweitsprache (verdoppelt den adressierbaren Markt und öffnet B2B-Schulkanäle über DaZ-Programme), ab Jahr 4 um Mathematik als drittes Lernfeld. Aus dem Lesekumpel wird der mehrsprachige Lernkumpel — eine Produkt-Erweiterung auf derselben technischen Basis, ohne zweite Plattform und ohne zweites Vertriebs-Setup.

**Standortbeitrag Mecklenburg-Vorpommern.** Die Firma wird in MV gegründet, das Team arbeitet in MV, der erste Schul-Pilot läuft auf Poel. Bildungspolitisch ist das mehr als ein Sitz-Zufall: MV liegt bei zentralen Bildungsindikatoren bundesweit im hinteren Drittel, eine evidenzbasierte digitale Leseförderung mit Wirksamkeitsbeleg ist hier strukturell überfällig. Wir planen Forschungskooperationen mit den Universitäten Rostock und Greifswald (Wirksamkeitsstudie ab Q4 2027) und schaffen über fünf Jahre zehn qualifizierte Arbeitsplätze in MV — verteilt auf Gründungsteam, Entwicklung, Content, Sprachen-/Mathe-Didaktik, Marketing und Customer Success.

---

## 3. Kundennutzen

Wir trennen bewusst zwischen Nutzenden und zahlenden Kunden, weil sich die Wertversprechen unterscheiden.

**Nutzende sind die Kinder.** Sie bekommen Geschichten, in denen sie sich wiederfinden — von ihren Interessen (Minecraft, Tiere, Sport) bis zu konkreten Anlässen (Sportfest, Klassenausflug). Sie lesen in ihrem Tempo, ohne Wettkampf- und ohne Belohnungsdruck. Der Lese-Erfolg ist nicht das Ergebnis externer Gamification, sondern entsteht aus Identifikation und Passung. Im Schulalltag löst das ein konkretes Problem: heterogene Klassen brauchen heute Differenzierungsmaterial in vier bis fünf Varianten, das Lehrkräfte sonst selbst zusammenstellen müssen.

**Zahlende Kunden sind die Eltern und die Lehrkräfte.**

*Eltern* zahlen 6,99 € pro Monat für das Familienpaket Premium mit vier Kinderkonten und einem Kontingent von zwanzig Stories pro Monat. Sie lösen damit drei Probleme gleichzeitig: den Vorlese-Frust am Abend, die Suche nach passendem Material für ihr Kind und die Furcht vor Werbung und Tracking, die in vielen kostenlosen Apps systemisch verankert sind. Der Preis liegt klar unter der Eltern-Schmerzgrenze (populäre Lern-Apps im DACH-Raum kosten 9 bis 20 € pro Monat — Sofatutor 19,95 €, Scoyo 14,99 €, Knowunity 12,99 €).

*Lehrkräfte* zahlen 19,99 € pro Monat für den Pro-Account mit dreißig Schülerplätzen und vierzig­fünf Stories pro Monat. Sie sparen Differenzierungsaufwand und können Heterogenität ohne zusätzliche Vorbereitung adressieren. Im Vergleich zur Antolin-Schullizenz (rund 240 € pro Jahr) liegt unser Pro-Account preislich darunter und bietet aktiv generierten Content statt Quiz zu vorhandenen Büchern.

**Sekundär: Therapie- und Förderpraxen.** Logopädie, Ergotherapie und Lerntherapie sind ein erweitertes B2B-Segment ab Phase 3. Hier ist die Zahlungsbereitschaft hoch (LRS-Software kostet heute 50 bis 200 € pro Jahr) und der Bedarf nach individualisiertem, frustfreiem Material besonders groß — eine logische Erweiterung, sobald das Basisprodukt validiert ist.

---

## 4. Marktpotential und Perspektiven

**Markt und Wachstumstreiber.** Der EdTech-Markt in Deutschland ist mit rund 4 Milliarden Euro Jahresumsatz etabliert; Apps zur Leseförderung sind innerhalb dieses Marktes eine etablierte Kategorie. Im DACH-Raum sehen wir eine adressierbare Zielgruppe von rund 1,5 Millionen Grundschüler:innen mit Leseschwäche (Quelle: IQB-Bildungstrend 2021). Der Bedarf wächst messbar: Pro Grundschulklasse rechnen Fachgesellschaften 2026 mit zwei bis drei neurodivergenten Profilen, 2031 mit drei bis vier, 2036 mit vier bis fünf — die heutige Nische wird zum Standard, und Schulen werden Material brauchen, das diese Heterogenität konsequent adressiert.

**Wettbewerb.** Wir haben acht Anbieter detailliert analysiert (Anhang Wettbewerbsanalyse). Direkte Wettbewerber im Lesefeld sind Onilo (Boardstories für die digitale Tafel, B2B-Schule), eKidz (KI-Lese-Diagnose mit Uni-Regensburg-Backing, B2B-Schule) und Antolin (Quiz-Bibliothek, Quasi-Standard in deutschen Grundschulen seit 25 Jahren, B2B-Schule). Indirekt konkurrieren wir mit Polylino (Hörbücher zum Mitlesen, 70+ Sprachen, B2B-only), Leseludi (Onboarding ins Lesen, komplementär), CLELO (Hardware-Leselerngerät, 279 € einmalig), ANTON (Allzweck-Lern-App, 10 Millionen Downloads) und international mit Google Read Along (neun Sprachen, kein Deutsch). Drei unbesetzte Lücken heben sich aus dieser Landschaft klar ab und definieren unsere Positionierung: erstens dynamische Identifikation durch generierte Geschichten statt statischer Bibliotheken, zweitens konsequenter Fokus auf LRS, ADHS und Autismus statt Generalisierung, drittens Eltern als primäre Zielgruppe statt Schulträger.

**Chancen.** Die KI-Pipeline skaliert nahezu linear bei niedrigen Marginalkosten. Die Lernfeld-Expansion (Sprachen ab Jahr 3, Mathe ab Jahr 4) verdreifacht den adressierbaren Markt ohne zweite Plattform. Die DaZ-Erweiterung öffnet zudem den schulischen B2B-Kanal über Migrations- und Integrationsprogramme — ein bildungspolitisch gestützter, wachsender Markt. Eine Wirksamkeitsstudie an MV-Pilotschulen in Kooperation mit den Universitäten Rostock oder Greifswald (Setup Q4 2027) ist ein realistischer nächster Schritt zur wissenschaftlichen Validierung und zur Erschließung von Bildungs-Fördermitteln.

**Risiken — nüchtern adressiert.** Wir sehen drei wesentliche Risiken. Erstens die KfW-Tranche in Jahr 3, die liquiditätskritisch ist; wir mitigieren über eine Mikrokredit-Aufstockung in Jahr 2 und ein externes Teilzeit-Standbein der Gründer in den Jahren 1 und 2, das eine wirtschaftliche Null-Existenz-Situation ausschließt. Zweitens die langsame Adoption im Schulmarkt (Datenschutz, Beschaffungsprozesse); wir mitigieren über B2C-First und ziehen die Schullizenz erst nach validiertem Eltern-Produkt hoch. Drittens ein möglicher Vorstoß eines Marktführers in unsere Nische; das halten wir aus strukturellen Gründen für unwahrscheinlich (Innovator's Dilemma, siehe Abschnitt 2), kalkulieren aber konservativ.

---

## 5. Entwicklungsstand des Produkts

**Aktueller Stand (Q2 2026).** Die Plattform ist live unter [lesekumpel.de](https://lesekumpel.de). Aktuell laufen rund 70 Geschichten in fünf Skill-Personas (Pip Punkt für 20-Wörter-Einstieg bis Finja Feder für 250–400 Wörter) und vier Neurotyp-Varianten, ergänzt um vier Bonus-Personas mit fixem Stil. Eine erste Pilot-Klasse an der Grundschule Poel nutzt das System bereits regelmäßig — Zitat der Sonderpädagogin: „Tim haben Sie schon zum Leser gemacht."

**Meilensteinplanung in Quartalen.**

| Quartal | Phase | Meilenstein |
|---------|-------|-------------|
| Q3 2026 | MVP-Konsolidierung | Eltern-Konto · Fortschrittsanzeige · Schul-Dashboard MVP |
| Q4 2026 | Vorbereitung | Wirksamkeitsstudie-Setup mit Uni Rostock/Greifswald · AGB/DSGVO-Komplettierung |
| Q1 2027 | **Aufbau-Phase** | Start MVP-Entwicklung mit 2.000 € Eigenmitteln · nebenberuflich |
| Q3 2027 | Aufbau-Abschluss | MVP fertig · erste Eltern-Beta · Spracherkennung-MVP |
| Q1–Q2 2028 | **Validierung** | Gründung GbR (MV) · 30.000 € Mikrokredit · Ziel 500+ zahlende Nutzer · EBIT ≈ 0 |
| Q3–Q4 2028 | Skalierungs-Vorbereitung | Umwandlung in UG · 100.000 € KfW-Gründerkredit · Produkterweiterung Sprachen + DaZ |
| 2029 | **Skalierung** | 2.500+ Premium-Nutzer · Schul-B2B-Kanal über DaZ · Op-Marge nach Personal noch negativ, durch KfW-Tranche abgedeckt |
| 2030 | **Break-Even** | Mathe als drittes Lernfeld · 6.000+ Nutzer · Op-Marge nach Personal +95 k € |
| ab Mitte 2030 | **Etablierung** | Vollzeit-Geschäftsführung · 10.000+ Nutzer · 943 k € Umsatz · 267 k € Liquidität · 6 weitere Arbeitsplätze in MV |

**Sicherung des Wettbewerbsvorsprungs.** Erstens über die kontinuierliche Pflege und Weiterentwicklung des Persona-Prompt-Systems als versioniertes Knowledge-Asset, das mit jeder Iteration besser wird. Zweitens über die evidenzbasierte Wissensdatenbank, die wir parallel aufbauen und perspektivisch in einen Eltern-Beratungs-Chatbot überführen. Drittens über die Marken-Glaubwürdigkeit „Anders Lesen", die nicht imitierbar ist — sie ruht auf der biografischen Authentizität des Gründerteams und der Verankerung in regionalen Selbsthilfe-Strukturen. Markenrechtliche Sicherung läuft (DPMA-Wortmarke „Lesekumpel" angemeldet, AfA-Position im operativen Plan abgebildet).

---

## 6. Kapitalbedarf und Umsetzung

**Gesamtkapitalbedarf 132.500 €** über fünf Jahre, gestaffelt in drei klassische Mittelstands-Finanzierungstranchen — bewusst ohne Beteiligungskapital. Diese Entscheidung ist nicht reflexhaft, sondern strategisch: Bei einer Produktvision, die explizit kein „Move fast and break things"-Geschäft ist, sondern auf evidenzbasierte Leseförderung für vulnerable Kinder zielt, würden VC-typische Wachstumsanforderungen mit der Sorgfaltspflicht im Produktentwicklungsprozess kollidieren. Wir wollen den Lesekumpel über die nächsten zehn Jahre tragen, nicht in fünf Jahren verkaufen.

**Finanzierungs-Tranchen:**

- **2.500 €** Eigenmittel zum Start der Aufbau-Phase (Q1 2027)
- **30.000 €** Mikrokredit, gestaffelt (10.000 € zum Start der Validierungs-Phase, 20.000 € Aufstockung nach sechs erfolgreichen Tilgungen) — anschlussfähig an den Mikromezzanin-Fonds Deutschland bzw. den MV-Mikrokredit
- **100.000 €** KfW-Gründerkredit (5 % p. a. fix, 10 Jahre Laufzeit, 2 Jahre tilgungsfrei) — Auszahlung Q3 2028, Antragstellung mit Hausbank in MV

Die kumulierten Kreditkosten liegen bei rund 44.300 € über die ersten fünf Jahre und werden ab Jahr 4 vollständig aus dem operativen Cashflow getragen. Eine Bürgschaftsaufnahme über die Bürgschaftsbank Mecklenburg-Vorpommern für die KfW-Tranche wäre ein logischer Anschluss-Schritt; wir prüfen das aktiv in Vorbereitung der UG-Umwandlung.

**Endkundenpreise (brutto).**

| Produkt | Brutto-Preis | Marktvergleich |
|---------|--------------|----------------|
| **Familienpaket Premium** · 4 Kinderkonten · 20 Stories/Monat | **6,99 €/Monat** · 69 €/Jahr | unter Median DACH (Sofatutor 19,95 € · Scoyo 14,99 € · Knowunity 12,99 €) |
| **Pro-Account Lehrer** · 30 Schüler · 45 Stories/Monat | **19,99 €/Monat** · 199 €/Jahr | unter Antolin-Schullizenz (240 €/J) bei aktiv generiertem Content |
| **Multi-Sprach-Tier** · ab Phase 3 | 8,99 €/Monat | Premium-Erweiterung |
| **Kaffeekasse** · On-Demand, ohne Abo | 1 € pro 2 Credits | niedrigschwellig |

Bildungsmedien fallen unter den ermäßigten Mehrwertsteuersatz von 7 % (§ 12 UStG Abs. 2 Nr. 14), was die Marge gegenüber regulär besteuerten Wettbewerbern um zwölf Prozentpunkte verbessert. Die Schmerzgrenze deutscher Eltern für monatliche Lern-App-Abos liegt nach unserer Marktrecherche bei rund 10 € — mit 6,99 € liegen wir klar darunter, ohne in den Preisbrecher-Bereich (ANTON Plus 0,83 €/Monat über werbefinanziertes Modell) zu rutschen. Wir wollen nicht über Werbung und Tracking verdienen, sondern über das Produkt.

**Erwartete Endwerte nach fünf Jahren:** rund 7.500 zahlende Familien Premium, 2.200 Lehrer-Pro-Accounts, 943.000 € Brutto-Umsatz, 267.000 € Liquidität — aus 2.500 € Eigenmitteln plus 130.000 € Krediten, ohne Beteiligungskapital.

---

## 7. Marketing

**Vier-Kanal-Strategie mit klarer Funktion in der Customer Journey.**

*Kanal 1: Direkter Vertrieb an Lehrkräfte (Akquise, Phasen 1–2).* Wir starten in MV mit gezielter Ansprache von Grundschulen, Förderzentren und Sonderpädagogik-Lehrkräften. Der Bestands-Pilot in Poel ist unsere Referenz und Türöffner für Nachfolge-Schulen. Vorgehen: persönliche Termine, Demo-Stunden, drei kostenlose Monate Pro-Account als Einstieg. Ziel: 50 Lehrkräfte als Erstreferenz-Pool in den ersten zwölf Monaten nach MVP-Launch. Ab Phase 3 wird der Vertrieb über DaZ-Schulen und Förderzentren systematisch in den DACH-Raum erweitert.

*Kanal 2: SEO + User-Generated-Content-Loop (Skalierung, Phasen 2–4).* Jede generierte Geschichte ist potenzieller Long-Tail-SEO-Content („Lesegeschichte ADHS-freundlich Erstleser", „Geschichte über Minecraft für LRS"). Wir veröffentlichen einen kuratierten Anteil als öffentliche Bibliothek und ermutigen Eltern und Lehrkräfte, ihre Lieblings-Geschichten zu teilen. Damit entsteht ein selbstverstärkender Akquise-Kanal mit niedrigen variablen Kosten. CRM-Tooling ab Phase 2 (MailerLite), in Phase 4 Umstieg auf HubSpot.

*Kanal 3: Instagram + Eltern-Communities (Awareness).* Über die Leitung einer regionalen Selbsthilfegruppe für Eltern autistischer Kinder ist das Gründungsteam authentisch in der Zielgruppe verankert. Diese Verankerung tragen wir über Instagram in die breitere DACH-Community: Reels aus dem Familienalltag, Reposts aus der Story-Bibliothek, Eltern-Stimmen. Hashtag-Strategie um „Anders Lesen" und „Neuroaffirmatives Design". Saisonale Mediabudget-Verteilung: 35 % August/September (Schulbeginn), 25 % Februar/März (Halbjahres-Zeugnis), 40 % auf die übrigen acht Monate.

*Kanal 4: Discord (Retention).* Eine geschlossene Discord-Community für zahlende Eltern bindet die Kohorte langfristig: Wunsch-Themen für neue Geschichten, gegenseitiger Austausch, exklusive Beta-Features. Discord ist der natürliche Treffpunkt einer neurodivergenten Eltern-Community und reduziert Churn nachweislich, weil Bindung kommunikativ entsteht, nicht nur funktional.

**Markteintritt — die Marke trägt den Vertrieb.** Über alle Kanäle hinweg fahren wir denselben Marken-Kern: Kinder verweigern nicht das Lesen, sie verweigern Frust — der Lesekumpel ist der Freund, der den Frust nimmt. Diese Positionierung trägt Eltern-Sympathie, Lehrer-Anerkennung und politische Aufmerksamkeit für die Lese-Krise zugleich.

**Crowdfunding als Anschub-Option in Phase 1.** Eine Kickstarter- oder Startnext-Kampagne zum MVP-Launch (Q3 2027) ist eine sinnvolle Ergänzung zu den Eigenmitteln: Sie bringt Reichweite, validiert Zahlungsbereitschaft messbar und liefert eine erste Welle echter Premium-Kunden vor dem Marketingbudget der Validierungs-Phase. Ziel-Volumen 10.000 bis 20.000 €, eingesetzt für Hosting-Erweiterung, Spracherkennungs-Lizenzen und erste UGC-Kampagne. Die Selbsthilfegruppen-Anbindung und die Familien-Geschichte sind klassische Crowdfunding-Stärken.

---

## 8. Persönliche Motivation und Qualifikation

**Auslöser.** Wir bauen Lesekumpel, weil wir das Problem aus dem eigenen Familienalltag kennen. Unser Sohn Mats ist zehn Jahre alt, Autist mit ADHS. Klassische Schulmaterialien und etablierte Lern-Apps haben uns nicht weitergebracht — sie haben den Frust verstärkt. Der erste reproduzierbare Lernerfolg entstand, als wir angefangen haben, mit ChatGPT eigene Texte zu generieren, die zu seinem Können und seinen Interessen passten. In diesem Moment war klar: Das Werkzeug ist verfügbar, es fehlt eine Form, die andere Familien ohne technisches Vorwissen nutzen können. Parallel leiten wir eine regionale Selbsthilfegruppe für Eltern autistischer Kinder und wissen aus mehreren Dutzend Familienkontakten, dass Mats kein Einzelfall ist.

**Team — drei Gründer mit zusammen 47 Jahren einschlägiger Berufserfahrung.**

*Antje, UX-Research, Coach und Produktstrategin (17 Jahre Erfahrung).* Verantwortlich für User-Research mit Kindern, Eltern und Lehrkräften, didaktisch-empathisches Interface-Design und Produkt-Roadmap. Hintergrund in agiler Produktentwicklung und systemischem Coaching.

*Raik, Produktmanager und Marketing (16 Jahre Erfahrung).* Verantwortlich für Geschäftsmodell, Vertrieb, Akquise und Stakeholder-Kommunikation. Tiefes Branchenwissen aus Skalierungs-Projekten im B2B- und B2C-Digital-Umfeld.

*Marten, Full-Stack-Entwickler und KI-Engineer (14 Jahre Erfahrung).* Verantwortlich für die technische Plattform, die KI-Content-Pipeline, die Persona-Systemprompts und die Bilderpipeline. Praktische Tiefe in LLM-Integration und serverlosen Architekturen.

**Offene Position: Pädagogik / Sonderpädagogik.** Wir besetzen aktiv eine vierte Position mit didaktisch-sonderpädagogischem Schwerpunkt — idealerweise mit Erfahrung in inklusiver Grundschuldidaktik oder Lerntherapie. Bis zur Besetzung arbeiten wir mit externen Beratern aus dem Selbsthilfe- und Lehrkraft-Netzwerk.

**Warum INSPIRED.** Wir bauen den Lesekumpel ohne Beteiligungskapital, mit konservativen Annahmen und einem mehrjährigen Aufbauplan. Der Vorrunden-Sieg in Wismar war für uns die erste externe Validierung — der Landesentscheid in Rostock ist die zweite. Wir sehen INSPIRED nicht primär als Finanzierungsquelle, sondern als Hebel für drei konkrete Anliegen: Sichtbarkeit der Lesekrise in MV, Anschluss an die regionale Wirtschaftsförderung und an die Universitäten Rostock und Greifswald für die Wirksamkeitsstudie, sowie qualifiziertes Mentoring im Bildungs-B2B-Vertrieb für die Skalierungsphase ab Jahr 3.

---

## Zusätzliche Angaben

### A) Mentor aus Wirtschaft und/oder Wissenschaft

Wir befinden uns in aktiver Mentor-Akquise und planen die Besetzung in der Rock-it Week. Wunschprofile: eine wissenschaftliche Mentorin aus der Leseforschung an der Universität Rostock oder Greifswald (Anschluss an die geplante Wirksamkeitsstudie), eine erfahrene Grundschullehrkraft mit inklusiver Praxis (Produkt-Sparringspartner), sowie eine Mentorin aus dem EdTech- oder Bildungsverlagsumfeld mit B2B-Schul-Vertriebserfahrung (Skalierungs-Phase ab Jahr 3).

### B) Teilnahme an anderen Ideenwettbewerben

**INSPIRED Vorrunde Wismar (Externe-Kategorie) — gewonnen, Mai 2026.** Damit Qualifikation für den Landesentscheid in Rostock.

Weitere Wettbewerbsteilnahmen 2026: keine. Wir konzentrieren uns bewusst auf den Produktaufbau statt auf Award-Hopping. Produkt-Awards (TOMMI, Comenius-EduMedia, GIGA-Maus) und Wirkungs-Preise (Deutscher Lesepreis) planen wir gezielt ab 2027/2028 mit dann verfügbaren Wirksamkeits-Daten.

---

**Verfügbare Belege auf Anfrage:** vollständige Pitch-Präsentation (39 Folien, davon 26 mit Finanz- und Wettbewerbsdetails) · live Plattform unter [lesekumpel.de](https://lesekumpel.de) · operativer Geschäftsplan mit Monatswerten über 60 Monate · Persona-Übersicht · Wissensdatenbank-Architektur · DACH-2026-Marktpreis-Tabelle für Kinder-Lern-Apps.
