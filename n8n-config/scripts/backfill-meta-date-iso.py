"""
Backfill <meta name="date" content="..."> in allen Story-HTML-Files.

Ersetzt das reine Datums-Meta-Tag (z.B. "2026-04-24") durch einen vollen
ISO-8601-Timestamp (z.B. "2026-04-24T21:31:24+02:00").

Strategie (verhindert, dass alte Stories durch Bulk-Patches nach vorn springen):
- Nimm das vorhandene Meta-Datum (Tag) als verbindliches Datum.
- Wenn die File-mtime im selben Tag liegt: nutze mtime als Uhrzeit
  (gibt die echte Creation-Reihenfolge fuer am selben Tag erstellte Stories).
- Sonst: ergaenze "12:00:00" + lokale Timezone als Pseudo-Uhrzeit.

Hintergrund: Die Sortierung im Katalog (demo.html / index.html) basiert auf
diesem Meta-Tag. Ohne Uhrzeit kollidieren am gleichen Tag erstellte Stories.

Usage:
    python n8n-config/scripts/backfill-meta-date-iso.py [--dry-run]
"""
from __future__ import annotations

import argparse
import re
import sys
from datetime import datetime, time, timezone
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]
TARGET_DIRS = ["demo-texte", "texte", "comicgeschichten"]
META_DATE_RE = re.compile(
    r'(<meta\s+name=["\']date["\']\s+content=["\'])([^"\']+)(["\'])',
    re.IGNORECASE,
)
LOCAL_TZ = datetime.now(timezone.utc).astimezone().tzinfo


def derive_iso(meta_date: str, path: Path) -> str | None:
    """Kombiniert Meta-Datum mit mtime (falls selber Tag) oder fester 12:00."""
    try:
        meta_day = datetime.strptime(meta_date, "%Y-%m-%d").date()
    except ValueError:
        return None

    mtime_dt = datetime.fromtimestamp(path.stat().st_mtime, tz=timezone.utc).astimezone()
    if mtime_dt.date() == meta_day:
        return mtime_dt.replace(microsecond=0).isoformat()

    noon_local = datetime.combine(meta_day, time(12, 0, 0), tzinfo=LOCAL_TZ)
    return noon_local.isoformat()


def process_file(path: Path, dry_run: bool) -> tuple[bool, str]:
    text = path.read_text(encoding="utf-8")
    match = META_DATE_RE.search(text)
    if not match:
        return False, "kein <meta name=date>"

    current = match.group(2)
    if "T" in current:
        return False, f"bereits ISO ({current})"

    new_date = derive_iso(current, path)
    if new_date is None:
        return False, f"unparseable ({current})"
    if new_date == current:
        return False, "unveraendert"

    if not dry_run:
        new_text = META_DATE_RE.sub(lambda m: m.group(1) + new_date + m.group(3), text, count=1)
        path.write_text(new_text, encoding="utf-8")

    return True, f"{current} -> {new_date}"


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()

    total = 0
    changed = 0
    for dirname in TARGET_DIRS:
        dir_path = REPO_ROOT / dirname
        if not dir_path.is_dir():
            continue
        for html in sorted(dir_path.glob("*.html")):
            total += 1
            did_change, info = process_file(html, args.dry_run)
            marker = "CHANGE" if did_change else "skip  "
            print(f"[{marker}] {html.relative_to(REPO_ROOT)}: {info}")
            if did_change:
                changed += 1

    print(f"\n{changed}/{total} Dateien aktualisiert{' (dry-run)' if args.dry_run else ''}.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
