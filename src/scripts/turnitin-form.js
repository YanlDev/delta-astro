// src/scripts/turnitin-form.js - Versión CORREGIDA para navegación

// Importar clases (solo cuando estén disponibles)
let TelegramAPI, FormUtils;

// Cargar dinámicamente las dependencias
async function loadDependencies() {
  try {
    const telegramModule = await import('./telegram-api.js');
    const utilsModule = await import('./form-utils.js');

    TelegramAPI = telegramModule.TelegramAPI;
    FormUtils = utilsModule.FormUtils;

    return true;
  } catch (error) {
    console.error('Error cargando dependencias:', error);
    return false;
  }
}

export class TurnitinForm {
  constructor() {
    this.currentStep = 1;
    this.totalSteps = 4;
    this.formData = {
      reportType: '',
      maxFiles: 1,
      uploadedFiles: [],
      deliveryMethod: '',
      paymentProof: null
    };

    this.telegram = null;
    this.utils = null;
    this.isInitialized = false;

    this.init();
  }

  async init() {
    console.log('🚀 Inicializando formulario Turnitin...');

    // Cargar dependencias
    const loaded = await loadDependencies();
    if (loaded) {
      this.telegram = new TelegramAPI();
      this.utils = new FormUtils();
      console.log('✅ Dependencias cargadas correctamente');
    } else {
      console.warn('⚠️ Dependencias no disponibles, usando funciones básicas');
      this.utils = this.createBasicUtils();
    }

    this.bindEvents();
    this.showStep(1);
    this.isInitialized = true;

    console.log('✅ Formulario inicializado correctamente');
  }

