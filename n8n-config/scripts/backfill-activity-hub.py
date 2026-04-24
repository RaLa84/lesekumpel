"""
Backfill: Activity-Hub (Quiz + Weiterdenken + Schatzsuche) auf bestehende Stories anwenden.

Betrifft die 12 Stories aus den letzten 4 Tagen, die noch kein Activity-Hub haben.
Story-spezifische Weiterdenken/Schatzsuche-Daten kommen aus activity-data/<slug>.json.

Idempotent: Dateien mit `class="activity-hub"` werden geskippt.

Usage:
    python n8n-config/scripts/backfill-activity-hub.py --dry-run
    python n8n-config/scripts/backfill-activity-hub.py --apply
    python n8n-config/scripts/backfill-activity-hub.py --apply --file demo-texte/das-baumhaus-92ev.html
"""
from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]
DATA_DIR = Path(__file__).resolve().parent / "activity-data"

# Die 12 Stories, die gebackfilled werden sollen. Referenz- und bereits-migrierte Stories sind NICHT enthalten.
TARGETS = [
    "demo-texte/papa-hat-geburtstag-fqmc.html",
    "demo-texte/eine-hausspinne-wird-aus-dem-haus-geworfen-wml5.html",
    "demo-texte/der-ausritt-qxk2.html",
    "demo-texte/versteck-spielen-im-birkenwald-6aw6.html",
    "demo-texte/das-ritterturnier-pf37.html",
    "demo-texte/die-grosse-praesentation-e1of.html",
    "demo-texte/das-baumhaus-92ev.html",
    "demo-texte/das-verlorene-schwert-xsrd.html",
    "demo-texte/der-neue-mitschueler-e7ii.html",
    "demo-texte/der-drachen-am-himmel-zrmy.html",
    "demo-texte/der-grosse-kuchen-ymr3.html",
    "demo-texte/der-reitwettbewerb-bhf3.html",
]

# =============================================================================
# CSS-Block (wird ans Ende des vorhandenen <style> gehaengt)
# =============================================================================

