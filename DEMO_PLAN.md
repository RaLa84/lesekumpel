# Demo-Seite: Neuroinclusive Lesetexte

## Ziel
Eine interaktive Demo-Seite (`demo.html`) zeigt dieselbe Geschichte in verschiedenen **Lesestufen** und **Autoren-Personas**. Jede Persona ist von Grund auf für einen Neurotyp konzipiert — Kinder wählen "ihren" Autor, ohne zu wissen dass sie damit die passende Anpassung wählen.

Zielgruppe der Demo: Eltern, Lehrkräfte, Förderfachpersonen.

Die bestehenden Personas (Jonas, Holzi, Deniz, Samira) werden **nicht** verwendet — sie bleiben für den normalen Katalog.

---

## Die 5 neuen Demo-Personas

Jede Persona trägt die neurotyp-spezifischen Schreib-Eigenschaften von Natur aus in sich. Die Stimme bleibt konstant — die Komplexität wächst mit der Lesestufe.

### Lea Lesestark · Standard/NT
- **Stimme:** Warm, direkt, neugierig — klassische Kinderbucherzählerin
- **Schreibeigenschaften:** Ausgewogene Satzlänge, lebendige Handlung, gelegentliche Metaphern erlaubt, leichtes Augenzwinkern

### Timo Taktschritt · LRS/Legasthenie
- **Stimme:** Rhythmisch, musikalisch, gleichmäßig — immer im Beat
- **Schreibeigenschaften:** 1–2-silbige Wörter bevorzugt, kein Genitiv ("das Haus von der Katze"), keine Konjunktionshäufung, Absatz-Break alle 2–3 Sätze, klangvolle Satzenden

### Zara Zapp · ADHS
- **Stimme:** Energetisch, schnell, immer in Bewegung
- **Schreibeigenschaften:** Erster Satz = sofortige Action, max. 2 Sätze pro Absatz, Mini-Cliffhanger am Abschnittsende, aktive Verben, kein beschreibender "Sumpf"

### Leo Klartext · Autismus-Spektrum (ASS)
- **Stimme:** Präzise, zuverlässig, ehrlich — sagt genau was er meint
- **Schreibeigenschaften:** Keine Metaphern/Idiome, Gefühle explizit benannt ("Er war wütend, weil..."), Figurenmotivationen direkt erklärt, linearer Aufbau, keine Doppeldeutigkeit

### Mia Brücke · Deutsch als Zweitsprache (DaZ)
- **Stimme:** Einladend, geduldig, bildhaft — erklärt die Welt als wäre alles neu
- **Schreibeigenschaften:** Kein Passiv, keine Komposita (aufteilen), keine kulturellen Referenzen, schwierige Wörter inline erklärt ("der Döner — das ist Fleisch in Brot")

---

## Gamification: Autoren-Unlock (RPG-Mechanik)

Kinder starten mit Lea Lesestark. Weitere Autoren werden durch Lesefortschritt freigeschaltet — wie Charaktere in einem Rollenspiel. Gesperrte Autoren erscheinen als Silhouette.

| Stufe | Freigeschaltet |
|---|---|
| Stufe 1 | Lea Lesestark + Mia Brücke (immer verfügbar) |
| Stufe 3 | + Timo Taktschritt + Zara Zapp |
| Stufe 5 | + Leo Klartext |

**UX-Regeln:**
- Silhouette zeigt Namen + "🔒 Freigeschaltet auf Stufe X"
- Tooltip: "Lies noch X Seiten um Timo freizuschalten!" — motivierend, nicht als Fehler
- Max. 1 gesperrter Charakter der "gleich" kommt sichtbar machen

**Produkt-Vision (nicht in Demo):** Autor "levelt auf" mit dem Kind — Avatar ändert sich, persönliche Nachricht ("Ich bin so stolz auf dich!"). Leo Klartext kündigt seinen Unlock im Voraus an (ASS-freundlich: keine Überraschungen).

---

## Die 3 Demo-Geschichten

