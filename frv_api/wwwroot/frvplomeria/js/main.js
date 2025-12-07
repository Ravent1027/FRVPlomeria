// js/main.js - Unificado
(() => {
  'use strict';

  const API_BASE = '/api'; // si tu API está en otra URL cambia aquí
  console.log('main.js cargado');

  document.addEventListener('DOMContentLoaded', () => {
    initMenuToggle();
    initReveal();
    initWhatsApp();
    initForms();
    initAdminDashboard();
  });

  /* ---------- MENU ---------- */
  function initMenuToggle() {
    const btn = document.querySelector('.menu-toggle');
    const nav = document.querySelector('.main-nav');
    if (!btn || !nav) return;
    btn.addEventListener('click', () => nav.classList.toggle('show'));
    nav.addEventListener('click', (e) => {
      if (e.target.tagName === 'A' && nav.classList.contains('show')) nav.classList.remove('show');
    });
  }

  /* ---------- REVEAL ---------- */
  function initReveal() {
    const reveals = document.querySelectorAll('.reveal');
    if (!reveals.length) return;
    const obs = new IntersectionObserver((entries) => {
      entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); obs.unobserve(e.target); }});
    }, { threshold: 0.15 });
    reveals.forEach(r => obs.observe(r));
  }

  /* ---------- WHATSAPP FLOAT ---------- */
  function initWhatsApp() {
    // already in HTML as anchor; can add small effect
    const el = document.querySelector('.btn-whatsapp');
    if (!el) return;
    el.addEventListener('mouseenter', () => el.style.transform = 'scale(1.07)');
    el.addEventListener('mouseleave', () => el.style.transform = '');
  }

  /* ---------- FORMS (contact/reservation) ---------- */
  function initForms() {
    const form = document.getElementById('requestForm');
    if (!form) return;

    const fechaInput = document.getElementById('fecha');
    const availabilityMsg = document.getElementById('availabilityMsg');

    // When user picks a date, check availability
    fechaInput?.addEventListener('change', async (e) => {
      const date = e.target.value;
      if (!date) return;
      try {
        const resp = await fetch(`${API_BASE}/reservations/availability?date=${encodeURIComponent(date)}`);
        if (!resp.ok) {
          availabilityMsg.textContent = 'No se pudo verificar disponibilidad.';
          return;
        }
        const j = await resp.json();
        availabilityMsg.textContent = `Cupos disponibles: ${j.available} / ${j.capacity}`;
        // disable submit if none available
        form.querySelector('button[type="submit"]').disabled = (j.available <= 0);
      } catch (err) {
        availabilityMsg.textContent = 'Error al verificar disponibilidad.';
      }
    });

    form.addEventListener('submit', async (ev) => {
      ev.preventDefault();
      const fd = new FormData(form);
      const payload = {
        Nombre: fd.get('nombre'),
        Telefono: fd.get('telefono'),
        Direccion: fd.get('direccion'),
        Provincia: fd.get('provincia'),
        Fecha: fd.get('fecha'),
        Hora: fd.get('hora'),
        Problema: fd.get('problema')
      };

      // basic validation
      if (!payload.Nombre || !payload.Telefono || !payload.Fecha || !payload.Hora) {
        alert('Por favor complete los campos obligatorios.');
        return;
      }

      try {
        const resp = await fetch(`${API_BASE}/reservations`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        const json = await resp.json();
        if (!resp.ok) {
          alert(json.error || 'Error al crear la reserva.');
          return;
        }

        alert('Reserva creada correctamente. ID: ' + (json.id ?? json.Id ?? 'OK'));
        form.reset();
        document.getElementById('availabilityMsg').textContent = '';
      } catch (err) {
        console.error(err);
        alert('Error de conexión con el servidor.');
      }
    });
  }

  /* ---------- ADMIN DASHBOARD ---------- */
  function initAdminDashboard() {
    const loginBox = document.getElementById('loginBox');
    const adminArea = document.getElementById('adminArea');
    if (!loginBox || !adminArea) return;

    const btnLogin = document.getElementById('btnLogin');
    const userInput = document.getElementById('adminUser');
    const passInput = document.getElementById('adminPass');
    const loginMsg = document.getElementById('loginMsg');
    const btnLoad = document.getElementById('btnLoad');
    const filterDate = document.getElementById('filterDate');
    const tbody = document.querySelector('#appointments tbody');

    const tokenKey = 'frv_admin_token';

    btnLogin.addEventListener('click', async () => {
      const username = userInput.value.trim();
      const password = passInput.value.trim();
      loginMsg.textContent = '';
      if (!username || !password) { loginMsg.textContent = 'Ingrese usuario y contraseña.'; return; }

      try {
        const resp = await fetch(`${API_BASE}/admin/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ Username: username, Password: password })
        });
        if (!resp.ok) {
          loginMsg.textContent = 'Credenciales incorrectas.';
          return;
        }
        const j = await resp.json();
        const token = j.token;
        localStorage.setItem(tokenKey, token);
        loginBox.style.display = 'none';
        adminArea.style.display = 'block';
        loadAppointments();
      } catch (err) {
        loginMsg.textContent = 'Error de conexión.';
      }
    });

    btnLoad.addEventListener('click', loadAppointments);

    async function loadAppointments() {
      const date = filterDate.value;
      let url = `${API_BASE}/reservations`;
      if (date) url += `?date=${encodeURIComponent(date)}`;
      try {
        const resp = await fetch(url, {
          headers: { 'Authorization': 'Bearer ' + (localStorage.getItem(tokenKey) || '') }
        });
        if (!resp.ok) {
          if (resp.status === 401) {
            alert('Debe iniciar sesión como admin.');
            loginBox.style.display = 'block';
            adminArea.style.display = 'none';
          }
          return;
        }
        const arr = await resp.json();
        renderTable(arr);
      } catch (err) {
        console.error(err);
      }
    }

    function renderTable(arr) {
      tbody.innerHTML = '';
      if (!arr.length) {
        tbody.innerHTML = '<tr><td colspan="8" style="padding:12px;opacity:.7">No hay reservas.</td></tr>';
        return;
      }
      arr.forEach(r => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td>${escapeHtml(r.Nombre ?? r.nombre ?? '')}</td>
          <td>${escapeHtml(r.Telefono ?? r.telefono ?? '')}</td>
          <td>${escapeHtml(r.Provincia ?? r.provincia ?? '')}</td>
          <td>${escapeHtml(r.Direccion ?? r.direccion ?? '')}</td>
          <td>${(r.Hora ?? r.hora ?? '').toString().substring(0,5)}</td>
          <td>${r.Costo ?? r.costo ?? r.Monto ?? r.monto ?? ''}</td>
          <td>${r.Estado ?? r.estado ?? ''}</td>
          <td>
            <button class="btn-complete btn btn-ghost" data-id="${r.Id ?? r.id}">Completar</button>
            <button class="btn-delete btn btn-ghost" data-id="${r.Id ?? r.id}">Eliminar</button>
          </td>
        `;
        tbody.appendChild(tr);
      });

      tbody.querySelectorAll('.btn-complete').forEach(b => b.addEventListener('click', async (e) => {
        const id = e.target.dataset.id;
        await updateStatus(id, 'COMPLETADA');
        loadAppointments();
      }));

      tbody.querySelectorAll('.btn-delete').forEach(b => b.addEventListener('click', async (e) => {
        const id = e.target.dataset.id;
        if (!confirm('Eliminar reserva?')) return;
        await deleteReservation(id);
        loadAppointments();
      }));
    }

    async function updateStatus(id, status) {
      try {
        const token = localStorage.getItem(tokenKey);
        const resp = await fetch(`${API_BASE}/reservations/${id}/status`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + (token || '')
          },
          body: JSON.stringify({ Status: status })
        });
        if (!resp.ok) {
          alert('Error al actualizar estado.');
        }
      } catch (err) { console.error(err); }
    }

    async function deleteReservation(id) {
      try {
        const token = localStorage.getItem(tokenKey);
        const resp = await fetch(`${API_BASE}/reservations/${id}`, {
          method: 'DELETE',
          headers: { 'Authorization': 'Bearer ' + (token || '') }
        });
        if (!resp.ok) alert('Error al eliminar.');
      } catch (err) { console.error(err); }
    }
  }

  /* ---------- small util ---------- */
  function escapeHtml(str) {
    if (!str) return '';
    return String(str).replace(/[&<>"'`=\/]/g, s => ({
      '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":"&#39;",'/':'&#x2F;','`':'&#x60;','=':'&#x3D;'
    })[s]);
  }

})();
