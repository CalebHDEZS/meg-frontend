// Lógica del Dashboard del Proveedor

document.addEventListener('DOMContentLoaded', () => {
  initDashboard();
});

let activeTab = 'inicio';
let activeConversationId = null;

async function initDashboard() {
  // Cargar pestañas
  const tabLinks = document.querySelectorAll('.dash-nav-link');
  tabLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const target = link.getAttribute('data-tab');
      if (target) switchTab(target);
    });
  });

  // Sincronizar perfil con la API si el usuario está autenticado
  if (typeof authService !== 'undefined' && authService.isAuthenticated()) {
    try {
      const meRes = await userService.getProfile();
      if (meRes && meRes.usuario) {
        updateProviderUserUI(meRes.usuario);
      }
    } catch (e) {
      console.warn("Modo offline / error obteniendo perfil de proveedor:", e.message);
    }
  } else {
    const session = getSession();
    if (!session || !session.isLoggedIn) {
      showToast("Vista Previa", "Inicia sesión con tu cuenta de proveedor para conectar con el backend real.", "info");
    }
  }

  // Render inicial de datos
  renderDashboardHome();
  renderMyServices();
  renderRequests();
  renderChats();
  renderAppointmentsCalendar();
  renderAnalytics();
  loadProvUserProfileData();
  
  // Bind buttons
  const btnNewService = document.getElementById('btn-new-service');
  if (btnNewService) {
    btnNewService.addEventListener('click', () => openModal('service-modal'));
  }
  
  const formService = document.getElementById('form-add-service');
  if (formService) {
    formService.addEventListener('submit', handleAddService);
  }

  const btnSendMsg = document.getElementById('chat-btn-send');
  if (btnSendMsg) {
    btnSendMsg.addEventListener('click', handleSendMessage);
  }
  const inputMsg = document.getElementById('chat-input-field');
  if (inputMsg) {
    inputMsg.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') handleSendMessage();
    });
  }

  // Formularios de Perfil y Seguridad (API Real)
  const formUpdate = document.getElementById('form-prov-update-profile');
  if (formUpdate) {
    formUpdate.addEventListener('submit', handleProvUpdateProfileSubmit);
  }

  const formChangePass = document.getElementById('form-prov-change-password');
  if (formChangePass) {
    formChangePass.addEventListener('submit', handleProvChangePasswordSubmit);
  }

  const btnDeactivate = document.getElementById('btn-prov-deactivate-account');
  if (btnDeactivate) {
    btnDeactivate.addEventListener('click', handleProvDeactivateAccountSubmit);
  }
}

function updateProviderUserUI(usuario) {
  const nameEl = document.querySelector('.dash-user-card strong');
  if (nameEl) nameEl.textContent = usuario.nombre_completo;
}

function loadProvUserProfileData() {
  const user = (typeof authService !== 'undefined' && authService.getStoredUser()) || null;
  if (!user) return;

  const nameInput = document.getElementById('prov-profile-name');
  const phoneInput = document.getElementById('prov-profile-phone');
  const emailInput = document.getElementById('prov-profile-email');

  if (nameInput) nameInput.value = user.nombre_completo || '';
  if (phoneInput) phoneInput.value = user.telefono || '';
  if (emailInput) emailInput.value = user.correo || '';
}

async function handleProvUpdateProfileSubmit(e) {
  e.preventDefault();
  const submitBtn = e.target.querySelector('button[type="submit"]');
  const name = document.getElementById('prov-profile-name').value.trim();
  const phone = document.getElementById('prov-profile-phone').value.trim();

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
    showToast("Perfil Actualizado", "Datos de perfil actualizados en el backend de MEG.", "success");
    if (res.usuario) updateProviderUserUI(res.usuario);
  } catch (err) {
    showToast("Error al actualizar", err.message || "No se pudo actualizar el perfil.", "error");
  } finally {
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.innerHTML = originalBtnText;
    }
  }
}

