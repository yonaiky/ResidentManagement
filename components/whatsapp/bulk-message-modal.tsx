"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, MessageCircle, Send, Users, AlertTriangle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

const formSchema = z.object({
  messageType: z.enum(["payment_reminder", "overdue_payment", "maintenance_notification", "custom"]),
  customMessage: z.string().optional(),
  filters: z.object({
    paymentStatus: z.string().optional(),
    hasTokens: z.boolean().optional(),
  }).optional(),
});

type FormData = z.infer<typeof formSchema>;

interface BulkMessageModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function BulkMessageModal({ open, onOpenChange, onSuccess }: BulkMessageModalProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<any>(null);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      messageType: "payment_reminder",
      customMessage: "",
      filters: {
        paymentStatus: undefined,
        hasTokens: undefined,
      },
    },
  });

  const messageType = form.watch("messageType");

  async function onSubmit(data: FormData) {
    try {
      setIsLoading(true);
      setResults(null);
      
      const response = await fetch('/api/whatsapp/bulk-send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to send bulk messages');
      }

      setResults(result);
      toast({
        title: "Mensajes enviados",
        description: `Se enviaron ${result.summary.successful} de ${result.summary.total} mensajes exitosamente`,
      });

      onSuccess();
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "No se pudieron enviar los mensajes",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }

  const getMessageTypeDescription = (type: string) => {
    switch (type) {
      case "payment_reminder":
        return "Recordatorio de pago para residentes con pagos pendientes";
      case "overdue_payment":
        return "Notificación urgente para pagos vencidos";
      case "maintenance_notification":
        return "Aviso de mantenimiento programado";
      case "custom":
        return "Mensaje personalizado para todos los residentes seleccionados";
      default:
        return "";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="rounded-lg bg-blue-500/10 p-2">
              <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            Envío Masivo de WhatsApp
          </DialogTitle>
          <DialogDescription>
            Enviar mensajes de WhatsApp a múltiples residentes según los filtros seleccionados
          </DialogDescription>
        </DialogHeader>

        {!results ? (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Importante:</strong> Los mensajes se enviarán con un delay de 2 segundos entre cada uno 
                  para evitar limitaciones de la API. El proceso puede tomar varios minutos.
                </AlertDescription>
              </Alert>

              <FormField
                control={form.control}
                name="messageType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo de Mensaje</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona el tipo de mensaje" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="payment_reminder">
                          💰 Recordatorio de Pago
                        </SelectItem>
                        <SelectItem value="overdue_payment">
                          ⚠️ Pagos Vencidos
                        </SelectItem>
                        <SelectItem value="maintenance_notification">
                          🔧 Aviso de Mantenimiento
                        </SelectItem>
                        <SelectItem value="custom">
                          ✏️ Mensaje Personalizado
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      {getMessageTypeDescription(messageType)}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {messageType === "custom" && (
                <FormField
                  control={form.control}
                  name="customMessage"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Mensaje Personalizado</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Escribe tu mensaje personalizado aquí..."
                          className="min-h-[120px]"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Puedes usar {`{name}`} para incluir el nombre de cada residente
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <div className="space-y-4">
                <h3 className="font-medium">Filtros de Residentes</h3>
                
                <FormField
                  control={form.control}
                  name="filters.paymentStatus"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Estado de Pago</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Todos los estados" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="pending">Solo Pendientes</SelectItem>
                          <SelectItem value="overdue">Solo Vencidos</SelectItem>
                          <SelectItem value="paid">Solo Pagados</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Filtrar residentes por su estado de pago actual
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="filters.hasTokens"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>
                          Solo residentes con tokens
                        </FormLabel>
                        <FormDescription>
                          Enviar solo a residentes que tienen tokens de acceso asignados
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  className="flex-1"
                  disabled={isLoading}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={isLoading} className="flex-1 bg-blue-600 hover:bg-blue-700">
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Enviando mensajes...
                    </>
                  ) : (
                    <>
                      <Send className="mr-2 h-4 w-4" />
                      Enviar Mensajes
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Form>
        ) : (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-2">Resultados del Envío</h3>
              <div className="grid grid-cols-3 gap-4">
                <div className="p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{results.summary.total}</div>
                  <div className="text-sm text-muted-foreground">Total</div>
                </div>
                <div className="p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{results.summary.successful}</div>
                  <div className="text-sm text-muted-foreground">Exitosos</div>
                </div>
                <div className="p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-red-600">{results.summary.failed}</div>
                  <div className="text-sm text-muted-foreground">Fallidos</div>
                </div>
              </div>
            </div>

            {results.results.length > 0 && (
              <div className="space-y-2 max-h-60 overflow-y-auto">
                <h4 className="font-medium">Detalles por Residente</h4>
                {results.results.map((result: any, index: number) => (
                  <div key={index} className="flex items-center justify-between p-2 border rounded text-sm">
                    <span>{result.name}</span>
                    <span className={`px-2 py-1 rounded text-xs ${
                      result.status === 'sent' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {result.status === 'sent' ? '✅ Enviado' : '❌ Error'}
                    </span>
                  </div>
                ))}
              </div>
            )}

            <Button
              onClick={() => {
                setResults(null);
                onOpenChange(false);
              }}
              className="w-full"
            >
              Cerrar
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}