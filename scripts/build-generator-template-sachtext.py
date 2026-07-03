"""Baut das Sachtext-Generator-Template (n8n-config/demo-template-sachtext.html).

Der Sachtext-Workflow (Samira) holt sein Template zur Laufzeit von
  https://raw.githubusercontent.com/RaLa84/lesekumpel/main/n8n-config/demo-template-sachtext.html
und befüllt die {{PLATZHALTER}} im Knoten "HTML assemblieren" (assemble-html-sachtext-v1.js).

Quelle ist das FERTIGE n8n-config/demo-template.html (kein zweiter Donor — die
Donor-Kette bleibt einstufig: Donor -> build-generator-template.py -> demo-template.html
-> dieses Script -> demo-template-sachtext.html). Nach jeder Regeneration von
demo-template.html muss dieses Script erneut laufen.

Die Lese-Engine (Donor) stellt den generischen Hook window.computeStoryInserts bereit
(No-Op ohne Definition). Dieses Script definiert die Sachtext-Implementierung:

  1. CSS der Wissens-Kästen vor </style>: "Wusstest du?"-Einschübe (im Textfluss),
     Lern-Block (Kurz-Fazit + INTERAKTIVE Merkliste + Quellen), Tafel-Insert-Slides,
     Dark-Mode. In ALLEN Modi sichtbar (Scroll / Tafel / Häppchen).
  2. JS nach dem N8N-Datenblock: const sachtextBlocks = {{SACHTEXT_BLOCKS_JSON}} +
     window.computeStoryInserts (Verteilung der Wusstest-du-Kästen zwischen die
     Mini-Kapitel, Lern-Block ans Ende) + Merklisten-Interaktion (Tap-to-Check,
     localStorage, Konfetti wenn alles gehakt).
  3. related-card-Links auf ../demo-texte/ umschreiben (Sachtexte liegen im
     Geschwisterordner sachtexte/; ../bilder/-Pfade stimmen bereits).

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
        .story-insert { margin: 1.6em 0; font-size: 0.78em; line-height: 1.55; text-align: left; }
        .sachtext-box { border-radius: 16px; padding: 0.9em 1.1em; }
        .sachtext-box + .sachtext-box { margin-top: 0.9em; }
        .sachtext-box-head { display: flex; align-items: center; gap: 0.5em; font-family: 'Fredoka', sans-serif; font-weight: 600; font-size: 0.95em; margin-bottom: 0.45em; }
        .sachtext-box-head svg { width: 1.25em; height: 1.25em; flex: 0 0 auto; }
        .sachtext-box-body { margin: 0; }
        .sachtext-box-wusstest { background: #FFF3CC; border: 2px solid #FFD54F; }
        .sachtext-box-wusstest .sachtext-box-head { color: #8a6d00; }
        .sachtext-box-summary { background: #FBE9E7; border: 2px solid #D67171; }
        .sachtext-box-summary .sachtext-box-head { color: #B04A4A; }
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
        /* Dark-Mode */
        body.dark-mode .sachtext-box-wusstest { background: rgba(255,213,79,0.12); }
        body.dark-mode .sachtext-box-wusstest .sachtext-box-head { color: #FFD54F; }
        body.dark-mode .sachtext-box-summary { background: rgba(214,113,113,0.14); }
        body.dark-mode .sachtext-box-summary .sachtext-box-head { color: #E89999; }
        body.dark-mode .sachtext-box-check { background: rgba(123,194,154,0.12); }
        body.dark-mode .sachtext-box-check .sachtext-box-head { color: #7BC29A; }
        body.dark-mode button.merk-item { background: rgba(42,50,66,0.85); }
        body.dark-mode .merk-item .merk-check { background: #2A3242; }
        body.dark-mode .merk-item[aria-checked="true"] { background: rgba(123,194,154,0.18); }
        body.dark-mode .merk-praise { color: #7BC29A; }
        body.dark-mode .merk-hint, body.dark-mode .quellen-list .quelle-domain { color: #A9B2C2; }
        body.dark-mode .sachtext-box-quellen { background: rgba(148,167,196,0.14); }
        body.dark-mode .sachtext-box-quellen .sachtext-box-head { color: #A9C0E8; }
    </style>"""

