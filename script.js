/* ===== Mobile Nav: fixed header, closable menu ===== */
const header = document.getElementById('site-nav');
const toggle = document.querySelector('.nav__toggle');
const menu   = document.getElementById('navmenu');

function openMenu(){
  menu.classList.add('open');
  document.body.classList.add('menu-open');
  toggle.setAttribute('aria-expanded','true');
  toggle.setAttribute('aria-label','Menü schließen');
}
function closeMenu(){
  menu.classList.remove('open');
  document.body.classList.remove('menu-open');
  toggle.setAttribute('aria-expanded','false');
  toggle.setAttribute('aria-label','Menü öffnen');
}
if (toggle && menu){
  toggle.addEventListener('click', ()=> menu.classList.contains('open') ? closeMenu() : openMenu());
  // close on link click
  menu.querySelectorAll('a.nav__link[href^="#"]').forEach(link=>{
    link.addEventListener('click', e=>{
      const id = link.getAttribute('href');
      const el = document.querySelector(id);
      if (el){
        e.preventDefault();
        closeMenu();
        el.scrollIntoView({behavior:'smooth', block:'start'});
      }
    });
  });
  // ESC closes
  window.addEventListener('keydown', e=>{ if(e.key==='Escape') closeMenu(); });
}

// shadow on scroll
window.addEventListener('scroll', ()=>{
  const y = window.scrollY || window.pageYOffset;
  header.style.boxShadow = y > 6 ? '0 12px 28px rgba(0,0,0,.35)' : 'none';
});

// smooth scroll for other internal links (outside the mobile menu)
document.querySelectorAll('a[href^="#"]:not(.nav__link)').forEach(a=>{
  a.addEventListener('click', e=>{
    const id = a.getAttribute('href');
    const el = document.querySelector(id);
    if (el){
      e.preventDefault();
      el.scrollIntoView({behavior:'smooth', block:'start'});
    }
  });
});

// footer year
const y = document.getElementById('year');
if (y) y.textContent = new Date().getFullYear();

/* ===== Glitter Canvas (mobile-optimiert, no jank) ===== */
(function(){
  const canvas = document.getElementById('glitterCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d', { alpha:true });

  const DPR = Math.min(1.25, window.devicePixelRatio || 1); // cap for mobile
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

  const spS = sprite(6, GOLD, GOLD0);
  const spS2= sprite(6, GOLD2, GOLD20);
  const spB = sprite(10,GOLD, GOLD0);

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
    const base = Math.min(140, Math.max(60, Math.round((vw*vh)/18000)));
    for(let i=0;i<base;i++){ const p={}; reset(p); P.push(p); }
  }

  // pause when not visible
  let inView = true;
  const hero = document.querySelector('.hero');
  if ('IntersectionObserver' in window && hero){
    new IntersectionObserver(([e])=>{ inView = e.isIntersecting; }, {threshold:0.05}).observe(hero);
  }
  document.addEventListener('visibilitychange', ()=>{ inView = !document.hidden; });

  // 30fps limiter
  let raf=0, last=performance.now(), acc=0;
  const STEP=1000/30;
  function loop(now){
    raf=requestAnimationFrame(loop);
    const dt=Math.min(64, now-last); last=now; acc+=dt;
    if(acc<STEP || !inView) return;
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

  const media = window.matchMedia('(prefers-reduced-motion: reduce)');
  function start(){
    cancelAnimationFrame(raf);
    if(media.matches) return;
    sizeCanvas(); init(); last=performance.now(); acc=0; raf=requestAnimationFrame(loop);
  }
  media.addEventListener?.('change', start);
  window.addEventListener('resize', ()=>{ clearTimeout(start._t); start._t=setTimeout(start,120); });
  start();
})();
