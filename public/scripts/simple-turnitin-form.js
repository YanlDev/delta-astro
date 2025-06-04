// public/scripts/simple-turnitin-form.js
// Versión sin simulaciones - usa las variables de entorno reales

class SimpleTurnitinForm {
  constructor() {
    this.uploadedFiles = [];
    this.paymentFile = null;
    this.maxFiles = 1;

    this.init();
  }

  init() {
    console.log('🚀 Inicializando formulario Turnitin...');

    this.bindEvents();
    this.validateForm();

    console.log('✅ Formulario inicializado correctamente');
  }

  bindEvents() {
    // Selección de tipo de reporte
    document.querySelectorAll('input[name="reportType"]').forEach(radio => {
      radio.addEventListener('change', (e) => this.handleReportTypeChange(e));
    });

    // Selección de método de entrega  
    document.querySelectorAll('input[name="deliveryMethod"]').forEach(radio => {
      radio.addEventListener('change', (e) => this.handleDeliveryMethodChange(e));
    });

    // Upload de documentos
    const documentsInput = document.getElementById('documents');
    if (documentsInput) {
      documentsInput.addEventListener('change', (e) => this.handleDocumentUpload(e));
    }

    // Upload de comprobante
    const paymentInput = document.getElementById('payment');
    if (paymentInput) {
      paymentInput.addEventListener('change', (e) => this.handlePaymentUpload(e));
    }

    // Validación en tiempo real
    ['fullName', 'phone', 'email', 'message'].forEach(fieldId => {
      const field = document.getElementById(fieldId);
      if (field) {
        field.addEventListener('input', () => this.validateForm());
        field.addEventListener('blur', () => this.validateForm());
      }
    });

    // Submit del formulario
    const submitBtn = document.getElementById('submitBtn');
    if (submitBtn) {
      submitBtn.addEventListener('click', (e) => this.handleSubmit(e));
    }
  }

  handleReportTypeChange(e) {
    console.log('📊 Cambiando tipo de reporte:', e.target.value);

    // Limpiar selecciones visuales
    document.querySelectorAll('.report-card').forEach(card => {
      card.classList.remove('border-blue-500', 'border-purple-500', 'bg-blue-900/30', 'bg-purple-900/30');
      card.classList.add('border-slate-600');
    });

    // Marcar seleccionado
    const card = e.target.closest('.report-option').querySelector('.report-card');
    card.classList.remove('border-slate-600');

    if (e.target.value === 'unico') {
      card.classList.add('border-blue-500', 'bg-blue-900/30');
    } else {
      card.classList.add('border-purple-500', 'bg-purple-900/30');
    }

    // Actualizar configuración de archivos
    this.maxFiles = parseInt(e.target.dataset.files);
    this.updateFileUploadConfig();

    // Limpiar archivos existentes
    this.clearUploadedFiles();

    this.validateForm();
  }

  handleDeliveryMethodChange(e) {
    console.log('📧 Cambiando método de entrega:', e.target.value);

    // Limpiar selecciones visuales
    document.querySelectorAll('.delivery-card').forEach(card => {
      card.classList.remove('border-green-500', 'border-blue-500', 'bg-green-900/30', 'bg-blue-900/30');
      card.classList.add('border-slate-600');
    });

    // Marcar seleccionado
    const card = e.target.closest('.delivery-option').querySelector('.delivery-card');
    card.classList.remove('border-slate-600');

    if (e.target.value === 'whatsapp') {
      card.classList.add('border-green-500', 'bg-green-900/30');
    } else {
      card.classList.add('border-blue-500', 'bg-blue-900/30');
    }

    this.validateForm();
  }

