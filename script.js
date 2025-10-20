/* ===== Mobile Nav: fixed header, closable menu ===== */
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
  toggle.addEventListener('click', ()=> menu.classList.contains('open') ? closeMenu() : openMenu());

  // Close on any link (auch externe), smooth scroll für Hash-Links
  menu.addEventListener('click', (e) => {
    const a = e.target.closest('a');
    if (!a) return;
    const href = a.getAttribute('href') || '';
    const isHash = href.startsWith('#') && href.length > 1;
    closeMenu();
    if (isHash){
      const target = document.querySelector(href);
      if (target){
        e.preventDefault();
        setTimeout(()=> target.scrollIntoView({ behavior:'smooth', block:'start' }), 150);
      }
    }
  });

  window.addEventListener('keydown', (e)=>{ if(e.key==='Escape') closeMenu(); });
}

// Header shadow
window.addEventListener('scroll', ()=>{
  const y = window.scrollY || window.pageYOffset || 0;
  header && (header.style.boxShadow = y > 6 ? '0 12px 28px rgba(0,0,0,.35)' : 'none');
}, { passive:true });

// Smooth scroll outside nav
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

// Footer year
const yearEl = document.getElementById('year');
if (yearEl) yearEl.textContent = new Date().getFullYear();

/* ===== Hero Parallax (Mobile-first, jank-free) =====
   - Stärker auf Touch (pointer:coarse), dezenter auf Desktop
   - Bild ist 115% hoch (siehe CSS) → keine Ränder beim Shift
   - rAF, passive scroll, pausiert offscreen, respektiert reduced motion
*/
(function(){
  const heroImg = document.getElementById('heroImg') || document.querySelector('.hero__bg img');
  const heroSec = document.querySelector('.hero');
  if (!heroImg || !heroSec) return;

  const mqReduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  const mqCoarse = window.matchMedia('(pointer:coarse)');

  function maxOffset(){ return mqCoarse.matches ? 36 : 16; }   // px Bewegung
  function ease(){ return mqCoarse.matches ? 0.18 : 0.12; }    // Nachzieh-Geschwindigkeit

  let MAX = maxOffset(), EASE = ease();
  let secTop = 0, secH = 0, vh = window.innerHeight;

  function measure(){
    const rect = heroSec.getBoundingClientRect();
    secTop = (window.pageYOffset || document.documentElement.scrollTop || 0) + rect.top;
    secH   = rect.height;
    vh     = window.innerHeight || document.documentElement.clientHeight;
    MAX    = maxOffset();
    EASE   = ease();
  }

  let targetY = 0, currentY = 0, ticking = false, inView = true;

  // Pause offscreen
  if ('IntersectionObserver' in window){
    new IntersectionObserver(([entry])=>{
      inView = entry.isIntersecting;
      if (inView) requestTick();
    }, { threshold: 0.01 }).observe(heroSec);
  }

  function compute(scrollY){
    const start = secTop - vh;
    const end   = secTop + secH;
    const pRaw  = (scrollY - start) / (end - start);
    const p     = Math.max(0, Math.min(1, pRaw));
    return (p - 0.5) * -MAX; // oben negativ, unten positiv
  }

  function onScroll(){
    if (mqReduce.matches || !inView) return;
    requestTick();
  }
  function requestTick(){
    if (ticking) return;
    ticking = true; requestAnimationFrame(update);
  }
  function update(){
    ticking = false;
    const y = window.pageYOffset || document.documentElement.scrollTop || 0;
    targetY = compute(y);
    currentY += (targetY - currentY) * EASE;
    heroImg.style.transform = `translate3d(0, ${currentY.toFixed(2)}px, 0)`;
  }

  window.addEventListener('scroll', onScroll, { passive:true });
  window.addEventListener('resize', ()=>{ measure(); requestTick(); }, { passive:true });
  mqReduce.addEventListener?.('change', ()=> {
    if (mqReduce.matches){
      heroImg.style.transform = 'translate3d(0,0,0)';
    } else {
      measure(); requestTick();
    }
  });
  mqCoarse.addEventListener?.('change', ()=>{ measure(); requestTick(); });

  // initial
  measure(); requestTick();
})();

