// src/scripts/turnitin-form.js - CORREGIDO
import { TelegramAPI } from './telegram-api.js';
import { FormUtils } from './form-utils.js';

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
    
    this.telegram = new TelegramAPI();
    this.utils = new FormUtils();
    
    this.init();
  }

  init() {
    this.bindEvents();
    this.showStep(1);
  }

  bindEvents() {
    // Navegación entre pasos
    document.querySelectorAll('.next-btn').forEach(btn => {
      btn.addEventListener('click', () => this.nextStep());
    });
    
    document.querySelectorAll('.prev-btn').forEach(btn => {
      btn.addEventListener('click', () => this.prevStep());
    });

    // Selección de tipo de reporte
    document.querySelectorAll('.report-option').forEach(btn => {
      btn.addEventListener('click', (e) => this.selectReportType(e));
    });

    // Selección de método de entrega
    document.querySelectorAll('.delivery-option').forEach(btn => {
      btn.addEventListener('click', (e) => this.selectDeliveryMethod(e));
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
      form.addEventListener('submit', (e) => this.handleSubmit(e));
    }

    // Validación en tiempo real de campos de texto
    ['fullName', 'phone', 'email'].forEach(fieldId => {
      const field = document.getElementById(fieldId);
      if (field) {
        field.addEventListener('input', () => this.validateStep1());
      }
    });
  }

  showStep(step) {
    // Ocultar todos los pasos
    document.querySelectorAll('.form-step').forEach(s => {
      s.classList.add('hidden');
      s.classList.remove('block');
    });
    
    // Mostrar paso actual
    const currentStepElement = document.querySelector(`[data-step="${step}"]`);
    if (currentStepElement) {
      currentStepElement.classList.remove('hidden');
      currentStepElement.classList.add('block');
    }
    
    // Actualizar indicadores
    this.updateStepIndicators(step);
    
    // Configurar paso específico
    this.configureStep(step);
    
    this.currentStep = step;
  }

  updateStepIndicators(currentStep) {
    document.querySelectorAll('.step-indicator').forEach((indicator, index) => {
      const stepNum = index + 1;
      
      // Limpiar clases anteriores
      indicator.className = 'step-indicator w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all';
      
      if (stepNum === currentStep) {
        indicator.classList.add('bg-blue-500', 'text-white');
      } else if (stepNum < currentStep) {
        indicator.classList.add('bg-green-500', 'text-white');
      } else {
        indicator.classList.add('bg-slate-700', 'text-gray-400');
      }
    });
  }

  configureStep(step) {
    switch(step) {
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
    
    if (!input || !fileCountText || !filesNeeded) return;
    
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

  selectReportType(e) {
    // Limpiar selección anterior
    document.querySelectorAll('.report-option').forEach(opt => {
      opt.classList.remove('selected');
    });
    
    // Seleccionar nuevo
    e.currentTarget.classList.add('selected');
    
    this.formData.reportType = e.currentTarget.dataset.value;
    this.formData.maxFiles = parseInt(e.currentTarget.dataset.files);
    
    // Habilitar botón siguiente
    const nextBtn = document.querySelector('[data-step="2"] .next-btn');
    if (nextBtn) {
      nextBtn.disabled = false;
      nextBtn.classList.remove('opacity-50', 'cursor-not-allowed');
    }
  }

  selectDeliveryMethod(e) {
    // Limpiar selección anterior
    document.querySelectorAll('.delivery-option').forEach(opt => {
      opt.classList.remove('selected');
    });
    
    // Seleccionar nuevo
    e.currentTarget.classList.add('selected');
    
    this.formData.deliveryMethod = e.currentTarget.dataset.value;
    
    this.updateSubmitButton();
  }

  handleFileUpload(e) {
    const files = Array.from(e.target.files);
    
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
      } else {
        e.target.value = '';
        return;
      }
    }
    
    this.formData.uploadedFiles = validFiles;
    this.renderFilePreview();
    
    // Habilitar botón siguiente si se subieron todos los archivos necesarios
    const nextBtn = document.querySelector('[data-step="3"] .next-btn');
    if (nextBtn) {
      if (validFiles.length === this.formData.maxFiles) {
        nextBtn.disabled = false;
        nextBtn.classList.remove('opacity-50', 'cursor-not-allowed');
      } else {
        nextBtn.disabled = true;
        nextBtn.classList.add('opacity-50', 'cursor-not-allowed');
      }
    }
  }

  renderFilePreview() {
    const preview = document.getElementById('files-preview');
    if (!preview) return;
    
    preview.innerHTML = '';
    preview.classList.remove('hidden');
    
    this.formData.uploadedFiles.forEach((file, index) => {
      const fileElement = document.createElement('div');
      fileElement.className = 'file-item';
      fileElement.innerHTML = `
        <div class="flex items-center">
          <span class="text-2xl mr-3">📄</span>
          <div>
            <div class="text-white text-sm font-medium">${file.name}</div>
            <div class="text-gray-400 text-xs">${this.utils.formatFileSize(file.size)}</div>
          </div>
        </div>
        <button type="button" onclick="turnitinForm.removeFile(${index})" class="text-red-400 hover:text-red-300 transition-colors">
          <span class="text-xl">×</span>
        </button>
      `;
      preview.appendChild(fileElement);
    });
  }

  hideFilePreview() {
    const preview = document.getElementById('files-preview');
    if (preview) {
      preview.classList.add('hidden');
      preview.innerHTML = '';
    }
  }

  removeFile(index) {
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
    const nextBtn = document.querySelector('[data-step="3"] .next-btn');
    if (nextBtn) {
      nextBtn.disabled = true;
      nextBtn.classList.add('opacity-50', 'cursor-not-allowed');
    }
  }

  handlePaymentUpload(e) {
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
  }

  showPaymentPreview(file) {
    const preview = document.getElementById('payment-preview');
    if (!preview) return;
    
    preview.innerHTML = `
      <div class="file-item">
        <div class="flex items-center">
          <span class="text-2xl mr-3">📷</span>
          <div>
            <div class="text-white text-sm font-medium">${file.name}</div>
            <div class="text-gray-400 text-xs">${this.utils.formatFileSize(file.size)}</div>
          </div>
        </div>
        <button type="button" onclick="turnitinForm.removePayment()" class="text-red-400 hover:text-red-300 transition-colors">
          <span class="text-xl">×</span>
        </button>
      </div>
    `;
    preview.classList.remove('hidden');
  }

  removePayment() {
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
    } else {
      submitBtn.classList.add('opacity-50', 'cursor-not-allowed');
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
    
    const isValid = fullName && phone && email;
    const nextBtn = document.querySelector('[data-step="1"] .next-btn');
    
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
    if (this.validateCurrentStep()) {
      if (this.currentStep < this.totalSteps) {
        this.showStep(this.currentStep + 1);
      }
    }
  }

  prevStep() {
    if (this.currentStep > 1) {
      this.showStep(this.currentStep - 1);
    }
  }

  validateCurrentStep() {
    switch(this.currentStep) {
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
        
        return true;
      
      case 2:
        if (!this.formData.reportType) {
          this.utils.showAlert('Por favor selecciona un tipo de reporte', 'error');
          return false;
        }
        return true;
      
      case 3:
        if (this.formData.uploadedFiles.length !== this.formData.maxFiles) {
          this.utils.showAlert(`Por favor sube ${this.formData.maxFiles} archivo(s)`, 'error');
          return false;
        }
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
        return true;
      
      default:
        return true;
    }
  }

  async handleSubmit(e) {
    e.preventDefault();
    
    if (!this.validateCurrentStep()) {
      return;
    }

    const submitBtn = document.querySelector('.submit-btn');
    if (!submitBtn) return;
    
    const originalText = submitBtn.innerHTML;
    
    // Estado de carga
    this.utils.setButtonLoading(submitBtn, true);

    try {
      // Recopilar datos del formulario
      const formData = this.collectFormData();
      
      // Enviar a Telegram usando tu API existente
      await this.telegram.sendFormData(formData);
      
      // Mostrar éxito
      this.utils.showAlert('¡Solicitud enviada correctamente! Te contactaremos pronto.', 'success');
      
      // Reiniciar formulario
      this.resetForm();
      
    } catch (error) {
      console.error('Error al enviar formulario:', error);
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
  }

  // Métodos públicos para funciones globales (compatibilidad con tu código existente)
  removeDocument() {
    this.removeFile(0);
  }

  removeImage() {
    this.removePayment();
  }
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
  window.turnitinForm = new TurnitinForm(); // ✅ CORREGIDO: Nombre correcto
});

// Exportar funciones globales para botones (compatibilidad)
window.removeDocument = () => window.turnitinForm?.removeDocument();
window.removeImage = () => window.turnitinForm?.removeImage();