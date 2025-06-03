// src/scripts/telegram-api.js - Actualizado para pack de 3
export class TelegramAPI {
  constructor() {
    // Configuración del bot - mover a variables de entorno en producción
    this.config = {
      botToken: '',
      chatId: ''
    };
  }

  /**
   * Envía todos los datos del formulario a Telegram
   * @param {Object} formData - Datos del formulario
   */
  async sendFormData(formData) {
    try {
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
      
    } catch (error) {
      console.error('Error en TelegramAPI:', error);
      throw new Error('Error al enviar los datos a Telegram');
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
    
    const formData = new FormData();
    formData.append('chat_id', this.config.chatId);
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

  /**
   * Envía una imagen a Telegram
   * @param {File} file - Imagen a enviar
   * @param {string} caption - Descripción de la imagen
   */
  async sendPhoto(file, caption) {
    const url = `https://api.telegram.org/bot${this.config.botToken}/sendPhoto`;
    
    const formData = new FormData();
    formData.append('chat_id', this.config.chatId);
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

  /**
   * Valida la configuración del bot
   * @returns {boolean} - True si la configuración es válida
   */
  validateConfig() {
    if (!this.config.botToken || this.config.botToken === 'TU_BOT_TOKEN_AQUI') {
      console.error('❌ Bot token no configurado');
      return false;
    }
    
    if (!this.config.chatId || this.config.chatId === 'TU_CHAT_ID_AQUI') {
      console.error('❌ Chat ID no configurado');
      return false;
    }
    
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
  }
}