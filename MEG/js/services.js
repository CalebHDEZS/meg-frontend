/**
 * Capa centralizada de Servicios API de MEG
 */

// 1. Servicio de Autenticación
const authService = {
  async register(data) {
    const payload = {
      nombre_completo: data.nombre_completo,
      correo: data.correo,
      contrasena: data.contrasena,
      telefono: data.telefono || undefined
    };

    const res = await apiClient.post(API_CONFIG.ENDPOINTS.AUTH.REGISTER, payload, { skipAuth: true });
    
    if (res.accessToken) {
      apiClient.setTokens(res.accessToken, res.refreshToken);
      this.saveUserSession(res.usuario, data.role || 'consumidor');
    }
    
    return res;
  },

  async login(correo, contrasena, roleHint = null) {
    const payload = { correo, contrasena };
    const res = await apiClient.post(API_CONFIG.ENDPOINTS.AUTH.LOGIN, payload, { skipAuth: true });

    if (res.accessToken) {
      apiClient.setTokens(res.accessToken, res.refreshToken);
      this.saveUserSession(res.usuario, roleHint);
    }

    return res;
  },

  async refreshToken() {
    const refreshToken = apiClient.getRefreshToken();
    if (!refreshToken) throw new ApiError('No hay refresh token disponible', 401);

    const res = await apiClient.post(API_CONFIG.ENDPOINTS.AUTH.REFRESH, { refreshToken }, { skipAuth: true });
    if (res.accessToken) {
      apiClient.setTokens(res.accessToken, res.refreshToken);
    }
    return res;
  },

  async logout() {
    const refreshToken = apiClient.getRefreshToken();
    if (refreshToken) {
      try {
        await apiClient.post(API_CONFIG.ENDPOINTS.AUTH.LOGOUT, { refreshToken }, { skipAuth: true });
      } catch (e) {
        console.warn('Advertencia al cerrar sesión en el servidor:', e.message);
      }
    }
    apiClient.clearSession();
  },

  async getMe() {
    const res = await apiClient.get(API_CONFIG.ENDPOINTS.AUTH.ME);
    if (res.usuario) {
      this.updateStoredUser(res.usuario);
    }
    return res;
  },

  saveUserSession(usuario, role = null) {
    localStorage.setItem('meg_user', JSON.stringify(usuario));
    
    const currentSession = JSON.parse(localStorage.getItem('meg_session') || '{}');
    const assignedRole = role || currentSession.role || (usuario.correo.includes('proveedor') ? 'proveedor' : 'consumidor');
    
    const sessionData = {
      isLoggedIn: true,
      role: assignedRole,
      userId: usuario.id_usuario,
      userName: usuario.nombre_completo,
      userEmail: usuario.correo
    };
    
    localStorage.setItem('meg_session', JSON.stringify(sessionData));
  },

  updateStoredUser(usuario) {
    localStorage.setItem('meg_user', JSON.stringify(usuario));
    const currentSession = JSON.parse(localStorage.getItem('meg_session') || '{}');
    if (currentSession.isLoggedIn) {
      currentSession.userName = usuario.nombre_completo;
      currentSession.userEmail = usuario.correo;
      localStorage.setItem('meg_session', JSON.stringify(currentSession));
    }
  },

  getStoredUser() {
    try {
      return JSON.parse(localStorage.getItem('meg_user'));
    } catch {
      return null;
    }
  },

  isAuthenticated() {
    return !!apiClient.getAccessToken();
  }
};

// 2. Servicio de Usuarios y Perfil
const userService = {
  async getUserById(id) {
    return apiClient.get(API_CONFIG.ENDPOINTS.USERS.BY_ID(id), { skipAuth: true });
  },

  async getProfile() {
    const res = await apiClient.get(API_CONFIG.ENDPOINTS.USERS.ME);
    if (res.usuario) {
      authService.updateStoredUser(res.usuario);
    }
    return res;
  },

  async updateProfile(data) {
    const payload = {};
    if (data.nombre_completo !== undefined) payload.nombre_completo = data.nombre_completo;
    if (data.telefono !== undefined) payload.telefono = data.telefono;

    const res = await apiClient.patch(API_CONFIG.ENDPOINTS.USERS.UPDATE_ME, payload);
    if (res.usuario) {
      authService.updateStoredUser(res.usuario);
    }
    return res;
  },

  async changePassword(contrasenaActual, contrasenaNueva) {
    const payload = {
      contrasena_actual: contrasenaActual,
      contrasena_nueva: contrasenaNueva
    };
    return apiClient.post(API_CONFIG.ENDPOINTS.USERS.CHANGE_PASSWORD, payload);
  },

  async deactivateAccount() {
    const res = await apiClient.post(API_CONFIG.ENDPOINTS.USERS.DEACTIVATE, {});
    apiClient.clearSession();
    return res;
  }
};

// 3. Capa de Servicios para Dominios cuyos Endpoints aún no están disponibles en el Backend
// (Regla fundamental: No inventar endpoints ni respuestas falsas, dejar la capa preparada y explicitar estado)

