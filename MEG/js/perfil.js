// Lógica específica de la vista Perfil de Proveedor (perfil-proveedor.html)

let activeProfileTab = 'servicios';
let currentProviderId = null;

document.addEventListener('DOMContentLoaded', () => {
  initProfilePage();
});

function initProfilePage() {
  // Obtener el identificador del proveedor desde la URL
  const idParam = getUrlParam('id');
  currentProviderId = idParam ? parseInt(idParam) : 1; // Proveedor predeterminado (Karla Solano)
  
  const providers = getProviders();
  const provider = providers.find(p => p.id === currentProviderId) || providers[0];
  
  // Renderizar la información general y las pestañas
  renderProfileInfo(provider);
  renderServicesTab(provider);
  renderPortfolioTab(provider);
  renderReviewsTab(provider);
  renderAboutTab(provider);
  
  // Inicializar el calendario si el proveedor cuenta con plan Pro
  if (provider.isPro) {
    new MegCalendar('profile-calendar-container', provider.id);
  } else {
    // Si no cuenta con plan Pro, se oculta la pestaña de disponibilidad
    const calTab = document.querySelector('[data-profile-tab="disponibilidad"]');
    if (calTab) calTab.style.display = 'none';
  }

  // Configurar eventos de navegación entre pestañas
  const tabBtns = document.querySelectorAll('.profile-tab-btn');
  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const target = btn.getAttribute('data-profile-tab');
      switchProfileTab(target);
    });
  });

  // Configurar formulario de contacto rápido de la barra lateral
  const contactForm = document.getElementById('profile-quick-contact');
  if (contactForm) {
    contactForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = document.getElementById('contact-client-name').value;
      const desc = document.getElementById('contact-job-desc').value;
      
      showToast("Solicitud enviada", `Se envió tu solicitud a ${provider.name}. Te responderá en menos de ${provider.responseTime}.`, "success");
      contactForm.reset();
    });
  }

  // Botón para copiar el enlace del perfil
  const btnShare = document.getElementById('btn-share-profile');
  if (btnShare) {
    btnShare.addEventListener('click', () => {
      navigator.clipboard.writeText(window.location.href);
      showToast("Enlace copiado", "Enlace al perfil copiado al portapapeles.", "success");
    });
  }
}

function renderProfileInfo(p) {
  // Portada y foto de perfil
  const coverImg = document.getElementById('profile-banner');
  if (coverImg) coverImg.src = p.banner;
  const avatarImg = document.getElementById('profile-avatar');
  if (avatarImg) avatarImg.src = p.avatar;

  // Nombres y categorías del perfil
  document.getElementById('profile-name').textContent = p.businessName;
  document.getElementById('profile-owner').textContent = `Por ${p.name}`;
  document.getElementById('profile-subcat').textContent = p.subcategory;
  document.getElementById('profile-location').textContent = `📍 ${p.location}`;
  document.getElementById('profile-about-summary').textContent = p.about.substring(0, 120) + '...';

  // Calificación y reputación general
  document.getElementById('profile-rep-score').textContent = p.reputation.toFixed(1);
  document.getElementById('profile-rep-stars-count').textContent = `${p.reviews.length} calificaciones`;

  // Estadísticas clave de la barra lateral
  document.getElementById('widget-price').textContent = p.priceFormatted;
  document.getElementById('widget-response-time').textContent = p.responseTime;
  document.getElementById('widget-acceptance').textContent = p.acceptanceRate;

  // Insignias de verificación oficial
  const badgesContainer = document.getElementById('profile-badges-container');
  if (badgesContainer) {
    badgesContainer.innerHTML = getVerificationBadgeHTML(p.verification);
    if (p.isPro) {
      badgesContainer.insertAdjacentHTML('beforeend', `<span class="badge badge-top-provider"><i class="ph-star"></i> Proveedor Pro</span>`);
    }
  }
}

function switchProfileTab(tabId) {
  activeProfileTab = tabId;
  
  // Cambiar clases de los botones de pestañas
  const btns = document.querySelectorAll('.profile-tab-btn');
  btns.forEach(b => {
    if (b.getAttribute('data-profile-tab') === tabId) {
      b.classList.add('active');
    } else {
      b.classList.remove('active');
    }
  });

  // Cambiar visibilidad de las secciones de contenido
  const panels = document.querySelectorAll('.profile-tab-panel');
  panels.forEach(p => {
    if (p.id === `profile-tab-${tabId}`) {
      p.classList.add('active');
    } else {
      p.classList.remove('active');
    }
  });
}

// Rellenar la pestaña de servicios ofrecidos
function renderServicesTab(p) {
  const container = document.getElementById('profile-tab-servicios');
  if (!container) return;
  
  container.innerHTML = `<h3>Servicios Ofrecidos</h3><div style="margin-top: var(--spacing-md);"></div>`;
  
  p.services.forEach(s => {
    const cardHtml = `
      <div class="profile-service-card card mb-md">
        <div style="flex-grow: 1;">
          <h4 style="margin: 0; font-size: var(--font-size-md);">${s.name}</h4>
          <p style="font-size: var(--font-size-sm); color: var(--text-secondary); margin-top: var(--spacing-xs); line-height: 1.5;">${s.description}</p>
          <div style="margin-top: var(--spacing-sm); font-size: var(--font-size-xs); color: var(--text-muted); font-weight: 500;">
            <i class="ph-clock"></i> Duración estimada: <strong>${s.duration}</strong>
          </div>
        </div>
        <div style="text-align: right; min-width: 140px; display: flex; flex-direction: column; justify-content: space-between; align-items: flex-end;">
          <span style="font-size: var(--font-size-lg); font-weight: 800; color: var(--color-accent-blue); display: block;">¢${s.price.toLocaleString('es-CR')}</span>
          <button class="btn btn-primary btn-sm mt-sm w-full" onclick="openQuoteModal('${s.name}')">Solicitar</button>
        </div>
      </div>
    `;
    container.insertAdjacentHTML('beforeend', cardHtml);
  });
}

