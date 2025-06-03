// src/scripts/telegram-api.js - VERSIÓN CORREGIDA
export class TelegramAPI {
  constructor() {
    // Obtener credenciales de variables de entorno o configuración
    this.config = {
      botToken: import.meta.env.PUBLIC_TELEGRAM_BOT_TOKEN || this.getFromWindow('TELEGRAM_BOT_TOKEN'),
      chatId: import.meta.env.PUBLIC_TELEGRAM_CHAT_ID || this.getFromWindow('TELEGRAM_CHAT_ID')
    };
    
    // Configuración de respaldo para desarrollo
    if (!this.config.botToken || !this.config.chatId) {
      console.warn('⚠️ Credenciales de Telegram no configuradas. Usando modo simulación.');
      this.simulationMode = true;
    } else {
      this.simulationMode = false;
    }
  }

  // Método auxiliar para obtener variables del objeto window
  getFromWindow(varName) {
    return typeof window !== 'undefined' && window[varName] ? window[varName] : '';
  }

  /**
   * Envía todos los datos del formulario a Telegram
   * @param {Object} formData - Datos del formulario
   */
  async sendFormData(formData) {
    // Modo simulación para desarrollo
    if (this.simulationMode) {
      console.log('📨 MODO SIMULACIÓN - Datos del formulario:', formData);
      
      // Simular delay de red
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Simular éxito
      console.log('✅ Formulario enviado exitosamente (simulación)');
      return { ok: true, message: 'Simulación exitosa' };
    }

    try {
      // Validar configuración antes de enviar
      if (!this.validateConfig()) {
        throw new Error('Configuración de Telegram inválida');
      }

      // Enviar mensaje principal
      await this.sendMessage(this.formatMessage(formData));
      
      // Enviar documentos (soporte para múltiples archivos)
      if (formData.documentos && formData.documentos.length > 0) {
        for (let i = 0; i < formData.documentos.length; i++) {
          const documento = formData.documentos[i];
          await this.sendDocument(
            documento, 
            `Documento ${i + 1}/${formData.documentos.length} - ${formData.nombre} ${formData.apellidos}`
          );
        }
      } else if (formData.documento) {
        // Compatibilidad con versión anterior
        await this.sendDocument(
          formData.documento, 
          `Documento de ${formData.nombre} ${formData.apellidos}`
        );
      }
      
      // Enviar imagen de pago si existe
      if (formData.imagenPago) {
        await this.sendPhoto(
          formData.imagenPago, 
          `Comprobante de pago - ${formData.nombre} ${formData.apellidos}`
        );
      }
      
      return { ok: true, message: 'Enviado correctamente' };
      
    } catch (error) {
      console.error('❌ Error en TelegramAPI:', error);
      throw new Error(`Error al enviar los datos: ${error.message}`);
    }
  }

  /**
   * Formatea los datos del formulario en un mensaje legible
   * @param {Object} formData - Datos del formulario
   * @returns {string} - Mensaje formateado
   */
  formatMessage(formData) {
    const tipoReporteText = formData.tipoReporte === 'unico' 
      ? 'Reporte Único (S/7)' 
      : 'Pack de 3 Reportes (S/15)';
    
    const metodoEntregaText = formData.metodoEntrega === 'whatsapp' 
      ? 'WhatsApp' 
      : 'Correo Electrónico';

    // Contar documentos
    const numDocumentos = formData.documentos ? formData.documentos.length : (formData.documento ? 1 : 0);
    
    return `
🆕 *NUEVA SOLICITUD DE REVISIÓN TURNITIN*

👤 *Datos del Cliente:*
• Nombre: ${formData.nombre} ${formData.apellidos}
• Teléfono: ${formData.telefono}
• Email: ${formData.correo}

📊 *Servicio Solicitado:*
• Tipo: ${tipoReporteText}
• Entrega por: ${metodoEntregaText}

📄 *Archivos:*
• Documentos: ${numDocumentos} archivo(s)
• Comprobante: ${formData.imagenPago ? '✅ Adjuntado' : '❌ No adjuntado'}

💬 *Mensaje Adicional:*
${formData.mensaje || 'Sin mensaje adicional'}

⏰ *Fecha:* ${new Date().toLocaleString('es-PE')}
    `.trim();
  }

  /**
   * Envía un mensaje de texto a Telegram
   * @param {string} message - Mensaje a enviar
   */
  async sendMessage(message) {
    const url = `https://api.telegram.org/bot${this.config.botToken}/sendMessage`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: this.config.chatId,
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

  /**
   * Envía un documento a Telegram
   * @param {File} file - Archivo a enviar
   * @param {string} caption - Descripción del archivo
   */
  async sendDocument(file, caption) {
    const url = `https://api.telegram.org/bot${this.config.botToken}/sendDocument`;
    
    const formDataToSend = new FormData();
    formDataToSend.append('chat_id', this.config.chatId);
    formDataToSend.append('document', file);
    formDataToSend.append('caption', caption);
    
    const response = await fetch(url, {
      method: 'POST',
      body: formDataToSend
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`Error al enviar documento: ${response.status} - ${errorData.description || 'Error desconocido'}`);
    }
    
    return response.json();
  }

  /**
   * Envía una imagen a Telegram
   * @param {File} file - Imagen a enviar
   * @param {string} caption - Descripción de la imagen
   */
  async sendPhoto(file, caption) {
    const url = `https://api.telegram.org/bot${this.config.botToken}/sendPhoto`;
    
    const formDataToSend = new FormData();
    formDataToSend.append('chat_id', this.config.chatId);
    formDataToSend.append('photo', file);
    formDataToSend.append('caption', caption);
    
    const response = await fetch(url, {
      method: 'POST',
      body: formDataToSend
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`Error al enviar imagen: ${response.status} - ${errorData.description || 'Error desconocido'}`);
    }
    
    return response.json();
  }

  /**
   * Valida la configuración del bot
   * @returns {boolean} - True si la configuración es válida
   */
  validateConfig() {
    if (!this.config.botToken || this.config.botToken.length < 10) {
      console.error('❌ Bot token no configurado o inválido');
      return false;
    }
    
    if (!this.config.chatId || this.config.chatId.length < 5) {
      console.error('❌ Chat ID no configurado o inválido');
      return false;
    }
    
    console.log('✅ Configuración de Telegram válida');
    return true;
  }

  /**
   * Configura las credenciales del bot
   * @param {string} botToken - Token del bot
   * @param {string} chatId - ID del chat
   */
  setConfig(botToken, chatId) {
    this.config.botToken = botToken;
    this.config.chatId = chatId;
    this.simulationMode = false;
    console.log('🔧 Configuración de Telegram actualizada');
  }
}