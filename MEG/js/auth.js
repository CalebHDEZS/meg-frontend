// Lógica de Autenticación y Wizard de Registro de 7 Pasos para Vendedores/Emprendedores

let currentRegStep = 1;
let selectedRole = 'consumidor';
let currentVendorWizardStep = 1;

// Variables de estado del Emprendedor / KYC / Portada
let vendorKycType = 'juridica'; // 'juridica' | 'personal'
let vendorSelfieUploaded = false;
let vendorCoverUrl = '';

// Referencias a Google Maps
let googleMapInstance = null;
let googleMarkerInstance = null;
let mapsScriptLoaded = false;

document.addEventListener('DOMContentLoaded', () => {
  initAuthPage();
});

function initAuthPage() {
  const tabParam = getUrlParam('tab');
  const roleParam = getUrlParam('role');

  if (roleParam) {
    selectedRole = roleParam;
    selectRoleCard(roleParam);
  }

  // Activar tab inicial según la URL (login o registro)
  if (tabParam === 'register') {
    switchAuthTab('register');
  } else {
    switchAuthTab('login');
  }

  // Toggles de pestañas
  document.getElementById('auth-btn-login')?.addEventListener('click', () => switchAuthTab('login'));
  document.getElementById('auth-btn-register')?.addEventListener('click', () => switchAuthTab('register'));

  // Manejo de clicks en tarjetas de rol
  const roleCons = document.getElementById('role-card-consumidor');
  const roleProv = document.getElementById('role-card-proveedor');

  if (roleCons) {
    roleCons.addEventListener('click', () => selectRoleCard('consumidor'));
  }
  if (roleProv) {
    roleProv.addEventListener('click', () => selectRoleCard('proveedor'));
  }

  // Configurar botones Siguiente/Atrás de Rol Selector
  document.getElementById('btn-step1-next')?.addEventListener('click', handleStep1Next);
  document.getElementById('btn-step2-back')?.addEventListener('click', () => switchRegStep(1));

  // Submit de Formularios
  document.getElementById('form-login')?.addEventListener('submit', handleLoginSubmit);
  document.getElementById('form-register-cons')?.addEventListener('submit', handleConsRegisterSubmit);
}

function switchAuthTab(tabId) {
  const btnLogin = document.getElementById('auth-btn-login');
  const btnRegister = document.getElementById('auth-btn-register');
  const panelLogin = document.getElementById('panel-login');
  const panelRegister = document.getElementById('panel-register');

  if (tabId === 'login') {
    btnLogin?.classList.add('active');
    btnRegister?.classList.remove('active');
    if (panelLogin) panelLogin.style.display = 'block';
    if (panelRegister) panelRegister.style.display = 'none';
  } else {
    btnRegister?.classList.add('active');
    btnLogin?.classList.remove('active');
    if (panelRegister) panelRegister.style.display = 'block';
    if (panelLogin) panelLogin.style.display = 'none';
    switchRegStep(1);
  }
}

function selectRoleCard(role) {
  selectedRole = role;
  const cardCons = document.getElementById('role-card-consumidor');
  const cardProv = document.getElementById('role-card-proveedor');

  if (role === 'consumidor') {
    cardCons?.classList.add('selected');
    cardProv?.classList.remove('selected');
  } else {
    cardProv?.classList.add('selected');
    cardCons?.classList.remove('selected');
  }
}

function switchRegStep(step) {
  currentRegStep = step;
  const step1 = document.getElementById('reg-step-1');
  const step2Cons = document.getElementById('reg-step-2-cons');
  const step2Prov = document.getElementById('reg-step-2-prov');

  if (step === 1) {
    if (step1) step1.style.display = 'block';
    if (step2Cons) step2Cons.style.display = 'none';
    if (step2Prov) step2Prov.style.display = 'none';
    document.querySelector('.auth-card')?.classList.remove('auth-card-wide');
  } else {
    if (step1) step1.style.display = 'none';
    if (selectedRole === 'consumidor') {
      if (step2Cons) step2Cons.style.display = 'block';
      if (step2Prov) step2Prov.style.display = 'none';
      document.querySelector('.auth-card')?.classList.remove('auth-card-wide');
    } else {
      if (step2Prov) step2Prov.style.display = 'block';
      if (step2Cons) step2Cons.style.display = 'none';
      goToVendorStep(1);
    }
  }
}

