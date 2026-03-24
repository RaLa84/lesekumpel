# Leseapp Konzeption - "LeseFreund"

## 1. Projektübersicht

### Vision
Eine kindgerechte **Web-App** (Progressive Web App), die Kinder spielerisch beim Lesenlernen begleitet, durch KI-gestützte Spracherkennung Feedback gibt und Erfolgserlebnisse schafft. Die App läuft im Browser auf allen Geräten (Smartphone, Tablet, Desktop) ohne App-Store-Installation.

### Zielgruppe
- Primär: Kinder im Alter von 5-10 Jahren (Leseanfänger bis Fortgeschrittene)
- Sekundär: Eltern als Begleitpersonen

### Plattform-Strategie
**Web-App (Progressive Web App)**
- ✅ Läuft im Browser (Chrome, Safari, Edge, Firefox)
- ✅ Funktioniert auf Smartphone, Tablet, Desktop
- ✅ Kein App-Store-Download nötig
- ✅ Automatische Updates (kein manuelles Update)
- ✅ Kann wie eine App auf Homescreen installiert werden
- ✅ Ein Codebase für alle Plattformen
- ✅ Schnellere Entwicklung, geringere Kosten

**Warum keine native App?**
- Schnellere Time-to-Market
- Keine App-Store-Genehmigung nötig (Apple streng bei Kinder-Apps)
- Günstigere Entwicklung (eine Codebasis statt iOS + Android)
- Einfachere Updates (kein Review-Prozess)
- Direkter Zugang über URL (Lehrer können einfach teilen)

**Progressive Web App Features**:
- Offline-Modus (Stories vorab laden)
- Installation auf Homescreen möglich
- Push-Notifications (für Lese-Erinnerungen)
- Native-ähnliche Performance
- Zugriff auf Mikrofon für Spracherkennung

### Kernfunktionen
- Echtzeit-Spracherkennung beim Vorlesen
- Wort-für-Wort-Tracking mit Tap-Funktion
- Sofortige Hilfestellung bei Schwierigkeiten
- Motivationssystem mit Belohnungen
- Altersgerechte Geschichtenbibliothek mit 5 Autoren-Stilen
- Detailliertes Wort-Tracking und personalisierte Übungen

---

## 2. Technische Architektur

### Plattform: Progressive Web App (PWA)

**Warum Web-App?**
- Ein Codebase für alle Geräte (Smartphone, Tablet, Desktop)
- Keine App-Store-Abhängigkeit
- Schnellere Updates ohne Review-Prozess
- Günstigere Entwicklung
- Direkter Zugang über URL/Link

### Frontend-Technologien (Web-App)

**Framework**: React oder Next.js
- React: Komponenten-basiert, große Community, bewährt
- Next.js: React + Server-Side Rendering, bessere Performance, SEO-optimiert
- **Empfehlung**: Next.js (wie dein Prototyp erweitert)

**UI-Bibliothek**: 
- Tailwind CSS (wie dein Prototyp - schnelles Styling)
- shadcn/ui (schöne, kindgerechte Komponenten)
- Framer Motion (für spielerische Animationen)

**PWA-Features**:
- Service Worker (Offline-Funktionalität)
- Web App Manifest (Homescreen-Installation)
- Cache API (Stories vorab laden)
- Web Share API (Geschichten teilen)

**Responsive Design**:
- Mobile-First Approach
- Touch-optimierte Buttons (min. 44x44px)
- Swipe-Gesten für Navigation
- Adaptive Layouts für Smartphone, Tablet, Desktop

### Backend-Technologien

**Server**: Node.js mit Express oder Next.js API Routes
- Next.js API Routes: Einfacher (alles in einem Projekt)
- Node.js + Express: Mehr Flexibilität, getrennte Services
- **Empfehlung**: Next.js API Routes (einfacher für MVP)

**Alternative**: Python mit FastAPI (falls ML/KI-Features intensiver)

**Datenbank**: 
- PostgreSQL (strukturierte Daten: User, Tracking)
- Optional: MongoDB für Content (flexibler für Stories)
- **Empfehlung**: PostgreSQL via Supabase (All-in-One)

**Spracherkennung**: 
- Web Speech API (Browser-nativ, kostenlos)
- Später: Google Cloud Speech-to-Text (bessere Qualität)

**Authentifizierung**: 
- Supabase Auth oder NextAuth.js
- Email/Password + OAuth (Google, Apple)
- Eltern-PIN-Schutz

### APIs & Services

**Spracherkennung**:
- Web Speech API (Browser) - MVP
- Google Cloud Speech-to-Text - Phase 2+
- Whisper API (OpenAI) - Alternative

**Text-to-Speech**:
- Web Speech API (Browser TTS) - MVP
- Google Cloud TTS - bessere Qualität
- ElevenLabs - beste Qualität (teurer)

**Bildgenerierung** (für Content):
- DALL-E 3 oder Midjourney
- Stable Diffusion (selbst gehostet)

**Analytics**: 
- Eigene Lösung (PostgreSQL)
- Optional: Plausible Analytics (DSGVO-konform)

### Hosting & Deployment

**Frontend Hosting**:
- **Vercel** (Empfohlen! - Perfect für Next.js)
  - Automatische Deployments
  - Global CDN
  - Free Tier großzügig
  - SSL inklusive
- Alternative: Netlify, Cloudflare Pages

**Backend/Database**:
- **Supabase** (Empfohlen! - PostgreSQL + Auth + Storage)
  - Free Tier ausreichend für Start
  - Echtzeit-Features
  - DSGVO-konform
- Alternative: Railway.app, Heroku

**File Storage** (Bilder, Audio):
- Supabase Storage (1GB kostenlos)
- Cloudflare R2 (günstiger bei Wachstum)

**Domain**:
- Kaufen bei: Namecheap, Cloudflare, IONOS
- Verbinden mit Vercel (5 Min Setup)
- SSL automatisch

### Progressive Web App (PWA) Setup

**Offline-Funktionalität**:
```javascript
// Service Worker registrieren
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js');
}
```

**Cache-Strategie**:
- App-Shell: Immer gecacht (UI-Komponenten)
- Stories: Cache-First (einmal laden, dann offline)
- API-Calls: Network-First (aktuelle Daten bevorzugen)
- Bilder: Cache-First mit Fallback

**Installierbarkeit**:
```json
// manifest.json
{
  "name": "Lesekumpel",
  "short_name": "Lesekumpel",
  "start_url": "/",
  "display": "standalone",
  "theme_color": "#FFD93D",
  "background_color": "#FFFFFF",
  "icons": [
    {
      "src": "/icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icon-512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}
```

**Zugriff auf native Features**:
- Mikrofon: Web Audio API / MediaRecorder
- Kamera: getUserMedia (für zukünftige Features)
- Benachrichtigungen: Push API
- Vibration: Vibration API (Feedback)

### Performance-Optimierung

**Lazy Loading**:
- Buchcover nur laden wenn sichtbar
- Stories on-demand laden
- Route-based Code Splitting

**Image Optimization**:
- Next.js Image Component (automatische Optimierung)
- WebP-Format mit PNG-Fallback
- Responsive Images

**Audio Preloading**:
- TTS-Cache für häufige Wörter
- Hintergrund-Loading während Lesen

**Service Worker**:
- Offline-Verfügbarkeit
- Background Sync (Tracking-Daten)

### Browser-Kompatibilität

**Unterstützte Browser**:
- ✅ Chrome 90+ (Desktop, Android)
- ✅ Safari 14+ (Desktop, iOS)
- ✅ Edge 90+
- ✅ Firefox 88+

**Kritische Features**:
- Web Speech API: Chrome, Edge, Safari (iOS 14.5+)
- Service Worker: Alle modernen Browser
- Push Notifications: Chrome, Edge, Firefox (nicht Safari iOS)

**Fallbacks**:
- Ältere Browser: Basic-Modus ohne Spracherkennung
- Graceful Degradation für fehlende Features

---

## 3. Detaillierte Seitenkonzeption

### 3.1 Willkommensbildschirm (Landing)

**Ziel**: Ersten Eindruck schaffen, App-Typ vermitteln

**Elemente**:
- Großes, freundliches Maskottchen (z.B. lesender Fuchs "Freddy")
- Titel: "LeseFreund - Gemeinsam lesen lernen!"
- Zwei große Buttons:
  - "Ich bin neu hier" (führt zu Onboarding)
  - "Anmelden" (für wiederkehrende Nutzer)
- Dezente Eltern-Ecke (klein in der oberen rechten Ecke)

**Design**:
- Warme, freundliche Farben (Sonnenblumen-Gelb, Grasgrün, Himmelblau)
- Große, gut lesbare Schrift
- Spielerische Illustrationen

---

### 3.2 Onboarding (3-4 Screens)

**Screen 1: Willkommen**
- Maskottchen stellt sich vor
- "Hallo! Ich bin Freddy. Ich helfe dir beim Lesenlernen!"
- Animation: Freddy winkt

**Screen 2: Wie funktioniert's?**
- Einfache 3-Schritt-Erklärung mit Illustrationen:
  1. "Suche dir eine Geschichte aus"
  2. "Lies laut vor - ich höre zu!"
  3. "Sammle Sterne und werde besser!"

**Screen 3: Profil erstellen**
- "Wie heißt du?"
- Avatar-Auswahl (6-8 kindgerechte Optionen)
- Alter auswählen (für Schwierigkeitsanpassung)

**Screen 4: Lesestufe bestimmen**
- Kurzer, spielerischer Lesetest (5-6 Sätze)
- Oder manuelle Auswahl: Anfänger / Fortgeschritten / Geübt

---

### 3.3 Hauptmenü/Dashboard

**Layout**: Kindgerechtes Dashboard mit großen, bunten Kacheln

**Oberer Bereich**:
- Profilbild mit Namen: "Hallo, [Name]!"
- Aktueller Fortschrittsbalken: "Du hast heute schon X Minuten gelesen!"
- Streak-Anzeige: "5 Tage in Folge! 🔥"

**Hauptbereich - Große Kacheln**:

1. **"Weiterlesen"** (falls Buch offen)
   - Thumbnail des aktuellen Buches
   - "Lies weiter: [Buchtitel]"
   - Fortschrittsanzeige (z.B. "Seite 12 von 20")

2. **"Neue Geschichte"**
   - Buntes Buch-Icon
   - "Entdecke neue Abenteuer!"

3. **"Meine Erfolge"**
   - Stern/Pokal-Icon
   - Anzahl gesammelte Sterne heute

4. **"Übungsplatz"**
   - Wörter/Silben üben
   - Kurze Übungseinheiten

**Unterer Bereich**:
- Tägliche Herausforderung: "Lies heute 3 Seiten!"
- Neuste Belohnung/Abzeichen
- Settings-Icon (kindersicher)

---

### 3.4 Bibliothek

**Filterbereich (oben)**:

**Autoren-Filter** (prominent platziert):
- **Alle Autoren** (Default)
- 📚 **Samira Wissensfreund** (Sachtexte) - Avatar-Bild
- 🌙 **Deniz Traumfänger** (Traumreisen) - Avatar-Bild
- 🎈 **Jonas Entdecker** (Kindergeschichten) - Avatar-Bild
- 📱 **Holzi Pixelkopf** (YouTuber-Stil) - Avatar-Bild
- 🖼️ **Bildergeschichten** (6 Bilder + Text) - Icon

**Phasen-Filter** (farbcodiert):
- 🟠 Phase 1: Der Start (Top 100 Wörter)
- 🟡 Phase 2: Der Ausbau (Technik)
- 🟨 Phase 3: Der Fluss (Grammatik)
- 🟩 Phase 4: Die Geschichte (Komplexität)
- 🟢 Phase 5: Der Profi (Meisterschaft)

