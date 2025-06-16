
import { jsPDF } from 'jspdf';
import { Invoice, UserBranding, CompanyProfile } from '@/utils/supabaseDataManager';

interface PDFGeneratorProps {
  invoice: Invoice;
  branding?: UserBranding | null;
  companyProfile?: CompanyProfile | null;
  isPreview?: boolean;
}

interface TemplateSettings {
  showCompanyLogo?: boolean;
  showCompanyAddress?: boolean;
  showCompanyPhone?: boolean;
  showCompanyEmail?: boolean;
  showWebsite?: boolean;
  showTaxId?: boolean;
  headerBackgroundEnabled?: boolean;
  alternatingRowColors?: boolean;
  showFooter?: boolean;
  footerText?: string;
  invoiceNumberPrefix?: string;
  dateFormat?: string;
  currencySymbol?: string;
  fontSize?: string;
  lineSpacing?: string;
}

export const generateInvoicePDF = async ({ invoice, branding, companyProfile, isPreview = false }: PDFGeneratorProps) => {
  console.log('Generating PDF with company profile:', companyProfile);
  console.log('Branding data:', branding);
  
  // Parse template settings from branding data
  let templateSettings: TemplateSettings = {
    showCompanyLogo: true,
    showCompanyAddress: true,
    showCompanyPhone: true,
    showCompanyEmail: true,
    showWebsite: true,
    showTaxId: true,
    headerBackgroundEnabled: true,
    alternatingRowColors: true,
    showFooter: true,
    footerText: "Thank you for your business!",
    invoiceNumberPrefix: "INV-",
    dateFormat: "MM/DD/YYYY",
    currencySymbol: "₹",
    fontSize: "normal",
    lineSpacing: "normal"
  };

  if (branding?.template_settings) {
    try {
      const parsedSettings = JSON.parse(branding.template_settings);
      templateSettings = { ...templateSettings, ...parsedSettings };
    } catch (error) {
      console.error('Error parsing template settings:', error);
    }
  }
  
  const pdf = new jsPDF();
  const pageWidth = pdf.internal.pageSize.width;
  const pageHeight = pdf.internal.pageSize.height;
  
  // Colors
  const primaryColor = branding?.primary_color || '#2563EB';
  const secondaryColor = branding?.secondary_color || '#DC2626';
  const accentColor = '#F3F4F6';
  const textColor = '#111827';
  const mutedTextColor = '#6B7280';
  
  // Font size adjustments based on settings
  const baseFontSize = templateSettings.fontSize === 'small' ? 8 : 
                      templateSettings.fontSize === 'large' ? 12 : 10;
  const headerFontSize = baseFontSize + 16;
  const titleFontSize = baseFontSize + 6;
  const normalFontSize = baseFontSize + 2;
  
  // Line spacing adjustments
  const lineSpacing = templateSettings.lineSpacing === 'compact' ? 4 : 
                     templateSettings.lineSpacing === 'relaxed' ? 8 : 6;
  
  // Convert hex to RGB for jsPDF
  const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : { r: 37, g: 99, b: 235 };
  };
  
  const primaryRgb = hexToRgb(primaryColor);
  const secondaryRgb = hexToRgb(secondaryColor);
  const accentRgb = hexToRgb(accentColor);
  
  let yPos = 25;
  
  // Header decorative background (conditional)
  if (templateSettings.headerBackgroundEnabled) {
    pdf.setFillColor(primaryRgb.r, primaryRgb.g, primaryRgb.b);
    pdf.rect(0, 0, pageWidth, 45, 'F');
    
    // White decorative accent line
    pdf.setFillColor(255, 255, 255);
    pdf.rect(0, 42, pageWidth, 3, 'F');
  }
  
  // Company Name (Large, White or Dark based on header background)
  pdf.setFontSize(headerFontSize);
  if (templateSettings.headerBackgroundEnabled) {
    pdf.setTextColor(255, 255, 255);
  } else {
    pdf.setTextColor(primaryRgb.r, primaryRgb.g, primaryRgb.b);
  }
  const companyName = companyProfile?.company_name || 'Your Company';
  pdf.text(companyName, 20, 30);
  
  // INVOICE label (Right side)
  pdf.setFontSize(headerFontSize + 6);
  pdf.setFont('helvetica', 'bold');
  pdf.text('INVOICE', pageWidth - 20, 32, { align: 'right' });
  
  yPos = 60;
  
  // Company Information Card (conditional fields)
  if (companyProfile && (templateSettings.showCompanyAddress || templateSettings.showCompanyPhone || 
      templateSettings.showCompanyEmail || templateSettings.showWebsite)) {
    // Light background for company info
    pdf.setFillColor(accentRgb.r, accentRgb.g, accentRgb.b);
    pdf.roundedRect(20, yPos - 5, 100, 50, 3, 3, 'F');
    
    pdf.setFontSize(titleFontSize);
    pdf.setTextColor(primaryRgb.r, primaryRgb.g, primaryRgb.b);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Company Details', 25, yPos + 5);
    
    pdf.setFontSize(normalFontSize - 1);
    pdf.setTextColor(60, 60, 60);
    pdf.setFont('helvetica', 'normal');
    let companyYPos = yPos + 12;
    
    if (templateSettings.showCompanyAddress && companyProfile.company_address) {
      pdf.text(`📍 ${companyProfile.company_address}`, 25, companyYPos);
      companyYPos += lineSpacing;
    }
    
    if (templateSettings.showCompanyPhone && companyProfile.company_phone) {
      pdf.text(`📞 ${companyProfile.company_phone}`, 25, companyYPos);
      companyYPos += lineSpacing;
    }
    
    if (templateSettings.showCompanyEmail && companyProfile.company_email) {
      pdf.text(`✉️ ${companyProfile.company_email}`, 25, companyYPos);
      companyYPos += lineSpacing;
    }
    
    if (templateSettings.showWebsite && companyProfile.website) {
      pdf.text(`🌐 ${companyProfile.website}`, 25, companyYPos);
    }
  }
  
  // Invoice Details Card (Right side)
  pdf.setFillColor(250, 250, 250);
  pdf.roundedRect(pageWidth - 90, yPos - 5, 70, 40, 3, 3, 'F');
  
  pdf.setFontSize(titleFontSize);
  pdf.setTextColor(primaryRgb.r, primaryRgb.g, primaryRgb.b);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Invoice Details', pageWidth - 85, yPos + 5);
  
  pdf.setFontSize(normalFontSize - 1);
  pdf.setTextColor(60, 60, 60);
  pdf.setFont('helvetica', 'normal');
  let invoiceDetailsY = yPos + 12;
  
  // Format date based on settings
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    switch (templateSettings.dateFormat) {
      case 'DD/MM/YYYY':
        return date.toLocaleDateString('en-GB');
      case 'YYYY-MM-DD':
        return date.toISOString().split('T')[0];
      default:
        return date.toLocaleDateString('en-US');
    }
  };
  
  pdf.text(`Invoice #: ${templateSettings.invoiceNumberPrefix}${invoice.id.slice(-8)}`, pageWidth - 85, invoiceDetailsY);
  invoiceDetailsY += lineSpacing;
  pdf.text(`Date: ${formatDate(invoice.created_at)}`, pageWidth - 85, invoiceDetailsY);
  invoiceDetailsY += lineSpacing;
  
  if (templateSettings.showTaxId && companyProfile?.tax_id) {
    pdf.text(`Tax ID: ${companyProfile.tax_id}`, pageWidth - 85, invoiceDetailsY);
  }
  
  yPos += 65;
  
  // Bill To Section with decorative styling
  pdf.setFillColor(secondaryRgb.r, secondaryRgb.g, secondaryRgb.b);
  pdf.rect(20, yPos - 3, 60, 12, 'F');
  
  pdf.setFontSize(titleFontSize + 2);
  pdf.setTextColor(255, 255, 255);
  pdf.setFont('helvetica', 'bold');
  pdf.text('BILL TO', 25, yPos + 5);
  
  yPos += 20;
  pdf.setFontSize(titleFontSize);
  pdf.setTextColor(40, 40, 40);
  pdf.setFont('helvetica', 'bold');
  pdf.text(invoice.customer_name, 25, yPos);
  
  yPos += 8;
  pdf.setFontSize(normalFontSize);
  pdf.setTextColor(100, 100, 100);
  pdf.setFont('helvetica', 'normal');
  pdf.text(`Phone: ${invoice.customer_number}`, 25, yPos);
  
  yPos += 25;
  
  // Items Table with enhanced styling
  // Table header with gradient-like effect
  pdf.setFillColor(primaryRgb.r, primaryRgb.g, primaryRgb.b);
  pdf.rect(20, yPos - 8, pageWidth - 40, 15, 'F');
  
  // Add a subtle shadow effect
  pdf.setFillColor(0, 0, 0, 0.1);
  pdf.rect(21, yPos - 7, pageWidth - 40, 15, 'F');
  
  pdf.setFontSize(normalFontSize + 1);
  pdf.setTextColor(255, 255, 255);
  pdf.setFont('helvetica', 'bold');
  pdf.text('ITEM DESCRIPTION', 25, yPos);
  pdf.text('QTY', pageWidth - 120, yPos, { align: 'center' });
  pdf.text('PRICE', pageWidth - 80, yPos, { align: 'center' });
  pdf.text('TOTAL', pageWidth - 35, yPos, { align: 'right' });
  
  yPos += 12;
  
  // Items with alternating row colors (conditional)
  pdf.setFont('helvetica', 'normal');
  invoice.items.forEach((item, index) => {
    if (yPos > pageHeight - 80) {
      pdf.addPage();
      yPos = 30;
    }
    
    // Alternating row backgrounds (conditional)
    if (templateSettings.alternatingRowColors && index % 2 === 0) {
      pdf.setFillColor(248, 250, 252);
      pdf.rect(20, yPos - 4, pageWidth - 40, 12, 'F');
    }
    
    pdf.setFontSize(normalFontSize);
    pdf.setTextColor(40, 40, 40);
    pdf.text(item.name, 25, yPos + 2);
    pdf.text(item.quantity.toString(), pageWidth - 120, yPos + 2, { align: 'center' });
    pdf.text(`${templateSettings.currencySymbol}${item.price.toFixed(2)}`, pageWidth - 80, yPos + 2, { align: 'center' });
    pdf.text(`${templateSettings.currencySymbol}${item.total.toFixed(2)}`, pageWidth - 35, yPos + 2, { align: 'right' });
    
    yPos += 12;
  });
  
  yPos += 15;
  
  // Totals section with enhanced styling
  const totalsX = pageWidth - 120;
  const totalsWidth = 100;
  
  // Background for totals
  pdf.setFillColor(250, 250, 250);
  pdf.roundedRect(totalsX - 10, yPos - 5, totalsWidth, 45, 5, 5, 'F');
  
  // Subtotal
  pdf.setFontSize(normalFontSize + 1);
  pdf.setTextColor(100, 100, 100);
  pdf.text('Subtotal:', totalsX, yPos + 5);
  pdf.text(`${templateSettings.currencySymbol}${invoice.subtotal.toFixed(2)}`, pageWidth - 25, yPos + 5, { align: 'right' });
  yPos += 10;
  
  // Discount
  if (invoice.discount > 0) {
    pdf.setTextColor(secondaryRgb.r, secondaryRgb.g, secondaryRgb.b);
    pdf.text(`Discount (${invoice.discount}%):`, totalsX, yPos + 5);
    pdf.text(`-${templateSettings.currencySymbol}${(invoice.subtotal * invoice.discount / 100).toFixed(2)}`, pageWidth - 25, yPos + 5, { align: 'right' });
    yPos += 10;
  }
  
  // Divider line
  pdf.setDrawColor(200, 200, 200);
  pdf.line(totalsX, yPos + 5, pageWidth - 25, yPos + 5);
  yPos += 8;
  
  // Total with emphasis
  pdf.setFontSize(titleFontSize + 2);
  pdf.setTextColor(primaryRgb.r, primaryRgb.g, primaryRgb.b);
  pdf.setFont('helvetica', 'bold');
  pdf.text('TOTAL:', totalsX, yPos + 5);
  pdf.text(`${templateSettings.currencySymbol}${invoice.total.toFixed(2)}`, pageWidth - 25, yPos + 5, { align: 'right' });
  
  // Footer with decorative elements (conditional)
  if (templateSettings.showFooter) {
    const footerY = pageHeight - 25;
    
    // Footer background
    pdf.setFillColor(248, 250, 252);
    pdf.rect(0, footerY - 10, pageWidth, 35, 'F');
    
    pdf.setFontSize(normalFontSize - 2);
    pdf.setTextColor(120, 120, 120);
    pdf.setFont('helvetica', 'italic');
    
    let footerText = templateSettings.footerText || 'Thank you for your business!';
    
    if (templateSettings.showWebsite && companyProfile?.website) {
      footerText += ` Visit: ${companyProfile.website}`;
    }
    if (templateSettings.showCompanyEmail && companyProfile?.company_email) {
      footerText += ` Contact: ${companyProfile.company_email}`;
    }
    
    pdf.text(footerText, pageWidth / 2, footerY, { align: 'center' });
    
    // Decorative footer line
    pdf.setDrawColor(primaryRgb.r, primaryRgb.g, primaryRgb.b);
    pdf.setLineWidth(2);
    pdf.line(20, footerY + 8, pageWidth - 20, footerY + 8);
  }
  
  // Save the PDF
  const fileName = isPreview ? 
    `invoice-preview-${Date.now()}.pdf` : 
    `invoice-${templateSettings.invoiceNumberPrefix}${invoice.id.slice(-8)}.pdf`;
  
  pdf.save(fileName);
};

export default generateInvoicePDF;
