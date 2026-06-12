# -*- coding: utf-8 -*-
"""Migriert kuratierte Geschichten aus demo-texte/ und comicgeschichten/
in den v2-Ordner, indem die n8n-Injektionsdaten aus den Quell-Dateien
extrahiert und in die v2-Templates eingesetzt werden.

Aufruf:  py scripts/migrate-stories-to-v2.py
"""
import io
import json
import os
import re

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# ── Kuratierte Auswahl ──────────────────────────────────────────────
# Texte: alle 5 Skill-Personas, alle 4 Neurotypen, 2 Bonus-Personas.
# Die 5 bereits portierten v2-Stories werden mit regeneriert, damit
# alle v2-Stories dasselbe (volle) Feature-Set haben.
TEXT_SLUGS = [
    # Neu kuratiert
    "abfall-sortieren-1c36",                  # Pip Punkt / Standard
    "das-drachenei-bnvv",                     # Pip Punkt / ADHS
    "till-macht-ferien-rm20",                 # Pip Punkt / Autismus
    "ben-sucht-hamster-henry-1q0b",           # Mia Mitte / ADHS
    "lina-und-der-marienkaefer-1w21",         # Mia Mitte / Standard
    "drei-freunde-am-spielplatz-r423",        # Stella / Autismus
    "streit-am-eisstand-1kcp",                # Stella / LRS
    "die-singenden-weltraumwale-1bvz",        # Finja / Standard
    "warum-pinguine-nicht-frieren-l29e",      # Samira (Bonus, Sachtext)
    "holzi-und-der-verlorene-highscore-f4gl", # Holzi (Bonus, Gaming)
    # Regeneration der bestehenden v2-Stories (volles Feature-Set)
    "doenerella-f11p",                        # Finja / Autismus
    "doenerella-ipdb",                        # Finja / ADHS
    "liliths-wochenende-mit-pino-12kl",       # Peter / LRS
    "liliths-wochenende-mit-pino-163g",       # Peter / LRS
    "liliths-wochenende-mit-pino-1h9o",       # Peter / Standard
]

COMIC_SLUGS = [
    "baerli-sucht-honig",
    "leos-roter-ball",
    "flauschi-macht-einen-pups",
]

AVATAR_BY_AUTHOR = {
    "Pip Punkt": "pip-punkt.webp",
    "Mia Mitte": "mia-mitte.webp",
    "Peter Past": "peter-past.webp",
    "Stella Stimmenreich": "stella-stimmenreich.webp",
    "Finja Feder": "finja-feder.webp",
    "Samira Wissensfreund": "samira-wissensfreund.webp",
    "Holzi Pixelkopf": "holzi-pixelkopf.webp",
    "Deniz Traumfänger": "deniz-traumfaenger.webp",
    "Jonas Entdecker": "jonas-entdecker.webp",
}


def read(path):
    with io.open(path, encoding="utf-8") as f:
        return f.read()


def write(path, content):
    with io.open(path, "w", encoding="utf-8", newline="\n") as f:
        f.write(content)


def meta(html, name):
    m = re.search(r'<meta name="%s" content="([^"]*)"' % re.escape(name), html)
    return m.group(1) if m else ""


def extract_js_literal(html, var):
    """Extrahiert das JS-Literal einer einzeiligen Injektionszeile:
    `let rawStory = <LITERAL>;` bzw. `const quizData = <LITERAL>;`"""
    m = re.search(r'^\s*(?:let|const)\s+%s\s*=\s*(.*?);\s*$' % re.escape(var), html, re.M)
    return m.group(1) if m else None