**Sekundär-Filter: Unterstufen**:
Nach Auswahl einer Phase erscheinen die Unterstufen:
- Phase 2: 2.1 (Sonderlaute) | 2.2 (Stolpersteine) | 2.3 (Endungen) | 2.4 (Komposita)
- Phase 3: 3.1 (Präteritum) | 3.2 (Vorsilben) | 3.3 (Suffixe) | 3.4 (Konjunktionen)
- Phase 4: 4.1 (Satzklammer) | 4.2 (Dialoge) | 4.3 (Relativsätze) | 4.4 (Vergleiche)
- Phase 5: 5.1 (Synonyme) | 5.2 (Redewendungen) | 5.3 (Abstrakta) | 5.4 (Sachtext)

**Thematische Filter**:
- Icons für Kategorien:
  - Alle Geschichten
  - Abenteuer 🏔️
  - Tiere 🦊
  - Freundschaft 💛
  - Fantasie ✨
  - Alltag 🏠
  - Wissen 📚 (Samira)
  - Gaming 🎮 (Holzi)
  - Entspannung 🌙 (Deniz)

**Weitere Filter**:
- Länge: Kurz (5 Min.), Mittel (10 Min.), Lang (15+ Min.)
- Format: 📖 Text | 🖼️ Bildergeschichte
- Zielgruppen-Anpassung: LRS, ASS, ADHS, DaZ, Sehbehinderung (optional, in Elternbereich aktivierbar)

**Buchdarstellung**:
- Grid-Layout (2 Spalten auf Mobile, 3-4 auf Tablet)
- Jedes Buch zeigt:
  - Cover-Illustration
  - **Autoren-Avatar** (kleiner Badge in der Ecke)
  - Titel
  - Phasen-Badge (farbig: 🟠🟡🟨🟩🟢)
  - Stufe (z.B. "2.3" oder "4.1")
  - Fokus-Tag (z.B. "Endungen" oder "Dialoge")
  - Format-Icon (📖 oder 🖼️)
  - Dauer
  - "Gelesen"-Häkchen (falls abgeschlossen)
  - Fortschrittsbalken (falls angefangen)
  - Sterne-Bewertung (wie gut das Kind die Geschichte gemeistert hat)

**Buchdetail-Ansicht** (bei Klick):
- Größeres Cover
- **Autoren-Info**: "Eine Geschichte von [Autor-Name]" mit Avatar und Stil-Beschreibung
- Kurze Beschreibung (2-3 Sätze)
- Lernfokus: "In dieser Geschichte übst du: [z.B. Wörter mit 'sch', 'ch', 'ei']"
- Anzahl Seiten (bzw. bei Bildergeschichten: "6 Bilder")
- Phase & Stufe deutlich sichtbar
- Beispielsatz aus der Geschichte
- **Format-Hinweis** (bei Bildergeschichten): "Diese Geschichte wird mit 6 großen Bildern erzählt!"
- "Jetzt lesen"-Button (groß und einladend)
- "Vorlesen lassen"-Option (zum Zuhören, ohne Spracherkennung)
- Anpassungs-Optionen (falls in Elternbereich aktiviert):
  - 📖 "Silbenfärbung an" (für LRS)
  - 🎯 "Klar-Modus" (Redewendungen vereinfachen für ASS)
  - ⚡ "Kurze Häppchen" (für ADHS)

---

### 3.5 Leseseite - DAS HERZSTÜCK

Es gibt **zwei verschiedene Leseseiten-Formate**:

---

#### Format A: Standard-Leseseite (Textgeschichten)

**Layout**:

**Oberer Bereich (Header)**:
- Zurück-Button (links oben)
- Buchtitel (zentriert, groß)
- ⭐ Bewerte die Geschichte (rechts oben)
- Autoren-Avatar (klein)
- Seitenzahl "← Zurück | 1/5 | Weiter →" (Navigation)

**Settings-Toolbar** (kompakt, icons):
- 🔊 Vorlesen (gesamte Seite vorlesen lassen)
- 🔍 Lupe (Zoom-Funktion)
- 📖 Einfach / 🔴🔵 Silben (Toggle zwischen normal und Silbenfärbung)
- A- / A+ (Schriftgröße)
- 🧩 Häppchen (Text in kleinere Chunks aufteilen - ADHS)
- 🇩🇪 / 🇬🇧 (Sprache - für mehrsprachige Versionen)

**Hauptbereich**:
- **Titelbild** (große Illustration oben, hochauflösend)
  - Zeigt Szene der Geschichte
  - Bei Klick: Vollbild-Ansicht
  
- **Textbereich** (unter dem Bild):
  - Große, gut lesbare Schrift (OpenDyslexic oder Comic Sans)
  - Zeilenabstand: 1.8-2.0
  - Aktuelles Wort wird farbig markiert (während Kind liest)
  - Text scrollbar bei längeren Texten
  - **Silbenfärbung optional**: <span style="color: red">Schmet</span><span style="color: blue">ter</span><span style="color: red">ling</span>
  - **Alle Wörter sind tippbar** für Word-Tap-Feature
  - Bei Tap: Minimales Pop-up mit 🔊 "Hören" Button

**Interaktive Elemente während des Lesens**:
- **Word-Tap**: 
  - Kurzer Tap = Mini-Modal öffnet: "Wort | 🔊 Hören | Schließen"
  - TTS liest Wort vor
  - Modal schließt automatisch nach 3 Sek. oder auf "Schließen"
  - **Tracking im Hintergrund**
- **Langes Drücken** (1+ Sek.): Öffnet detaillierte Worthilfe-Seite
- Mikrofon-Button (zum Starten/Stoppen der Spracherkennung)

**Autoren-Info-Box** (nach dem Text, vor Quiz):
- Avatar des Autors
- Name: "Samira Wissensfreund"
- Kurze Beschreibung des Autors (1-2 Sätze)
- Farblich passend zum Autoren-Thema

**Nach dem Text**:
- **🧠 Quiz-Zeit! Hast du gut aufgepasst?**
  - 3-5 Multiple-Choice-Fragen zum Text
  - Sofortiges Feedback (richtig/falsch)
  - Fördert Leseverständnis

- **Bewertung**:
  - "Hat dir die Geschichte gefallen?"
  - 👍 Daumen hoch | 👎 Daumen runter
  - Prozentzahl (z.B. "⭐ 89%")

**Seitenende**:
- Konfetti-Animation 🎉 (bei Geschichtsende)
- "Super gelesen!" mit Statistik
- Sterne-Belohnung
- "Weiter"-Button zur nächsten Seite (oder "Fertig" bei letzter Seite)

**Footer-Bereich**:
- **"Das könnte dir auch gefallen"** (3 Empfehlungen)
  - Cover-Thumbnails mit Titel
  - Autor-Name
  - Bewertung (⭐ XX%)
  
- **💬 Kommentar-Bereich**:
  - Andere Kinder können Kommentare schreiben
  - Mit Avatar und Datum
  - Moderiert/kindersicher

**Feedback-Mechanismen** (während Vorlesen aktiv ist):

1. **Bei korrektem Lesen**:
   - Wort wird grün
   - Leichtes "Pling"-Geräusch
   - Weiter zum nächsten Wort

2. **Bei Stocken (3 Sek. Pause)**:
   - Wort pulsiert leicht
   - Freddy erscheint mit Sprechblase: "Versuch's nochmal!"
   - Nach 5 Sek.: Hilfe-Button erscheint neben Wort
   - **Tracking**: Pause wird als "Schwierigkeit" erfasst

3. **Bei falscher Aussprache**:
   - Wort wird orange
   - Sanfter Ton
   - Freddy: "Fast! Hör nochmal zu:" + TTS spricht Wort vor
   - Kind kann wiederholen
   - **Tracking**: Fehler wird erfasst

4. **Bei wiederholter Schwierigkeit** (3+ Versuche):
   - Automatische Worthilfe-Seite öffnet
   - **Tracking**: "Schweres Wort" markiert für Übungsplatz

5. **Bei Word-Tap** (Kind tippt Wort an während NICHT aktiv vorgelesen wird):
   - Mini-Modal: "Wort | 🔊 Hören"
   - TTS liest Wort sofort vor
   - Modal verschwindet automatisch
   - **Tracking**: Word-Tap wird erfasst

---

#### Format B: Bildergeschichten-Seite

**Besonderheit**: 6 große, konsistente Bilder erzählen die Geschichte, Text ist minimal

**Layout**:

**Oberer Bereich (Header)**:
- Zurück-Button (links)
- Buchtitel: "Momo spielt Domino"
- ⭐ Bewerte die Geschichte (rechts)

**Settings-Toolbar** (kompakt):
- 🔊 Alles lesen (gesamtes Bild + Text vorlesen)
- 👂 Wörter hören (Word-Tap aktiv)
- 🔴🔵 Silben (Silbenfärbung an/aus)
- A+ / A- (Schriftgröße)

**Hauptbereich (Vollbild-Bild)**:
- **Großes Bild** (80-85% des Bildschirms)
  - KI-generiert mit konsistentem Charakter-Design
  - Hochauflösend, detailreich
  - Erzählt die Szene visuell
  - Comic/Illustrationsstil
  
- **Textbereich** (unter dem Bild, kompakt, 10-15% des Screens):
  - 1-3 sehr kurze Sätze (max. 15 Wörter gesamt)
  - Größere Schrift als bei Standard-Geschichten (24-28px)
  - Text beschreibt, was im Bild passiert
  - **Alle Wörter sind tippbar** (Word-Tap-Feature)
  - Weiße Box mit leichtem Schatten für bessere Lesbarkeit

**Navigation**:
- **Große Pfeile**: "← Zurück" (links) | "Weiter →" (rechts)
- **Bildnummer zentral**: "1 / 6" (großer als bei Textgeschichten)
- **Wisch-Gesten**: Links/Rechts wischen für Bild-Wechsel
- Optional: Mini-Thumbnails am unteren Rand (zeigen alle 6 Bilder)

**Beispiel-Ablauf** (Geschichte: "Momo spielt Domino"):

**Bild 1/6**: Momo (Affe) schaut Domino-Steine an  
*Text*: "Das ist Momo. Momo hat Domino-Steine."

**Bild 2/6**: Momo baut eine Domino-Reihe  
*Text*: "Momo baut. Die Steine stehen auf."

**Bild 3/6**: Momo drückt ersten Stein um  
*Text*: "Momo drückt. Der erste Stein fällt um!"

**Bild 4/6**: Alle Steine fallen wie eine Welle  
*Text*: "Wow! Alle Steine fallen! Klack, klack, klack!"

**Bild 5/6**: Momo freut sich, klatscht  
*Text*: "Momo freut sich. Das macht Spaß!"

**Bild 6/6**: Momo baut wieder von vorne  
*Text*: "Nochmal! Momo baut wieder."

**Interaktive Elemente**:
- Wisch-Geste: Nächstes/Vorheriges Bild (primary interaction)
- Oder: Große Pfeile-Buttons (Touch-friendly, 80x80px)
- **Vorlesen optional**: Mikrofon-Button kann aktiviert werden
- **Word-Tap** funktioniert wie bei Textgeschichten
  - Tap auf Wort → Mini-Modal "🔊 Hören"
  - TTS spricht Wort vor
- **Kein Zwang zum Vorlesen**: Kind kann auch nur Bilder ansehen und Text leise lesen

**Nach Bild 6**:
- Automatische Erfolgsseite
- "Geschichte fertig! 🎉"
- Keine Sterne-Bewertung pro Seite (nur am Ende)
- "Gefällt dir die Geschichte?" 👍 👎
- "Nochmal ansehen"-Button (zurück zu Bild 1)
- "Neue Geschichte"-Button (zur Bibliothek)

**Autoren-Info** (am Ende):
- Kein spezifischer Autor (Bildergeschichten = eigenes Format)
- Stattdessen: "📖 Bildergeschichte" Badge

