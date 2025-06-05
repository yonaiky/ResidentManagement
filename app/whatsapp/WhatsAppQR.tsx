'use client';

import { useEffect, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';

export default function WhatsAppQR() {
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [status, setStatus] = useState<string>('Inicializando...');
  const [isReady, setIsReady] = useState<boolean>(false);
  const [isInitializing, setIsInitializing] = useState<boolean>(false);

  useEffect(() => {
    const initializeWhatsApp = async () => {
      try {
        const response = await fetch('/api/whatsapp/init', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.error) {
          setStatus(`Error: ${data.error}`);
          return;
        }

        setStatus(data.status);

        // Verificar el estado cada 2 segundos
        const interval = setInterval(async () => {
          try {
            const statusResponse = await fetch('/api/whatsapp/status', {
              method: 'GET',
              headers: {
                'Content-Type': 'application/json',
              },
            });
            
            if (!statusResponse.ok) {
              throw new Error(`HTTP error! status: ${statusResponse.status}`);
            }
            
            const statusData = await statusResponse.json();
            
            if (statusData.qrCode) {
              setQrCode(statusData.qrCode);
            }
            
            setIsInitializing(statusData.isInitializing);
            
            if (statusData.isReady) {
              setIsReady(true);
              setStatus('WhatsApp está conectado!');
              clearInterval(interval);
            }
          } catch (error) {
            console.error('Error al verificar estado:', error);
          }
        }, 2000);

        return () => clearInterval(interval);
      } catch (error) {
        setStatus('Error al inicializar WhatsApp');
        console.error('Error:', error);
      }
    };

    initializeWhatsApp();
  }, []);

  return (
    <>
      <div className="text-center mb-6">
        <p className="text-gray-600">{status}</p>
        {isInitializing && (
          <div className="mt-2">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
            <p className="text-sm text-gray-500 mt-2">Inicializando WhatsApp...</p>
          </div>
        )}
      </div>

      {qrCode && !isReady && !isInitializing && (
        <div className="flex flex-col items-center">
          <div className="bg-white p-4 rounded-lg shadow-md mb-4">
            <QRCodeSVG 
              value={qrCode} 
              size={256}
              level="H"
              includeMargin={true}
            />
          </div>
          <p className="text-sm text-gray-600 text-center">
            Escanea este código QR con WhatsApp en tu teléfono
          </p>
          <p className="text-xs text-gray-500 mt-2">
            1. Abre WhatsApp en tu teléfono
            <br />
            2. Toca Menú o Configuración
            <br />
            3. Selecciona WhatsApp Web
            <br />
            4. Escanea el código QR
          </p>
        </div>
      )}

      {isReady && (
        <div className="text-center text-green-600 font-semibold">
          WhatsApp está conectado y listo para enviar mensajes
        </div>
      )}
    </>
  );
} 