CSS_BLOCK = """
        /* --- ACTIVITY-HUB: Quiz + Weiterdenken + Schatzsuche --- */
        .quiz-reveal-btn {
            display: block; margin: 12px auto 0 auto;
            background: transparent; border: 1.5px dashed #ddd;
            padding: 8px 18px; border-radius: 20px; cursor: pointer;
            font-family: var(--font-body); font-size: 0.9rem;
            color: #999; transition: all 0.2s ease;
            -webkit-tap-highlight-color: transparent;
        }
        .quiz-reveal-btn:hover { color: var(--accent-coral); border-color: var(--accent-coral); background: rgba(214,113,113,0.04); }
        .quiz-reveal-btn:active { transform: scale(0.98); }

        /* --- WEITERERZÄHLEN --- */
        .weitererzaehlen-intro {
            text-align: center; color: #888; font-style: italic;
            margin-top: -10px; margin-bottom: 22px; font-size: 1rem;
        }
        .weitererzaehlen-cards { display: flex; flex-direction: column; gap: 14px; }
        .weitererzaehlen-card {
            background: linear-gradient(135deg, #fef9e7 0%, #fff 100%);
            border: 2px solid var(--primary-yellow); border-radius: 18px; padding: 18px 20px;
            cursor: pointer; transition: all 0.25s ease; position: relative; overflow: hidden;
            -webkit-tap-highlight-color: transparent;
        }
        .weitererzaehlen-card:hover {
            transform: translateY(-3px);
            box-shadow: 0 6px 20px rgba(255,213,79,0.35);
            border-color: var(--accent-coral);
        }
        .weitererzaehlen-card.open {
            background: linear-gradient(135deg, #fff 0%, #fff9e5 100%);
            border-color: var(--accent-coral);
            box-shadow: 0 4px 16px rgba(214,113,113,0.18);
        }
        .weitererzaehlen-card-header { display: flex; align-items: center; gap: 14px; }
        .weitererzaehlen-emoji { font-size: 2rem; flex-shrink: 0; line-height: 1; }
        .weitererzaehlen-titel {
            font-family: var(--font-heading); font-weight: 600; font-size: 1.1rem;
            color: var(--text-dark); flex-grow: 1; line-height: 1.3;
        }
        .weitererzaehlen-chevron {
            color: #bbb; transition: transform 0.25s ease; font-size: 0.9rem; flex-shrink: 0;
        }
        .weitererzaehlen-card.open .weitererzaehlen-chevron {
            transform: rotate(180deg); color: var(--accent-coral);
        }
        .weitererzaehlen-text {
            max-height: 0; overflow: hidden;
            transition: max-height 0.35s ease, padding 0.35s ease, margin 0.35s ease;
            color: #444; line-height: 1.7; font-size: 1.05rem;
            padding: 0; margin: 0;
        }
        .weitererzaehlen-card.open .weitererzaehlen-text {
            max-height: 600px; padding: 14px 0 4px 0; margin-top: 6px;
            border-top: 1px dashed #f0e4b8;
        }
        .weitererzaehlen-text-body { padding-top: 10px; }
        .weitererzaehlen-hinweis {
            color: #aaa; font-style: italic; font-size: 0.9rem;
            margin-top: 14px; padding-top: 10px; border-top: 1px dashed #eee;
        }
        .klassen-hinweis {
            display: flex; align-items: flex-start; gap: 14px;
            background: #f8f4ff; border: 2px dashed #d4c7f0; border-radius: 15px;
            padding: 16px 18px; margin-top: 22px; font-size: 0.95rem; color: #5a4a7a;
            line-height: 1.55;
        }
        .klassen-hinweis-icon { font-size: 1.6rem; flex-shrink: 0; line-height: 1.2; }
        .klassen-hinweis strong { color: #3d2e5f; }

        /* --- ACTIVITY HUB (Tab-Navigation) --- */
        .activity-hub {
            margin-bottom: 40px;
            border: 2px solid #eee; border-radius: 18px;
            padding: 24px 22px 20px; background: #fff;
            box-shadow: 0 2px 8px rgba(0,0,0,0.03);
        }
        .activity-hub .section-title { margin-top: 0; margin-bottom: 18px; }
        .activity-tabs {
            display: flex; gap: 6px; padding: 6px;
            background: #fef5f0; border-radius: 16px;
            margin-bottom: 18px;
        }
        .activity-tab {
            flex: 1; min-height: 48px; padding: 12px 14px;
            display: inline-flex; align-items: center; justify-content: center; gap: 8px;
            background: transparent; border: none; border-radius: 12px;
            font-family: var(--font-heading); font-weight: 600; font-size: 1rem;
            color: var(--accent-coral); cursor: pointer;
            transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
            -webkit-tap-highlight-color: transparent;
        }
        .activity-tab:hover:not(.active) { background: rgba(214,113,113,0.08); }
        .activity-tab.active {
            background: var(--accent-coral); color: #fff;
            box-shadow: 0 3px 10px rgba(214,113,113,0.28);
        }
        .activity-tab .tab-icon { font-size: 1.25em; line-height: 1; }
        .activity-tab .tab-label { letter-spacing: 0.01em; }

        .activity-panel { display: none; }
        .activity-panel.active { display: block; animation: activityFadeIn 0.18s ease-out; }
        @keyframes activityFadeIn {
            from { opacity: 0; transform: translateY(4px); }
            to { opacity: 1; transform: translateY(0); }
        }

        @media (max-width: 767px) {
            .activity-hub { padding: 18px 16px 16px; }
            .activity-tab { padding: 10px 8px; font-size: 0.95rem; gap: 6px; }
            .activity-tab .tab-label { font-size: 0.95em; }
        }

        /* --- WORT-SCHATZSUCHE --- */
        .schatz-intro-card {
            background: linear-gradient(135deg, #fff9e5 0%, #fffdf2 100%);
            border: 2px solid var(--primary-yellow); border-radius: 18px;
            padding: 28px 24px; text-align: center;
        }
        .schatz-intro-emoji { font-size: 2.6rem; line-height: 1; margin-bottom: 10px; display: block; }
        .schatz-intro-title {
            font-family: var(--font-heading); font-weight: 600;
            color: var(--accent-coral); font-size: 1.35rem; margin: 0 0 6px 0;
        }
        .schatz-intro-thema {
            font-family: var(--font-heading); font-weight: 500;
            color: #8c6d2a; font-size: 1.05rem; margin: 0 0 16px 0; font-style: italic;
        }
        .schatz-intro-text {
            color: #555; font-size: 1rem; line-height: 1.55; margin: 0 auto 20px auto;
            max-width: 480px;
        }
        .schatz-progress {
            font-family: var(--font-heading); font-size: 1.15rem; color: #8c6d2a;
            margin-bottom: 18px;
        }
        .schatz-progress-number { font-size: 1.5rem; color: var(--accent-coral); font-weight: 700; }
        .schatz-start-btn {
            background: var(--accent-coral); color: #fff; border: none;
            padding: 14px 30px; border-radius: 28px; cursor: pointer;
            font-family: var(--font-heading); font-size: 1.05rem; font-weight: 600;
            box-shadow: 0 4px 14px rgba(214,113,113,0.35);
            transition: all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
            display: inline-flex; align-items: center; gap: 10px;
            -webkit-tap-highlight-color: transparent;
        }
        .schatz-start-btn:hover { background: #B85555; transform: translateY(-2px); box-shadow: 0 6px 18px rgba(214,113,113,0.45); }
        .schatz-start-btn:active { transform: translateY(0); }

        .schatz-complete { text-align: center; padding: 20px 10px; }
        .schatz-complete-emoji { font-size: 3rem; line-height: 1; display: block; margin-bottom: 10px; }
        .schatz-complete-title {
            font-family: var(--font-heading); color: var(--accent-coral);
            font-size: 1.5rem; margin: 0 0 8px 0;
        }
        .schatz-complete-text { color: #666; margin-bottom: 20px; }
        .schatz-found-list {
            display: flex; flex-wrap: wrap; justify-content: center; gap: 8px;
            margin: 0 0 20px 0; padding: 0;
        }
        .schatz-found-chip {
            background: #fff3b8; border: 2px solid #f1c40f; border-radius: 14px;
            padding: 6px 14px; font-family: var(--font-heading); font-weight: 600;
            color: #8c6d2a; font-size: 0.95rem;
        }

        @keyframes schatzPulse {
            0% { transform: scale(1); }
            40% { transform: scale(1.25); }
            100% { transform: scale(1.08); }
        }
        .word-schatz-treffer {
            background: linear-gradient(135deg, #fff3b8 0%, #ffe066 100%) !important;
            color: #7a5a00 !important; border-radius: 6px !important;
            box-shadow: 0 0 14px rgba(255,213,79,0.8), inset 0 0 6px rgba(255,255,255,0.5) !important;
            padding: 1px 4px; font-weight: bold;
            animation: schatzPulse 0.45s ease-out;
        }
        @keyframes gentleShakeSchatz {
            0% { transform: translateX(0); } 25% { transform: translateX(-5px); }
            50% { transform: translateX(5px); } 75% { transform: translateX(-5px); }
            100% { transform: translateX(0); }
        }
        .word-schatz-miss { animation: gentleShakeSchatz 0.4s ease-in-out; }

        .schatz-banner {
            position: fixed; top: 72px; left: 12px; right: 12px;
            z-index: 3000;
            display: flex; align-items: center; gap: 12px;
            background: linear-gradient(135deg, var(--accent-coral) 0%, #e88b8b 100%);
            color: #fff; padding: 12px 16px; border-radius: 16px;
            box-shadow: 0 6px 22px rgba(214,113,113,0.4);
            font-family: var(--font-heading);
            animation: schatzBannerIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        @keyframes schatzBannerIn {
            from { opacity: 0; transform: translateY(-10px); }
            to { opacity: 1; transform: translateY(0); }
        }
        .schatz-banner[hidden] { display: none; }
        .schatz-banner-icon { font-size: 1.4rem; line-height: 1; flex-shrink: 0; }
        .schatz-banner-text {
            flex-grow: 1; display: flex; align-items: baseline; gap: 10px;
            font-weight: 600; font-size: 0.98rem; flex-wrap: wrap;
        }
        .schatz-banner-count {
            background: rgba(255,255,255,0.25); padding: 2px 10px;
            border-radius: 10px; font-size: 0.95rem; font-weight: 700;
        }
        .schatz-banner-close {
            background: rgba(255,255,255,0.2); border: none; color: #fff;
            width: 32px; height: 32px; border-radius: 50%; cursor: pointer;
            font-size: 0.9rem; font-weight: 700; flex-shrink: 0;
            display: inline-flex; align-items: center; justify-content: center;
            transition: all 0.2s ease; -webkit-tap-highlight-color: transparent;
        }
        .schatz-banner-close:hover { background: rgba(255,255,255,0.35); transform: scale(1.08); }
        .schatz-banner.celebrate {
            background: linear-gradient(135deg, #f1c40f 0%, #ffd54f 100%);
            color: #5a4500;
        }
        .schatz-banner.celebrate .schatz-banner-count { background: rgba(255,255,255,0.4); color: #5a4500; }
        .schatz-banner.celebrate .schatz-banner-close { background: rgba(255,255,255,0.35); color: #5a4500; }
        @media (max-width: 767px) {
            .schatz-banner { top: 68px; left: 8px; right: 8px; padding: 10px 12px; gap: 8px; }
            .schatz-banner-text { font-size: 0.9rem; gap: 8px; }
        }
"""