**Pädagogischer Wert**:
- **Visuelle Erzählkompetenz**: Kind lernt, aus Bildern eine Geschichte zu lesen
- **Reduzierte kognitive Last**: Weniger Text = mehr Fokus auf einzelne Wörter
- **Kontextuelles Verstehen**: Bild hilft massiv beim Wort-Verständnis
- **Sequenzierung**: Kind lernt, Reihenfolge und Kausalität zu verstehen
- **Ideal für**: Phase 1-2, LRS, DaZ, visuelle Lerner, ADHS (hoher visueller Reiz)

**Tracking-Besonderheiten**:
- Bildergeschichten werden separat getrackt
- Analyse: "Max hat bei Bildergeschichten 50% weniger Wort-Taps als bei Textgeschichten"
- Zeit pro Bild wird gemessen
- Verwendung von "Nochmal ansehen" wird getrackt (zeigt Engagement)

**Technische Umsetzung**:
- **KI-Bildgenerierung**: Alle 6 Bilder werden mit **konsistentem Charakter-Design** generiert
  - Seed-basierte Generation (gleiche Charaktere in allen 6 Bildern)
  - Beispiel: "Momo" hat in allen 6 Bildern gleiches Aussehen
  - Tool: Stable Diffusion, Midjourney oder DALL-E mit Character Consistency
- Alternative: Illustration Commission (Fiverr/Upwork) - teurer, aber perfekte Konsistenz
- Bilder werden als Set (6 Stück) produziert und gemeinsam gespeichert

**Design-Richtlinien für Bilder**:
- Klare, einfache Kompositionen
- Kräftige Farben
- Wenig Hintergrund-Details (Fokus auf Hauptfigur)
- Konsistenter Zeichenstil über alle 6 Bilder
- Emotionen der Charaktere sind deutlich sichtbar (große Augen, Mimik)
- Keine Text-Elemente im Bild selbst

---

### 3.6 Worthilfe-Seite & Word-Tap-Feature

**Wird geöffnet bei**: 
- Antippen eines Wortes ODER
- Automatisch bei Schwierigkeiten beim Vorlesen

---

#### Variante A: Schnell-Vorlesung (Word-Tap während des Lesens)

**Trigger**: Kind tippt während des Vorlesens auf ein Wort

**Verhalten**:
- **Sofortiges Audio-Feedback**: Wort wird vorgelesen (TTS)
- **Visuelle Hervorhebung**: Wort blinkt kurz grün
- **Kein Overlay**: Leseseite bleibt im Fokus
- **Tracking**: Interaktion wird gespeichert (siehe unten)

**UI-Element**:
- Alle Wörter sind tippbar
- Dezenter Hover-Effekt (leichte Vergrößerung) bei Touch/Mouse-Over
- Visuelles Feedback: Kurzes "Ping"-Icon beim Antippen

**Logging** (im Hintergrund):
```json
{
  "timestamp": "2026-01-31T14:23:45Z",
  "child_id": "max_123",
  "story_id": "drache_feuer",
  "page": 5,
  "word": "Feuerspeier",
  "word_position": 12,
  "phase": "2.1",
  "interaction_type": "word_tap",
  "context": "reading_active"
}
```

---

#### Variante B: Detaillierte Worthilfe (bei Stocken oder auf Wunsch)

**Trigger**: 
- Automatisch bei 3+ Sek. Pause ODER
- Langes Drücken auf ein Wort (1 Sek.) ODER
- Nach 2-3 Word-Taps auf dasselbe Wort

**Layout**:

**Oberer Bereich**:
- Großes Wort: "Schmetterling"
- Silbentrennung farbig: <span style="color: blue">Schmet</span><span style="color: red">ter</span><span style="color: green">ling</span>

**Mittlerer Bereich**:
- Lautsprecher-Button (groß): "Hör dir das Wort an"
- Spielt TTS-Version ab
- "Langsam"-Option: Spielt silbenweise ab

**Bildbereich**:
- Illustratives Bild zum Wort (z.B. bunter Schmetterling)
- Kurze Erklärung: "Ein Schmetterling ist ein buntes Insekt mit Flügeln"

**Unterer Bereich**:
- "Jetzt du!"-Button mit Mikrofon
- Kind spricht nach
- Visuelles Feedback (Wellenform während Aufnahme)
- Bei Erfolg: Grüner Haken + "Perfekt!"

**Bottom Button**:
- "Zurück zur Geschichte"

**Logging** (detailliert):
```json
{
  "timestamp": "2026-01-31T14:24:12Z",
  "child_id": "max_123",
  "story_id": "drache_feuer",
  "page": 5,
  "word": "Feuerspeier",
  "word_position": 12,
  "phase": "2.1",
  "interaction_type": "word_help_detail",
  "help_triggered_by": "auto_pause",
  "help_actions": [
    {"action": "listen_word", "timestamp": "14:24:15Z"},
    {"action": "listen_slow", "timestamp": "14:24:18Z"},
    {"action": "repeat_success", "timestamp": "14:24:25Z", "accuracy": 0.92}
  ],
  "time_spent_seconds": 13
}
```

---

### 🎯 Wort-Tracking & Lernanalyse

**Zweck**: Erkennen, welche Wörter Kindern schwerfallen, um gezieltes Training zu ermöglichen

#### Datenerfassung

**Pro Wort wird getrackt**:
- Anzahl der Word-Taps (schnelles Antippen)
- Anzahl der Detail-Hilfen (Worthilfe-Seite)
- Kontext (Phase, Stufe, Autor, Geschichte)
- Worttyp (Nomen, Verb, Adjektiv, Funktionswort)
- Linguistische Features:
  - Wortlänge
  - Silbenanzahl
  - Besondere Grapheme (sch, ch, ei, ie)
  - Konsonantenhäufung (str, pf, kn)
  - Komposita (ja/nein)

**Aggregierte Metriken**:
- **Schwierigkeits-Score** pro Wort (0-100):
  - 0 = nie Hilfe gebraucht
  - 50 = manchmal Hilfe
  - 100 = immer Hilfe

- **Wort-Kategorien** (automatische Klassifikation):
  - "Stolperwörter" (>3 Hilfe-Anfragen)
  - "Gelernte Wörter" (früher schwierig, jetzt ok)
  - "Meisterwörter" (nie Probleme)

#### Analyse-Dashboard (Elternbereich)

**Übersicht "Schwierige Wörter"**:
```
🔴 Stolperwörter (diese Woche):
1. Schmetterling (8x Hilfe)
2. Feuerspeier (6x Hilfe)
3. springt (5x Hilfe)

🟡 Übungswörter:
- Wörter mit "sch" (12 verschiedene, Ø 3x Hilfe)
- Lange Komposita (5 verschiedene)

🟢 Gelernt:
- "Vogel" (vor 2 Wochen schwierig, jetzt kein Problem mehr!)
```

**Detaillierte Analyse**:
- Wort-Cloud (größere Wörter = häufiger Hilfe gebraucht)
- Graphem-Statistik: "Max hat Probleme mit 'ei' und 'ie'"
- Phasen-Analyse: "In Phase 2.2 (Konsonantenhäufung) braucht Max 40% mehr Hilfe"
- Vergleich: "Holzi-Geschichten brauchen weniger Hilfe als Samira-Sachtexte"

---

### 🎮 Übungsplatz: Personalisierte Wortlisten

Der **Übungsplatz** (siehe Seite 3.9) wird durch Tracking dynamisch befüllt:

#### Automatisch generierte Übungen

**1. Stolperwort-Training**:
- Liste der Top 10 Stolperwörter
- Kind übt diese gezielt mit Spracherkennung
- Gamification: "Sammle deine Stolperwörter!"

**2. Graphem-Fokus**:
- Erkennt: "Max hat Probleme mit 'sch'"
- Generiert Übung mit 10 'sch'-Wörtern
- Beispiel: Schule, Tisch, waschen, Fisch, ...

**3. Silben-Training**:
- Basierend auf langen Wörtern, die Probleme machen
- Wort wird in Silben zerlegt
- Kind liest Silbe für Silbe

**4. Wiederholungs-Algorithmus** (Spaced Repetition):
- Wörter werden in Intervallen wiederholt:
  - Tag 1: Nach erstem Fehler
  - Tag 3: Zweite Wiederholung
  - Tag 7: Dritte Wiederholung
  - Tag 14: Vierte Wiederholung
- Bei Erfolg: Wort gilt als "gemeistert"
- Bei Fehler: Zurück zu Tag 1

---

### 📊 Technische Implementierung des Trackings

#### Datenbank-Schema

**Tabelle: word_interactions**
```sql
CREATE TABLE word_interactions (
    id SERIAL PRIMARY KEY,
    child_id INTEGER,
    story_id VARCHAR(100),
    page_number INTEGER,
    word TEXT,
    word_normalized TEXT,  -- lowercase, ohne Satzzeichen
    word_position INTEGER,
    interaction_type VARCHAR(50),  -- 'word_tap', 'word_help_detail', 'repeat_attempt'
    phase VARCHAR(10),
    stage VARCHAR(10),
    author VARCHAR(50),
    timestamp TIMESTAMP,
    context_data JSONB,  -- zusätzliche Daten
    created_at TIMESTAMP DEFAULT NOW()
);
```

**Tabelle: word_difficulty_scores**
```sql
CREATE TABLE word_difficulty_scores (
    id SERIAL PRIMARY KEY,
    child_id INTEGER,
    word TEXT,
    difficulty_score INTEGER,  -- 0-100
    help_count INTEGER,
    success_count INTEGER,
    last_seen TIMESTAMP,
    mastery_status VARCHAR(50),  -- 'learning', 'practicing', 'mastered'
    updated_at TIMESTAMP DEFAULT NOW()
);
```

#### API-Endpoints

**POST /api/track/word-interaction**
```json
{
  "child_id": "max_123",
  "story_id": "drache_feuer",
  "page": 5,
  "word": "Feuerspeier",
  "interaction_type": "word_tap",
  "phase": "2.1",
  "author": "jonas"
}
```

**GET /api/analytics/difficult-words?child_id=max_123**
```json
{
  "stumbling_words": [
    {"word": "Schmetterling", "help_count": 8, "score": 85},
    {"word": "Feuerspeier", "help_count": 6, "score": 72}
  ],
  "grapheme_issues": [
    {"grapheme": "sch", "occurrence": 12, "avg_help": 3.2},
    {"grapheme": "ei", "occurrence": 8, "avg_help": 2.5}
  ],
  "phase_performance": {
    "2.1": {"avg_help_per_page": 4.2, "difficulty": "medium"},
    "2.2": {"avg_help_per_page": 6.8, "difficulty": "high"}
  }
}
```

---

### 🧠 Privacy & Datenschutz

**Wichtig**: Tracking muss DSGVO-konform sein

**Maßnahmen**:
- Eltern müssen explizit zustimmen (Opt-in)
- Daten werden nur lokal/auf sicherem Server gespeichert
- Anonymisierung möglich
- Export-Funktion für Eltern
- Lösch-Funktion (Recht auf Vergessenwerden)
- Keine Weitergabe an Dritte

**Transparenz**:
- Eltern können in Einstellungen sehen, welche Daten erfasst werden
- Dashboard zeigt alle getrackte Wörter
- "Daten löschen"-Button im Elternbereich

---

### 3.7 Erfolgsseite (nach Buch-Abschluss)

**Wird angezeigt**: Nach letzter Seite eines Buches

**Großer Celebration Moment**:
- Voller Bildschirm mit Konfetti-Animation
- Freddy jubelt
- "Geschafft! Du hast [Buchtitel] gelesen!"

**Statistiken** (kindgerecht präsentiert):
- Gelesene Wörter: "423 Wörter!"
- Benötigte Zeit: "12 Minuten"
- Hilfen genutzt: "8 mal - super Durchhaltevermögen!"
- Neue Wörter gelernt: "5 neue Wörter"

**Belohnungen**:
- Sterne verdient: ⭐⭐⭐⭐⭐ (z.B. 5 von 5)
- Neues Abzeichen: "Abenteurer" 🎖️
- XP-Leiste füllt sich

