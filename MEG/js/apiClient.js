/**
 * Cliente HTTP centralizado para interactuar con la API real de MEG
 */
class ApiError extends Error {
  constructor(message, status, data = null) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

class EndpointNotAvailableError extends Error {
  constructor(domain, feature) {
    super(`El endpoint para '${feature}' en el dominio de '${domain}' aún no está implementado en el backend de MEG.`);
    this.name = 'EndpointNotAvailableError';
    this.domain = domain;
    this.feature = feature;
  }
}

class ApiClient {
  constructor() {
    this.baseUrl = window.API_CONFIG ? window.API_CONFIG.BASE_URL : 'http://localhost:8787';
    this.isRefreshing = false;
    this.refreshSubscribers = [];
  }

  // Token Management
  getAccessToken() {
    return localStorage.getItem('meg_access_token');
  }

  getRefreshToken() {
    return localStorage.getItem('meg_refresh_token');
  }

  setTokens(accessToken, refreshToken) {
    if (accessToken) localStorage.setItem('meg_access_token', accessToken);
    if (refreshToken) localStorage.setItem('meg_refresh_token', refreshToken);
  }

  clearSession() {
    localStorage.removeItem('meg_access_token');
    localStorage.removeItem('meg_refresh_token');
    localStorage.removeItem('meg_user');
    localStorage.removeItem('meg_session');
  }

  // HTTP Request wrapper
  async request(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers
    };

    const token = this.getAccessToken();
    if (token && !options.skipAuth) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const config = {
      method: options.method || 'GET',
      headers,
      ...options
    };

    if (options.body && typeof options.body === 'object') {
      config.body = JSON.stringify(options.body);
    }

    try {
      let response = await fetch(url, config);

      // Manejo de token expirado (401) y rotación de tokens mediante /auth/refresh
      if (response.status === 401 && !options.isRetry && this.getRefreshToken() && endpoint !== '/auth/refresh') {
        const renewed = await this.handleTokenRefresh();
        if (renewed) {
          options.isRetry = true;
          return this.request(endpoint, options);
        }
      }

      // Procesar respuesta
      const isJson = response.headers.get('content-type')?.includes('application/json');
      const data = isJson ? await response.json() : await response.text();

      if (!response.ok) {
        const errorMsg = (typeof data === 'object' && data.error) 
          ? data.error 
          : `Error HTTP ${response.status}: ${response.statusText}`;
        throw new ApiError(errorMsg, response.status, data);
      }

      return data;
    } catch (error) {
      if (error instanceof ApiError) throw error;
      
      // Error de red / conexión rechazada
      throw new ApiError(
        'No se pudo establecer conexión con el servidor de MEG. Verifica que el backend esté activo.',
        0,
        { originalError: error.message }
      );
    }
  }

  // Token refresh rotation
  async handleTokenRefresh() {
    if (this.isRefreshing) {
      return new Promise(resolve => {
        this.refreshSubscribers.push(resolve);
      });
    }

    this.isRefreshing = true;
    const refreshToken = this.getRefreshToken();

    try {
      const response = await fetch(`${this.baseUrl}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken })
      });

      if (response.ok) {
        const data = await response.json();
        this.setTokens(data.accessToken, data.refreshToken);
        this.onRefreshed(true);
        return true;
      } else {
        this.clearSession();
        this.onRefreshed(false);
        return false;
      }
    } catch (e) {
      this.clearSession();
      this.onRefreshed(false);
      return false;
    } finally {
      this.isRefreshing = false;
    }
  }

  onRefreshed(success) {
    this.refreshSubscribers.map(cb => cb(success));
    this.refreshSubscribers = [];
  }

  // Métodos HTTP abreviados
  get(endpoint, options = {}) {
    return this.request(endpoint, { ...options, method: 'GET' });
  }

  post(endpoint, body, options = {}) {
    return this.request(endpoint, { ...options, method: 'POST', body });
  }

  patch(endpoint, body, options = {}) {
    return this.request(endpoint, { ...options, method: 'PATCH', body });
  }

  delete(endpoint, options = {}) {
    return this.request(endpoint, { ...options, method: 'DELETE' });
  }
}

// Instancia global
const apiClient = new ApiClient();

if (typeof window !== 'undefined') {
  window.apiClient = apiClient;
  window.ApiError = ApiError;
  window.EndpointNotAvailableError = EndpointNotAvailableError;
}
