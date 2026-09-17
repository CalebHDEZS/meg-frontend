// Lógica del Dashboard del Consumidor

document.addEventListener('DOMContentLoaded', () => {
  initConsumerDashboard();
});

let activeConsTab = 'resumen';

async function initConsumerDashboard() {
  // Configurar pestañas
  const tabLinks = document.querySelectorAll('.dash-nav-link');
  tabLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const target = link.getAttribute('data-tab');
      switchConsTab(target);
    });
  });

  // Sincronizar perfil con la API si el usuario está autenticado
  if (typeof authService !== 'undefined' && authService.isAuthenticated()) {
    try {
      const meRes = await userService.getProfile();
      if (meRes && meRes.usuario) {
        updateConsumerUserUI(meRes.usuario);
      }
    } catch (e) {
      console.warn("Modo offline / error obteniendo perfil:", e.message);
    }
  } else {
    // Si no hay sesión autenticada con token JWT real
    const session = getSession();
    if (!session || !session.isLoggedIn) {
      showToast("Iniciar sesión", "Accediendo como vista previa. Inicia sesión para guardar tus datos en el backend real.", "info");
    }
  }

  // Render inicial de datos
  renderConsSummary();
  renderConsRequests();
  renderConsAppointments();
  renderConsFavorites();
  renderConsHistory();
  loadUserProfileData();

  // Formulario reseña submit
  const formReview = document.getElementById('form-add-review');
  if (formReview) {
    formReview.addEventListener('submit', handleAddReviewSubmit);
  }

  // Formularios de Perfil y Seguridad (API Real)
  const formUpdateProfile = document.getElementById('form-update-profile');
  if (formUpdateProfile) {
    formUpdateProfile.addEventListener('submit', handleUpdateProfileSubmit);
  }

  const formChangePassword = document.getElementById('form-change-password');
  if (formChangePassword) {
    formChangePassword.addEventListener('submit', handleChangePasswordSubmit);
  }

  const btnDeactivate = document.getElementById('btn-deactivate-account');
  if (btnDeactivate) {
    btnDeactivate.addEventListener('click', handleDeactivateAccountSubmit);
  }
}

function updateConsumerUserUI(usuario) {
  const nameEl = document.querySelector('.dash-user-card strong');
  if (nameEl) nameEl.textContent = usuario.nombre_completo;
}

function loadUserProfileData() {
  const user = (typeof authService !== 'undefined' && authService.getStoredUser()) || null;
  if (!user) return;

  const nameInput = document.getElementById('user-profile-name');
  const phoneInput = document.getElementById('user-profile-phone');
  const emailInput = document.getElementById('user-profile-email');

  if (nameInput) nameInput.value = user.nombre_completo || '';
  if (phoneInput) phoneInput.value = user.telefono || '';
  if (emailInput) emailInput.value = user.correo || '';
}

async function handleUpdateProfileSubmit(e) {
  e.preventDefault();
  const submitBtn = e.target.querySelector('button[type="submit"]');
  const name = document.getElementById('user-profile-name').value.trim();
  const phone = document.getElementById('user-profile-phone').value.trim();

  if (!name) {
    showToast("Nombre requerido", "Ingresa tu nombre completo.", "error");
    return;
  }

  const originalBtnText = submitBtn ? submitBtn.innerHTML : '';
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.innerHTML = `<i class="ph-spinner ph-spin"></i> Guardando...`;
  }

  try {
    const res = await userService.updateProfile({ nombre_completo: name, telefono: phone || null });
    showToast("Perfil Actualizado", "Los cambios han sido guardados en el backend de MEG.", "success");
    if (res.usuario) updateConsumerUserUI(res.usuario);
  } catch (err) {
    showToast("Error al actualizar", err.message || "No se pudo actualizar el perfil.", "error");
  } finally {
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.innerHTML = originalBtnText;
    }
  }
}

async function handleChangePasswordSubmit(e) {
  e.preventDefault();
  const submitBtn = e.target.querySelector('button[type="submit"]');
  const passCurrent = document.getElementById('pass-current').value;
  const passNew = document.getElementById('pass-new').value;

  if (!passCurrent || !passNew) {
    showToast("Campos requeridos", "Ingresa tu contraseña actual y la nueva contraseña.", "error");
    return;
  }

  if (passNew.length < 8) {
    showToast("Contraseña corta", "La nueva contraseña debe tener al menos 8 caracteres.", "error");
    return;
  }

  const originalBtnText = submitBtn ? submitBtn.innerHTML : '';
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.innerHTML = `<i class="ph-spinner ph-spin"></i> Cambiando contraseña...`;
  }

  try {
    await userService.changePassword(passCurrent, passNew);
    showToast("Contraseña Actualizada", "Tu contraseña ha sido cambiada con éxito.", "success");
    document.getElementById('form-change-password').reset();
  } catch (err) {
    showToast("Error de contraseña", err.message || "No se pudo cambiar la contraseña. Revisa la contraseña actual.", "error");
  } finally {
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.innerHTML = originalBtnText;
    }
  }
}

