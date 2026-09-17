/**
 * Configuración de Taxonomía y Gestión de Datos Reales de MEG
 * Se han eliminado todos los vendedores ficticios/mock.
 * Los datos provienen exclusivamente de la base de datos real a través de la API.
 */
const MEG_DATA = {
  categories: [
    { id: "hogar", name: "Servicios del Hogar", icon: "house-line", count: 0 },
    { id: "tecnologia", name: "Tecnología y Diseño", icon: "code", count: 0 },
    { id: "educacion", name: "Educación y Tutorías", icon: "book-open", count: 0 },
    { id: "gastronomia", name: "Gastronomía y Eventos", icon: "fork-knife", count: 0 },
    { id: "belleza", name: "Belleza y Estética", icon: "sparkles", count: 0 },
    { id: "servicios", name: "Servicios Profesionales", icon: "briefcase", count: 0 }
  ],
  
  cantons: [
    { id: "escazu", name: "Escazú (San José)" },
    { id: "santa-ana", name: "Santa Ana (San José)" },
    { id: "san-pedro", name: "San Pedro (San José)" },
    { id: "belen", name: "Belén (Heredia)" },
    { id: "san-joaquin", name: "San Joaquín (Heredia)" },
    { id: "coyol", name: "El Coyol (Alajuela)" },
    { id: "tres-rios", name: "Tres Ríos (Cartago)" }
  ],
  
  // Lista de proveedores obtenida en tiempo real desde la base de datos (Inicialmente vacía)
  providers: []
};

// Obtener proveedores almacenados de negocios reales
function getProviders() {
  const cached = localStorage.getItem('meg_real_businesses');
  if (cached) {
    try {
      return JSON.parse(cached);
    } catch (e) {
      return [];
    }
  }
  return MEG_DATA.providers;
}

function saveProviders(providers) {
  localStorage.setItem('meg_real_businesses', JSON.stringify(providers));
  MEG_DATA.providers = providers;
}

// Agregar un nuevo negocio real registrado a la memoria/caché local
function addRealBusinessToCache(businessData) {
  const providers = getProviders();
  providers.push(businessData);
  saveProviders(providers);
}

// Gestión de Sesión de Usuario Autenticado
if (!localStorage.getItem('meg_session')) {
  localStorage.setItem('meg_session', JSON.stringify({
    isLoggedIn: false,
    role: null,
    userId: null,
    userName: null,
    userEmail: null
  }));
}

function getSession() {
  try {
    return JSON.parse(localStorage.getItem('meg_session'));
  } catch (e) {
    return { isLoggedIn: false, role: null, userId: null, userName: null, userEmail: null };
  }
}

function saveSession(session) {
  localStorage.setItem('meg_session', JSON.stringify(session));
}
