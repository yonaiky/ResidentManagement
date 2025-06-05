import { Client, LocalAuth } from 'whatsapp-web.js';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegInstaller from '@ffmpeg-installer/ffmpeg';

// Configurar ffmpeg
ffmpeg.setFfmpegPath(ffmpegInstaller.path);

class WhatsAppService {
  private client: Client;
  private isReady: boolean = false;
  private qrCode: string | null = null;
  private isInitializing: boolean = false;

  constructor() {
    this.client = new Client({
      authStrategy: new LocalAuth(),
      puppeteer: {
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      }
    });

    // Configurar eventos
    this.setupEvents();
  }

  private setupEvents() {
    this.client.on('qr', (qr) => {
      console.log('QR RECIBIDO, escanea con WhatsApp:');
      this.qrCode = qr;
    });

    this.client.on('ready', () => {
      console.log('Cliente WhatsApp está listo!');
      this.isReady = true;
      this.qrCode = null;
      this.isInitializing = false;
    });

    this.client.on('auth_failure', (msg) => {
      console.error('Error de autenticación:', msg);
      this.qrCode = null;
      this.isReady = false;
      this.isInitializing = false;
    });

    this.client.on('disconnected', () => {
      console.log('Cliente WhatsApp desconectado');
      this.isReady = false;
      this.qrCode = null;
      this.isInitializing = false;
    });
  }

  public async initialize() {
    if (this.isInitializing) {
      console.log('WhatsApp ya está inicializándose...');
      return;
    }

    if (this.isReady) {
      console.log('WhatsApp ya está conectado');
      return;
    }

    try {
      this.isInitializing = true;
      await this.client.initialize();
    } catch (error) {
      console.error('Error al inicializar WhatsApp:', error);
      this.isInitializing = false;
      throw error;
    }
  }

  public getStatus() {
    return {
      isReady: this.isReady,
      qrCode: this.qrCode,
      isInitializing: this.isInitializing
    };
  }

  public async sendMessage(phoneNumber: string, message: string) {
    if (!this.isReady) {
      throw new Error('El cliente de WhatsApp no está listo');
    }

    try {
      // Formatear el número de teléfono (eliminar espacios, guiones, etc.)
      const formattedNumber = phoneNumber.replace(/\D/g, '');
      
      // Asegurarse de que el número tenga el código de país
      const numberWithCountryCode = formattedNumber.startsWith('1') ? formattedNumber : `1${formattedNumber}`;
      
      // Enviar el mensaje
      const response = await this.client.sendMessage(`${numberWithCountryCode}@c.us`, message);
      console.log('Mensaje enviado:', response);
      return response;
    } catch (error) {
      console.error('Error al enviar mensaje:', error);
      throw error;
    }
  }

  public async sendPaymentReminder(resident: any) {
    const message = `Hola ${resident.name} ${resident.lastName},\n\n` +
      `Este es un recordatorio de que su pago de mantenimiento vence el día 30 de este mes.\n` +
      `Monto a pagar: $${resident.payments[0]?.amount || 'No especificado'}\n\n` +
      `Por favor, realice su pago a tiempo para evitar cargos adicionales.\n\n` +
      `Saludos cordiales,\n` +
      `Administración`;

    return this.sendMessage(resident.phone, message);
  }

  public async sendPaymentOverdue(resident: any) {
    const message = `Hola ${resident.name} ${resident.lastName},\n\n` +
      `Le informamos que su pago de mantenimiento está vencido.\n` +
      `Monto pendiente: $${resident.payments[0]?.amount || 'No especificado'}\n\n` +
      `Por favor, regularice su situación lo antes posible para evitar sanciones.\n\n` +
      `Saludos cordiales,\n` +
      `Administración`;

    return this.sendMessage(resident.phone, message);
  }
}

// Exportar una instancia única del servicio
export const whatsappService = new WhatsAppService(); 