  updateFileUploadConfig() {
    const fileCountText = document.getElementById('file-count-text');
    const filesNeeded = document.getElementById('files-needed');
    const documentsInput = document.getElementById('documents');

    if (this.maxFiles === 3) {
      documentsInput.setAttribute('multiple', 'true');
      fileCountText.textContent = 'documentos (3)';
      filesNeeded.textContent = 'archivos';
    } else {
      documentsInput.removeAttribute('multiple');
      fileCountText.textContent = 'documento';
      filesNeeded.textContent = 'archivo';
    }
  }

  handleDocumentUpload(e) {
    const files = Array.from(e.target.files);

    if (files.length === 0) return;

    // Validar número de archivos
    if (files.length > this.maxFiles) {
      this.showAlert(`Solo puedes subir ${this.maxFiles} archivo(s)`, 'error');
      e.target.value = '';
      return;
    }

    // Validar cada archivo
    const validFiles = [];
    for (const file of files) {
      if (this.validateDocument(file)) {
        validFiles.push(file);
      } else {
        e.target.value = '';
        return;
      }
    }

    this.uploadedFiles = validFiles;
    this.showFilePreview();
    this.validateForm();
  }

  handlePaymentUpload(e) {
    const file = e.target.files[0];
    if (!file) return;

    if (this.validateImage(file)) {
      this.paymentFile = file;
      this.showPaymentPreview(file);
      this.validateForm();
    } else {
      e.target.value = '';
    }
  }

  validateDocument(file) {
    const allowedTypes = [
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/pdf'
    ];

    if (!allowedTypes.includes(file.type)) {
      this.showAlert('Solo se permiten archivos DOC, DOCX y PDF', 'error');
      return false;
    }

    if (file.size > 10 * 1024 * 1024) {
      this.showAlert('El documento no debe superar los 10MB', 'error');
      return false;
    }

    return true;
  }

  validateImage(file) {
    if (!file.type.startsWith('image/')) {
      this.showAlert('Solo se permiten archivos de imagen', 'error');
      return false;
    }

    if (file.size > 5 * 1024 * 1024) {
      this.showAlert('La imagen no debe superar los 5MB', 'error');
      return false;
    }

    return true;
  }

  showFilePreview() {
    const preview = document.getElementById('files-preview');
    if (!preview) return;

    preview.innerHTML = '';
    preview.classList.remove('hidden');

    this.uploadedFiles.forEach((file, index) => {
      const div = document.createElement('div');
      div.className = 'bg-slate-800/50 border border-slate-600 rounded-lg p-4 flex items-center justify-between';

      const truncatedName = file.name.length > 25 ?
        file.name.substring(0, 25) + '...' :
        file.name;

      div.innerHTML = `
        <div class="flex items-center">
          <span class="text-2xl mr-3">📄</span>
          <div>
            <div class="text-white font-medium" title="${file.name}">${truncatedName}</div>
            <div class="text-gray-400 text-sm">${this.formatFileSize(file.size)}</div>
          </div>
        </div>
        <button type="button" onclick="window.turnitinForm.removeFile(${index})" class="text-red-400 hover:text-red-300 p-2 rounded-lg hover:bg-red-500/10 transition-colors">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
          </svg>
        </button>
      `;
      preview.appendChild(div);
    });
  }

  showPaymentPreview(file) {
    const preview = document.getElementById('payment-preview');
    if (!preview) return;

    const truncatedName = file.name.length > 25 ?
      file.name.substring(0, 25) + '...' :
      file.name;

    preview.innerHTML = `
      <div class="bg-slate-800/50 border border-slate-600 rounded-lg p-4 flex items-center justify-between">
        <div class="flex items-center">
          <span class="text-2xl mr-3">📷</span>
          <div>
            <div class="text-white font-medium" title="${file.name}">${truncatedName}</div>
            <div class="text-gray-400 text-sm">${this.formatFileSize(file.size)}</div>
          </div>
        </div>
        <button type="button" onclick="window.turnitinForm.removePayment()" class="text-red-400 hover:text-red-300 p-2 rounded-lg hover:bg-red-500/10 transition-colors">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
          </svg>
        </button>
      </div>
    `;
    preview.classList.remove('hidden');
  }

