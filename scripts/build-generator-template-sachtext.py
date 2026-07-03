"""Baut das Sachtext-Generator-Template (n8n-config/demo-template-sachtext.html).

Der Sachtext-Workflow (Samira) holt sein Template zur Laufzeit von
  https://raw.githubusercontent.com/RaLa84/lesekumpel/main/n8n-config/demo-template-sachtext.html
und befüllt die {{PLATZHALTER}} im Knoten "HTML assemblieren" (assemble-html-sachtext-v1.js).

Quelle ist das FERTIGE n8n-config/demo-template.html (kein zweiter Donor — die
Donor-Kette bleibt einstufig: Donor -> build-generator-template.py -> demo-template.html
-> dieses Script -> demo-template-sachtext.html). Nach jeder Regeneration von
demo-template.html muss dieses Script erneut laufen.

Patches:
  1. CSS der Sachtext-Kästen (Wusstest du? / Checkliste / Zusammenfassung) vor </style>;
     Kästen sind in Häppchen-/Tafel-Modus per CSS ausgeblendet (arbeiten nur auf rawStory).
  2. <section id="sachtext-blocks"> vor der done-card (erscheint nach dem Fließtext).
  3. JS: const sachtextBlocks = {{SACHTEXT_BLOCKS_JSON}} + Renderer direkt nach dem
     N8N-Datenblock (window.imagePositions-Zeile).
  4. related-card-Links auf ../demo-texte/ umschreiben (Sachtexte liegen im
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
        /* ── Sachtext-Bausteine (Wusstest du? / Checkliste / Zusammenfassung) ── */
        #sachtext-blocks { max-width: 720px; margin: 2em auto 0; display: grid; gap: 1em; }
        .sachtext-box { border-radius: 16px; padding: 1em 1.2em; font-size: 1.05em; line-height: 1.55; text-align: left; }
        .sachtext-box p { margin: 0; }
        .sachtext-box-head { display: flex; align-items: center; gap: 0.5em; font-family: 'Fredoka', sans-serif; font-weight: 600; font-size: 1.05em; margin-bottom: 0.5em; }
        .sachtext-box-head svg { width: 1.25em; height: 1.25em; flex: 0 0 auto; }
        .sachtext-box-wusstest { background: #FFF3CC; border: 2px solid #FFD54F; }
        .sachtext-box-wusstest .sachtext-box-head { color: #8a6d00; }
        .sachtext-box-check { background: #E8F5EE; border: 2px solid #7BC29A; }
        .sachtext-box-check .sachtext-box-head { color: #2E7D52; }
        .sachtext-box-check ul { list-style: none; margin: 0; padding: 0; display: grid; gap: 0.45em; }
        .sachtext-box-check li { display: flex; gap: 0.5em; align-items: flex-start; }
        .sachtext-box-check li svg { width: 1.1em; height: 1.1em; flex: 0 0 auto; margin-top: 0.2em; color: #2E7D52; }
        .sachtext-box-summary { background: #FBE9E7; border: 2px solid #D67171; }
        .sachtext-box-summary .sachtext-box-head { color: #B04A4A; }
        body.dark-mode .sachtext-box-wusstest { background: rgba(255,213,79,0.12); }
        body.dark-mode .sachtext-box-wusstest .sachtext-box-head { color: #FFD54F; }
        body.dark-mode .sachtext-box-check { background: rgba(123,194,154,0.12); }
        body.dark-mode .sachtext-box-check .sachtext-box-head,
        body.dark-mode .sachtext-box-check li svg { color: #7BC29A; }
        body.dark-mode .sachtext-box-summary { background: rgba(214,113,113,0.14); }
        body.dark-mode .sachtext-box-summary .sachtext-box-head { color: #E89999; }
        /* Kästen nur in der Scroll-Ansicht — Häppchen/Tafel arbeiten ausschließlich auf rawStory */
        body.haeppchen-active #sachtext-blocks,
        body.view-tafel #sachtext-blocks,
        body.view-tafel-cover #sachtext-blocks { display: none; }
    </style>"""