# =============================================================================
# HTML: Activity-Hub (ersetzt die alte `<div class="quiz-section">`-Box)
# =============================================================================

ACTIVITY_HUB_HTML = """        <div class="activity-hub">
            <div class="section-title">🎮 Spielzeit!</div>
            <div class="activity-tabs" role="tablist" aria-label="Spielformate">
                <button class="activity-tab active" role="tab" aria-selected="true"
                        aria-controls="panel-quiz" id="tab-quiz" data-tab="quiz"
                        onclick="switchActivityTab('quiz')">
                    <span class="tab-icon">🧠</span><span class="tab-label">Quiz</span>
                </button>
                <button class="activity-tab" role="tab" aria-selected="false"
                        aria-controls="panel-weiterdenken" id="tab-weiterdenken" data-tab="weiterdenken"
                        onclick="switchActivityTab('weiterdenken')">
                    <span class="tab-icon">🌟</span><span class="tab-label">Weiterdenken</span>
                </button>
                <button class="activity-tab" role="tab" aria-selected="false"
                        aria-controls="panel-schatz" id="tab-schatz" data-tab="schatz"
                        onclick="switchActivityTab('schatz')">
                    <span class="tab-icon">🔍</span><span class="tab-label">Schatz</span>
                </button>
            </div>
            <div id="panel-quiz" class="activity-panel active" role="tabpanel" aria-labelledby="tab-quiz">
                <div id="quiz-wrapper" class="quiz-card"></div>
            </div>
            <div id="panel-weiterdenken" class="activity-panel" role="tabpanel" aria-labelledby="tab-weiterdenken">
                <p class="weitererzaehlen-intro">Hier gibt es kein richtig oder falsch — wähle, was dir am besten gefällt!</p>
                <div id="weitererzaehlen-wrapper" class="weitererzaehlen-cards"></div>
                <div class="klassen-hinweis">
                    <span class="klassen-hinweis-icon">👩‍🏫</span>
                    <div>
                        <strong>Tipp für die Klasse:</strong> Stimmt per Handzeichen ab — welche Fortsetzung findet ihr am schönsten? Danach könnt ihr die gewählte Fortsetzung gemeinsam selbst weiterschreiben.
                    </div>
                </div>
            </div>
            <div id="panel-schatz" class="activity-panel" role="tabpanel" aria-labelledby="tab-schatz"></div>
        </div>
"""

