/* =========================================================================
   Ellis Victoria — Case Study shared motion script (v2)
   Magnetic dot-grid canvas whose glow shifts as you scroll · Lenis · GSAP
   ========================================================================= */
(function () {
  'use strict';
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isFinePointer = window.matchMedia('(pointer: fine)').matches;

  /* ── SCROLL-REACTIVE MAGNETIC DOT-GRID CANVAS ───────────────── */
  const canvas = document.getElementById('bg-canvas');
  const ctx = canvas ? canvas.getContext('2d') : null;
  let w, h, dpr, time = 0;
  const mouse = { x: -9999, y: -9999, ex: -9999, ey: -9999 };

  const SPACING = 40;    // px between dots
  const RADIUS = 220;    // cursor influence radius
  const PULL = 0.34;     // bend strength toward the cursor

  // Palette stops the background travels through as you scroll (0 → 1)
  const palette = [
    { r: 0,   g: 255, b: 179 },  // cyan
    { r: 36,  g: 64,  b: 238 },  // blue
    { r: 140, g: 80,  b: 240 },  // violet
    { r: 0,   g: 200, b: 255 },  // sky
    { r: 0,   g: 255, b: 179 }   // back to cyan
  ];
  let scrollProgress = 0;

  function lerp(a, b, t) { return a + (b - a) * t; }
  function paletteColor(p) {
    const seg = p * (palette.length - 1);
    const i = Math.min(Math.floor(seg), palette.length - 2);
    const t = seg - i;
    return {
      r: lerp(palette[i].r, palette[i + 1].r, t),
      g: lerp(palette[i].g, palette[i + 1].g, t),
      b: lerp(palette[i].b, palette[i + 1].b, t)
    };
  }

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = window.innerWidth; h = window.innerHeight;
    canvas.width = w * dpr; canvas.height = h * dpr;
    canvas.style.width = w + 'px'; canvas.style.height = h + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function paint() {
    ctx.clearRect(0, 0, w, h);
    mouse.ex += (mouse.x - mouse.ex) * 0.12;
    mouse.ey += (mouse.y - mouse.ey) * 0.12;

    const base = paletteColor(scrollProgress); // glow hue shifts as you scroll
    const light = document.documentElement.getAttribute('data-theme') === 'light';
    const bg0 = light ? 40 : 120, bg1 = light ? 40 : 120, bg2 = light ? 38 : 115;
    const baseAlpha = light ? 0.08 : 0.12, glowAlpha = light ? 0.5 : 0.7;
    const cols = Math.ceil(w / SPACING) + 1;
    const rows = Math.ceil(h / SPACING) + 1;

    for (let iy = 0; iy < rows; iy++) {
      for (let ix = 0; ix < cols; ix++) {
        const gx = ix * SPACING, gy = iy * SPACING;
        const wave = Math.sin(gx * 0.012 + time) + Math.cos(gy * 0.012 + time * 0.8);
        const waveN = (wave + 2) / 4;

        let px = gx, py = gy, glow = 0;
        const dx = mouse.ex - gx, dy = mouse.ey - gy;
        const dist = Math.hypot(dx, dy);
        if (dist < RADIUS) {
          const f = 1 - dist / RADIUS;
          const ease = f * f;
          px += dx * PULL * ease;
          py += dy * PULL * ease;
          glow = ease;
        }

        const intensity = Math.min(1, glow * 1.1 + waveN * 0.25);
        const size = 1 + glow * 2.4 + waveN * 0.6;
        const r = Math.round(bg0 + (base.r - bg0) * intensity);
        const g = Math.round(bg1 + (base.g - bg1) * intensity);
        const b = Math.round(bg2 + (base.b - bg2) * intensity);
        const alpha = baseAlpha + intensity * glowAlpha;

        ctx.fillStyle = `rgba(${r},${g},${b},${alpha})`;
        ctx.beginPath();
        ctx.arc(px, py, size, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  function tick() {
    time += 0.012;
    paint();
    requestAnimationFrame(tick);
  }

  if (canvas && !prefersReduced) {
    resize(); tick();
    window.addEventListener('resize', resize);
    if (isFinePointer) {
      window.addEventListener('mousemove', (e) => { mouse.x = e.clientX; mouse.y = e.clientY; });
      window.addEventListener('mouseout', () => { mouse.x = -9999; mouse.y = -9999; });
    }
  } else if (canvas) {
    resize(); paint();
    window.addEventListener('resize', () => { resize(); paint(); });
  }

  /* ── SMOOTH SCROLL ───────────────────────────────────────────────── */
  const lenis = new Lenis({ lerp: 0.08, smoothWheel: true });
  function raf(t) { lenis.raf(t); requestAnimationFrame(raf); }
  requestAnimationFrame(raf);
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((t) => lenis.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);

  // Drive scrollProgress + progress bar from scroll position
  const progressBar = document.querySelector('.progress-bar');
  const nav = document.querySelector('.nav');
  lenis.on('scroll', ({ scroll, limit }) => {
    const p = limit > 0 ? scroll / limit : 0;
    scrollProgress = p;
    if (progressBar) progressBar.style.transform = `scaleX(${p})`;
    if (nav) nav.classList.toggle('scrolled', scroll > 60);
  });

  /* ── LOADER ──────────────────────────────────────────────────────── */
  const loader = document.querySelector('.loader');
  if (prefersReduced) {
    if (loader) loader.style.display = 'none';
    revealHero();
  } else if (loader) {
    gsap.to(loader, {
      yPercent: -100, duration: 0.9, delay: 0.4, ease: 'power3.inOut',
      onComplete: () => { loader.style.display = 'none'; revealHero(); }
    });
  } else {
    revealHero();
  }

  function revealHero() {
    if (prefersReduced) return;
    gsap.to('.cs-title-line span', { y: 0, duration: 1.2, stagger: 0.12, ease: 'power4.out' });
  }

  /* ── FADE UP ─────────────────────────────────────────────────────── */
  if (!prefersReduced) {
    gsap.utils.toArray('.fade-up').forEach(el => {
      gsap.to(el, {
        opacity: 1, y: 0, duration: 1, ease: 'power2.out',
        scrollTrigger: { trigger: el, start: 'top 85%', once: true }
      });
    });
  } else {
    document.querySelectorAll('.fade-up').forEach(el => { el.style.opacity = 1; el.style.transform = 'none'; });
  }

  /* ── HERO VISUAL PARALLAX ────────────────────────────────────────── */
  if (!prefersReduced) {
    const vis = document.querySelector('.cs-visual img, .cs-visual-placeholder');
    if (vis) {
      gsap.fromTo(vis, { yPercent: -10, scale: 1.15 }, {
        yPercent: 10, ease: 'none',
        scrollTrigger: { trigger: '.cs-visual', start: 'top bottom', end: 'bottom top', scrub: 1 }
      });
    }
  }

  /* ── CUSTOM CURSOR ───────────────────────────────────────────────── */
  const cursor = document.querySelector('.cursor');
  const cursorDot = document.querySelector('.cursor-dot');
  if (cursor && isFinePointer) {
    let cx = 0, cy = 0, tx = 0, ty = 0;
    document.addEventListener('mousemove', (e) => {
      tx = e.clientX; ty = e.clientY;
      cursorDot.style.transform = `translate(${tx - 2}px, ${ty - 2}px)`;
    });
    (function move() {
      cx += (tx - cx) * 0.18; cy += (ty - cy) * 0.18;
      cursor.style.transform = `translate(${cx - 7}px, ${cy - 7}px)`;
      requestAnimationFrame(move);
    })();
    document.querySelectorAll('[data-hover], a, button').forEach(el => {
      el.addEventListener('mouseenter', () => cursor.classList.add('hovering'));
      el.addEventListener('mouseleave', () => cursor.classList.remove('hovering'));
    });
  } else if (cursor) {
    cursor.style.display = 'none';
    if (cursorDot) cursorDot.style.display = 'none';
  }

  /* ── THEME TOGGLE ────────────────────────────────────────────────── */
  (function initThemeToggle() {
    const root = document.documentElement;
    const btn = document.querySelector('.theme-toggle');
    function apply(theme) {
      if (theme === 'light') root.setAttribute('data-theme', 'light');
      else root.removeAttribute('data-theme');
      if (btn) btn.setAttribute('aria-pressed', String(theme === 'light'));
    }
    let saved = 'dark';
    try { saved = localStorage.getItem('theme') || 'dark'; } catch (e) {}
    apply(saved);
    if (btn) btn.addEventListener('click', () => {
      const next = root.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
      apply(next);
      try { localStorage.setItem('theme', next); } catch (e) {}
    });
  })();
})();
