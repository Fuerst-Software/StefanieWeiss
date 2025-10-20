/* =========================
   Mobile Nav / Smooth Scroll
========================= */
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
        setTimeout(()=> target.scrollIntoView({ behavior:'smooth', block:'start' }), 140);
      }
    }
  });

  window.addEventListener('keydown', (e)=>{ if (e.key==='Escape') closeMenu(); });
}
window.addEventListener('scroll', ()=>{
  const y = window.scrollY || window.pageYOffset || 0;
  if (header) header.style.boxShadow = y > 6 ? '0 12px 28px rgba(0,0,0,.35)' : 'none';
}, { passive:true });

document.querySelectorAll('a[href^="#"]:not(#navmenu a)').forEach(a=>{
  a.addEventListener('click', (e)=>{
    const id = a.getAttribute('href');
    const el = id && document.querySelector(id);
    if (el){ e.preventDefault(); el.scrollIntoView({ behavior:'smooth', block:'start' }); }
  });
});
const yearEl = document.getElementById('year');
if (yearEl) yearEl.textContent = new Date().getFullYear();

/* =========================
   Parallax (Mobile-first)
========================= */
(function(){
  const heroImg = document.getElementById('heroImg') || document.querySelector('.hero__bg img');
  const heroSec = document.querySelector('.hero');
  if (!heroImg || !heroSec) return;

  const mqReduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  const mqCoarse = window.matchMedia('(pointer:coarse)');

  const maxOffset = ()=> mqCoarse.matches ? 36 : 16;
  const ease      = ()=> mqCoarse.matches ? 0.18 : 0.12;

  let MAX = maxOffset(), EASE = ease();
  let secTop=0, secH=0, vh=window.innerHeight;

  function measure(){
    const r = heroSec.getBoundingClientRect();
    secTop = (window.pageYOffset || document.documentElement.scrollTop || 0) + r.top;
    secH   = r.height;
    vh     = window.innerHeight || document.documentElement.clientHeight;
    MAX    = maxOffset(); EASE = ease();
  }

  let targetY=0, currentY=0, ticking=false, inView=true;

  if ('IntersectionObserver' in window){
    new IntersectionObserver(([entry])=>{
      inView = entry.isIntersecting;
      if (inView) requestTick();
    }, { threshold:0.01 }).observe(heroSec);
  }

  const compute = (scrollY)=>{
    const start = secTop - vh;
    const end   = secTop + secH;
    const p     = Math.max(0, Math.min(1, (scrollY - start)/(end - start)));
    return (p - 0.5) * -MAX;
  };

  function onScroll(){
    if (mqReduce.matches || !inView) return;
    requestTick();
  }
  function requestTick(){
    if (ticking) return; ticking=true; requestAnimationFrame(update);
  }
  function update(){
    ticking=false;
    const y = window.pageYOffset || document.documentElement.scrollTop || 0;
    targetY = compute(y);
    currentY += (targetY - currentY) * EASE;
    heroImg.style.transform = `translate3d(0, ${currentY.toFixed(2)}px, 0)`;
  }

  window.addEventListener('scroll', onScroll, { passive:true });
  window.addEventListener('resize', ()=>{ measure(); requestTick(); }, { passive:true });
  mqReduce.addEventListener?.('change', ()=> mqReduce.matches ? (heroImg.style.transform='translate3d(0,0,0)') : (measure(),requestTick()));
  mqCoarse.addEventListener?.('change', ()=>{ measure(); requestTick(); });

  measure(); requestTick();
})();

/* =========================
   Goldener Regen – STABIL (kein Reset/Lag beim Scrollen)
   - Kein IntersectionObserver, keine Pausen
   - Resize skaliert Partikel-Positionen → optisch gleichbleibend
========================= */
(function(){
  const canvas = document.getElementById('glitterCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d', { alpha:true });

  let w=0, h=0, DPR=1, P=[];
  const DPR_CAP = Math.min(window.devicePixelRatio || 1.5, 2);

  function resize(scalePositions=true){
    const oldW = w, oldH = h;
    w = canvas.clientWidth|0;
    h = canvas.clientHeight|0;
    DPR = DPR_CAP;
    canvas.width  = Math.max(1, w * DPR);
    canvas.height = Math.max(1, h * DPR);
    ctx.setTransform(DPR,0,0,DPR,0,0);

    // skaliere bestehende Partikel, NICHT neu seeden → kein visueller Sprung
    if (scalePositions && oldW>0 && oldH>0){
      const sx = w/oldW, sy = h/oldH;
      for (const p of P){ p.x *= sx; p.y *= sy; }
    }
  }

  function makeParticle(){
    return {
      x: Math.random()*w,
      y: Math.random()*h,
      r: Math.random()*1.8 + 0.6,
      vx: (Math.random()-0.5)*0.22,
      vy: 0.28 + Math.random()*0.42,
      o: Math.random()*0.6 + 0.2
    };
  }

  function init(){
    P = [];
    const count = Math.min(150, Math.max(60, Math.round((w*h)/16000)));
    for (let i=0;i<count;i++) P.push(makeParticle());
  }

  function frame(){
    // leichter Trail für edlen Glow
    ctx.fillStyle = 'rgba(15,10,5,0.15)';
    ctx.fillRect(0,0,w,h);

    for (const p of P){
      p.x += p.vx;
      p.y += p.vy;
      if (p.y > h + 10) p.y = -10;
      if (p.x > w + 10) p.x = -10;
      if (p.x < -10)    p.x = w + 10;

      const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r*4);
      g.addColorStop(0, `rgba(255,220,150,${p.o})`);
      g.addColorStop(1, `rgba(255,220,150,0)`);
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r*4, 0, Math.PI*2);
      ctx.fill();
    }
    requestAnimationFrame(frame);
  }

  resize(false);
  init();
  frame();
  // bei Resize: Größe anpassen, Partikel proportional skalieren (kein Reset!)
  window.addEventListener('resize', ()=> resize(true), { passive:true });
})();

/* =========================
   Kontaktformular (FormSubmit)
========================= */
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

      // (Hinweis: Du wolltest „zeitnah“ zukünftig – Text hier unverändert gelassen)
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