**Buttons**:
- "Nochmal lesen" (zur Wiederholung)
- "Neue Geschichte" (zur Bibliothek)
- "Zum Hauptmenü"

---

### 3.8 Erfolge & Belohnungen

**Tabs**:
1. Abzeichen
2. Statistiken
3. Streak

**Tab 1: Abzeichen**
- Grid mit allen möglichen Abzeichen
- Erreichte sind farbig, andere ausgegraut
- Beispiele:
  - "Erste Geschichte" - Erstes Buch abgeschlossen
  - "5-Tage-Streak" - 5 Tage hintereinander gelesen
  - "Wort-Profi" - 100 neue Wörter gelernt
  - "Schnell-Leser" - Geschichte ohne Hilfe gelesen
  - "Silben-Champion" - 50 Silben-Wörter gemeistert

**Tab 2: Statistiken**
- Große Zahlen mit Icons:
  - 📚 Gelesene Bücher: 12
  - 📝 Gelesene Wörter: 3.847
  - ⏱️ Lesezeit gesamt: 2h 34min
  - 🆕 Neue Wörter: 47
  - 🔥 Längster Streak: 7 Tage

**Tab 3: Streak**
- Kalender-Ansicht (aktueller Monat)
- Tage mit Leseaktivität sind markiert 🔥
- "Heute schon gelesen?" mit Motivations-Text
- Tägliche Ziel-Anzeige: "Noch 5 Minuten bis zum Tagesziel!"

---

### 3.9 Übungsplatz

**Ziel**: Gezielte Übung schwieriger Wörter und Konzepte

**Übungsmodi**:

1. **Silben-Training**
   - Wörter in Silben zerlegt
   - Kind liest Silbe für Silbe
   - Gamification: Silben zusammensetzen

2. **Wörter-Sammler**
   - Schwierige Wörter aus bisherigen Geschichten
   - Kind liest Wort vor
   - Bei Erfolg: Wort "gesammelt"

3. **Tempo-Training**
   - Bekannte Wörter schnell lesen
   - Gegen die Zeit
   - Highscore-System

4. **Reime & Laute**
   - Spielerisches Lauttraining
   - "Finde alle Wörter mit 'au'"

**Darstellung**:
- Spielähnliche Oberfläche
- Kurze Sessions (3-5 Minuten)
- Sofortige Belohnung
- Kein Druck, rein optional

---

### 3.10 Elternbereich

**Zugang**: PIN-geschützt oder Rechenaufgabe (Kindersicherung)

**Dashboard für Eltern**:

**Übersicht**:
- Lesefortschritt des Kindes (Grafik über Zeit)
- Gelesene Bücher (Liste)
- Durchschnittliche Lesezeit pro Tag
- Schwierigkeits-Entwicklung

**Detaillierte Statistiken**:
- Häufig schwierige Wörter (Top 10 Stolperwörter)
- **Wort-Tracking Dashboard**:
  - Wort-Cloud (größere Wörter = mehr Hilfe gebraucht)
  - Graphem-Analyse: "Max hat Schwierigkeiten mit 'ei' und 'ie'"
  - Konsonantenhäufung-Report: "Wörter mit 'str', 'pf' brauchen Übung"
  - Phasen-Performance: "Phase 2.2 = 40% mehr Hilfe als 2.1"
  - Autoren-Vergleich: "Holzi-Geschichten = weniger Hilfe als Samira"
- Bereiche, die Übung brauchen
- Starke Bereiche
- Lernkurve (visuell)
- **Wort-Meisterschaft**: Welche Wörter wurden "gemeistert"? (früher schwierig, jetzt ok)
- **Empfohlene Übungen**: Basierend auf Stolperwörtern

**Einstellungen**:
- **Profile verwalten**: Mehrere Kinder anlegen
- **Lesezeit-Limits**: Max. Lesezeit pro Tag
- **Benachrichtigungen**: Erinnerungen zum Lesen
- **Schwierigkeitsgrad**: Manuell anpassen (Phase/Stufe überspringen oder wiederholen)
- **Sprache**: Deutsch, weitere Sprachen
- **Darstellung**: 
  - Schriftgröße
  - Silbentrennung an/aus
  - Farbschema
  - Schriftart (OpenDyslexic für LRS)
- **Zielgruppen-Anpassungen** (optional aktivierbar):
  - LRS/Legasthenie: Silbenfärbung, größere Abstände, spezielle Schrift
  - Autismus (ASS): "Klar-Modus" (Redewendungen vereinfachen), Gefühle explizit beschreiben
  - ADHS: Kürzere Textabschnitte, Interessens-Themen priorisieren
  - DaZ/DaF: Farbcodierte Grammatik (Artikel), Wortschatz-Vorentlastung
  - Sehbehinderung: High-Contrast-Modus, Fokus-Zoom, größere Schrift
  - Hörbehinderung: Ganzwort-Strategie bevorzugen, mehr Bilder

**Content-Verwaltung**:
- Bücher hinzufügen (eigene Geschichten hochladen - Beta)
- Bibliothek filtern (bestimmte Themen ausblenden)

**Berichte**:
- Wöchentlicher/Monatlicher Report per E-Mail
- Export der Fortschrittsdaten (CSV)

---

### 3.11 Einstellungen (Kind)

**Zugänglich**: Vereinfacht, kindgerecht

**Optionen**:
- Avatar ändern
- Name ändern (mit Eltern-Bestätigung)
- Lautstärke Freddy
- Lautstärke Soundeffekte
- Hilfe ein/aus
- Tutorial wiederholen

**Design**:
- Große Schalter (Toggle)
- Icons statt Text
- Vorschau-Funktion

---

## 4. User Flow - Beispiel-Sessions

### Szenario 1: Max (7 Jahre) - Holzi-Fan, Phase 2.1

1. **App öffnen** → Willkommensbildschirm mit "Anmelden"
2. **Profil auswählen** → Max sieht seinen Avatar und klickt drauf
3. **Dashboard** → "Hallo Max! Neue Geschichte von Holzi: Minecraft Abenteuer!"
4. **Klick auf "Jetzt lesen"** → Leseseite öffnet, Seite 1
5. **Max liest vor** → "Hey Leute! Heute bauen wir ein episches Schloss!"
6. **Stockt bei "episches"** → Tippt das Wort an (Word-Tap)
7. **TTS liest vor** → "episches" - Max hört zu
8. **Weiter lesen** → Spracherkennung läuft, Wörter werden grün
9. **Seite 1 fertig** → "Super!" + Weiter-Button
10. **3 weitere Seiten** → Buch fertig nach Seite 4 (kurze Holzi-Story)
11. **Erfolgsseite** → "Krass, Max! Story geschafft! 🎮" (Holzi-Stil)
12. **Tracking im Hintergrund**: "episches" wurde als Stolperwort markiert

---

### Szenario 2: Emma (6 Jahre) - Bildergeschichte, Phase 1.0

1. **App öffnen** → Emma's Profil
2. **Dashboard** → "Emma, schau dir diese Bilder an: Die kleine Katze!"
3. **Klick auf Bildergeschichte** → 🖼️ Icon sichtbar
4. **Bild 1 erscheint** → Große Katze auf Wiese
   - Text: "Das ist Mimi. Mimi ist eine Katze."
5. **Emma liest vor** → Spracherkennung läuft
6. **Wisch nach rechts** → Bild 2
   - Text: "Mimi sieht einen Ball."
7. **Emma stockt bei "Ball"** → Tippt Wort an
8. **TTS**: "Ball" → Emma wiederholt
9. **Weiter durch alle 6 Bilder** → Visuelle Geschichte fertig
10. **Erfolgsseite** → "Toll, Emma! Du hast alle Bilder gelesen!"
11. **Tracking**: "Ball" wurde getippt, gespeichert für Übungsplatz

---

### Szenario 3: Lisa (9 Jahre) - Samira-Sachtext, Phase 4.2

1. **Bibliothek öffnen** → Filter: Samira Wissensfreund
2. **Wählt**: "Wie fliegen Vögel?" (Sachtext)
3. **Leseseite** → Komplexerer Text mit Fachbegriffen
4. **Lisa liest vor** → "Vögel haben hohle Knochen, die sehr leicht sind."
5. **Stockt bei "hohle"** → Langes Drücken auf Wort
6. **Detail-Worthilfe öffnet** → Bild von hohlem Knochen + Erklärung
7. **Lisa hört Wort** → Spricht nach → "Perfekt!"
8. **Zurück zur Geschichte** → Liest weiter
9. **Seite fertig** → Weiter zu Seite 2
10. **Am Ende** → "Jetzt weißt du, warum Vögel fliegen können!"
11. **Tracking**: "hohle" markiert, Sachtext-Performance erfasst

---

## 5. Gamification & Motivation

### Belohnungssystem

**Kurz-term (sofort)**:
- Grüne Wörter bei korrektem Lesen
- Soundeffekte ("Pling")
- Freddy's Lob ("Toll gemacht!")

**Mittel-term (pro Seite/Buch)**:
- Sterne pro Seite (1-5)
- Konfetti-Animationen
- Fortschrittsbalken füllt sich

**Lang-term (über Wochen)**:
- Abzeichen-System
- Level-Ups
- Streak-Belohnungen

### Progression System - 5-Phasen-Modell

**Phase-basiertes Leveling**:

Das Levelsystem folgt dem 5-Phasen-Modell mit insgesamt **19 Unterstufen**:

**Phase 1 - Der Start** (Level 1):
- Stufe 1.0: Top 100 Wörter

**Phase 2 - Der Ausbau** (Level 2-5):
- Stufe 2.1: Mehrgrapheme (Sonderlaute)
- Stufe 2.2: Konsonantenhäufung (Stolpersteine)
- Stufe 2.3: Endungen
- Stufe 2.4: Komposita

**Phase 3 - Der Fluss** (Level 6-9):
- Stufe 3.1: Präteritum
- Stufe 3.2: Vorsilben
- Stufe 3.3: Suffixe (Nachsilben)
- Stufe 3.4: Konjunktionen

**Phase 4 - Die Geschichte** (Level 10-13):
- Stufe 4.1: Satzklammer
- Stufe 4.2: Dialoge
- Stufe 4.3: Relativsätze
- Stufe 4.4: Vergleiche

**Phase 5 - Der Profi** (Level 14-17):
- Stufe 5.1: Synonyme & Wortfeld
- Stufe 5.2: Redewendungen
- Stufe 5.3: Abstrakta & Gefühle
- Stufe 5.4: Passiv & Sachtext

**Adaptive Schwierigkeit**:
Die App passt automatisch die Geschichten-Empfehlungen basierend auf:
- Erfolgsquote beim Vorlesen (grüne vs. orange Wörter)
- Häufigkeit der Worthilfe-Nutzung
- Lesegeschwindigkeit
- Vorschlag: Nächste Stufe ab 80% Erfolgsquote

**XP-System**:
- 10 XP pro gelesene Seite
- 50 XP pro abgeschlossenes Buch
- 25 XP für tägliches Lesen
- 100 XP für neues Abzeichen

### Challenges

**Tägliche Challenges**:
- "Lies heute 3 Seiten"
- "Lerne 2 neue Wörter"
- "Lies 10 Minuten"

**Wöchentliche Challenges**:
- "Beende 2 Bücher"
- "Lies jeden Tag"
- "Erreiche Level 3"

---

## 6. Content-Strategie - 5-Phasen-Modell

### Übersicht des Phasen-Systems

Die App nutzt ein **wissenschaftlich fundiertes 5-Phasen-Modell** zur systematischen Lesekompetenzentwicklung. Jede Phase baut auf der vorherigen auf und fokussiert sich auf spezifische linguistische und kognitive Fähigkeiten.

**Phasen-Farben** (im UI konsistent nutzen):
- Phase 1: Orange 🟠 (Der Start)
- Phase 2: Gelb 🟡 (Der Ausbau)
- Phase 3: Hellgelb 🟨 (Der Fluss)
- Phase 4: Hellgrün 🟩 (Die Geschichte)
- Phase 5: Grün 🟢 (Der Profi)