async function handleDeactivateAccountSubmit() {
  if (!confirm("¿Estás seguro de que deseas desactivar tu cuenta? Esta acción revocará todas tus sesiones activas.")) {
    return;
  }

  try {
    await userService.deactivateAccount();
    showToast("Cuenta Desactivada", "Tu cuenta ha sido desactivada correctamente.", "info");
    setTimeout(() => {
      window.location.href = 'index.html';
    }, 1200);
  } catch (err) {
    showToast("Error al desactivar", err.message || "No se pudo desactivar la cuenta.", "error");
  }
}

function switchConsTab(tabId) {
  activeConsTab = tabId;
  
  const links = document.querySelectorAll('.dash-nav-link');
  links.forEach(l => {
    if (l.getAttribute('data-tab') === tabId) {
      l.classList.add('active');
    } else {
      l.classList.remove('active');
    }
  });

  const panels = document.querySelectorAll('.dash-panel');
  panels.forEach(p => {
    if (p.id === `panel-${tabId}`) {
      p.style.display = 'block';
    } else {
      p.style.display = 'none';
    }
  });
  
  showToast("Vista cambiada", `Panel: ${tabId.toUpperCase()}`, "info");
}

// 1. RESUMEN
function renderConsSummary() {
  document.getElementById('c-kpi-solicitudes').textContent = "2 Activas";
  document.getElementById('c-kpi-citas').textContent = "1 Próxima";
  document.getElementById('c-kpi-favoritos').textContent = "2 Guardados";
}

// 2. MIS SOLICITUDES
const mockConsRequests = [
  { id: 401, provider: "Daniel Vargas (TechStudio)", service: "Landing Page Corporativa", date: "10 Jun, 2026", status: "En Proceso", price: "¢350,000" },
  { id: 402, provider: "Carlos Mora (Mora Soluciones)", service: "Detección de Fugas de Agua", date: "15 May, 2026", status: "Completado", price: "¢15,000" }
];

function renderConsRequests() {
  const container = document.getElementById('c-requests-list');
  if (!container) return;
  
  container.innerHTML = '';
  mockConsRequests.forEach(req => {
    const card = document.createElement('div');
    card.className = 'request-list-card card mb-md';
    
    let statusClass = req.status === 'En Proceso' ? 'badge-verified-identity' : 'badge-verified-company';
    
    card.innerHTML = `
      <div class="flex justify-between align-center">
        <div>
          <strong style="font-size: var(--font-size-md);">${req.provider}</strong>
          <div style="font-size: var(--font-size-xs); color: var(--text-secondary); margin-top: 4px;">
            Servicio: <strong>${req.service}</strong> | Fecha: <strong>${req.date}</strong>
          </div>
        </div>
        <div class="text-right">
          <span style="font-weight: 700; color: var(--color-accent-blue); display: block;">${req.price}</span>
          <span class="badge ${statusClass} mt-xs">${req.status}</span>
        </div>
      </div>
    `;
    container.appendChild(card);
  });
}

// 3. CITAS
function renderConsAppointments() {
  const container = document.getElementById('c-appointments-list');
  if (!container) return;
  
  const appointments = JSON.parse(localStorage.getItem('meg_appointments')) || [
    { date: "16 de Junio, 2026", time: "09:00 AM", providerId: 1, status: "Confirmada", notes: "Corte e hidratación" }
  ];

  const providers = getProviders();

  container.innerHTML = '';
  if (appointments.length === 0) {
    container.innerHTML = `<p style="font-size:var(--font-size-sm); color:var(--text-secondary);">No tienes citas próximas agendadas.</p>`;
    return;
  }

  appointments.forEach(app => {
    const providerObj = providers.find(p => p.id === app.providerId) || providers[0];
    const item = document.createElement('div');
    item.className = 'appointment-row flex justify-between align-center py-sm';
    item.style.borderBottom = '1px solid var(--border-color)';
    
    let statusClass = app.status === 'Confirmada' ? 'badge-verified-company' : 'badge-verified-identity';
    
    item.innerHTML = `
      <div>
        <strong style="font-size: var(--font-size-sm);">${providerObj.businessName}</strong>
        <div style="font-size: var(--font-size-xs); color: var(--text-secondary);">
          Día: <strong>${app.date}</strong> a las <strong>${app.time}</strong>
        </div>
      </div>
      <span class="badge ${statusClass}">${app.status}</span>
    `;
    container.appendChild(item);
  });
}