| # | Titel | Genre |
|---|---|---|
| 1 | Die Katze klaut einen Döner | Humor/Alltag |
| 2 | Mein Haus in Minecraft | Gaming/Tech |
| 3 | Warum mein Bruder ein Alien ist | Familie/Fantasie |

---

## Die Matrix: 3 Stufen × 5 Personas

### Stufe 1 — "Der Start" (Phase 1.0, Klasse 1 Anfang)
Textregeln: Max. 5 Wörter/Satz · Top-100-Wörter · Präsens · SPO

| Persona | Verfügbar | Hinweis |
|---|---|---|
| Lea Lesestark | ✅ | Basisversion |
| Timo Taktschritt | 🔒 Stufe 3 | Text zu minimal, Rhythmus-Anpassung wirkungslos |
| Zara Zapp | 🔒 Stufe 3 | Kein Raum für Action-Pacing |
| Leo Klartext | 🔒 Stufe 5 | Text bereits literal genug |
| Mia Brücke | ✅ | Anderes Vokabular, keine "Döner"/"Minecraft"-Referenzen |

→ **2 Versionen**

### Stufe 3 — "Der Fluss" (Phase 3.4, Klasse 2 Ende)
Textregeln: 80–100 Wörter · Konjunktionen · einfache Nebensätze · Präteritum

| Persona | Verfügbar | Besonderheiten |
|---|---|---|
| Lea Lesestark | ✅ | Altersgerechtes Niveau |
| Timo Taktschritt | ✅ | Silbenrhythmus, gleichmäßige Sätze |
| Zara Zapp | ✅ | Sofort-Action, kurze Absätze |
| Leo Klartext | 🔒 Stufe 5 | Ironie/Metaphern tauchen erst ab Stufe 5 dominant auf |
| Mia Brücke | ✅ | Kein Passiv, keine Komposita, Bildvokabular |

→ **4 Versionen**

### Stufe 5 — "Der Profi" (Phase 5.3, Klasse 3–4)
Textregeln: 200–300+ Wörter · Abstrakta · Gefühle · Innenperspektive · Idiome

| Persona | Verfügbar | Besonderheiten |
|---|---|---|
| Lea Lesestark | ✅ | Volle sprachliche Tiefe |
| Timo Taktschritt | ✅ | Rhythmus, Absatz-Breaks, keine langen Komposita |
| Zara Zapp | ✅ | Cliffhanger, kurze Kapitel, hohes Tempo |
| Leo Klartext | ✅ | Literal, Gefühle explizit, keine Metaphern |
| Mia Brücke | ✅ | Einfachstes Deutsch, Glossar-Einschübe |

→ **5 Versionen**

**Gesamt: 3 Geschichten × 11 Versionen = 33 Texte**

---

## KI-Prompts zur Texterstellung

Pro Version: **Persona als Systemrolle** + Stufen-Regeln + Titelangabe

**Beispiel — Katze & Döner, Stufe 3, Zara Zapp:**
```
System: Du bist Zara Zapp, eine Kinderbuchautorin die immer in Bewegung ist.
Du erzählst Geschichten so als wärst du dabei. Deine Regeln:
- Erster Satz = sofortige Action
- Max. 2 Sätze pro Absatz
- Jeder Abschnitt endet mit Überraschung oder Frage
- Aktive Verben, keine langen Beschreibungen

User: Schreib "Die Katze klaut einen Döner" auf Stufe 3:
- 80–100 Wörter gesamt
- Konjunktionen erlaubt (weil, aber, denn)
- Einfache Nebensätze OK
- Präteritum
```

**Beispiel — Katze & Döner, Stufe 5, Leo Klartext:**
```
System: Du bist Leo Klartext, ein Kinderbuchautor der immer genau das sagt was er meint.
Deine Regeln:
- Keine Metaphern oder Redewendungen (nicht "das Herz rutschte ihm in die Hose")
- Gefühle immer direkt benennen: "Er war wütend, weil..."
- Figurenmotivationen klar erklären
- Kein Sarkasmus, keine Ironie
- Linearer Aufbau: was passiert zuerst, dann was folgt

User: Schreib "Die Katze klaut einen Döner" auf Stufe 5:
- 200–250 Wörter
- Innenperspektive erlaubt (wenn klar markiert)
- Abstrakta und Gefühle einbauen
```

