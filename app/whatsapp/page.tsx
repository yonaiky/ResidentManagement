"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { WhatsAppConfig } from "@/components/whatsapp/whatsapp-config";
import { BulkMessageModal } from "@/components/whatsapp/bulk-message-modal";
import { 
  MessageCircle, 
  Users, 
  Send, 
  Settings,
  Smartphone,
  Zap,
  Shield,
  Clock
} from "lucide-react";
export default function WhatsAppPage() {
  const [showBulkModal, setShowBulkModal] = useState(false);

  const features = [
    {
      icon: Zap,
      title: "Envío Automático",
      description: "Recordatorios automáticos de pago y notificaciones importantes"
    },
    {
      icon: Users,
      title: "Mensajes Masivos",
      description: "Envía mensajes a múltiples residentes con filtros personalizados"
    },
    {
      icon: Shield,
      title: "Seguro y Confiable",
      description: "Integración oficial con WhatsApp Business API"
    },
    {
      icon: Clock,
      title: "Tiempo Real",
      description: "Notificaciones instantáneas y confirmaciones de entrega"
    }
  ];

  const messageTemplates = [
    {
      type: "payment_reminder",
      title: "Recordatorio de Pago",
      description: "Mensaje amigable para recordar pagos pendientes",
      icon: "💰"
    },
    {
      type: "overdue_payment",
      title: "Pago Vencido",
      description: "Notificación urgente para pagos vencidos",
      icon: "⚠️"
    },
    {
      type: "payment_confirmation",
      title: "Confirmación de Pago",
      description: "Confirmación automática cuando se recibe un pago",
      icon: "✅"
    },
    {
      type: "maintenance_notification",
      title: "Aviso de Mantenimiento",
      description: "Notificaciones sobre trabajos de mantenimiento",
      icon: "🔧"
    },
    {
      type: "welcome",
      title: "Mensaje de Bienvenida",
      description: "Saludo para nuevos residentes",
      icon: "🏠"
    }
  ];

  return (
    <>
      <div className="flex flex-col gap-8">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="space-y-2">
                  <h1 className="page-title">
                    Notificaciones WhatsApp
                  </h1>
                  <p className="text-lg text-muted-foreground">
                    Gestiona las comunicaciones con los residentes a través de WhatsApp
                  </p>
                </div>
                <div className="flex gap-3">
                  <Button 
                    onClick={() => setShowBulkModal(true)}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <Users className="mr-2 h-4 w-4" />
                    Envío Masivo
                  </Button>
                </div>
              </div>

              {/* Features Overview */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {features.map((feature, index) => (
                  <Card key={index} className="card-hover">
                    <CardContent className="p-6">
                      <div className="flex items-center gap-4">
                        <div className="rounded-lg bg-green-500/10 p-3">
                          <feature.icon className="h-6 w-6 text-green-600 dark:text-green-400" />
                        </div>
                        <div className="space-y-1">
                          <h3 className="font-semibold">{feature.title}</h3>
                          <p className="text-sm text-muted-foreground">{feature.description}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Main Content Tabs */}
              <Tabs defaultValue="config" className="space-y-6">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="config" className="flex items-center gap-2">
                    <Settings className="h-4 w-4" />
                    Configuración
                  </TabsTrigger>
                  <TabsTrigger value="templates" className="flex items-center gap-2">
                    <MessageCircle className="h-4 w-4" />
                    Plantillas
                  </TabsTrigger>
                  <TabsTrigger value="usage" className="flex items-center gap-2">
                    <Smartphone className="h-4 w-4" />
                    Uso
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="config" className="space-y-6">
                  <WhatsAppConfig />
                </TabsContent>

                <TabsContent value="templates" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <div className="icon-badge">
                          <MessageCircle className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        Plantillas de Mensajes
                      </CardTitle>
                      <CardDescription>
                        Plantillas predefinidas para diferentes tipos de comunicación
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="p-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {messageTemplates.map((template, index) => (
                          <div key={index} className="p-4 border rounded-lg hover:shadow-md transition-shadow">
                            <div className="flex items-start gap-3">
                              <span className="text-2xl">{template.icon}</span>
                              <div className="space-y-1">
                                <h3 className="font-medium">{template.title}</h3>
                                <p className="text-sm text-muted-foreground">{template.description}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="usage" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <div className="icon-badge-violet">
                          <Smartphone className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                        </div>
                        Cómo Usar WhatsApp
                      </CardTitle>
                      <CardDescription>
                        Guía paso a paso para configurar y usar las notificaciones de WhatsApp
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="p-6">
                      <div className="space-y-6">
                        <div className="space-y-4">
                          <h3 className="font-semibold text-lg">Configuración Inicial</h3>
                          <div className="space-y-3">
                            <div className="flex items-start gap-3">
                              <div className="rounded-full bg-blue-500 text-white w-6 h-6 flex items-center justify-center text-sm font-medium">1</div>
                              <div>
                                <p className="font-medium">Configurar Evolution API</p>
                                <p className="text-sm text-muted-foreground">Instala y configura la Evolution API en tu servidor</p>
                              </div>
                            </div>
                            <div className="flex items-start gap-3">
                              <div className="rounded-full bg-blue-500 text-white w-6 h-6 flex items-center justify-center text-sm font-medium">2</div>
                              <div>
                                <p className="font-medium">Crear Instancia</p>
                                <p className="text-sm text-muted-foreground">Crea una instancia de WhatsApp en la pestaña de Configuración</p>
                              </div>
                            </div>
                            <div className="flex items-start gap-3">
                              <div className="rounded-full bg-blue-500 text-white w-6 h-6 flex items-center justify-center text-sm font-medium">3</div>
                              <div>
                                <p className="font-medium">Escanear QR</p>
                                <p className="text-sm text-muted-foreground">Escanea el código QR con WhatsApp para vincular tu número</p>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-4">
                          <h3 className="font-semibold text-lg">Envío de Mensajes</h3>
                          <div className="space-y-3">
                            <div className="flex items-start gap-3">
                              <div className="rounded-full bg-green-500 text-white w-6 h-6 flex items-center justify-center text-sm font-medium">1</div>
                              <div>
                                <p className="font-medium">Mensaje Individual</p>
                                <p className="text-sm text-muted-foreground">Desde la tabla de residentes, usa el menú de acciones para enviar WhatsApp</p>
                              </div>
                            </div>
                            <div className="flex items-start gap-3">
                              <div className="rounded-full bg-green-500 text-white w-6 h-6 flex items-center justify-center text-sm font-medium">2</div>
                              <div>
                                <p className="font-medium">Envío Masivo</p>
                                <p className="text-sm text-muted-foreground">Usa el botón "Envío Masivo" para enviar a múltiples residentes</p>
                              </div>
                            </div>
                            <div className="flex items-start gap-3">
                              <div className="rounded-full bg-green-500 text-white w-6 h-6 flex items-center justify-center text-sm font-medium">3</div>
                              <div>
                                <p className="font-medium">Automatización</p>
                                <p className="text-sm text-muted-foreground">Los recordatorios se pueden enviar automáticamente según la configuración</p>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                          <div className="flex items-start gap-3">
                            <MessageCircle className="h-5 w-5 text-amber-600 mt-0.5" />
                            <div>
                              <h4 className="font-medium text-amber-800">Consejos Importantes</h4>
                              <ul className="text-sm text-amber-700 mt-2 space-y-1">
                                <li>• Asegúrate de que los residentes tengan números de teléfono válidos</li>
                                <li>• Los mensajes masivos tienen un delay de 2 segundos entre envíos</li>
                                <li>• Verifica el estado de la conexión antes de enviar mensajes</li>
                                <li>• Los números deben incluir el código de país (ej: +1 para RD)</li>
                              </ul>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
      </div>

      <BulkMessageModal
        open={showBulkModal}
        onOpenChange={setShowBulkModal}
        onSuccess={() => {}}
      />
    </>
  );
}