def migrate_text_story(slug):
    src_path = os.path.join(BASE, "demo-texte", slug + ".html")
    html = read(src_path)
    template = read(os.path.join(BASE, "v2", "story-template.html"))

    # Titel: aus dem H1 (#main-title), Fallback <title>
    m = re.search(r'<h1 id="main-title">([^<]*)</h1>', html)
    title = m.group(1).strip() if m else re.sub(r"\s*[—|-].*$", "", re.search(r"<title>([^<]*)</title>", html).group(1)).strip()

    author = meta(html, "author")
    date = meta(html, "date")
    level = meta(html, "reading-level")
    neurotyp = meta(html, "neurotype") or "Standard"
    topic = meta(html, "topic")
    desc = meta(html, "description")

    avatar = AVATAR_BY_AUTHOR.get(author)
    if not avatar:
        raise ValueError("%s: unbekannter Autor '%s'" % (slug, author))

    # Injektionsdaten extrahieren (Literale 1:1 übernehmen)
    inject = {}
    for var, placeholder, default in [
        ("rawStory", "RAW_STORY_TEXT", '""'),
        ("emojiStory", "EMOJI_STORY_TEXT", '""'),
        ("rawSummary", "RAW_SUMMARY_TEXT", '""'),
        ("emojiSummary", "EMOJI_SUMMARY_TEXT", '""'),
        ("quizData", "QUIZ_DATA_JSON", "[]"),
        ("rawDictionaryEntry", "DICTIONARY_JSON", "[]"),
        ("weitererzaehlenData", "WEITERERZAEHLEN_JSON", "null"),
        ("schatzsucheData", "SCHATZSUCHE_JSON", "null"),
    ]:
        lit = extract_js_literal(html, var)
        inject[placeholder] = lit if lit is not None else default

    # Story-Bilder: alle .hero-image-Tags der Quelle (URLs einsammeln)
    img_urls = re.findall(r'<img[^>]*class="hero-image"[^>]*src="([^"]+)"', html)
    img_urls += re.findall(r'<img[^>]*src="([^"]+)"[^>]*class="hero-image"', html)
    img_urls = list(dict.fromkeys(img_urls))  # dedupe, Reihenfolge erhalten
    images_html = "\n    ".join(
        '<img src="%s" alt="%s" class="hero-image" onerror="this.style.display=\'none\'">' % (u, title)
        for u in img_urls
    )

    # Hero-Bild: erstes Story-Bild, Fallback auf Konvention bilder/<slug>-1.png
    hero_url = img_urls[0] if img_urls else "https://rala84.github.io/lesekumpel/bilder/%s-1.png" % slug

    # imagePositions (Tafel-Modus), falls die Quelle sie hat
    m = re.search(r'window\.imagePositions\s*=\s*(.*?);', html)
    image_positions = m.group(1) if m else "[]"

    out = template
    repl = {
        "STORY_TITLE": title,
        "META_DESCRIPTION": desc,
        "PERSONA_NAME": author,
        "STORY_DATE": date,
        "READING_LEVEL_LABEL": level,
        "NEUROTYP": neurotyp,
        "GENRE": topic,
        "HERO_IMAGE_URL": hero_url,
        "PERSONA_IMG_URL": "../../avatars/" + avatar,
        "STORY_IMAGES_HTML": images_html,
        "IMAGE_POSITIONS_JSON": image_positions,
        "RELATED_STORIES_HTML": "",
    }
    repl.update(inject)
    for key, val in repl.items():
        out = out.replace("{{%s}}" % key, val)

    # Leeren Genre-Badge entfernen
    out = out.replace('<span class="badge"></span>', "")

    # Übrig gebliebene Platzhalter leeren (wie assemble-html-v2.js)
    out = re.sub(r"\{\{[A-Z_]+\}\}", "", out)

    dst = os.path.join(BASE, "v2", "demo-texte", slug + ".html")
    write(dst, out)
    return dst


def migrate_comic(slug):
    src_path = os.path.join(BASE, "comicgeschichten", slug + ".html")
    html = read(src_path)
    template = read(os.path.join(BASE, "v2", "comic-template.html"))

    m = re.search(r"const inputData\s*=\s*(\{.*?\});", html, re.S)
    if not m:
        raise ValueError("%s: inputData nicht gefunden" % slug)
    data = json.loads(m.group(1))

    title = data.get("title") or re.sub(r"\s*[—|-].*$", "", re.search(r"<title>([^<]*)</title>", html).group(1)).strip()
    content = data.get("content", {})
    pages = []
    i = 1
    while ("tile%d" % i) in content or ("download_url_%d" % i) in content:
        pages.append({
            "image": content.get("download_url_%d" % i, ""),
            "text": (content.get("tile%d" % i) or "").replace('"', "").strip(),
        })
        i += 1
    if not pages:
        raise ValueError("%s: keine Seiten gefunden" % slug)

    date = meta(html, "date")
    desc = meta(html, "description")

    out = template
    repl = {
        "STORY_TITLE": title,
        "META_DESCRIPTION": desc,
        "PERSONA_NAME": "Lesekumpel",
        "STORY_DATE": date,
        "READING_LEVEL_LABEL": "Bildgeschichte",
        "NEUROTYP": "Standard",
        "COMIC_PAGES_JSON": json.dumps(pages, ensure_ascii=False),
    }
    for key, val in repl.items():
        out = out.replace("{{%s}}" % key, val)
    out = re.sub(r"\{\{[A-Z_]+\}\}", "", out)

    dst = os.path.join(BASE, "v2", "comicgeschichten", slug + ".html")
    write(dst, out)
    return dst


def main():
    ok, fail = [], []
    for slug in TEXT_SLUGS:
        try:
            ok.append(migrate_text_story(slug))
        except Exception as e:
            fail.append((slug, str(e)))
    for slug in COMIC_SLUGS:
        try:
            ok.append(migrate_comic(slug))
        except Exception as e:
            fail.append((slug, str(e)))
    print("Migriert: %d" % len(ok))
    for p in ok:
        print("  OK   " + os.path.relpath(p, BASE))
    if fail:
        print("Fehlgeschlagen: %d" % len(fail))
        for slug, err in fail:
            print("  FAIL %s — %s" % (slug, err))


if __name__ == "__main__":
    main()
