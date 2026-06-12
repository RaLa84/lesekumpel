# -*- coding: utf-8 -*-
"""Generiert die drei Coming-Soon-Stub-Seiten in v2/ aus einer gemeinsamen Vorlage."""
import io
import os

TEMPLATE = """<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{title} — Lesekumpel</title>
  <meta name="description" content="{desc_meta}">

  <link rel="icon" type="image/webp" href="../Konzept_Rebranding/logo-lesekumpel-512.webp">
  <link rel="stylesheet" href="../fonts/fonts.css">
  <link rel="stylesheet" href="styles.css">
  <style>
    .stub-wrap {{
      max-width: 640px;
      margin: 0 auto;
      padding: 56px 24px 90px;
      text-align: center;
    }}
    .stub-card {{
      background: var(--white);
      border: 2px dashed {accent};
      border-radius: var(--radius-card);
      padding: 44px 32px;
      box-shadow: var(--shadow-card);
    }}
    .stub-icon {{
      width: 84px; height: 84px;
      border-radius: 50%;
      background: {tint};
      display: inline-flex;
      align-items: center;
      justify-content: center;
      font-size: 2.6rem;
      margin-bottom: 16px;
    }}
    .stub-card h1 {{ font-size: 1.9rem; margin-bottom: 10px; }}
    .stub-card .badge {{ margin-bottom: 20px; }}
    .stub-card > p {{
      font-size: 1.02rem;
      line-height: 1.7;
      color: var(--text-soft);
      margin-bottom: 26px;
    }}
    .stub-features {{
      text-align: left;
      background: var(--cream-light);
      border: 1px solid var(--border);
      border-radius: var(--radius-inner);
      padding: 20px 22px;
      margin-bottom: 28px;
    }}
    .stub-features h2 {{
      font-size: 1rem;
      font-family: var(--font-heading);
      margin-bottom: 12px;
    }}
    .stub-features ul {{ list-style: none; padding: 0; margin: 0; }}
    .stub-features li {{
      padding: 7px 0 7px 28px;
      position: relative;
      font-size: 0.95rem;
      line-height: 1.5;
    }}
    .stub-features li::before {{
      content: '\\2728';
      position: absolute;
      left: 0;
      top: 7px;
    }}
  </style>
</head>
<body data-page="erstellen">

  <a href="#main" class="skip-link">Zum Inhalt springen</a>

  <div class="sandbox-banner">
  Du bist im Redesign-Sandbox <strong>v2</strong>. <a href="../index.html">Zur Live-Version wechseln &rarr;</a>
</div>
<nav class="navbar" aria-label="Hauptnavigation">
  <div class="navbar-inner">
    <a href="index.html" class="navbar-brand">
      <img src="../Konzept_Rebranding/logo-lesekumpel-512.webp" alt="Lesekumpel Logo" class="navbar-logo">
      <span>Lese<span class="brand-name">kumpel</span></span>
    </a>
    <div class="navbar-links">
      <a href="index.html#mission" data-nav="mission">F&uuml;r euch</a>
      <a href="index.html#how-it-works" data-nav="how">So funktioniert&rsquo;s</a>
      <a href="ueber-uns.html" data-nav="ueber-uns">&Uuml;ber uns</a>
      <a href="demo.html" data-nav="demo">Demo-Texte</a>
      <a href="preise.html" data-nav="preise">Preise</a>
      <a href="neue-geschichte.html" data-nav="erstellen">Geschichte erstellen</a>
      <a href="mein-konto.html" data-nav="mein-konto">Mein Konto</a>
    </div>
    <a href="index.html#registrieren" class="btn btn-primary navbar-cta">Jetzt registrieren</a>
    <button type="button" class="burger" aria-label="Men&uuml; &ouml;ffnen" aria-expanded="false" aria-controls="mobile-menu" onclick="toggleMenu()">&#9776;</button>
  </div>
  <div id="mobile-menu" class="mobile-menu">
    <a href="index.html#mission" onclick="toggleMenu()">F&uuml;r euch</a>
    <a href="index.html#how-it-works" onclick="toggleMenu()">So funktioniert&rsquo;s</a>
    <a href="ueber-uns.html" onclick="toggleMenu()">&Uuml;ber uns</a>
    <a href="demo.html" onclick="toggleMenu()">Demo-Texte</a>
    <a href="preise.html" onclick="toggleMenu()">Preise</a>
    <a href="neue-geschichte.html" onclick="toggleMenu()">Geschichte erstellen</a>
    <a href="mein-konto.html" onclick="toggleMenu()">Mein Konto</a>
    <a href="index.html#registrieren" class="mobile-menu-cta" onclick="toggleMenu()">Jetzt registrieren &rarr;</a>
  </div>
</nav>

  <main id="main">
    <div class="stub-wrap">
      <div class="stub-card">
        <div class="stub-icon" aria-hidden="true">{icon}</div>
        <h1>{title}</h1>
        <span class="badge badge-yellow">In Arbeit</span>
        <p>{intro}</p>
        <div class="stub-features">
          <h2>Geplante Features</h2>
          <ul>
{features}
          </ul>
        </div>
        <a href="neue-geschichte.html" class="btn btn-secondary">&larr; Zur&uuml;ck zur Auswahl</a>
      </div>
    </div>
  </main>

  <footer class="modern-footer">
  <div class="footer-grid">
    <div class="footer-brand-block">
      <div class="footer-brand-row">
        <img src="../Konzept_Rebranding/logo-lesekumpel-512.webp" alt="Lesekumpel Logo">
        <span>Lese<span class="brand-yellow">kumpel</span></span>
      </div>
      <p class="footer-tagline">Die inklusive Lese-App, die jedes Kind lieben lernt. Neurodivers gestaltet, immer kostenlos.</p>
    </div>

    <div>
      <h4>Entdecken</h4>
      <ul>
        <li><a href="demo.html">Demo-Texte</a></li>
        <li><a href="neue-geschichte.html">Geschichte erstellen</a></li>
        <li><a href="index.html#mission">F&uuml;r euch</a></li>
        <li><a href="index.html#faq">FAQ</a></li>
      </ul>
    </div>

    <div>
      <h4>Mehr</h4>
      <ul>
        <li><a href="ueber-uns.html">&Uuml;ber uns</a></li>
        <li><a href="preise.html">Preise</a></li>
        <li><a href="mein-konto.html">Mein Konto</a></li>
        <li><a href="../blog-warum-lesekumpel.html">Blog</a></li>
      </ul>
    </div>

    <div>
      <h4>Rechtliches</h4>
      <ul>
        <li><a href="impressum.html">Impressum</a></li>
        <li><a href="datenschutz.html">Datenschutz</a></li>
        <li><a href="../knowledge-base/snacks/index.html">Wissen</a></li>
      </ul>
    </div>
  </div>

  <div class="footer-bottom">
    <span>&copy; 2026 Lesekumpel &middot; Inklusive Lese-App f&uuml;r jedes Gehirn</span>
    <span><a href="../index.html">&larr; Zur Live-Version</a> &middot; <span class="footer-sandbox-label">v2 Sandbox</span></span>
  </div>
</footer>

  <script src="scripts.js?v=4"></script>
</body>
</html>
"""

