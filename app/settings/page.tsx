"use client";

import { useState, useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
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
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { 
  Building2, 
  FileText, 
  Save, 
  Eye, 
  Settings as SettingsIcon,
  Receipt,
  Shield,
  Globe,
  Phone,
  Mail,
  MapPin,
  Hash,
  Calendar,
  Download,
  Loader2,
  Edit
} from "lucide-react";
import Header from '@/components/layout/header';
import Sidebar from '@/components/layout/sidebar';
import { Footer } from '@/components/ui/footer';
import { DGIInvoiceGenerator, type CompanyInfo } from "@/lib/invoice-generator";
import { IMaskInput } from "react-imask";
import { InputMask } from "@/components/ui/input-mask";

const companySchema = z.object({
  name: z.string().min(1, "El nombre de la empresa es requerido"),
  rnc: z.string()
    .min(1, "El RNC es requerido")
    .regex(/^\d{1}-\d{2}-\d{5}-\d{1}$/, "Formato de RNC inválido (ej: 1-31-12345-6)"),
  address: z.string().min(1, "La dirección es requerida"),
  phone: z.string().min(1, "El teléfono es requerido"),
  email: z.string().email("Email inválido"),
  website: z.string().optional(),
});

const fiscalSchema = z.object({
  resolutionNumber: z.string().min(1, "El número de resolución es requerido"),
  resolutionDate: z.string().min(1, "La fecha de resolución es requerida"),
  validUntil: z.string().min(1, "La fecha de validez es requerida"),
  ncfSeries: z.string().min(1, "La serie NCF es requerida").regex(/^[A-Z]\d{2}$/, "Formato inválido (ej: B01)"),
  currentSequence: z.number().min(1, "La secuencia debe ser mayor a 0"),
  maxSequence: z.number().min(1, "La secuencia máxima debe ser mayor a 0"),
});

const invoiceSchema = z.object({
  paymentTerms: z.string().min(1, "Los términos de pago son requeridos"),
  latePaymentInterest: z.number().min(0, "El interés debe ser mayor o igual a 0"),
  itbisRate: z.number().min(0).max(100, "El ITBIS debe estar entre 0 y 100"),
  footerNotes: z.string().optional(),
});

type CompanyFormData = z.infer<typeof companySchema>;
type FiscalFormData = z.infer<typeof fiscalSchema>;
type InvoiceFormData = z.infer<typeof invoiceSchema>;

export default function SettingsPage() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [isEditing, setIsEditing] = useState(false);

  const companyForm = useForm<CompanyFormData>({
    resolver: zodResolver(companySchema),
    defaultValues: {
      name: "",
      rnc: "",
      address: "",
      phone: "",
      email: "",
      website: "",
    },
  });

  const fiscalForm = useForm<FiscalFormData>({
    resolver: zodResolver(fiscalSchema),
    defaultValues: {
      resolutionNumber: "",
      resolutionDate: "",
      validUntil: "",
      ncfSeries: "",
      currentSequence: 1,
      maxSequence: 99999999,
    },
  });

  const invoiceForm = useForm<InvoiceFormData>({
    resolver: zodResolver(invoiceSchema),
    defaultValues: {
      paymentTerms: "",
      latePaymentInterest: 2.5,
      itbisRate: 18,
      footerNotes: "",
    },
  });

  useEffect(() => {
    fetchCurrentUser();
    loadSettings();
  }, []);

  const fetchCurrentUser = async () => {
    try {
      const response = await fetch('/api/auth/me');
      if (response.ok) {
        const data = await response.json();
        setCurrentUser(data.user);
      }
    } catch (error) {
      console.error('Error fetching current user:', error);
    }
  };

  const loadSettings = async () => {
    try {
      setIsLoading(true);
      
      // Cargar información de la empresa
      const companyResponse = await fetch('/api/settings/company');
      if (companyResponse.ok) {
        const companyData = await companyResponse.json();
        if (companyData) {
          companyForm.reset(companyData);
        }
      }

      // Cargar configuración fiscal
      const fiscalResponse = await fetch('/api/settings/fiscal');
      if (fiscalResponse.ok) {
        const fiscalData = await fiscalResponse.json();
        if (fiscalData) {
          fiscalData.resolutionDate = new Date(fiscalData.resolutionDate).toISOString().split('T')[0];
          fiscalData.validUntil = new Date(fiscalData.validUntil).toISOString().split('T')[0];
          fiscalForm.reset(fiscalData);
        }
      }

      // Cargar configuración de facturación
      const invoiceResponse = await fetch('/api/settings/invoice');
      if (invoiceResponse.ok) {
        const invoiceData = await invoiceResponse.json();
        if (invoiceData) {
          invoiceForm.reset(invoiceData);
        }
      }
    } catch (error) {
      console.error('Error loading settings:', error);
      toast({
        title: "❌ Error",
        description: "No se pudieron cargar las configuraciones",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      setIsInitialLoad(false);
    }
  };

  const onCompanySubmit = async (data: CompanyFormData) => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/settings/company', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Failed to update company info');
      }
      
      toast({
        title: "✅ Información de empresa actualizada",
        description: "Los datos de la empresa han sido guardados exitosamente",
      });
      setIsEditing(false);
    } catch (error) {
      toast({
        title: "❌ Error",
        description: "No se pudo guardar la información de la empresa",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const onFiscalSubmit = async (data: FiscalFormData) => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/settings/fiscal', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Failed to update fiscal config');
      }
      
      toast({
        title: "✅ Configuración fiscal actualizada",
        description: "Los datos fiscales han sido guardados exitosamente",
      });
    } catch (error) {
      toast({
        title: "❌ Error",
        description: "No se pudo guardar la configuración fiscal",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const onInvoiceSubmit = async (data: InvoiceFormData) => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/settings/invoice', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Failed to update invoice config');
      }
      
      toast({
        title: "✅ Configuración de facturación actualizada",
        description: "Los parámetros de facturación han sido guardados exitosamente",
      });
    } catch (error) {
      toast({
        title: "❌ Error",
        description: "No se pudo guardar la configuración de facturación",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const generatePreviewInvoice = async () => {
    try {
      setPreviewLoading(true);
      
      const companyData = companyForm.getValues();
      const invoiceData = invoiceForm.getValues();
      
      const companyInfo: CompanyInfo = {
        name: companyData.name,
        rnc: companyData.rnc,
        address: companyData.address,
        phone: companyData.phone,
        email: companyData.email,
        website: companyData.website,
      };

      const invoiceGenerator = new DGIInvoiceGenerator(companyInfo);
      
      const mockInvoiceData = {
        resident: {
          id: 1,
          name: "Juan Carlos",
          lastName: "Pérez García",
          cedula: "001-1234567-8",
          noRegistro: "A-001",
          phone: "(809) 555-9876",
          address: "Calle Principal #456, Santo Domingo Este"
        },
        payments: [
          {
            month: new Date().getMonth() + 1,
            year: new Date().getFullYear(),
            amount: 700,
            status: 'pending',
            dueDate: new Date()
          }
        ],
        invoiceNumber: DGIInvoiceGenerator.generateInvoiceNumber(),
        ncf: DGIInvoiceGenerator.generateNCF(),
        issueDate: new Date()
      };

      const invoice = invoiceGenerator.generateInvoice(mockInvoiceData);
      const pdfDataUrl = invoice.output('dataurlstring');
      
      const newWindow = window.open();
      if (newWindow) {
        newWindow.document.write(`
          <html>
            <head>
              <title>Vista Previa - Factura DGI</title>
              <style>
                body { margin: 0; padding: 0; font-family: Arial, sans-serif; }
                .header { background: #3498db; color: white; padding: 15px; text-align: center; }
                .info { background: #f8f9fa; padding: 15px; margin: 20px; border-radius: 5px; }
              </style>
            </head>
            <body>
              <div class="header">
                <h2>📄 Vista Previa de Factura DGI</h2>
                <p>Ejemplo de factura con la configuración actual</p>
              </div>
              <div class="info">
                <h3>ℹ️ Información de la Vista Previa</h3>
                <p><strong>Empresa:</strong> ${companyData.name}</p>
                <p><strong>RNC:</strong> ${companyData.rnc}</p>
                <p><strong>Cliente de Ejemplo:</strong> Juan Carlos Pérez García</p>
                <p><strong>Nota:</strong> Esta es una factura de ejemplo para verificar el formato</p>
              </div>
              <iframe 
                src="${pdfDataUrl}" 
                style="width: 100%; height: 70vh; border: 1px solid #ddd; margin: 20px; border-radius: 5px;"
              ></iframe>
            </body>
          </html>
        `);
      }

      toast({
        title: "📄 Vista previa generada",
        description: "Se ha abierto una nueva ventana con la vista previa de la factura",
      });
    } catch (error) {
      toast({
        title: "❌ Error",
        description: "No se pudo generar la vista previa",
        variant: "destructive",
      });
    } finally {
      setPreviewLoading(false);
    }
  };

  // Check if user has permission to access settings
  if (currentUser && currentUser.role !== 'admin') {
    return (
      <div className="flex min-h-screen flex-col bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800">
        <Header />
        <div className="flex flex-1">
          <Sidebar />
          <main className="flex-1 p-4 pt-20 md:p-8 md:pt-20 lg:p-12 lg:pt-24">
            <div className="mx-auto max-w-7xl animate-fade-in">
              <div className="text-center py-12">
                <Shield className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-50" />
                <h1 className="text-2xl font-bold text-muted-foreground mb-2">Acceso Denegado</h1>
                <p className="text-muted-foreground">
                  Solo los administradores pueden acceder a la configuración del sistema.
                </p>
              </div>
            </div>
          </main>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800">
      <Header />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 p-4 pt-20 md:p-8 md:pt-20 lg:p-12 lg:pt-24">
          <div className="mx-auto max-w-7xl animate-fade-in">
            <div className="flex flex-col gap-8">
              {/* Header Section */}
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="space-y-2">
                  <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-gray-900 to-gray-600 dark:from-gray-100 dark:to-gray-400 bg-clip-text text-transparent">
                    Configuración Fiscal
                  </h1>
                  <p className="text-lg text-muted-foreground">
                    Administra la información fiscal que aparece en las facturas DGI
                  </p>
                </div>
                <div className="flex gap-3">
                  <Button 
                    onClick={generatePreviewInvoice} 
                    variant="outline"
                    disabled={previewLoading || isInitialLoad}
                  >
                    {previewLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Generando...
                      </>
                    ) : (
                      <>
                        <Eye className="mr-2 h-4 w-4" />
                        Vista Previa
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {isInitialLoad ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <Tabs defaultValue="company" className="space-y-6">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="company" className="flex items-center gap-2">
                      <Building2 className="h-4 w-4" />
                      Información de Empresa
                    </TabsTrigger>
                    <TabsTrigger value="fiscal" className="flex items-center gap-2">
                      <Shield className="h-4 w-4" />
                      Configuración Fiscal
                    </TabsTrigger>
                    <TabsTrigger value="invoice" className="flex items-center gap-2">
                      <Receipt className="h-4 w-4" />
                      Parámetros de Facturación
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="company" className="space-y-6">
                    <Card className="card-hover">
                      <CardHeader className="bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-950/50 dark:to-cyan-950/50">
                        <CardTitle className="flex items-center gap-2">
                          <div className="rounded-lg bg-blue-500/10 p-2">
                            <Building2 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                          </div>
                          Datos de la Empresa
                        </CardTitle>
                        <CardDescription>
                          Información que aparecerá en el encabezado de todas las facturas
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="p-6">
                        <Form {...companyForm}>
                          <form onSubmit={companyForm.handleSubmit(onCompanySubmit)} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              <FormField
                                control={companyForm.control}
                                name="name"
                                render={({ field }) => (
                                  <FormItem className="md:col-span-2">
                                    <FormLabel className="flex items-center gap-2">
                                      <Building2 className="h-4 w-4" />
                                      Nombre de la Empresa
                                    </FormLabel>
                                    <FormControl>
                                      <Input placeholder="Nombre completo de la empresa" {...field} disabled={!isEditing} />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />

                              <FormField
                                control={companyForm.control}
                                name="rnc"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel className="flex items-center gap-2">
                                      <Hash className="h-4 w-4" />
                                      RNC (Registro Nacional del Contribuyente)
                                    </FormLabel>
                                    <FormControl>
                                      <InputMask
                                        mask="0-00-00000-0"
                                        unmask={false}
                                        onAccept={(value: string) => field.onChange(value)}
                                        value={field.value}
                                        placeholder="1-31-12345-6"
                                        disabled={!isEditing}
                                      />
                                    </FormControl>
                                    <FormDescription>
                                      Formato: X-XX-XXXXX-X
                                    </FormDescription>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />

                              <FormField
                                control={companyForm.control}
                                name="phone"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel className="flex items-center gap-2">
                                      <Phone className="h-4 w-4" />
                                      Teléfono Principal
                                    </FormLabel>
                                    <FormControl>
                                      <Input placeholder="(809) 555-0123" {...field} disabled={!isEditing} />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />

                              <FormField
                                control={companyForm.control}
                                name="email"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel className="flex items-center gap-2">
                                      <Mail className="h-4 w-4" />
                                      Email Corporativo
                                    </FormLabel>
                                    <FormControl>
                                      <Input type="email" placeholder="admin@empresa.com" {...field} disabled={!isEditing} />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />

                              <FormField
                                control={companyForm.control}
                                name="website"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel className="flex items-center gap-2">
                                      <Globe className="h-4 w-4" />
                                      Sitio Web (Opcional)
                                    </FormLabel>
                                    <FormControl>
                                      <Input placeholder="www.empresa.com" {...field} disabled={!isEditing} />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />

                              <FormField
                                control={companyForm.control}
                                name="address"
                                render={({ field }) => (
                                  <FormItem className="md:col-span-2">
                                    <FormLabel className="flex items-center gap-2">
                                      <MapPin className="h-4 w-4" />
                                      Dirección Completa
                                    </FormLabel>
                                    <FormControl>
                                      <Textarea 
                                        placeholder="Dirección completa de la empresa"
                                        className="min-h-[80px]"
                                        {...field} 
                                        disabled={!isEditing}
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </div>

                            {isEditing ? (
                              <Button type="submit" disabled={isLoading} className="w-full md:w-auto">
                                {isLoading ? (
                                  <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Guardando...
                                  </>
                                ) : (
                                  <>
                                    <Save className="mr-2 h-4 w-4" />
                                    Guardar Información de Empresa
                                  </>
                                )}
                              </Button>
                            ) : (
                              <Button type="button" onClick={() => setIsEditing(true)} className="w-full md:w-auto">
                                <Edit className="mr-2 h-4 w-4" />
                                Editar Información
                              </Button>
                            )}
                          </form>
                        </Form>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="fiscal" className="space-y-6">
                    <Card className="card-hover">
                      <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/50 dark:to-emerald-950/50">
                        <CardTitle className="flex items-center gap-2">
                          <div className="rounded-lg bg-green-500/10 p-2">
                            <Shield className="h-5 w-5 text-green-600 dark:text-green-400" />
                          </div>
                          Configuración Fiscal DGI
                        </CardTitle>
                        <CardDescription>
                          Parámetros fiscales según las normativas de la DGI República Dominicana
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="p-6">
                        <Form {...fiscalForm}>
                          <form onSubmit={fiscalForm.handleSubmit(onFiscalSubmit)} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              <FormField
                                control={fiscalForm.control}
                                name="resolutionNumber"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel className="flex items-center gap-2">
                                      <FileText className="h-4 w-4" />
                                      Número de Resolución DGI
                                    </FormLabel>
                                    <FormControl>
                                      <Input placeholder="06-2018" {...field} />
                                    </FormControl>
                                    <FormDescription>
                                      Número de la resolución general de la DGI
                                    </FormDescription>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />

                              <FormField
                                control={fiscalForm.control}
                                name="resolutionDate"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel className="flex items-center gap-2">
                                      <Calendar className="h-4 w-4" />
                                      Fecha de Resolución
                                    </FormLabel>
                                    <FormControl>
                                      <Input 
                                        type="date" 
                                        {...field} 
                                      />
                                    </FormControl>
                                    <FormDescription>
                                      Fecha de emisión de la resolución
                                    </FormDescription>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />

                              <FormField
                                control={fiscalForm.control}
                                name="validUntil"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel className="flex items-center gap-2">
                                      <Calendar className="h-4 w-4" />
                                      Válida Hasta
                                    </FormLabel>
                                    <FormControl>
                                      <Input 
                                        type="date" 
                                        {...field} 
                                      />
                                    </FormControl>
                                    <FormDescription>
                                      Fecha de vencimiento de la autorización
                                    </FormDescription>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />

                              <FormField
                                control={fiscalForm.control}
                                name="ncfSeries"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel className="flex items-center gap-2">
                                      <Hash className="h-4 w-4" />
                                      Serie NCF
                                    </FormLabel>
                                    <FormControl>
                                      <Input placeholder="B01" {...field} />
                                    </FormControl>
                                    <FormDescription>
                                      Serie para facturas de consumo (B01)
                                    </FormDescription>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />

                              <FormField
                                control={fiscalForm.control}
                                name="currentSequence"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Secuencia Actual</FormLabel>
                                    <FormControl>
                                      <Input 
                                        type="number" 
                                        placeholder="1" 
                                        {...field}
                                        onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                                      />
                                    </FormControl>
                                    <FormDescription>
                                      Próximo número de secuencia a usar
                                    </FormDescription>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />

                              <FormField
                                control={fiscalForm.control}
                                name="maxSequence"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Secuencia Máxima</FormLabel>
                                    <FormControl>
                                      <Input 
                                        type="number" 
                                        placeholder="99999999" 
                                        {...field}
                                        onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                                      />
                                    </FormControl>
                                    <FormDescription>
                                      Número máximo autorizado por la DGI
                                    </FormDescription>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </div>

                            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                              <div className="flex items-start gap-3">
                                <Shield className="h-5 w-5 text-amber-600 mt-0.5" />
                                <div>
                                  <h4 className="font-medium text-amber-800">Información Importante</h4>
                                  <p className="text-sm text-amber-700 mt-1">
                                    Esta configuración debe coincidir exactamente con la autorización emitida por la DGI. 
                                    Cualquier discrepancia puede resultar en sanciones fiscales.
                                  </p>
                                </div>
                              </div>
                            </div>

                            <Button type="submit" disabled={isLoading} className="w-full md:w-auto">
                              {isLoading ? (
                                <>
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  Guardando...
                                </>
                              ) : (
                                <>
                                  <Save className="mr-2 h-4 w-4" />
                                  Guardar Configuración Fiscal
                                </>
                              )}
                            </Button>
                          </form>
                        </Form>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="invoice" className="space-y-6">
                    <Card className="card-hover">
                      <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/50 dark:to-pink-950/50">
                        <CardTitle className="flex items-center gap-2">
                          <div className="rounded-lg bg-purple-500/10 p-2">
                            <Receipt className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                          </div>
                          Parámetros de Facturación
                        </CardTitle>
                        <CardDescription>
                          Configuración de términos, condiciones y cálculos fiscales
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="p-6">
                        <Form {...invoiceForm}>
                          <form onSubmit={invoiceForm.handleSubmit(onInvoiceSubmit)} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              <FormField
                                control={invoiceForm.control}
                                name="itbisRate"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Tasa de ITBIS (%)</FormLabel>
                                    <FormControl>
                                      <Input 
                                        type="number" 
                                        step="0.01"
                                        placeholder="18" 
                                        {...field}
                                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                      />
                                    </FormControl>
                                    <FormDescription>
                                      Tasa actual del ITBIS en República Dominicana
                                    </FormDescription>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />

                              <FormField
                                control={invoiceForm.control}
                                name="latePaymentInterest"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Interés por Mora (%)</FormLabel>
                                    <FormControl>
                                      <Input 
                                        type="number" 
                                        step="0.1"
                                        placeholder="2.5" 
                                        {...field}
                                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                      />
                                    </FormControl>
                                    <FormDescription>
                                      Interés mensual por pagos tardíos
                                    </FormDescription>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />

                              <FormField
                                control={invoiceForm.control}
                                name="paymentTerms"
                                render={({ field }) => (
                                  <FormItem className="md:col-span-2">
                                    <FormLabel>Términos de Pago</FormLabel>
                                    <FormControl>
                                      <Textarea 
                                        placeholder="Términos y condiciones de pago"
                                        className="min-h-[100px]"
                                        {...field} 
                                      />
                                    </FormControl>
                                    <FormDescription>
                                      Texto que aparecerá en la sección de términos de pago
                                    </FormDescription>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />

                              <FormField
                                control={invoiceForm.control}
                                name="footerNotes"
                                render={({ field }) => (
                                  <FormItem className="md:col-span-2">
                                    <FormLabel>Notas Adicionales (Opcional)</FormLabel>
                                    <FormControl>
                                      <Textarea 
                                        placeholder="Información adicional para el pie de página"
                                        className="min-h-[80px]"
                                        {...field} 
                                      />
                                    </FormControl>
                                    <FormDescription>
                                      Información adicional que aparecerá en el pie de página
                                    </FormDescription>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </div>

                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                              <div className="flex items-start gap-3">
                                <Receipt className="h-5 w-5 text-blue-600 mt-0.5" />
                                <div>
                                  <h4 className="font-medium text-blue-800">Vista Previa de Cálculos</h4>
                                  <div className="text-sm text-blue-700 mt-2 space-y-1">
                                    <p>• Subtotal: $700.00</p>
                                    <p>• ITBIS ({invoiceForm.watch('itbisRate')}%): ${(700 * (invoiceForm.watch('itbisRate') / 100)).toFixed(2)}</p>
                                    <p>• <strong>Total: ${(700 * (1 + invoiceForm.watch('itbisRate') / 100)).toFixed(2)} DOP</strong></p>
                                  </div>
                                </div>
                              </div>
                            </div>

                            <Button type="submit" disabled={isLoading} className="w-full md:w-auto">
                              {isLoading ? (
                                <>
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  Guardando...
                                </>
                              ) : (
                                <>
                                  <Save className="mr-2 h-4 w-4" />
                                  Guardar Parámetros de Facturación
                                </>
                              )}
                            </Button>
                          </form>
                        </Form>
                      </CardContent>
                    </Card>
                  </TabsContent>
                </Tabs>
              )}
            </div>
          </div>
        </main>
      </div>
      <Footer />
    </div>
  );
}