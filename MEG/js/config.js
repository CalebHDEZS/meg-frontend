/**
 * Configuración global del cliente API y servicios para MEG
 */
const API_CONFIG = {
  // Base URL configurable via window.ENV o fallback por defecto al backend Hono / Cloudflare Workers
  BASE_URL: (typeof window !== 'undefined' && window.ENV && window.ENV.API_BASE_URL) 
    ? window.ENV.API_BASE_URL 
    : 'http://localhost:8787',

  // Google Maps API Key configurable via window.ENV.GOOGLE_MAPS_API_KEY
  GOOGLE_MAPS_API_KEY: (typeof window !== 'undefined' && window.ENV && window.ENV.GOOGLE_MAPS_API_KEY) 
    ? window.ENV.GOOGLE_MAPS_API_KEY 
    : '',
    
  TIMEOUT: 15000,
  
  ENDPOINTS: {
    // Health & Doc
    PING: '/ping',
    DOC: '/doc',
    DOCS: '/docs',
    
    // Autenticación
    AUTH: {
      REGISTER: '/auth/register',
      LOGIN: '/auth/login',
      REFRESH: '/auth/refresh',
      LOGOUT: '/auth/logout',
      ME: '/auth/me'
    },
    
    // Usuarios
    USERS: {
      BY_ID: (id) => `/users/${id}`,
      ME: '/users/me',
      UPDATE_ME: '/users/me',
      CHANGE_PASSWORD: '/users/me/password',
      DEACTIVATE: '/users/me/deactivate'
    },

    // Negocios / Emprendedores
    BUSINESSES: {
      LIST: '/businesses',
      CREATE: '/businesses',
      BY_ID: (id) => `/businesses/${id}`,
      MY_BUSINESS: '/businesses/me',
      SCHEDULE: (id) => `/businesses/${id}/schedule`,
      LOCATION: (id) => `/businesses/${id}/location`,
      CATEGORIES: '/categories'
    }
  }
};

// Exportar globalmente en entorno de navegador
if (typeof window !== 'undefined') {
  window.API_CONFIG = API_CONFIG;
}
