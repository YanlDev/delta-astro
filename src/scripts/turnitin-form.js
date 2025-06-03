import { TelegramAPI } from './telegram-api.js';
import { FormUtils } from './form-utils.js';

export class TurnitinForm {
  constructor() {
    this.selectedDocument = null;
    this.selectedImage = null;
    this.telegram = new TelegramAPI();
    this.utils = new FormUtils();
    
    this.init();
  }

  init() {
    this.bindEvents();
    this.setupDragAndDrop();
  }

  bindEvents() {
    const form = document.getElementById('turnitinForm');
    const documentInput = document.getElementById('documento');
    const imageInput = document.getElementById('captura_pago');
    const resetButton = document.getElementById('reset-form');

    // Event listeners principales
    form?.addEventListener('submit', (e) => this.handleFormSubmission(e));
    documentInput?.addEventListener('change', (e) => this.handleDocumentUpload(e));
    imageInput?.addEventListener('change', (e) => this.handleImageUpload(e));
    resetButton?.addEventListener('click', () => this.resetForm());

    // Configurar radio buttons
    this.setupRadioButtons();
  }

  setupRadioButtons() {
    // Radio buttons para tipo de reporte
    const radioInputs = document.querySelectorAll('input[name="tipo_reporte"]');
    radioInputs.forEach(radio => {
      radio.addEventListener('change', () => this.handleReportTypeChange(radio));
    });

    // Radio buttons para método de entrega
    const deliveryInputs = document.querySelectorAll('input[name="metodo_entrega"]');
    deliveryInputs.forEach(radio => {
      radio.addEventListener('change', () => this.handleDeliveryMethodChange(radio));
    });
  }

  handleReportTypeChange(radio) {
    // Limpiar estados anteriores
    document.querySelectorAll('.radio-label').forEach(label => {
      label.classList.remove('border-blue-500', 'border-purple-500', 'bg-slate-800/70');
      label.querySelector('.radio-dot').style.opacity = '0';
    });
    
    // Aplicar estado activo
    const label = radio.nextElementSibling;
    const colorClass = radio.value === 'unico' ? 'border-blue-500' : 'border-purple-500';
    label.classList.add(colorClass, 'bg-slate-800/70');
    label.querySelector('.radio-dot').style.opacity = '1';
  }

  handleDeliveryMethodChange(radio) {
    // Limpiar estados anteriores
    document.querySelectorAll('.delivery-label').forEach(label => {
      label.classList.remove('border-green-500', 'border-blue-500', 'bg-slate-800/70');
      label.querySelector('.delivery-dot').style.opacity = '0';
    });
    
    // Aplicar estado activo
    const label = radio.nextElementSibling;
    const colorClass = radio.value === 'whatsapp' ? 'border-green-500' : 'border-blue-500';
    label.classList.add(colorClass, 'bg-slate-800/70');
    label.querySelector('.delivery-dot').style.opacity = '1';
  }

  handleDocumentUpload(e) {
    const file = e.target.files[0];
    if (!file) {
      this.selectedDocument = null;
      this.utils.hideDocumentPreview();
      return;
    }

    // Validaciones
    if (!this.utils.validateDocument(file)) {
      e.target.value = '';
      return;
    }

    this.selectedDocument = file;
    this.utils.showDocumentPreview(file);
  }

  handleImageUpload(e) {
    const file = e.target.files[0];
    if (!file) {
      this.selectedImage = null;
      this.utils.hideImagePreview();
      return;
    }

    // Validaciones
    if (!this.utils.validateImage(file)) {
      e.target.value = '';
      return;
    }

    this.selectedImage = file;
    this.utils.showImagePreview(file);
  }

