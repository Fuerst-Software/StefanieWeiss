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
   Parallax & Canvas: NICHT benötigt
   → Effekt läuft vollständig in CSS, absolut scroll-unabhängig
========================= */

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
