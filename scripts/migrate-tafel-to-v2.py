"""Extrahiert den Tafel-Code aus der Standalone-Vorlage (Dönerella) und mappt
ihn auf v2-Selektoren, schreibt v2/tafel.css und v2/tafel.js."""
import re
from pathlib import Path

REPO = Path(__file__).resolve().parent.parent
SRC = REPO / "demo-texte" / "doenerella-im-weltall-11ym.html"
OUT_CSS = REPO / "v2" / "tafel.css"
OUT_JS = REPO / "v2" / "tafel.js"

TAFEL_CSS_MARKER = "/* === TAFEL-ANSICHT v2:"
TAFEL_JS_MARKER = "// === TAFEL-ANSICHT v2:"

# Selektor-Mapping Standalone → v2 (Reihenfolge wichtig: längere Patterns zuerst!)
# Tuples (pattern, replacement) — Pattern als Regex, replacement plain.
MAPPING = [
    # Hero-Cover-Bild
    (r"\.story-hero-cover \.hero-bg", ".story-hero .story-hero-img"),
    (r"\.story-hero-cover \.hero-title-box #main-title", ".story-hero-text h1"),
    (r"\.story-hero-cover #main-title", ".story-hero-text h1"),
    (r"\.story-hero-cover", ".story-hero"),
    (r"h1#main-title", ".story-hero-text h1"),
    (r"#main-title", ".story-hero-text h1"),
    # Author-Line: avatar/credit haben in v2 spezifische Klassen
    (r"\.author-line \.author-avatar", ".author-line .author-line-avatar"),
    (r"\.author-line \.author-credit", ".author-line .author-line-credit"),
    # Container
    (r"\.main-card", ".story-wrap"),
    # Text-View
    (r"#full-text-view", "#story-text"),
    # Häppchen-View existiert in v2 nicht — Selektor harmlos lassen
    # Toolbar: in v2 .reading-toolbar (mit id="toolbar"). Keine collapsed/expanded-Logik.
    (r"\.toolbar-container\.collapsed", ".reading-toolbar.is-collapsed"),
    (r"\.toolbar-container:not\(\.collapsed\)", ".reading-toolbar:not(.is-collapsed)"),
    (r"\.toolbar-container", ".reading-toolbar"),
    # Toolbar-Header existiert in v2 nicht (Toolbar ist flach). Wir lassen die Klassen
    # stehen — wenn sie nicht matchen, schadet's nicht.
]

JS_MAPPING = [
    # JS DOM-Queries
    (r"\.querySelector\('\.story-hero-cover \.hero-bg'\)", ".querySelector('.story-hero .story-hero-img')"),
    (r"\.querySelector\('\.story-hero-cover #main-title'\)", ".querySelector('.story-hero-text h1')"),
    (r"\.querySelector\('\.story-hero-cover'\)", ".querySelector('.story-hero')"),
    (r"'\.main-card'", "'.story-wrap'"),
    (r"'\.main-card", "'.story-wrap"),  # für `'.main-card > *'`
    (r"querySelectorAll\('#full-text-view img'\)", "querySelectorAll('#story-text img, .tafel-image-pool img')"),
    (r"'#full-text-view'", "'#story-text'"),
    (r"'#full-text-view", "'#story-text"),
    (r"getElementById\('full-text-view'\)", "getElementById('story-text')"),
    (r"querySelector\('#full-text-view'\)", "querySelector('#story-text')"),
    (r"\.author-line \.author-avatar", ".author-line .author-line-avatar"),
    (r"\.author-line \.author-credit", ".author-line .author-line-credit"),
    # Häppchen/Fahrplan-Toggle existiert in v2 nicht: typeof-Check schützt
    # toggleViewMode/toggleFahrplan bleiben — sind harmlos wenn Funktion fehlt
]


def extract_css(src: str) -> str:
    start = src.find(TAFEL_CSS_MARKER)
    end = src.find("</style>", start)
    if start == -1 or end == -1:
        raise RuntimeError("Tafel-CSS-Marker oder </style> nicht gefunden")
    block = src[start:end].rstrip()
    # Indent (8 spaces) entfernen — als externe Datei brauchen wir kein Einrücken
    lines = [ln[8:] if ln.startswith("        ") else ln for ln in block.split("\n")]
    return "\n".join(lines)


def extract_js(src: str) -> str:
    pattern = re.compile(r"<script>\s*\n\s*// === TAFEL-ANSICHT v2:.*?</script>", re.DOTALL)
    m = pattern.search(src)
    if not m:
        raise RuntimeError("Tafel-<script>-Block nicht gefunden")
    # Tags entfernen, nur Inhalt extrahieren
    inner = m.group(0)
    inner = re.sub(r"^<script>\s*\n", "", inner)
    inner = re.sub(r"\s*</script>$", "", inner)
    # Indent entfernen
    lines = [ln[8:] if ln.startswith("        ") else ln for ln in inner.split("\n")]
    return "\n".join(lines)


