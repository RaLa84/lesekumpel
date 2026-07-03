"""Baut das Sachtext-Generator-Template (n8n-config/demo-template-sachtext.html).

Der Sachtext-Workflow (Samira) holt sein Template zur Laufzeit von
  https://raw.githubusercontent.com/RaLa84/lesekumpel/main/n8n-config/demo-template-sachtext.html
und befüllt die {{PLATZHALTER}} im Knoten "HTML assemblieren" (assemble-html-sachtext-v1.js).

Quelle ist das FERTIGE n8n-config/demo-template.html (kein zweiter Donor — die
Donor-Kette bleibt einstufig: Donor -> build-generator-template.py -> demo-template.html
-> dieses Script -> demo-template-sachtext.html). Nach jeder Regeneration von
demo-template.html muss dieses Script erneut laufen.

Die Lese-Engine (Donor) stellt generische, No-Op-fähige Hooks bereit:
  - window.computeStoryInserts(allGroups, ctx)  (Einschübe/Lern-Block)
  - window.decorateStoryView(view) / window.undecorateStoryView(view)  (Skin)
  - window.FORCE_SCROLL_DEFAULT  (Scroll statt Tafel-Auto als Standard)

Dieses Script definiert die Sachtext-Implementierung ("Magazin-Skin"):

  1. CSS vor </style>: Wissens-Kästen (v2) + Magazin-Layout (Hero-Meta,
     alternierende Kapitel-Sektionen, Kapitelnummern, Konzeptkarte "Das Wort
     heute", Outro-Karte, Scroll-Reveal, aufklappbares Wusstest-du, Tafel-Toggle).
  2. JS nach dem N8N-Datenblock: sachtextBlocks + computeStoryInserts (Wusstest-du
     zwischen den Mini-Kapiteln, Konzeptkarte in der mittleren Lücke, Lern-Block
     ans Ende) + Merklisten-Interaktion + decorate/undecorate (Magazin-Sektionen)
     + FORCE_SCROLL_DEFAULT + Tafel-Umschalter in den Lesehilfen.
  3. Statischer Hero-Meta-Patch (Themen-Pill + Autoren-Chip) vor {{STORY_IMAGES_HTML}}.
  4. related-card-Links auf ../demo-texte/ umschreiben.

Aufruf:  python scripts/build-generator-template-sachtext.py [--check]
  --check : nur prüfen, nichts schreiben
"""
import re
import sys
from pathlib import Path

REPO = Path(__file__).resolve().parent.parent
SRC = REPO / "n8n-config" / "demo-template.html"
OUT = REPO / "n8n-config" / "demo-template-sachtext.html"

