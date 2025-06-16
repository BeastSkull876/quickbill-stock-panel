import { jsPDF } from 'jspdf';
import { Invoice, UserBranding, CompanyProfile } from '@/utils/supabaseDataManager';

interface PDFGeneratorProps {
  invoice: Invoice;
  branding?: UserBranding | null;
  companyProfile?: CompanyProfile | null;
}

export const generateInvoicePDF = async ({ invoice, branding, companyProfile }: PDFGeneratorProps) => {
  console.log('Generating PDF with company profile:', companyProfile);
  console.log('Branding data:', branding);
  
  const pdf = new jsPDF();
  const pageWidth = pdf.internal.pageSize.width;
  const pageHeight = pdf.internal.pageSize.height;
  
  // Colors
  const primaryColor = branding?.primary_color || '#000000';
  const lightGrayColor = '#F5F5F5';
  const darkGrayColor = '#666666';
  
  // Convert hex to RGB for jsPDF
  const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : { r: 0, g: 0, b: 0 };
  };
  
  const primaryRgb = hexToRgb(primaryColor);
  const lightGrayRgb = hexToRgb(lightGrayColor);
  const darkGrayRgb = hexToRgb(darkGrayColor);
  
  let yPos = 30;
  
  // Header - INVOICE title with icon placeholder
  pdf.setFontSize(36);
  pdf.setTextColor(primaryRgb.r, primaryRgb.g, primaryRgb.b);
  pdf.text('INVOICE', 20, yPos);
  
  // Invoice icon placeholder (you could add an actual icon here)
  pdf.setFontSize(12);
  pdf.text('📄', pageWidth - 30, yPos - 10);
  
  yPos += 20;
  
  // Invoice details section
  pdf.setFontSize(10);
  pdf.setTextColor(darkGrayRgb.r, darkGrayRgb.g, darkGrayRgb.b);
  
  // Left column - Invoice details
  pdf.text('Invoice number', 20, yPos);
  pdf.text('Date of issue', 20, yPos + 10);
  
  pdf.setTextColor(0, 0, 0);
  pdf.text(`INV-${invoice.id.slice(-8)}`, 20, yPos + 5);
  pdf.text(new Date(invoice.created_at).toLocaleDateString('en-GB'), 20, yPos + 15);
  
  // Right column - Company details
  pdf.setTextColor(darkGrayRgb.r, darkGrayRgb.g, darkGrayRgb.b);
  pdf.text('Your company name', pageWidth - 80, yPos);
  
  pdf.setTextColor(0, 0, 0);
  const companyName = companyProfile?.company_name || 'Your Company';
  pdf.text(companyName, pageWidth - 80, yPos + 5);
  
  if (companyProfile?.company_address) {
    pdf.text(companyProfile.company_address, pageWidth - 80, yPos + 10);
  }
  
  if (companyProfile?.company_phone) {
    pdf.text(companyProfile.company_phone, pageWidth - 80, yPos + 15);
  }
  
  if (companyProfile?.company_email) {
    pdf.text(companyProfile.company_email, pageWidth - 80, yPos + 20);
  }
  
  if (companyProfile?.website) {
    pdf.text(companyProfile.website, pageWidth - 80, yPos + 25);
  }
  
  yPos += 50;
  
  // Billed to section
  pdf.setFontSize(10);
  pdf.setTextColor(darkGrayRgb.r, darkGrayRgb.g, darkGrayRgb.b);
  pdf.text('Billed to', 20, yPos);
  
  yPos += 8;
  pdf.setTextColor(0, 0, 0);
  pdf.text(invoice.customer_name, 20, yPos);
  pdf.text(invoice.customer_number, 20, yPos + 5);
  
  yPos += 25;
  
  // Table header with light green background
  pdf.setFillColor(lightGrayRgb.r, lightGrayRgb.g, lightGrayRgb.b);
  pdf.rect(20, yPos - 5, pageWidth - 40, 12, 'F');
  
  pdf.setFontSize(10);
  pdf.setTextColor(0, 0, 0);
  pdf.text('Description', 25, yPos);
  pdf.text('Unit cost', pageWidth - 120, yPos);
  pdf.text('Qty/HR rate', pageWidth - 80, yPos);
  pdf.text('Amount', pageWidth - 30, yPos, { align: 'right' });
  
  yPos += 15;
  
  // Items
  pdf.setTextColor(0, 0, 0);
  invoice.items.forEach((item) => {
    if (yPos > pageHeight - 80) {
      pdf.addPage();
      yPos = 20;
    }
    
    pdf.text(item.name, 25, yPos);
    pdf.text(`₹${item.price.toFixed(2)}`, pageWidth - 120, yPos);
    pdf.text(item.quantity.toString(), pageWidth - 80, yPos);
    pdf.text(`₹${item.total.toFixed(2)}`, pageWidth - 30, yPos, { align: 'right' });
    
    yPos += 8;
  });
  
  yPos += 10;
  
  // Horizontal line before totals
  pdf.setDrawColor(200, 200, 200);
  pdf.line(20, yPos, pageWidth - 20, yPos);
  
  yPos += 15;
  
  // Totals section - right aligned
  const totalsX = pageWidth - 100;
  
  // Subtotal
  pdf.setTextColor(0, 0, 0);
  pdf.text('Subtotal', totalsX, yPos);
  pdf.text(`₹${invoice.subtotal.toFixed(2)}`, pageWidth - 30, yPos, { align: 'right' });
  yPos += 8;
  
  // Discount
  if (invoice.discount > 0) {
    pdf.text('Discount', totalsX, yPos);
    pdf.text(`₹${(invoice.subtotal * invoice.discount / 100).toFixed(2)}`, pageWidth - 30, yPos, { align: 'right' });
    yPos += 8;
  }
  
  // Tax rate and Tax (keeping it simple with 0% for now)
  pdf.text('(Tax rate)', totalsX, yPos);
  pdf.text('0%', pageWidth - 30, yPos, { align: 'right' });
  yPos += 8;
  
  pdf.text('Tax', totalsX, yPos);
  pdf.text('₹0', pageWidth - 30, yPos, { align: 'right' });
  yPos += 15;
  
  // Invoice total with dark background
  pdf.setFillColor(100, 100, 100);
  pdf.rect(totalsX - 10, yPos - 8, 80, 15, 'F');
  
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(12);
  pdf.text('Invoice total', totalsX - 5, yPos);
  pdf.text(`₹${invoice.total.toFixed(2)}`, pageWidth - 35, yPos, { align: 'right' });
  
  yPos += 25;
  
  // Terms section
  pdf.setFontSize(10);
  pdf.setTextColor(0, 0, 0);
  pdf.text('Terms', 20, yPos);
  yPos += 8;
  pdf.setTextColor(darkGrayRgb.r, darkGrayRgb.g, darkGrayRgb.b);
  pdf.text(`E.g. Please pay invoice by ${new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('en-GB')}`, 20, yPos);
  
  // Footer with branding
  const footerY = pageHeight - 20;
  pdf.setFontSize(8);
  pdf.setTextColor(100, 100, 100);
  
  if (companyProfile?.website) {
    pdf.text(`Visit us: ${companyProfile.website}`, 20, footerY);
  }
  
  if (companyProfile?.company_email) {
    pdf.text(`Contact: ${companyProfile.company_email}`, pageWidth - 80, footerY);
  }
  
  // Save the PDF
  pdf.save(`invoice-${invoice.id.slice(-8)}.pdf`);
};

export default generateInvoicePDF;
