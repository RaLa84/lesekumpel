"""Bindet lautlese.js in die Story-HTML-Dateien ein (ein <script>-Tag vor </body>).

lautlese.js ist selbst-bootstrappend: Es prueft, ob die Seite eine Story ist
(globales rawStory + .activity-tabs.spiel-chooser) und haengt dann einen
"Laute"-Tab in die bestehende Spielzeit-Aktivitaet ein. Auf allen anderen Seiten
tut es nichts. Daher ist das Einbinden ueberall unschaedlich.

Idempotent ueber das Vorkommen von "lautlese.js". Mit --force wird der vorhandene
Tag entfernt und neu eingefuegt (z.B. wenn sich der Pfad aendert).

Aufruf:
  python scripts/apply-lautlese.py            # alle demo-texte/ + Template
  python scripts/apply-lautlese.py <datei>    # nur eine Datei (Test)
"""
import sys
from pathlib import Path

REPO = Path(__file__).resolve().parent.parent

# Pfad relativ zur Story-Datei (demo-texte/ -> ../lautlese.js)
SCRIPT_TAG = '<script src="../lautlese.js"></script>'
MARKER = "lautlese.js"

EXTRA_TARGETS = [
    Path("n8n-config/demo-template.html"),  # Quelle fuer neu generierte Stories
]


def apply_to_target(target_path: Path, force: bool = False) -> tuple[bool, str]:
    src = target_path.read_text(encoding="utf-8")

    if MARKER in src:
        if not force:
            return False, "schon eingebunden (--force zum Aktualisieren)"
        # vorhandenen Tag entfernen (mit fuehrendem Whitespace)
        import re
        src = re.sub(r"\n\s*<script[^>]*src=\"[^\"]*lautlese\.js\"[^>]*></script>", "", src, count=1)

    body_close = src.rfind("</body>")
    if body_close == -1:
        return False, "kein </body> gefunden"

    new_src = src[:body_close].rstrip() + "\n\n    " + SCRIPT_TAG + "\n" + src[body_close:]
    target_path.write_text(new_src, encoding="utf-8")
    return True, "ok"


def discover_targets() -> list[Path]:
    return sorted((REPO / "demo-texte").glob("*.html"))


def main() -> int:
    force = "--force" in sys.argv
    args = [a for a in sys.argv[1:] if not a.startswith("--")]

    if args:
        targets = [Path(a) if Path(a).is_absolute() else (REPO / a) for a in args]
        extras = []
    else:
        targets = discover_targets()
        extras = [REPO / rel for rel in EXTRA_TARGETS]

    print(f"Script-Tag: {SCRIPT_TAG}")
    print(f"Mode: {'UPDATE (--force)' if force else 'APPLY (nur neue)'}")
    print(f"Ziele: {len(targets)} demo-texte + {len(extras)} extra")
    print()

    ok_count = 0
    for target in targets + extras:
        if not target.exists():
            print(f"  [missing] {target.name}: nicht gefunden")
            continue
        ok, msg = apply_to_target(target, force=force)
        if ok:
            ok_count += 1
        mark = "[ok]" if ok else "[skip]"
        print(f"  {mark} {target.name}: {msg}")

    print(f"\n{ok_count} Datei(en) aktualisiert.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