// 4. FAVORITOS
function renderConsFavorites() {
  const container = document.getElementById('c-favorites-list');
  if (!container) return;
  
  const providers = getProviders().slice(0, 2); // Simular 2 favoritos
  
  container.innerHTML = '';
  providers.forEach(p => {
    const card = document.createElement('div');
    card.className = 'card flex justify-between align-center p-sm mb-sm';
    card.style.padding = 'var(--spacing-md)';
    card.innerHTML = `
      <div class="flex align-center gap-md">
        <img src="${p.avatar}" alt="${p.name}" style="width: 44px; height: 44px; border-radius: 50%; object-fit: cover;">
        <div>
          <strong style="font-size: var(--font-size-sm); display: block;">${p.businessName}</strong>
          <span style="font-size: var(--font-size-xs); color: var(--text-secondary);">${p.subcategory}</span>
        </div>
      </div>
      <div class="flex gap-xs">
        <a href="perfil-proveedor.html?id=${p.id}" class="btn btn-secondary btn-sm">Ver Perfil</a>
        <button class="btn btn-primary btn-sm" onclick="showToast('Mensaje', 'Abriendo ventana de chat', 'info')"><i class="ph-chat-circle"></i></button>
      </div>
    `;
    container.appendChild(card);
  });
}

// 5. HISTORIAL (DEJAR RESEÑA)
let reviewTargetProviderId = 1; // Karla Solano por defecto

function renderConsHistory() {
  const container = document.getElementById('c-history-list');
  if (!container) return;
  
  const completedJobs = [
    { id: 1001, providerId: 1, business: "Karla Solano Studio", service: "Corte de Cabello", date: "25 de Mayo, 2026", price: "¢18,000", reviewed: false }
  ];
  
  container.innerHTML = '';
  completedJobs.forEach(job => {
    const card = document.createElement('div');
    card.className = 'card mb-md flex justify-between align-center';
    card.innerHTML = `
      <div>
        <h5 style="margin: 0; font-size: var(--font-size-sm);">${job.business}</h5>
        <span style="font-size: var(--font-size-xs); color: var(--text-secondary);">${job.service} • Finalizado el ${job.date}</span>
      </div>
      <div>
        <button class="btn btn-primary btn-sm" onclick="openAddReviewModal(${job.providerId})">Calificar servicio</button>
      </div>
    `;
    container.appendChild(card);
  });
}

function openAddReviewModal(providerId) {
  reviewTargetProviderId = providerId;
  const providers = getProviders();
  const provider = providers.find(p => p.id === providerId) || providers[0];
  
  const label = document.getElementById('review-provider-label');
  if (label) {
    label.textContent = `Dejar opinión para: ${provider.businessName}`;
  }
  openModal('review-modal');
}

function handleAddReviewSubmit(e) {
  e.preventDefault();
  
  const comment = document.getElementById('review-comment').value;
  const ratingGeneral = parseFloat(document.getElementById('review-rating-general').value);
  
  const punctualidad = parseFloat(document.getElementById('r-puntualidad').value);
  const calidad = parseFloat(document.getElementById('r-calidad').value);
  const comunicacion = parseFloat(document.getElementById('r-comunicacion').value);
  const cumplimiento = parseFloat(document.getElementById('r-cumplimiento').value);
  const trato = parseFloat(document.getElementById('r-trato').value);

  // Agregar la reseña en memoria
  const providers = getProviders();
  const index = providers.findIndex(p => p.id === reviewTargetProviderId);
  
  if (index !== -1) {
    const newRev = {
      clientName: getSession().userName || "Cliente Satisfecho",
      date: "Hoy",
      rating: ratingGeneral,
      comment: comment,
      dimensions: {
        puntualidad: punctualidad,
        calidad: calidad,
        comunicacion: comunicacion,
        cumplimiento: cumplimiento,
        trato: trato
      }
    };
    
    // Recalcular promedio general ponderado
    providers[index].reviews.push(newRev);
    const totalReviews = providers[index].reviews.length;
    const sumRep = providers[index].reviews.reduce((sum, r) => sum + r.rating, 0);
    providers[index].reputation = sumRep / totalReviews;
    
    // Guardar
    saveProviders(providers);
    
    showToast("Opinión Guardada", "Tu calificación multidimensional fue registrada con éxito.", "success");
    closeModal('review-modal');
    renderConsHistory();
  }
}
