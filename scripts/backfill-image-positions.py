"""Backfill der Bild-zu-Absatz-Zuordnung (paragraphIndex) für Bestands-Stories.

Hintergrund: Bei einem Teil der Stories steht in `imagePositions` überall
`paragraphIndex: null` -> die Bilder werden nicht semantisch platziert. Die
semantische Zuordnung (welches Bild gehört zu welchem Absatz) trifft Claude
einmalig, indem er die echten Bilder ansieht; dieses Script liefert die
Arbeitsgrundlage und schreibt die Zuordnung idempotent zurück.

Konvention: paragraphIndex ist 0-basiert (Index des \\n\\n-Absatzes). 0 = Cover.

Aufrufe:
  python scripts/backfill-image-positions.py --list-all
      -> alle Stories mit mind. einem paragraphIndex:null (Datei, #Bilder, #Absätze)
  python scripts/backfill-image-positions.py --list <datei.html>
      -> nummerierte Absätze (0-basiert) + Szenen/Bild-Liste der Story
  python scripts/backfill-image-positions.py --set <datei.html> "1:1,2:3,3:5,4:6"
      -> setzt paragraphIndex je scene; validiert (steigend, distinct, <Absatzzahl)
  python scripts/backfill-image-positions.py --check
      -> Exit-Code 1, wenn irgendwo noch paragraphIndex:null
  Optional: --dry-run (mit --set: zeigt alt->neu, schreibt nicht)
"""
import json
import re
import sys
from pathlib import Path

REPO = Path(__file__).resolve().parent.parent
DEMO = REPO / "demo-texte"

RAWSTORY_RX = re.compile(r'let rawStory = "((?:[^"\\]|\\.)*)";')
IMGPOS_RX = re.compile(r'const imagePositions = (\[[^\]]*\]);')


def get_raw_story(html: str) -> str:
    m = RAWSTORY_RX.search(html)
    if not m:
        return ""
    # JSON-String-Escapes auflösen (\n, \" ...)
    return json.loads('"' + m.group(1) + '"')


def get_image_positions(html: str):
    m = IMGPOS_RX.search(html)
    if not m:
        return None, None
    return json.loads(m.group(1)), m


def paragraphs_of(html: str):
    story = get_raw_story(html).replace("­", "")  # Soft-Hyphen raus für Lesbarkeit
    return [p.strip() for p in re.split(r"\n\n+", story) if p.strip()]


def has_null(html: str) -> bool:
    pos, _ = get_image_positions(html)
    return bool(pos) and any(p.get("paragraphIndex") is None for p in pos)


def list_all():
    rows = []
    for f in sorted(DEMO.glob("*.html")):
        html = f.read_text(encoding="utf-8")
        if has_null(html):
            pos, _ = get_image_positions(html)
            rows.append((f.name, len(pos), len(paragraphs_of(html))))
    for name, nimg, npar in rows:
        print(f"{nimg} Bilder / {npar} Absätze   {name}")
    print(f"\n{len(rows)} Stories mit paragraphIndex:null")


def list_one(path: Path):
    html = path.read_text(encoding="utf-8")
    paras = paragraphs_of(html)
    pos, _ = get_image_positions(html)
    print(f"# {path.name}\n# {len(paras)} Absätze (0-basiert), {len(pos) if pos else 0} Bilder\n")
    for i, p in enumerate(paras):
        snippet = p if len(p) <= 240 else p[:240] + "..."
        print(f"[{i}] {snippet}\n")
    print("# Bilder (scene -> aktueller paragraphIndex):")
    for p in (pos or []):
        print(f"#   scene {p['scene']}: {p.get('paragraphIndex')}   ({path.stem}-{p['scene']}.png)")


def set_indices(path: Path, mapping_str: str, dry: bool):
    html = path.read_text(encoding="utf-8")
    pos, m = get_image_positions(html)
    if not pos:
        print(f"  [skip] {path.name}: keine imagePositions gefunden")
        return False
    paras = paragraphs_of(html)
    P = len(paras)
    mapping = {}
    for part in mapping_str.split(","):
        part = part.strip()
        if not part:
            continue
        scene_s, idx_s = part.split(":")
        mapping[int(scene_s)] = int(idx_s)
    new = [dict(p) for p in pos]
    for p in new:
        if p["scene"] in mapping:
            p["paragraphIndex"] = mapping[p["scene"]]
    # Validierung: 0-basiert, in-range; steigend/distinct nur warnen (Duplikate erlaubt bei n>P)
    vals = [p["paragraphIndex"] for p in new]
    if any(v is None for v in vals):
        print(f"  [warn] {path.name}: noch null übrig: {vals}")
    for v in vals:
        if v is not None and not (0 <= v < P):
            print(f"  [FEHLER] {path.name}: paragraphIndex {v} außerhalb 0..{P-1}")
            return False
    new_json = "[" + ",".join(
        '{"scene":%d,"paragraphIndex":%s}' % (p["scene"], "null" if p["paragraphIndex"] is None else int(p["paragraphIndex"]))
        for p in new
    ) + "]"
    old_json = m.group(1)
    if old_json == new_json:
        print(f"  [unverändert] {path.name}")
        return True
    print(f"  {path.name}: {old_json}  ->  {new_json}")
    if not dry:
        html2 = html[:m.start(1)] + new_json + html[m.end(1):]
        path.write_text(html2, encoding="utf-8")
    return True


def check():
    bad = [f.name for f in sorted(DEMO.glob("*.html")) if has_null(f.read_text(encoding="utf-8"))]
    if bad:
        print("Noch paragraphIndex:null in:")
        for n in bad:
            print("  " + n)
        return 1
    print("OK — keine paragraphIndex:null mehr.")
    return 0


def main() -> int:
    args = sys.argv[1:]
    dry = "--dry-run" in args
    args = [a for a in args if a != "--dry-run"]
    if not args:
        print(__doc__)
        return 1
    cmd = args[0]
    if cmd == "--list-all":
        list_all(); return 0
    if cmd == "--check":
        return check()
    if cmd == "--list":
        list_one(Path(args[1]) if Path(args[1]).is_absolute() else REPO / args[1]); return 0
    if cmd == "--set":
        p = Path(args[1]) if Path(args[1]).is_absolute() else REPO / args[1]
        return 0 if set_indices(p, args[2], dry) else 1
    print(__doc__)
    return 1


if __name__ == "__main__":
    sys.exit(main())