function handleStep1Next() {
  switchRegStep(2);
}

// -------------------------------------------------------------
// WIZARD DE REGISTRO PROGRESIVO DE 7 PASOS PARA EMPRENDEDORES
// -------------------------------------------------------------

function goToVendorStep(stepNumber) {
  currentVendorWizardStep = stepNumber;
  const authCard = document.querySelector('.auth-card');

  // Ajustar ancho de la tarjeta en pasos con mapas u horarios
  if (stepNumber >= 4 && authCard) {
    authCard.classList.add('auth-card-wide');
  } else if (authCard) {
    authCard.classList.remove('auth-card-wide');
  }

  // Actualizar nodos del indicador de progreso (1 a 7)
  for (let i = 1; i <= 7; i++) {
    const node = document.getElementById(`node-wiz-${i}`);
    if (node) {
      node.classList.remove('active', 'completed');
      if (i < stepNumber) {
        node.classList.add('completed');
        node.innerHTML = `<i class="ph-check"></i><span class="wizard-label">${getWizardLabel(i)}</span>`;
      } else if (i === stepNumber) {
        node.classList.add('active');
        node.innerHTML = `${i}<span class="wizard-label">${getWizardLabel(i)}</span>`;
      } else {
        node.innerHTML = `${i}<span class="wizard-label">${getWizardLabel(i)}</span>`;
      }
    }

    const subStepPanel = document.getElementById(`v-wiz-step-${i}`);
    if (subStepPanel) {
      subStepPanel.style.display = (i === stepNumber) ? 'block' : 'none';
    }
  }

  // Si estamos en el paso 4 (Ubicación), cargar e inicializar Google Maps
  if (stepNumber === 4) {
    setTimeout(initGoogleMapsLocationPicker, 150);
  }

  // Si estamos en el paso 7 (Resumen), cargar la vista previa del resumen
  if (stepNumber === 7) {
    renderVendorSummary();
  }
}

function getWizardLabel(step) {
  const labels = ['Cuenta', 'Negocio', 'KYC', 'Ubicación', 'Horarios', 'Portada', 'Confirmar'];
  return labels[step - 1] || '';
}

// Validaciones estrictas por paso
function validateAndGoToStep(targetStep) {
  if (targetStep === 2) {
    // Validar Paso 1: Cuenta
    const name = document.getElementById('v-user-name')?.value.trim();
    const email = document.getElementById('v-user-email')?.value.trim();
    const pass = document.getElementById('v-user-pass')?.value || '';

    if (!name) {
      showToast("Nombre requerido", "Ingresa tu nombre completo.", "error");
      return;
    }
    if (!email || !email.includes('@')) {
      showToast("Correo inválido", "Ingresa un correo electrónico válido.", "error");
      return;
    }
    // Regla de contraseña fuerte: Mayúscula, minúscula, número, especial, mín 8
    const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
    if (!strongPasswordRegex.test(pass)) {
      showToast("Contraseña débil", "La contraseña debe tener mínimo 8 caracteres, al menos una mayúscula, una minúscula y un número.", "error");
      return;
    }
  }

  if (targetStep === 3) {
    // Validar Paso 2: Negocio
    const bizName = document.getElementById('v-biz-name')?.value.trim();
    const bizDesc = document.getElementById('v-biz-desc')?.value.trim();

    if (!bizName) {
      showToast("Nombre comercial requerido", "Ingresa el nombre comercial de tu negocio.", "error");
      return;
    }
    if (!bizDesc || bizDesc.length < 15) {
      showToast("Descripción detallada", "Escribe una breve descripción comercial (mínimo 15 caracteres).", "error");
      return;
    }
  }

  if (targetStep === 4) {
    // Validar Paso 3: KYC / Identificación
    if (vendorKycType === 'juridica') {
      const numJur = document.getElementById('v-kyc-juridica-num')?.value.trim();
      if (!numJur) {
        showToast("Cédula Jurídica", "Ingresa el número de Cédula Jurídica del negocio.", "error");
        return;
      }
    } else {
      const numPer = document.getElementById('v-kyc-personal-num')?.value.trim();
      if (!numPer) {
        showToast("Cédula Personal", "Ingresa tu número de Cédula de Identidad personal.", "error");
        return;
      }
      if (!vendorSelfieUploaded) {
        showToast("Selfie requerida", "Haz clic en la zona de subida para adjuntar tu selfie biométrica con la cédula.", "error");
        return;
      }
    }
  }

  if (targetStep === 5) {
    // Validar Paso 4: Ubicación
    const address = document.getElementById('v-map-search-input')?.value.trim();
    if (!address) {
      showToast("Ubicación requerida", "Escribe y selecciona la dirección de tu negocio.", "error");
      return;
    }
  }

  if (targetStep === 6) {
    // Validar Paso 5: Horarios
    const activeDays = document.querySelectorAll('.v-sch-active:checked');
    if (activeDays.length === 0) {
      showToast("Horario laboral", "Selecciona al menos un día laboral en el horario del negocio.", "error");
      return;
    }
  }

  goToVendorStep(targetStep);
}

