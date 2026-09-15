import 'server-only';
import { format } from "date-fns";
import { es } from "date-fns/locale";

export interface WhatsAppConfig {
  apiUrl: string;
  instanceName: string;
  token: string;
}

export interface WhatsAppMessage {
  number: string;
  text?: string;
  mediaMessage?: {
    mediatype: 'image' | 'video' | 'audio' | 'document';
    media: string; // base64 or URL
    fileName?: string;
    caption?: string;
  };
}

export interface WhatsAppContact {
  name: string;
  phone: string;
}

export class WhatsAppService {
  private config: WhatsAppConfig;

  constructor(config: WhatsAppConfig) {
    this.config = config;
  }

  private getHeaders() {
    return {
      'Content-Type': 'application/json',
      'apikey': this.config.token,
    };
  }

  private formatPhoneNumber(phone: string): string {
    // Remover caracteres especiales y espacios
    let cleanPhone = phone.replace(/[^\d]/g, '');
    
    // Si no tiene código de país, agregar 1 (República Dominicana)
    if (cleanPhone.length === 10) {
      cleanPhone = '1' + cleanPhone;
    }
    
    // Agregar @s.whatsapp.net si no lo tiene
    if (!cleanPhone.includes('@')) {
      cleanPhone = cleanPhone + '@s.whatsapp.net';
    }
    
    return cleanPhone;
  }

  async sendTextMessage(number: string, text: string): Promise<boolean> {
    try {
      const formattedNumber = this.formatPhoneNumber(number);
      
      const response = await fetch(`${this.config.apiUrl}/message/sendText/${this.config.instanceName}`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          number: formattedNumber,
          text: text,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('WhatsApp API Error:', errorData);
        return false;
      }

      const result = await response.json();
      console.log('WhatsApp message sent successfully:', result);
      return true;
    } catch (error) {
      console.error('Error sending WhatsApp message:', error);
      return false;
    }
  }

  async sendMediaMessage(number: string, media: string, caption?: string, mediaType: 'image' | 'document' = 'image'): Promise<boolean> {
    try {
      const formattedNumber = this.formatPhoneNumber(number);
      
      const response = await fetch(`${this.config.apiUrl}/message/sendMedia/${this.config.instanceName}`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          number: formattedNumber,
          mediaMessage: {
            mediatype: mediaType,
            media: media,
            caption: caption || '',
          },
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('WhatsApp Media API Error:', errorData);
        return false;
      }

      const result = await response.json();
      console.log('WhatsApp media sent successfully:', result);
      return true;
    } catch (error) {
      console.error('Error sending WhatsApp media:', error);
      return false;
    }
  }

  async getInstanceStatus(): Promise<{ status: string; qrcode?: string }> {
    try {
      const response = await fetch(`${this.config.apiUrl}/instance/connectionState/${this.config.instanceName}`, {
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        throw new Error('Failed to get instance status');
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting instance status:', error);
      return { status: 'error' };
    }
  }

  async createInstance(): Promise<{ qrcode?: string; status: string }> {
    try {
      const response = await fetch(`${this.config.apiUrl}/instance/create`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          instanceName: this.config.instanceName,
          qrcode: true,
          integration: 'WHATSAPP-BAILEYS',
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create instance');
      }

      return await response.json();
    } catch (error) {
      console.error('Error creating instance:', error);
      return { status: 'error' };
    }
  }

  // Plantillas de mensajes predefinidas
  static generatePaymentReminderMessage(residentName: string, amount: number, dueDate: Date): string {
    return `🏠 *Recordatorio de Pago - Residencial*

Estimado/a ${residentName},

Le recordamos que tiene un pago pendiente:

💰 *Monto:* $${amount.toFixed(2)} DOP
📅 *Fecha de vencimiento:* ${format(dueDate, 'dd/MM/yyyy', { locale: es })}

Para realizar su pago, puede:
• Transferencia bancaria
• Pago en efectivo en administración
• Pago móvil

*Horarios de atención:*
Lunes a Viernes: 8:00 AM - 5:00 PM
Sábados: 8:00 AM - 12:00 PM

¡Gracias por mantener al día sus pagos! 🙏

_Administración Residencial_`;
  }

  static generateOverduePaymentMessage(residentName: string, amount: number, daysOverdue: number): string {
    return `⚠️ *PAGO VENCIDO - Acción Requerida*

Estimado/a ${residentName},

Su pago se encuentra vencido:

💰 *Monto:* $${amount.toFixed(2)} DOP
⏰ *Días de retraso:* ${daysOverdue} días
📈 *Interés por mora:* Aplicable según reglamento

*IMPORTANTE:* Para evitar cargos adicionales, favor regularizar su situación a la brevedad.

*Formas de pago disponibles:*
• Transferencia bancaria
• Efectivo en administración
• Pago móvil

*Contacto:* (809) 555-0123

_Administración Residencial_`;
  }

  static generatePaymentConfirmationMessage(residentName: string, amount: number, period: string, receiptNumber: string): string {
    return `✅ *PAGO CONFIRMADO*

Estimado/a ${residentName},

Su pago ha sido procesado exitosamente:

💰 *Monto:* $${amount.toFixed(2)} DOP
📋 *Período:* ${period}
🧾 *Recibo No:* ${receiptNumber}
📅 *Fecha:* ${format(new Date(), 'dd/MM/yyyy HH:mm', { locale: es })}

¡Gracias por su puntualidad! Su comprobante fiscal ha sido generado.

_Administración Residencial_`;
  }

  static generateMaintenanceNotificationMessage(title: string, description: string, date: Date): string {
    return `🔧 *AVISO DE MANTENIMIENTO*

*${title}*

${description}

📅 *Fecha programada:* ${format(date, 'dd/MM/yyyy', { locale: es })}
⏰ *Hora:* ${format(date, 'HH:mm', { locale: es })}

*Recomendaciones:*
• Mantenga las áreas despejadas
• Reporte cualquier inconveniente
• Agradecemos su colaboración

*Contacto de emergencia:* (809) 555-0123

_Administración Residencial_`;
  }

  static generateWelcomeMessage(residentName: string, unitNumber: string): string {
    return `🏠 *¡BIENVENIDO A NUESTRO RESIDENCIAL!*

Estimado/a ${residentName},

Es un placer darle la bienvenida a su nueva unidad *${unitNumber}*.

📱 *Servicios disponibles:*
• Notificaciones de pago por WhatsApp
• Recordatorios automáticos
• Avisos de mantenimiento
• Comunicados importantes

📞 *Contactos importantes:*
• Administración: (809) 555-0123
• Emergencias: (809) 555-0124
• Mantenimiento: (809) 555-0125

*Horarios de atención:*
Lunes a Viernes: 8:00 AM - 5:00 PM
Sábados: 8:00 AM - 12:00 PM

¡Esperamos que disfrute su nueva residencia! 🌟

_Administración Residencial_`;
  }
}

// Configuración por defecto (se puede mover a variables de entorno)
export const DEFAULT_WHATSAPP_CONFIG: WhatsAppConfig = {
  apiUrl: process.env.EVOLUTION_API_URL || 'http://localhost:8080',
  instanceName: process.env.EVOLUTION_INSTANCE_NAME || 'residencial',
  token: process.env.EVOLUTION_API_TOKEN || '',
};