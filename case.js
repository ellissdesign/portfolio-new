/* =========================================================================
   Ellis Victoria — Case Study shared motion script (v2)
   Flow-field canvas whose palette shifts as you scroll · Lenis · GSAP
   ========================================================================= */
(function () {
  'use strict';
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isFinePointer = window.matchMedia('(pointer: fine)').matches;

  /* ── SCROLL-REACTIVE FLOW-FIELD CANVAS ───────────────────────────── */
  const canvas = document.getElementById('bg-canvas');
  const ctx = canvas ? canvas.getContext('2d') : null;
  let particles = [], w, h, dpr, time = 0;
  const mouse = { x: -9999, y: -9999, active: false };

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

  function flowAngle(x, y, t) {
    return (
      Math.sin(x * 0.0018 + t) +
      Math.cos(y * 0.0018 - t * 0.8) +
      Math.sin((x + y) * 0.0012 + t * 0.5)
    ) * 1.2;
  }

  function initParticles() {
    particles = [];
    const count = Math.min(Math.floor((w * h) / 14000), 160);
    for (let i = 0; i < count; i++) {
      particles.push({
        x: Math.random() * w, y: Math.random() * h,
        vx: 0, vy: 0,
        life: Math.random() * 100,
        size: Math.random() * 1.6 + 0.4
      });
    }
  }

  function tick() {
    time += 0.0016;
    ctx.fillStyle = 'rgba(10,10,10,0.14)';
    ctx.fillRect(0, 0, w, h);

    const base = paletteColor(scrollProgress);

    for (const p of particles) {
      const angle = flowAngle(p.x, p.y, time);
      p.vx += Math.cos(angle) * 0.12;
      p.vy += Math.sin(angle) * 0.12;

      if (mouse.active) {
        const dx = p.x - mouse.x, dy = p.y - mouse.y;
        const dist = Math.hypot(dx, dy);
        if (dist < 160) {
          const force = (160 - dist) / 160;
          p.vx += (dx / dist) * force * 1.2;
          p.vy += (dy / dist) * force * 1.2;
        }
      }

      p.vx *= 0.92; p.vy *= 0.92;
      p.x += p.vx; p.y += p.vy;
      p.life -= 1;

      if (p.x < 0 || p.x > w || p.y < 0 || p.y > h || p.life < 0) {
        p.x = Math.random() * w; p.y = Math.random() * h;
        p.vx = p.vy = 0; p.life = Math.random() * 200 + 50;
      }

      const speed = Math.hypot(p.vx, p.vy);
      const intensity = Math.min(speed * 0.5, 1);
      ctx.fillStyle = `rgba(${Math.round(base.r)},${Math.round(base.g)},${Math.round(base.b)},${0.4 + intensity * 0.45})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size + speed * 0.3, 0, Math.PI * 2);
      ctx.fill();
    }
    requestAnimationFrame(tick);
  }

  if (canvas && !prefersReduced) {
    resize(); initParticles(); tick();
    window.addEventListener('resize', () => { resize(); initParticles(); });
    window.addEventListener('mousemove', (e) => { mouse.x = e.clientX; mouse.y = e.clientY; mouse.active = true; });
    window.addEventListener('mouseout', () => { mouse.active = false; });
  } else if (canvas) {
    canvas.style.display = 'none';
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
})();