CSS_BLOCK = """
        /* ── Sachtext-Einschübe & Lern-Block (alle Modi sichtbar) ── */
        .story-insert, .story-insert * { box-sizing: border-box; }
        .story-insert { margin: 1.6em 0; font-size: 0.78em; line-height: 1.55; text-align: left; }
        .sachtext-box { border-radius: 16px; padding: 0.9em 1.1em; }
        .sachtext-box + .sachtext-box { margin-top: 0.9em; }
        .sachtext-box-head { display: flex; align-items: center; gap: 0.5em; font-family: 'Fredoka', sans-serif; font-weight: 600; font-size: 0.95em; margin-bottom: 0.45em; }
        .sachtext-box-head svg { width: 1.25em; height: 1.25em; flex: 0 0 auto; }
        .sachtext-box-body { margin: 0; }
        /* Kurzfassung: gelb (freundlich statt alarmierend) */
        .sachtext-box-summary { background: #FFF3CC; border: 2px solid #FFD54F; }
        .sachtext-box-summary .sachtext-box-head { color: #8a6d00; }
        .sachtext-box-check { background: #E8F5EE; border: 2px solid #7BC29A; }
        .sachtext-box-check .sachtext-box-head { color: #2E7D52; }
        .merk-hint { font-size: 0.72em; color: #5a6368; margin-bottom: 0.6em; }
        .merk-list { display: grid; gap: 0.45em; }
        button.merk-item { display: flex; gap: 0.6em; align-items: flex-start; width: 100%; background: rgba(255,255,255,0.85); border: 2px solid #7BC29A; border-radius: 12px; padding: 0.5em 0.75em; cursor: pointer; font: inherit; font-size: 0.9em; color: inherit; text-align: left; transition: background 0.15s ease, border-color 0.15s ease; }
        button.merk-item:hover { border-color: #2E7D52; }
        button.merk-item:focus-visible { outline: 3px solid #7D6AE6; outline-offset: 2px; }
        .merk-item .merk-check { width: 1.35em; height: 1.35em; border-radius: 7px; border: 2px solid #2E7D52; display: inline-flex; align-items: center; justify-content: center; flex: 0 0 auto; margin-top: 0.1em; background: #fff; transition: background 0.15s ease; }
        .merk-item .merk-check svg { width: 0.95em; height: 0.95em; color: #fff; opacity: 0; }
        .merk-item[aria-checked="true"] { background: rgba(123,194,154,0.28); }
        .merk-item[aria-checked="true"] .merk-check { background: #2E7D52; }
        .merk-item[aria-checked="true"] .merk-check svg { opacity: 1; }
        .merk-praise { font-family: 'Fredoka', sans-serif; font-weight: 600; color: #2E7D52; margin-top: 0.6em; min-height: 1.3em; }
        .sachtext-box-quellen { background: #EEF2F8; border: 2px solid #94A7C4; font-size: 0.82em; }
        .sachtext-box-quellen .sachtext-box-head { color: #3D5A80; }
        .quellen-list { list-style: none; margin: 0; padding: 0; display: grid; gap: 0.35em; }
        .quellen-list .quelle-domain { color: #5a6368; font-size: 0.85em; margin-left: 0.4em; }
        /* Tafel: Einschub-Slide zentriert und kompakt */
        body.view-tafel .tafel-insert .story-insert { margin: 0 auto; max-width: 620px; font-size: 0.62em; }
        /* Häppchen: Einschub-Häppchen ohne Extra-Rahmen des Chunk-Layouts */
        #chunk-display .story-insert { margin: 0.4em 0; font-size: 0.72em; }

        /* ── Aufklappbares "Wusstest du?" (nur im Scroll-Fließtext zugeklappt) ── */
        button.wusstest-toggle { width: 100%; background: none; border: 0; cursor: pointer; padding: 0; font: inherit; }
        .wusstest-toggle .wusstest-chevron { margin-left: auto; transition: transform 0.2s ease; }
        .wusstest-toggle[aria-expanded="true"] .wusstest-chevron { transform: rotate(180deg); }
        .wusstest-toggle:focus-visible { outline: 3px solid #7D6AE6; outline-offset: 2px; border-radius: 8px; }
        body:not(.view-tafel) #full-text-view .wusstest-toggle[aria-expanded="false"] { margin-bottom: 0; }
        body:not(.view-tafel) #full-text-view .wusstest-toggle[aria-expanded="false"] + .sachtext-box-body { display: none; }
        /* In Tafel-Slide und Häppchen immer offen (eigene Seite -> zugeklappt sinnlos) */
        body.view-tafel .tafel-insert .wusstest-chevron, #chunk-display .wusstest-chevron { display: none; }

        /* ── Magazin-Skin (nur Scroll-Modus) ── */
        body:not(.view-tafel) .main-card { max-width: 1200px; }
        .mag-hero-meta { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 14px; margin: 18px 4px 6px; }
        body.view-tafel .mag-hero-meta { display: none; }
        .mag-topic-pill { display: inline-flex; align-items: center; gap: 10px; background: #2FB8A6; color: #2B3140; padding: 8px 16px; border-radius: 999px; font-family: 'Fredoka', sans-serif; font-weight: 600; font-size: 0.92rem; }
        .mag-topic-pill .mag-pill-dot { width: 8px; height: 8px; background: #2B3140; border-radius: 50%; }
        .mag-author-chip { display: inline-flex; align-items: center; gap: 12px; background: #fff; border: 1px solid #D9D4CC; border-radius: 999px; padding: 6px 20px 6px 6px; box-shadow: 0 2px 12px rgba(43,49,64,0.05); }
        .mag-author-chip img { width: 42px; height: 42px; border-radius: 50%; object-fit: cover; border: 2px solid #2FB8A6; }
        .mag-author-chip .mag-ac-text { display: flex; flex-direction: column; line-height: 1.25; }
        .mag-author-chip .ac-name { font-family: 'Fredoka', sans-serif; font-weight: 600; font-size: 0.95rem; color: #2B3140; }
        .mag-author-chip .ac-role { font-size: 0.78rem; color: #5a6368; }

        body:not(.view-tafel) #full-text-view { counter-reset: mag-chapter; }
        body:not(.view-tafel) #full-text-view .mag-section { display: grid; grid-template-columns: 1fr; gap: 22px; margin: 2.6rem 0; align-items: center; }
        body:not(.view-tafel) #full-text-view .mag-section + .mag-section { border-top: 0; }
        body:not(.view-tafel) #full-text-view .mag-section + .mag-section::before { content: '\\00B7 \\00B7 \\00B7'; grid-column: 1 / -1; text-align: center; color: #2FB8A6; opacity: 0.5; letter-spacing: 10px; font-size: 1.2em; }
        body:not(.view-tafel) #full-text-view .mag-section > img.story-inline-img { border-radius: 28px; box-shadow: 0 20px 50px rgba(43,49,64,0.12); aspect-ratio: 4 / 3; object-fit: cover; width: 100%; margin: 0; }
        /* Kapitelnummer als Mint-Box vor der Kicker-Überschrift */
        body:not(.view-tafel) #full-text-view .mag-section > h3::before { counter-increment: mag-chapter; content: counter(mag-chapter, decimal-leading-zero); display: inline-flex; align-items: center; justify-content: center; background: #2FB8A6; color: #2B3140; font-family: 'Fredoka', sans-serif; font-weight: 700; font-size: 0.95em; padding: 2px 10px; border-radius: 8px; margin-right: 10px; letter-spacing: 0; }
        body:not(.view-tafel) #full-text-view .mag-section > aside.story-insert { grid-column: 1 / -1; max-width: 720px; width: 100%; justify-self: center; }
        @media (min-width: 900px) {
            /* dense: das Bild belegt grid-row 1/span 8 — ohne dense würde der
               Auto-Placement-Cursor die Textzeilen DANACH (unter dem Bild) platzieren */
            body:not(.view-tafel) #full-text-view .mag-section { grid-template-columns: 1fr 1fr; gap: 24px 56px; grid-auto-flow: row dense; }
            body:not(.view-tafel) #full-text-view .mag-section > h3,
            body:not(.view-tafel) #full-text-view .mag-section > p { grid-column: 1; max-width: 540px; }
            body:not(.view-tafel) #full-text-view .mag-section > img.story-inline-img { grid-column: 2; grid-row: 1 / span 8; align-self: center; }
            body:not(.view-tafel) #full-text-view .mag-section.mag-reverse > h3,
            body:not(.view-tafel) #full-text-view .mag-section.mag-reverse > p { grid-column: 2; justify-self: end; }
            body:not(.view-tafel) #full-text-view .mag-section.mag-reverse > img.story-inline-img { grid-column: 1; grid-row: 1 / span 8; }
            /* Intro, bildlose und Aside-only-Sektionen: einspaltig zentriert */
            body:not(.view-tafel) #full-text-view .mag-section.mag-intro,
            body:not(.view-tafel) #full-text-view .mag-section.mag-noimg,
            body:not(.view-tafel) #full-text-view .mag-section.mag-aside-only { grid-template-columns: 1fr; }
            body:not(.view-tafel) #full-text-view .mag-section.mag-intro > p,
            body:not(.view-tafel) #full-text-view .mag-section.mag-noimg > h3,
            body:not(.view-tafel) #full-text-view .mag-section.mag-noimg > p { grid-column: 1; max-width: 720px; justify-self: center; }
        }
        /* Scroll-Reveal (sanft; prefers-reduced-motion deaktiviert komplett) */
        body:not(.view-tafel) #full-text-view .mag-section.reveal { opacity: 0; transform: translateY(24px); transition: opacity 0.6s ease, transform 0.6s cubic-bezier(0.16, 1, 0.3, 1); }
        body:not(.view-tafel) #full-text-view .mag-section.reveal.visible { opacity: 1; transform: none; }
        @media (prefers-reduced-motion: reduce) {
            body:not(.view-tafel) #full-text-view .mag-section.reveal { opacity: 1; transform: none; transition: none; }
        }
        /* "Wusstest du?" als Navy-Karte (uebernimmt das Konzeptkarten-Design) */
        .wdt-card { background: #2B3140; color: #FFF6EF; border-radius: 32px; padding: 30px 26px; text-align: center; position: relative; overflow: hidden; }
        .wdt-card::before, .wdt-card::after { content: ''; position: absolute; border-radius: 50%; opacity: 0.15; }
        .wdt-card::before { background: #2FB8A6; width: 180px; height: 180px; top: -56px; right: -56px; }
        .wdt-card::after { background: #7D6AE6; width: 130px; height: 130px; bottom: -40px; left: -40px; }
        button.wdt-label { display: inline-flex; align-items: center; gap: 0.5em; background: #FFD95A; color: #2B3140; border: 0; padding: 8px 18px; border-radius: 999px; font-family: 'Fredoka', sans-serif; font-weight: 600; font-size: 0.95em; cursor: pointer; position: relative; z-index: 1; }
        button.wdt-label svg { width: 1.2em; height: 1.2em; }
        button.wdt-label:focus-visible { outline: 3px solid #7D6AE6; outline-offset: 2px; }
        .wdt-card .sachtext-box-body { font-size: 1em; line-height: 1.65; max-width: 560px; margin: 16px auto 0; opacity: 0.94; position: relative; z-index: 1; }
        body:not(.view-tafel) #full-text-view .wdt-card .wusstest-toggle[aria-expanded="false"] + .sachtext-box-body { display: none; }
        /* Lern-Block als Outro-Karte im Scroll */
        body:not(.view-tafel) #full-text-view .mag-outro > aside.insert-lernblock { background: #fff; border: 1px solid #D9D4CC; border-radius: 28px; padding: 26px 26px 20px; box-shadow: 0 2px 12px rgba(43,49,64,0.05); }
        /* Tafel-Umschalter: nur auf Desktop sinnvoll */
        #btn-tafel-toggle { display: none; }
        @media (min-width: 1024px) { #btn-tafel-toggle { display: inline-flex; } }
        /* Lese-Werkzeugleiste im Desktop-Scroll als schwebende Pille (wie die
           Autoren-Tafel) statt voller Fensterbreite; mobil bleibt full-width */
        @media (min-width: 900px) {
            body:not(.view-tafel) .reading-action-bar {
                left: 50%; right: auto; transform: translateX(-50%);
                bottom: 20px;
                width: auto; max-width: 92vw;
                gap: 10px;
                border: 1px solid #D9D4CC;
                border-radius: 999px;
                padding: 8px 14px;
                box-shadow: 0 10px 28px rgba(43,49,64,0.16);
            }
            body:not(.view-tafel) .reading-action-bar .rab-btn {
                flex: 0 0 auto; min-width: 62px; min-height: 54px; padding: 8px 18px; border-radius: 14px;
            }
        }
        /* "Weiterdenken" ergibt bei Sachtexten keinen Sinn (kein Erzähl-Weiterspinnen) */
        #tab-weiterdenken, #panel-weiterdenken { display: none !important; }
        /* Kurzfassung als Stichpunkte */
        .kf-list { list-style: none; margin: 0; padding: 0; display: grid; gap: 0.5em; }
        .kf-list li { display: flex; gap: 0.55em; align-items: flex-start; }
        .kf-list li::before { content: ''; flex: 0 0 auto; width: 0.5em; height: 0.5em; border-radius: 50%; background: #2FB8A6; margin-top: 0.55em; }
        /* Tafel (Sachtext): Textspalte nutzt den Bildschirm besser aus */
        @media (min-width: 1024px) {
            body.view-tafel .main-card { grid-template-columns: 2fr 3fr; gap: 40px; max-width: 98vw; padding: 36px 40px; }
        }
        /* "Noch eine Geschichte?": Karten unter der zentrierten Überschrift zentrieren
           (im 1200px-Container liefe das auto-fill-Grid sonst linksbündig aus) */
        body:not(.view-tafel) .related-grid { grid-template-columns: repeat(auto-fit, minmax(150px, 200px)); justify-content: center; }

        /* ── Großbild-Skalierung (Beamer / 75-Zoll-Klassentafel) ──
           .story-text ist em-basiert -> Font-Bump am Container skaliert Text,
           Kästen und Einschübe mit; Spaltenbreiten wachsen entsprechend. */
        @media (min-width: 1800px) {
            body:not(.view-tafel) .main-card { max-width: 1700px; }
            body:not(.view-tafel) .story-text { font-size: 1.5em; }
            body:not(.view-tafel) #full-text-view .mag-section > h3,
            body:not(.view-tafel) #full-text-view .mag-section > p { max-width: 760px; }
            body:not(.view-tafel) #full-text-view .mag-section > aside.story-insert { max-width: 1000px; }
            .mag-topic-pill { font-size: 1.1rem; }
            .mag-author-chip .ac-name { font-size: 1.1rem; }
            .mag-author-chip .ac-role { font-size: 0.9rem; }
            .mag-author-chip img { width: 52px; height: 52px; }
        }
        @media (min-width: 3000px) {
            body:not(.view-tafel) .main-card { max-width: 2800px; padding: 60px 80px; }
            body:not(.view-tafel) .story-text { font-size: 2.4em; }
            body:not(.view-tafel) #full-text-view .mag-section { gap: 40px 110px; }
            body:not(.view-tafel) #full-text-view .mag-section > h3,
            body:not(.view-tafel) #full-text-view .mag-section > p { max-width: 1250px; }
            body:not(.view-tafel) #full-text-view .mag-section > aside.story-insert { max-width: 1650px; }
            .mag-topic-pill { font-size: 1.7rem; padding: 12px 26px; }
            .mag-author-chip .ac-name { font-size: 1.6rem; }
            .mag-author-chip .ac-role { font-size: 1.25rem; }
            .mag-author-chip img { width: 76px; height: 76px; }
            body:not(.view-tafel) .related-grid { grid-template-columns: repeat(auto-fit, minmax(240px, 320px)); }
            body:not(.view-tafel) .reading-action-bar .rab-btn { min-height: 92px; min-width: 110px; padding: 12px 30px; }
            body:not(.view-tafel) .reading-action-bar .rab-icon { font-size: 3rem; }
            body:not(.view-tafel) .hero-title-box #main-title { font-size: 4.2rem; }
            /* Tafel-Modus auf 4K ebenfalls größer */
            body.view-tafel .story-text { font-size: 3.4em; }
        }

        /* ── Dark-Mode ── */
        body.dark-mode .sachtext-box-summary { background: rgba(255,213,79,0.12); }
        body.dark-mode .sachtext-box-summary .sachtext-box-head { color: #FFD54F; }
        body.dark-mode .sachtext-box-check { background: rgba(123,194,154,0.12); }
        body.dark-mode .sachtext-box-check .sachtext-box-head { color: #7BC29A; }
        body.dark-mode button.merk-item { background: rgba(42,50,66,0.85); }
        body.dark-mode .merk-item .merk-check { background: #2A3242; }
        body.dark-mode .merk-item[aria-checked="true"] { background: rgba(123,194,154,0.18); }
        body.dark-mode .merk-praise { color: #7BC29A; }
        body.dark-mode .merk-hint, body.dark-mode .quellen-list .quelle-domain { color: #A9B2C2; }
        body.dark-mode .sachtext-box-quellen { background: rgba(148,167,196,0.14); }
        body.dark-mode .sachtext-box-quellen .sachtext-box-head { color: #A9C0E8; }
        body.dark-mode .mag-author-chip { background: #2A3242; border-color: #3A4456; }
        body.dark-mode .mag-author-chip .ac-name { color: #ECEFF4; }
        body.dark-mode .mag-author-chip .ac-role { color: #A9B2C2; }
        body.dark-mode .mag-topic-pill { background: #4FD3C0; }
        body.dark-mode #full-text-view .mag-outro > aside.insert-lernblock { background: #2A3242; border-color: #3A4456; }
        body.dark-mode .wdt-card { background: #10141d; }
    </style>"""

