export class FormUtils {
  constructor() {
    // Configuraciones de validación
    this.validations = {
      document: {
        maxSize: 10 * 1024 * 1024, // 10MB
        allowedTypes: [
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'application/pdf'
        ]
      },
      image: {
        maxSize: 5 * 1024 * 1024, // 5MB
        allowedTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
      }
    };
  }

  /**
   * Valida un archivo de documento
   * @param {File} file - Archivo a validar
   * @returns {boolean} - True si es válido
   */
  validateDocument(file) {
    if (!this.validations.document.allowedTypes.includes(file.type)) {
      this.showAlert('Solo se permiten archivos DOC, DOCX y PDF', 'error');
      return false;
    }
    
    if (file.size > this.validations.document.maxSize) {
      this.showAlert('El documento no debe superar los 10MB', 'error');
      return false;
    }
    
    return true;
  }

  /**
   * Valida un archivo de imagen
   * @param {File} file - Archivo a validar
   * @returns {boolean} - True si es válido
   */
  validateImage(file) {
    if (!file.type.startsWith('image/')) {
      this.showAlert('Solo se permiten archivos de imagen', 'error');
      return false;
    }
    
    if (file.size > this.validations.image.maxSize) {
      this.showAlert('La imagen no debe superar los 5MB', 'error');
      return false;
    }
    
    return true;
  }

  /**
   * Muestra el preview de un documento
   * @param {File} file - Archivo a mostrar
   */
  showDocumentPreview(file) {
    const preview = document.getElementById('document-preview');
    if (!preview) return;

    const icon = this.getFileIcon(file.type);
    
    preview.innerHTML = `
      <div class="bg-slate-800/50 border border-slate-600 rounded-lg p-4 flex items-center justify-between">
        <div class="flex items-center">
          <div class="text-3xl mr-3">${icon}</div>
          <div>
            <div class="text-white font-medium">${file.name}</div>
            <div class="text-sm text-gray-400">${this.formatFileSize(file.size)} • ${this.getFileTypeName(file.type)}</div>
          </div>
        </div>
        <button type="button" onclick="removeDocument()" class="text-red-400 hover:text-red-300 p-2">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
          </svg>
        </button>
      </div>
    `;
    
    preview.classList.remove('hidden');
  }

  /**
   * Muestra el preview de una imagen
   * @param {File} file - Archivo a mostrar
   */
  showImagePreview(file) {
    const preview = document.getElementById('image-preview');
    if (!preview) return;

    const reader = new FileReader();
    
    reader.onload = (e) => {
      preview.innerHTML = `
        <div class="bg-slate-800/50 border border-slate-600 rounded-lg p-4">
          <div class="flex items-start justify-between mb-3">
            <h4 class="text-white font-medium">Vista Previa del Comprobante</h4>
            <button type="button" onclick="removeImage()" class="text-red-400 hover:text-red-300 p-1">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>
          </div>
          <img src="${e.target.result}" alt="Comprobante de pago" class="w-full max-w-sm mx-auto rounded-lg shadow-lg">
          <div class="mt-3 text-sm text-gray-400">
            <p><strong>Archivo:</strong> ${file.name}</p>
            <p><strong>Tamaño:</strong> ${this.formatFileSize(file.size)}</p>
          </div>
        </div>
      `;
      
      preview.classList.remove('hidden');
    };
    
    reader.readAsDataURL(file);
  }

  /**
   * Oculta el preview del documento
   */
  hideDocumentPreview() {
    const preview = document.getElementById('document-preview');
    if (preview) {
      preview.innerHTML = '';
      preview.classList.add('hidden');
    }
  }

  /**
   * Oculta el preview de la imagen
   */
  hideImagePreview() {
    const preview = document.getElementById('image-preview');
    if (preview) {
      preview.innerHTML = '';
      preview.classList.add('hidden');
    }
  }

  /**
   * Configura el estado de loading de un botón
   * @param {HTMLElement} button - Botón a modificar
   * @param {boolean} isLoading - Estado de loading
   * @param {string} originalText - Texto original (opcional)
   */
  setButtonLoading(button, isLoading, originalText = null) {
    if (isLoading) {
      button.innerHTML = `
        <svg class="animate-spin w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        Enviando...
      `;
      button.disabled = true;
    } else {
      button.innerHTML = originalText || `
        <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path>
        </svg>
        Enviar Solicitud
      `;
      button.disabled = false;
    }
  }