---

### Phase 1: Der Start (Anfang Klasse 1)
**Klassenstufe**: Stufe 1.0 | **Top 100 Wörter**

#### Sprachliches Ziel
**Automatisierung**: Häufige Wörter "blitzen" (als Bild erkennen), um Energie zu sparen.

#### Profil & Status
**Decoder-Stress**: Kind kennt Buchstaben, muss aber jedes Wort mühsam neu erlesen. Arbeitsspeicher ist schnell voll.

#### Herausforderungen (Barrieren)
- Arbeitsspeicher-Anfang des Wortes vergessen, bis das Ende gelesen ist
- Verwechslung: b/d, ei/ie
- Funktionswörter: Häufige Wörter (und, ist) werden nicht wiedererkannt

#### Typische Fehler
- Liest "M-a-m-a" richtig, rät dann aber das Wort oder sagt "Mimi"
- Stockt bei jedem "und"

#### Text-Metriken
- **Wörter**: 20-40 pro Seite
- **Sätze**: 4-6 pro Seite
- **Ø Satzlänge**: 4-6 Wörter

#### Regel für KI-Prompt (System Instruction)
- **Zeit**: Präsens
- **Syntax**: Hauptsätze bevorzugt, natürliche Wortstellung wichtiger als striktes SPO
- **Länge**: Max. 7 Wörter/Satz
- **Wortschatz**: Top-100-Wörter + themenrelevante Wörter (Titel-Wörter sind immer erlaubt)
- **Natürlichkeit**: Jeder Satz muss klingen, wie eine Erzieherin zum Kind sprechen würde. Natürlichkeit geht vor Kürze — ein Satz darf 1-2 Wörter länger sein, wenn er dadurch natürlicher klingt.

#### Beispiel-Sätze
- ✅ "Lilith und ihr Bruder spielen."
- ✅ "Sie haben viel Spaß."
- ✅ "Mama ist da."
- ❌ "Viel Spaß ist da." (unnatürlich)
- ❌ "Es ist Domino." (kein Kind sagt das so)

#### Story-Datenbank Filter
Fokus auf **Top 100 Wörter** (Basis-Wortschatz) + themenrelevante Wörter

---

### Phase 2: Der Ausbau (Mitte Kl. 1 bis Anfang Kl. 2)

#### Unterstufen
- **Stufe 2.1**: Mehrgrapheme (Sonderlaute)
- **Stufe 2.2**: Konsonantenhäufung (Stolpersteine)
- **Stufe 2.3**: Endungen
- **Stufe 2.4**: Komposita

---

#### Phase 2.1: Mehrgrapheme (Sonderlaute)

**Fokus**: Mehrgrapheme (sch, ch, eu, ei, ie, au)

**Sprachliches Ziel**: 
Laut-Zuordnung - Buchstaben-Kombinationen als einen Laut sehen.

**Die Technik-Falle**:
Einzelbuchstaben sitzen, aber Lautverbindungen und lange Wörter bremsen den Fluss.

**Herausforderung**:
Segmentierung: Grapheme (sch, ie) werden zerhackt.

**Typische Fehler**:
Liest "S-p-ielen" statt "Sp-ielen". Liest "Vo-gel" statt "Vogl". Schmunzelt Vokale ein ("B-e-rille").

**Text-Metriken**:
- **Wörter**: 40-60
- **Sätze**: 6-8
- **Ø Länge**: 5-7 Wörter

**Regel für KI-Prompt**:
- **Zeit**: Präsens
- **Syntax**: Hauptsätze, Fokus: Streue Wörter mit Sonderlauten ein
- **Beispiel**: "Das Schwein hat ein Ei. Ich sehe dich."

---

#### Phase 2.2: Konsonantenhäufung (Stolpersteine)

**Fokus**: Konsonantenhäufung (bl, gr, kn, pf, str)

**Sprachliches Ziel**:
Segmentierung - Harte Anlaute flüssig sprechen (ohne Vokal-Einschub).

**Herausforderung**:
Segmentierung: Grapheme (sch, ie) werden zerhackt.

**Typische Fehler**:
- Die Pflanze ist grün. Der Strumpf ist blau.

**Text-Metriken**:
- **Wörter**: 40-60
- **Sätze**: 6-8
- **Ø Länge**: 5-7 Wörter

**Regel für KI-Prompt**:
- **Zeit**: Präsens
- **Syntax**: Hauptsätze
- **Fokus**: Wörter mit harten Clustern nutzen

---

#### Phase 2.3: Endungen

**Fokus**: Endungen (-en, -er, -el)

**Sprachliches Ziel**:
Rhythmus - Verschleifen der Endung ("Vogl" statt "Vo-gel").

**Herausforderung**:
Endungen: Unnatürliches "Roboter-Lesen" (-en, -er) zerhackt den Fluss.

**Typische Fehler**:
- "Der Vater und der Vogellaufen schnell."

**Text-Metriken**:
- **Wörter**: 40-60
- **Sätze**: 6-8
- **Ø Länge**: 5-7 Wörter

**Regel für KI-Prompt**:
- **Zeit**: Präsens
- **Syntax**: Sätze dürfen leicht länger werden (6-8)
- **Fokus**: Zweisilbige Wörter nutzen

---

#### Phase 2.4: Komposita (Nomen + Nomen)

**Fokus**: Komposita (zusammengesetzte Nomen)

**Sprachliches Ziel**:
Morphologie - Lange Wörter in Sinn-Einheiten zerlegen (Lego-Prinzip).

**Herausforderung**:
Cluster-Konsonanten ohne Vokal (str, kn)

**Typische Fehler**:
- "Das Baumhaus hat eine Haustür."

**Text-Metriken**:
- **Wörter**: 40-60
- **Sätze**: 6-8
- **Ø Länge**: 5-7 Wörter

**Regel für KI-Prompt**:
- **Zeit**: Präsens
- **Syntax**: Hauptsätze
- **Fokus**: Zusammengesetzte Nomen (max. 2 Teile)

---

### Phase 3: Der Fluss (Mitte bis Ende Kl. 2)

#### Unterstufen
- **Stufe 3.1**: Präteritum (Erzählzeit)
- **Stufe 3.2**: Vorsilben (ver-, ent-, be-, ge-)
- **Stufe 3.3**: Suffixe/Nachsilben (-ung, -heit, -keit, -nis)
- **Stufe 3.4**: Konjunktionen (weil, dass, aber, denn)

---

#### Phase 3.1: Präteritum (Erzählzeit)

**Sprachliches Ziel**:
Grammatik (Zeit) - Veränderte Wortformen erkennen (sehen → $\rightarrow$ sah).

**Die Grammatik-Hürde**:
Liest einfache Sätze im Präsens gut, stolpert aber über veränderte Wortformen und Zeitwechsel.

**Herausforderung**:
Wortbild-Wechsel: Unregelmäßige Verben (sehen $\rightarrow$ sah).

**Typische Fehler**:
- "Der Hund lief weg. Er sah den Mond."

**Text-Metriken**:
- **Wörter**: 80-100
- **Sätze**: 8-10
- **Ø Länge**: 7-10 Wörter

**Regel für KI-Prompt**:
- **Zeit**: Präteritum (Vergangenheit)
- **Fokus**: Starke Verben nutzen (lief, kam, sah)
- **Syntax**: Einfache Sätze

---

#### Phase 3.2: Vorsilben (ver-, ent-, be-, ge-)

**Sprachliches Ziel**:
Bedeutungswandel - Erkennen, wie die Vorsilbe den Sinn ändert.

**Herausforderung**:
Abstraktion: Nomen, die man nicht anfassen kann (Freiheit).

**Typische Fehler**:
- "Er verlief sich. Er gewann das Spiel."

**Text-Metriken**:
- **Wörter**: 80-100
- **Sätze**: 8-10
- **Ø Länge**: 7-10 Wörter

**Regel für KI-Prompt**:
- **Zeit**: Präteritum
- **Fokus**: Verben mit Vorsilben
- **Syntax**: Einfache Sätze

---

#### Phase 3.3: Suffixe/Nachsilben (-ung, -heit, -keit, -nis)

**Sprachliches Ziel**:
Abstraktion - Nomen erkennen, die keine Gegenstände sind.

**Herausforderung**:
Abstraktion: Nomen, die man nicht anfassen kann (Freiheit).

**Typische Fehler**:
- "Die Wohnung war groß. Er hatte Angst."

**Text-Metriken**:
- **Wörter**: 80-100
- **Sätze**: 8-10
- **Ø Länge**: 7-10 Wörter

**Regel für KI-Prompt**:
- **Zeit**: Präteritum
- **Fokus**: Abstrakte Nomen auf -ung/-heit
- **Syntax**: Sätze mit Objekten

---

#### Phase 3.4: Konjunktionen (weil, dass, aber, denn)

**Sprachliches Ziel**:
Kausalität (Logik) - Sätze verbinden und Gründe verstehen.

**Herausforderung**:
Sinnzusammenhang: Grammatik verstehen. Vergangenes und Gründe (Kausalität) erfassen.

**Typische Fehler**:
- "Er weinte, weil er hinfiel."

**Text-Metriken**:
- **Wörter**: 80-100
- **Sätze**: 8-10
- **Ø Länge**: 7-10 Wörter

**Regel für KI-Prompt**:
- **Syntax**: Nebensätze erlaubt!
- **Fokus**: Kausale Zusammenhänge bilden

---

### Phase 4: Die Geschichte (Ende Kl. 2 bis Anfang Kl. 3)

#### Unterstufen
- **Stufe 4.1**: Satzklammer (Trennbare Verben)
- **Stufe 4.2**: Dialoge & Redebegleiter ("...", sagte er)
- **Stufe 4.3**: Relativsätze (der, die, das, welcher)
- **Stufe 4.4**: Adjektive & Vergleiche (schöner als, am schnellsten)

---

#### Phase 4.1: Satzklammer (Trennbare Verben)

**Sprachliches Ziel**:
Antizipation - Das Satzende vorausahnen ("macht ... zu").

**Der Weitblick**:
Liest technisch flüssig, aber oft monoton. Satzmelodie fehlt noch.

**Herausforderung**:
Antizipation: Das Satzende vorausahnen ("macht ... zu").

**Typische Fehler**:
- "Mama kauft heute im Laden ein."

**Text-Metriken**:
- **Wörter**: 120-150
- **Sätze**: 10-15
- **Ø Länge**: 8-12 Wörter

**Regel für KI-Prompt**:
- **Regel**: Nutze trennbare Verben
- **Syntax**: Verb-Teil 2 muss ans Satzende

---

#### Phase 4.2: Dialoge & Redebegleiter ("...", sagte er)

**Sprachliches Ziel**:
Intonation - Betonung anpassen (laut, leise, fragend).

**Herausforderung**:
Intonation: Betonung anpassen (laut, leise, fragend).

**Typische Fehler**:
- "Komm her!", rief der Vater laut.

**Text-Metriken**:
- **Wörter**: 120-150
- **Sätze**: 10-15
- **Ø Länge**: 8-12 Wörter

**Regel für KI-Prompt**:
- **Regel**: Viel wörtliche Rede nutzen
- **Fokus**: Verben des Sagens (rief, fragte)

---

#### Phase 4.3: Relativsätze (der, die, das, welcher)

**Sprachliches Ziel**:
Gedächtnis - Einschübe verarbeiten, ohne den Faden zu verlieren.

**Herausforderung**:
Gedächtnis: Einschübe verarbeiten, ohne den Faden zu verlieren.

**Typische Fehler**:
- "Der Hund, der bellt, gehört mir."

**Text-Metriken**:
- **Wörter**: 120-150
- **Sätze**: 10-15
- **Ø Länge**: 8-12 Wörter