HERO_META_HTML = """        <div class="mag-hero-meta">
            <span class="mag-topic-pill"><span class="mag-pill-dot" aria-hidden="true"></span>Sachtext · Wissen, das staunen lässt</span>
            <div class="mag-author-chip">
                <img src="../avatars/samira-wissensfreund.webp" alt="" loading="lazy">
                <span class="mag-ac-text"><span class="ac-name">{{PERSONA_NAME}}</span><span class="ac-role">Edutainment · {{TYPICAL_AGE}} Jahre</span></span>
            </div>
        </div>
{{STORY_IMAGES_HTML}}"""

JS_BLOCK = """        window.imagePositions = imagePositions; // Für Tafel-Modus (Sticky-Bild)
        const sachtextBlocks = {{SACHTEXT_BLOCKS_JSON}};
        window.sachtextBlocks = sachtextBlocks;
        // Sachtexte starten auf ALLEN Geräten im Magazin-Scroll (Tafel via ?view=tafel/Umschalter)
        window.FORCE_SCROLL_DEFAULT = true;

        // ── Sachtext-Magazin: Einschübe (Wusstest-du, Konzeptkarte, Lern-Block) über
        //    computeStoryInserts + Magazin-Sektionen über decorate/undecorateStoryView.
        //    Defensiv: fehlende/kaputte Blöcke -> weniger/keine Einschübe.
        (function () {
            const b = (sachtextBlocks && typeof sachtextBlocks === 'object') ? sachtextBlocks : {};
            const wusstest = Array.isArray(b.wusstestDu) ? b.wusstestDu.filter(Boolean) : [];
            const checkliste = (b.checkliste && Array.isArray(b.checkliste.punkte) && b.checkliste.punkte.length) ? b.checkliste : null;
            const quellen = (Array.isArray(b.quellen) ? b.quellen : []).filter(q => q && (q.titel || q.domain)).slice(0, 4);

            const esc = s => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
            const words = s => String(s || '').split(/\\s+/).map(w => processWord(w)).join(' ');
            const ICON_BULB = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5"/><path d="M9 18h6"/><path d="M10 22h4"/></svg>';
            const ICON_LIST = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m3 17 2 2 4-4"/><path d="m3 7 2 2 4-4"/><path d="M13 6h8"/><path d="M13 12h8"/><path d="M13 18h8"/></svg>';
            const ICON_CHECK = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg>';
            const ICON_GLOBE = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/></svg>';
            const ICON_CHEVRON = '<svg class="wusstest-chevron" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>';
            const ICON_TAFEL = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2 3h20"/><path d="M21 3v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V3"/><path d="m7 21 5-5 5 5"/></svg>';
            const ICON_SPARKLES = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z"/><path d="M20 3v4"/><path d="M22 5h-4"/></svg>';

            // Merklisten-Zustand: überlebt renderText-Neuaufbau (Silben/Emoji-Toggle),
            // persistent pro Story
            const MERK_KEY = 'lesekumpel-merkliste-{{SLUG}}';
            const merkChecked = new Set();
            try { (JSON.parse(localStorage.getItem(MERK_KEY)) || []).forEach(i => merkChecked.add(i)); } catch (e) {}
            let merkCelebrated = false;

            function wusstestHtml(text) {
                return '<div class="wdt-card wusstest-card"><button type="button" class="wdt-label wusstest-toggle" aria-expanded="false">' + ICON_SPARKLES + '<span>Wusstest du?</span>' + ICON_CHEVRON + '</button><div class="sachtext-box-body">' + words(text) + '</div></div>';
            }
            // Kurzfassung ("Das Wichtigste in Kürze"): aufklappbare Glühbirnen-Box GANZ OBEN
            // (afterGroup: -1) — wie ein Wikipedia-Intro, das den Lesefluss nicht stört.
            function kurzfassungHtml() {
                if (typeof rawSummary !== 'string' || !rawSummary.trim()) return null;
                // Stichpunkte statt Fließtext: Zusammenfassung an Satzgrenzen splitten
                const saetze = rawSummary.trim().split(/(?<=[.!?])\s+/).map(s => s.trim()).filter(Boolean);
                const inhalt = saetze.length > 1
                    ? '<ul class="kf-list">' + saetze.map(s => '<li><span>' + words(s) + '</span></li>').join('') + '</ul>'
                    : words(rawSummary);
                return '<div class="sachtext-box sachtext-box-summary"><button type="button" class="sachtext-box-head wusstest-toggle" aria-expanded="false">' + ICON_BULB + '<span>Das Wichtigste in Kürze</span>' + ICON_CHEVRON + '</button><div class="sachtext-box-body">' + inhalt + '</div></div>';
            }
            function lernblockHtml(ctx) {
                let h = '';
                if (checkliste) {
                    const items = checkliste.punkte.map((p, i) =>
                        '<button type="button" class="merk-item" role="checkbox" aria-checked="' + (merkChecked.has(i) ? 'true' : 'false') + '" data-merk-idx="' + i + '"><span class="merk-check" aria-hidden="true">' + ICON_CHECK + '</span><span class="merk-text">' + esc(p) + '</span></button>').join('');
                    h += '<div class="sachtext-box sachtext-box-check"><div class="sachtext-box-head">' + ICON_LIST + '<span>' + esc(checkliste.titel || 'Das merkst du dir') + '</span></div><div class="merk-hint">Tipp an, was du dir gemerkt hast!</div><div class="merk-list" role="group" aria-label="Merkliste">' + items + '</div><div class="merk-praise" aria-live="polite"></div></div>';
                }
                if (quellen.length) {
                    const rows = quellen.map(q => '<li>' + esc(q.titel || q.domain) + (q.titel && q.domain ? '<span class="quelle-domain">' + esc(q.domain) + '</span>' : '') + '</li>').join('');
                    h += '<div class="sachtext-box sachtext-box-quellen"><div class="sachtext-box-head">' + ICON_GLOBE + '<span>Woher weiß Samira das?</span></div><ul class="quellen-list">' + rows + '</ul></div>';
                }
                return h;
            }

            window.computeStoryInserts = function (allGroups, ctx) {
                ctx = ctx || {};
                const inserts = [];
                // Kurzfassung ganz oben (nicht im Einfach-Modus — dort IST sie der Text)
                if (!ctx.summary) {
                    const kf = kurzfassungHtml();
                    if (kf) inserts.push({ afterGroup: -1, html: kf, className: 'insert-kurzfassung', indicatorLabel: 'Kurz erklärt', asChunk: true });
                }
                // Kapitelanfänge = Gruppen mit Überschrift; "Lücke k" = letzte Gruppe vor Kapitel k+1
                const chapterStarts = [];
                allGroups.forEach((g, i) => { if (g.heading) chapterStarts.push(i); });
                const K = chapterStarts.length;
                const gapEnd = k => (chapterStarts[k + 1] !== undefined ? chapterStarts[k + 1] : allGroups.length) - 1;

                if (!ctx.summary && wusstest.length) {
                    const gaps = Math.max(0, K - 1); // Lücken zwischen Kapiteln
                    const used = new Set();
                    wusstest.forEach((t, j) => {
                        let after = allGroups.length - 1; // Fallback: Textende (vor dem Lern-Block)
                        if (gaps > 0) {
                            let gi = Math.floor((j + 1) * gaps / (wusstest.length + 1));
                            gi = Math.max(0, Math.min(gaps - 1, gi));
                            while (used.has(gi) && gi < gaps - 1) gi++;
                            used.add(gi);
                            after = gapEnd(gi);
                        }
                        inserts.push({ afterGroup: after, html: wusstestHtml(t), className: 'insert-wusstest', indicatorLabel: 'Extra-Wissen', asChunk: true });
                    });
                }
                const lern = lernblockHtml(ctx);
                if (lern) inserts.push({ afterGroup: allGroups.length - 1, html: lern, className: 'insert-lernblock', indicatorLabel: 'Das hast du gelernt', asChunk: true });
                return inserts;
            };

            // ── Magazin-Skin: Kapitel-Runs in .mag-section wrappen (verlustfrei, keine
            //    innere Umordnung — Bild-Platzierung macht das CSS-Grid). undecorate =
            //    exakte Umkehrung (depaginateStory-Muster) für den Tafel-Eintritt.
            let magRevealObserver = null;
            window.decorateStoryView = function (view) {
                if (!view || view.querySelector('.mag-section') || view.querySelector('.tafel-section')) return;
                const children = Array.from(view.children);
                if (!children.length) return;
                const runs = [];
                let run = [];
                children.forEach(el => {
                    // Kurzfassung + Konzeptkarte + Lern-Block werden eigene Sektionen
                    const standalone = el.tagName === 'ASIDE' && (el.classList.contains('insert-lernblock') || el.classList.contains('insert-kurzfassung'));
                    if (standalone) {
                        if (run.length) { runs.push(run); run = []; }
                        runs.push([el]);
                        return;
                    }
                    // h3 startet neues Kapitel; das Kapitelbild steht direkt VOR seinem h3
                    const startsNew = el.tagName === 'H3' ||
                        (el.tagName === 'IMG' && el.nextElementSibling && el.nextElementSibling.tagName === 'H3');
                    if (startsNew && run.length) { runs.push(run); run = []; }
                    run.push(el);
                });
                if (run.length) runs.push(run);

                let imgSectionCount = 0;
                runs.forEach((els, idx) => {
                    const section = document.createElement('section');
                    section.className = 'mag-section';
                    const hasHeading = els.some(e => e.tagName === 'H3');
                    const hasImg = els.some(e => e.tagName === 'IMG');
                    const asideOnly = els.length === 1 && els[0].tagName === 'ASIDE';
                    if (asideOnly) {
                        section.classList.add('mag-aside-only');
                        if (els[0].classList.contains('insert-lernblock')) section.classList.add('mag-outro');
                    } else if (!hasHeading && idx === 0) {
                        section.classList.add('mag-intro');
                    } else if (hasImg) {
                        imgSectionCount++;
                        if (imgSectionCount % 2 === 0) section.classList.add('mag-reverse');
                    } else {
                        section.classList.add('mag-noimg');
                    }
                    view.insertBefore(section, els[0]);
                    els.forEach(e => section.appendChild(e));
                });

                // Scroll-Reveal (aus bei reduced motion); bereits sichtbare sofort zeigen
                if (magRevealObserver) { magRevealObserver.disconnect(); magRevealObserver = null; }
                const reduced = (typeof REDUCED_MOTION !== 'undefined' && REDUCED_MOTION);
                if (!reduced && 'IntersectionObserver' in window) {
                    magRevealObserver = new IntersectionObserver(entries => {
                        entries.forEach(en => {
                            if (en.isIntersecting) { en.target.classList.add('visible'); magRevealObserver.unobserve(en.target); }
                        });
                    }, { threshold: 0.05, rootMargin: '0px 0px -10%' });
                    view.querySelectorAll('.mag-section').forEach(s => {
                        const r = s.getBoundingClientRect();
                        if (r.top < window.innerHeight && r.bottom > 0) return; // schon sichtbar
                        s.classList.add('reveal');
                        magRevealObserver.observe(s);
                    });
                }
            };
            window.undecorateStoryView = function (view) {
                if (!view) return;
                if (magRevealObserver) { magRevealObserver.disconnect(); magRevealObserver = null; }
                view.querySelectorAll('.mag-section').forEach(s => {
                    while (s.firstChild) view.insertBefore(s.firstChild, s);
                    s.remove();
                });
            };

            // Merkliste (Tap-to-Check) + Wusstest-du (auf/zu) per Event-Delegation
            // (überlebt jeden Re-Render)
            document.addEventListener('click', function (e) {
                const toggle = e.target.closest && e.target.closest('.wusstest-toggle');
                if (toggle) {
                    toggle.setAttribute('aria-expanded', toggle.getAttribute('aria-expanded') !== 'true' ? 'true' : 'false');
                    return;
                }
                const btn = e.target.closest && e.target.closest('.merk-item');
                if (!btn) return;
                const idx = parseInt(btn.dataset.merkIdx, 10);
                const on = btn.getAttribute('aria-checked') !== 'true';
                btn.setAttribute('aria-checked', on ? 'true' : 'false');
                if (on) merkChecked.add(idx); else merkChecked.delete(idx);
                try { localStorage.setItem(MERK_KEY, JSON.stringify(Array.from(merkChecked))); } catch (err) {}
                if (on && checkliste && merkChecked.size >= checkliste.punkte.length && !merkCelebrated) {
                    merkCelebrated = true;
                    if (typeof showConfetti === 'function') showConfetti();
                    const box = btn.closest('.sachtext-box-check');
                    const praise = box ? box.querySelector('.merk-praise') : null;
                    if (praise) praise.textContent = 'Super! Alles gemerkt!';
                }
            });

            // Tafel-Umschalter in die Lesehilfen injizieren (Engine-Funktionen sind global)
            function syncTafelToggleLabel() {
                const btn = document.getElementById('btn-tafel-toggle');
                if (!btn) return;
                const inTafel = document.body.classList.contains('view-tafel');
                const label = btn.querySelector('.btn-label');
                if (label) label.textContent = inTafel ? 'Scrollen' : 'Tafel';
                btn.classList.toggle('active', inTafel);
            }
            function injectTafelToggle() {
                const host = document.querySelector('#tools-overlay .toolbar-group.group-view .toolbar-group-buttons');
                if (!host || document.getElementById('btn-tafel-toggle')) return;
                const btn = document.createElement('button');
                btn.type = 'button';
                btn.id = 'btn-tafel-toggle';
                btn.className = 'tool-btn';
                btn.setAttribute('aria-label', 'Tafel-Ansicht umschalten');
                btn.innerHTML = '<span class="btn-icon" aria-hidden="true">' + ICON_TAFEL + '</span> <span class="btn-label">Tafel</span>';
                btn.addEventListener('click', function () {
                    const inTafel = document.body.classList.contains('view-tafel');
                    if (typeof readUrlView === 'function' && readUrlView()) history.replaceState(null, '', location.pathname);
                    window.FORCE_SCROLL_DEFAULT = inTafel; // zurück zu Scroll -> Flag wieder an
                    if (typeof syncTafelClassFromContext === 'function') syncTafelClassFromContext();
                    if (typeof applyTafelLayout === 'function') applyTafelLayout();
                    syncTafelToggleLabel();
                });
                host.appendChild(btn);
                syncTafelToggleLabel();
                // Label bei externen Modus-Wechseln (Resize, URL) aktuell halten
                new MutationObserver(syncTafelToggleLabel).observe(document.body, { attributes: true, attributeFilter: ['class'] });
            }
            if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', injectTafelToggle);
            else injectTafelToggle();
        })();"""

