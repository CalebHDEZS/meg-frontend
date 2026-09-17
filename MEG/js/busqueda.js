document.addEventListener('DOMContentLoaded', () => {
  initSearchPage();
});

let viewMode = 'grid'; // Modo de vista: 'grid' (cuadrícula) o 'list' (lista)

function initSearchPage() {
  const searchInput = document.getElementById('search-input');
  const categoryFilter = document.getElementById('filter-category');
  const locationFilter = document.getElementById('filter-location');
  const priceSlider = document.getElementById('filter-price');
  const priceValue = document.getElementById('price-val-display');
  const verificationCheckboxes = document.querySelectorAll('.filter-verify');
  const ratingFilter = document.getElementById('filter-rating');
  const availToggle = document.getElementById('filter-avail');

  const btnApply = document.getElementById('btn-apply-filters');
  const btnClear = document.getElementById('btn-clear-filters');

  const btnGrid = document.getElementById('btn-view-grid');
  const btnList = document.getElementById('btn-view-list');
  const sortSelect = document.getElementById('sort-by');

  // Asignar valor de búsqueda inicial si viene en la URL
  const queryParam = getUrlParam('search');
  if (queryParam && searchInput) {
    searchInput.value = queryParam;
  }

  // Asignar categoría inicial si viene en la URL
  const categoryParam = getUrlParam('category');
  if (categoryParam && categoryFilter) {
    categoryFilter.value = categoryParam;
  }

  // Actualizar el valor numérico del deslizador de precio
  if (priceSlider && priceValue) {
    priceSlider.addEventListener('input', () => {
      priceValue.textContent = parseInt(priceSlider.value).toLocaleString('es-CR');
    });
  }

  // Ejecutar búsqueda y renderizado inicial
  renderSearchResults();

  // Asignar eventos de interacción a los botones de filtro
  if (btnApply) btnApply.addEventListener('click', renderSearchResults);
  if (btnClear) {
    btnClear.addEventListener('click', () => {
      if (searchInput) searchInput.value = '';
      if (categoryFilter) categoryFilter.value = '';
      if (locationFilter) locationFilter.value = '';
      if (priceSlider) {
        priceSlider.value = 50000;
        priceValue.textContent = '50,000';
      }
      verificationCheckboxes.forEach(cb => cb.checked = false);
      if (ratingFilter) ratingFilter.value = '0';
      if (availToggle) availToggle.checked = false;
      renderSearchResults();
    });
  }

  // Alternar entre modo cuadrícula y lista
  if (btnGrid) {
    btnGrid.addEventListener('click', () => {
      viewMode = 'grid';
      btnGrid.classList.add('active');
      btnList.classList.remove('active');
      renderSearchResults();
    });
  }
  if (btnList) {
    btnList.addEventListener('click', () => {
      viewMode = 'list';
      btnList.classList.add('active');
      btnGrid.classList.remove('active');
      renderSearchResults();
    });
  }

  // Evento al cambiar el criterio de ordenamiento
  if (sortSelect) {
    sortSelect.addEventListener('change', renderSearchResults);
  }
}

