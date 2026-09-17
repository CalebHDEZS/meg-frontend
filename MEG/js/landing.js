// Lógica específica de la Landing Page (index.html)

document.addEventListener('DOMContentLoaded', () => {
  initLanding();
});

function initLanding() {
  setupHowItWorksToggle();
  renderFeaturedProviders();
  setupSearchActions();
  initNetworkBackground();
}

// 1. Alternar "Cómo funciona?" entre Consumidor y Proveedor
function setupHowItWorksToggle() {
  const btnConsumidor = document.getElementById('how-tab-consumidor');
  const btnProveedor = document.getElementById('how-tab-proveedor');
  const cardsContainer = document.getElementById('how-cards-container');

  if (!btnConsumidor || !btnProveedor || !cardsContainer) return;

  const contentConsumidor = [
    { num: 1, icon: "ph-magnifying-glass", title: "Busca y Filtra", desc: "Encuentra proveedores en la Zona Central filtrando por categoría, cantón, precio y reputación." },
    { num: 2, icon: "ph-users-three", title: "Compara Perfiles", desc: "Mira calificaciones multidimensionales reales, fotos de portafolios y niveles de verificación." },
    { num: 3, icon: "ph-calendar-check", title: "Contrata o Agenda", desc: "Envía una solicitud de cotización instantánea o reserva un horario directo en su calendario." }
  ];

  const contentProveedor = [
    { num: 1, icon: "ph-storefront", title: "Crea tu Perfil", desc: "Publica tus servicios, sube fotos de tus trabajos anteriores e ingresa tus datos geográficos." },
    { num: 2, icon: "ph-sparkle", title: "Usa IA para Crecer", desc: "Utiliza nuestro asistente inteligente para redactar descripciones de servicios y crear cotizaciones." },
    { num: 3, icon: "ph-chart-line-up", title: "Recibe Clientes", desc: "Gestiona citas agendadas, chatea con clientes y aumenta tu reputación para posicionarte primero." }
  ];

  function renderCards(data) {
    cardsContainer.innerHTML = '';
    data.forEach(item => {
      const card = `
        <div class="how-card">
          <div class="how-number">${item.num}</div>
          <div>
            <h4 style="font-size: var(--font-size-md); margin-bottom: 4px; display: flex; align-items: center; gap: 8px;">
              <i class="${item.icon}"></i> ${item.title}
            </h4>
            <p style="font-size: var(--font-size-sm); color: var(--text-secondary); margin: 0; line-height: 1.5;">${item.desc}</p>
          </div>
        </div>
      `;
      cardsContainer.insertAdjacentHTML('beforeend', card);
    });
  }

  btnConsumidor.addEventListener('click', () => {
    btnConsumidor.classList.add('active');
    btnProveedor.classList.remove('active');
    renderCards(contentConsumidor);
  });

  btnProveedor.addEventListener('click', () => {
    btnProveedor.classList.add('active');
    btnConsumidor.classList.remove('active');
    renderCards(contentProveedor);
  });

  // Render inicial por defecto
  renderCards(contentConsumidor);
}

async function renderFeaturedProviders() {
  const wrapper = document.getElementById('featured-carousel-wrapper');
  if (!wrapper) return;

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

  if (!providers || providers.length === 0) {
    wrapper.innerHTML = `
      <div class="empty-state text-center p-md w-full" style="grid-column: 1 / -1;">
        <p style="color: var(--text-secondary); font-size: var(--font-size-xs);">Aún no hay negocios. Regístrate como emprendedor para aparecer en portada.</p>
      </div>
    `;
    return;
  }

  const featured = providers;

  wrapper.innerHTML = '';
  featured.forEach(p => {
    const badgeHtml = getVerificationBadgeHTML(p.verification || 'company');

    const cardHtml = `
      <div class="card provider-card carousel-card" onclick="window.location.href='perfil-proveedor.html?id=${p.id}'" style="cursor: pointer;">
        <div class="provider-card-header">
          <img src="${p.banner}" alt="${p.businessName}" class="provider-card-banner">
          <div class="provider-card-avatar-container">
            <img src="${p.avatar}" alt="${p.name}" class="provider-card-avatar">
          </div>
        </div>
        <div class="provider-card-badges">
          ${badgeHtml}
        </div>
        <h4 class="provider-card-title">${p.businessName}</h4>
        <span class="provider-card-category">${p.subcategory} • 📍 ${p.location}</span>
        
        <div class="provider-card-footer" style="margin-top: var(--spacing-md);">
          <div class="reputation-score-box">
            <span class="reputation-composite-badge">${(p.reputation || 10).toFixed(1)}</span>
            <div style="display: flex; flex-direction: column;">
              <span style="font-size: 11px; font-weight: 500; color: var(--text-secondary);">Reputación</span>
              <span style="font-size: 12px; display: flex; align-items: center; gap: 2px;">
                <i class="ph-star-fill reputation-star"></i> ${(p.reputation || 10).toFixed(1)}
              </span>
            </div>
          </div>
          <span class="provider-card-price">${(p.priceFormatted || '¢10,000').split(' ')[0]}</span>
        </div>
      </div>
    `;
    wrapper.insertAdjacentHTML('beforeend', cardHtml);
  });
}