  /**
   * Muestra una alerta personalizada
   * @param {string} message - Mensaje a mostrar
   * @param {string} type - Tipo de alerta (success, error, warning, info)
   */
  showAlert(message, type = 'info') {
    const alertDiv = document.createElement('div');
    alertDiv.className = `fixed top-4 right-4 z-50 max-w-sm w-full bg-slate-800 border-l-4 ${
      type === 'success' ? 'border-green-500' : 
      type === 'error' ? 'border-red-500' : 
      type === 'warning' ? 'border-yellow-500' : 'border-blue-500'
    } rounded-lg shadow-lg transform transition-all duration-300 translate-x-full`;
    
    alertDiv.innerHTML = `
      <div class="p-4">
        <div class="flex items-start">
          <div class="flex-shrink-0">
            ${this.getAlertIcon(type)}
          </div>
          <div class="ml-3 w-0 flex-1">
            <p class="text-sm font-medium text-white whitespace-pre-line">${message}</p>
          </div>
          <div class="ml-4 flex-shrink-0 flex">
            <button onclick="this.parentElement.parentElement.parentElement.parentElement.remove()" class="bg-slate-800 rounded-md inline-flex text-gray-400 hover:text-white focus:outline-none">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>
          </div>
        </div>
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

  /**
   * Obtiene el icono SVG para el tipo de alerta
   * @param {string} type - Tipo de alerta
   * @returns {string} - SVG del icono
   */
  getAlertIcon(type) {
    const icons = {
      success: '<svg class="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>',
      error: '<svg class="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>',
      warning: '<svg class="w-5 h-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>',
      info: '<svg class="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>'
    };
    
    return icons[type] || icons.info;
  }

  /**
   * Formatea el tamaño de archivo
   * @param {number} bytes - Bytes del archivo
   * @returns {string} - Tamaño formateado
   */
  formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Obtiene el icono para el tipo de archivo
   * @param {string} mimeType - Tipo MIME del archivo
   * @returns {string} - Emoji del icono
   */
  getFileIcon(mimeType) {
    const icons = {
      'application/pdf': '📕',
      'application/msword': '📘',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '📘'
    };
    
    return icons[mimeType] || '📄';
  }

  /**
   * Obtiene el nombre del tipo de archivo
   * @param {string} mimeType - Tipo MIME del archivo
   * @returns {string} - Nombre del tipo
   */
  getFileTypeName(mimeType) {
    const types = {
      'application/pdf': 'PDF',
      'application/msword': 'DOC',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'DOCX'
    };
    
    return types[mimeType] || 'Documento';
  }

  /**
   * Valida un número de teléfono peruano
   * @param {string} phone - Número de teléfono
   * @returns {boolean} - True si es válido
   */
  validatePeruvianPhone(phone) {
    // Regex para números peruanos: +51 seguido de 9 dígitos
    const phoneRegex = /^(\+51|51)?[9][0-9]{8}$/;
    return phoneRegex.test(phone.replace(/\s/g, ''));
  }

  /**
   * Formatea un número de teléfono peruano
   * @param {string} phone - Número de teléfono
   * @returns {string} - Número formateado
   */
  formatPeruvianPhone(phone) {
    const cleaned = phone.replace(/\D/g, '');
    
    if (cleaned.length === 9 && cleaned.startsWith('9')) {
      return `+51 ${cleaned.substring(0, 3)} ${cleaned.substring(3, 6)} ${cleaned.substring(6)}`;
    }
    
    if (cleaned.length === 11 && cleaned.startsWith('51')) {
      const number = cleaned.substring(2);
      return `+51 ${number.substring(0, 3)} ${number.substring(3, 6)} ${number.substring(6)}`;
    }
    
    return phone;
  }

  /**
   * Capitaliza la primera letra de cada palabra
   * @param {string} str - Cadena a capitalizar
   * @returns {string} - Cadena capitalizada
   */
  capitalizeWords(str) {
    return str.toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
  }

  /**
   * Sanitiza un string para evitar caracteres especiales
   * @param {string} str - Cadena a sanitizar
   * @returns {string} - Cadena sanitizada
   */
  sanitizeString(str) {
    return str.replace(/[<>'"&]/g, '');
  }

  /**
   * Genera un ID único
   * @returns {string} - ID único
   */
  generateUniqueId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  /**
   * Debounce para funciones
   * @param {Function} func - Función a ejecutar
   * @param {number} delay - Delay en ms
   * @returns {Function} - Función con debounce
   */
  debounce(func, delay) {
    let timeoutId;
    return function (...args) {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func.apply(this, args), delay);
    };
  }

  /**
   * Verifica si un elemento está visible en el viewport
   * @param {HTMLElement} element - Elemento a verificar
   * @returns {boolean} - True si está visible
   */
  isElementInViewport(element) {
    const rect = element.getBoundingClientRect();
    return (
      rect.top >= 0 &&
      rect.left >= 0 &&
      rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
      rect.right <= (window.innerWidth || document.documentElement.clientWidth)
    );
  }

  /**
   * Scroll suave a un elemento
   * @param {string|HTMLElement} target - Selector o elemento objetivo
   * @param {number} offset - Offset en pixels (opcional)
   */
  smoothScrollTo(target, offset = 0) {
    const element = typeof target === 'string' ? document.querySelector(target) : target;
    
    if (element) {
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  }
}