  clearUploadedFiles() {
    this.uploadedFiles = [];
    const preview = document.getElementById('files-preview');
    const documentsInput = document.getElementById('documents');

    if (preview) preview.classList.add('hidden');
    if (documentsInput) documentsInput.value = '';
  }

  removeFile(index) {
    this.uploadedFiles.splice(index, 1);

    if (this.uploadedFiles.length === 0) {
      this.clearUploadedFiles();
    } else {
      this.showFilePreview();
    }

    this.validateForm();
  }

  removePayment() {
    this.paymentFile = null;

    const paymentInput = document.getElementById('payment');
    const paymentPreview = document.getElementById('payment-preview');

    if (paymentInput) paymentInput.value = '';
    if (paymentPreview) paymentPreview.classList.add('hidden');

    this.validateForm();
  }

  validateForm() {
    const fullName = document.getElementById('fullName')?.value.trim() || '';
    const phone = document.getElementById('phone')?.value.trim() || '';
    const email = document.getElementById('email')?.value.trim() || '';
    const reportType = document.querySelector('input[name="reportType"]:checked');
    const deliveryMethod = document.querySelector('input[name="deliveryMethod"]:checked');
    const hasFiles = this.uploadedFiles.length > 0;
    const hasPayment = this.paymentFile !== null;

    // Validar email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const isEmailValid = emailRegex.test(email);

    const isValid = fullName && phone && email && isEmailValid && reportType && deliveryMethod && hasFiles && hasPayment;

    const submitBtn = document.getElementById('submitBtn');
    if (submitBtn) {
      submitBtn.disabled = !isValid;
      if (isValid) {
        submitBtn.classList.remove('opacity-50', 'cursor-not-allowed');
      } else {
        submitBtn.classList.add('opacity-50', 'cursor-not-allowed');
      }
    }

    this.updateSummary();
    return isValid;
  }

  updateSummary() {
    const reportType = document.querySelector('input[name="reportType"]:checked');
    const deliveryMethod = document.querySelector('input[name="deliveryMethod"]:checked');

    if (reportType && deliveryMethod && this.uploadedFiles.length > 0) {
      const summary = document.getElementById('summary');
      const content = document.getElementById('summary-content');

      if (summary && content) {
        const reportText = reportType.value === 'pack' ? 'Pack 3 Reportes (S/15)' : 'Reporte Único (S/7)';
        const deliveryText = deliveryMethod.value === 'whatsapp' ? 'WhatsApp' : 'Email';

        content.innerHTML = `
          <div><strong>Servicio:</strong> ${reportText}</div>
          <div><strong>Archivos:</strong> ${this.uploadedFiles.length} documento(s)</div>
          <div><strong>Entrega:</strong> ${deliveryText}</div>
        `;

        summary.classList.remove('hidden');
      }
    }
  }

  // ENVÍO REAL A TELEGRAM - SIN SIMULACIONES
  async handleSubmit(e) {
    e.preventDefault();

    if (!this.validateForm()) {
      this.showAlert('Por favor completa todos los campos requeridos', 'error');
      return;
    }

    const submitBtn = document.getElementById('submitBtn');
    const originalText = submitBtn.innerHTML;

    // Estado de carga
    submitBtn.innerHTML = '⏳ Enviando...';
    submitBtn.disabled = true;

    try {
      // Recopilar datos del formulario
      const formData = this.collectFormData();
      console.log('📋 Datos a enviar:', formData);

      // ENVIAR REALMENTE A TELEGRAM - usando tus credenciales del .env
      await this.sendToTelegram(formData);

      this.showAlert('✅ Formulario enviado correctamente a Telegram', 'success');

      // Resetear formulario
      setTimeout(() => {
        this.resetForm();
      }, 2000);

    } catch (error) {
      console.error('❌ Error al enviar formulario:', error);
      this.showAlert(`❌ Error al enviar: ${error.message}`, 'error');
    } finally {
      // Restaurar botón
      submitBtn.innerHTML = originalText;
      submitBtn.disabled = false;
    }
  }