// 3. Capturar búsquedas y redirigir
function setupSearchActions() {
  const searchBtn = document.getElementById('hero-search-btn');
  const searchInput = document.getElementById('hero-search-input');
  const categorySelect = document.getElementById('hero-category-select');

  if (searchBtn && searchInput && categorySelect) {
    searchBtn.addEventListener('click', () => {
      const q = searchInput.value.trim();
      const cat = categorySelect.value;
      let url = 'busqueda.html';

      let params = [];
      if (q) params.push(`search=${encodeURIComponent(q)}`);
      if (cat) params.push(`category=${encodeURIComponent(cat)}`);

      if (params.length > 0) {
        url += '?' + params.join('&');
      }

      window.location.href = url;
    });
  }

  // Chips clickeables
  const chips = document.querySelectorAll('.chip-search');
  chips.forEach(chip => {
    chip.addEventListener('click', () => {
      const cat = chip.getAttribute('data-category');
      window.location.href = `busqueda.html?category=${cat}`;
    });
  });
}

// 4. Inicializar fondo de red con nodos interactivos en canvas
function initNetworkBackground() {
  const canvas = document.getElementById('network-canvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  const section = document.getElementById('seccion-buscador');
  if (!section) return;

  function resizeCanvas() {
    canvas.width = section.offsetWidth;
    canvas.height = section.offsetHeight;
  }

  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);

  const particles = [];
  // Densidad adaptativa de partículas según el tamaño de pantalla
  const densityFactor = window.innerWidth < 768 ? 25000 : 15000;
  const particleCount = Math.min(75, Math.floor((canvas.width * canvas.height) / densityFactor));
  const connectionDistance = 140;

  // Colores institucionales de MEG con opacidad suave para un estilo tecnológico elegante
  const colors = [
    'rgba(26, 63, 214, 0.4)',   // Azul institucional
    'rgba(123, 111, 232, 0.4)',  // Púrpura
    'rgba(0, 210, 196, 0.4)'     // Menta
  ];

  class Particle {
    constructor() {
      this.x = Math.random() * canvas.width;
      this.y = Math.random() * canvas.height;
      this.vx = (Math.random() - 0.5) * 0.35; // Velocidad suave
      this.vy = (Math.random() - 0.5) * 0.35;
      this.radius = Math.random() * 3 + 1.5;
      this.color = colors[Math.floor(Math.random() * colors.length)];
    }

    update() {
      this.x += this.vx;
      this.y += this.vy;

      if (this.x < 0) this.x = canvas.width;
      if (this.x > canvas.width) this.x = 0;
      if (this.y < 0) this.y = canvas.height;
      if (this.y > canvas.height) this.y = 0;
    }

    draw() {
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
      ctx.fillStyle = this.color;
      ctx.fill();
    }
  }

  for (let i = 0; i < particleCount; i++) {
    particles.push(new Particle());
  }

  function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Dibujar líneas de conexión entre nodos cercanos
    for (let i = 0; i < particles.length; i++) {
      const p1 = particles[i];
      p1.update();

      for (let j = i + 1; j < particles.length; j++) {
        const p2 = particles[j];

        const dx = p1.x - p2.x;
        const dy = p1.y - p2.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < connectionDistance) {
          const alpha = (1 - dist / connectionDistance) * 0.16;
          ctx.beginPath();
          ctx.moveTo(p1.x, p1.y);
          ctx.lineTo(p2.x, p2.y);
          ctx.strokeStyle = `rgba(143, 153, 169, ${alpha})`;
          ctx.lineWidth = 0.8;
          ctx.stroke();
        }
      }
    }

    // Dibujar los nodos en el canvas
    for (let i = 0; i < particles.length; i++) {
      particles[i].draw();
    }

    requestAnimationFrame(animate);
  }

  animate();
}