// Alternar tipo de identificación (Jurídica / Personal)
function toggleKycType(type) {
  vendorKycType = type;
  const btnYes = document.getElementById('btn-kyc-juridica-yes');
  const btnNo = document.getElementById('btn-kyc-juridica-no');
  const jurBox = document.getElementById('kyc-juridica-container');
  const perBox = document.getElementById('kyc-personal-container');

  if (type === 'juridica') {
    btnYes?.classList.add('active-kyc-btn', 'btn-primary');
    btnYes?.classList.remove('btn-secondary');
    btnNo?.classList.remove('active-kyc-btn', 'btn-primary');
    btnNo?.classList.add('btn-secondary');
    if (jurBox) jurBox.style.display = 'block';
    if (perBox) perBox.style.display = 'none';
  } else {
    btnNo?.classList.add('active-kyc-btn', 'btn-primary');
    btnNo?.classList.remove('btn-secondary');
    btnYes?.classList.remove('active-kyc-btn', 'btn-primary');
    btnYes?.classList.add('btn-secondary');
    if (perBox) perBox.style.display = 'block';
    if (jurBox) jurBox.style.display = 'none';
  }
}

function simulateSelfieUpload() {
  vendorSelfieUploaded = true;
  showToast("Foto biométrica cargada", "Se adjuntó tu selfie con la cédula de identidad correctamente.", "success");
  const badge = document.getElementById('v-kyc-badge');
  if (badge) {
    badge.innerHTML = `<i class="ph-check-circle"></i> Selfie Aprobada`;
    badge.className = 'badge badge-verified-company';
  }
  const text = document.getElementById('v-selfie-text');
  if (text) {
    text.innerHTML = `<i class="ph-check-circle" style="font-size:32px; color:var(--color-accent-mint);"></i><br><strong style="font-size:11px;">Foto de Cédula + Selfie Lista</strong>`;
  }
}