async function handleProvChangePasswordSubmit(e) {
  e.preventDefault();
  const submitBtn = e.target.querySelector('button[type="submit"]');
  const passCurrent = document.getElementById('prov-pass-current').value;
  const passNew = document.getElementById('prov-pass-new').value;

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
    showToast("Contraseña Actualizada", "Tu contraseña ha sido cambiada con éxito en el backend.", "success");
    document.getElementById('form-prov-change-password').reset();
  } catch (err) {
    showToast("Error de contraseña", err.message || "No se pudo cambiar la contraseña. Revisa la contraseña actual.", "error");
  } finally {
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.innerHTML = originalBtnText;
    }
  }
}

async function handleProvDeactivateAccountSubmit() {
  if (!confirm("¿Estás seguro de que deseas desactivar tu cuenta de proveedor? Esta acción revocará todas tus sesiones activas.")) {
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

function switchTab(tabId) {
  activeTab = tabId;
  
  // Cambiar clases de links
  const links = document.querySelectorAll('.dash-nav-link');
  links.forEach(l => {
    if (l.getAttribute('data-tab') === tabId) {
      l.classList.add('active');
    } else {
      l.classList.remove('active');
    }
  });

  // Cambiar visibilidad de paneles
  const panels = document.querySelectorAll('.dash-panel');
  panels.forEach(p => {
    if (p.id === `panel-${tabId}`) {
      p.style.display = 'block';
    } else {
      p.style.display = 'none';
    }
  });
  
  showToast("Vista cambiada", `Panel cargado: ${tabId.toUpperCase()}`, "info");
}

// 1. INICIO (KPIs y Actividad)
function renderDashboardHome() {
  const providers = getProviders();
  const session = getSession();
  const provider = providers.find(p => p.id === session.userId) || providers[0];

  // Actualizar KPI UI
  document.getElementById('kpi-solicitudes').textContent = "8";
  document.getElementById('kpi-clientes').textContent = "14";
  document.getElementById('kpi-ingresos').textContent = "¢240,000";
  document.getElementById('kpi-reputacion').textContent = provider.reputation.toFixed(1);
}

// 2. MIS SERVICIOS (CRUD simulado)
function renderMyServices() {
  const container = document.getElementById('services-list-container');
  if (!container) return;
  
  const providers = getProviders();
  const session = getSession();
  const provider = providers.find(p => p.id === session.userId) || providers[0];

  container.innerHTML = '';
  provider.services.forEach(s => {
    const card = document.createElement('div');
    card.className = 'service-list-card flex justify-between align-center';
    card.innerHTML = `
      <div>
        <h5 style="margin: 0; font-size: var(--font-size-sm);">${s.name}</h5>
        <p style="font-size: var(--font-size-xs); color: var(--text-secondary); margin: 0;">${s.description}</p>
        <span class="badge badge-verified-identity mt-xs">¢${s.price.toLocaleString('es-CR')} • ${s.duration}</span>
      </div>
      <div class="flex gap-xs">
        <button class="btn btn-secondary btn-sm" onclick="showToast('Editar', 'Funcionalidad de edición en desarrollo en prototipo', 'info')"><i class="ph-pencil"></i></button>
        <button class="btn btn-tertiary btn-sm" style="color: var(--color-danger);" onclick="handleDeleteService('${s.id}')"><i class="ph-trash"></i></button>
      </div>
    `;
    container.appendChild(card);
  });
}

function handleAddService(e) {
  e.preventDefault();
  const name = document.getElementById('new-service-name').value;
  const desc = document.getElementById('new-service-desc').value;
  const price = parseInt(document.getElementById('new-service-price').value);
  const dur = document.getElementById('new-service-duration').value;

  const session = getSession();
  const providers = getProviders();
  const provIndex = providers.findIndex(p => p.id === session.userId);
  
  if (provIndex !== -1) {
    const newService = {
      id: "s_new_" + Date.now(),
      name: name,
      description: desc,
      price: price,
      duration: dur
    };
    
    providers[provIndex].services.push(newService);
    saveProviders(providers);
    
    renderMyServices();
    closeModal('service-modal');
    document.getElementById('form-add-service').reset();
    showToast("Servicio Creado", "Tu nuevo servicio se ha publicado con éxito.", "success");
  }
}

function handleDeleteService(serviceId) {
  const session = getSession();
  const providers = getProviders();
  const provIndex = providers.findIndex(p => p.id === session.userId);
  
  if (provIndex !== -1) {
    providers[provIndex].services = providers[provIndex].services.filter(s => s.id !== serviceId);
    saveProviders(providers);
    renderMyServices();
    showToast("Servicio Eliminado", "El servicio se removió del perfil público.", "warning");
  }
}

// 3. SOLICITUDES
const mockRequests = [
  { id: 101, client: "Roberto Gómez", service: "Maquillaje de Novia", date: "24 Jun, 2026", budget: "¢25,000", status: "Pendiente" },
  { id: 102, client: "Camila Vargas", service: "Corte de Cabello + Hidratación", date: "18 Jun, 2026", budget: "¢18,000", status: "Aceptada" },
  { id: 103, client: "Felipe Soto", service: "Balayage de Tendencia", date: "12 Jun, 2026", budget: "¢45,000", status: "Completada" }
];

function renderRequests() {
  const container = document.getElementById('requests-list-container');
  if (!container) return;
  
  container.innerHTML = '';
  mockRequests.forEach(r => {
    const card = document.createElement('div');
    card.className = 'request-list-card card mb-md';
    
    let statusClass = 'badge-verified-identity';
    if (r.status === 'Aceptada') statusClass = 'badge-verified-company';
    if (r.status === 'Completada') statusClass = 'badge-top-provider';
    
    let actionsHtml = '';
    if (r.status === 'Pendiente') {
      actionsHtml = `
        <div class="flex gap-sm mt-md">
          <button class="btn btn-primary btn-sm" onclick="handleAcceptRequest(${r.id})">Aceptar</button>
          <button class="btn btn-secondary btn-sm" onclick="handleRejectRequest(${r.id})">Rechazar</button>
        </div>
      `;
    }

    card.innerHTML = `
      <div class="flex justify-between align-center">
        <div>
          <strong style="font-size: var(--font-size-md);">${r.client}</strong>
          <div style="font-size: var(--font-size-xs); color: var(--text-secondary); margin-top: 4px;">
            Servicio: <strong>${r.service}</strong> | Fecha: <strong>${r.date}</strong>
          </div>
        </div>
        <div class="text-right">
          <span style="font-weight: 700; color: var(--color-accent-blue); display: block;">${r.budget}</span>
          <span class="badge ${statusClass} mt-xs">${r.status}</span>
        </div>
      </div>
      ${actionsHtml}
    `;
    container.appendChild(card);
  });
}

function handleAcceptRequest(requestId) {
  const req = mockRequests.find(r => r.id === requestId);
  if (req) {
    req.status = 'Aceptada';
    renderRequests();
    showToast("Solicitud Aceptada", `Has aceptado la solicitud de ${req.client}`, "success");
  }
}

function handleRejectRequest(requestId) {
  const req = mockRequests.find(r => r.id === requestId);
  if (req) {
    req.status = 'Rechazada';
    renderRequests();
    showToast("Solicitud Rechazada", `Rechazaste la solicitud de ${req.client}`, "warning");
  }
}

// 4. CHAT / MENSAJES
const mockConversations = [
  {
    id: 201,
    name: "Roberto Gómez",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=60&h=60",
    lastMsg: "Hola Karla, ¿tienes espacio disponible el sábado por la tarde?",
    time: "10:30 AM",
    messages: [
      { sender: 'client', text: "Hola Karla, ¿tienes espacio disponible el sábado por la tarde?", time: "10:30 AM" }
    ]
  },
  {
    id: 202,
    name: "Camila Vargas",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=60&h=60",
    lastMsg: "¡Perfecto! Nos vemos el jueves entonces.",
    time: "Ayer",
    messages: [
      { sender: 'prov', text: "Claro Camila, tu cita de corte está agendada para el jueves a las 10:30 am.", time: "Ayer" },
      { sender: 'client', text: "¡Perfecto! Nos vemos el jueves entonces.", time: "Ayer" }
    ]
  }
];

function renderChats() {
  const listContainer = document.getElementById('chat-list-container');
  if (!listContainer) return;
  
  listContainer.innerHTML = '';
  mockConversations.forEach(c => {
    const item = document.createElement('div');
    item.className = `chat-list-item flex align-center gap-md ${activeConversationId === c.id ? 'active' : ''}`;
    item.onclick = () => selectConversation(c.id);
    
    item.innerHTML = `
      <img src="${c.avatar}" alt="${c.name}" class="chat-list-avatar">
      <div class="flex-grow">
        <div class="flex justify-between">
          <strong style="font-size: var(--font-size-sm);">${c.name}</strong>
          <span style="font-size: 10px; color: var(--text-muted);">${c.time}</span>
        </div>
        <p class="chat-list-preview">${c.lastMsg}</p>
      </div>
    `;
    listContainer.appendChild(item);
  });
}

function selectConversation(convId) {
  activeConversationId = convId;
  renderChats();
  
  const conversation = mockConversations.find(c => c.id === convId);
  const activeChat = document.getElementById('active-chat-window');
  const chatHeader = document.getElementById('chat-active-header');
  const chatMsgs = document.getElementById('chat-messages-container');
  
  if (activeChat && chatHeader && chatMsgs) {
    activeChat.style.display = 'flex';
    document.getElementById('chat-empty-state').style.display = 'none';
    
    chatHeader.innerHTML = `
      <div class="flex align-center gap-md">
        <img src="${conversation.avatar}" alt="${conversation.name}" style="width: 40px; height: 40px; border-radius: 50%; object-fit: cover;">
        <div>
          <h5 style="margin: 0; font-size: var(--font-size-sm);">${conversation.name}</h5>
          <span style="font-size: 10px; color: var(--color-accent-mint); font-weight: 600;"><i class="ph-circle-fill"></i> Activo ahora</span>
        </div>
      </div>
    `;
    
    renderActiveMessages(conversation.messages);
  }
}

function renderActiveMessages(messages) {
  const container = document.getElementById('chat-messages-container');
  if (!container) return;
  
  container.innerHTML = '';
  messages.forEach(m => {
    const bubble = document.createElement('div');
    bubble.className = `chat-bubble-container flex ${m.sender === 'prov' ? 'justify-end' : ''}`;
    
    bubble.innerHTML = `
      <div class="chat-bubble ${m.sender === 'prov' ? 'sent' : 'received'}">
        <p style="margin: 0; font-size: var(--font-size-sm);">${m.text}</p>
        <span style="display: block; text-align: right; font-size: 9px; color: var(--text-muted); margin-top: 4px;">${m.time}</span>
      </div>
    `;
    container.appendChild(bubble);
  });
  
  // Auto Scroll al fondo
  container.scrollTop = container.scrollHeight;
}

function handleSendMessage() {
  const input = document.getElementById('chat-input-field');
  if (!input || !input.value.trim() || !activeConversationId) return;
  
  const text = input.value.trim();
  input.value = '';
  
  const conversation = mockConversations.find(c => c.id === activeConversationId);
  
  const newMsg = {
    sender: 'prov',
    text: text,
    time: new Date().toLocaleTimeString('es-CR', { hour: '2-digit', minute: '2-digit' })
  };
  
  conversation.messages.push(newMsg);
  conversation.lastMsg = text;
  conversation.time = "Ahora";
  
  renderActiveMessages(conversation.messages);
  renderChats();
  
  // Simular respuesta del cliente tras 1 segundo
  setTimeout(() => {
    const replies = [
      "¡Excelente! Muchas gracias por responder rápido.",
      "Perfecto, ¿cuál es el precio final estimado?",
      "De acuerdo, ya procedo con el pago correspondiente.",
      "Entendido. Nos comunicamos más tarde."
    ];
    const clientReply = {
      sender: 'client',
      text: replies[Math.floor(Math.random() * replies.length)],
      time: new Date().toLocaleTimeString('es-CR', { hour: '2-digit', minute: '2-digit' })
    };
    
    conversation.messages.push(clientReply);
    conversation.lastMsg = clientReply.text;
    renderActiveMessages(conversation.messages);
    renderChats();
    showToast("Nuevo mensaje", `Roberto Gómez envió un mensaje.`, "info");
  }, 1200);
}

// 5. CITAS CALENDARIO
function renderAppointmentsCalendar() {
  // Simplemente rellenar la lista de citas en el panel
  const container = document.getElementById('dashboard-appointments-list');
  if (!container) return;
  
  const appointments = JSON.parse(localStorage.getItem('meg_appointments')) || [
    { id: 301, date: "16 de Junio, 2026", time: "09:00 AM", clientName: "Carlos Fallas", status: "Confirmada" },
    { id: 302, date: "18 de Junio, 2026", time: "02:00 PM", clientName: "Sofia Méndez", status: "Pendiente" }
  ];
  
  container.innerHTML = '';
  appointments.forEach(app => {
    const item = document.createElement('div');
    item.className = 'appointment-row flex justify-between align-center py-sm';
    item.style.borderBottom = '1px solid var(--border-color)';
    
    let statusClass = app.status.includes('Confirmada') ? 'badge-verified-company' : 'badge-verified-identity';
    
    item.innerHTML = `
      <div>
        <strong style="font-size: var(--font-size-sm);">${app.clientName}</strong>
        <div style="font-size: var(--font-size-xs); color: var(--text-secondary);">
          ${app.date} a las <strong>${app.time}</strong>
        </div>
      </div>
      <div class="flex gap-sm align-center">
        <span class="badge ${statusClass}">${app.status}</span>
        ${app.status.includes('Pendiente') ? `<button class="btn btn-primary btn-sm" onclick="handleConfirmAppointment(${app.id})">Confirmar</button>` : ''}
      </div>
    `;
    container.appendChild(item);
  });
}

function handleConfirmAppointment(appId) {
  let appointments = JSON.parse(localStorage.getItem('meg_appointments')) || [];
  const appIndex = appointments.findIndex(a => a.id === appId);
  
  if (appIndex !== -1) {
    appointments[appIndex].status = "Confirmada";
    localStorage.setItem('meg_appointments', JSON.stringify(appointments));
    renderAppointmentsCalendar();
    showToast("Cita Confirmada", "Se ha enviado un correo de confirmación al cliente.", "success");
  } else {
    // Si no está en LocalStorage, cambiar estado en la simulación estática
    showToast("Cita Confirmada", "Se ha agendado con éxito.", "success");
  }
}

// 6. ANALÍTICAS (Gráficos visuales CSS)
function renderAnalytics() {
  const chartLine = document.getElementById('analytics-chart-line');
  if (!chartLine) return;
  
  // Rellenar barras representativas de analíticas
  chartLine.innerHTML = `
    <div style="display: flex; height: 180px; align-items: flex-end; justify-content: space-around; padding-top: 20px;">
      <div class="bar-col" style="height: 40%; width: 30px; background-color: var(--border-color-dark); border-radius: 4px; display:flex; flex-direction:column; justify-content:flex-end; align-items:center;"><span style="font-size:10px; margin-bottom:-20px;">Ene</span></div>
      <div class="bar-col" style="height: 55%; width: 30px; background-color: var(--border-color-dark); border-radius: 4px; display:flex; flex-direction:column; justify-content:flex-end; align-items:center;"><span style="font-size:10px; margin-bottom:-20px;">Feb</span></div>
      <div class="bar-col" style="height: 70%; width: 30px; background-color: var(--border-color-dark); border-radius: 4px; display:flex; flex-direction:column; justify-content:flex-end; align-items:center;"><span style="font-size:10px; margin-bottom:-20px;">Mar</span></div>
      <div class="bar-col" style="height: 60%; width: 30px; background-color: var(--border-color-dark); border-radius: 4px; display:flex; flex-direction:column; justify-content:flex-end; align-items:center;"><span style="font-size:10px; margin-bottom:-20px;">Abr</span></div>
      <div class="bar-col" style="height: 85%; width: 30px; background-color: var(--color-accent-purple); border-radius: 4px; display:flex; flex-direction:column; justify-content:flex-end; align-items:center;"><span style="font-size:10px; margin-bottom:-20px; color:var(--color-accent-purple); font-weight:700;">May</span></div>
      <div class="bar-col" style="height: 95%; width: 30px; background-color: var(--color-accent-blue); border-radius: 4px; display:flex; flex-direction:column; justify-content:flex-end; align-items:center;"><span style="font-size:10px; margin-bottom:-20px; color:var(--color-accent-blue); font-weight:700;">Jun</span></div>
    </div>
  `;
}