  async handleFormSubmission(e) {
    e.preventDefault();
    
    const submitBtn = document.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    
    // Mostrar loading
    this.utils.setButtonLoading(submitBtn, true);

    try {
      // Recopilar y validar datos
      const formData = this.collectFormData();
      if (!this.validateFormData(formData)) {
        return;
      }
      
      // Enviar a Telegram
      await this.telegram.sendFormData(formData);
      
      // Mostrar éxito
      this.utils.showAlert('¡Solicitud enviada correctamente! Te contactaremos pronto.', 'success');
      
      // Limpiar formulario
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
    return {
      nombre: document.getElementById('nombre').value.trim(),
      apellidos: document.getElementById('apellidos').value.trim(),
      telefono: document.getElementById('telefono').value.trim(),
      correo: document.getElementById('correo').value.trim(),
      tipoReporte: document.querySelector('input[name="tipo_reporte"]:checked')?.value,
      metodoEntrega: document.querySelector('input[name="metodo_entrega"]:checked')?.value,
      mensaje: document.getElementById('mensaje').value.trim(),
      documento: this.selectedDocument,
      imagenPago: this.selectedImage
    };
  }

  validateFormData(data) {
    const errors = [];
    
    if (!data.nombre) errors.push('El nombre es requerido');
    if (!data.apellidos) errors.push('Los apellidos son requeridos');
    if (!data.telefono) errors.push('El teléfono es requerido');
    if (!data.correo) errors.push('El correo es requerido');
    if (!data.tipoReporte) errors.push('Debe seleccionar un tipo de reporte');
    if (!data.metodoEntrega) errors.push('Debe seleccionar un método de entrega');
    if (!data.documento) errors.push('Debe cargar un documento');
    if (!data.imagenPago) errors.push('Debe cargar el comprobante de pago');
    
    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (data.correo && !emailRegex.test(data.correo)) {
      errors.push('El formato del correo electrónico no es válido');
    }
    
    if (errors.length > 0) {
      this.utils.showAlert('Por favor complete los siguientes campos:\n• ' + errors.join('\n• '), 'error');
      return false;
    }
    
    return true;
  }

  resetForm() {
    document.getElementById('turnitinForm').reset();
    this.selectedDocument = null;
    this.selectedImage = null;
    
    // Limpiar previews
    this.utils.hideDocumentPreview();
    this.utils.hideImagePreview();
    
    // Limpiar estados de radio buttons
    document.querySelectorAll('.radio-label, .delivery-label').forEach(label => {
      label.classList.remove('border-blue-500', 'border-purple-500', 'border-green-500', 'bg-slate-800/70');
    });
    
    document.querySelectorAll('.radio-dot, .delivery-dot').forEach(dot => {
      dot.style.opacity = '0';
    });
  }

  setupDragAndDrop() {
    const documentLabel = document.querySelector('label[for="documento"]');
    const imageLabel = document.querySelector('label[for="captura_pago"]');
    
    [documentLabel, imageLabel].forEach((label, index) => {
      if (!label) return;
      
      const input = index === 0 ? document.getElementById('documento') : document.getElementById('captura_pago');
      
      label.addEventListener('dragover', (e) => {
        e.preventDefault();
        label.classList.add('border-blue-500', 'bg-slate-800/50');
      });
      
      label.addEventListener('dragleave', (e) => {
        e.preventDefault();
        label.classList.remove('border-blue-500', 'bg-slate-800/50');
      });
      
      label.addEventListener('drop', (e) => {
        e.preventDefault();
        label.classList.remove('border-blue-500', 'bg-slate-800/50');
        
        const files = e.dataTransfer.files;
        if (files.length > 0) {
          input.files = files;
          input.dispatchEvent(new Event('change', { bubbles: true }));
        }
      });
    });
  }

  // Métodos públicos para funciones globales
  removeDocument() {
    document.getElementById('documento').value = '';
    this.selectedDocument = null;
    this.utils.hideDocumentPreview();
  }

  removeImage() {
    document.getElementById('captura_pago').value = '';
    this.selectedImage = null;
    this.utils.hideImagePreview();
  }
}

// Instanciar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
  window.turnitinForm = new TurnitinForm();
});

// Exportar funciones globales para botones
window.removeDocument = () => window.turnitinForm?.removeDocument();
window.removeImage = () => window.turnitinForm?.removeImage();