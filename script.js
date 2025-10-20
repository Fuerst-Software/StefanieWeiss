/* =========================================
   Header / Mobile Navigation / Smooth Scroll
========================================= */
const header = document.getElementById('site-nav');
const toggle = document.querySelector('.nav__toggle');
const menu   = document.getElementById('navmenu');

function openMenu(){
  if (!menu) return;
  menu.classList.add('open');
  document.body.classList.add('menu-open');
  toggle?.setAttribute('aria-expanded','true');
  toggle?.setAttribute('aria-label','Menü schließen');
}
function closeMenu(){
  if (!menu) return;
  menu.classList.remove('open');
  document.body.classList.remove('menu-open');
  toggle?.setAttribute('aria-expanded','false');
  toggle?.setAttribute('aria-label','Menü öffnen');
}
if (toggle && menu){
  toggle.addEventListener('click', () => {
    menu.classList.contains('open') ? closeMenu() : openMenu();
  });

  // Jeder Link im Menü schließt das Menü; Anker scrollen smooth
  menu.addEventListener('click', (e) => {
    const a = e.target.closest('a');
    if (!a) return;
    const href = a.getAttribute('href') || '';
    const isHash = href.startsWith('#') && href.length > 1;

    closeMenu(); // immer schließen

    if (isHash){
      const target = document.querySelector(href);
      if (target){
        e.preventDefault();
        setTimeout(() => target.scrollIntoView({ behavior:'smooth', block:'start' }), 140);
      }
    }
  });

  window.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeMenu(); });
}

// Header-Schatten
window.addEventListener('scroll', () => {
  const y = window.scrollY || window.pageYOffset;
  header.style.boxShadow = y > 6 ? '0 12px 28px rgba(0,0,0,.35)' : 'none';
}, { passive: true });

// Smooth-Scroll für interne Links außerhalb des Menüs
document.querySelectorAll('a[href^="#"]:not(#navmenu a)').forEach(a=>{
  a.addEventListener('click', (e)=>{
    const id = a.getAttribute('href');
    const el = id && document.querySelector(id);
    if (el){
      e.preventDefault();
      el.scrollIntoView({ behavior:'smooth', block:'start' });
    }
  });
});

// Footer-Jahr
const yearEl = document.getElementById('year');
if (yearEl) yearEl.textContent = new Date().getFullYear();

/* =========================================
   Ultra-smooth Parallax für Hero (Mobile-first)
   - Stärker auf Mobile (coarse pointer), dezenter auf Desktop
   - Bild ist 115% hoch → kein Rand beim Shiften
   - rAF + passive Scroll; pausiert offscreen; reduced-motion respektiert
========================================= */
(function(){
  const heroImg = document.getElementById('heroImg');
  const heroSec = document.querySelector('.hero');
  if (!heroImg || !heroSec) return;

  const prefersReduce = window.matchMedia('(prefers-reduced-motion: reduce)');

  function getMaxOffset(){
    const coarse = window.matchMedia('(pointer:coarse)').matches;
    // Mobile kriegt mehr Movement
    return coarse ? 36 : 16; // px
  }
  let MAX = getMaxOffset();
  let EASE = window.matchMedia('(pointer:coarse)').matches ? 0.18 : 0.12;

  // Layout-Messung
  let secTop = 0, secHeight = 0, vh = window.innerHeight;
  function measure(){
    const rect = heroSec.getBoundingClientRect();
    secTop = (window.pageYOffset || document.documentElement.scrollTop) + rect.top;
    secHeight = rect.height;
    vh = window.innerHeight || document.documentElement.clientHeight;
    MAX = getMaxOffset();
    EASE = window.matchMedia('(pointer:coarse)').matches ? 0.18 : 0.12;
  }

  let targetY = 0, currentY = 0, ticking = false, inView = true;

  // Sichtbarkeit (pausieren spart Batterie)
  if ('IntersectionObserver' in window){
    const io = new IntersectionObserver(([entry]) => {
      inView = entry.isIntersecting;
      if (inView) requestTick();
    }, { threshold: 0.01 });
    io.observe(heroSec);
  }

  function computeTarget(scrollY){
    const start = secTop - vh;
    const end   = secTop + secHeight;
    const progressRaw = (scrollY - start) / (end - start);
    const progress = Math.max(0, Math.min(1, progressRaw));
    return (progress - 0.5) * -MAX;
  }

  function onScroll(){
    if (prefersReduce.matches || !inView) return;
    requestTick();
  }

  function requestTick(){
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(update);
  }

  function update(){
    ticking = false;
    const scrollY = window.pageYOffset || document.documentElement.scrollTop || 0;
    targetY = computeTarget(scrollY);
    // Sanftes Nachziehen
    currentY += (targetY - currentY) * EASE;
    // kleine Skalierung sorgt für saubere Kanten bei starkem Shift
    heroImg.style.transform = `translate3d(0, ${currentY.toFixed(2)}px, 0)`;
  }

  window.addEventListener('scroll', onScroll, { passive:true });
  window.addEventListener('resize', () => { measure(); requestTick(); }, { passive:true });
  prefersReduce.addEventListener?.('change', () => {
    if (prefersReduce.matches){
      heroImg.style.transform = 'translate3d(0,0,0)';
    } else {
      measure(); requestTick();
    }
  });

  // Initial
  measure();
  requestTick();
})();

