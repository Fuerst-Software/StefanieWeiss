/* ================================
   NAV & Basis-Interaktion
================================ */
const toggle = document.querySelector('.nav__toggle');
const menu = document.querySelector('#navmenu');

if (toggle && menu) {
  const open = () => {
    menu.classList.add('open');
    toggle.setAttribute('aria-expanded','true');
    toggle.setAttribute('aria-label','Menü schließen');
  };
  const close = () => {
    menu.classList.remove('open');
    toggle.setAttribute('aria-expanded','false');
    toggle.setAttribute('aria-label','Menü öffnen');
  };
  toggle.addEventListener('click', () => menu.classList.contains('open') ? close() : open());
}

const header = document.querySelector('#site-nav');
window.addEventListener('scroll', () => {
  const y = window.scrollY || window.pageYOffset;
  header.style.boxShadow = y > 6 ? '0 12px 28px rgba(0,0,0,.35)' : 'none';
});

document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', e => {
    const id = a.getAttribute('href');
    if (id && id.length > 1) {
      const el = document.querySelector(id);
      if (el) {
        e.preventDefault();
        el.scrollIntoView({ behavior:'smooth', block:'start' });
      }
    }
  });
});

const y = document.getElementById('year');
if (y) y.textContent = new Date().getFullYear();

const form = document.querySelector('form');
if (form){
  form.addEventListener('submit', e=>{
    const req = form.querySelectorAll('[required]');
    let ok = true; req.forEach(el=>{ if(!el.value.trim()) ok = false; });
    if (!ok){ e.preventDefault(); alert('Bitte fülle alle Pflichtfelder aus.'); }
  });
}

/* ================================
   ✨ Optimierte Glitter-Animation
   - DPR capped
   - adaptive Partikel
   - Sprite statt Gradients
   - 30fps Limiter
   - Pause offscreen / hidden
================================ */
(function(){
  const canvas = document.getElementById('glitterCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d', { alpha: true });

  const DPR = Math.min(1.25, window.devicePixelRatio || 1); // cap for mobile
  let vw = 0, vh = 0;

  function sizeCanvas(){
    const rect = canvas.getBoundingClientRect();
    vw = Math.max(1, Math.floor(rect.width));
    vh = Math.max(1, Math.floor(rect.height));
    canvas.width  = Math.round(vw * DPR);
    canvas.height = Math.round(vh * DPR);
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  }

  // Sprite vorbereiten (Glow-Dot)
  function makeSprite(r, inner, outer){
    const d = r*2;
    const off = document.createElement('canvas');
    off.width = off.height = d;
    const octx = off.getContext('2d');
    const g = octx.createRadialGradient(r, r, 0, r, r, r);
    g.addColorStop(0, inner);
    g.addColorStop(1, outer);
    octx.fillStyle = g;
    octx.beginPath();
    octx.arc(r, r, r, 0, Math.PI*2);
    octx.fill();
    return off;
  }

  // Farben passend zum BG
  const GOLD  = 'rgba(255,215,130,1)';
  const GOLD2 = 'rgba(210,160,80,1)';
  const GOLD_OUT  = 'rgba(255,215,130,0)';
  const GOLD2_OUT = 'rgba(210,160,80,0)';
  const HAZE = 'rgba(60,40,15,0.12)';

  const spriteSmall  = makeSprite(6, GOLD, GOLD_OUT);
  const spriteSmall2 = makeSprite(6, GOLD2, GOLD2_OUT);
  const spriteBig    = makeSprite(10, GOLD, GOLD_OUT);

  const P = [];
  function resetParticle(p){
    p.x = Math.random()*vw;
    p.y = Math.random()*vh;
    p.vx = (Math.random()-0.5)*0.08; // sehr subtil
    p.vy = Math.random()*0.18 + 0.05;
    p.o  = Math.random()*0.6 + 0.35;
    p.tw = Math.random()*Math.PI*2;
    p.ts = Math.random()*0.01 + 0.003;
    p.sp = Math.random() < 0.12 ? spriteBig : (Math.random()<0.5 ? spriteSmall : spriteSmall2);
    if (Math.random() < 0.6) p.y *= 0.6; // mehr oben verteilen
  }

  function initParticles(){
    P.length = 0;
    // adaptive Anzahl (Cap für Mobile)
    const area = vw*vh;
    const base = Math.min(140, Math.max(60, Math.round(area/18000))); // ~60–140
    for (let i=0;i<base;i++){
      const p = {};
      resetParticle(p);
      P.push(p);
    }
  }

  // Visibility / InView steuern
  let inView = true;
  const hero = document.querySelector('.hero');
  if ('IntersectionObserver' in window && hero){
    const io = new IntersectionObserver(([entry])=>{
      inView = entry.isIntersecting;
    }, { threshold: 0.05 });
    io.observe(hero);
  }

  document.addEventListener('visibilitychange', ()=>{
    if (document.hidden) inView = false; else inView = true;
  });

  // Renderloop (30fps Limiter)
  let raf = 0, last = performance.now(), acc = 0;
  const STEP = 1000/30;

  function frame(now){
    raf = requestAnimationFrame(frame);
    const dt = Math.min(64, now - last);
    last = now;
    acc += dt;
    if (acc < STEP) return;
    const delta = acc / 16.6667; // Multiplier ~ frames
    acc = 0;

    if (!inView) return;

    // leichter Haze, kein voller Clear -> weiche Trails
    ctx.fillStyle = HAZE;
    ctx.fillRect(0,0,vw,vh);

    // Partikel
    for (let i=0;i<P.length;i++){
      const p = P[i];
      // twinkle
      const tw = 0.6 + 0.4 * Math.sin(p.tw);
      p.tw += p.ts * delta;

      p.x += p.vx * delta;
      p.y += p.vy * delta;

      if (p.y > vh + 12){ p.y = -12; p.x = Math.random()*vw; }
      if (p.x < -12) p.x = vw + 12;
      if (p.x > vw + 12) p.x = -12;

      ctx.globalAlpha = p.o * tw;
      const sp = p.sp;
      ctx.drawImage(sp, p.x - sp.width/2, p.y - sp.height/2);
      ctx.globalAlpha = 1;
    }
  }

  const media = window.matchMedia('(prefers-reduced-motion: reduce)');
  function start(){
    cancelAnimationFrame(raf);
    if (media.matches) return;
    sizeCanvas();
    initParticles();
    last = performance.now();
    acc = 0;
    raf = requestAnimationFrame(frame);
  }
  media.addEventListener?.('change', start);
  window.addEventListener('resize', ()=>{
    // throttle resize
    clearTimeout(start.__t);
    start.__t = setTimeout(start, 120);
  });

  // Start
  start();
})();
