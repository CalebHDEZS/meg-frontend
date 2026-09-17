// Simulación de Herramientas de IA para el Dashboard de Proveedores

document.addEventListener('DOMContentLoaded', () => {
  setupIaTools();
});

function setupIaTools() {
  const btnGenerar = document.getElementById('btn-ia-generar');
  if (!btnGenerar) return;

  btnGenerar.addEventListener('click', () => {
    const toolSelect = document.getElementById('ia-tool-select');
    const inputArea = document.getElementById('ia-input-text');
    const outputArea = document.getElementById('ia-output-text');
    const resultBox = document.getElementById('ia-result-box');
    const spinner = document.getElementById('ia-loading-spinner');
    
    if (!inputArea.value.trim()) {
      showToast("Campo vacío", "Por favor escribe una idea o descripción de tu servicio primero.", "error");
      return;
    }
    
    // Mostrar estado de carga
    spinner.style.display = 'flex';
    resultBox.style.display = 'none';
    btnGenerar.disabled = true;
    
    const toolSelected = toolSelect.value;
    const inputText = inputArea.value.trim();
    
    // Simular retraso de procesamiento de IA (1.5 segundos)
    setTimeout(() => {
      let generatedText = "";
      
      if (toolSelected === "descripcion") {
        generatedText = generateIaDescription(inputText);
      } else if (toolSelected === "cotizacion") {
        generatedText = generateIaQuote(inputText);
      } else if (toolSelected === "anuncio") {
        generatedText = generateIaAd(inputText);
      } else if (toolSelected === "consejo") {
        generatedText = generateIaAdvice(inputText);
      }
      
      outputArea.value = generatedText;
      
      // Mostrar resultados
      spinner.style.display = 'none';
      resultBox.style.display = 'block';
      btnGenerar.disabled = false;
      
      showToast("¡Sugerencia de IA lista!", "El resultado se ha generado con éxito.", "ia");
    }, 1500);
  });
}

// Generadores de plantillas de texto dinámicos para simular la IA
function generateIaDescription(input) {
  return `✨ DESCRIPCIÓN PROFESIONAL SUGERIDA POR MEG IA:

¿Buscas una solución confiable y de alta calidad para tu necesidad? Mi nombre es especialista en servicios profesionales para la Zona Central.

Ofrezco un servicio especializado enfocado en:
👉 ${input}

¿Por qué elegir mis servicios?
✔️ Experiencia y garantía: Nos adaptamos exactamente a tus plazos y presupuestos.
✔️ Identidad y seguridad: Respaldado por el sistema de verificación MEG.
✔️ Cobertura y puntualidad: Servicio a domicilio y atención personalizada.

Escríbeme hoy mismo para coordinar detalles y obtener un presupuesto detallado.`;
}

function generateIaQuote(input) {
  const randNum = Math.floor(Math.random() * 9000) + 1000;
  return `📄 COTIZACIÓN FORMAL SUGERIDA POR MEG IA
CÓDIGO DE COTIZACIÓN: #MEG-CR-${randNum}
FECHA: ${new Date().toLocaleDateString('es-CR')}
PROVEEDOR: Su Nombre Comercial
CLIENTE: Estimado(a) Cliente MEG

DETALLE DEL TRABAJO SOLICITADO:
----------------------------------------------
Servicio sugerido: Desarrollo y ejecución de:
> ${input}

DETALLES FINANCIEROS:
• Mano de obra calificada: ¢15,000 / hora o tarifa fija acordada.
• Materiales / Logística: Incluido en la cotización base.
• Plazo estimado: Sujeto a coordinación.
----------------------------------------------
TOTAL NETO ESTIMADO: ¢75,000 colones CRC
*Esta cotización es preliminar y se confirmará por mensaje privado de MEG.*`;
}

function generateIaAd(input) {
  return `📱 ANUNCIO PARA REDES SOCIALES (WHATSAPP & INSTAGRAM)
Generado por MEG IA ✨

¿Cansado de buscar y no encontrar opciones profesionales? 🇨🇷 
¡Te ayudo con tu proyecto! 🛠️

Especialista en:
📌 ${input}

📍 Zona Central de Costa Rica (San José, Heredia, Alajuela, Cartago)
⭐ Servicio garantizado, puntual y de confianza.

🔗 Mira mis trabajos y agenda tu espacio haciendo clic en mi perfil de MEG:
[Insertar enlace a tu perfil MEG aquí]

#ServiciosCostaRica #MEG #PymesCR #ZonaCentral`;
}

function generateIaAdvice(input) {
  return `💡 SUGERENCIAS DE CRECIMIENTO MEG IA
Análisis de tu descripción: "${input.substring(0, 40)}..."

Para maximizar tus ventas, nuestro algoritmo sugiere realizar los siguientes ajustes en tu perfil:
1. 📈 Palabras Clave: Intenta incorporar términos como "garantía por escrito", "a domicilio" y "servicio rápido" para coincidir mejor con búsquedas de clientes.
2. 📸 Portafolio: Sube al menos 3 fotos reales de tus trabajos en la pestaña 'Portafolio' para incrementar en un 40% la confianza del consumidor.
3. 💬 Respuestas Rápidas: El 85% de los clientes en la Zona Central contrata al primer proveedor en responder. Habilita las notificaciones en tu celular.`;
}

// Acción de copiar al portapapeles
function copiarTextoIa() {
  const outputArea = document.getElementById('ia-output-text');
  if (outputArea) {
    outputArea.select();
    document.execCommand('copy');
    showToast("Copiado", "El texto se ha copiado al portapapeles.", "success");
  }
}
