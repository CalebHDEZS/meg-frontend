document.addEventListener('DOMContentLoaded', () => {
  setupNavbarSession();
  highlightActiveLink();
});

// Cambia dinámicamente los botones de registro / login por enlaces al dashboard en el navbar público
function setupNavbarSession() {
  const ctasContainer = document.querySelector('.nav-ctas');
  if (!ctasContainer) return;
  
  const isAuth = typeof authService !== 'undefined' && authService.isAuthenticated();
  const session = getSession();
  
  if (isAuth && session && session.isLoggedIn) {
    let dashboardUrl = session.role === 'proveedor' ? 'dashboard-proveedor.html' : 'dashboard-consumidor.html';
    
    ctasContainer.innerHTML = `
      <a href="${dashboardUrl}" class="btn btn-secondary btn-sm">
        <i class="ph-squares-four"></i> Panel de Control
      </a>
      <button onclick="handleLogout()" class="btn btn-tertiary btn-sm">
        Salir
      </button>
    `;
  } else {
    // Si no está logueado, mantener los botones estándar
    ctasContainer.innerHTML = `
      <a href="auth.html?tab=login" class="nav-link">Iniciar sesión</a>
      <a href="auth.html?tab=register" class="btn btn-primary">Registrarse</a>
    `;
  }
}

async function handleLogout() {
  try {
    if (typeof authService !== 'undefined') {
      await authService.logout();
    } else {
      saveSession({ isLoggedIn: false, role: null, userId: null, userName: null, userEmail: null });
    }
    showToast("Sesión cerrada", "Has cerrado tu sesión correctamente en MEG.", "info");
  } catch (e) {
    showToast("Sesión cerrada", "Sesión local eliminada.", "info");
  } finally {
    setTimeout(() => {
      window.location.href = 'index.html';
    }, 800);
  }
}

// Resalta la página actual en la barra de navegación pública
function highlightActiveLink() {
  const path = window.location.pathname;
  const page = path.split("/").pop();
  
  const links = document.querySelectorAll('.nav-link');
  links.forEach(link => {
    const href = link.getAttribute('href');
    if (page === href) {
      link.classList.add('active');
    } else {
      link.classList.remove('active');
    }
  });
}

// Helper para extraer parámetros de la URL (Query params)
function getUrlParam(paramName) {
  const params = new URLSearchParams(window.location.search);
  return params.get(paramName);
}
