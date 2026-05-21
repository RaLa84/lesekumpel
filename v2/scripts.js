/* ============================================================
   Lesekumpel v2 — gemeinsame Skripte (Sandbox)
   Navbar/Footer sind inline in jeder HTML-Datei — kein Partial-Loader nötig.
   ============================================================ */

/* ===== Mobile Menu Toggle ===== */
function toggleMenu() {
  const menu = document.getElementById('mobile-menu');
  const btn = document.querySelector('.burger');
  if (!menu || !btn) return;
  menu.classList.toggle('open');
  const isOpen = menu.classList.contains('open');
  btn.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
}

/* ===== Coming-Soon-Hinweis (für "Geschichte erstellen") ===== */
function comingSoon(ev) {
  if (ev) ev.preventDefault();
  alert('Diese Funktion kommt bald — komm später wieder vorbei. 🚀');
}

/* ===== Aktiver Navi-Link markieren ===== */
function markActiveNav() {
  const current = document.body.getAttribute('data-page');
  if (!current) return;
  const link = document.querySelector('.navbar-links [data-nav="' + current + '"]');
  if (link) link.classList.add('active');
}

/* ===== Scroll-Reveal Observer ===== */
function initScrollReveal() {
  document.body.classList.add('js-on');
  const els = document.querySelectorAll('.reveal, .reveal-stagger');
  if (!('IntersectionObserver' in window)) {
    els.forEach(el => el.classList.add('visible'));
    return;
  }
  const io = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
  els.forEach(el => io.observe(el));

  // Safety: nach 2s alle übrigen sicherheitshalber visible (deckt fullPage-Screenshots etc.)
  setTimeout(() => {
    document.querySelectorAll('.reveal:not(.visible), .reveal-stagger:not(.visible)').forEach(el => {
      el.classList.add('visible');
    });
  }, 2000);
}

/* ===== Sticky-Bottom-CTA (Mobile) — zeigt sich nach 600px Scroll ===== */
function initStickyCta() {
  const cta = document.querySelector('.sticky-cta');
  if (!cta) return;
  let last = 0;
  window.addEventListener('scroll', () => {
    const y = window.scrollY;
    if (y > 600 && y > last - 5) {
      cta.classList.add('visible');
    } else if (y < 400) {
      cta.classList.remove('visible');
    }
    last = y;
  }, { passive: true });
}

/* ===== Init ===== */
document.addEventListener('DOMContentLoaded', function () {
  markActiveNav();
  initScrollReveal();
  initStickyCta();
});