ANCHOR_STYLE = "    </style>"
ANCHOR_DATA = "        window.imagePositions = imagePositions; // Für Tafel-Modus (Sticky-Bild)"
ANCHOR_HERO = "{{STORY_IMAGES_HTML}}"
RELCARD_RX = re.compile(r'(<a class="related-card" href=")(?!\.\./)([a-z0-9-]+\.html")')


def build():
    src = SRC.read_text(encoding="utf-8")

    for name, anchor in [("style", ANCHOR_STYLE), ("data", ANCHOR_DATA), ("hero", ANCHOR_HERO)]:
        n = src.count(anchor)
        if n != 1:
            raise SystemExit(f"ABBRUCH: Anker '{name}': {n} Treffer (erwartet 1). demo-template.html hat sich geändert — Anker anpassen.")
    for hook in ("computeStoryInserts", "decorateStoryView", "undecorateStoryView", "FORCE_SCROLL_DEFAULT"):
        if hook not in src:
            raise SystemExit(f"ABBRUCH: Engine-Hook {hook} fehlt in demo-template.html — Donor-Stand prüfen (build-generator-template.py gelaufen?).")

    out = src.replace(ANCHOR_STYLE, CSS_BLOCK, 1)
    out = out.replace(ANCHOR_DATA, JS_BLOCK, 1)
    out = out.replace(ANCHOR_HERO, HERO_META_HTML, 1)

    out, n_rel = RELCARD_RX.subn(r"\g<1>../demo-texte/\g<2>", out)
    print(f"  related-card-Links -> ../demo-texte/: {n_rel} Ersetzungen")

    return out


