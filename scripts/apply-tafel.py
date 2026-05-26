"""Kopiert den Tafel-Code (CSS + JS) aus der Dönerella-Vorlage in andere standalone Story-HTML-Dateien."""
import re
import sys
from pathlib import Path

REPO = Path(__file__).resolve().parent.parent
SOURCE = REPO / "demo-texte" / "doenerella-im-weltall-11ym.html"
TARGETS = [
    "bens-drachen-am-huegel-uuvs.html",
    "pip-raeumt-seinen-schreibtisch-auf-1abc.html",
    "lina-und-der-marienkaefer-1w21.html",
    "der-igel-im-garten-bei-nacht-10vo.html",
    "der-junge-mit-dem-gelben-regenmantel-1lvp.html",
]

# Marker zum Erkennen ob Tafel-Code schon eingebaut ist (Idempotenz)
TAFEL_MARKER = "/* === TAFEL-ANSICHT v2:"
TAFEL_JS_MARKER = "// === TAFEL-ANSICHT v2:"
WINDOW_IMG_LINE = "window.imagePositions = imagePositions; // Für Tafel-Modus (Sticky-Bild)"


def extract_tafel_css(src: str) -> str:
    """Findet alles ab '/* === TAFEL-ANSICHT v2:' bis vor dem nächsten '</style>'."""
    start = src.find(TAFEL_MARKER)
    if start == -1:
        raise RuntimeError("Kein Tafel-CSS-Marker in der Quell-Datei gefunden")
    end = src.find("</style>", start)
    if end == -1:
        raise RuntimeError("Kein </style> nach Tafel-CSS-Marker gefunden")
    # Newline + Indent vor dem Block sicherstellen
    return src[start:end].rstrip()


def extract_tafel_script(src: str) -> str:
    """Findet das letzte <script>...</script> mit dem Tafel-Marker — der gesamte Block."""
    # Wir suchen nach <script> dessen Inhalt mit dem Tafel-Marker beginnt
    pattern = re.compile(r"<script>\s*\n\s*// === TAFEL-ANSICHT v2:.*?</script>", re.DOTALL)
    m = pattern.search(src)
    if not m:
        raise RuntimeError("Kein Tafel-<script>-Block gefunden")
    return m.group(0)


def apply_to_target(target_path: Path, css_block: str, js_block: str) -> tuple[bool, str]:
    src = target_path.read_text(encoding="utf-8")

    if TAFEL_MARKER in src:
        return False, "schon angewendet (Marker gefunden)"

    # 1) CSS-Block direkt vor dem letzten </style> einfügen
    style_close = src.rfind("</style>")
    if style_close == -1:
        return False, "kein </style> gefunden"

    new_src = src[:style_close].rstrip() + "\n\n        " + css_block + "\n    " + src[style_close:]

    # 2) window.imagePositions = imagePositions; nach dem const imagePositions = [...] Statement
    m = re.search(r"(const imagePositions = \[[^\];]*?\];)", new_src)
    if not m:
        return False, "imagePositions-Variable nicht gefunden"

    insert_at = m.end()
    new_src = (
        new_src[:insert_at]
        + "\n        " + WINDOW_IMG_LINE
        + new_src[insert_at:]
    )

    # 3) Tafel-<script>-Block vor </body> einfügen
    body_close = new_src.rfind("</body>")
    if body_close == -1:
        return False, "kein </body> gefunden"

    new_src = new_src[:body_close].rstrip() + "\n\n    " + js_block + "\n" + new_src[body_close:]

    target_path.write_text(new_src, encoding="utf-8")
    return True, "ok"


def main() -> int:
    src_html = SOURCE.read_text(encoding="utf-8")
    css_block = extract_tafel_css(src_html)
    js_block = extract_tafel_script(src_html)

    print(f"Tafel-CSS-Block:  {len(css_block):>6} Zeichen")
    print(f"Tafel-JS-Block:   {len(js_block):>6} Zeichen")
    print()

    for fname in TARGETS:
        target = REPO / "demo-texte" / fname
        if not target.exists():
            print(f"  [missing] {fname}: nicht gefunden")
            continue
        ok, msg = apply_to_target(target, css_block, js_block)
        mark = "[ok]" if ok else "[skip]"
        print(f"  {mark} {fname}: {msg}")

    return 0


if __name__ == "__main__":
    sys.exit(main())
