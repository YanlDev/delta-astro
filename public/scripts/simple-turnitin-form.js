// src/scripts/simple-turnitin-form.js

export class SimpleTurnitinForm {
  constructor() {
    this.uploadedFiles = [];
    this.paymentFile = null;
    this.maxFiles = 1;
    
    this.init();
  }

  init() {
    console.log('🚀 Inicializando formulario Turnitin simplificado...');
    
    this.bindEvents();
    this.validateForm(); // Validación inicial
    
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

    // Validación en tiempo real de campos de texto
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

    // Limpiar archivos existentes si cambia el tipo
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
    console.log('📁 Procesando documentos...');

    const files = Array.from(e.target.files);
    
    if (files.length === 0) {
      return;
    }

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

    console.log(`✅ ${validFiles.length} archivo(s) cargado(s) correctamente`);
  }

  handlePaymentUpload(e) {
    console.log('💳 Procesando comprobante...');

    const file = e.target.files[0];
    if (!file) return;

    if (this.validateImage(file)) {
      this.paymentFile = file;
      this.showPaymentPreview(file);
      this.validateForm();
      console.log(`✅ Comprobante cargado: ${file.name}`);
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
    console.log(`🗑️ Removiendo archivo en índice ${index}`);

    this.uploadedFiles.splice(index, 1);
    
    if (this.uploadedFiles.length === 0) {
      this.clearUploadedFiles();
    } else {
      this.showFilePreview();
    }
    
    this.validateForm();
  }

  removePayment() {
    console.log('🗑️ Removiendo comprobante de pago');

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

  async handleSubmit(e) {
    e.preventDefault();
    
    console.log('📤 Enviando formulario...');

    if (!this.validateForm()) {
      this.showAlert('Por favor completa todos los campos requeridos', 'error');
      return;
    }

    const submitBtn = document.getElementById('submitBtn');
    if (!submitBtn) return;

    const originalText = submitBtn.innerHTML;
    
    // Estado de carga
    submitBtn.innerHTML = `
      <svg class="animate-spin w-5 h-5 mr-2 inline" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
      Enviando...
    `;
    submitBtn.disabled = true;

    try {
      // Recopilar datos del formulario
      const formData = this.collectFormData();
      console.log('📋 Datos recopilados:', formData);

      // Simular envío (aquí integrarías con tu API)
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      this.showAlert('¡Solicitud enviada correctamente! Te contactaremos pronto.', 'success');
      
      // Resetear formulario después de un delay
      setTimeout(() => {
        this.resetForm();
      }, 2000);

    } catch (error) {
      console.error('❌ Error al enviar formulario:', error);
      this.showAlert('Error al enviar la solicitud. Por favor, inténtalo de nuevo.', 'error');
    } finally {
      // Restaurar botón
      submitBtn.innerHTML = originalText;
      this.validateForm(); // Re-validar para habilitar/deshabilitar
    }
  }

  collectFormData() {
    const fullNameValue = document.getElementById('fullName')?.value.trim() || '';
    const nameParts = fullNameValue.split(' ');
    const reportType = document.querySelector('input[name="reportType"]:checked');
    const deliveryMethod = document.querySelector('input[name="deliveryMethod"]:checked');

    return {
      // Información personal
      nombre: nameParts[0] || '',
      apellidos: nameParts.slice(1).join(' ') || '',
      telefono: document.getElementById('phone')?.value.trim() || '',
      correo: document.getElementById('email')?.value.trim() || '',
      
      // Configuración del servicio
      tipoReporte: reportType?.value || '',
      metodoEntrega: deliveryMethod?.value || '',
      mensaje: document.getElementById('message')?.value.trim() || '',
      
      // Archivos
      documento: this.uploadedFiles[0] || null, // Para compatibilidad
      documentos: this.uploadedFiles, // Array completo
      imagenPago: this.paymentFile
    };
  }

  resetForm() {
    console.log('🔄 Reiniciando formulario...');

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

    console.log('✅ Formulario reiniciado');
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
      'success': 'border-green-500 bg-green-900/20 text-green-300',
      'error': 'border-red-500 bg-red-900/20 text-red-300',
      'warning': 'border-yellow-500 bg-yellow-900/20 text-yellow-300',
      'info': 'border-blue-500 bg-blue-900/20 text-blue-300'
    };

    const alertIcons = {
      'success': '✅',
      'error': '❌',
      'warning': '⚠️',
      'info': 'ℹ️'
    };

    const alertDiv = document.createElement('div');
    alertDiv.className = `fixed top-4 right-4 z-50 max-w-sm border-l-4 ${alertColors[type]} rounded-lg shadow-lg p-4 transform transition-all duration-300 translate-x-full`;
    
    alertDiv.innerHTML = `
      <div class="flex items-start">
        <span class="text-lg mr-3">${alertIcons[type]}</span>
        <div class="flex-1">
          <p class="text-sm font-medium">${message}</p>
        </div>
        <button onclick="this.parentElement.parentElement.remove()" class="ml-4 text-gray-400 hover:text-white transition-colors">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
          </svg>
        </button>
      </div>
    `;
    
    document.body.appendChild(alertDiv);
    
    // Animar entrada
    setTimeout(() => {
      alertDiv.classList.remove('translate-x-full');
      alertDiv.classList.add('translate-x-0');
    }, 100);
    
    // Auto remover después de 5 segundos
    setTimeout(() => {
      if (alertDiv.parentElement) {
        alertDiv.classList.add('translate-x-full');
        setTimeout(() => alertDiv.remove(), 300);
      }
    }, 5000);
  }
}

// Inicialización
function initializeTurnitinForm() {
  console.log('🎯 Inicializando formulario Turnitin...');
  
  if (typeof window !== 'undefined') {
    window.turnitinForm = new SimpleTurnitinForm();
    
    // Funciones globales para los botones de eliminar
    window.removeFile = (index) => window.turnitinForm?.removeFile(index);
    window.removePayment = () => window.turnitinForm?.removePayment();
    
    console.log('✅ Formulario disponible globalmente');
  }
}

// Inicializar cuando el DOM esté listo
if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeTurnitinForm);
  } else {
    initializeTurnitinForm();
  }
} else {
  console.warn('⚠️ Document no disponible');
}