def main() -> int:
    check = "--check" in sys.argv
    out = build()

    # Sanity-Checks
    checks = {
        "{{SACHTEXT_BLOCKS_JSON}} genau 1x": out.count("{{SACHTEXT_BLOCKS_JSON}}") == 1,
        "computeStoryInserts-Implementierung": "window.computeStoryInserts = function" in out,
        "decorate/undecorate-Implementierung": "window.decorateStoryView = function" in out and "window.undecorateStoryView = function" in out,
        "FORCE_SCROLL_DEFAULT gesetzt": "window.FORCE_SCROLL_DEFAULT = true;" in out,
        "Magazin-CSS": ".mag-section" in out and ".mag-hero-meta" in out,
        "Hero-Meta eingefügt": 'class="mag-hero-meta"' in out and out.count("{{STORY_IMAGES_HTML}}") == 1,
        "Wusstest-Navy-Karte": "wusstest-card" in out and "wdt-card" in out,
        "Kurzfassung oben (aufklappbar)": "insert-kurzfassung" in out and "afterGroup: -1" in out,
        "Aufklappbares Wusstest-du": "wusstest-toggle" in out,
        "Tafel-Umschalter": "btn-tafel-toggle" in out,
        "interaktive Merkliste": 'role="checkbox"' in out and "merk-item" in out,
        "Quellen-Box": "sachtext-box-quellen" in out,
        "KEINE Modus-Ausblendung mehr": "#sachtext-blocks" not in out,
        "related-cards nach ../demo-texte/": '<a class="related-card" href="../demo-texte/' in out,
    }
    placeholders = sorted(set(re.findall(r"\{\{[A-Z_]+\}\}", out)))
    print(f"  Platzhalter: {', '.join(placeholders)}")
    for label, ok in checks.items():
        print(f"  {label}: {'OK' if ok else 'FEHLT'}")
    if not all(checks.values()):
        raise SystemExit("ABBRUCH: Sanity-Check fehlgeschlagen.")

    if check:
        print("--check: nichts geschrieben.")
        return 0
    OUT.write_text(out, encoding="utf-8")
    print(f"  geschrieben: {OUT.relative_to(REPO)}  ({len(out)} Zeichen)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