# =============================================================================
# HTML: Schatz-Banner (wird vor `<div class="main-card">` eingefuegt)
# =============================================================================

SCHATZ_BANNER_HTML = """    <div id="schatz-banner" class="schatz-banner" hidden>
        <span class="schatz-banner-icon">🔍</span>
        <span class="schatz-banner-text">
            <span id="schatz-banner-thema">Finde Schätze im Text</span>
            <span class="schatz-banner-count" id="schatz-banner-count">0/3</span>
        </span>
        <button type="button" class="schatz-banner-close" onclick="endSchatzsuche()" aria-label="Schatzsuche beenden">✕</button>
    </div>

"""

# =============================================================================
# JS-Funktionen (werden am Ende der bestehenden <script>-Logik eingefuegt)
# =============================================================================

JS_FUNCTIONS = r"""
        // --- ACTIVITY-HUB: Funktionen ---
        let schatzState = { active: false, found: [] };

        function renderWeitererzaehlen() {
            const data = (typeof weitererzaehlenData !== 'undefined') ? weitererzaehlenData : null;
            if (!data || !Array.isArray(data.optionen) || data.optionen.length === 0) {
                const tab = document.querySelector('[data-tab="weiterdenken"]');
                const panel = document.getElementById('panel-weiterdenken');
                if (tab) tab.style.display = 'none';
                if (panel) panel.style.display = 'none';
                return;
            }
            const introEl = document.querySelector('.weitererzaehlen-intro');
            if (data.frage && introEl) {
                introEl.innerHTML = data.frage + ' <span style="display:block; font-size:0.85em; margin-top:4px; opacity:0.75;">Hier gibt es kein richtig oder falsch.</span>';
            }
            let html = '';
            data.optionen.forEach((opt, i) => {
                html += `<div class="weitererzaehlen-card" onclick="toggleWeitererzaehlen(${i})" id="wet-card-${i}">
                            <div class="weitererzaehlen-card-header">
                                <span class="weitererzaehlen-emoji">${opt.emoji || '✨'}</span>
                                <span class="weitererzaehlen-titel">${opt.titel || ''}</span>
                                <span class="weitererzaehlen-chevron">▼</span>
                            </div>
                            <div class="weitererzaehlen-text">
                                <div class="weitererzaehlen-text-body">${opt.text || ''}</div>
                                <div class="weitererzaehlen-hinweis">So könnte es sein — oder ganz anders. Was denkst du?</div>
                            </div>
                        </div>`;
            });
            document.getElementById('weitererzaehlen-wrapper').innerHTML = html;
        }

        function toggleWeitererzaehlen(index) {
            const card = document.getElementById('wet-card-' + index);
            if (card) card.classList.toggle('open');
        }

        function renderSchatzsuche() {
            const data = (typeof schatzsucheData !== 'undefined') ? schatzsucheData : null;
            const panel = document.getElementById('panel-schatz');
            const tab = document.querySelector('[data-tab="schatz"]');
            if (!data || !Array.isArray(data.schatzwoerter) || data.schatzwoerter.length === 0 || !data.ziel) {
                if (tab) tab.style.display = 'none';
                if (panel) panel.style.display = 'none';
                return;
            }
            if (schatzState.found.length >= data.ziel) {
                renderSchatzComplete(panel, data);
            } else {
                renderSchatzIntro(panel, data);
            }
        }

        function renderSchatzIntro(panel, data) {
            const found = schatzState.found.length;
            const buttonLabel = found > 0 ? 'Weitersuchen' : 'Los geht’s!';
            panel.innerHTML = `
                <div class="schatz-intro-card">
                    <span class="schatz-intro-emoji">${data.emoji || '🔍'}</span>
                    <h3 class="schatz-intro-title">Schatz-Suche</h3>
                    <p class="schatz-intro-thema">„${data.thema}"</p>
                    <p class="schatz-intro-text">${data.einleitung || 'Finde versteckte Wörter im Text. Tippe sie einfach an!'}</p>
                    <div class="schatz-progress">Gefunden: <span class="schatz-progress-number">${found}</span> / ${data.ziel}</div>
                    <button type="button" class="schatz-start-btn" onclick="startSchatzsuche()">
                        <span>🔍</span><span>${buttonLabel}</span>
                    </button>
                </div>`;
        }

        function renderSchatzComplete(panel, data) {
            const chips = schatzState.found.map(w => {
                const pretty = w.charAt(0).toUpperCase() + w.slice(1);
                return `<li class="schatz-found-chip">${pretty}</li>`;
            }).join('');
            panel.innerHTML = `
                <div class="schatz-complete">
                    <span class="schatz-complete-emoji">🏆</span>
                    <h3 class="schatz-complete-title">Schatz gefunden!</h3>
                    <p class="schatz-complete-text">Du hast ${data.ziel} ${data.thema.toLowerCase()} entdeckt:</p>
                    <ul class="schatz-found-list">${chips}</ul>
                    <button type="button" class="schatz-start-btn" onclick="resetSchatzsuche()">
                        <span>🔄</span><span>Nochmal spielen</span>
                    </button>
                </div>`;
        }

        function startSchatzsuche() {
            if (typeof schatzsucheData === 'undefined') return;
            schatzState.active = true;
            showSchatzBanner();
            updateSchatzBanner();
            const chunkView = document.getElementById('chunk-view');
            const fullView = document.getElementById('full-text-view');
            const chunkVisible = chunkView && !chunkView.classList.contains('hidden');
            const target = chunkVisible ? chunkView : fullView;
            if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }

        function endSchatzsuche() {
            schatzState.active = false;
            hideSchatzBanner();
            renderSchatzsuche();
        }

        function resetSchatzsuche() {
            schatzState.found = [];
            document.querySelectorAll('.word-schatz-treffer').forEach(el => el.classList.remove('word-schatz-treffer'));
            startSchatzsuche();
            renderSchatzsuche();
        }

        function checkSchatzwort(el, word) {
            if (typeof schatzsucheData === 'undefined') return;
            const lw = (word || '').toLowerCase();
            const isSchatz = schatzsucheData.schatzwoerter.includes(lw);
            if (isSchatz && !schatzState.found.includes(lw)) {
                schatzState.found.push(lw);
                document.querySelectorAll('.word-interactive').forEach(w => {
                    const txt = (w.innerText || '').toLowerCase().replace(/[.,!?:;„"()-]/g, '');
                    if (txt === lw) w.classList.add('word-schatz-treffer');
                });
                try { if (typeof playTickSound === 'function') playTickSound(); } catch(e) {}
                updateSchatzBanner();
                if (schatzState.found.length >= schatzsucheData.ziel) {
                    showSchatzsucheComplete();
                }
            } else if (!isSchatz) {
                el.classList.add('word-schatz-miss');
                setTimeout(() => el.classList.remove('word-schatz-miss'), 500);
            }
        }

        function showSchatzBanner() {
            const banner = document.getElementById('schatz-banner');
            const thema = document.getElementById('schatz-banner-thema');
            if (banner) banner.hidden = false;
            if (thema && typeof schatzsucheData !== 'undefined' && schatzsucheData.thema) {
                thema.textContent = 'Finde ' + schatzsucheData.thema.toLowerCase();
            }
        }

        function hideSchatzBanner() {
            const banner = document.getElementById('schatz-banner');
            if (banner) { banner.hidden = true; banner.classList.remove('celebrate'); }
        }

        function updateSchatzBanner() {
            const count = document.getElementById('schatz-banner-count');
            if (count && typeof schatzsucheData !== 'undefined') {
                count.textContent = schatzState.found.length + '/' + schatzsucheData.ziel;
            }
        }

        function showSchatzsucheComplete() {
            schatzState.active = false;
            try { if (typeof showConfetti === 'function') showConfetti(); } catch(e) {}
            const banner = document.getElementById('schatz-banner');
            const thema = document.getElementById('schatz-banner-thema');
            if (banner) banner.classList.add('celebrate');
            if (thema) thema.textContent = 'Schatz gefunden! ✨';
            updateSchatzBanner();
            setTimeout(() => { hideSchatzBanner(); renderSchatzsuche(); }, 3500);
        }

        function switchActivityTab(tabName) {
            const tabs = document.querySelectorAll('.activity-tab');
            const panels = document.querySelectorAll('.activity-panel');
            tabs.forEach(t => {
                const isActive = t.dataset.tab === tabName;
                t.classList.toggle('active', isActive);
                t.setAttribute('aria-selected', isActive ? 'true' : 'false');
            });
            panels.forEach(p => {
                const isActive = p.id === 'panel-' + tabName;
                p.classList.toggle('active', isActive);
            });
            try { localStorage.setItem('lesekumpel-activity-tab', tabName); } catch(e) {}
        }

        function initActivityTabs() {
            const availableTabs = Array.from(document.querySelectorAll('.activity-tab'))
                .filter(t => t.style.display !== 'none')
                .map(t => t.dataset.tab);
            if (availableTabs.length === 0) {
                const hub = document.querySelector('.activity-hub');
                if (hub) hub.style.display = 'none';
                return;
            }
            if (availableTabs.length === 1) {
                const tabsBar = document.querySelector('.activity-tabs');
                if (tabsBar) tabsBar.style.display = 'none';
                switchActivityTab(availableTabs[0]);
                return;
            }
            let saved = null;
            try { saved = localStorage.getItem('lesekumpel-activity-tab'); } catch(e) {}
            const target = (saved && availableTabs.includes(saved)) ? saved
                         : (availableTabs.includes('quiz') ? 'quiz' : availableTabs[0]);
            switchActivityTab(target);
        }

        function revealQuizAnswer(btn) {
            const q = btn.closest('.quiz-question');
            if (!q) return;
            const correctIdx = parseInt(q.dataset.correct, 10);
            const options = q.querySelectorAll('.quiz-option');
            options.forEach((opt, j) => {
                if (j === correctIdx) {
                    if (!opt.classList.contains('correct')) {
                        opt.classList.remove('try-again');
                        opt.classList.add('correct');
                        opt.innerHTML += ' 💡';
                    }
                } else if (!opt.classList.contains('try-again')) {
                    opt.classList.add('try-again');
                }
            });
            btn.remove();
        }
"""

