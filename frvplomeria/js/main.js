// js/main.js
// FRV Plomería - Interactions: menu, reveal, hero parallax, form -> localStorage, dashboard renderer

(function () {
  'use strict';

  console.log('FRV Plomería — main.js cargado');

  document.addEventListener('DOMContentLoaded', () => {
    initMenuToggle();
    initRevealOnScroll();
    initHeroParallax();
    initFormSave();
    initDashboard();
    closeNavOnLinkClick();
  });

  // ---------- Menu toggle for small screens ----------
  function initMenuToggle() {
    const btn = document.querySelector('.menu-toggle');
    const nav = document.querySelector('.main-nav');
    if (!btn || !nav) return;

    btn.addEventListener('click', () => {
      nav.classList.toggle('show');
      btn.classList.toggle('open');
    });
  }

  // Close nav when clicking a link (mobile friendly)
  function closeNavOnLinkClick() {
    const nav = document.querySelector('.main-nav');
    if (!nav) return;
    nav.addEventListener('click', (e) => {
      if (e.target.tagName === 'A' && nav.classList.contains('show')) {
        nav.classList.remove('show');
      }
    });
  }

  // ---------- Scroll reveal using IntersectionObserver ----------
  function initRevealOnScroll() {
    const reveals = document.querySelectorAll('.reveal');
    if (!reveals.length) return;

    const obs = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          // optionally unobserve to improve performance
          obs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15 });

    reveals.forEach((el) => obs.observe(el));
  }

  // ---------- Simple hero parallax (subtle) ----------
  function initHeroParallax() {
    const hero = document.getElementById('hero');
    if (!hero) return;

    // only enable on wider screens to avoid mobile jitter
    const minWidth = 900;
    if (window.innerWidth < minWidth) return;

    hero.addEventListener('mousemove', (e) => {
      const rect = hero.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width;   // 0..1
      const y = (e.clientY - rect.top) / rect.height;   // 0..1

      // small movement
      const moveX = (x - 0.5) * 6; // percent offset
      const moveY = (y - 0.5) * 6;

      hero.style.backgroundPosition = `${50 + moveX}% ${50 + moveY}%`;
    });

    // reset on mouseleave
    hero.addEventListener('mouseleave', () => {
      hero.style.backgroundPosition = '';
    });
  }

  // ---------- Form submit: save to localStorage (for dashboard) and allow actual submit to Formspree ----------
  function initFormSave() {
    const form = document.getElementById('requestForm') || document.querySelector('form[action*="formspree"]');
    if (!form) return;

    form.addEventListener('submit', (ev) => {
      try {
        const fd = new FormData(form);
        const entry = {
          nombre: fd.get('nombre') || '',
          cedula: fd.get('cedula') || '',
          direccion: fd.get('direccion') || '',
          problema: fd.get('problema') || '',
          fecha: new Date().toLocaleString()
        };

        const key = 'frv_appointments';
        const arr = JSON.parse(localStorage.getItem(key) || '[]');
        arr.push(entry);
        localStorage.setItem(key, JSON.stringify(arr));
        console.info('Solicitud guardada localmente (demo):', entry);
      } catch (err) {
        console.warn('No se pudo guardar localmente:', err);
      }
      // Let the form submit normally to Formspree (no preventDefault)
    });
  }

  // ---------- Dashboard renderer (dashboard.html) ----------
  function initDashboard() {
    if (!location.pathname.includes('dashboard.html')) return;

    const tbody = document.querySelector('#appointments tbody');
    if (!tbody) return;

    const key = 'frv_appointments';
    const items = JSON.parse(localStorage.getItem(key) || '[]');

    if (!items.length) {
      tbody.innerHTML = `<tr><td colspan="5" style="opacity:.7;padding:12px">No hay solicitudes guardadas.</td></tr>`;
      return;
    }

    tbody.innerHTML = '';
    items.forEach((it, idx) => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${escapeHtml(it.nombre)}</td>
        <td>${escapeHtml(it.cedula)}</td>
        <td>${escapeHtml(it.direccion)}</td>
        <td style="max-width:320px;white-space:pre-wrap">${escapeHtml(it.problema)}</td>
        <td><button data-idx="${idx}" class="btn btn-ghost small">Eliminar</button></td>
      `;
      tbody.appendChild(tr);
    });

    tbody.addEventListener('click', (e) => {
      const btn = e.target.closest('button[data-idx]');
      if (!btn) return;
      const idx = Number(btn.getAttribute('data-idx'));
      const arr = JSON.parse(localStorage.getItem(key) || '[]');
      arr.splice(idx, 1);
      localStorage.setItem(key, JSON.stringify(arr));
      // re-render (simple)
      initDashboard();
    });
  }

  // ---------- small utility: escapeHtml ----------
  function escapeHtml(input) {
    if (input === null || input === undefined) return '';
    return String(input).replace(/[&<>"'`=\/]/g, function (s) {
      return ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;',
        '/': '&#x2F;',
        '`': '&#x60;',
        '=': '&#x3D;'
      })[s];
    });
  }

})();
