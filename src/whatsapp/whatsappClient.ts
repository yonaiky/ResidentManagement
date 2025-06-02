import { Client, LocalAuth, Events, Message } from 'whatsapp-web.js';
import qrcode from 'qrcode';
import { EventEmitter } from 'events';

// Usamos EventEmitter para comunicar eventos del cliente de WhatsApp a otras partes de la aplicación
export const whatsappEventEmitter = new EventEmitter();

let client: Client | null = null;
let qrCodeData: string | null = null;
let isClientReady = false;

export const getWhatsappClient = () => client;
export const getQrCodeData = () => qrCodeData;
export const getIsClientReady = () => isClientReady;

export const initializeWhatsappClient = async () => {
  if (client) {
    console.log('WhatsApp client already initialized.');
    return;
  }

  console.log('Initializing WhatsApp client...');

  client = new Client({
    authStrategy: new LocalAuth(), // Guarda la sesión localmente
    // puppeteer: { args: ['--no-sandbox'] } // Descomentar si tienes problemas en Linux/Docker
  });

  client.on(Events.QR_RECEIVED, (qr) => {
    console.log('QR RECEIVED', qr);
    qrCodeData = qr;
    whatsappEventEmitter.emit('qr', qr);
    qrcode.toDataURL(qr, (err, url) => {
      if (err) console.error('Error generating QR code URL:', err);
      else whatsappEventEmitter.emit('qr-url', url);
    });
  });

  client.on(Events.AUTHENTICATED, () => {
    console.log('AUTHENTICATED');
    qrCodeData = null; // Clear QR code after authentication
    whatsappEventEmitter.emit('authenticated');
  });

  client.on(Events.AUTH_FAILURE, (msg) => {
    // Fired if session restore was unsuccessful
    console.error('AUTHENTICATION FAILURE', msg);
    whatsappEventEmitter.emit('auth-failure', msg);
  });

  client.on(Events.READY, () => {
    console.log('WhatsApp client is ready!');
    isClientReady = true;
    whatsappEventEmitter.emit('ready');
  });

  client.on(Events.DISCONNECTED, (reason) => {
    console.log('Client was disconnected', reason);
    isClientReady = false;
    client = null; // Reset client on disconnect
    qrCodeData = null;
    whatsappEventEmitter.emit('disconnected', reason);
  });

  // Opcional: Manejar mensajes entrantes si el bot necesita responder o procesar algo
  // client.on(Events.MESSAGE_RECEIVED, (msg) => {
  //     console.log('MESSAGE RECEIVED', msg);
  //     if (msg.body === 'ping') {
  //         msg.reply('pong');
  //     }
  // });

  client.initialize();
};

// Función para enviar un mensaje (usando el cliente autenticado)
export const sendWhatsappMessage = async (to: string, message: string) => {
  if (!client || !isClientReady) {
    throw new Error('WhatsApp client not ready.');
  }

  // Formatear el número de teléfono si es necesario (ej: agregar código de país)
  // La librería whatsapp-web.js a menudo requiere el formato countrycode + number (ej: 18095551212@c.us)
  const formattedTo = `${to.replace(/[^0-9]/g, '')}@c.us`; // Eliminar caracteres no numéricos y agregar @c.us

  console.log(`Attempting to send message to ${formattedTo}: ${message}`);

  try {
    const chat = await client.getChatById(formattedTo);
    await chat.sendMessage(message);
    console.log('Message sent successfully.');
    return { success: true, message: 'Message sent.' };
  } catch (error) {
    console.error('Error sending message:', error);
    // Aquí podrías manejar errores específicos, como número inválido
    throw new Error(`Failed to send message: ${(error as any).message}`);
  }
};

// Función para obtener el estado actual
export const getWhatsappStatus = () => {
    if (!client) return 'disconnected';
    if (!isClientReady && qrCodeData) return 'scanning';
    if (isClientReady) return 'connected';
    return 'initializing';
}; 