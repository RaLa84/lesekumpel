"""Erzeugt 300x300 WebP-Thumbnails aller 8 Bildstile fuer neue-geschichte.html.

Jedes Bild wird zentriert quadratisch gecroppt und auf 300x300 skaliert,
dann als WebP (Quality 82) gespeichert unter bilder/bildstil-vorschau/.

Aufrufen nach jedem Webhook-Run, damit neue Beispielbilder uebernommen werden.
"""
import sys
from pathlib import Path
from PIL import Image

sys.stdout.reconfigure(encoding="utf-8")

ROOT = Path(__file__).resolve().parents[2]
SRC_DIR = ROOT / "bilder"
DST_DIR = ROOT / "bilder" / "bildstil-vorschau"
DST_DIR.mkdir(exist_ok=True)

# Mapping Stil -> Quellbild (aus den Phase-1 Tests)
STYLE_MAP = {
    "aquarell":  "das-hochbeet-boit-1.png",
    "cartoon":   "das-ritterturnier-pf37-1.png",
    "buntstift": None,  # Wird per WEBHOOK_PATTERN aufgefuellt
    "pixel-art": "die-grosse-praesentation-e1of-1.png",
    "anime":     "der-neue-mitschueler-e7ii-1.png",
    "traumwelt": None,  # Wird per WEBHOOK_PATTERN aufgefuellt
    "knete":     "das-baumhaus-92ev-1.png",
    "voxel":     "das-verlorene-schwert-xsrd-1.png",
}

# Fallback: neuest-passende Datei fuer Stile ohne festes Mapping
# Wird nach Titel-Stem gesucht
WEBHOOK_PATTERN = {
    "buntstift": "der-drachen-am-himmel-",
    "traumwelt": "die-gluehwuermchenwiese-",
}

SIZE = 300
QUALITY = 82


def find_fallback(stem: str):
    """Suche neueste PNG in SRC_DIR, deren Name mit stem beginnt und auf -1.png endet."""
    candidates = sorted(
        [p for p in SRC_DIR.glob(f"{stem}*-1.png") if p.is_file()],
        key=lambda p: p.stat().st_mtime,
        reverse=True,
    )
    return candidates[0] if candidates else None


def center_crop_square(img: Image.Image) -> Image.Image:
    w, h = img.size
    s = min(w, h)
    left = (w - s) // 2
    top = (h - s) // 2
    return img.crop((left, top, left + s, top + s))


def process(stil: str, src_name: str | None):
    src = None
    if src_name:
        cand = SRC_DIR / src_name
        if cand.exists():
            src = cand
    if src is None and stil in WEBHOOK_PATTERN:
        src = find_fallback(WEBHOOK_PATTERN[stil])
    if src is None:
        print(f"  [SKIP] {stil}: kein Quellbild gefunden")
        return False

    with Image.open(src) as img:
        img = img.convert("RGB")
        img = center_crop_square(img)
        img = img.resize((SIZE, SIZE), Image.LANCZOS)
        dst = DST_DIR / f"{stil}.webp"
        img.save(dst, "WEBP", quality=QUALITY, method=6)
        size_kb = dst.stat().st_size / 1024
        print(f"  [OK]   {stil:10s}: {src.name} -> {dst.name} ({size_kb:.1f} KB)")
        return True


if __name__ == "__main__":
    print(f"Source: {SRC_DIR}")
    print(f"Dest:   {DST_DIR}")
    print(f"Size:   {SIZE}x{SIZE}px, WebP Q{QUALITY}")
    print()
    ok = 0
    for stil, src in STYLE_MAP.items():
        if process(stil, src):
            ok += 1
    print()
    print(f"Done: {ok}/{len(STYLE_MAP)} thumbnails written")