# =============================================================================
# Regex-Transformations
# =============================================================================

# CSS anker: Am ENDE des vorhandenen <style>-Blocks vor </style> einfuegen.
CSS_CLOSE_RE = re.compile(r"(\n\s*)(</style>)", re.MULTILINE)

# Alte quiz-section HTML-Box (3 Zeilen) entfernen und durch Activity-Hub ersetzen.
QUIZ_SECTION_RE = re.compile(
    r"        <div class=\"quiz-section\">\n"
    r"            <div class=\"section-title\">[^<]+</div>\n"
    r"            <div id=\"quiz-wrapper\" class=\"quiz-card\"></div>\n"
    r"        </div>\n"
)

# main-card insertion point fuer Schatz-Banner (direkt davor)
MAIN_CARD_RE = re.compile(r"^    <div class=\"main-card\">\n", re.MULTILINE)

# Altes renderQuiz() komplett ersetzen. Matches von "function renderQuiz() {" bis zur schließenden "}"
# Wir matchen das ganze Funktions-Block anhand seiner konkreten Struktur.
OLD_RENDER_QUIZ_RE = re.compile(
    r"        function renderQuiz\(\) \{\n"
    r"            let qHTML = \"\";\n"
    r"            quizData\.forEach\(\(item, i\) => \{\n"
    r"                qHTML \+= `<div style=\"margin-bottom:30px; border-bottom:1px dashed #eee; padding-bottom:20px;\">\n"
    r"                            <div style=\"font-weight:bold; margin-bottom:15px; color:var\(--accent-teal\);\">\$\{i\+1\}\. \$\{item\.q\}</div>`;\n"
    r"                item\.a\.forEach\(\(ans, j\) => \{\n"
    r"                    const isCorrect = \(j === item\.correct\);\n"
    r"                    qHTML \+= `<div class=\"quiz-option\" onclick=\"checkQuizAnswer\(this, \$\{isCorrect\}\)\"><span>\$\{ans\}</span></div>`;\n"
    r"                \}\);\n"
    r"                qHTML \+= `</div>`;\n"
    r"            \}\);\n"
    r"            const quizWrapper = document\.getElementById\('quiz-wrapper'\);\n"
    r"            const quizSection = document\.querySelector\('\.quiz-section'\);\n"
    r"            if\(quizData\.length > 0\) \{ quizWrapper\.innerHTML = qHTML; quizSection\.style\.display = 'block'; \}\n"
    r"            else \{ quizSection\.style\.display = 'none'; \}\n"
    r"        \}\n"
)