async function renderSearchResults() {
  const searchInput = document.getElementById('search-input');
  const categoryFilter = document.getElementById('filter-category');
  const locationFilter = document.getElementById('filter-location');
  const priceSlider = document.getElementById('filter-price');
  const verificationCheckboxes = document.querySelectorAll('.filter-verify');
  const ratingFilter = document.getElementById('filter-rating');
  const availToggle = document.getElementById('filter-avail');
  const sortSelect = document.getElementById('sort-by');

  const resultsGrid = document.getElementById('results-grid');
  const resultsCount = document.getElementById('results-count-text');
  const aiBanner = document.getElementById('ia-recommendation-banner');
  const aiListContainer = document.getElementById('ia-recommendations-list');

  if (!resultsGrid) return;

  // Obtener proveedores reales desde la base de datos / businessService
  let providers = [];
  try {
    if (typeof businessService !== 'undefined') {
      providers = await businessService.getBusinesses();
    } else {
      providers = getProviders();
    }
  } catch (e) {
    providers = getProviders();
  }

  // Si no hay proveedores reales en la base de datos ni en caché
  if (!providers || providers.length === 0) {
    if (resultsCount) resultsCount.textContent = `0 negocios encontrados`;
    resultsGrid.className = 'grid grid-1';
    resultsGrid.innerHTML = `
      <div class="empty-state text-center p-xl">
        <i class="ph-storefront" style="font-size: 48px; color: var(--color-accent-blue); margin-bottom: var(--spacing-sm);"></i>
        <h4>Aún no hay emprendedores o negocios registrados</h4>
      
        <a href="auth.html?tab=register&role=proveedor" class="btn btn-primary">Registrar mi Negocio</a>
      </div>
    `;
    if (aiBanner) aiBanner.style.display = 'none';
    return;
  }

  const query = searchInput ? searchInput.value.toLowerCase().trim() : '';
  const category = categoryFilter ? categoryFilter.value : '';
  const location = locationFilter ? locationFilter.value : '';
  const maxPrice = priceSlider ? parseInt(priceSlider.value) : 100000;
  const ratingMin = ratingFilter ? parseFloat(ratingFilter.value) : 0;

  // Niveles de verificación seleccionados
  let selectedVerifications = [];
  verificationCheckboxes.forEach(cb => {
    if (cb.checked) selectedVerifications.push(cb.value);
  });

  // Filtrado de lista de proveedores reales
  let filtered = providers.filter(p => {
    const matchesQuery = !query ||
      (p.name && p.name.toLowerCase().includes(query)) ||
      (p.businessName && p.businessName.toLowerCase().includes(query)) ||
      (p.subcategory && p.subcategory.toLowerCase().includes(query)) ||
      (p.about && p.about.toLowerCase().includes(query));

    const matchesCategory = !category || p.category === category;
    const matchesLocation = !location || (p.locationId === location || (p.location && p.location.toLowerCase().includes(location)));
    const matchesPrice = (p.priceMin || 0) <= maxPrice;

    const matchesVerification = selectedVerifications.length === 0 ||
      selectedVerifications.includes(p.verification);

    const matchesRating = (p.reputation || 10) >= ratingMin;
    const matchesAvail = !availToggle || !availToggle.checked || p.isPro;

    return matchesQuery && matchesCategory && matchesLocation && matchesPrice && matchesVerification && matchesRating && matchesAvail;
  });

  // Ordenamiento según la opción seleccionada
  const sortBy = sortSelect ? sortSelect.value : 'relevance';
  if (sortBy === 'rating') {
    filtered.sort((a, b) => (b.reputation || 0) - (a.reputation || 0));
  } else if (sortBy === 'price_asc') {
    filtered.sort((a, b) => (a.priceMin || 0) - (b.priceMin || 0));
  } else if (sortBy === 'price_desc') {
    filtered.sort((a, b) => (b.priceMin || 0) - (a.priceMin || 0));
  } else if (sortBy === 'experience') {
    filtered.sort((a, b) => (b.experience || 0) - (a.experience || 0));
  }

  // Actualizar la etiqueta con el total de resultados
  if (resultsCount) {
    resultsCount.textContent = `${filtered.length} negocios reales encontrados`;
  }

  // Mostrar mensaje cuando no hay coincidencias
  if (filtered.length === 0) {
    resultsGrid.className = 'grid grid-1';
    resultsGrid.innerHTML = `
      <div class="empty-state">
        <i class="ph-magnifying-glass" style="font-size: 48px; color: var(--text-muted);"></i>
        <h4>No encontramos coincidencias para tu búsqueda</h4>
        <p>Prueba ajustando los filtros o buscando con otros términos.</p>
      </div>
    `;
    if (aiBanner) aiBanner.style.display = 'none';
    return;
  }

  // Ajustar la clase del contenedor según el modo seleccionado (cuadrícula o lista)
  resultsGrid.className = viewMode === 'grid' ? 'grid grid-3' : 'flex flex-col gap-md';

  resultsGrid.innerHTML = '';
  filtered.forEach((p, i) => {
    const cardHtml = viewMode === 'grid' ? buildGridCard(p, i) : buildListCard(p, i);
    resultsGrid.insertAdjacentHTML('beforeend', cardHtml);
  });

  // Reactivar el efecto de aparición al desplazarse
  if (typeof setupScrollReveal === 'function') {
    setupScrollReveal();
  }

  // Controlar el banner de recomendaciones de MEG IA
  const iaRecommendedList = filtered.filter(p => p.isIaRecommended);
  if (iaRecommendedList.length > 0 && (query || category)) {
    if (aiBanner && aiListContainer) {
      aiBanner.style.display = 'block';
      aiListContainer.innerHTML = '';

      // Mostrar hasta 3 recomendados
      iaRecommendedList.slice(0, 3).forEach((p, i) => {
        const delay = i * 80;
        const itemHtml = `
          <div class="ia-rec-card reveal-on-scroll" style="transition-delay: ${delay}ms;" onclick="window.location.href='perfil-proveedor.html?id=${p.id}'">
            <img src="${p.avatar}" alt="${p.name}" class="ia-rec-avatar">
            <div class="ia-rec-info">
              <span class="badge badge-ia-recommended"><i class="ph-sparkle"></i> IA Recomendado</span>
              <h5 class="ia-rec-name">${p.name}</h5>
              <span class="ia-rec-sub">${p.subcategory}</span>
              <div class="reputation-score-box mt-xs">
                <i class="ph-star-fill reputation-star"></i>
                <span>${p.reputation.toFixed(1)}/10</span>
              </div>
            </div>
          </div>
        `;
        aiListContainer.insertAdjacentHTML('beforeend', itemHtml);
      });

      // Activar efecto de revelado para las tarjetas recomendadas
      if (typeof setupScrollReveal === 'function') {
        setupScrollReveal();
      }
    }
  } else {
    if (aiBanner) aiBanner.style.display = 'none';
  }
}