/* =========================================
   Glitter-Canvas (nur Desktop, jank-frei)
   - Mobile/Touch & Reduced-Motion: deaktiviert (Element entfernt)
   - 30fps Limiter, DPR capped, pausiert offscreen
========================================= */
(function(){
  const canvas = document.getElementById('glitterCanvas');
  if (!canvas) return;

  const prefersReduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isTouch = window.matchMedia('(pointer:coarse)').matches;
  if (prefersReduce || isTouch){
    canvas.remove();
    return;
  }

  const ctx = canvas.getContext('2d', { alpha:true });
  const DPR = Math.min(1.5, window.devicePixelRatio || 1);
  let vw = 0, vh = 0;

  function sizeCanvas(){
    const rect = canvas.getBoundingClientRect();
    vw = Math.max(1, Math.floor(rect.width));
    vh = Math.max(1, Math.floor(rect.height));
    canvas.width  = Math.round(vw * DPR);
    canvas.height = Math.round(vh * DPR);
    ctx.setTransform(DPR,0,0,DPR,0,0);
  }

  function makeSprite(r, inner, outer){
    const d = r*2;
    const off = document.createElement('canvas');
    off.width = off.height = d;
    const o = off.getContext('2d');
    const g = o.createRadialGradient(r, r, 0, r, r, r);
    g.addColorStop(0, inner); g.addColorStop(1, outer);
    o.fillStyle = g; o.beginPath(); o.arc(r, r, r, 0, Math.PI*2); o.fill();
    return off;
  }

  const GOLD='rgba(255,215,130,1)', GOLD2='rgba(210,160,80,1)';
  const GOLD0='rgba(255,215,130,0)', GOLD20='rgba(210,160,80,0)';
  const HAZE='rgba(60,40,15,0.12)';

  const spS  = makeSprite(6,  GOLD,  GOLD0);
  const spS2 = makeSprite(6,  GOLD2, GOLD20);
  const spB  = makeSprite(10, GOLD,  GOLD0);

  const P=[];
  function reset(p){
    p.x=Math.random()*vw; p.y=Math.random()*vh;
    p.vx=(Math.random()-0.5)*0.08; p.vy=Math.random()*0.18+0.05;
    p.o=Math.random()*0.6+0.35; p.tw=Math.random()*Math.PI*2; p.ts=Math.random()*0.01+0.003;
    p.sp=Math.random()<0.12?spB:(Math.random()<0.5?spS:spS2);
    if(Math.random()<0.6) p.y*=0.6;
  }
  function init(){
    P.length=0;
    const base=Math.min(140, Math.max(60, Math.round((vw*vh)/18000)));
    for(let i=0;i<base;i++){ const p={}; reset(p); P.push(p); }
  }

  // Sichtbarkeit
  let inView = true;
  const hero = document.querySelector('.hero');
  if ('IntersectionObserver' in window && hero){
    const io = new IntersectionObserver(([entry]) => { inView = entry.isIntersecting; }, { threshold:0.05 });
    io.observe(hero);
  }
  document.addEventListener('visibilitychange', () => { inView = !document.hidden; });

  // 30fps Limiter
  let raf=0, last=performance.now(), acc=0; const STEP=1000/30;

  function frame(now){
    raf=requestAnimationFrame(frame);
    const dt=Math.min(64, now-last); last=now; acc+=dt;
    if (acc<STEP || !inView) return;
    const mul=acc/16.6667; acc=0;

    ctx.fillStyle=HAZE; ctx.fillRect(0,0,vw,vh);

    for (let i=0;i<P.length;i++){
      const p=P[i];
      const tw=0.6+0.4*Math.sin(p.tw); p.tw+=p.ts*mul;
      p.x+=p.vx*mul; p.y+=p.vy*mul;
      if (p.y>vh+12){p.y=-12; p.x=Math.random()*vw;}
      if (p.x<-12) p.x=vw+12; if (p.x>vw+12) p.x=-12;

      ctx.globalAlpha=p.o*tw;
      ctx.drawImage(p.sp, p.x-p.sp.width/2, p.y-p.sp.height/2);
    }
    ctx.globalAlpha=1;
  }

  function start(){
    cancelAnimationFrame(raf);
    sizeCanvas(); init();
    last=performance.now(); acc=0;
    raf=requestAnimationFrame(frame);
  }

  window.addEventListener('resize', () => {
    clearTimeout(start._t); start._t=setTimeout(start,120);
  }, { passive:true });

  start();
})();