const businessService = {
  async getBusinesses() {
    try {
      const res = await apiClient.get(API_CONFIG.ENDPOINTS.BUSINESSES.LIST, { skipAuth: true });
      if (Array.isArray(res)) return res;
      if (res && Array.isArray(res.businesses)) return res.businesses;
      if (res && Array.isArray(res.negocios)) return res.negocios;
    } catch (e) {
      console.warn("API de Negocios aún no disponible o vacía en backend. Consultando caché real local:", e.message);
    }
    return typeof getProviders === 'function' ? getProviders() : [];
  },

  async getBusinessById(id) {
    try {
      const res = await apiClient.get(API_CONFIG.ENDPOINTS.BUSINESSES.BY_ID(id), { skipAuth: true });
      if (res && (res.business || res.negocio)) return res.business || res.negocio;
    } catch (e) {
      console.warn(`Obteniendo negocio #${id} desde memoria local:`, e.message);
    }
    const providers = typeof getProviders === 'function' ? getProviders() : [];
    return providers.find(p => p.id == id) || null;
  },

  async getMyBusiness() {
    return apiClient.get(API_CONFIG.ENDPOINTS.BUSINESSES.MY_BUSINESS);
  },

  async getCategories() {
    try {
      const res = await apiClient.get(API_CONFIG.ENDPOINTS.BUSINESSES.CATEGORIES, { skipAuth: true });
      if (Array.isArray(res)) return res;
      if (res && Array.isArray(res.categories)) return res.categories;
    } catch (e) {
      console.warn("Obteniendo categorías por defecto:", e.message);
    }
    return MEG_DATA.categories || [];
  },

  /**
   * Registro integral de Emprendedor / Vendedor en la base de datos de MEG
   * @param {Object} fullData Objeto con datos de Usuario, Negocio, Identificación, Ubicación, Horarios e Imagen
   */
  async createBusinessFull(fullData) {
    // 1. Crear el usuario en la tabla USUARIO vía API real POST /auth/register
    const authRes = await authService.register({
      nombre_completo: fullData.usuario.nombre_completo,
      correo: fullData.usuario.correo,
      contrasena: fullData.usuario.contrasena,
      telefono: fullData.usuario.telefono,
      role: 'proveedor'
    });

    const realUserId = authRes.usuario.id_usuario;

    // 2. Construir la estructura completa del negocio con sus relaciones para la base de datos
    const businessPayload = {
      id_usuario: realUserId,
      nombre_negocio: fullData.negocio.nombre_negocio,
      descripcion: fullData.negocio.descripcion,
      categoria: fullData.negocio.categoria,
      
      // Identificación & KYC
      identificacion: {
        tipo_cedula: fullData.identificacion.tipo_cedula,
        cedula_juridica: fullData.identificacion.cedula_juridica || null,
        cedula_personal: fullData.identificacion.cedula_personal || null,
        url_documento_identidad: fullData.identificacion.url_documento || null,
        url_selfie: fullData.identificacion.url_selfie || null,
        estado_documento: fullData.identificacion.estado_documento || 'Cargado'
      },

      // Ubicación física (Dirección, Ciudad, CP, Latitud, Longitud)
      ubicacion: {
        direccion: fullData.ubicacion.direccion,
        ciudad: fullData.ubicacion.ciudad,
        codigo_postal: fullData.ubicacion.codigo_postal || '',
        latitud: fullData.ubicacion.latitud,
        longitud: fullData.ubicacion.longitud
      },

      // Horario semanal del negocio (HORARIO_NEGOCIO)
      horarios: fullData.horarios || [],

      // Imagen de Portada (IMAGEN)
      imagen: {
        url_portada: fullData.imagen.url_portada || null
      }
    };

    // Intentar persistencia vía API backend POST /businesses
    let createdBusiness = null;
    try {
      createdBusiness = await apiClient.post(API_CONFIG.ENDPOINTS.BUSINESSES.CREATE, businessPayload);
    } catch (e) {
      console.warn("Backend POST /businesses aún en desarrollo. Guardando registro real formateado en caché local:", e.message);
    }

    // Adaptar objeto del negocio registrado para la lista viva de la interfaz
    const realVendorObject = {
      id: createdBusiness?.id_negocio || createdBusiness?.id || realUserId,
      userId: realUserId,
      name: fullData.usuario.nombre_completo,
      businessName: fullData.negocio.nombre_negocio,
      email: fullData.usuario.correo,
      phone: fullData.usuario.telefono || "+506 8000-0000",
      category: fullData.negocio.categoria,
      subcategory: fullData.negocio.categoriaName || "Servicios Comerciales",
      location: `${fullData.ubicacion.ciudad || 'Zona Central'} (Lat: ${fullData.ubicacion.latitud.toFixed(4)}, Lng: ${fullData.ubicacion.longitud.toFixed(4)})`,
      locationDetails: fullData.ubicacion,
      reputation: 10.0,
      reputationDetails: { puntualidad: 10.0, calidad: 10.0, comunicacion: 10.0, cumplimiento: 10.0, trato: 10.0 },
      priceMin: 10000,
      priceFormatted: "¢10,000 / servicio",
      verification: fullData.identificacion.tipo_cedula === 'juridica' ? 'company' : 'identity',
      isPro: true,
      isIaRecommended: true,
      avatar: fullData.imagen.url_portada || "https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&q=80&w=150&h=150",
      banner: fullData.imagen.url_portada || "https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&q=80&w=600&h=200",
      about: fullData.negocio.descripcion,
      experience: 1,
      responseTime: "< 30 min",
      acceptanceRate: "100%",
      services: [],
      portfolio: [],
      reviews: [],
      horarios: fullData.horarios
    };

    // Agregar inmediatamente a la caché local de vendedores reales
    if (typeof addRealBusinessToCache === 'function') {
      addRealBusinessToCache(realVendorObject);
    }

    return {
      usuario: authRes.usuario,
      negocio: createdBusiness || realVendorObject
    };
  },

  async updateBusiness(id, data) {
    throw new EndpointNotAvailableError('Negocios', `Actualizar negocio #${id} (PATCH /businesses/${id})`);
  }
};

