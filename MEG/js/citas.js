// Calendario mensual interactivo
class MegCalendar {
  constructor(containerId, providerId) {
    this.container = document.getElementById(containerId);
    if (!this.container) return;
    
    this.providerId = parseInt(providerId);
    this.currentDate = new Date(2026, 5, 15); // Junio 2026 (Mes 5 por 0-indexed)
    this.selectedDate = null;
    this.selectedTime = null;
    
    // Días disponibles simulados en el mes
    this.availableDays = [16, 17, 18, 20, 22, 23, 24, 25, 27, 29, 30];
    this.timeSlots = ["09:00 AM", "10:30 AM", "02:00 PM", "03:30 PM", "05:00 PM"];
    
    this.render();
  }

  render() {
    const year = this.currentDate.getFullYear();
    const month = this.currentDate.getMonth();
    
    // Obtener primer día de la semana y total de días
    const firstDayIndex = new Date(year, month, 1).getDay();
    const totalDays = new Date(year, month + 1, 0).getDate();
    
    const monthNames = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
    
    let calendarHtml = `
      <div class="calendar-header">
        <span class="calendar-month">${monthNames[month]} ${year}</span>
      </div>
      <table class="calendar-table">
        <thead>
          <tr>
            <th>D</th><th>L</th><th>M</th><th>M</th><th>J</th><th>V</th><th>S</th>
          </tr>
        </thead>
        <tbody>
          <tr>
    `;
    
    // Rellenar días vacíos antes del día 1
    for (let i = 0; i < firstDayIndex; i++) {
      calendarHtml += `<td></td>`;
    }
    
    let currentDayOfWeek = firstDayIndex;
    for (let day = 1; day <= totalDays; day++) {
      if (currentDayOfWeek === 7) {
        calendarHtml += `</tr><tr>`;
        currentDayOfWeek = 0;
      }
      
      const isAvailable = this.availableDays.includes(day);
      const isSelected = this.selectedDate === day;
      const classAttr = `class="${isAvailable ? 'available-day' : ''} ${isSelected ? 'selected-day' : ''}"`;
      const clickAttr = isAvailable ? `onclick="window.megCalendarInstance.selectDay(${day})"` : '';
      
      calendarHtml += `<td ${classAttr} ${clickAttr}>${day}</td>`;
      currentDayOfWeek++;
    }
    
    // Rellenar días vacíos al final
    while (currentDayOfWeek < 7 && currentDayOfWeek > 0) {
      calendarHtml += `<td></td>`;
      currentDayOfWeek++;
    }
    
    calendarHtml += `
          </tr>
        </tbody>
      </table>
      <div id="slots-container" class="slots-container">
        <p class="select-day-prompt">Selecciona un día en verde para ver horarios disponibles.</p>
      </div>
    `;
    
    this.container.innerHTML = calendarHtml;
    
    // Guardar referencia para que los callbacks onclick funcionen
    window.megCalendarInstance = this;
  }

  selectDay(day) {
    this.selectedDate = day;
    this.render(); // Volver a pintar para reflejar el día seleccionado
    
    // Pintar los horarios
    const slotsContainer = document.getElementById('slots-container');
    if (slotsContainer) {
      let slotsHtml = `
        <h5 class="slots-title">Horarios para el ${day} de Junio:</h5>
        <div class="slots-grid">
      `;
      
      this.timeSlots.forEach(slot => {
        slotsHtml += `
          <button class="slot-btn" onclick="window.megCalendarInstance.selectTime('${slot}')">
            ${slot}
          </button>
        `;
      });
      
      slotsHtml += `</div>`;
      slotsContainer.innerHTML = slotsHtml;
    }
  }

  selectTime(time) {
    this.selectedTime = time;
    
    // Simular apertura del modal de confirmación
    const session = getSession();
    if (!session.isLoggedIn) {
      showToast("Iniciar sesión requerido", "Debes iniciar sesión para agendar citas.", "error");
      setTimeout(() => {
        window.location.href = "auth.html?tab=login&redirect=perfil-proveedor.html?id=" + this.providerId;
      }, 1500);
      return;
    }
    
    // Cargar datos del proveedor para mostrar en el modal
    const providers = getProviders();
    const provider = providers.find(p => p.id === this.providerId);
    
    const modalConfirmText = document.getElementById('modal-confirm-text');
    if (modalConfirmText) {
      modalConfirmText.innerHTML = `
        Agendando cita con <strong>${provider.name}</strong> para el día <strong>${this.selectedDate} de Junio de 2026</strong> a las <strong>${this.selectedTime}</strong>.
      `;
    }
    
    openModal('booking-modal');
  }

  confirmBooking() {
    const notes = document.getElementById('booking-notes')?.value || "";
    
    // Crear objeto de cita
    const newAppointment = {
      id: Date.now(),
      providerId: this.providerId,
      date: `${this.selectedDate} de Junio, 2026`,
      time: this.selectedTime,
      notes: notes,
      status: "Pendiente de confirmación",
      clientName: getSession().userName || "Usuario Cliente"
    };
    
    // Guardar cita en LocalStorage
    const appointments = JSON.parse(localStorage.getItem('meg_appointments')) || [];
    appointments.push(newAppointment);
    localStorage.setItem('meg_appointments', JSON.stringify(appointments));
    
    closeModal('booking-modal');
    showToast("Cita Solicitada", "El proveedor recibirá la notificación para confirmar tu cita.", "success");
  }
}