---

## Dateistruktur (33 Dateien)

```
demo-texte/
  katze-doener-stufe1-lea.html
  katze-doener-stufe1-mia.html
  katze-doener-stufe3-lea.html
  katze-doener-stufe3-timo.html
  katze-doener-stufe3-zara.html
  katze-doener-stufe3-mia.html
  katze-doener-stufe5-lea.html
  katze-doener-stufe5-timo.html
  katze-doener-stufe5-zara.html
  katze-doener-stufe5-leo.html
  katze-doener-stufe5-mia.html

  minecraft-stufe1-lea.html
  minecraft-stufe1-mia.html
  minecraft-stufe3-lea.html
  minecraft-stufe3-timo.html
  minecraft-stufe3-zara.html
  minecraft-stufe3-mia.html
  minecraft-stufe5-lea.html
  minecraft-stufe5-timo.html
  minecraft-stufe5-zara.html
  minecraft-stufe5-leo.html
  minecraft-stufe5-mia.html

  alien-bruder-stufe1-lea.html
  alien-bruder-stufe1-mia.html
  alien-bruder-stufe3-lea.html
  alien-bruder-stufe3-timo.html
  alien-bruder-stufe3-zara.html
  alien-bruder-stufe3-mia.html
  alien-bruder-stufe5-lea.html
  alien-bruder-stufe5-timo.html
  alien-bruder-stufe5-zara.html
  alien-bruder-stufe5-leo.html
  alien-bruder-stufe5-mia.html
```

---

## demo.html — UI-Konzept

```
┌─────────────────────────────────────────────────────────┐
│  📚 Lesekumpel — Adaptive Lesetexte Demo                │
├─────────────────────────────────────────────────────────┤
│  SCHRITT 1: Geschichte                                   │
│  [🐱 Katze & Döner]  [🎮 Minecraft]  [👽 Alien-Bruder] │
│                                                          │
│  SCHRITT 2: Lesestufe                                    │
│  [Stufe 1: Anfänger]  [Stufe 3: Mittelstufe]  [Stufe 5: Profi] │
│                                                          │
│  SCHRITT 3: Dein Autor                                   │
│  [Lea Lesestark ✅]  [Timo Taktschritt 🔒]              │
│  [Zara Zapp 🔒]      [Leo Klartext 🔒]  [Mia Brücke ✅] │
│                                                          │
│  ┌──────────────────────────────────────────────────┐   │
│  │  👤 Lea Lesestark  ·  Stufe 3                   │   │
│  │  ─────────────────────────────────────────────  │   │
│  │  Die Katze sah den Döner.                        │   │
│  │  Er roch so gut, dass ihr Herz schneller schlug. │   │
│  │  Sie schlich sich heran...                       │   │
│  └──────────────────────────────────────────────────┘   │
│                                                          │
│  [Fachpersonen-Ansicht: Neurotyp-Labels einblenden]     │
│  [↔ Vergleich: Lea vs. aktueller Autor]                 │
└─────────────────────────────────────────────────────────┘
```

**Fachpersonen-Toggle zeigt zusätzlich:**
- Neurotyp-Zuordnung der Persona
- Pädagogische Begründung für Unlock-Stufe

---

## Umsetzungsschritte

- [ ] 33 Texte generieren (Claude-Prompts nach obigem Schema)
- [ ] `demo-texte/` anlegen und HTML-Dateien einpflegen
- [ ] `demo.html` bauen: 3-stufiger Selektor im Lesekumpel-Design
- [ ] Unlock-Silhouetten mit Tooltip implementieren
- [ ] Fachpersonen-Toggle implementieren
- [ ] Side-by-Side Vergleich (Lea ↔ anderer Autor)
- [ ] `index.html` — Demo-Link ergänzen
- [ ] Mobil-Test (768px Breakpoint)
- [ ] Playwright-Screenshot Desktop + Mobile
