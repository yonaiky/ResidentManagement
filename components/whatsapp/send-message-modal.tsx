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
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, MessageCircle, Send } from "lucide-react";

const formSchema = z.object({
  messageType: z.enum(["payment_reminder", "overdue_payment", "payment_confirmation", "welcome", "custom"]),
  customMessage: z.string().optional(),
  amount: z.string().optional(),
  dueDate: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

type Resident = {
  id: number;
  name: string;
  lastName: string;
  phone: string;
};

interface SendMessageModalProps {
  resident: Resident | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function SendMessageModal({ resident, open, onOpenChange, onSuccess }: SendMessageModalProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      messageType: "payment_reminder",
      customMessage: "",
      amount: "700",
      dueDate: "",
    },
  });

  const messageType = form.watch("messageType");

  async function onSubmit(data: FormData) {
    if (!resident) return;

    try {
      setIsLoading(true);
      
      const response = await fetch('/api/whatsapp/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          residentId: resident.id,
          ...data,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to send message');
      }

      toast({
        title: "Mensaje enviado",
        description: `WhatsApp enviado exitosamente a ${resident.name} ${resident.lastName}`,
      });

      onSuccess();
      onOpenChange(false);
      form.reset();
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "No se pudo enviar el mensaje",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }

  const getMessageTypeDescription = (type: string) => {
    switch (type) {
      case "payment_reminder":
        return "Recordatorio amigable de pago pendiente";
      case "overdue_payment":
        return "Notificación de pago vencido con urgencia";
      case "payment_confirmation":
        return "Confirmación de pago recibido";
      case "welcome":
        return "Mensaje de bienvenida para nuevos residentes";
      case "custom":
        return "Mensaje personalizado";
      default:
        return "";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="rounded-lg bg-green-500/10 p-2">
              <MessageCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
            Enviar WhatsApp
          </DialogTitle>
          <DialogDescription>
            Enviar mensaje de WhatsApp a {resident?.name} {resident?.lastName}
            {resident?.phone && (
              <span className="block mt-1 font-mono text-sm">📱 {resident.phone}</span>
            )}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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
                        ⚠️ Pago Vencido
                      </SelectItem>
                      <SelectItem value="payment_confirmation">
                        ✅ Confirmación de Pago
                      </SelectItem>
                      <SelectItem value="welcome">
                        🏠 Mensaje de Bienvenida
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

            {(messageType === "payment_reminder" || messageType === "overdue_payment" || messageType === "payment_confirmation") && (
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Monto (DOP)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="700.00"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {messageType !== "payment_confirmation" && (
                  <FormField
                    control={form.control}
                    name="dueDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Fecha de Vencimiento</FormLabel>
                        <FormControl>
                          <Input
                            type="date"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </div>
            )}

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
                      Puedes usar {`{name}`} para incluir el nombre del residente
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isLoading} className="flex-1 bg-green-600 hover:bg-green-700">
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Enviar WhatsApp
                  </>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}