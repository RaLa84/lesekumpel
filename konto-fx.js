/* ============================================================
   Lesekumpel · konto-fx.js
   Geteilte „Delight"-Schicht für den Mein-Konto-Bereich:
   - Entrance-Reveals beim Scrollen (IntersectionObserver)
   - Konfetti & Sparkle-Burst an Übergängen (Belohnung)
   - Maskottchen-Sprechblasen
   Respektiert prefers-reduced-motion. Kein Audio, keine Abhängigkeiten.
   Exponiert window.KontoFX.
   ============================================================ */
(function () {
  'use strict';

  function reduced() {
    try {
      if (window.FormKit && typeof FormKit.reducedMotion === 'function') return FormKit.reducedMotion();
      return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    } catch (e) { return false; }
  }

  /* ---------- ENTRANCE / REVEAL ---------- */
  function revealOnScroll() {
    var els = document.querySelectorAll('.reveal, .reveal-stagger');
    if (!els.length) return;
    if (reduced() || !('IntersectionObserver' in window)) {
      Array.prototype.forEach.call(els, function (e) { e.classList.add('visible'); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('visible'); io.unobserve(en.target); }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    Array.prototype.forEach.call(els, function (e) { io.observe(e); });
  }

  /* ---------- KONFETTI ---------- */
  function confetti(origin, opts) {
    if (reduced()) return;
    opts = opts || {};
    var colors = opts.colors || ['#2FB8A6', '#F97352', '#7D6AE6', '#FFD95A'];
    var n = opts.count || 90;
    var cx, cy, rect;
    if (origin && origin.getBoundingClientRect) {
      rect = origin.getBoundingClientRect();
      cx = rect.left + rect.width / 2; cy = rect.top + rect.height / 2;
    } else { cx = window.innerWidth / 2; cy = window.innerHeight * 0.35; }

    for (var i = 0; i < n; i++) {
      var p = document.createElement('div');
      p.className = 'confetti-piece';
      var size = 7 + Math.random() * 8;
      p.style.width = size + 'px';
      p.style.height = (size * 1.3) + 'px';
      p.style.background = colors[(Math.random() * colors.length) | 0];
      p.style.left = cx + 'px';
      p.style.top = cy + 'px';
      if (Math.random() < 0.3) p.style.borderRadius = '50%';
      document.body.appendChild(p);

      var ang = Math.random() * Math.PI * 2;
      var power = 80 + Math.random() * 170;
      var dx = Math.cos(ang) * power;
      var upY = -(Math.abs(Math.sin(ang)) * power + 60 + Math.random() * 120);
      var fallY = (window.innerHeight - cy) + 140;
      var rot = (Math.random() * 720 - 360);
      var dur = 1500 + Math.random() * 1100;

      var anim = p.animate([
        { transform: 'translate(0,0) rotate(0deg)', opacity: 1 },
        { transform: 'translate(' + (dx * 0.6) + 'px,' + upY + 'px) rotate(' + (rot * 0.4) + 'deg)', opacity: 1, offset: 0.3 },
        { transform: 'translate(' + dx + 'px,' + fallY + 'px) rotate(' + rot + 'deg)', opacity: 0.85 }
      ], { duration: dur, easing: 'cubic-bezier(.2,.7,.4,1)' });
      (function (el) {
        anim.onfinish = function () { el.remove(); };
        anim.oncancel = function () { el.remove(); };
      })(p);
    }
  }

  /* ---------- SPARKLE-BURST ---------- */
  function sparkleBurst(origin) {
    if (reduced()) return;
    var rect = (origin && origin.getBoundingClientRect)
      ? origin.getBoundingClientRect()
      : { left: window.innerWidth / 2, top: window.innerHeight / 2, width: 0, height: 0 };
    var cx = rect.left + rect.width / 2, cy = rect.top + rect.height / 2;
    var pts = [[-40, -30], [46, -20], [0, -58], [30, 32], [-34, 26]];
    pts.forEach(function (d, i) {
      var s = document.createElement('div');
      s.className = 'sparkle-burst';
      s.textContent = '✦';
      s.style.left = (cx + d[0]) + 'px';
      s.style.top = (cy + d[1]) + 'px';
      s.style.fontSize = (14 + Math.random() * 12) + 'px';
      s.style.animationDelay = (i * 60) + 'ms';
      document.body.appendChild(s);
      setTimeout(function () { s.remove(); }, 950 + i * 60);
    });
  }

  /* ---------- TOAST (markenkonformes Feedback) ---------- */
  function toast(msg, opts) {
    opts = opts || {};
    var t = document.createElement('div');
    t.className = 'lk-toast';
    t.textContent = msg;
    t.setAttribute('role', 'status');
    document.body.appendChild(t);
    // sanftes Einblenden (außer reduced-motion)
    if (!reduced()) {
      t.style.opacity = '0';
      t.style.transform = 'translateX(-50%) translateY(10px)';
      requestAnimationFrame(function () {
        t.style.transition = 'opacity .25s, transform .25s cubic-bezier(0.34,1.56,0.64,1)';
        t.style.opacity = '1';
        t.style.transform = 'translateX(-50%) translateY(0)';
      });
    }
    if (opts.speak && window.FormKit) FormKit.speak(msg);
    var dur = opts.duration || 2800;
    setTimeout(function () {
      if (!reduced()) { t.style.transition = 'opacity .3s'; t.style.opacity = '0'; setTimeout(function () { t.remove(); }, 320); }
      else t.remove();
    }, dur);
    return t;
  }

  /* ---------- MASKOTTCHEN-SPRECHBLASE ---------- */
  function mascotBubble(el, text, opts) {
    if (!el) return;
    opts = opts || {};
    if (typeof text === 'string') el.textContent = text;
    setTimeout(function () { el.classList.add('show'); }, opts.delay != null ? opts.delay : 350);
    if (opts.hideAfter) setTimeout(function () { el.classList.remove('show'); }, opts.hideAfter);
  }

  /* ---------- FOKUS-FALLE (Modals) ---------- */
  function focusables(container) {
    var sel = 'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';
    return Array.prototype.slice.call(container.querySelectorAll(sel))
      .filter(function (el) { return el.offsetWidth > 0 || el.offsetHeight > 0 || el === document.activeElement; });
  }
  // Fängt Tab/Shift+Tab im Container, Escape ruft opts.onEscape, lockt Body-Scroll.
  // Liefert release(restoreFocus=true) zurück.
  function trapFocus(container, opts) {
    opts = opts || {};
    var prev = document.activeElement;
    var prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    var initial = (opts.initial && container.querySelector(opts.initial)) || focusables(container)[0];
    if (initial) { try { initial.focus(); } catch (e) {} }
    function onKey(e) {
      if (e.key === 'Escape' && opts.onEscape) { e.preventDefault(); opts.onEscape(); return; }
      if (e.key !== 'Tab') return;
      var f = focusables(container);
      if (!f.length) return;
      var first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
    container.addEventListener('keydown', onKey);
    return function release(restore) {
      container.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
      if (restore !== false && prev && prev.focus) { try { prev.focus(); } catch (e) {} }
    };
  }

  /* ---------- AUTO-INIT ---------- */
  function init() { revealOnScroll(); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();

  window.KontoFX = {
    reduced: reduced,
    revealOnScroll: revealOnScroll,
    confetti: confetti,
    sparkleBurst: sparkleBurst,
    mascotBubble: mascotBubble,
    toast: toast,
    trapFocus: trapFocus,
    focusables: focusables
  };
})();