def apply_mapping(content: str, mapping: list) -> str:
    for pattern, replacement in mapping:
        content = re.sub(pattern, replacement, content)
    return content


def main() -> int:
    src = SRC.read_text(encoding="utf-8")
    css = extract_css(src)
    js = extract_js(src)

    css_v2 = apply_mapping(css, MAPPING)
    js_v2 = apply_mapping(js, MAPPING + JS_MAPPING)

    # v2-spezifisch: Pool-Bilder liegen außerhalb von #story-text
    js_v2 = js_v2.replace(
        "const inlineImgs = document.querySelectorAll('#story-text img');",
        "const inlineImgs = document.querySelectorAll('#story-text img, .tafel-image-pool img');",
    )
    # v2-spezifisch: Author-Avatar/Credit haben in v2 andere Klassen (.author-line-avatar/credit/name)
    js_v2 = js_v2.replace(
        "author?.querySelector('.author-avatar')?.src",
        "author?.querySelector('.author-line-avatar, .author-avatar')?.src",
    )
    js_v2 = js_v2.replace(
        "author?.querySelector('.author-credit')?.textContent.trim()",
        "(author?.querySelector('.author-line-name, .author-credit')?.textContent.trim() ? 'geschrieben von ' + author.querySelector('.author-line-name, .author-credit').textContent.trim() : '')",
    )

    header_css = (
        "/* ============================================================\n"
        "   Lesekumpel v2 — Tafel-Modus (digitale Klassentafeln)\n"
        "   Auto-generiert aus demo-texte/doenerella-im-weltall-11ym.html\n"
        "   Quelle aktualisieren + scripts/migrate-tafel-to-v2.py erneut laufen lassen.\n"
        "   ============================================================ */\n\n"
    )
    header_js = (
        "/* ============================================================\n"
        "   Lesekumpel v2 — Tafel-Modus (digitale Klassentafeln)\n"
        "   Auto-generiert aus demo-texte/doenerella-im-weltall-11ym.html\n"
        "   Quelle aktualisieren + scripts/migrate-tafel-to-v2.py erneut laufen lassen.\n"
        "   ============================================================ */\n\n"
    )

    # v2-spezifische CSS-Overrides (am Ende, übersteuern die portierten Standalone-Regeln)
    v2_overrides = """
/* === v2-spezifische Anpassungen (Selektoren existieren in Standalone nicht oder anders) === */

/* Navbar: v2 hat .navbar-logo (nicht .nav-logo) und .navbar-brand-Container */
body.view-tafel .navbar-logo { height: 70px; }
body.view-tafel .navbar-brand { white-space: nowrap; gap: 12px; font-size: 2rem; }
body.view-tafel .navbar-brand .brand-name { display: inline; font-size: 1em; }
body.view-tafel .navbar-brand > span { display: inline-flex; align-items: baseline; gap: 4px; white-space: nowrap; }
body.view-tafel .navbar-links a { font-size: 1.2rem; }

/* Story-Card ist in v2 der Wrapper um #story-text — im Tafel-Modus
   wird #story-text in .tafel-story-col verschoben, .story-card bleibt leer.
   Verstecken, damit kein leerer weißer Container im Layout bleibt. */
body.view-tafel .story-card { display: none; }

/* Sandbox-Banner oben raus — lenkt im Klassenraum ab */
body.view-tafel .sandbox-banner { display: none; }

/* Micro-Survey ("Hat dir die Geschichte gefallen?") raus — passt nicht zum Klassen-Setting */
body.view-tafel .survey { display: none; }

/* Navbar-CTA: Button-Text nicht umbrechen ("Jetzt registrieren") */
body.view-tafel .navbar-cta {
    white-space: nowrap;
    padding: 12px 24px;
    font-size: 1.1rem;
}

/* Back-Link "Zur Bibliothek" unter dem Story-Text raus */
body.view-tafel .btn-secondary,
body.view-tafel .text-center:has(.btn-secondary) { display: none; }

/* Reading-Toolbar wird zu collapsable Zauberkasten: default versteckt,
   wird per JS-Trigger geöffnet (siehe v2/tafel.js Append). */
body.view-tafel .reading-toolbar { display: none; }
body.view-tafel .reading-toolbar.is-tafel-open {
    display: flex;
    position: fixed;
    bottom: 170px; right: 36px;
    z-index: 100;
    flex-direction: column;
    align-items: stretch;
    background: #fff;
    border-radius: 32px;
    padding: 28px 32px;
    gap: 12px;
    min-width: 360px;
    max-width: 480px;
    max-height: calc(100vh - 220px);
    overflow-y: auto;
    box-shadow: 0 16px 40px rgba(0,0,0,0.22);
    border: none;
    margin: 0;
    transform-origin: bottom right;
    animation: tafelZauberkastenOpen 0.22s cubic-bezier(0.2, 0.7, 0.3, 1);
}
@keyframes tafelZauberkastenOpen {
    from { transform: scale(0.6); opacity: 0; }
    to   { transform: scale(1);   opacity: 1; }
}
/* Toolbar-Labels ("Text", "Mehr") als Section-Header sichtbar */
body.view-tafel .reading-toolbar.is-tafel-open .toolbar-label {
    display: block;
    font-family: var(--font-heading, 'Fredoka', sans-serif);
    font-size: 0.95rem;
    font-weight: 600;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: var(--accent-coral, #D67171);
    margin: 6px 0 2px;
}
body.view-tafel .reading-toolbar.is-tafel-open .toolbar-label:first-child { margin-top: 0; }
body.view-tafel .reading-toolbar.is-tafel-open .tool-btn-divider { display: none; }
body.view-tafel .reading-toolbar.is-tafel-open .tool-btn {
    min-height: 60px;
    padding: 16px 22px;
    font-size: 1.15rem;
    font-weight: 600;
    border-radius: 14px;
    justify-content: flex-start;
    gap: 12px;
}

/* Trigger-Button "Zauberkasten" rechts unten — symmetrisch zur Spiele-Bubble */
body.view-tafel .tafel-zauberkasten-trigger {
    position: fixed;
    bottom: 36px; right: 36px;
    z-index: 99;
    min-width: 130px; min-height: 130px;
    border-radius: 36px;
    background: #fff;
    border: none;
    box-shadow: 0 10px 28px rgba(0,0,0,0.14);
    display: flex; align-items: center; justify-content: center; gap: 16px;
    padding: 24px 32px;
    cursor: pointer;
    font-family: var(--font-heading, 'Fredoka', sans-serif);
    font-size: 1.5rem;
    color: var(--accent-coral, #D67171);
    font-weight: 600;
}
body.view-tafel .tafel-zauberkasten-trigger .zk-icon { font-size: 2.6em; line-height: 1; }
body.view-tafel .tafel-zauberkasten-trigger:hover { transform: translateY(-2px); }
body:not(.view-tafel) .tafel-zauberkasten-trigger { display: none; }
"""
    OUT_CSS.write_text(header_css + css_v2 + v2_overrides + "\n", encoding="utf-8")
    # v2-spezifischer JS-Append: Zauberkasten-Trigger erzeugen
    v2_js_append = """

/* === v2-spezifisch: Reading-Toolbar als kollabierbarer Zauberkasten === */
(function setupV2Zauberkasten() {
    function init() {
        if (document.querySelector('.tafel-zauberkasten-trigger')) return;
        if (!document.querySelector('.reading-toolbar')) return;
        const trigger = document.createElement('button');
        trigger.type = 'button';
        trigger.className = 'tafel-zauberkasten-trigger';
        trigger.setAttribute('aria-label', 'Zauberkasten öffnen');
        trigger.innerHTML = '<span class="zk-icon">✨</span> Zauberkasten';
        trigger.onclick = function () {
            const tb = document.querySelector('.reading-toolbar');
            if (!tb) return;
            const isOpen = tb.classList.toggle('is-tafel-open');
            trigger.style.display = isOpen ? 'none' : '';
            if (isOpen && !tb.querySelector('.tafel-zk-close')) {
                const close = document.createElement('button');
                close.type = 'button';
                close.className = 'tafel-zk-close';
                close.setAttribute('aria-label', 'Zauberkasten schließen');
                close.textContent = '×';
                Object.assign(close.style, {
                    position: 'absolute', top: '16px', right: '16px',
                    width: '44px', height: '44px', borderRadius: '50%',
                    border: '2px solid #ddd', background: '#fff',
                    fontSize: '1.6rem', cursor: 'pointer', lineHeight: '1',
                });
                close.onclick = function () {
                    tb.classList.remove('is-tafel-open');
                    trigger.style.display = '';
                };
                tb.style.position = 'fixed';
                tb.appendChild(close);
            }
        };
        document.body.appendChild(trigger);
    }
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
"""
    OUT_JS.write_text(header_js + js_v2 + v2_js_append + "\n", encoding="utf-8")

    print(f"[ok] v2/tafel.css ({len(css_v2)} Zeichen)")
    print(f"[ok] v2/tafel.js  ({len(js_v2)} Zeichen)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
