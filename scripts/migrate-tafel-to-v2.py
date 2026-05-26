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

    OUT_CSS.write_text(header_css + css_v2 + "\n", encoding="utf-8")
    OUT_JS.write_text(header_js + js_v2 + "\n", encoding="utf-8")

    print(f"[ok] v2/tafel.css ({len(css_v2)} Zeichen)")
    print(f"[ok] v2/tafel.js  ({len(js_v2)} Zeichen)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