  collectFormData() {
    const fullNameValue = document.getElementById('fullName')?.value.trim() || '';
    const nameParts = fullNameValue.split(' ');
    const reportType = document.querySelector('input[name="reportType"]:checked');
    const deliveryMethod = document.querySelector('input[name="deliveryMethod"]:checked');

    return {
      nombre: nameParts[0] || '',
      apellidos: nameParts.slice(1).join(' ') || '',
      telefono: document.getElementById('phone')?.value.trim() || '',
      correo: document.getElementById('email')?.value.trim() || '',
      tipoReporte: reportType?.value || '',
      metodoEntrega: deliveryMethod?.value || '',
      mensaje: document.getElementById('message')?.value.trim() || '',
      documentos: this.uploadedFiles,
      imagenPago: this.paymentFile
    };
  }

  // FUNCIÓN QUE REALMENTE ENVÍA A TELEGRAM
  async sendToTelegram(formData) {
    // Obtener credenciales de las variables de entorno de Astro
    const botToken = window.TELEGRAM_BOT_TOKEN;
    const chatId = window.TELEGRAM_CHAT_ID;

    if (!botToken || !chatId) {
      throw new Error('Variables de Telegram no configuradas. Verifica tu .env');
    }

    console.log('📤 Enviando a Telegram con variables de entorno...');

    // Crear mensaje de texto
    const mensaje = this.createTelegramMessage(formData);

    // Enviar mensaje de texto
    await this.sendTelegramMessage(botToken, chatId, mensaje);

    // Enviar documentos si existen
    if (formData.documentos && formData.documentos.length > 0) {
      for (let i = 0; i < formData.documentos.length; i++) {
        const documento = formData.documentos[i];
        await this.sendTelegramDocument(
          botToken,
          chatId,
          documento,
          `Documento ${i + 1}/${formData.documentos.length} - ${formData.nombre} ${formData.apellidos}`
        );
      }
    }

    // Enviar imagen si existe
    if (formData.imagenPago) {
      await this.sendTelegramPhoto(
        botToken,
        chatId,
        formData.imagenPago,
        `Comprobante de pago - ${formData.nombre} ${formData.apellidos}`
      );
    }

    console.log('✅ Enviado correctamente a Telegram');
  }

  createTelegramMessage(data) {
    const tipoReporteText = data.tipoReporte === 'unico' ? 'Reporte Único (S/7)' : 'Pack de 3 Reportes (S/15)';
    const metodoEntregaText = data.metodoEntrega === 'whatsapp' ? 'WhatsApp' : 'Correo Electrónico';

    return `
🆕 *NUEVA SOLICITUD DE REVISIÓN TURNITIN*

👤 *Datos del Cliente:*
• Nombre: ${data.nombre} ${data.apellidos}
• Teléfono: ${data.telefono}
• Email: ${data.correo}

📊 *Servicio Solicitado:*
• Tipo: ${tipoReporteText}
• Entrega por: ${metodoEntregaText}

📄 *Archivos:*
• Documentos: ${data.documentos ? data.documentos.length : 0} archivo(s)
• Comprobante: ${data.imagenPago ? '✅ Adjuntado' : '❌ No adjuntado'}

💬 *Mensaje Adicional:*
${data.mensaje || 'Sin mensaje adicional'}

⏰ *Fecha:* ${new Date().toLocaleString('es-PE')}
    `.trim();
  }