NEW_RENDER_QUIZ = r"""        function renderQuiz() {
            let qHTML = "";
            quizData.forEach((item, i) => {
                qHTML += `<div class="quiz-question" data-correct="${item.correct}" style="margin-bottom:30px; border-bottom:1px dashed #eee; padding-bottom:20px;">
                            <div style="font-weight:bold; margin-bottom:15px; color:var(--accent-teal);">${i+1}. ${item.q}</div>`;
                item.a.forEach((ans, j) => {
                    const isCorrect = (j === item.correct);
                    qHTML += `<div class="quiz-option" onclick="checkQuizAnswer(this, ${isCorrect})"><span>${ans}</span></div>`;
                });
                qHTML += `<button type="button" class="quiz-reveal-btn" onclick="revealQuizAnswer(this)">💡 Auflösen</button>`;
                qHTML += `</div>`;
            });
            const quizWrapper = document.getElementById('quiz-wrapper');
            const tab = document.querySelector('[data-tab="quiz"]');
            const panel = document.getElementById('panel-quiz');
            if (quizData.length > 0) {
                quizWrapper.innerHTML = qHTML;
            } else {
                if (tab) tab.style.display = 'none';
                if (panel) panel.style.display = 'none';
            }
        }
"""

# clickWord-Erweiterung: Schatzsuche-Check ganz am Anfang.
OLD_CLICK_WORD_OPEN_RE = re.compile(
    r"        function clickWord\(el, word\) \{\n"
    r"            // Vokabel-Tooltip"
)

