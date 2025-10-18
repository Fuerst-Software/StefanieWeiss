/* ================================
   NAV & Interaktion (dein Code)
================================ */

// --- Mobile Nav Toggle ---
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

// --- Subtiler Schatten auf Scroll ---
const header = document.querySelector('#site-nav');
window.addEventListener('scroll', () => {
  const y = window.scrollY || window.pageYOffset;
  header.style.boxShadow = y > 6 ? '0 12px 28px rgba(0,0,0,.35)' : 'none';
});

// --- Smooth Scrolling ---
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

// --- Footer Jahr ---
const y = document.getElementById('year');
if (y) y.textContent = new Date().getFullYear();

// --- Simple Form-Guard ---
const form = document.querySelector('form');
if (form){
  form.addEventListener('submit', e=>{
    const req = form.querySelectorAll('[required]');
    let ok = true; req.forEach(el=>{ if(!el.value.trim()) ok = false; });
    if (!ok){ e.preventDefault(); alert('Bitte fülle alle Pflichtfelder aus.'); }
  });
}


/* ================================
   ✨ Gold-Braune Glitter-Animation
   Canvas: sanft schwebende Partikel
================================ */

(function(){
  const canvas = document.getElementById('glitterCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d', { alpha: true });

  // DevicePixelRatio für knackige 4K/Retina-Schärfe
  function sizeCanvas(){
    const dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
    const { width, height } = canvas.getBoundingClientRect();
    canvas.width  = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  // Farbpalette (gold-braun) passend zum BG
  const GOLD  = 'rgba(255, 215, 130, 0.9)';   // warmes Gold
  const GOLD2 = 'rgba(210, 160, 80,  0.85)';  // etwas dunkler
  const AMBI  = 'rgba(60, 40, 15, 0.15)';     // zarter Nebel

  // Partikel-Setup
  const P = [];
  const BASE_COUNT = 140;  // kannst du höher drehen (z. B. 200)
  function resetParticle(p){
    const r = Math.random() * 1.6 + 0.3;
    p.x = Math.random() * canvas.clientWidth;
    p.y = Math.random() * canvas.clientHeight;
    p.r = r;
    p.vx = (Math.random() - 0.5) * 0.25;        // leichter Drift
    p.vy = Math.random() * 0.65 + 0.15;        // langsames Fallen
    p.o = Math.random() * 0.6 + 0.35;          // Opazität
    p.c = Math.random() < 0.55 ? GOLD : GOLD2; // Farbe
    p.tw = Math.random() * 2 * Math.PI;        // Twinkle Phase
    p.ts = Math.random() * 0.015 + 0.005;      // Twinkle Speed
  }

  function init(){
    sizeCanvas();
    P.length = 0;
    const count = Math.round(BASE_COUNT * (canvas.clientWidth/1280 + canvas.clientHeight/720)/2);
    for (let i=0;i<count;i++){
      const p = {};
      resetParticle(p);
      // Verteile etwas mehr in der oberen Hälfte (wie Staubkegel)
      if (Math.random() < 0.6) p.y *= 0.6;
      P.push(p);
    }
  }

  let raf, lastTime = 0;
  function draw(t){
    raf = requestAnimationFrame(draw);
    const dt = Math.min(32, t - lastTime || 16); lastTime = t;

    // zarter „Nebel“-Layer, kein kompletter Clear → smooth trails
    ctx.fillStyle = AMBI;
    ctx.fillRect(0, 0, canvas.clientWidth, canvas.clientHeight);

    // sehr leichte Vignette, damit Ränder dunkler wirken
    const grad = ctx.createRadialGradient(
      canvas.clientWidth*0.5, canvas.clientHeight*0.45, 0,
      canvas.clientWidth*0.5, canvas.clientHeight*0.55, Math.max(canvas.clientWidth, canvas.clientHeight)*0.75
    );
    grad.addColorStop(0, 'rgba(0,0,0,0)');
    grad.addColorStop(1, 'rgba(0,0,0,0.08)');
    ctx.fillStyle = grad;
    ctx.fillRect(0,0,canvas.clientWidth, canvas.clientHeight);

    // Partikel
    for (const p of P){
      // Twinkle
      const tw = 0.6 + 0.4 * Math.sin(p.tw);
      p.tw += p.ts * dt;

      // Bewegung
      p.x += p.vx * dt * 0.06;
      p.y += p.vy * dt * 0.06;

      // Wrap/Reset
      if (p.y > canvas.clientHeight + 10){ p.y = -10; p.x = Math.random()*canvas.clientWidth; }
      if (p.x < -10) p.x = canvas.clientWidth + 10;
      if (p.x > canvas.clientWidth + 10) p.x = -10;

      // Zeichnen (weiche Glowscheibe)
      const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r*4);
      g.addColorStop(0, p.c.replace(/0\.\d+\)$/,'1)'));
      g.addColorStop(1, p.c);
      ctx.globalAlpha = p.o * tw;
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r*2.2, 0, Math.PI*2);
      ctx.fill();
      ctx.globalAlpha = 1;
    }
  }

  // Resize Handling (throttled)
  let rTO;
  function onResize(){
    clearTimeout(rTO);
    rTO = setTimeout(()=>{ sizeCanvas(); init(); }, 120);
  }
  window.addEventListener('resize', onResize);

  // Motion-Preference
  const media = window.matchMedia('(prefers-reduced-motion: reduce)');
  function start(){
    if (media.matches) { cancelAnimationFrame(raf); return; }
    cancelAnimationFrame(raf);
    init();
    draw(0);
  }
  media.addEventListener?.('change', start);

  // Start
  sizeCanvas();
  start();
})();
