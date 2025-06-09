import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { format } from "date-fns";
import { es } from "date-fns/locale";

export interface InvoiceData {
  resident: {
    id: number;
    name: string;
    lastName: string;
    cedula: string;
    noRegistro: string;
    phone: string;
    address: string;
  };
  payments: Array<{
    month: number;
    year: number;
    amount: number;
    status: string;
    dueDate: Date;
  }>;
  invoiceNumber: string;
  ncf: string;
  issueDate: Date;
}

export interface CompanyInfo {
  name: string;
  rnc: string;
  address: string;
  phone: string;
  email: string;
  website?: string;
}

export class DGIInvoiceGenerator {
  private doc: jsPDF;
  private companyInfo: CompanyInfo;

  constructor(companyInfo: CompanyInfo) {
    this.doc = new jsPDF();
    this.companyInfo = companyInfo;
  }

  generateInvoice(data: InvoiceData): jsPDF {
    this.doc = new jsPDF();
    
    // Header con información de la empresa
    this.addCompanyHeader();
    
    // Información fiscal (NCF, RNC, etc.)
    this.addFiscalInfo(data);
    
    // Información del cliente
    this.addClientInfo(data.resident);
    
    // Detalles de los servicios/pagos
    this.addPaymentDetails(data.payments);
    
    // Totales y cálculos fiscales
    this.addTotalsSection(data.payments);
    
    // Footer con información legal
    this.addLegalFooter();
    
    return this.doc;
  }

  private addCompanyHeader(): void {
    const doc = this.doc;
    
    // Logo placeholder (se puede agregar logo real después)
    doc.setFillColor(41, 128, 185);
    doc.rect(20, 15, 30, 20, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(12);
    doc.text('LOGO', 35, 27, { align: 'center' });
    
    // Información de la empresa
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text(this.companyInfo.name.toUpperCase(), 55, 20);
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`RNC: ${this.companyInfo.rnc}`, 55, 27);
    doc.text(this.companyInfo.address, 55, 32);
    doc.text(`Tel: ${this.companyInfo.phone}`, 55, 37);
    if (this.companyInfo.email) {
      doc.text(`Email: ${this.companyInfo.email}`, 55, 42);
    }
    
    // Línea separadora
    doc.setLineWidth(0.5);
    doc.line(20, 50, 190, 50);
  }

  private addFiscalInfo(data: InvoiceData): void {
    const doc = this.doc;
    
    // Título del documento
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('FACTURA DE CONSUMO', 105, 65, { align: 'center' });
    
    // Marco para información fiscal
    doc.setLineWidth(1);
    doc.rect(130, 75, 60, 35);
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('INFORMACIÓN FISCAL', 160, 82, { align: 'center' });
    
    doc.setFont('helvetica', 'normal');
    doc.text(`Factura No: ${data.invoiceNumber}`, 135, 88);
    doc.text(`NCF: ${data.ncf}`, 135, 93);
    doc.text(`Fecha: ${format(data.issueDate, 'dd/MM/yyyy')}`, 135, 98);
    doc.text(`Vence: ${format(new Date(data.issueDate.getTime() + 30 * 24 * 60 * 60 * 1000), 'dd/MM/yyyy')}`, 135, 103);
  }