NEW_CLICK_WORD_OPEN = (
    "        function clickWord(el, word) {\n"
    "            // Schatzsuche-Modus hat Vorrang: blockiert Dictionary/TTS waehrend aktiv\n"
    "            if (schatzState.active) { checkSchatzwort(el, word); return; }\n"
    "            // Vokabel-Tooltip"
)

# window.onload — alter Aufruf `renderText(); renderQuiz();` zu `renderText(); renderQuiz(); renderWeitererzaehlen(); renderSchatzsuche(); initActivityTabs();`
OLD_ONLOAD_RE = re.compile(r"(\n\s*)renderText\(\); renderQuiz\(\);(?!\s*renderWeitererzaehlen)")
NEW_ONLOAD = r"\1renderText(); renderQuiz(); renderWeitererzaehlen(); renderSchatzsuche(); initActivityTabs();"

# Schliessende </script> als Einfuege-Anker fuer JS-Funktionen
SCRIPT_CLOSE_RE = re.compile(r"(\n\s*)(</script>)", re.MULTILINE)

# Anker fuer die Daten-Konstanten: nach `const quizData = [...];`-Zeile
QUIZ_DATA_LINE_RE = re.compile(r"^(\s*const quizData = \[.*?\];)\s*\n", re.MULTILINE)


def render_data_constants(activity: dict) -> str:
    """Baut die beiden JS-Konstanten aus dem Activity-Data-JSON."""
    weiter = json.dumps(activity.get("weitererzaehlen", {}), ensure_ascii=False, indent=0).replace("\n", " ")
    schatz = json.dumps(activity.get("schatzsuche", {}), ensure_ascii=False, indent=0).replace("\n", " ")
    return (
        f"        const weitererzaehlenData = {weiter};\n"
        f"        const schatzsucheData = {schatz};\n"
    )


