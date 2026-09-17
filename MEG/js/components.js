// Navegación, desplazamiento suave, transiciones y animaciones al hacer scroll
document.addEventListener('DOMContentLoaded', () => {
  initNavbar();
  setupAnchorScrollingAndTransitions();
  setupScrollReveal();
});

// Función para realizar un desplazamiento suave personalizado hacia una sección
function smoothScrollTo(targetSelector, duration = 1800) {
  const target = document.querySelector(targetSelector);
  if (!target) return;
  
  const navbar = document.querySelector('.navbar');
  const navbarHeight = navbar ? navbar.offsetHeight : 72;
  const targetPosition = target.getBoundingClientRect().top + window.pageYOffset - navbarHeight - 10;
  const startPosition = window.pageYOffset;
  const distance = targetPosition - startPosition;
  let startTime = null;

  function ease(t, b, c, d) {
    t /= d / 2;
    if (t < 1) return c / 2 * t * t * t + b;
    t -= 2;
    return c / 2 * (t * t * t + 2) + b;
  }

  function animation(currentTime) {
    if (startTime === null) startTime = currentTime;
    const timeElapsed = currentTime - startTime;
    const run = ease(timeElapsed, startPosition, distance, duration);
    window.scrollTo(0, run);
    if (timeElapsed < duration) {
      requestAnimationFrame(animation);
    } else {
      window.scrollTo(0, targetPosition);
    }
  }

  requestAnimationFrame(animation);
}

function setupAnchorScrollingAndTransitions() {
  // 1. Desvanecer y ocultar la pantalla de carga inicial
  const loadingScreen = document.getElementById('loading-screen');
  if (loadingScreen) {
    setTimeout(() => {
      loadingScreen.classList.add('fade-out');
      setTimeout(() => {
        loadingScreen.style.display = 'none';
      }, 400);
    }, 1200); // Duración de 1.2 segundos para una carga ágil
  }

  // 2. Interceptar clics en enlaces con anclas (#) o enlaces de navegación interna
  document.body.addEventListener('click', (e) => {
    const anchor = e.target.closest('a');
    if (!anchor) return;
    
    const href = anchor.getAttribute('href');
    if (!href) return;
    
    // Comprobar si el enlace es un desplazamiento a una sección interna
    let targetId = null;
    if (href.startsWith('#')) {
      targetId = href;
    } else if (href.includes('index.html#')) {
      const currentPage = window.location.pathname.split('/').pop() || 'index.html';
      if (currentPage === 'index.html' || currentPage === '') {
        targetId = href.substring(href.indexOf('#'));
      }
    }
    
    if (targetId && targetId !== '#') {
      const targetElement = document.querySelector(targetId);
      if (targetElement) {
        e.preventDefault();
        smoothScrollTo(targetId, 1800); // 1.8 segundos de desplazamiento suave
        return;
      }
    }

    // Comprobar si es una transición a otra página HTML de la aplicación
    const isInternal = href.endsWith('.html') || href.includes('.html?') || (href.includes('.html#') && !targetId);
    const isBlank = anchor.getAttribute('target') === '_blank';
    
    if (isInternal && !isBlank) {
      e.preventDefault();
      if (loadingScreen) {
        loadingScreen.style.display = 'flex';
        loadingScreen.classList.remove('fade-out');
        setTimeout(() => {
          window.location.href = href;
        }, 300); // Transición de salida de 300ms
      } else {
        window.location.href = href;
      }
    }
  });

  // 3. Desplazar automáticamente si la URL incluye una etiqueta de sección (#) al cargar
  if (window.location.hash) {
    const hash = window.location.hash;
    const target = document.querySelector(hash);
    if (target) {
      window.scrollTo(0, 0);
      const delay = loadingScreen ? 1500 : 300; // Esperar animación de carga
      setTimeout(() => {
        smoothScrollTo(hash, 2000);
      }, delay);
    }
  }
}

// Animaciones al hacer scroll con observador de intersección
function setupScrollReveal() {
  const elements = document.querySelectorAll('.reveal-on-scroll');
  if (elements.length === 0) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('revealed');
        observer.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.05, // Se activa cuando el 5% del elemento entra en pantalla
    rootMargin: '0px 0px -40px 0px'
  });

  elements.forEach(el => observer.observe(el));
}

function initNavbar() {
  const navbar = document.querySelector('.navbar');
  if (navbar) {
    window.addEventListener('scroll', () => {
      if (window.scrollY > 20) {
        navbar.classList.add('scrolled');
      } else {
        navbar.classList.remove('scrolled');
      }
    });
    
    setupMobileMenu(navbar);
  }
}

