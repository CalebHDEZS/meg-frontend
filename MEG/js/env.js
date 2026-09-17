/**
 * Configuracion de entorno para el frontend de MEG.
 * Se carga ANTES de js/config.js, que lee window.ENV si existe.
 *
 * Cambia API_BASE_URL segun el entorno:
 *  - Local: el backend (meg-backend) corre con Vite -> http://localhost:5173
 *  - Produccion: la URL del Worker desplegado, ej. https://meg-backend.<tu-cuenta>.workers.dev
 */
window.ENV = {
  API_BASE_URL: 'http://localhost:5173',
  GOOGLE_MAPS_API_KEY: ''
};