**Regel für KI-Prompt**:
- **Syntax**: Nutze Relativsätze (Schachtelsätze)
- **Fokus**: Dinge genauer beschreiben

---

#### Phase 4.4: Adjektive & Vergleiche (schöner als, am schnellsten)

**Sprachliches Ziel**:
Detailreichtum - Nuancen und Steigerungen erfassen.

**Herausforderung**:
Detailreichtum: Nuancen und Steigerungen erfassen.

**Typische Fehler**:
- "Er war schneller als der Wind."

**Text-Metriken**:
- **Wörter**: 120-150
- **Sätze**: 10-15
- **Ø Länge**: 8-12 Wörter

**Regel für KI-Prompt**:
- **Fokus**: Komparativ (besser) und Superlativ (am besten)
- **Syntax**: Beschreibende Sätze

---

### Phase 5: Der Profi (Kl. 3 und 4)

#### Unterstufen
- **Stufe 5.1**: Synonyme & Wortfeld (schleichen statt gehen)
- **Stufe 5.2**: Redewendungen (Metaphern)
- **Stufe 5.3**: Abstrakta & Gefühle (Mut, Neid, Freiheit)
- **Stufe 5.4**: Passiv & Sachtext (wird gebaut, man)

---

#### Phase 5.1: Synonyme & Wortfeld

**Fokus**: Schleichen statt gehen

**Sprachliches Ziel**:
Ausdruck - Wortschatzerweiterung. Weg von der "Babysprache".

**Tiefenverständnis**:
Zwischen den Zeilen lesen. Fachsprache und literarischen Stil unterscheiden.

**Herausforderung**:
Stil: Synonyme für "sagen/gehen".

**Typische Fehler**:
- "Leise schlich er davon. Er flüsterte."

**Text-Metriken**:
- **Wörter**: 200-300+
- **Sätze**: 15-20+
- **Ø Länge**: Variabel

**Regel für KI-Prompt**:
- **Verbot**: Nutze NICHT "sagen" oder "gehen"
- **Befehl**: Nutze präzise Verben

---

#### Phase 5.2: Redewendungen (Metaphern)

**Sprachliches Ziel**:
Interpretation - Bilder nicht wörtlich nehmen.

**Herausforderung**:
Interpretation: Bilder nicht wörtlich nehmen.

**Typische Fehler**:
- "Er hatte Schweingehabt. Ihm platzte der Kragen."

**Text-Metriken**:
- **Wörter**: 200-300+
- **Sätze**: 15-20+
- **Ø Länge**: Variabel

**Regel für KI-Prompt**:
- **Fokus**: Sprichwörter einbauen
- **Achtung**: Kontext muss helfen, es zu verstehen

---

#### Phase 5.3: Abstrakta & Gefühle (Mut, Neid, Freiheit)

**Sprachliches Ziel**:
Theory of Mind - Komplexe innere Zustände nachvollziehen.

**Herausforderung**:
Theory of Mind: Komplexe innere Zustände nachvollziehen.

**Typische Fehler**:
- "Er spürte Neid in sich aufsteigen."

**Text-Metriken**:
- **Wörter**: 200-300+
- **Sätze**: 15-20+
- **Ø Länge**: Variabel

**Regel für KI-Prompt**:
- **Fokus**: Innere Monologe und Gefühle beschreiben
- **Syntax**: Anspruchsvoll

---

#### Phase 5.4: Passiv & Sachtext (wird gebaut, man)

**Sprachliches Ziel**:
Genre-Kompetenz - Sachliche, unpersönliche Texte verstehen.

**Herausforderung**:
Genre-Kompetenz: Sachliche, unpersönliche Texte verstehen.

**Typische Fehler**:
- "Hier wird Gold gefunden. Das Haus wurde gebaut."

**Text-Metriken**:
- **Wörter**: 200-300+
- **Sätze**: 15-20+
- **Ø Länge**: Variabel

**Regel für KI-Prompt**:
- **Grammatik**: Passiv-Konstruktionen
- **Stil**: Nüchtern, informativ

---

### Spezielle Zielgruppen & Anpassungen

Das 5-Phasen-Modell kann an verschiedene Lernbedürfnisse angepasst werden:

#### LRS / Legasthenie

**Kritische Phasen**: Phase 1 & 2 (Technik)

**Herausforderungen**:
- Visuelles Chaos: Buchstaben tanzen (b/d)
- Wortbilder "Pflaster" (2.2) verschwimmen
- Raten statt Lesen

**Chancen** (Potenzial):
- Kreative Kompensation: Starkes Verständnis durch Kontext-Raten und Bilder

**Lösungsstrategie** (Im Tool & Pädagogisch):
1. **Visuelle Entlastung**: Automatische Silbenfärbung (Sprechsilben blau/rot) im Text. Nutzung spezieller Schriftarten (OpenDyslexic)
2. **Inhaltliche Vereinfachung**: Vermeidung von visuell ähnlichen Wörtern im selben Satz (nicht "Ball" und "Bild" zusammen)
3. **Audio-Support**: Vorlese-Funktion (Karaoke-Modus), bei dem das aktuelle Wort markiert wird

---

#### Autismus (ASS)

**Kritische Phasen**: Phase 4 & 5 (Sinn)

**Herausforderungen**:
- Wörtliches Verstehen: Metaphern ("Tomaten auf den Augen") verwirren
- Soziale Nuancen in Dialogen unklar

**Chancen** (Potenzial):
- Muster-Liebe: Begeisterung für klare Regeln, Grammatik und logisch aufgebaute Sachtexte

**Lösungsstrategie** (Im Tool & Pädagogisch):
1. Option: Redewendungen automatisch durch die wörtliche Bedeutung zu ersetzen (Toggle "Klar-Modus": "Er ist sehr wütend" statt "Er kocht vor Wut")
2. Explikte Gefühle: Gefühle logisch beschreiben ("Tim fühlt sich ... Er weint, weil er ...")
3. Vorhersehbarkeit: Klare Struktur der Geschichten ohne überraschende, unlogische Wendungen

---

#### ADHS (Ausdauer)

**Kritische Phasen**: Phase 1 & 4 (Ausdauer)

**Herausforderungen**:
- Mangelnde Motivation: Schnelle Langeweile bei repetitiven Texten. Abbruch bei langen Textblöcken ("Bleiwüsten")

**Chancen** (Potenzial):
- Hyperfokus: Extremes Lesevermögen, wenn das Thema (z.B. Minecraft, Dinos) das persönliche Interesse trifft

