# Spielformate & Interaktive Features — Konzept

> **Status:** Ideensammlung · noch nicht implementiert
> **Stand:** 2026-04-17

## Bestehend

Aktuell: **Quiz** — 3 Multiple-Choice-Fragen pro Story, vom LLM mitgeneriert, als JSON ins Template injiziert.

---

## Geplante Spielformate

### Wort-/Satzebene

- **Lückenwörter** — Schlüsselwörter entfernt, Kind wählt aus 3 Optionen. Testet Worterkennung + Kontext.
- **Wörter-Sortieren** — 5-6 Wörter per Drag&Drop in richtige Reihenfolge ("Was passierte zuerst?"). Gut für ADHS (kurz, haptisch).
- **Wort-Memory** — Paare aus Wort + Bedeutung aufdecken. Nutzt vorhandenes `dictionary`-Feld.

### Inhaltlich/kreativ

- **Richtig oder Falsch** — Aussagen zum Text, Kind wischt/tippt. Niedriger Einstieg, ideal für LRS.
- **Wer sagt was?** — Dialogzitate den Figuren zuordnen. Passt zu Stella Stimmenreich.
- **Geschichte weitererzählen** — 3 mögliche Fortsetzungen, kein richtig/falsch. Fördert Kreativität.
- **Bilder-Reihenfolge** — Illustrationen in richtige Reihenfolge bringen (nur bei Stories mit Bildern).

### Gamification

- **Wort-Schatzsuche** — "Finde 3 Wörter die mit Essen zu tun haben." Kind tippt im Text. Fördert Rücklesen.
- **Emoji-Stimmung** — "Wie fühlte sich Patrick hier?" Kind wählt Emoji. Gut für Autismus-Profil (Emotionserkennung).

---

## KI-Integration

- **Story weiterspinnen mit KI** — Button in der Story-Seite, der den Text an einen KI-Chatbot übergibt, um die Geschichte interaktiv fortzusetzen. Optionen: eigener eingebetteter Chat (Claude API, kindgerecht, persona-konform) oder Prompt-Export in Zwischenablage für Eltern. Eigener Chat bevorzugt wegen Zielgruppe 5-10 (externe Chatbots haben Mindestalter 13+).

---

## Umsetzungs-Priorität

**Spielformate:** Am einfachsten: **Richtig/Falsch**, **Lückenwörter**, **Wer sagt was?** — können wie das Quiz vom LLM mitgeneriert und als JSON ins Template injiziert werden.

**KI-Integration:** Eigener Story-Chat erfordert Backend (Claude API) — erst sinnvoll wenn RAG-Chatbot-Infrastruktur steht.

## Umsetzungs-Strategie

Spielformate: LLM-Generierung im n8n-Workflow (wie `quizData`), JSON-Injektion ins Story-Template. Mehr interaktive Formate erhöhen Engagement und trainieren unterschiedliche Lese-Kompetenzen je nach Neurotyp. KI-Chat fördert Kreativität, baut auf RAG-Infrastruktur auf.