/* ===== Glitter Canvas (no jank; off on touch & reduced motion) ===== */
(function(){
  const canvas = document.getElementById('glitterCanvas');
  if (!canvas) return;

  const prefersReduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isTouch = window.matchMedia('(pointer:coarse)').matches;
  // Auf Touch-Geräten & bei reduced motion deaktivieren → schützt Mobile-Performance
  if (prefersReduce || isTouch){ canvas.remove(); return; }

  const ctx = canvas.getContext('2d', { alpha:true });
  const DPR = Math.min(1.25, window.devicePixelRatio || 1);
  let vw = 0, vh = 0;

  function sizeCanvas(){
    const rect = canvas.getBoundingClientRect();
    vw = Math.max(1, Math.floor(rect.width));
    vh = Math.max(1, Math.floor(rect.height));
    canvas.width  = Math.round(vw * DPR);
    canvas.height = Math.round(vh * DPR);
    ctx.setTransform(DPR,0,0,DPR,0,0);
  }

  function sprite(r, inner, outer){
    const d = r*2, off = document.createElement('canvas');
    off.width = off.height = d;
    const c = off.getContext('2d');
    const g = c.createRadialGradient(r,r,0,r,r,r);
    g.addColorStop(0, inner); g.addColorStop(1, outer);
    c.fillStyle = g; c.beginPath(); c.arc(r,r,r,0,Math.PI*2); c.fill();
    return off;
  }

  const GOLD='rgba(255,215,130,1)', GOLD2='rgba(210,160,80,1)';
  const GOLD0='rgba(255,215,130,0)', GOLD20='rgba(210,160,80,0)';
  const HAZE='rgba(60,40,15,0.12)';

  const spS  = sprite(6,  GOLD,  GOLD0);
  const spS2 = sprite(6,  GOLD2, GOLD20);
  const spB  = sprite(10, GOLD,  GOLD0);

  const P=[];
  function reset(p){
    p.x=Math.random()*vw; p.y=Math.random()*vh;
    p.vx=(Math.random()-0.5)*0.08; p.vy=Math.random()*0.18+0.05;
    p.o=Math.random()*0.6+0.35; p.tw=Math.random()*Math.PI*2; p.ts=Math.random()*0.01+0.003;
    p.sp=Math.random()<0.12?spB:(Math.random()<0.5?spS:spS2);
    if (Math.random()<0.6) p.y*=0.6;
  }
  function init(){
    P.length=0;
    const base=Math.min(140, Math.max(60, Math.round((vw*vh)/18000)));
    for(let i=0;i<base;i++){ const p={}; reset(p); P.push(p); }
  }

  // Pause offscreen
  let inView = true;
  const hero = document.querySelector('.hero');
  if ('IntersectionObserver' in window && hero){
    new IntersectionObserver(([e])=>{ inView = e.isIntersecting; }, {threshold:0.05}).observe(hero);
  }
  document.addEventListener('visibilitychange', ()=>{ inView = !document.hidden; });

  // 30fps limiter
  let raf=0, last=performance.now(), acc=0; const STEP=1000/30;
  function loop(now){
    raf=requestAnimationFrame(loop);
    const dt=Math.min(64, now-last); last=now; acc+=dt;
    if (acc<STEP || !inView) return;
    const mul=acc/16.6667; acc=0;

    ctx.fillStyle=HAZE; ctx.fillRect(0,0,vw,vh);
    for(const p of P){
      const tw=0.6+0.4*Math.sin(p.tw); p.tw+=p.ts*mul;
      p.x+=p.vx*mul; p.y+=p.vy*mul;
      if(p.y>vh+12){p.y=-12; p.x=Math.random()*vw;}
      if(p.x<-12) p.x=vw+12; if(p.x>vw+12) p.x=-12;
      ctx.globalAlpha=p.o*tw; const sp=p.sp;
      ctx.drawImage(sp, p.x-sp.width/2, p.y-sp.height/2);
    }
    ctx.globalAlpha=1;
  }

  function start(){
    cancelAnimationFrame(raf);
    sizeCanvas(); init(); last=performance.now(); acc=0; raf=requestAnimationFrame(loop);
  }
  window.addEventListener('resize', ()=>{ clearTimeout(start._t); start._t=setTimeout(start,120); }, { passive:true });
  start();
})();

/* ===== Kontaktformular (FormSubmit) ===== */
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
      const submitBtn2 = form.querySelector('button[type="submit"]');
      if (submitBtn2) { submitBtn2.disabled = false; submitBtn2.textContent = oldLabel; }
    }
  });
})();