SECTION_HTML = """        <section id="sachtext-blocks" aria-label="Wissens-Kästen" hidden></section>

        <div class="done-card" id="done-card" hidden>"""

JS_BLOCK = """        window.imagePositions = imagePositions; // Für Tafel-Modus (Sticky-Bild)
        const sachtextBlocks = {{SACHTEXT_BLOCKS_JSON}};
        window.sachtextBlocks = sachtextBlocks;

        // Sachtext-Kästen rendern (defensiv: fehlende/kaputte Blöcke -> Sektion bleibt hidden)
        (function renderSachtextBlocks() {
            try {
                const host = document.getElementById('sachtext-blocks');
                if (!host) return;
                const b = (sachtextBlocks && typeof sachtextBlocks === 'object') ? sachtextBlocks : {};
                const esc = s => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
                const ICON_BULB = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5"/><path d="M9 18h6"/><path d="M10 22h4"/></svg>';
                const ICON_LIST = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m3 17 2 2 4-4"/><path d="m3 7 2 2 4-4"/><path d="M13 6h8"/><path d="M13 12h8"/><path d="M13 18h8"/></svg>';
                const ICON_CHECK = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg>';
                const ICON_BOOK = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 7v14"/><path d="M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z"/></svg>';
                let html = '';
                (Array.isArray(b.wusstestDu) ? b.wusstestDu : []).forEach(t => {
                    if (t) html += '<aside class="sachtext-box sachtext-box-wusstest"><div class="sachtext-box-head">' + ICON_BULB + '<span>Wusstest du?</span></div><p>' + esc(t) + '</p></aside>';
                });
                const cl = b.checkliste;
                if (cl && Array.isArray(cl.punkte) && cl.punkte.length) {
                    const items = cl.punkte.map(p => '<li>' + ICON_CHECK + '<span>' + esc(p) + '</span></li>').join('');
                    html += '<aside class="sachtext-box sachtext-box-check"><div class="sachtext-box-head">' + ICON_LIST + '<span>' + esc(cl.titel || 'Das merkst du dir') + '</span></div><ul>' + items + '</ul></aside>';
                }
                const summary = (typeof rawSummary === 'string') ? rawSummary.trim() : '';
                if (summary) {
                    html += '<aside class="sachtext-box sachtext-box-summary"><div class="sachtext-box-head">' + ICON_BOOK + '<span>Das Wichtigste in Kürze</span></div><p>' + esc(summary) + '</p></aside>';
                }
                if (html) { host.innerHTML = html; host.hidden = false; }
            } catch (e) { console.warn('sachtext-blocks render failed', e); }
        })();"""

ANCHOR_STYLE = "    </style>"
ANCHOR_DONECARD = '        <div class="done-card" id="done-card" hidden>'
ANCHOR_DATA = "        window.imagePositions = imagePositions; // Für Tafel-Modus (Sticky-Bild)"
RELCARD_RX = re.compile(r'(<a class="related-card" href=")(?!\.\./)([a-z0-9-]+\.html")')


def build():
    src = SRC.read_text(encoding="utf-8")

    for name, anchor in [("style", ANCHOR_STYLE), ("done-card", ANCHOR_DONECARD), ("data", ANCHOR_DATA)]:
        n = src.count(anchor)
        if n != 1:
            raise SystemExit(f"ABBRUCH: Anker '{name}': {n} Treffer (erwartet 1). demo-template.html hat sich geändert — Anker anpassen.")

    out = src.replace(ANCHOR_STYLE, CSS_BLOCK, 1)
    out = out.replace(ANCHOR_DONECARD, SECTION_HTML, 1)
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
        "#sachtext-blocks Sektion": 'id="sachtext-blocks"' in out,
        "Kästen-CSS": ".sachtext-box-wusstest" in out,
        "Tafel/Häppchen-Ausblendung": "body.view-tafel #sachtext-blocks" in out,
        "Renderer": "renderSachtextBlocks" in out,
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