JS_BLOCK = """        window.imagePositions = imagePositions; // Für Tafel-Modus (Sticky-Bild)
        const sachtextBlocks = {{SACHTEXT_BLOCKS_JSON}};
        window.sachtextBlocks = sachtextBlocks;

        // ── Sachtext-Einschübe: Wusstest-du zwischen den Mini-Kapiteln,
        //    Lern-Block (Fazit + interaktive Merkliste + Quellen) ans Ende.
        //    Rendert über den generischen Engine-Hook window.computeStoryInserts;
        //    defensiv: fehlende/kaputte Blöcke -> weniger/keine Einschübe.
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
            const ICON_BOOK = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 7v14"/><path d="M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z"/></svg>';
            const ICON_GLOBE = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/></svg>';

            // Merklisten-Zustand: überlebt renderText-Neuaufbau (Silben/Emoji-Toggle),
            // persistent pro Story
            const MERK_KEY = 'lesekumpel-merkliste-{{SLUG}}';
            const merkChecked = new Set();
            try { (JSON.parse(localStorage.getItem(MERK_KEY)) || []).forEach(i => merkChecked.add(i)); } catch (e) {}
            let merkCelebrated = false;

            function wusstestHtml(text) {
                return '<div class="sachtext-box sachtext-box-wusstest"><div class="sachtext-box-head">' + ICON_BULB + '<span>Wusstest du?</span></div><div class="sachtext-box-body">' + words(text) + '</div></div>';
            }
            function lernblockHtml(ctx) {
                let h = '';
                if (!ctx.summary && typeof rawSummary === 'string' && rawSummary.trim()) {
                    h += '<div class="sachtext-box sachtext-box-summary"><div class="sachtext-box-head">' + ICON_BOOK + '<span>Das Wichtigste in Kürze</span></div><div class="sachtext-box-body">' + words(rawSummary) + '</div></div>';
                }
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

            // Merkliste: Tap-to-Check per Event-Delegation (überlebt jeden Re-Render)
            document.addEventListener('click', function (e) {
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
        })();"""

ANCHOR_STYLE = "    </style>"
ANCHOR_DATA = "        window.imagePositions = imagePositions; // Für Tafel-Modus (Sticky-Bild)"
RELCARD_RX = re.compile(r'(<a class="related-card" href=")(?!\.\./)([a-z0-9-]+\.html")')


def build():
    src = SRC.read_text(encoding="utf-8")

    for name, anchor in [("style", ANCHOR_STYLE), ("data", ANCHOR_DATA)]:
        n = src.count(anchor)
        if n != 1:
            raise SystemExit(f"ABBRUCH: Anker '{name}': {n} Treffer (erwartet 1). demo-template.html hat sich geändert — Anker anpassen.")
    if "computeStoryInserts" not in src:
        raise SystemExit("ABBRUCH: Engine-Hook window.computeStoryInserts fehlt in demo-template.html — Donor-Stand prüfen (build-generator-template.py gelaufen?).")

    out = src.replace(ANCHOR_STYLE, CSS_BLOCK, 1)
    out = out.replace(ANCHOR_DATA, JS_BLOCK, 1)

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
        "Kästen-CSS": ".sachtext-box-wusstest" in out,
        "interaktive Merkliste": 'role="checkbox"' in out and "merk-item" in out,
        "Quellen-Box": "sachtext-box-quellen" in out,
        "KEINE Modus-Ausblendung mehr": "view-tafel #sachtext-blocks" not in out and "#sachtext-blocks" not in out,
        "Tafel-Insert-Styles": ".tafel-insert .story-insert" in out,
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
