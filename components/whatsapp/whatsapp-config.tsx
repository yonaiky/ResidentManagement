"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/components/ui/use-toast";
import { 
  MessageCircle, 
  Wifi, 
  WifiOff, 
  RefreshCw, 
  QrCode,
  CheckCircle,
  AlertTriangle,
  Settings
} from "lucide-react";

interface WhatsAppStatus {
  status: string;
  qrcode?: string;
  instance: string;
  apiUrl: string;
}

export function WhatsAppConfig() {
  const { toast } = useToast();
  const [status, setStatus] = useState<WhatsAppStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    checkStatus();
  }, []);

  const checkStatus = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/whatsapp/status');
      
      if (response.ok) {
        const data = await response.json();
        setStatus(data);
      } else {
        throw new Error('Failed to get status');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo verificar el estado de WhatsApp",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createInstance = async () => {
    try {
      setCreating(true);
      const response = await fetch('/api/whatsapp/status', {
        method: 'POST'
      });
      
      if (response.ok) {
        const data = await response.json();
        setStatus(data);
        toast({
          title: "Instancia creada",
          description: "La instancia de WhatsApp ha sido creada. Escanea el código QR para conectar.",
        });
      } else {
        throw new Error('Failed to create instance');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo crear la instancia de WhatsApp",
        variant: "destructive",
      });
    } finally {
      setCreating(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'open':
      case 'connected':
        return (
          <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
            <CheckCircle className="mr-1 h-3 w-3" />
            Conectado
          </Badge>
        );
      case 'connecting':
        return (
          <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300">
            <RefreshCw className="mr-1 h-3 w-3 animate-spin" />
            Conectando
          </Badge>
        );
      case 'close':
      case 'disconnected':
        return (
          <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300">
            <WifiOff className="mr-1 h-3 w-3" />
            Desconectado
          </Badge>
        );
      default:
        return (
          <Badge className="bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300">
            <AlertTriangle className="mr-1 h-3 w-3" />
            Desconocido
          </Badge>
        );
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/50 dark:to-emerald-950/50">
          <CardTitle className="flex items-center gap-2">
            <div className="rounded-lg bg-green-500/10 p-2">
              <MessageCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
            Configuración de WhatsApp
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-6">
            {/* Estado de la conexión */}
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="space-y-1">
                <h3 className="font-medium">Estado de la Conexión</h3>
                <p className="text-sm text-muted-foreground">
                  {status ? `Instancia: ${status.instance}` : 'Verificando estado...'}
                </p>
              </div>
              <div className="flex items-center gap-3">
                {status && getStatusBadge(status.status)}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={checkStatus}
                  disabled={loading}
                >
                  {loading ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            {/* Información de la API */}
            {status && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium mb-2">URL de la API</h4>
                  <p className="text-sm text-muted-foreground font-mono">
                    {status.apiUrl}
                  </p>
                </div>
                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium mb-2">Instancia</h4>
                  <p className="text-sm text-muted-foreground font-mono">
                    {status.instance}
                  </p>
                </div>
              </div>
            )}

            {/* Código QR */}
            {status?.qrcode && (
              <div className="space-y-4">
                <Alert>
                  <QrCode className="h-4 w-4" />
                  <AlertDescription>
                    Escanea este código QR con WhatsApp para conectar la instancia.
                    Ve a WhatsApp → Dispositivos vinculados → Vincular un dispositivo.
                  </AlertDescription>
                </Alert>
                <div className="flex justify-center p-6 border rounded-lg bg-white">
                  <img 
                    src={status.qrcode} 
                    alt="QR Code para WhatsApp" 
                    className="max-w-xs"
                  />
                </div>
              </div>
            )}

            {/* Acciones */}
            <div className="flex gap-3">
              {(!status || status.status === 'error') && (
                <Button
                  onClick={createInstance}
                  disabled={creating}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {creating ? (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                      Creando instancia...
                    </>
                  ) : (
                    <>
                      <MessageCircle className="mr-2 h-4 w-4" />
                      Crear Instancia
                    </>
                  )}
                </Button>
              )}
              
              <Button variant="outline" onClick={checkStatus} disabled={loading}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Actualizar Estado
              </Button>
            </div>

            {/* Información adicional */}
            <div className="space-y-4">
              <h3 className="font-medium">Información Importante</h3>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>• La instancia de WhatsApp debe estar conectada para enviar mensajes.</p>
                <p>• El código QR expira después de unos minutos, actualiza si es necesario.</p>
                <p>• Una vez conectado, el estado se mantendrá hasta que se desconecte manualmente.</p>
                <p>• Los mensajes se envían desde el número de WhatsApp conectado.</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}