  // Utilidades básicas en caso de fallo de carga
  createBasicUtils() {
    return {
      showAlert: (message, type = 'info') => {
        const alertClass = type === 'error' ? 'border-red-500 text-red-300' :
          type === 'success' ? 'border-green-500 text-green-300' :
            'border-blue-500 text-blue-300';

        const alertDiv = document.createElement('div');
        alertDiv.className = `fixed top-4 right-4 z-50 max-w-sm bg-slate-800 border-l-4 ${alertClass} rounded-lg shadow-lg p-4`;
        alertDiv.innerHTML = `
          <div class="flex justify-between items-center">
            <span class="text-sm">${message}</span>
            <button onclick="this.parentElement.parentElement.remove()" class="ml-4 text-gray-400 hover:text-white">×</button>
          </div>
        `;

        document.body.appendChild(alertDiv);
        setTimeout(() => alertDiv.remove(), 5000);
      },

      validateDocument: (file) => {
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
      },

      validateImage: (file) => {
        if (!file.type.startsWith('image/')) {
          this.showAlert('Solo se permiten archivos de imagen', 'error');
          return false;
        }

        if (file.size > 5 * 1024 * 1024) {
          this.showAlert('La imagen no debe superar los 5MB', 'error');
          return false;
        }

        return true;
      },

      formatFileSize: (bytes) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
      },

      setButtonLoading: (button, isLoading, originalText = null) => {
        if (isLoading) {
          button.innerHTML = `
            <svg class="animate-spin w-4 h-4 mr-2 inline" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Enviando...
          `;
          button.disabled = true;
        } else {
          button.innerHTML = originalText || 'Enviar Solicitud';
          button.disabled = false;
        }
      }
    };
  }

  bindEvents() {
    console.log('🔗 Vinculando eventos...');

    // Navegación entre pasos
    document.addEventListener('click', (e) => {
      if (e.target.classList.contains('next-btn') || e.target.closest('.next-btn')) {
        e.preventDefault();
        this.nextStep();
      }

      if (e.target.classList.contains('prev-btn') || e.target.closest('.prev-btn')) {
        e.preventDefault();
        this.prevStep();
      }

      // Selección de tipo de reporte
      if (e.target.classList.contains('report-option') || e.target.closest('.report-option')) {
        e.preventDefault();
        const button = e.target.closest('.report-option');
        this.selectReportType(button);
      }

      // Selección de método de entrega
      if (e.target.classList.contains('delivery-option') || e.target.closest('.delivery-option')) {
        e.preventDefault();
        const button = e.target.closest('.delivery-option');
        this.selectDeliveryMethod(button);
      }
    });

    // Upload de archivos
    const documentsInput = document.getElementById('documents');
    const paymentInput = document.getElementById('payment');

    if (documentsInput) {
      documentsInput.addEventListener('change', (e) => this.handleFileUpload(e));
    }

    if (paymentInput) {
      paymentInput.addEventListener('change', (e) => this.handlePaymentUpload(e));
    }

    // Submit del formulario
    const form = document.getElementById('turnitinForm');
    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        this.handleSubmit(e);
      });
    }

    // Validación en tiempo real de campos de texto
    ['fullName', 'phone', 'email'].forEach(fieldId => {
      const field = document.getElementById(fieldId);
      if (field) {
        field.addEventListener('input', () => this.validateStep1());
      }
    });

    console.log('✅ Eventos vinculados correctamente');
  }

  // MÉTODO CORREGIDO para mostrar pasos
  showStep(step) {
    console.log(`📄 Mostrando paso ${step}`);

    const steps = document.querySelectorAll('.form-step');

    steps.forEach((stepElement, index) => {
      const stepNumber = index + 1;

      // Remover todas las clases de estado
      stepElement.classList.remove('active', 'prev', 'next');

      if (stepNumber === step) {
        // Paso actual - visible
        stepElement.classList.add('active');
        stepElement.style.opacity = '1';
        stepElement.style.transform = 'translateX(0)';
        stepElement.style.zIndex = '10';
        stepElement.style.display = 'block'; // Asegurar que esté visible
      } else if (stepNumber < step) {
        // Pasos anteriores - ocultos a la izquierda
        stepElement.classList.add('prev');
        stepElement.style.opacity = '0';
        stepElement.style.transform = 'translateX(-100%)';
        stepElement.style.zIndex = '1';
        stepElement.style.display = 'block'; // Mantener en DOM para transición
      } else {
        // Pasos siguientes - ocultos a la derecha
        stepElement.classList.add('next');
        stepElement.style.opacity = '0';
        stepElement.style.transform = 'translateX(100%)';
        stepElement.style.zIndex = '1';
        stepElement.style.display = 'block'; // Mantener en DOM para transición
      }
    });

    // Actualizar indicadores
    this.updateStepIndicators(step);
    this.configureStep(step);
    this.currentStep = step;

    console.log(`✅ Paso ${step} mostrado correctamente`);
  }

  updateStepIndicators(currentStep) {
    document.querySelectorAll('.step-indicator').forEach((indicator, index) => {
      const stepNum = index + 1;

      // Limpiar clases anteriores
      indicator.className = 'step-indicator w-6 h-6 md:w-8 md:h-8 rounded-full flex items-center justify-center text-xs md:text-sm font-medium transition-all';

      if (stepNum === currentStep) {
        indicator.classList.add('bg-blue-500', 'text-white', 'active');
      } else if (stepNum < currentStep) {
        indicator.classList.add('bg-green-500', 'text-white', 'completed');
      } else {
        indicator.classList.add('bg-slate-700', 'text-gray-400');
      }
    });
  }

  configureStep(step) {
    switch (step) {
      case 3:
        this.setupFileUpload();
        break;
      case 4:
        this.setupFinalStep();
        break;
    }
  }

  setupFileUpload() {
    const input = document.getElementById('documents');
    const fileCountText = document.getElementById('file-count-text');
    const filesNeeded = document.getElementById('files-needed');

    if (!input || !fileCountText || !filesNeeded) {
      console.error('❌ Elementos de upload no encontrados');
      return;
    }

    // Configurar según tipo de reporte
    if (this.formData.reportType === 'pack') {
      input.setAttribute('multiple', 'true');
      fileCountText.textContent = 'documentos (3)';
      filesNeeded.textContent = 'archivos';
    } else {
      input.removeAttribute('multiple');
      fileCountText.textContent = 'documento';
      filesNeeded.textContent = 'archivo';
    }

    // Limpiar archivos anteriores
    this.formData.uploadedFiles = [];
    input.value = '';
    this.hideFilePreview();
  }

  setupFinalStep() {
    const paymentContainer = document.getElementById('payment-upload-container');
    if (paymentContainer) {
      paymentContainer.classList.remove('hidden');
    }
    this.updateSummary();
  }

  selectReportType(button) {
    console.log('📊 Seleccionando tipo de reporte...');

    // Limpiar selección anterior
    document.querySelectorAll('.report-option').forEach(opt => {
      opt.classList.remove('selected');
    });

    // Seleccionar nuevo
    button.classList.add('selected');

    this.formData.reportType = button.dataset.value;
    this.formData.maxFiles = parseInt(button.dataset.files);

    console.log(`✅ Tipo seleccionado: ${this.formData.reportType}, Max archivos: ${this.formData.maxFiles}`);

    // Buscar específicamente el botón del paso 2
    const step2 = document.querySelector('.form-step[data-step="2"]');
    const nextBtn = step2?.querySelector('.next-btn');

    if (nextBtn) {
      nextBtn.disabled = false;
      nextBtn.classList.remove('opacity-50', 'cursor-not-allowed');
      console.log('✅ Botón del paso 2 habilitado');
    } else {
      console.error('❌ No se encontró el botón del paso 2');
    }
  }

  selectDeliveryMethod(button) {
    console.log('📧 Seleccionando método de entrega...');

    // Limpiar selección anterior
    document.querySelectorAll('.delivery-option').forEach(opt => {
      opt.classList.remove('selected');
    });

    // Seleccionar nuevo
    button.classList.add('selected');

    this.formData.deliveryMethod = button.dataset.value;

    console.log(`✅ Método seleccionado: ${this.formData.deliveryMethod}`);

    this.updateSubmitButton();
  }

  // Método auxiliar para habilitar botones de paso específico
  enableStepButton(step, buttonType) {
    const stepElement = document.querySelector(`[data-step="${step}"]`);
    if (!stepElement) return;

    const button = stepElement.querySelector(`.${buttonType}-btn`);
    if (button) {
      button.disabled = false;
      button.classList.remove('opacity-50', 'cursor-not-allowed');
    }
  }

  // Método auxiliar para deshabilitar botones de paso específico
  disableStepButton(step, buttonType) {
    const stepElement = document.querySelector(`[data-step="${step}"]`);
    if (!stepElement) return;

    const button = stepElement.querySelector(`.${buttonType}-btn`);
    if (button) {
      button.disabled = true;
      button.classList.add('opacity-50', 'cursor-not-allowed');
    }
  }

  handleFileUpload(e) {
    console.log('📁 Procesando archivos...');

    const files = Array.from(e.target.files);

    if (files.length === 0) {
      console.log('❌ No se seleccionaron archivos');
      return;
    }

    // Validar número de archivos
    if (files.length > this.formData.maxFiles) {
      this.utils.showAlert(`Solo puedes subir ${this.formData.maxFiles} archivo(s)`, 'error');
      e.target.value = '';
      return;
    }

    // Validar cada archivo
    const validFiles = [];
    for (const file of files) {
      if (this.utils.validateDocument(file)) {
        validFiles.push(file);
        console.log(`✅ Archivo válido: ${file.name}`);
      } else {
        console.log(`❌ Archivo inválido: ${file.name}`);
        e.target.value = '';
        return;
      }
    }

    this.formData.uploadedFiles = validFiles;
    this.renderFilePreview();

    // Habilitar botón siguiente si se subieron todos los archivos necesarios
    const step3 = document.querySelector('.form-step[data-step="3"]');
    const nextBtn = step3?.querySelector('.next-btn');

    if (nextBtn) {
      if (validFiles.length === this.formData.maxFiles) {
        nextBtn.disabled = false;
        nextBtn.classList.remove('opacity-50', 'cursor-not-allowed');
        console.log('✅ Botón siguiente del paso 3 habilitado');
      } else {
        nextBtn.disabled = true;
        nextBtn.classList.add('opacity-50', 'cursor-not-allowed');
        console.log('⚠️ Botón siguiente deshabilitado - faltan archivos');
      }
    }
  }

  renderFilePreview() {
    const preview = document.getElementById('files-preview');
    const dropZone = document.getElementById('drop-zone');

    if (!preview) {
      console.error('❌ Elemento files-preview no encontrado');
      return;
    }

    // Ocultar zona de drop cuando hay archivos
    if (dropZone) {
      dropZone.style.display = 'none';
    }

    preview.innerHTML = '';
    preview.classList.remove('hidden');

    // Container con scroll simple
    const container = document.createElement('div');
    container.className = 'max-h-60 overflow-y-auto space-y-3';

    this.formData.uploadedFiles.forEach((file, index) => {
      const fileElement = document.createElement('div');
      fileElement.className = 'bg-slate-800/50 border border-slate-600 rounded-lg p-3 md:p-4 flex items-center justify-between';

      // Truncar nombre del archivo si es muy largo
      const truncatedName = file.name.length > 30 ?
        file.name.substring(0, 30) + '...' :
        file.name;

      fileElement.innerHTML = `
      <div class="flex items-center flex-1 min-w-0">
        <span class="text-xl md:text-2xl mr-3 flex-shrink-0">📄</span>
        <div class="flex-1 min-w-0">
          <div class="text-white text-sm font-medium truncate" title="${file.name}">${truncatedName}</div>
          <div class="text-gray-400 text-xs">${this.utils.formatFileSize(file.size)}</div>
        </div>
      </div>
      <button 
        type="button" 
        onclick="window.turnitinForm.removeFile(${index})" 
        class="ml-3 text-red-400 hover:text-red-300 transition-colors p-2 hover:bg-red-500/10 rounded-lg flex-shrink-0"
        title="Eliminar archivo"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
        </svg>
      </button>
    `;
      container.appendChild(fileElement);
    });

    preview.appendChild(container);

    console.log(`✅ Preview renderizado para ${this.formData.uploadedFiles.length} archivos`);
  }

  hideFilePreview() {
    const preview = document.getElementById('files-preview');
    const dropZone = document.getElementById('drop-zone');

    if (preview) {
      preview.classList.add('hidden');
    }

    // Mostrar zona de drop cuando no hay archivos
    if (dropZone) {
      dropZone.style.display = 'block';
    }
  }
  removeFile(index) {
    console.log(`🗑️ Removiendo archivo en índice ${index}`);

    this.formData.uploadedFiles.splice(index, 1);

    if (this.formData.uploadedFiles.length === 0) {
      this.hideFilePreview();
    } else {
      this.renderFilePreview();
    }

    // Actualizar input
    const input = document.getElementById('documents');
    if (input) input.value = '';

    // Deshabilitar botón siguiente
    const step3 = document.querySelector('.form-step[data-step="3"]');
    const nextBtn = step3?.querySelector('.next-btn');

    if (nextBtn) {
      nextBtn.disabled = true;
      nextBtn.classList.add('opacity-50', 'cursor-not-allowed');
    }
  }

  handlePaymentUpload(e) {
    console.log('💳 Procesando comprobante de pago...');

    const file = e.target.files[0];
    if (!file) return;

    // Validar imagen
    if (!this.utils.validateImage(file)) {
      e.target.value = '';
      return;
    }

    this.formData.paymentProof = file;
    this.showPaymentPreview(file);
    this.updateSubmitButton();

    console.log(`✅ Comprobante cargado: ${file.name}`);
  }

  showPaymentPreview(file) {
    const preview = document.getElementById('payment-preview');
    if (!preview) return;

    // Truncar nombre del archivo si es muy largo
    const truncatedName = file.name.length > 25 ?
      file.name.substring(0, 25) + '...' :
      file.name;

    preview.innerHTML = `
    <div class="bg-slate-800/50 border border-slate-600 rounded-lg p-3 md:p-4 flex items-center justify-between">
      <div class="flex items-center flex-1 min-w-0">
        <span class="text-xl md:text-2xl mr-3 flex-shrink-0">📷</span>
        <div class="flex-1 min-w-0">
          <div class="text-white text-sm font-medium truncate" title="${file.name}">${truncatedName}</div>
          <div class="text-gray-400 text-xs">${this.utils.formatFileSize(file.size)}</div>
        </div>
      </div>
      <button 
        type="button" 
        onclick="window.turnitinForm.removePayment()" 
        class="ml-3 text-red-400 hover:text-red-300 transition-colors p-2 hover:bg-red-500/10 rounded-lg flex-shrink-0"
        title="Eliminar comprobante"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
        </svg>
      </button>
    </div>
  `;
    preview.classList.remove('hidden');
  }

  removePayment() {
    console.log('🗑️ Removiendo comprobante de pago');

    this.formData.paymentProof = null;

    const paymentInput = document.getElementById('payment');
    const paymentPreview = document.getElementById('payment-preview');

    if (paymentInput) paymentInput.value = '';
    if (paymentPreview) {
      paymentPreview.classList.add('hidden');
      paymentPreview.innerHTML = '';
    }

    this.updateSubmitButton();
  }

  updateSubmitButton() {
    const submitBtn = document.querySelector('.submit-btn');
    if (!submitBtn) return;

    const canSubmit = this.formData.deliveryMethod && this.formData.paymentProof;

    submitBtn.disabled = !canSubmit;
    if (canSubmit) {
      submitBtn.classList.remove('opacity-50', 'cursor-not-allowed');
      console.log('✅ Botón de envío habilitado');
    } else {
      submitBtn.classList.add('opacity-50', 'cursor-not-allowed');
      console.log('⚠️ Botón de envío deshabilitado');
    }
  }

  updateSummary() {
    const summary = document.getElementById('summary');
    const content = document.getElementById('summary-content');

    if (!summary || !content) return;

    const reportText = this.formData.reportType === 'pack' ? 'Pack 3 Reportes (S/15)' : 'Reporte Único (S/7)';
    const deliveryText = this.formData.deliveryMethod === 'whatsapp' ? 'WhatsApp' : 'Email';

    content.innerHTML = `
      <div>• Servicio: ${reportText}</div>
      <div>• Archivos: ${this.formData.uploadedFiles.length} documento(s)</div>
      <div>• Entrega: ${deliveryText}</div>
    `;

    summary.classList.remove('hidden');
  }

  validateStep1() {
    const fullName = document.getElementById('fullName')?.value.trim() || '';
    const phone = document.getElementById('phone')?.value.trim() || '';
    const email = document.getElementById('email')?.value.trim() || '';

    const isValid = fullName.length > 0 && phone.length > 0 && email.length > 0;

    // Buscar el botón del paso 1 específicamente
    const step1 = document.querySelector('.form-step[data-step="1"]');
    const nextBtn = step1?.querySelector('.next-btn');

    if (nextBtn) {
      nextBtn.disabled = !isValid;
      if (isValid) {
        nextBtn.classList.remove('opacity-50', 'cursor-not-allowed');
      } else {
        nextBtn.classList.add('opacity-50', 'cursor-not-allowed');
      }
    }

  }

  nextStep() {
    console.log(`➡️ Intentando ir al paso ${this.currentStep + 1}`);

    if (this.validateCurrentStep()) {
      if (this.currentStep < this.totalSteps) {
        this.showStep(this.currentStep + 1);
      }
    }
  }

  prevStep() {
    console.log(`⬅️ Regresando al paso ${this.currentStep - 1}`);

    if (this.currentStep > 1) {
      this.showStep(this.currentStep - 1);
    }
  }

  validateCurrentStep() {
    console.log(`🔍 Validando paso ${this.currentStep}`);

    switch (this.currentStep) {
      case 1:
        const fullName = document.getElementById('fullName')?.value.trim() || '';
        const phone = document.getElementById('phone')?.value.trim() || '';
        const email = document.getElementById('email')?.value.trim() || '';

        if (!fullName || !phone || !email) {
          this.utils.showAlert('Por favor completa todos los campos', 'error');
          return false;
        }

        // Validar email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
          this.utils.showAlert('Por favor ingresa un email válido', 'error');
          return false;
        }

        console.log('✅ Paso 1 válido');
        return true;

      case 2:
        if (!this.formData.reportType) {
          this.utils.showAlert('Por favor selecciona un tipo de reporte', 'error');
          return false;
        }
        console.log('✅ Paso 2 válido');
        return true;

      case 3:
        if (this.formData.uploadedFiles.length !== this.formData.maxFiles) {
          this.utils.showAlert(`Por favor sube ${this.formData.maxFiles} archivo(s)`, 'error');
          return false;
        }
        console.log('✅ Paso 3 válido');
        return true;

      case 4:
        if (!this.formData.deliveryMethod) {
          this.utils.showAlert('Por favor selecciona un método de entrega', 'error');
          return false;
        }
        if (!this.formData.paymentProof) {
          this.utils.showAlert('Por favor sube el comprobante de pago', 'error');
          return false;
        }
        console.log('✅ Paso 4 válido');
        return true;

      default:
        return true;
    }
  }

  async handleSubmit(e) {
    e.preventDefault();

    console.log('📤 Iniciando envío del formulario...');

    if (!this.validateCurrentStep()) {
      return;
    }

    const submitBtn = document.querySelector('.submit-btn');
    if (!submitBtn) {
      console.error('❌ Botón de envío no encontrado');
      return;
    }

    const originalText = submitBtn.innerHTML;

    // Estado de carga
    this.utils.setButtonLoading(submitBtn, true);

    try {
      // Recopilar datos del formulario
      const formData = this.collectFormData();
      console.log('📋 Datos recopilados:', formData);

      // Enviar usando Telegram API o simulación
      if (this.telegram) {
        console.log('📨 Enviando vía Telegram API...');
        await this.telegram.sendFormData(formData);
      } else {
        console.log('📨 Enviando en modo simulación...');
        // Simulación básica
        await new Promise(resolve => setTimeout(resolve, 2000));
        console.log('✅ Simulación completada');
      }

      // Mostrar éxito
      this.utils.showAlert('¡Solicitud enviada correctamente! Te contactaremos pronto.', 'success');

      // Reiniciar formulario después de un delay
      setTimeout(() => {
        this.resetForm();
      }, 2000);

    } catch (error) {
      console.error('❌ Error al enviar formulario:', error);
      this.utils.showAlert('Error al enviar la solicitud. Por favor, inténtalo de nuevo.', 'error');
    } finally {
      // Restaurar botón
      this.utils.setButtonLoading(submitBtn, false, originalText);
    }
  }

  collectFormData() {
    const fullNameValue = document.getElementById('fullName')?.value.trim() || '';
    const nameParts = fullNameValue.split(' ');

    // Recopilar datos usando la estructura que espera tu TelegramAPI
    return {
      nombre: nameParts[0] || '',
      apellidos: nameParts.slice(1).join(' ') || '',
      telefono: document.getElementById('phone')?.value.trim() || '',
      correo: document.getElementById('email')?.value.trim() || '',
      tipoReporte: this.formData.reportType,
      metodoEntrega: this.formData.deliveryMethod,
      mensaje: document.getElementById('message')?.value.trim() || '',
      documento: this.formData.uploadedFiles[0] || null, // Para compatibilidad
      documentos: this.formData.uploadedFiles, // Array completo para pack de 3
      imagenPago: this.formData.paymentProof
    };
  }

  resetForm() {
    console.log('🔄 Reiniciando formulario...');

    // Reiniciar estado
    this.currentStep = 1;
    this.formData = {
      reportType: '',
      maxFiles: 1,
      uploadedFiles: [],
      deliveryMethod: '',
      paymentProof: null
    };

    // Limpiar formulario
    const form = document.getElementById('turnitinForm');
    if (form) form.reset();

    // Limpiar selecciones
    document.querySelectorAll('.report-option, .delivery-option').forEach(opt => {
      opt.classList.remove('selected');
    });

    // Ocultar previews
    this.hideFilePreview();
    this.removePayment();

    const summary = document.getElementById('summary');
    const paymentContainer = document.getElementById('payment-upload-container');

    if (summary) summary.classList.add('hidden');
    if (paymentContainer) paymentContainer.classList.add('hidden');

    // Volver al paso 1
    this.showStep(1);

    console.log('✅ Formulario reiniciado');
  }

  // Métodos públicos para funciones globales (compatibilidad)
  removeDocument() {
    this.removeFile(0);
  }

  removeImage() {
    this.removePayment();
  }
}

// Función de inicialización global
function initializeTurnitinForm() {
  console.log('🎯 Inicializando formulario Turnitin globalmente...');

  if (typeof window !== 'undefined') {
    window.turnitinForm = new TurnitinForm();

    // Funciones globales para compatibilidad con botones
    window.removeDocument = () => window.turnitinForm?.removeDocument();
    window.removeImage = () => window.turnitinForm?.removeImage();

    console.log('✅ Formulario disponible globalmente');
  } else {
    console.warn('⚠️ Window no disponible, ejecutándose en servidor');
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