def rewrite(html: str, activity: dict) -> tuple[str, list[str]]:
    """Return (new_html, changes)."""
    changes: list[str] = []

    if 'class="activity-hub"' in html:
        return html, ["SKIP: already has .activity-hub"]

    # 1) CSS einfuegen (vor </style>)
    new_html, n = CSS_CLOSE_RE.subn(r"\1" + CSS_BLOCK + r"\1\2", html, count=1)
    if n == 0:
        return html, ["SKIP: </style> not found"]
    changes.append("css")

    # 2) Alte quiz-section durch Activity-Hub HTML ersetzen
    new_html, n = QUIZ_SECTION_RE.subn(ACTIVITY_HUB_HTML, new_html, count=1)
    if n == 0:
        return html, ["SKIP: old quiz-section HTML not found"]
    changes.append("html-hub")

    # 3) Schatz-Banner vor der main-card einfuegen
    new_html, n = MAIN_CARD_RE.subn(SCHATZ_BANNER_HTML + '    <div class="main-card">\n', new_html, count=1)
    if n == 0:
        return html, ["SKIP: <div class=\"main-card\"> not found"]
    changes.append("html-banner")

    # 4) Daten-Konstanten nach quizData-Zeile einfuegen
    data_consts = render_data_constants(activity)
    new_html, n = QUIZ_DATA_LINE_RE.subn(r"\1\n" + data_consts, new_html, count=1)
    if n == 0:
        return html, ["SKIP: `const quizData = [...]` line not found"]
    changes.append("js-data")

    # 5) renderQuiz() ersetzen
    new_html, n = OLD_RENDER_QUIZ_RE.subn(NEW_RENDER_QUIZ, new_html, count=1)
    if n == 0:
        return html, ["SKIP: old renderQuiz() not matched"]
    changes.append("js-renderQuiz")

    # 6) clickWord() um Schatz-Check erweitern
    new_html, n = OLD_CLICK_WORD_OPEN_RE.subn(NEW_CLICK_WORD_OPEN, new_html, count=1)
    if n == 0:
        return html, ["SKIP: old clickWord() opener not matched"]
    changes.append("js-clickWord")

    # 7) window.onload-Aufruf erweitern
    new_html, n = OLD_ONLOAD_RE.subn(NEW_ONLOAD, new_html, count=1)
    if n == 0:
        return html, ["SKIP: `renderText(); renderQuiz();` in onload not found"]
    changes.append("js-onload")

    # 8) Neue JS-Funktionen vor </script> einhaengen
    new_html, n = SCRIPT_CLOSE_RE.subn(r"\1" + JS_FUNCTIONS + r"\1\2", new_html, count=1)
    if n == 0:
        return html, ["SKIP: </script> not found"]
    changes.append("js-functions")

    return new_html, changes


def load_activity(slug: str) -> dict | None:
    path = DATA_DIR / f"{slug}.json"
    if not path.is_file():
        return None
    return json.loads(path.read_text(encoding="utf-8"))


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--dry-run", action="store_true", help="show what would change, do not write")
    ap.add_argument("--apply", action="store_true", help="write changes to disk")
    ap.add_argument("--file", type=str, default=None, help="limit to a single file (relative path)")
    args = ap.parse_args()

    if not (args.dry_run or args.apply):
        ap.error("pass --dry-run or --apply")

    targets = [args.file] if args.file else TARGETS

    stats = {"applied": 0, "skipped": 0, "errors": 0}
    for rel in targets:
        path = REPO_ROOT / rel
        if not path.is_file():
            print(f"ERR   {rel}: file not found")
            stats["errors"] += 1
            continue
        slug = path.stem
        activity = load_activity(slug)
        if activity is None:
            print(f"ERR   {rel}: no activity-data/{slug}.json")
            stats["errors"] += 1
            continue

        original = path.read_text(encoding="utf-8")
        new, changes = rewrite(original, activity)

        if new == original:
            print(f"skip  {rel}: {changes[0] if changes else 'no change'}")
            stats["skipped"] += 1
            continue

        if args.apply:
            path.write_text(new, encoding="utf-8")
            print(f"OK    {rel}: {'+'.join(changes)}")
        else:
            print(f"DRY   {rel}: {'+'.join(changes)}")
        stats["applied"] += 1

    print()
    print(f"done. applied={stats['applied']} skipped={stats['skipped']} errors={stats['errors']}")
    return 0 if stats["errors"] == 0 else 2


if __name__ == "__main__":
    sys.exit(main())
