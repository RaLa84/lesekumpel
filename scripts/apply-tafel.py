"""Kopiert den Tafel-Code (CSS + JS) aus der Dönerella-Vorlage in andere standalone Story-HTML-Dateien."""
import re
import sys
from pathlib import Path

REPO = Path(__file__).resolve().parent.parent
SOURCE = REPO / "demo-texte" / "doenerella-im-weltall-11ym.html"

# Zusätzliche Ziele außerhalb von demo-texte/ (z.B. das n8n-Template, aus dem
# künftige Stories generiert werden — strukturell identisch zu Standalone-Stories)
EXTRA_TARGETS = [
    Path("n8n-config/demo-template.html"),
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


def strip_existing_tafel(src: str) -> str:
    """Entfernt den bestehenden Tafel-Block (CSS + JS + window-Export), damit neu eingefügt werden kann."""
    # CSS: von /* === TAFEL-ANSICHT v2: bis (exklusive) </style>
    src = re.sub(
        r"\n\s*/\* === TAFEL-ANSICHT v2:.*?(?=\s*</style>)",
        "",
        src,
        count=1,
        flags=re.DOTALL,
    )
    # JS: <script> mit Tafel-Marker
    src = re.sub(
        r"\n\s*<script>\s*\n\s*// === TAFEL-ANSICHT v2:.*?</script>",
        "",
        src,
        count=1,
        flags=re.DOTALL,
    )
    # window.imagePositions Export-Zeile (idempotent)
    src = re.sub(
        r"\n\s*window\.imagePositions = imagePositions;[^\n]*",
        "",
        src,
        count=1,
    )
    return src


def apply_to_target(target_path: Path, css_block: str, js_block: str, force: bool = False) -> tuple[bool, str]:
    src = target_path.read_text(encoding="utf-8")

    if TAFEL_MARKER in src:
        if not force:
            return False, "schon angewendet (--force zum Aktualisieren)"
        src = strip_existing_tafel(src)

    # 1) CSS-Block direkt vor dem letzten </style> einfügen
    style_close = src.rfind("</style>")
    if style_close == -1:
        return False, "kein </style> gefunden"

    new_src = src[:style_close].rstrip() + "\n\n        " + css_block + "\n    " + src[style_close:]

    # 2) window.imagePositions = imagePositions; nach dem const imagePositions = ... Statement
    # Matched sowohl konkrete Werte (Standalone-Story) als auch n8n-Platzhalter im Template
    m = re.search(r"(const imagePositions = (?:\[[^\];]*?\]|\{\{IMAGE_POSITIONS_JSON\}\});)", new_src)
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


def discover_targets() -> list[Path]:
    """Alle demo-texte/-Seiten finden, die den Tafel-Block schon enthalten (außer der Quelle).
    So aktualisiert --force genau die bereits konvertierten self-contained Seiten."""
    targets = []
    for p in sorted((REPO / "demo-texte").glob("*.html")):
        if p.resolve() == SOURCE.resolve():
            continue
        if TAFEL_MARKER in p.read_text(encoding="utf-8"):
            targets.append(p)
    return targets


def main() -> int:
    force = "--force" in sys.argv
    src_html = SOURCE.read_text(encoding="utf-8")
    css_block = extract_tafel_css(src_html)
    js_block = extract_tafel_script(src_html)

    targets = discover_targets()
    print(f"Tafel-CSS-Block:  {len(css_block):>6} Zeichen")
    print(f"Tafel-JS-Block:   {len(js_block):>6} Zeichen")
    print(f"Mode: {'UPDATE (--force)' if force else 'APPLY (nur neue)'}")
    print(f"Gefundene Ziele (bereits konvertiert): {len(targets)}")
    print()

    for target in targets:
        ok, msg = apply_to_target(target, css_block, js_block, force=force)
        mark = "[ok]" if ok else "[skip]"
        print(f"  {mark} {target.name}: {msg}")

    for rel in EXTRA_TARGETS:
        target = REPO / rel
        if not target.exists():
            print(f"  [missing] {rel}: nicht gefunden")
            continue
        ok, msg = apply_to_target(target, css_block, js_block, force=force)
        mark = "[ok]" if ok else "[skip]"
        print(f"  {mark} {rel}: {msg}")

    return 0


if __name__ == "__main__":
    sys.exit(main())