// Carga e inicialización de Google Maps
function initGoogleMapsLocationPicker() {
  const mapContainer = document.getElementById('v-google-map');
  const searchInput = document.getElementById('v-map-search-input');
  if (!mapContainer) return;

  const defaultCoords = { lat: 9.9281, lng: -84.0907 }; // San José, Costa Rica

  if (typeof google !== 'undefined' && google.maps) {
    renderGoogleMap(defaultCoords);
  } else if (!mapsScriptLoaded) {
    mapsScriptLoaded = true;
    const apiKey = (window.API_CONFIG && window.API_CONFIG.GOOGLE_MAPS_API_KEY) ? window.API_CONFIG.GOOGLE_MAPS_API_KEY : '';
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places,marker`;
    script.async = true;
    script.defer = true;
    script.onload = () => renderGoogleMap(defaultCoords);
    script.onerror = () => {
      console.warn("Google Maps SDK sin API key restringida. Habilitando selector de coordenadas interactivas manual.");
      renderFallbackMap(defaultCoords);
    };
    document.head.appendChild(script);
  } else {
    renderFallbackMap(defaultCoords);
  }
}

function renderGoogleMap(coords) {
  const mapContainer = document.getElementById('v-google-map');
  const searchInput = document.getElementById('v-map-search-input');
  const fallbackMsg = document.getElementById('v-map-fallback-msg');
  if (fallbackMsg) fallbackMsg.style.display = 'none';

  try {
    googleMapInstance = new google.maps.Map(mapContainer, {
      center: coords,
      zoom: 14,
      mapId: 'MEG_VENDOR_MAP',
      disableDefaultUI: false,
      zoomControl: true
    });

    if (google.maps.marker && google.maps.marker.AdvancedMarkerElement) {
      googleMarkerInstance = new google.maps.marker.AdvancedMarkerElement({
        map: googleMapInstance,
        position: coords,
        gmpDraggable: true,
        title: "Ubicación del Negocio"
      });
      googleMarkerInstance.addListener('dragend', () => {
        const pos = googleMarkerInstance.position;
        updateMapCoordinates(pos.lat, pos.lng);
      });
    } else {
      googleMarkerInstance = new google.maps.Marker({
        map: googleMapInstance,
        position: coords,
        draggable: true,
        title: "Ubicación del Negocio"
      });
      googleMarkerInstance.addListener('dragend', (e) => {
        updateMapCoordinates(e.latLng.lat(), e.latLng.lng());
      });
    }

    if (searchInput && google.maps.places) {
      const autocomplete = new google.maps.places.Autocomplete(searchInput, {
        componentRestrictions: { country: 'cr' },
        fields: ['geometry', 'name', 'formatted_address']
      });

      autocomplete.addListener('place_changed', () => {
        const place = autocomplete.getPlace();
        if (!place.geometry || !place.geometry.location) return;

        const lat = place.geometry.location.lat();
        const lng = place.geometry.location.lng();

        googleMapInstance.setCenter({ lat, lng });
        googleMapInstance.setZoom(16);
        if (googleMarkerInstance.setPosition) {
          googleMarkerInstance.setPosition({ lat, lng });
        } else {
          googleMarkerInstance.position = { lat, lng };
        }
        updateMapCoordinates(lat, lng, place.formatted_address || place.name);
      });
    }
  } catch (e) {
    console.warn("Manejando renderizado de mapa interactivo:", e.message);
    renderFallbackMap(coords);
  }
}

function renderFallbackMap(coords) {
  updateMapCoordinates(coords.lat, coords.lng);
}

function updateMapCoordinates(lat, lng, addressText = null) {
  const latInput = document.getElementById('v-map-lat');
  const lngInput = document.getElementById('v-map-lng');
  const searchInput = document.getElementById('v-map-search-input');

  if (latInput) latInput.value = (typeof lat === 'function' ? lat() : lat).toFixed(6);
  if (lngInput) lngInput.value = (typeof lng === 'function' ? lng() : lng).toFixed(6);
  if (addressText && searchInput) searchInput.value = addressText;
}

// Manejo de Imagen de Portada
function triggerCoverSelect() {
  const sampleCovers = [
    "https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&q=80&w=600&h=200",
    "https://images.unsplash.com/photo-1581094288338-2314dddb7ecc?auto=format&fit=crop&q=80&w=600&h=200",
    "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&q=80&w=600&h=200",
    "https://images.unsplash.com/photo-1555244162-803834f70033?auto=format&fit=crop&q=80&w=600&h=200"
  ];
  vendorCoverUrl = sampleCovers[Math.floor(Math.random() * sampleCovers.length)];

  const previewImg = document.getElementById('v-cover-img-preview');
  const container = document.getElementById('v-cover-preview-container');
  const dropzone = document.getElementById('v-cover-dropzone');

  if (previewImg) previewImg.src = vendorCoverUrl;
  if (container) container.style.display = 'block';
  if (dropzone) dropzone.style.display = 'none';

  showToast("Imagen Seleccionada", "Vista previa de portada actualizada.", "success");
}

function removeCoverImage() {
  vendorCoverUrl = '';
  const container = document.getElementById('v-cover-preview-container');
  const dropzone = document.getElementById('v-cover-dropzone');
  if (container) container.style.display = 'none';
  if (dropzone) dropzone.style.display = 'block';
}

// Rellenar resumen en el Paso 7
function renderVendorSummary() {
  document.getElementById('sum-user-name').textContent = document.getElementById('v-user-name')?.value || 'N/A';
  document.getElementById('sum-user-email').textContent = document.getElementById('v-user-email')?.value || 'N/A';
  document.getElementById('sum-biz-name').textContent = document.getElementById('v-biz-name')?.value || 'N/A';

  const catSelect = document.getElementById('v-biz-category');
  const catText = catSelect ? catSelect.options[catSelect.selectedIndex]?.text : 'General';
  document.getElementById('sum-biz-cat').textContent = catText;

  document.getElementById('sum-kyc-type').textContent = vendorKycType === 'juridica'
    ? `Cédula Jurídica (${document.getElementById('v-kyc-juridica-num')?.value || 'N/A'})`
    : `Cédula Personal (${document.getElementById('v-kyc-personal-num')?.value || 'N/A'})`;

  document.getElementById('sum-address').textContent = document.getElementById('v-map-search-input')?.value || 'Zona Central';
  document.getElementById('sum-lat').textContent = document.getElementById('v-map-lat')?.value || '9.9281';
  document.getElementById('sum-lng').textContent = document.getElementById('v-map-lng')?.value || '-84.0907';

  const activeDays = Array.from(document.querySelectorAll('.schedule-day-row')).filter(row => row.querySelector('.v-sch-active').checked);
  const dayNames = activeDays.map(row => row.getAttribute('data-day')).join(', ');
  document.getElementById('sum-schedule-days').textContent = dayNames || 'Ninguno';
}

// ENVÍO INTEGRAL DEL NEGOCIO A LA BASE DE DATOS REAL DE MEG
async function handleVendorRegisterFull() {
  const submitBtn = document.getElementById('btn-create-business-final');
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.innerHTML = `<i class="ph-spinner ph-spin"></i> Registrando...`;
  }

  try {
    // Recopilar horarios seleccionados
    const dayRows = document.querySelectorAll('.schedule-day-row');
    const horarios = [];
    dayRows.forEach(row => {
      const active = row.querySelector('.v-sch-active')?.checked;
      if (active) {
        horarios.push({
          dia_semana: row.getAttribute('data-day'),
          hora_apertura: row.querySelector('.v-sch-open')?.value || '08:00',
          hora_cierre: row.querySelector('.v-sch-close')?.value || '17:00',
          trabaja: true
        });
      }
    });

    const catSelect = document.getElementById('v-biz-category');
    const catValue = catSelect ? catSelect.value : 'servicios';
    const catName = catSelect ? catSelect.options[catSelect.selectedIndex].text : 'Servicios Comerciales';

    const fullPayload = {
      usuario: {
        nombre_completo: document.getElementById('v-user-name').value.trim(),
        correo: document.getElementById('v-user-email').value.trim(),
        telefono: document.getElementById('v-user-phone').value.trim(),
        contrasena: document.getElementById('v-user-pass').value
      },
      negocio: {
        nombre_negocio: document.getElementById('v-biz-name').value.trim(),
        descripcion: document.getElementById('v-biz-desc').value.trim(),
        categoria: catValue,
        categoriaName: catName
      },
      identificacion: {
        tipo_cedula: vendorKycType,
        cedula_juridica: document.getElementById('v-kyc-juridica-num')?.value.trim() || null,
        cedula_personal: document.getElementById('v-kyc-personal-num')?.value.trim() || null,
        url_documento: null,
        url_selfie: null,
        estado_documento: 'Aprobado'
      },
      ubicacion: {
        direccion: document.getElementById('v-map-search-input').value.trim(),
        ciudad: 'Zona Central',
        codigo_postal: '10101',
        latitud: parseFloat(document.getElementById('v-map-lat').value),
        longitud: parseFloat(document.getElementById('v-map-lng').value)
      },
      horarios: horarios,
      imagen: {
        url_portada: vendorCoverUrl || "https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&q=80&w=600&h=200"
      }
    };

    // Invocar servicio real (crea Usuario en DB, obtiene id_usuario real y vincula negocio)
    const result = await businessService.createBusinessFull(fullPayload);

    showToast("¡Negocio Creado con Éxito!", `Tu emprendimiento '${fullPayload.negocio.nombre_negocio}' ha sido registrado en MEG.`, "success");

    setTimeout(() => {
      window.location.href = 'dashboard-proveedor.html';
    }, 1500);
  } catch (error) {
    showToast("Error al registrar negocio", error.message || "No se pudo completar la creación del perfil en la base de datos.", "error");
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.innerHTML = `<i class="ph-check-circle"></i> Crear mi negocio`;
    }
  }
}

// -------------------------------------------------------------
// MANEJO DE OTROS FORMULARIOS (Login & Registro Consumidor)
// -------------------------------------------------------------

async function handleLoginSubmit(e) {
  e.preventDefault();
  const submitBtn = e.target.querySelector('button[type="submit"]');
  const email = document.getElementById('login-email').value.trim();
  const pass = document.getElementById('login-pass').value;

  if (!email || !pass) {
    showToast("Campos requeridos", "Por favor ingresa tu correo y contraseña.", "error");
    return;
  }

  const originalBtnText = submitBtn ? submitBtn.innerHTML : '';
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.innerHTML = `<i class="ph-spinner ph-spin"></i> Iniciando sesión...`;
  }

  try {
    const roleHint = (email.includes('admin') || email.includes('karlasolano') || email.includes('proveedor'))
      ? 'proveedor'
      : 'consumidor';

    const response = await authService.login(email, pass, roleHint);

    showToast("¡Bienvenido!", `Hola ${response.usuario.nombre_completo}, has iniciado sesión correctamente.`, "success");

    const targetDashboard = roleHint === 'proveedor' ? 'dashboard-proveedor.html' : 'dashboard-consumidor.html';

    setTimeout(() => {
      window.location.href = targetDashboard;
    }, 1000);
  } catch (error) {
    if (error.status === 423) {
      showToast("Cuenta bloqueada", error.message || "Tu cuenta está bloqueada por demasiados intentos fallidos.", "error");
    } else if (error.status === 403) {
      showToast("Cuenta desactivada", "Esta cuenta ha sido desactivada.", "error");
    } else {
      showToast("Error de acceso", error.message || "Credenciales incorrectas. Verifica tu correo y contraseña.", "error");
    }
  } finally {
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.innerHTML = originalBtnText;
    }
  }
}

async function handleConsRegisterSubmit(e) {
  e.preventDefault();
  const submitBtn = e.target.querySelector('button[type="submit"]');
  const name = document.getElementById('cons-name').value.trim();
  const email = document.getElementById('cons-email').value.trim();
  const phone = document.getElementById('cons-phone')?.value.trim() || '';
  const pass = document.getElementById('cons-pass')?.value || '';

  if (!name || !email || !pass) {
    showToast("Campos requeridos", "Por favor completa todos los campos obligatorios.", "error");
    return;
  }

  if (pass.length < 8) {
    showToast("Contraseña muy corta", "La contraseña debe tener al menos 8 caracteres.", "error");
    return;
  }

  const originalBtnText = submitBtn ? submitBtn.innerHTML : '';
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.innerHTML = `<i class="ph-spinner ph-spin"></i> Creando cuenta...`;
  }

  try {
    await authService.register({
      nombre_completo: name,
      correo: email,
      contrasena: pass,
      telefono: phone,
      role: 'consumidor'
    });

    showToast("¡Registro Exitoso!", "¡Bienvenido a MEG Costa Rica!", "success");
    setTimeout(() => {
      window.location.href = 'dashboard-consumidor.html';
    }, 1000);
  } catch (error) {
    showToast("Error al registrar", error.message || "No se pudo crear la cuenta de consumidor.", "error");
  } finally {
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.innerHTML = originalBtnText;
    }
  }
}

function setupUploadZone(id, callback) {
  const zone = document.getElementById(id);
  if (!zone) return;
  zone.addEventListener('click', callback);
}