function openQuoteModal(serviceName) {
  const session = getSession();
  if (!session.isLoggedIn) {
    showToast("Iniciar sesión", "Debes iniciar sesión para solicitar cotizaciones.", "error");
    setTimeout(() => {
      window.location.href = `auth.html?tab=login&redirect=perfil-proveedor.html?id=${currentProviderId}`;
    }, 1500);
    return;
  }
  
  const label = document.getElementById('quote-service-label');
  if (label) {
    label.textContent = `Servicio seleccionado: ${serviceName}`;
  }
  openModal('quote-modal');
}

function submitQuoteRequest() {
  const desc = document.getElementById('quote-details-desc')?.value || "";
  const budget = document.getElementById('quote-budget-offer')?.value || "";
  
  showToast("Cotización enviada", "El proveedor revisará los detalles y te enviará una respuesta formal.", "success");
  closeModal('quote-modal');
}

// Rellenar la pestaña de galería de trabajos
function renderPortfolioTab(p) {
  const container = document.getElementById('profile-tab-portafolio');
  if (!container) return;
  
  if (p.portfolio.length === 0) {
    container.innerHTML = `
      <h3>Portafolio de Trabajos</h3>
      <div style="text-align:center; padding: var(--spacing-xl) 0;">
        <i class="ph-image-square" style="font-size: 48px; color: var(--text-muted);"></i>
        <p style="color:var(--text-secondary); margin-top: var(--spacing-sm);">Este proveedor aún no ha cargado fotos de sus trabajos anteriores.</p>
      </div>
    `;
    return;
  }
  
  let html = `<h3>Galería de Trabajos</h3><div class="portfolio-grid mt-lg">`;
  p.portfolio.forEach(item => {
    html += `
      <div class="portfolio-item">
        <img src="${item.image}" alt="${item.title}">
        <div class="portfolio-overlay">
          <h5 style="margin: 0; font-size: var(--font-size-sm);">${item.title}</h5>
          <span style="font-size: 10px; opacity: 0.8;">${item.date}</span>
        </div>
      </div>
    `;
  });
  html += `</div>`;
  container.innerHTML = html;
}

// Rellenar la pestaña de opiniones de clientes
function renderReviewsTab(p) {
  const container = document.getElementById('profile-tab-reseñas');
  const detailsBars = document.getElementById('profile-reviews-dimensions-bars');
  const listContainer = document.getElementById('profile-reviews-list');
  
  if (!container || !detailsBars || !listContainer) return;
  
  // Renderizar las barras multidimensionales
  renderReputationBars(detailsBars, p.reputationDetails);
  
  // Renderizar la lista de reseñas
  listContainer.innerHTML = '';
  p.reviews.forEach(rev => {
    const row = document.createElement('div');
    row.className = 'review-row mt-lg';
    row.innerHTML = `
      <div class="flex justify-between align-center mb-sm">
        <div class="flex align-center gap-md">
          <div style="width: 36px; height: 36px; border-radius: 50%; background-color: var(--color-accent-blue); color: white; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: var(--font-size-sm);">
            ${rev.clientName.charAt(0)}
          </div>
          <div>
            <strong style="font-size: var(--font-size-sm);">${rev.clientName}</strong>
            <span style="display: block; font-size: 10px; color: var(--text-muted);">${rev.date}</span>
          </div>
        </div>
        <div class="reputation-score-box">
          <i class="ph-star-fill reputation-star"></i>
          <span>${rev.rating.toFixed(1)}/10</span>
        </div>
      </div>
      <p style="font-size: var(--font-size-sm); color: var(--text-secondary); line-height: 1.6; margin: 0;">${rev.comment}</p>
    `;
    listContainer.appendChild(row);
  });
}

// Rellenar la pestaña de descripción del negocio
function renderAboutTab(p) {
  const container = document.getElementById('profile-tab-sobre-mi');
  if (!container) return;
  
  container.innerHTML = `
    <h3>Acerca del Negocio</h3>
    <p style="font-size: var(--font-size-sm); color: var(--text-secondary); line-height: 1.7; margin-top: var(--spacing-md);">${p.about}</p>
    <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: var(--spacing-md); margin-top: var(--spacing-xl); border-top: 1px solid var(--border-color); padding-top: var(--spacing-lg);">
      <div>
        <span style="font-size: 11px; color: var(--text-muted); text-transform: uppercase; font-weight: 600;">Años de experiencia</span>
        <strong style="display: block; font-size: var(--font-size-md); margin-top: 2px;">${p.experience} años en el sector</strong>
      </div>
      <div>
        <span style="font-size: 11px; color: var(--text-muted); text-transform: uppercase; font-weight: 600;">Especialidades</span>
        <strong style="display: block; font-size: var(--font-size-md); margin-top: 2px;">${p.subcategory}</strong>
      </div>
    </div>
  `;
}
