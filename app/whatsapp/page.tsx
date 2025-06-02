"use client";

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, QrCode, CheckCircle2, XCircle } from 'lucide-react';
import Image from 'next/image';

type BotStatus = 'disconnected' | 'initializing' | 'scanning' | 'connected';

export default function WhatsappPage() {
  const [status, setStatus] = useState<BotStatus>('initializing');
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const fetchStatus = async () => {
    try {
      const response = await fetch('/api/whatsapp/status');
      if (!response.ok) {
        throw new Error('Failed to fetch status');
      }
      const data = await response.json();
      setStatus(data.status);
      if (data.status === 'scanning' && data.qrCodeData) {
        // Generar QR URL si el estado es scanning
        // Como el backend ya nos da el QR data (la string), la usamos directamente
         try {
             const qrcode = require('qrcode'); // Importa qrcode solo en el cliente si es necesario para generar URL
             qrcode.toDataURL(data.qrCodeData, (err: any, url: string) => {
                 if (err) console.error('Error generating QR code URL:', err);
                 else setQrCodeUrl(url);
             });
         } catch (e) {
             console.error("Error importing qrcode on client:", e);
             // Fallback or error handling if qrcode can't be imported/used client-side
         }
      } else {
        setQrCodeUrl(null);
      }
    } catch (error: any) {
      console.error('Error fetching WhatsApp status:', error);
      toast({
        title: 'Error',
        description: 'No se pudo obtener el estado del bot de WhatsApp.',
        variant: 'destructive',
      });
      setStatus('disconnected'); // Assume disconnected on error
      setQrCodeUrl(null);
    }
  };

  useEffect(() => {
    fetchStatus();
    // Opcional: Refrescar estado periódicamente o usar WebSockets/SSE si se implementan eventos en el backend
    const interval = setInterval(fetchStatus, 5000); // Refrescar cada 5 segundos
    return () => clearInterval(interval);
  }, []);

  const handleInitialize = async () => {
      setIsLoading(true);
       toast({
            title: 'Inicializando bot',
            description: 'Por favor espera...',
            variant: 'default',
          });
      // Nota: initializeWhatsappClient se debe llamar en el backend al iniciar la app
      // o a través de otro endpoint. Este botón simularía una acción si initialize
      // no se inició automáticamente o falló al inicio del servidor.
      // Para una implementación real, este botón podría llamar a un endpoint
      // que fuerce la re-inicialización en el backend.

      // Como initializeWhatsappClient ya se llama en el backend al iniciar (idealmente),
      // este botón principalmente gatillará el fetchStatus.
      // Si necesitas un endpoint para forzar la inicialización, créalo.
       await fetchStatus(); // Refrescar el estado para ver si el backend ya inició o está en scanning
       setIsLoading(false);
  }

  const renderStatus = () => {
    switch (status) {
      case 'initializing':
        return <div className="flex items-center text-blue-600"><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Inicializando...</div>;
      case 'scanning':
        return <div className="flex items-center text-amber-600"><QrCode className="mr-2 h-5 w-5" /> Escanea el código QR</div>;
      case 'connected':
        return <div className="flex items-center text-green-600"><CheckCircle2 className="mr-2 h-5 w-5" /> Conectado</div>;
      case 'disconnected':
        return <div className="flex items-center text-red-600"><XCircle className="mr-2 h-5 w-5" /> Desconectado</div>;
      default:
        return <div className="flex items-center">Estado desconocido</div>;
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100 dark:bg-gray-900">
      <Card className="w-[350px]">
        <CardHeader>
          <CardTitle>Estado del Bot de WhatsApp</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-4">
          {renderStatus()}
          {status === 'scanning' && qrCodeUrl && (
            <div className="flex flex-col items-center gap-2">
                 <Image src={qrCodeUrl} alt="Código QR de WhatsApp" width={200} height={200} />
                 <p className="text-sm text-muted-foreground text-center">Escanea este código con la aplicación de WhatsApp en tu teléfono (WhatsApp Web/Desktop &gt; Dispositivos vinculados).</p>
            </div>
           
          )}
           {status === 'disconnected' && (
               <Button onClick={handleInitialize} disabled={isLoading}>
                   {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Intentando inicializar</> : 'Inicializar Bot'}
               </Button>
           )}
        </CardContent>
        <CardFooter className="text-sm text-muted-foreground">
             Asegúrate de que tu teléfono esté encendido y conectado a internet.
        </CardFooter>
      </Card>
    </div>
  );
} 