function setupMobileMenu(navbar) {
  const container = navbar.querySelector('.container');
  if (!container) return;

  // Crear el botón de hamburguesa si aún no existe
  let toggleBtn = container.querySelector('.mobile-menu-toggle');
  if (!toggleBtn) {
    toggleBtn = document.createElement('button');
    toggleBtn.className = 'mobile-menu-toggle';
    toggleBtn.setAttribute('aria-label', 'Abrir menú');
    toggleBtn.innerHTML = '<i class="ph-list"></i>';
    container.appendChild(toggleBtn);
  }

  // Crear el menú lateral y la capa de fondo si aún no existen
  let drawer = document.querySelector('.mobile-menu-drawer');
  let overlay = document.querySelector('.mobile-menu-overlay');

  if (!drawer) {
    drawer = document.createElement('div');
    drawer.className = 'mobile-menu-drawer';
    drawer.innerHTML = `
      <div class="mobile-menu-header">
        <div class="logo-container" onclick="window.location.href='index.html'">
          <div class="logo-icon"><img src="logo.png" alt="MEG Logo"></div>
          <span>MEG</span>
        </div>
        <button class="mobile-menu-close" aria-label="Cerrar menú">
          <i class="ph-x"></i>
        </button>
      </div>
      <div class="mobile-menu-body">
        <div class="mobile-nav-links">
          <a href="busqueda.html" class="mobile-nav-link">Explorar servicios</a>
          <a href="index.html#seccion-proveedores" class="mobile-nav-link">Para proveedores</a>
          <a href="planes.html" class="mobile-nav-link">Planes y Precios</a>
        </div>
        <div class="mobile-nav-ctas"></div>
      </div>
    `;
    document.body.appendChild(drawer);
  }

  if (!overlay) {
    overlay = document.createElement('div');
    overlay.className = 'mobile-menu-overlay';
    document.body.appendChild(overlay);
  }

  // Asignar eventos para abrir y cerrar el menú móvil
  const closeBtn = drawer.querySelector('.mobile-menu-close');
  
  const openMenu = () => {
    drawer.classList.add('active');
    overlay.classList.add('active');
    document.body.style.overflow = 'hidden';
    
    // Sincronizar botones de acción del escritorio al menú móvil
    const desktopCtas = navbar.querySelector('.nav-ctas');
    const mobileCtas = drawer.querySelector('.mobile-nav-ctas');
    if (desktopCtas && mobileCtas) {
      mobileCtas.innerHTML = desktopCtas.innerHTML;
    }

    // Marcar el enlace activo según la página actual
    const path = window.location.pathname;
    const page = path.split("/").pop() || 'index.html';
    const mobileLinks = drawer.querySelectorAll('.mobile-nav-link');
    mobileLinks.forEach(link => {
      const href = link.getAttribute('href');
      if (page === href || (page === '' && href === 'index.html')) {
        link.classList.add('active');
      } else {
        link.classList.remove('active');
      }
    });
  };

  const closeMenu = () => {
    drawer.classList.remove('active');
    overlay.classList.remove('active');
    document.body.style.overflow = '';
  };

  toggleBtn.addEventListener('click', openMenu);
  closeBtn.addEventListener('click', closeMenu);
  overlay.addEventListener('click', closeMenu);

  // Cerrar el menú al hacer clic en un enlace de navegación
  const links = drawer.querySelectorAll('.mobile-nav-link');
  links.forEach(link => {
    link.addEventListener('click', closeMenu);
  });
}

// Control de ventanas modales
function openModal(modalId) {
  const modalOverlay = document.getElementById(modalId);
  if (modalOverlay) {
    modalOverlay.classList.add('active');
    document.body.style.overflow = 'hidden'; // Evitar desplazamiento
  }
}

function closeModal(modalId) {
  const modalOverlay = document.getElementById(modalId);
  if (modalOverlay) {
    modalOverlay.classList.remove('active');
    document.body.style.overflow = ''; // Restaurar desplazamiento
  }
}

// Evento para cerrar ventanas modales al hacer clic fuera del contenido
document.addEventListener('click', (e) => {
  if (e.target.classList.contains('modal-overlay')) {
    e.target.classList.remove('active');
    document.body.style.overflow = '';
  }
});

// Sistema de notificaciones emergentes (Toasts)
function showToast(title, message, type = 'info') {
  let container = document.querySelector('.toast-container');
  if (!container) {
    container = document.createElement('div');
    container.className = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  
  let iconName = 'info';
  if (type === 'success') iconName = 'check-circle';
  if (type === 'error') iconName = 'warning-circle';
  if (type === 'ia') iconName = 'sparkle';

  toast.innerHTML = `
    <i class="ph-${iconName} toast-icon"></i>
    <div class="toast-content">
      <span class="toast-title">${title}</span>
      <span class="toast-message">${message}</span>
    </div>
  `;

  container.appendChild(toast);

  // Iniciar animación en el siguiente fotograma
  setTimeout(() => toast.classList.add('active'), 50);

  // Eliminar automáticamente la notificación después de unos segundos
  setTimeout(() => {
    toast.classList.remove('active');
    setTimeout(() => toast.remove(), 400);
  }, 4000);
}

// Generador de insignias de verificación
function getVerificationBadgeHTML(level) {
  if (level === 'identity') {
    return `<span class="badge badge-verified-identity"><i class="ph-shield-check"></i> Documento verificado</span>`;
  } else if (level === 'company') {
    return `<span class="badge badge-verified-company"><i class="ph-buildings"></i> Empresa legal CR</span>`;
  } else if (level === 'top') {
    return `<span class="badge badge-top-provider"><i class="ph-star"></i> Top Proveedor MEG</span>`;
  }
  return '';
}

// Renderizado de las barras de reputación multidimensional
function renderReputationBars(container, details) {
  if (!container || !details) return;
  container.innerHTML = '';
  
  const translations = {
    puntualidad: "Puntualidad",
    calidad: "Calidad del servicio",
    comunicacion: "Comunicación",
    cumplimiento: "Cumplimiento",
    trato: "Trato al cliente"
  };

  Object.entries(details).forEach(([key, val]) => {
    const label = translations[key] || key;
    let colorClass = 'high';
    if (val < 6) colorClass = 'low';
    else if (val < 8) colorClass = 'medium';

    const itemHtml = `
      <div class="dimension-item">
        <div class="dimension-header">
          <span>${label}</span>
          <strong>${val.toFixed(1)}/10</strong>
        </div>
        <div class="dimension-bar-container">
          <div class="dimension-bar ${colorClass}" style="width: ${val * 10}%"></div>
        </div>
      </div>
    `;
    container.insertAdjacentHTML('beforeend', itemHtml);
  });
}
