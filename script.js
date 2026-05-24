/**
 * StellarBridge — script.js
 * Lightweight vanilla JS: no frameworks, no dependencies.
 * Handles: loader, navigation, scroll reveals, particle canvas, counters.
 *
 * Security notes:
 * - No innerHTML used with user-controlled input.
 * - All DOM manipulation uses safe APIs (textContent, classList, setAttribute).
 * - Event listeners attached programmatically, not inline.
 */

/* =============================================
   1. LOADER — cinematic intro sequence
   ============================================= */
(function initLoader() {
  'use strict';

  const loader = document.getElementById('loader');
  const canvas = document.getElementById('particle-canvas');
  const body   = document.body;

  if (!loader || !canvas) return;

  // Prevent scroll while loading
  body.classList.add('loading');

  // ── Particle canvas ──────────────────────────
  const ctx = canvas.getContext('2d');
  let raf, particles = [];

  function resizeCanvas() {
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
  }

  /** Create a single particle */
  function createParticle() {
    return {
      x:     Math.random() * canvas.width,
      y:     Math.random() * canvas.height,
      r:     Math.random() * 1.5 + 0.3,
      dx:    (Math.random() - 0.5) * 0.4,
      dy:    (Math.random() - 0.5) * 0.4,
      alpha: Math.random() * 0.6 + 0.1,
      hue:   Math.random() > 0.6 ? 190 : 200,   // cyan / blue spectrum
    };
  }

  function initParticles(count) {
    particles = [];
    for (let i = 0; i < count; i++) {
      particles.push(createParticle());
    }
  }

  function drawParticles() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    particles.forEach(p => {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = `hsla(${p.hue}, 80%, 70%, ${p.alpha})`;
      ctx.fill();

      // Move
      p.x += p.dx;
      p.y += p.dy;
      p.alpha += (Math.random() - 0.5) * 0.02;
      p.alpha  = Math.max(0.05, Math.min(0.8, p.alpha));

      // Wrap around edges
      if (p.x < 0) p.x = canvas.width;
      if (p.x > canvas.width) p.x = 0;
      if (p.y < 0) p.y = canvas.height;
      if (p.y > canvas.height) p.y = 0;
    });
    raf = requestAnimationFrame(drawParticles);
  }

  resizeCanvas();
  initParticles(120);
  drawParticles();

  window.addEventListener('resize', () => {
    resizeCanvas();
    initParticles(120);
  }, { passive: true });

  // ── Hide loader after delay ───────────────────
  // 2.8 seconds: long enough for animation, short enough to not frustrate.
  const LOADER_DURATION = 2800;

  setTimeout(() => {
    loader.classList.add('hidden');
    body.classList.remove('loading');

    // Cancel particle animation after transition completes
    setTimeout(() => {
      cancelAnimationFrame(raf);
      loader.style.display = 'none';
    }, 800);
  }, LOADER_DURATION);
})();


/* =============================================
   2. NAVIGATION — scroll behaviour + mobile drawer
   ============================================= */
(function initNav() {
  'use strict';

  const header     = document.getElementById('site-header');
  const hamburger  = document.getElementById('nav-hamburger');
  const mobileMenu = document.getElementById('mobile-menu');
  const mobileLinks = mobileMenu ? mobileMenu.querySelectorAll('a') : [];

  // ── Scrolled class ────────────────────────────
  function onScroll() {
    if (!header) return;
    if (window.scrollY > 30) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll(); // run on load

  // ── Mobile menu toggle ────────────────────────
  function openMenu() {
    hamburger.classList.add('open');
    mobileMenu.classList.add('open');
    hamburger.setAttribute('aria-expanded', 'true');
    mobileMenu.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }

  function closeMenu() {
    hamburger.classList.remove('open');
    mobileMenu.classList.remove('open');
    hamburger.setAttribute('aria-expanded', 'false');
    mobileMenu.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  if (hamburger && mobileMenu) {
    hamburger.addEventListener('click', () => {
      const isOpen = hamburger.classList.contains('open');
      isOpen ? closeMenu() : openMenu();
    });

    // Close drawer on link click
    mobileLinks.forEach(link => {
      link.addEventListener('click', closeMenu);
    });

    // Close on outside click
    document.addEventListener('click', e => {
      if (
        mobileMenu.classList.contains('open') &&
        !mobileMenu.contains(e.target) &&
        !hamburger.contains(e.target)
      ) {
        closeMenu();
      }
    });

    // Close on Escape
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && mobileMenu.classList.contains('open')) {
        closeMenu();
        hamburger.focus();
      }
    });
  }

  // ── Smooth scroll for anchor links ────────────
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      const target = document.querySelector(this.getAttribute('href'));
      if (target) {
        e.preventDefault();
        const offset = (header ? header.offsetHeight : 72) + 8;
        const top = target.getBoundingClientRect().top + window.scrollY - offset;
        window.scrollTo({ top, behavior: 'smooth' });
      }
    });
  });
})();


