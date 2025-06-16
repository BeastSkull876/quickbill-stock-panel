
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
  const primaryColor = branding?.primary_color || '#3B82F6';
  const secondaryColor = branding?.secondary_color || '#EF4444';
  const textColor = '#1F2937';
  const grayColor = '#6B7280';
  
  // Convert hex to RGB for jsPDF
  const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : { r: 59, g: 130, b: 246 };
  };
  
  const primaryRgb = hexToRgb(primaryColor);
  const secondaryRgb = hexToRgb(secondaryColor);
  
  let yPos = 20;
  
  // Header with company logo and info
  if (branding?.logo_url) {
    try {
      // In a real implementation, you'd need to load and convert the image
      // For now, we'll just leave space for it
      yPos += 15;
    } catch (error) {
      console.log('Could not load logo');
    }
  }
  
  // Company Name and Invoice Title
  pdf.setFontSize(24);
  pdf.setTextColor(primaryRgb.r, primaryRgb.g, primaryRgb.b);
  const companyName = companyProfile?.company_name || 'Your Company';
  console.log('Using company name:', companyName);
  pdf.text(companyName, 20, yPos);
  
  pdf.setFontSize(28);
  pdf.text('INVOICE', pageWidth - 20, yPos, { align: 'right' });
  
  yPos += 15;
  
  // Company details - Enhanced with all available information
  pdf.setFontSize(10);
  pdf.setTextColor(100, 100, 100);
  
  if (companyProfile?.company_address) {
    console.log('Adding company address:', companyProfile.company_address);
    pdf.text(companyProfile.company_address, 20, yPos);
    yPos += 5;
  }
  
  if (companyProfile?.company_phone) {
    console.log('Adding company phone:', companyProfile.company_phone);
    pdf.text(`Phone: ${companyProfile.company_phone}`, 20, yPos);
    yPos += 5;
  }
  
  if (companyProfile?.company_email) {
    console.log('Adding company email:', companyProfile.company_email);
    pdf.text(`Email: ${companyProfile.company_email}`, 20, yPos);
    yPos += 5;
  }
  
  if (companyProfile?.website) {
    console.log('Adding website:', companyProfile.website);
    pdf.text(`Website: ${companyProfile.website}`, 20, yPos);
    yPos += 5;
  }
  
  if (companyProfile?.tax_id) {
    console.log('Adding tax ID:', companyProfile.tax_id);
    pdf.text(`Tax ID: ${companyProfile.tax_id}`, 20, yPos);
    yPos += 5;
  }
  
  // Invoice details (right side)
  let rightYPos = yPos - 25;
  pdf.setTextColor(60, 60, 60);
  pdf.text(`Invoice #: INV-${invoice.id.slice(-8)}`, pageWidth - 20, rightYPos, { align: 'right' });
  rightYPos += 7;
  pdf.text(`Date: ${new Date(invoice.created_at).toLocaleDateString()}`, pageWidth - 20, rightYPos, { align: 'right' });
  rightYPos += 7;
  
  yPos += 20;
  
  // Bill To section
  pdf.setFontSize(12);
  pdf.setTextColor(secondaryRgb.r, secondaryRgb.g, secondaryRgb.b);
  pdf.text('Bill To:', 20, yPos);
  
  yPos += 8;
  pdf.setFontSize(11);
  pdf.setTextColor(60, 60, 60);
  pdf.text(invoice.customer_name, 20, yPos);
  yPos += 6;
  pdf.text(`Phone: ${invoice.customer_number}`, 20, yPos);
  
  yPos += 20;
  
  // Items table header
  pdf.setFillColor(245, 245, 245);
  pdf.rect(20, yPos - 5, pageWidth - 40, 12, 'F');
  
  pdf.setFontSize(10);
  pdf.setTextColor(60, 60, 60);
  pdf.text('Item', 25, yPos);
  pdf.text('Qty', pageWidth - 120, yPos);
  pdf.text('Price', pageWidth - 80, yPos);
  pdf.text('Total', pageWidth - 40, yPos, { align: 'right' });
  
  yPos += 10;
  
  // Items
  pdf.setTextColor(40, 40, 40);
  invoice.items.forEach((item) => {
    if (yPos > pageHeight - 50) {
      pdf.addPage();
      yPos = 20;
    }
    
    pdf.text(item.name, 25, yPos);
    pdf.text(item.quantity.toString(), pageWidth - 120, yPos);
    pdf.text(`₹${item.price.toFixed(2)}`, pageWidth - 80, yPos);
    pdf.text(`₹${item.total.toFixed(2)}`, pageWidth - 25, yPos, { align: 'right' });
    
    yPos += 8;
  });
  
  yPos += 10;
  
  // Totals section
  const totalsX = pageWidth - 100;
  
  // Subtotal
  pdf.setTextColor(60, 60, 60);
  pdf.text('Subtotal:', totalsX, yPos);
  pdf.text(`₹${invoice.subtotal.toFixed(2)}`, pageWidth - 25, yPos, { align: 'right' });
  yPos += 8;
  
  // Discount
  if (invoice.discount > 0) {
    pdf.text(`Discount (${invoice.discount}%):`, totalsX, yPos);
    pdf.text(`-₹${(invoice.subtotal * invoice.discount / 100).toFixed(2)}`, pageWidth - 25, yPos, { align: 'right' });
    yPos += 8;
  }
  
  // Total
  pdf.setFontSize(12);
  pdf.setTextColor(primaryRgb.r, primaryRgb.g, primaryRgb.b);
  pdf.text('Total:', totalsX, yPos);
  pdf.text(`₹${invoice.total.toFixed(2)}`, pageWidth - 25, yPos, { align: 'right' });
  
  // Footer with additional company info
  yPos = pageHeight - 30;
  pdf.setFontSize(8);
  pdf.setTextColor(120, 120, 120);
  
  if (companyProfile?.website) {
    pdf.text(`Visit us: ${companyProfile.website}`, 20, yPos);
    yPos += 5;
  }
  
  if (companyProfile?.company_email) {
    pdf.text(`Contact: ${companyProfile.company_email}`, 20, yPos);
  }
  
  // Save the PDF
  pdf.save(`invoice-${invoice.id.slice(-8)}.pdf`);
};

export default generateInvoicePDF;