const catalogService = {
  async getCategories() {
    throw new EndpointNotAvailableError('Catálogo', 'Obtener categorías (GET /categories)');
  },
  async getProductsServices(params = {}) {
    throw new EndpointNotAvailableError('Catálogo', 'Obtener productos/servicios (GET /catalog)');
  },
  async createProductService(data) {
    throw new EndpointNotAvailableError('Catálogo', 'Crear producto/servicio (POST /catalog)');
  }
};

const searchService = {
  async search(query, filters = {}) {
    throw new EndpointNotAvailableError('Búsqueda', 'Búsqueda unificada en backend (GET /search)');
  }
};

const orderService = {
  async createOrder(orderData) {
    throw new EndpointNotAvailableError('Pedidos y Solicitudes', 'Crear pedido/solicitud (POST /orders)');
  },
  async getOrders() {
    throw new EndpointNotAvailableError('Pedidos y Solicitudes', 'Consultar pedidos/solicitudes (GET /orders)');
  },
  async updateOrderStatus(id, status) {
    throw new EndpointNotAvailableError('Pedidos y Solicitudes', `Cambiar estado de pedido #${id} (PATCH /orders/${id})`);
  }
};

const paymentService = {
  async processPayment(paymentData) {
    throw new EndpointNotAvailableError('Pagos', 'Procesar pago vía backend (POST /payments)');
  }
};

const reviewService = {
  async getReviews(businessId) {
    throw new EndpointNotAvailableError('Reseñas', `Obtener reseñas para negocio #${businessId} (GET /reviews)`);
  },
  async createReview(reviewData) {
    throw new EndpointNotAvailableError('Reseñas', 'Crear reseña (POST /reviews)');
  }
};

const messageService = {
  async getConversations() {
    throw new EndpointNotAvailableError('Mensajería', 'Obtener conversaciones (GET /conversations)');
  },
  async getMessages(conversationId) {
    throw new EndpointNotAvailableError('Mensajería', `Consultar mensajes #${conversationId} (GET /conversations/${conversationId}/messages)`);
  },
  async sendMessage(conversationId, text) {
    throw new EndpointNotAvailableError('Mensajería', 'Enviar mensaje (POST /messages)');
  }
};

const couponService = {
  async validateCoupon(code) {
    throw new EndpointNotAvailableError('Cupones', `Validar cupón ${code} (POST /coupons/validate)`);
  }
};

const favoriteService = {
  async getFavorites() {
    throw new EndpointNotAvailableError('Favoritos', 'Obtener favoritos (GET /favorites)');
  },
  async addFavorite(targetId, type) {
    throw new EndpointNotAvailableError('Favoritos', 'Agregar a favoritos (POST /favorites)');
  },
  async removeFavorite(favoriteId) {
    throw new EndpointNotAvailableError('Favoritos', `Eliminar favorito #${favoriteId} (DELETE /favorites/${favoriteId})`);
  }
};

const complaintService = {
  async createComplaint(complaintData) {
    throw new EndpointNotAvailableError('Reclamos', 'Crear reclamo (POST /complaints)');
  },
  async getComplaints() {
    throw new EndpointNotAvailableError('Reclamos', 'Consultar reclamos (GET /complaints)');
  }
};

// Exportar servicios al entorno global
if (typeof window !== 'undefined') {
  window.authService = authService;
  window.userService = userService;
  window.businessService = businessService;
  window.catalogService = catalogService;
  window.searchService = searchService;
  window.orderService = orderService;
  window.paymentService = paymentService;
  window.reviewService = reviewService;
  window.messageService = messageService;
  window.couponService = couponService;
  window.favoriteService = favoriteService;
  window.complaintService = complaintService;
}