/* =============================================
   3. SCROLL REVEAL — Intersection Observer
   ============================================= */
(function initReveal() {
  'use strict';

  // Respect reduced-motion preference
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const revealEls = document.querySelectorAll('.reveal');

  if (prefersReduced) {
    // Skip animation, show everything immediately
    revealEls.forEach(el => el.classList.add('is-visible'));
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target); // once only
      }
    });
  }, {
    threshold: 0.12,
    rootMargin: '0px 0px -40px 0px',
  });

  revealEls.forEach(el => observer.observe(el));
})();


/* =============================================
   4. HERO COUNTERS — animated number counting
   ============================================= */
(function initCounters() {
  'use strict';

  const statNums = document.querySelectorAll('.stat-num[data-target]');
  if (!statNums.length) return;

  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /**
   * Animates a number from 0 to target.
   * @param {HTMLElement} el
   * @param {number} target
   * @param {string} suffix
   * @param {number} duration ms
   */
  function animateCounter(el, target, suffix, duration) {
    const start    = performance.now();
    const isFloat  = !Number.isInteger(target);
    const prefix   = target === 5 ? '<' : '';   // special: "<5s"

    function step(now) {
      const elapsed  = now - start;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const eased    = 1 - Math.pow(1 - progress, 3);
      const current  = target * eased;

      let display;
      if (target >= 100) {
        display = Math.floor(current).toLocaleString();
      } else if (isFloat) {
        display = current.toFixed(1);
      } else {
        display = Math.floor(current).toString();
      }

      // Use textContent — safe, no XSS risk
      el.textContent = prefix + '$' === prefix + '$'
        ? display + suffix
        : prefix + display + suffix;

      // Handle $ prefix for volume
      if (el.dataset.prefix === '$') {
        el.textContent = '$' + display + suffix;
      } else {
        el.textContent = prefix + display + suffix;
      }

      if (progress < 1) requestAnimationFrame(step);
    }

    requestAnimationFrame(step);
  }

  // Set $ prefix for volume counter
  const volumeEl = document.querySelector('[data-target="2.4"]');
  if (volumeEl) volumeEl.dataset.prefix = '$';

  if (prefersReduced) {
    // Set final values immediately
    statNums.forEach(el => {
      const target = parseFloat(el.dataset.target);
      const suffix = el.dataset.suffix || '';
      el.textContent = (el.dataset.prefix === '$' ? '$' : '') + target + suffix;
    });
    return;
  }

  // Use IntersectionObserver to start counting when in view
  const counterObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const el     = entry.target;
        const target = parseFloat(el.dataset.target);
        const suffix = el.dataset.suffix || '';
        animateCounter(el, target, suffix, 1800);
        counterObserver.unobserve(el);
      }
    });
  }, { threshold: 0.5 });

  statNums.forEach(el => counterObserver.observe(el));
})();


/* =============================================
   5. FOOTER YEAR — dynamic copyright year
   ============================================= */
(function setFooterYear() {
  'use strict';
  const el = document.getElementById('footer-year');
  if (el) {
    // textContent is safe — no XSS risk with a date integer
    el.textContent = new Date().getFullYear().toString();
  }
})();


/* =============================================
   6. ACTIVE NAV LINK — highlight on scroll
   ============================================= */
(function initActiveNav() {
  'use strict';

  const sections = document.querySelectorAll('section[id]');
  const navLinks = document.querySelectorAll('.nav-links a[href^="#"]');

  if (!sections.length || !navLinks.length) return;

  function setActive() {
    let current = '';
    sections.forEach(section => {
      const top = section.offsetTop - 100;
      if (window.scrollY >= top) {
        current = section.getAttribute('id');
      }
    });

    navLinks.forEach(link => {
      link.removeAttribute('aria-current');
      if (link.getAttribute('href') === '#' + current) {
        link.setAttribute('aria-current', 'page');
      }
    });
  }

  window.addEventListener('scroll', setActive, { passive: true });
  setActive();
})();


/* =============================================
   7. FEATURE CARD TILT — subtle mouse parallax
   ============================================= */
(function initTilt() {
  'use strict';

  // Only on non-touch, non-reduced-motion devices
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isTouch = window.matchMedia('(pointer: coarse)').matches;
  if (prefersReduced || isTouch) return;

  const cards = document.querySelectorAll('.feature-card, .about-card, .eco-stat');

  cards.forEach(card => {
    card.addEventListener('mousemove', e => {
      const rect   = card.getBoundingClientRect();
      const x      = e.clientX - rect.left;
      const y      = e.clientY - rect.top;
      const cx     = rect.width  / 2;
      const cy     = rect.height / 2;
      const rotX   = ((y - cy) / cy) * -4;  // max ±4deg
      const rotY   = ((x - cx) / cx) *  4;

      card.style.transform = `perspective(600px) rotateX(${rotX}deg) rotateY(${rotY}deg) translateY(-4px)`;
    });

    card.addEventListener('mouseleave', () => {
      card.style.transform = '';
    });
  });
})();
