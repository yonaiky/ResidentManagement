import { prisma } from '@/lib/prisma';

export interface CompanyInfoData {
  name: string;
  rnc: string;
  address: string;
  phone: string;
  email: string;
  website?: string;
}

export interface FiscalConfigData {
  businessName?: string;
  ruc?: string;
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
  logoPath?: string;
  resolutionNumber: string;
  resolutionDate: string;
  validUntil: string;
  ncfSeries: string;
  currentSequence: number;
  maxSequence: number;
  itbisRate?: number;
  latePaymentInterest?: number;
  paymentTerms?: string;
  footerNotes?: string;
}

export interface InvoiceConfigData {
  paymentTerms: string;
  latePaymentInterest: number;
  itbisRate: number;
  footerNotes?: string;
}

export const settingsService = {
  // Company Info
  async getCompanyInfo() {
    try {
      const companyInfo = await prisma.companyInfo.findFirst();
      return companyInfo;
    } catch (error) {
      console.error('Error getting company info:', error);
      throw error;
    }
  },

  async updateCompanyInfo(data: CompanyInfoData) {
    try {
      const existing = await prisma.companyInfo.findFirst();
      
      if (existing) {
        return prisma.companyInfo.update({
          where: { id: existing.id },
          data
        });
      }

      return prisma.companyInfo.create({ data });
    } catch (error) {
      console.error('Error updating company info:', error);
      throw error;
    }
  },

  // Fiscal Config
  async getFiscalConfig() {
    try {
      const fiscalConfig = await prisma.fiscalConfig.findFirst();
      return fiscalConfig;
    } catch (error) {
      console.error('Error getting fiscal config:', error);
      throw error;
    }
  },

  async updateFiscalConfig(data: FiscalConfigData) {
    try {
      const existing = await prisma.fiscalConfig.findFirst();
      
      // Ensure all required fields are present with default values
      const fiscalData = {
        businessName: data.businessName || '',
        ruc: data.ruc || '',
        address: data.address || '',
        phone: data.phone || '',
        email: data.email || '',
        website: data.website,
        logoPath: data.logoPath,
        resolutionNumber: data.resolutionNumber,
        resolutionDate: new Date(data.resolutionDate),
        validUntil: new Date(data.validUntil),
        ncfSeries: data.ncfSeries,
        currentSequence: data.currentSequence,
        maxSequence: data.maxSequence,
        itbisRate: data.itbisRate || 0,
        latePaymentInterest: data.latePaymentInterest || 0,
        paymentTerms: data.paymentTerms || '',
        footerNotes: data.footerNotes
      };
      
      if (existing) {
        return prisma.fiscalConfig.update({
          where: { id: existing.id },
          data: fiscalData
        });
      }

      return prisma.fiscalConfig.create({
        data: fiscalData
      });
    } catch (error) {
      console.error('Error updating fiscal config:', error);
      throw error;
    }
  },

  // Invoice Config
  async getInvoiceConfig() {
    try {
      const invoiceConfig = await prisma.invoiceConfig.findFirst();
      return invoiceConfig;
    } catch (error) {
      console.error('Error getting invoice config:', error);
      throw error;
    }
  },

  async updateInvoiceConfig(data: InvoiceConfigData) {
    try {
      const existing = await prisma.invoiceConfig.findFirst();
      
      if (existing) {
        return prisma.invoiceConfig.update({
          where: { id: existing.id },
          data
        });
      }

      return prisma.invoiceConfig.create({ data });
    } catch (error) {
      console.error('Error updating invoice config:', error);
      throw error;
    }
  }
}; 