PAGES = [
    {
        "file": "neue-top100.html",
        "title": "Top 100 Basiswörter",
        "desc_meta": "Bald: Die 100 wichtigsten Wörter spielerisch lernen und eigene Mini-Geschichten mixen.",
        "icon": "\U0001F4AF",
        "accent": "var(--yellow)",
        "tint": "rgba(255,217,90,0.25)",
        "intro": "Hier wirst du bald die 100 wichtigsten Wörter der deutschen Sprache spielerisch lernen — und aus deinem gewachsenen Wortschatz eigene Mini-Geschichten mixen.",
        "features": [
            "Eigener Fortschritt: Welche Wörter hast du schon sicher gelesen?",
            "Wimmelbild-Seiten zum Suchen und Antippen der Top-100-Wörter",
            "Eigene Mix-Geschichten aus deinem gelernten Wortschatz",
            "Sanftes Wiederholen — kein Test-Stress, nur Spiel",
        ],
    },
    {
        "file": "neue-lesestufen.html",
        "title": "Lesestufen",
        "desc_meta": "Bald: Geschichten passend zur Schul-Fibel — mit genau den Buchstaben, die gerade dran sind.",
        "icon": "\U0001F393",
        "accent": "var(--mint)",
        "tint": "rgba(47,184,166,0.15)",
        "intro": "Bald begleitet Lesekumpel die Schul-Fibel deines Kindes Lektion für Lektion. Du gibst die aktuelle Lese-Stufe und ein Lieblingsthema ein — Lesekumpel schreibt eine Geschichte, in der genau die neuen Buchstaben besonders oft vorkommen.",
        "features": [
            "Lese-Stufen passend zu Cornelsen, Mildenberger &amp; anderen Fibeln",
            "Lieblingsthema als Keyword (z.&nbsp;B. „Minecraft“, „Pferde“, „Fußball“)",
            "Neue Grapheme/Buchstaben werden farbig hervorgehoben",
            "Genau das, was in der Schule gerade dran ist — verpackt in eine Geschichte",
        ],
    },
    {
        "file": "neue-geschichte-bauen.html",
        "title": "Geschichte bauen",
        "desc_meta": "Bald: Du schreibst zwei Sätze, Lesekumpel macht weiter — gemeinsam baut ihr eure eigene Geschichte.",
        "icon": "✏️",
        "accent": "var(--lila)",
        "tint": "rgba(125,106,230,0.15)",
        "intro": "Bald wirst du selbst zum Autor. Du schreibst zwei Sätze — Lesekumpel macht weiter und gibt dir den nächsten Cliffhanger zurück. So baut ihr gemeinsam deine ganz eigene Geschichte.",
        "features": [
            "Du startest, die KI baut weiter — abwechselnd",
            "Cliffhanger-Modus: an jeder spannenden Stelle bist du wieder dran",
            "Eigene Geschichten speichern und mit Familie teilen",
            "Mit deinem Lieblings-Persona zusammen schreiben",
        ],
    },
]


def main():
    base = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "v2")
    for p in PAGES:
        feats = "\n".join("            <li>%s</li>" % f for f in p["features"])
        html = TEMPLATE.format(
            title=p["title"], desc_meta=p["desc_meta"], icon=p["icon"],
            accent=p["accent"], tint=p["tint"], intro=p["intro"], features=feats,
        )
        path = os.path.join(base, p["file"])
        with io.open(path, "w", encoding="utf-8", newline="\n") as fh:
            fh.write(html)
        print("OK", path)


if __name__ == "__main__":
    main()