/* =========================================
   Kontaktformular (FormSubmit)
========================================= */
(() => {
  const form = document.getElementById('contactForm');
  if (!form) return;

  const getEl = (id) => document.getElementById(id);
  const nameEl = getEl('name');
  const emailEl = getEl('email');
  const msgEl = getEl('msg');

  const statusBox = document.getElementById('cf-toast');

  function showStatus(text, ok = true) {
    statusBox.style.display = 'block';
    statusBox.textContent = text;
    statusBox.className = ok ? 'toast toast--ok' : 'toast toast--err';
    statusBox.id = 'cf-toast';
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!form.checkValidity()) {
      form.classList.add('was-validated');
      showStatus('Bitte alle Pflichtfelder korrekt ausfüllen.', false);
      return;
    }
    const submitBtn = form.querySelector('button[type="submit"]');
    const oldLabel = submitBtn ? submitBtn.textContent : null;
    if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = 'Wird gesendet…'; }

    try {
      const fd = new FormData();
      fd.append('name', nameEl.value.trim());
      fd.append('email', emailEl.value.trim());
      fd.append('message', msgEl.value.trim());
      fd.append('_subject', 'Neue Anfrage über fuerst-software.com');
      fd.append('_template', 'table');
      fd.append('_captcha', 'false');
      fd.append('_honey', '');

      const res = await fetch('https://formsubmit.co/ajax/mail@fuerst-software.com', {
        method: 'POST',
        body: fd,
        headers: { 'Accept': 'application/json' }
      });
      if (!res.ok) throw new Error('Sende-Fehler');
      await res.json();

      showStatus('Danke! Deine Anfrage ist eingegangen – wir melden uns asap.', true);
      form.reset();
      form.classList.remove('was-validated');
    } catch (err) {
      showStatus('Uff, da ist etwas schiefgelaufen. Versuch’s später nochmal.', false);
      console.error(err);
    } finally {
      const submitBtn = form.querySelector('button[type="submit"]');
      if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = oldLabel; }
    }
  });
})();