  async sendTelegramMessage(botToken, chatId, message) {
    const url = `https://api.telegram.org/bot${botToken}/sendMessage`;

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: 'Markdown'
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`Error al enviar mensaje: ${response.status} - ${errorData.description || 'Error desconocido'}`);
    }

    return response.json();
  }

  async sendTelegramDocument(botToken, chatId, file, caption) {
    const url = `https://api.telegram.org/bot${botToken}/sendDocument`;

    const formData = new FormData();
    formData.append('chat_id', chatId);
    formData.append('document', file);
    formData.append('caption', caption);

    const response = await fetch(url, {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`Error al enviar documento: ${response.status} - ${errorData.description || 'Error desconocido'}`);
    }

    return response.json();
  }

  async sendTelegramPhoto(botToken, chatId, file, caption) {
    const url = `https://api.telegram.org/bot${botToken}/sendPhoto`;

    const formData = new FormData();
    formData.append('chat_id', chatId);
    formData.append('photo', file);
    formData.append('caption', caption);

    const response = await fetch(url, {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`Error al enviar imagen: ${response.status} - ${errorData.description || 'Error desconocido'}`);
    }

    return response.json();
  }

  resetForm() {
    // Limpiar campos de texto
    ['fullName', 'phone', 'email', 'message'].forEach(fieldId => {
      const field = document.getElementById(fieldId);
      if (field) field.value = '';
    });

    // Limpiar selecciones de radio
    document.querySelectorAll('input[type="radio"]').forEach(radio => {
      radio.checked = false;
    });

    // Limpiar estilos visuales
    document.querySelectorAll('.report-card, .delivery-card').forEach(card => {
      card.classList.remove('border-blue-500', 'border-purple-500', 'border-green-500', 'bg-blue-900/30', 'bg-purple-900/30', 'bg-green-900/30');
      card.classList.add('border-slate-600');
    });

    // Limpiar archivos
    this.uploadedFiles = [];
    this.paymentFile = null;
    this.maxFiles = 1;

    const documentsInput = document.getElementById('documents');
    const paymentInput = document.getElementById('payment');

    if (documentsInput) {
      documentsInput.value = '';
      documentsInput.removeAttribute('multiple');
    }
    if (paymentInput) paymentInput.value = '';

    // Ocultar previews
    this.clearUploadedFiles();
    this.removePayment();

    // Ocultar resumen
    const summary = document.getElementById('summary');
    if (summary) summary.classList.add('hidden');

    // Resetear textos
    const fileCountText = document.getElementById('file-count-text');
    const filesNeeded = document.getElementById('files-needed');
    if (fileCountText) fileCountText.textContent = 'documento(s)';
    if (filesNeeded) filesNeeded.textContent = 'archivo(s)';

    // Re-validar
    this.validateForm();
  }

  formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  showAlert(message, type = 'info') {
    const alertColors = {
      'success': 'background: #27ae60;',
      'error': 'background: #e74c3c;',
      'warning': 'background: #f39c12;',
      'info': 'background: #3498db;'
    };

    const alertIcons = {
      'success': '✅',
      'error': '❌',
      'warning': '⚠️',
      'info': 'ℹ️'
    };

    const alert = document.createElement('div');
    alert.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 15px 20px;
      border-radius: 8px;
      color: white;
      font-weight: 500;
      z-index: 10000;
      max-width: 400px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      ${alertColors[type]}
    `;

    alert.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 10px;">
        <span>${alertIcons[type]} ${message}</span>
        <button onclick="this.parentElement.parentElement.remove()" style="background: none; border: none; color: white; cursor: pointer; font-size: 12px; padding: 0; opacity: 0.7;">✖</button>
      </div>
    `;

    document.body.appendChild(alert);

    setTimeout(() => {
      if (alert.parentElement) {
        alert.remove();
      }
    }, 5000);
  }
}

// Inicialización
document.addEventListener('DOMContentLoaded', function () {
  console.log('🎯 Inicializando formulario Turnitin sin simulaciones...');

  window.turnitinForm = new SimpleTurnitinForm();

  console.log('✅ Formulario listo para enviar a Telegram');
});