// Lógica específica de la página de planes (planes.html)

document.addEventListener('DOMContentLoaded', () => {
  initPlanesPage();
});

function initPlanesPage() {
  setupBillingToggle();
  setupFaqAccordions();
}

function setupBillingToggle() {
  const toggleInput = document.getElementById('billing-cycle-toggle');
  const priceProLabel = document.getElementById('price-pro-val');
  const billingPeriodLabel = document.getElementById('billing-period-label');
  
  if (!toggleInput || !priceProLabel || !billingPeriodLabel) return;
  
  toggleInput.addEventListener('change', () => {
    if (toggleInput.checked) {
      // Anual (20% de descuento)
      priceProLabel.textContent = '¢10,000';
      billingPeriodLabel.innerHTML = '/ mes <span style="display:block; font-size:10px; color:var(--text-muted); font-weight:500;">Facturado anualmente (¢120,000)</span>';
      showToast("Facturación Anual", "Se aplicó un 20% de descuento en el Plan Pro.", "success");
    } else {
      // Mensual
      priceProLabel.textContent = '¢12,500';
      billingPeriodLabel.innerHTML = '/ mes <span style="display:block; font-size:10px; color:var(--text-muted); font-weight:500;">Facturado mensualmente</span>';
    }
  });
}

function setupFaqAccordions() {
  const faqItems = document.querySelectorAll('.faq-item');
  
  faqItems.forEach(item => {
    item.addEventListener('click', () => {
      const answer = item.querySelector('.faq-answer');
      const icon = item.querySelector('.faq-question i');
      
      if (!answer || !icon) return;
      
      // Alternar visualización
      const isVisible = answer.style.display === 'block';
      
      // Cerrar todos los demás primero
      document.querySelectorAll('.faq-answer').forEach(ans => ans.style.display = 'none');
      document.querySelectorAll('.faq-question i').forEach(ic => {
        ic.className = 'ph-caret-down';
      });
      
      if (!isVisible) {
        answer.style.display = 'block';
        icon.className = 'ph-caret-up';
      } else {
        answer.style.display = 'none';
        icon.className = 'ph-caret-down';
      }
    });
  });
}