**Lösungsstrategie** (Im Tool & Pädagogisch):
1. Der "Interessen-Hack": Personalisierung ist der Schlüssel des Kindes und sein Lieblingsthema MÜSSEN in der Geschichte vorkommen (Hobbythema: z.B. 
2. Texte in extrem kurze Häppchen (Chunks) aufteilen. Nach jedem Abschnitt eine kleine Belohnung/Interaktion
3. Action: Lange Beschreibungen kürzen. Textselektion: Fokus auf Dialoge und Handlung

---

#### DaZ / DaF (Zweitsprache)

**Kritische Phasen**: Phase 1 & 3 (Grammatik)

**Herausforderungen**:
- Struktur-Hürden: Artikel (der/die/das), Umlaute und die Satzklammer ("macht ... zu") erschweren das Verständnis

**Chancen** (Potenzial):
- Auditive Stärke: Oft exzellentes Sprachgefühl und Merkfähigkeit über das Gehör

**Lösungsstrategie** (Im Tool & Pädagogisch):
1. **Farbcodierte Grammatik**: Artikel und Nomen farblich markieren (Maskulin=Blau, Feminin=Rot, Neutral=Grün)
2. **Syntax-Vereinfachung**: Verzicht auf das Präteritum (Buchsprache) in frühen Phasen. Nutzung von Perfekt ("hat gemacht") oder Präsens
3. **Wortschatz-Vorentlastung**: Schwierige Wörter vor dem Text als Bild zeigen

---

#### Sehbehinderung

**Kritische Phasen**: Phase 2 & 4 (Optik)

**Herausforderungen**:
- Crowding (Enge): Buchstaben verschmelzen bei geringem Kontrast oder engem Abstand. Zeilenverlust

**Chancen** (Potenzial):
- Visuelles Speichern: Starkes visuelles Gedächtnis für Wortbilder (Ganzwortmethode / Stufe 1)

**Lösungsstrategie** (Im Tool & Pädagogisch):
1. **High-Contrast-UI**: Gelbe Schrift auf schwarzem Grund (besser als Weiß auf Schwarz)
2. **Fokus-Zoom**: Es wird immer nur ein Satz (oder sogar ein Wort) auf dem Bildschirm angezeigt, der Rest ist ausgeblendet
3. **Serifenlose Schriften**: Verzicht auf Schnörkel (Arial/Verdana statt Times New Roman)

---

#### Hörbehinderung

**Kritische Phasen**: Phase 2 (Laute)

**Herausforderungen**:
- Phonem-Problem: Lautzuordnung (Graphem → Phonem) ist schwer, wenn man den Laut nie gehört hat

**Chancen** (Potenzial):
- Visuelles Speichern: Starkes visuelles Gedächtnis für Wortbilder (Ganzwortmethode / Stufe 1)

**Lösungsstrategie** (Im Tool & Pädagogisch):
1. **Ganzwort-Strategie**: Fokus auf das Einprägen von Wörtern (Flashcards), weniger auf das "Erlauschen"
2. **Visualisierung**: Mehr Bilder zur Unterstützung des Textinhalts
3. **Syntax-Training**: Da Gebärdensprache eine andere Grammatik hat, helfen grafische Satzmodelle (Wer tut was?), um den deutschen Satzbau zu verstehen

---

### Content-Anforderungen pro Phase

#### Generelle Regeln für alle Phasen

**Textqualität**:
- Phasengerechte Sprache (siehe Stufen-Details)
- Positive, motivierende Botschaften
- Diverse Charaktere und Situationen
- Wiederholungen für Lerneffekt (besonders Phase 1-2)

**Illustrationen**:
- Eine Illustration pro Seite
- Unterstützt Textverständnis visuell
- Professionelle, kindgerechte Qualität
- Kontextuell hilfreich für Worthilfe

### Die 5 Autoren-Profile (mit Design-Spezifikationen)

Um verschiedene Lernstile und Interessen anzusprechen, gibt es **5 verschiedene Autoren**, die jeweils einen eigenen Stil und Fokus haben:

---

#### 1. 📚 Samira Wissensfreund (Sachtexte)

**Avatar**: Junge Frau mit Brille, warmem Lächeln, professionellem Erscheinungsbild

**Stil**: Sachlich, informativ, strukturiert  
**Tonalität**: Wissensvermittelnd, aber zugänglich und freundlich  
**Fokus**: Wissensthemen, Natur, Technik, Geschichte, Geographie  
**Geeignet für**: Phase 4-5, wissbegierige Kinder, Sachtext-Training  

**Text-Eigenschaften**:
- Faktendichte Sprache
- Klare Struktur (Einleitung → Erklärung → Fazit)
- Fachbegriffe werden erklärt
- "Wusstest du?"-Fakten eingestreut
- Präsens und sachlicher Ton

**Beispiel-Themen**: 
- "Der Walhai: Ein Gigant mit sanfter Seele"
- "Wie funktioniert ein Vulkan?"
- "Hola Spanien - Dein Reiseführer"
- "Fliegen ohne Motor: Das Segelflugzeug-Geheimnis"

**Autoren-Beschreibung im UI**:  
*"Samira liebt es, spannende Fakten zu sammeln und dir die Welt zu erklären. Mit ihr lernst du immer etwas Neues!"*

**Design-Elemente**:
- Farbe: Blau/Türkis (wissenschaftlich, seriös)
- Icons: Lupe, Buch, Mikroskop
- Cover-Stil: Realistisch, dokumentarisch

**Pädagogischer Wert**: Fördert Lesekompetenz in Sachtexten (wichtig für Schulerfolg ab Klasse 3-4), erweitert Weltwissen

---

#### 2. 🌙 Deniz Traumfänger (Traumreisen)

**Avatar**: Verträumter Junge mit sanftem Gesichtsausdruck, entspannter Haltung

**Stil**: Beruhigend, fantasievoll, meditativ, poetisch  
**Tonalität**: Sanft, einladend, entspannend  
**Fokus**: Entspannungsgeschichten, Fantasiereisen, magische Welten, sanfte Abenteuer  
**Geeignet für**: Alle Phasen, besonders ADHS (zur Beruhigung), abends vor dem Schlafengehen  

**Text-Eigenschaften**:
- Langsamer, beschaulicher Rhythmus
- Viele beschreibende Adjektive und Sinneseindrücke
- Wiederholungen für meditativen Effekt
- "Du"-Ansprache (führt das Kind durch die Reise)
- Präsens, manchmal Imperativ ("Stell dir vor...")

**Beispiel-Themen**: 
- "Das Geheimnis der Sonnenflecken"
- "Reise zu den Wolken"
- "Die magische Unterwasserwelt"
- "Im Zauberwald"

**Autoren-Beschreibung im UI**:  
*"Deniz hat eine blühende Fantasie. Er nimmt dich mit auf Reisen in fantastische Welten, wo alles möglich ist."*

**Design-Elemente**:
- Farbe: Lila/Violett, sanfte Pastelltöne
- Icons: Mond, Sterne, Wolken, Traumfänger
- Cover-Stil: Weich, neblig, verträumt, aquarell-artig

**Pädagogischer Wert**: Fördert innere Bilder, Entspannung, Konzentration und Achtsamkeit

---

#### 3. 🎈 Jonas Entdecker (Klassische Kindergeschichten)

**Avatar**: Freundlicher Junge mit neugierigem Blick, Entdecker-Look

**Stil**: Warmherzig, lebendig, abenteuerlich, authentisch  
**Tonalität**: Nahbar, humorvoll, ehrlich  
**Fokus**: Alltagsabenteuer, Freundschaft, Problemlösung, realistische Situationen  
**Geeignet für**: Alle Phasen, "Standard"-Geschichten  

**Text-Eigenschaften**:
- Natürliche, kindliche Sprache
- Identifikationsfiguren auf Augenhöhe
- Humor und leichte Ironie
- Dialoge und direkte Rede
- Vergangene Zeitformen (Präteritum/Perfekt) für Erzählungen
- Manchmal witzige Beobachtungen ("... manchmal wie Wackelpudding")

**Beispiel-Themen**: 
- "Als der Schnee zurückschlug"
- "Der blaue Panzer des Schreckens"
- "Max und der verlorene Teddy"
- "Lena lernt Fahrradfahren"

**Autoren-Beschreibung im UI**:  
*"Jonas erzählt Geschichten, die wirklich so passieren könnten. Die volle Wahrheit über faule Sonntage, nervige Matheaufgaben und warum das Leben manchmal wie Wackelpudding ist."*

**Design-Elemente**:
- Farbe: Warmes Orange/Gelb (sonnig, freundlich)
- Icons: Kompass, Lupe, Rucksack
- Cover-Stil: Illustrativ, lebendig, farbenfrohe Szenen

**Pädagogischer Wert**: Sozial-emotionales Lernen, klassische Erzählstrukturen, Empathie-Förderung

---

#### 4. 📱 Holzi Pixelkopf (YouTuber-Stil)

**Avatar**: Cooler Junge mit lockerer Kleidung, Gaming-Vibe, moderner Look

**Stil**: Modern, dynamisch, umgangssprachlich, direkte Ansprache, energiegeladen  
**Tonalität**: Lässig, witzig, manchmal ironisch, "auf Augenhöhe"  
**Fokus**: Gaming, Technik, coole Abenteuer, Challenges, Digital-Kultur  
**Geeignet für**: Phase 2-4, besonders ADHS-Kinder, technikaffine Jungs, lesemüde Kinder  

**Text-Eigenschaften**:
- Kurze, knackige Sätze
- YouTuber-Sprache: "Leute", "krass", "epic", "fail", "scam"
- Direkte Ansprache (wie in Video)
- Übertreibungen und Ausrufezeichen
- Slang (angemessen für Kinder)
- Präsens für Unmittelbarkeit
- Großbuchstaben-Wörter für Betonung ("SCAM", "EPIC")

**Beispiel-Themen**: 
- "Der Retro-Konsolen-SCAM"
- "Epic Minecraft-Abenteuer"
- "Mein erster YouTube-Kanal"
- "Challenge im Skateboard-Park"

**Autoren-Beschreibung im UI**:  
*"Holzi ist Gamer und Chaos-Magnet. Er zeigt dir, dass man auch mit Bugs im System und mehr Glück als Verstand das Level meistert."*

**Design-Elemente**:
- Farbe: Neon-Grün/Cyan (gaming, digital)
- Icons: Controller, Pixel, Gaming-Konsole
- Cover-Stil: Digital, pixel-artig, dynamisch, kräftige Kontraste

**Pädagogischer Wert**: Spricht lesemüde Kinder an, hohe Motivation durch Nähe zur digitalen Lebenswelt, zeigt dass Lesen "cool" sein kann

---

#### 5. 🖼️ Bildergeschichten (Visueller Fokus)

**Kein Avatar** (Format, kein Charakter)

**Stil**: Visuell-narrativ, sehr bildlastig, minimalistischer Text  
**Tonalität**: Einfach, direkt, beschreibend  
**Fokus**: 6 konsistente Bilder erzählen die Geschichte, Text ergänzt nur  
**Geeignet für**: Alle Phasen, besonders Phase 1-2, LRS, DaZ, visuelle Lerner  

**Text-Eigenschaften**:
- Sehr kurze Sätze (1-3 pro Bild)
- Max. 15 Wörter pro Bild
- Beschreibt, was im Bild zu sehen ist
- Präsens
- Einfache Hauptsätze (SPO)
- Keine komplexen Konstruktionen

**Beispiel-Themen**: 
- "Momo spielt Domino"
- "Der kleine Drache lernt fliegen" (6 Szenen)
- "Emmas Geburtstag" (6 Momente)

**Besonderheiten**:
- **6 Bilder** pro Geschichte (KI-generiert mit konsistentem Stil)
- **Großformat-Bilder** (nehmen 90% des Screens ein)
- **Text unter dem Bild** (nicht überlagert)
- Bilder sind nummeriert (Bild 1/6, 2/6, etc.)
- Navigation: Wisch-Geste oder Pfeile

**Design-Elemente**:
- Farbe: Bunt, aber harmonisch
- Icons: Bilderrahmen, Comics, Kamera
- Cover-Stil: Erstes Bild der Serie als Cover

**Pädagogischer Wert**: 
- Reduziert kognitive Last beim Dekodieren
- Kontextuelles Verstehen durch Bilder
- Ideal für Leseanfänger und visuelle Lerner
- Bildabfolge trainiert narrative Kompetenz
- Weniger Text = mehr Fokus auf einzelne Wörter

**Technische Besonderheit**:
- Alle 6 Bilder müssen **konsistente Charaktere** haben
- Seed-basierte KI-Generierung oder Illustrator-Auftrag
- Bilder werden als Set produziert

---

### Autoren-Auswahl im UI

**In der Bibliothek**:
- Filter nach Autor (Icons mit Avatar-Bildern)
- Jedes Buch zeigt das Autoren-Icon
- Tooltip erklärt den Stil: "Holzi schreibt wie ein YouTuber - cool und modern!"

**Beim Profil-Setup** (Onboarding):
- "Welche Geschichten magst du am liebsten?"
- Kind wählt 1-2 Lieblings-Autoren aus
- App priorisiert diese Autoren in Empfehlungen

**Im Elternbereich**:
- Statistik: "Max liest am liebsten Holzi-Geschichten (65%)"
- Empfehlung: "Versuch mal Samira für mehr Sachtext-Übung!"

---

**Thematische Vielfalt** (verteilt über alle Autoren):
1. Abenteuer & Entdeckung (Jonas, Holzi)
2. Tiere & Natur (Jonas, Samira)
3. Freundschaft & Familie (Jonas, Deniz)
4. Fantasie & Magie (Deniz, Jonas)
5. Alltag & Schule (Jonas, Holzi)
6. Mut & Selbstvertrauen (Jonas, Deniz)
7. Wissen & Sachthemen (Samira)
8. Gaming & Digital (Holzi)
9. Entspannung & Achtsamkeit (Deniz)

---

### Initiale Bibliothek (MVP)

**Phase 1 (Start)**:
- 8 Geschichten
- Fokus: Top 100 Wörter
- Themen: Familie, Tiere, Alltag

**Phase 2 (Ausbau)**:
- 12 Geschichten (3 pro Unterstufe)
- Fokus: Technische Lesefähigkeit
- Themen: Abenteuer, Natur, Freundschaft

**Phase 3 (Fluss)**:
- 12 Geschichten (3 pro Unterstufe)
- Fokus: Grammatik und Zeitformen
- Themen: Erzählungen, kleine Geschichten

**Phase 4 (Geschichte)**:
- 10 Geschichten
- Fokus: Komplexe Satzstrukturen
- Themen: Längere Erzählungen, Abenteuer

**Phase 5 (Profi)**:
- 8 Geschichten
- Fokus: Literarischer Stil, Sachtexte
- Themen: Vielfältig, auch Sachthemen

### Initiale Bibliothek (MVP)

**Gesamt: 50 Geschichten** + **10 Bildergeschichten** = **60 Inhalte**

#### Verteilung nach Phasen

**Phase 1 (Start)**: 8 Geschichten
- 3x Jonas (Alltag, Familie)
- 2x Bildergeschichten
- 2x Deniz (sanfte Einführung)
- 1x Holzi (motivierend)

**Phase 2 (Ausbau)**: 12 Geschichten (3 pro Unterstufe)
- 5x Jonas (klassisch)
- 3x Holzi (Action, Gaming)
- 2x Deniz (Fantasie)
- 2x Bildergeschichten

**Phase 3 (Fluss)**: 12 Geschichten (3 pro Unterstufe)
- 5x Jonas (Erzählungen)
- 3x Holzi (Challenges)
- 2x Deniz (Traumreisen)
- 2x Samira (erste Sachtexte)

**Phase 4 (Geschichte)**: 10 Geschichten
- 4x Jonas (längere Abenteuer)
- 3x Samira (Wissensthemen)
- 2x Holzi (coole Geschichten)
- 1x Deniz (komplexe Fantasie)

**Phase 5 (Profi)**: 8 Geschichten
- 3x Samira (Sachtext-Fokus)
- 2x Jonas (literarischer Stil)
- 2x Holzi (komplexe Gaming-Stories)
- 1x Deniz (metaphorische Traumreisen)

**Bildergeschichten**: 10 (verteilt auf Phase 1-3)
- Phase 1: 2
- Phase 2: 2
- Phase 3: 2
- Phase 4-5: 4 (optional, für visuelle Lerner in höheren Phasen)

---

#### Verteilung nach Autoren (Gesamt)

1. **Jonas Entdecker**: 19 Geschichten (32%) - Basis, für alle
2. **Holzi Pixelkopf**: 11 Geschichten (18%) - ADHS, Gaming-Fans
3. **Samira Wissensfreund**: 8 Geschichten (13%) - Sachtext-Training
4. **Deniz Traumfänger**: 7 Geschichten (12%) - Entspannung, Fantasie
5. **Bildergeschichten**: 10 (17%) - Visuelle Lerner, Phase 1-2
6. **Gemischt/Special**: 5 (8%) - Kollaborationen, Events

---

#### Thematische Verteilung

- Abenteuer & Entdeckung: 12
- Tiere & Natur: 10
- Freundschaft & Familie: 8
- Gaming & Digital (Holzi): 6
- Wissen & Sachthemen (Samira): 8
- Fantasie & Magie (Deniz): 7
- Alltag & Schule: 6
- Entspannung (Deniz): 3

---

## 7. Technische Features

### Spracherkennung

**Anforderungen**:
- Echtzeit-Verarbeitung
- Kinderstimmen-Erkennung
- Dialekt-Toleranz
- Offline-Modus (optional)

**Implementierung**:
- Web Speech API für Browser-Version
- Google Cloud Speech-to-Text für höhere Genauigkeit
- Phonetisches Matching für Aussprachevarianten
- Rauschunterdrückung

### Text-Tracking

**Word-Highlighting**:
- Synchronisation zwischen Audio-Input und Text
- Flüssiger Übergang zwischen Wörtern
- Fehlertoleranz bei kleinen Pausen

**Fortschritt-Speicherung**:
- Automatisches Speichern nach jeder Seite
- Cloud-Sync zwischen Geräten
- Offline-Verfügbarkeit mit Sync später

### Performance

**Optimierungen**:
- Lazy Loading für Buchcover
- Image Compression
- Audio-Preloading für TTS
- Service Worker für Offline-Nutzung

---

## 8. Design-System

### Plattform-spezifische Überlegungen

**Progressive Web App (PWA) Design**:
- **Mobile-First**: Design zuerst für Smartphone, dann skalieren für Tablet/Desktop
- **Touch-Targets**: Alle interaktiven Elemente min. 44x44px (Apple), 48x48px (Material Design)
- **Safe Areas**: Berücksichtige iPhone-Notch, Android-Navigationbar
- **Swipe-Gesten**: Intuitiv für Kinder (Wischen statt Klicken)
- **Installier-Prompt**: Freundliche Aufforderung "Auf Homescreen installieren"

### Farbpalette

**Primärfarben**:
- Sonnenblumen-Gelb: `#FFD93D` (Hauptakzent)
- Grasgrün: `#6BCB77` (Erfolg, positiv)
- Himmelblau: `#4D96FF` (Buttons, Links)

**Sekundärfarben**:
- Warmes Orange: `#FF9F40` (Warnungen)
- Sanftes Rosa: `#FFB6C1` (weiblicher Avatar-Option)
- Helles Lila: `#B4A7D6` (Belohnungen)

**Neutral**:
- Dunkelgrau: `#2C3E50` (Text)
- Hellgrau: `#ECF0F1` (Hintergründe)
- Weiß: `#FFFFFF`

### Typografie

**Hauptschrift** (Text):
- OpenDyslexic oder Comic Sans MS
- Größen: 
  - Mobile: 24px (Lesealter 5-6), 20px (7-8), 18px (9-10)
  - Tablet: +2px
  - Desktop: +4px
- Zeilenabstand: 2.0 (großzügig für Lesbarkeit)

**Überschriften**:
- Fredoka One oder ähnliche freundliche Schrift
- Größen: 
  - Mobile: 28px (H1), 22px (H2), 18px (H3)
  - Tablet: 32px (H1), 24px (H2), 20px (H3)
  - Desktop: 36px (H1), 28px (H2), 22px (H3)

### Responsive Breakpoints

```css
/* Mobile First */
.container {
  padding: 16px;
}

/* Tablet (768px+) */
@media (min-width: 768px) {
  .container {
    padding: 24px;
    max-width: 768px;
  }
}

/* Desktop (1024px+) */
@media (min-width: 1024px) {
  .container {
    padding: 32px;
    max-width: 1200px;
  }
}
```

### Komponenten

**Buttons**:
- Mindestgröße: 
  - Mobile: 44x44px (Touch-friendly)
  - Desktop: 40x40px
- Border-Radius: 15px (freundlich, rund)
- Box-Shadow für 3D-Effekt
- Hover/Active States (Desktop + Mobile)
- Ripple-Effekt bei Touch (Material Design)

**Cards** (Bücher):
- Border-Radius: 20px
- Subtiler Schatten (4px blur)
- Hover: Leichter Lift-Effekt (Desktop)
- Touch: Scale-Animation (Mobile)

**Icons**:
- Rounded, freundliche Icons (Feather Icons oder Heroicons)
- Mindestgröße: 24x24px (Mobile), 20x20px (Desktop)
- Konsistenter Stil (alle outline oder alle filled)

### Mobile-spezifische Patterns

**Bottom Navigation** (Mobile):
```
┌────────────────────────┐
│                        │
│   Content Area         │
│                        │
└────────────────────────┘
┌─────┬──────┬──────┬────┐
│ 🏠  │  📚  │  ⭐  │ 👤 │
│Home │Biblio│Stars │Prof│
└─────┴──────┴──────┴────┘
```

**Swipe-Gesten**:
- Swipe Links/Rechts: Seiten-Navigation (Leseseite)
- Swipe Runter: Aktualisieren (Bibliothek)
- Long-Press: Worthilfe-Menü

**Pull-to-Refresh**:
- Bibliothek aktualisieren
- Neue Geschichten laden
- Native iOS/Android Feel

### PWA-spezifische UI-Elemente

**Install-Prompt** (wenn noch nicht installiert):
```
┌──────────────────────────────────┐
│ 📱 Installiere Lesekumpel         │
│ Füge die App zu deinem           │
│ Homescreen hinzu!                │
│                                  │
│  [Installieren]  [Später]       │
└──────────────────────────────────┘
```

**Offline-Indikator**:
```
┌──────────────────────────────────┐
│ ⚠️ Keine Internetverbindung      │
│ Nur gespeicherte Stories         │
│ verfügbar                        │
└──────────────────────────────────┘
```

**Loading States** (Progressive Loading):
```
1. Skeleton Screen (während laden)
2. Content fade-in (wenn geladen)
3. Lazy Loading (Bilder nach und nach)
```

---

## 9. Datenschutz & Sicherheit

### Datenschutz

**Minimale Datensammlung**:
- Nur notwendige Daten (Vorname, Alter, Fortschritt)
- Keine persönlichen Informationen
- DSGVO-konform

**Audio-Verarbeitung**:
- Audio wird nur für Spracherkennung verwendet
- Keine permanente Speicherung
- Optional: Audio-Snippets für Verbesserung (opt-in)

### Kinderschutz

**Sichere Umgebung**:
- Kein externer Content
- Keine In-App-Käufe ohne Eltern-PIN
- Keine Werbung
- Kein Social-Media-Integration

**Elternkontrolle**:
- PIN-geschützter Elternbereich
- Zeitlimits einstellbar
- Content-Filter

---

## 10. Monetarisierung (optional)

### Freemium-Modell

**Free Tier**:
- 10 kostenlose Bücher
- Basis-Statistiken
- Alle Kern-Features

**Premium** (4,99€/Monat oder 49€/Jahr):
- Vollständige Bibliothek (100+ Bücher)
- Erweiterte Statistiken
- Mehrere Kinderprofile
- Eigene Bücher hochladen
- Werbefreiheit (falls Free Tier mit Ads)

**Alternative**: Einmalkauf (29,99€)

---

## 11. MVP (Minimum Viable Product)

### Phase 1 - Kern-Features (3-4 Monate)

**Must-have**:
- **Progressive Web App** (PWA) Setup
  - Service Worker für Offline-Modus
  - Web App Manifest (Homescreen-Installation)
  - Responsive Design (Mobile-First)
- Onboarding & Profilerstellung (inkl. Lieblings-Autoren-Auswahl)
- **5 Autoren-Profile** implementiert (Jonas, Holzi, Deniz, Samira, Bildergeschichten)
- Bibliothek mit **30 Geschichten** (verteilt über alle Autoren)
  - 10x Jonas
  - 5x Holzi
  - 5x Deniz
  - 5x Samira
  - 5x Bildergeschichten
- Leseseite mit Spracherkennung (beide Formate: Text + Bildergeschichten)
- **Word-Tap-Feature**: Wort antippen = sofort vorlesen
- **Word-Tracking-System**: Erfassung aller Wort-Interaktionen
- Worthilfe-Funktion (Schnell-Vorlesung + Detail-Hilfe)
- Einfaches Belohnungssystem (Sterne)
- Elternbereich (Basis + Wort-Tracking-Dashboard)

**Technisch**:
- **Web-App** (Next.js + React, deployed auf Vercel)
- Responsive Design (funktioniert auf Handy, Tablet, Desktop)
- Web Speech API (Browser-basierte Spracherkennung)
- Supabase (Datenbank + Auth + Storage)
- **Tracking-Datenbank** (PostgreSQL)
- User Authentication
- PWA-Features (installierbar, offline-fähig für gecachte Stories)

**Plattformen**:
- ✅ Smartphone (iOS Safari, Android Chrome)
- ✅ Tablet (iPad, Android Tablets)
- ✅ Desktop (Chrome, Edge, Safari, Firefox)
- ✅ Installierbar auf Homescreen (wie eine App)

### Phase 2 - Erweiterung (2-3 Monate)

**Nice-to-have**:
- Erweiterte Bibliothek (30 Bücher)
- Abzeichen-System
- Streak-Tracking
- Übungsplatz
- Verbesserte Statistiken

### Phase 3 - Polish & Erweiterte Features (2-3 Monate)

**Optimization**:
- Erweiterte Bibliothek (100+ Geschichten)
- **PWA-Verbesserungen**:
  - Vollständiger Offline-Modus (alle Stories downloadbar)
  - Background Sync (Tracking-Daten synchronisieren)
  - Push Notifications (Lese-Erinnerungen)
  - Share API (Geschichten mit Freunden teilen)
- Erweiterte Spracherkennung (Google Cloud Speech-to-Text)
- Community-Features:
  - Kommentare unter Geschichten
  - Leaderboards (optional, spielerisch)
- Eltern-Features:
  - Wöchentliche Reports per Email
  - Erweiterte Analytics
  - Eigene Geschichten hochladen (Beta)
- Performance-Optimierungen:
  - Image Optimization
  - Code Splitting
  - Caching-Strategien

---

## 12. Erfolgskriterien

### KPIs

**Engagement**:
- Durchschnittliche Nutzungsdauer: 15+ Min./Session
- Retention Rate: 40%+ nach 7 Tagen
- Weekly Active Users: 60%+ der Downloads

**Lerneffekt**:
- Durchschnittlicher Fortschritt: +1 Lesestufe in 3 Monaten
- Bücher abgeschlossen: 2+ pro Woche
- Eltern-Zufriedenheit: 4.5+ Sterne

**Technisch**:
- Spracherkennung-Genauigkeit: 85%+
- App-Load-Time: <3 Sekunden
- Crash-Rate: <1%

---

## 13. Nächste Schritte

### Sofort starten:

1. **Prototyping**: Figma/Sketch Design für alle Hauptseiten
2. **Story-Writing**: Erste 5 Geschichten schreiben + illustrieren
3. **Tech-Stack festlegen**: Entscheidung React vs. React Native
4. **MVP Scope definieren**: Welche Features in Phase 1?
5. **Spracherkennung testen**: Proof-of-Concept mit Web Speech API

### Tools & Ressourcen:

- **Design**: Figma, Canva (Illustrationen)
- **Development**: VS Code, Git, Vercel/Netlify
- **Backend**: Firebase, Supabase, oder Custom (Node.js)
- **Testing**: Kinder im Umfeld für User Testing
- **Illustration**: Freepik, Undraw, oder Fiverr/Upwork für Custom Art

---

## Zusammenfassung

Diese Konzeption bietet eine solide Grundlage für eine kindgerechte, motivierende Leseapp. Der Fokus liegt auf:

✅ Intuitive, kindgerechte Benutzeroberfläche
✅ Gamification ohne Überforderung
✅ Effektive Spracherkennung mit hilfreichem Feedback
✅ Eltern-Transparenz und -Kontrolle
✅ Skalierbare technische Architektur
✅ Datenschutz und Kindersicherheit

Die App soll Kindern Freude am Lesen vermitteln und messbare Lernfortschritte ermöglichen!