function buildGridCard(p, i = 0) {
  const badgeHtml = getVerificationBadgeHTML(p.verification);
  const iaBadge = p.isIaRecommended ? `<span class="badge badge-ia-recommended"><i class="ph-sparkle"></i> IA Recomendado</span>` : '';
  const delay = i * 80;

  return `
    <div class="card provider-card reveal-on-scroll" style="transition-delay: ${delay}ms;" onclick="window.location.href='perfil-proveedor.html?id=${p.id}'">
      <div class="provider-card-header">
        <img src="${p.banner}" alt="${p.businessName}" class="provider-card-banner">
        <div class="provider-card-avatar-container">
          <img src="${p.avatar}" alt="${p.name}" class="provider-card-avatar">
        </div>
      </div>
      <div class="provider-card-badges">
        ${badgeHtml}
        ${iaBadge}
      </div>
      <h4 class="provider-card-title">${p.businessName}</h4>
      <span class="provider-card-category">${p.subcategory} • 📍 ${p.location}</span>
      <p style="font-size: var(--font-size-xs); color: var(--text-secondary); margin-bottom: var(--spacing-md); line-height: 1.5;">
        ${p.about.substring(0, 85)}...
      </p>
      
      <div class="provider-card-footer">
        <div class="reputation-score-box">
          <span class="reputation-composite-badge">${p.reputation.toFixed(1)}</span>
          <div style="display: flex; flex-direction: column;">
            <span style="font-size: 11px; font-weight: 500; color: var(--text-secondary);">Reputación</span>
            <span style="font-size: 12px; display: flex; align-items: center; gap: 2px;">
              <i class="ph-star-fill reputation-star"></i> ${p.reputation.toFixed(1)}
            </span>
          </div>
        </div>
        <div>
          <span style="display: block; font-size: 10px; color: var(--text-muted); text-align: right;">Precio base</span>
          <span class="provider-card-price">${p.priceFormatted.split(' ')[0]}</span>
        </div>
      </div>
    </div>
  `;
}

function buildListCard(p, i = 0) {
  const badgeHtml = getVerificationBadgeHTML(p.verification);
  const iaBadge = p.isIaRecommended ? `<span class="badge badge-ia-recommended"><i class="ph-sparkle"></i> IA Recomendado</span>` : '';
  const delay = i * 80;

  return `
    <div class="card flex flex-col md-flex-row gap-lg provider-list-card reveal-on-scroll" style="transition-delay: ${delay}ms; cursor: pointer; padding: var(--spacing-md);" onclick="window.location.href='perfil-proveedor.html?id=${p.id}'">
      <div class="flex" style="gap: var(--spacing-md); align-items: center;">
        <img src="${p.avatar}" alt="${p.name}" style="width: 80px; height: 80px; border-radius: 50%; object-fit: cover;">
        <div>
          <div class="flex align-center gap-sm" style="flex-wrap: wrap;">
            <h4 style="margin: 0; font-size: var(--font-size-md);">${p.businessName}</h4>
            <div class="flex gap-xs">
              ${badgeHtml}
              ${iaBadge}
            </div>
          </div>
          <span style="font-size: var(--font-size-xs); color: var(--text-secondary); font-weight: 500;">
            ${p.subcategory} • 📍 ${p.location}
          </span>
          <p style="font-size: var(--font-size-xs); color: var(--text-secondary); margin-top: var(--spacing-xs); line-height: 1.5; max-width: 600px;">
            ${p.about.substring(0, 140)}...
          </p>
        </div>
      </div>
      
      <div class="flex align-center justify-between" style="border-top: 1px solid var(--border-color); padding-top: var(--spacing-sm); margin-top: var(--spacing-sm); width: 100%;">
        <div class="flex gap-lg">
          <div class="reputation-score-box">
            <span class="reputation-composite-badge" style="width: 36px; height: 36px; font-size: var(--font-size-sm);">${p.reputation.toFixed(1)}</span>
            <div style="font-size: var(--font-size-xs);">
              <strong>Reputación</strong>
              <div class="flex align-center gap-xs"><i class="ph-star-fill reputation-star"></i> 9.4/10</div>
            </div>
          </div>
          <div style="font-size: var(--font-size-xs); display: flex; flex-direction: column; justify-content: center;">
            <span style="color: var(--text-secondary);">Tiempo de respuesta</span>
            <strong>${p.responseTime}</strong>
          </div>
        </div>
        <div style="text-align: right;">
          <span style="display: block; font-size: 10px; color: var(--text-muted);">Precio base</span>
          <strong style="font-size: var(--font-size-md); color: var(--color-accent-blue);">${p.priceFormatted}</strong>
        </div>
      </div>
    </div>
  `;
}