  private addClientInfo(resident: InvoiceData['resident']): void {
    const doc = this.doc;
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('DATOS DEL CLIENTE:', 20, 85);
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Nombre: ${resident.name} ${resident.lastName}`, 20, 92);
    doc.text(`Cédula/RNC: ${resident.cedula}`, 20, 97);
    doc.text(`Dirección: ${resident.address}`, 20, 102);
    doc.text(`Teléfono: ${resident.phone}`, 20, 107);
    doc.text(`No. Registro: ${resident.noRegistro}`, 20, 112);
  }

  private addPaymentDetails(payments: InvoiceData['payments']): void {
    const doc = this.doc;
    
    // Preparar datos para la tabla
    const tableData = payments.map((payment, index) => {
      const periodName = format(new Date(payment.year, payment.month - 1), 'MMMM yyyy', { locale: es });
      const unitPrice = payment.amount;
      const quantity = 1;
      const subtotal = unitPrice * quantity;
      const itbis = subtotal * 0.18; // 18% ITBIS
      const total = subtotal + itbis;
      
      return [
        (index + 1).toString(),
        `Cuota de mantenimiento - ${periodName}`,
        quantity.toString(),
        `$${unitPrice.toFixed(2)}`,
        `$${subtotal.toFixed(2)}`,
        `$${itbis.toFixed(2)}`,
        `$${total.toFixed(2)}`
      ];
    });

    // Tabla de detalles
    autoTable(doc, {
      startY: 125,
      head: [['#', 'Descripción', 'Cant.', 'Precio Unit.', 'Subtotal', 'ITBIS (18%)', 'Total']],
      body: tableData,
      theme: 'grid',
      styles: { 
        fontSize: 9,
        cellPadding: 3
      },
      headStyles: { 
        fillColor: [41, 128, 185],
        textColor: 255,
        fontStyle: 'bold'
      },
      columnStyles: {
        0: { halign: 'center', cellWidth: 15 },
        1: { cellWidth: 70 },
        2: { halign: 'center', cellWidth: 20 },
        3: { halign: 'right', cellWidth: 25 },
        4: { halign: 'right', cellWidth: 25 },
        5: { halign: 'right', cellWidth: 25 },
        6: { halign: 'right', cellWidth: 25 }
      }
    });
  }

  private addTotalsSection(payments: InvoiceData['payments']): void {
    const doc = this.doc;
    const finalY = (doc as any).lastAutoTable.finalY + 10;
    
    // Calcular totales
    const subtotal = payments.reduce((sum, payment) => sum + payment.amount, 0);
    const itbis = subtotal * 0.18;
    const total = subtotal + itbis;
    
    // Marco para totales
    const startX = 130;
    const startY = finalY;
    const boxWidth = 60;
    const boxHeight = 35;
    
    doc.setLineWidth(0.5);
    doc.rect(startX, startY, boxWidth, boxHeight);
    
    // Líneas internas
    doc.line(startX, startY + 8, startX + boxWidth, startY + 8);
    doc.line(startX, startY + 16, startX + boxWidth, startY + 16);
    doc.line(startX, startY + 24, startX + boxWidth, startY + 24);
    doc.line(startX + 35, startY, startX + 35, startY + boxHeight);
    
    // Etiquetas
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Subtotal:', startX + 2, startY + 6);
    doc.text('ITBIS (18%):', startX + 2, startY + 14);
    doc.text('Descuento:', startX + 2, startY + 22);
    
    doc.setFont('helvetica', 'bold');
    doc.text('TOTAL:', startX + 2, startY + 30);
    
    // Valores
    doc.setFont('helvetica', 'normal');
    doc.text(`$${subtotal.toFixed(2)}`, startX + 55, startY + 6, { align: 'right' });
    doc.text(`$${itbis.toFixed(2)}`, startX + 55, startY + 14, { align: 'right' });
    doc.text('$0.00', startX + 55, startY + 22, { align: 'right' });
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text(`$${total.toFixed(2)}`, startX + 55, startY + 30, { align: 'right' });
    
    // Total en letras
    const totalInWords = this.numberToWords(total);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Son: ${totalInWords} pesos dominicanos`, 20, finalY + 45);
  }

  private addLegalFooter(): void {
    const doc = this.doc;
    const pageHeight = doc.internal.pageSize.height;
    
    // Línea separadora
    doc.setLineWidth(0.5);
    doc.line(20, pageHeight - 40, 190, pageHeight - 40);
    
    // Información legal
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text('TÉRMINOS Y CONDICIONES:', 20, pageHeight - 35);
    doc.text('• Esta factura debe ser pagada dentro de los primeros 5 días del mes.', 20, pageHeight - 31);
    doc.text('• Los pagos realizados después del vencimiento generarán intereses moratorios.', 20, pageHeight - 27);
    doc.text('• Para cualquier consulta, comuníquese al teléfono indicado en el encabezado.', 20, pageHeight - 23);
    
    // Información fiscal adicional
    doc.setFont('helvetica', 'bold');
    doc.text('AUTORIZACIÓN DGI:', 20, pageHeight - 17);
    doc.setFont('helvetica', 'normal');
    doc.text('Resolución General No. 06-2018 de fecha 08 de febrero de 2018', 20, pageHeight - 13);
    doc.text('Válida hasta: 31/12/2024', 20, pageHeight - 9);
    
    // Código QR placeholder
    doc.setFillColor(200, 200, 200);
    doc.rect(160, pageHeight - 35, 25, 25, 'F');
    doc.setTextColor(100, 100, 100);
    doc.setFontSize(8);
    doc.text('QR CODE', 172.5, pageHeight - 20, { align: 'center' });
    
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(7);
    doc.text('Escanea para verificar', 172.5, pageHeight - 8, { align: 'center' });
  }

  private numberToWords(num: number): string {
    const units = ['', 'uno', 'dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete', 'ocho', 'nueve'];
    const teens = ['diez', 'once', 'doce', 'trece', 'catorce', 'quince', 'dieciséis', 'diecisiete', 'dieciocho', 'diecinueve'];
    const tens = ['', '', 'veinte', 'treinta', 'cuarenta', 'cincuenta', 'sesenta', 'setenta', 'ochenta', 'noventa'];
    const hundreds = ['', 'ciento', 'doscientos', 'trescientos', 'cuatrocientos', 'quinientos', 'seiscientos', 'setecientos', 'ochocientos', 'novecientos'];
    
    if (num === 0) return 'cero';
    if (num === 100) return 'cien';
    
    let result = '';
    const integerPart = Math.floor(num);
    const decimalPart = Math.round((num - integerPart) * 100);
    
    // Convertir parte entera
    if (integerPart >= 1000) {
      const thousands = Math.floor(integerPart / 1000);
      if (thousands === 1) {
        result += 'mil ';
      } else {
        result += this.convertHundreds(thousands) + ' mil ';
      }
    }
    
    const remainder = integerPart % 1000;
    if (remainder > 0) {
      result += this.convertHundreds(remainder);
    }
    
    // Agregar centavos si existen
    if (decimalPart > 0) {
      result += ` con ${decimalPart}/100`;
    }
    
    return result.trim();
  }
  
  private convertHundreds(num: number): string {
    const units = ['', 'uno', 'dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete', 'ocho', 'nueve'];
    const teens = ['diez', 'once', 'doce', 'trece', 'catorce', 'quince', 'dieciséis', 'diecisiete', 'dieciocho', 'diecinueve'];
    const tens = ['', '', 'veinte', 'treinta', 'cuarenta', 'cincuenta', 'sesenta', 'setenta', 'ochenta', 'noventa'];
    const hundreds = ['', 'ciento', 'doscientos', 'trescientos', 'cuatrocientos', 'quinientos', 'seiscientos', 'setecientos', 'ochocientos', 'novecientos'];
    
    let result = '';
    
    const h = Math.floor(num / 100);
    const remainder = num % 100;
    
    if (h > 0) {
      if (num === 100) {
        result += 'cien';
      } else {
        result += hundreds[h] + ' ';
      }
    }
    
    if (remainder >= 20) {
      const t = Math.floor(remainder / 10);
      const u = remainder % 10;
      result += tens[t];
      if (u > 0) {
        result += ' y ' + units[u];
      }
    } else if (remainder >= 10) {
      result += teens[remainder - 10];
    } else if (remainder > 0) {
      result += units[remainder];
    }
    
    return result.trim();
  }

  static generateNCF(): string {
    // Generar NCF según formato DGI: B01XXXXXXXX
    const prefix = 'B01'; // Factura de consumo
    const sequence = Math.floor(Math.random() * 100000000).toString().padStart(8, '0');
    return prefix + sequence;
  }

  static generateInvoiceNumber(): string {
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const sequence = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `FAC-${year}${month}-${sequence}`;
  }
}

// Información por defecto de la empresa (se puede configurar)
export const DEFAULT_COMPANY_INFO: CompanyInfo = {
  name: "Administración Residencial Los Jardines",
  rnc: "1-31-12345-6", // RNC de ejemplo
  address: "Av. Principal #123, Santo Domingo, República Dominicana",
  phone: "(809) 555-0123",
  email: "admin@residenciallosjardines.com",
  website: "www.residenciallosjardines.com"
};