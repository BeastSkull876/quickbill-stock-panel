
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
  const primaryColor = branding?.primary_color || '#2563EB';
  const secondaryColor = branding?.secondary_color || '#DC2626';
  const accentColor = '#F3F4F6';
  const textColor = '#111827';
  const mutedTextColor = '#6B7280';
  
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
  
  // Header decorative background
  pdf.setFillColor(primaryRgb.r, primaryRgb.g, primaryRgb.b);
  pdf.rect(0, 0, pageWidth, 45, 'F');
  
  // White decorative accent line
  pdf.setFillColor(255, 255, 255);
  pdf.rect(0, 42, pageWidth, 3, 'F');
  
  // Company Name (Large, White)
  pdf.setFontSize(26);
  pdf.setTextColor(255, 255, 255);
  const companyName = companyProfile?.company_name || 'Your Company';
  pdf.text(companyName, 20, 30);
  
  // INVOICE label (Right side, White)
  pdf.setFontSize(32);
  pdf.setFont('helvetica', 'bold');
  pdf.text('INVOICE', pageWidth - 20, 32, { align: 'right' });
  
  yPos = 60;
  
  // Company Information Card
  if (companyProfile) {
    // Light background for company info
    pdf.setFillColor(accentRgb.r, accentRgb.g, accentRgb.b);
    pdf.roundedRect(20, yPos - 5, 100, 50, 3, 3, 'F');
    
    pdf.setFontSize(12);
    pdf.setTextColor(primaryRgb.r, primaryRgb.g, primaryRgb.b);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Company Details', 25, yPos + 5);
    
    pdf.setFontSize(9);
    pdf.setTextColor(60, 60, 60);
    pdf.setFont('helvetica', 'normal');
    let companyYPos = yPos + 12;
    
    if (companyProfile.company_address) {
      pdf.text(`📍 ${companyProfile.company_address}`, 25, companyYPos);
      companyYPos += 6;
    }
    
    if (companyProfile.company_phone) {
      pdf.text(`📞 ${companyProfile.company_phone}`, 25, companyYPos);
      companyYPos += 6;
    }
    
    if (companyProfile.company_email) {
      pdf.text(`✉️ ${companyProfile.company_email}`, 25, companyYPos);
      companyYPos += 6;
    }
    
    if (companyProfile.website) {
      pdf.text(`🌐 ${companyProfile.website}`, 25, companyYPos);
    }
  }
  
  // Invoice Details Card (Right side)
  pdf.setFillColor(250, 250, 250);
  pdf.roundedRect(pageWidth - 90, yPos - 5, 70, 40, 3, 3, 'F');
  
  pdf.setFontSize(12);
  pdf.setTextColor(primaryRgb.r, primaryRgb.g, primaryRgb.b);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Invoice Details', pageWidth - 85, yPos + 5);
  
  pdf.setFontSize(9);
  pdf.setTextColor(60, 60, 60);
  pdf.setFont('helvetica', 'normal');
  let invoiceDetailsY = yPos + 12;
  
  pdf.text(`Invoice #: INV-${invoice.id.slice(-8)}`, pageWidth - 85, invoiceDetailsY);
  invoiceDetailsY += 6;
  pdf.text(`Date: ${new Date(invoice.created_at).toLocaleDateString()}`, pageWidth - 85, invoiceDetailsY);
  invoiceDetailsY += 6;
  
  if (companyProfile?.tax_id) {
    pdf.text(`Tax ID: ${companyProfile.tax_id}`, pageWidth - 85, invoiceDetailsY);
  }
  
  yPos += 65;
  
  // Bill To Section with decorative styling
  pdf.setFillColor(secondaryRgb.r, secondaryRgb.g, secondaryRgb.b);
  pdf.rect(20, yPos - 3, 60, 12, 'F');
  
  pdf.setFontSize(14);
  pdf.setTextColor(255, 255, 255);
  pdf.setFont('helvetica', 'bold');
  pdf.text('BILL TO', 25, yPos + 5);
  
  yPos += 20;
  pdf.setFontSize(12);
  pdf.setTextColor(40, 40, 40);
  pdf.setFont('helvetica', 'bold');
  pdf.text(invoice.customer_name, 25, yPos);
  
  yPos += 8;
  pdf.setFontSize(10);
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
  
  pdf.setFontSize(11);
  pdf.setTextColor(255, 255, 255);
  pdf.setFont('helvetica', 'bold');
  pdf.text('ITEM DESCRIPTION', 25, yPos);
  pdf.text('QTY', pageWidth - 120, yPos, { align: 'center' });
  pdf.text('PRICE', pageWidth - 80, yPos, { align: 'center' });
  pdf.text('TOTAL', pageWidth - 35, yPos, { align: 'right' });
  
  yPos += 12;
  
  // Items with alternating row colors
  pdf.setFont('helvetica', 'normal');
  invoice.items.forEach((item, index) => {
    if (yPos > pageHeight - 80) {
      pdf.addPage();
      yPos = 30;
    }
    
    // Alternating row backgrounds
    if (index % 2 === 0) {
      pdf.setFillColor(248, 250, 252);
      pdf.rect(20, yPos - 4, pageWidth - 40, 12, 'F');
    }
    
    pdf.setFontSize(10);
    pdf.setTextColor(40, 40, 40);
    pdf.text(item.name, 25, yPos + 2);
    pdf.text(item.quantity.toString(), pageWidth - 120, yPos + 2, { align: 'center' });
    pdf.text(`₹${item.price.toFixed(2)}`, pageWidth - 80, yPos + 2, { align: 'center' });
    pdf.text(`₹${item.total.toFixed(2)}`, pageWidth - 35, yPos + 2, { align: 'right' });
    
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
  pdf.setFontSize(11);
  pdf.setTextColor(100, 100, 100);
  pdf.text('Subtotal:', totalsX, yPos + 5);
  pdf.text(`₹${invoice.subtotal.toFixed(2)}`, pageWidth - 25, yPos + 5, { align: 'right' });
  yPos += 10;
  
  // Discount
  if (invoice.discount > 0) {
    pdf.setTextColor(secondaryRgb.r, secondaryRgb.g, secondaryRgb.b);
    pdf.text(`Discount (${invoice.discount}%):`, totalsX, yPos + 5);
    pdf.text(`-₹${(invoice.subtotal * invoice.discount / 100).toFixed(2)}`, pageWidth - 25, yPos + 5, { align: 'right' });
    yPos += 10;
  }
  
  // Divider line
  pdf.setDrawColor(200, 200, 200);
  pdf.line(totalsX, yPos + 5, pageWidth - 25, yPos + 5);
  yPos += 8;
  
  // Total with emphasis
  pdf.setFontSize(14);
  pdf.setTextColor(primaryRgb.r, primaryRgb.g, primaryRgb.b);
  pdf.setFont('helvetica', 'bold');
  pdf.text('TOTAL:', totalsX, yPos + 5);
  pdf.text(`₹${invoice.total.toFixed(2)}`, pageWidth - 25, yPos + 5, { align: 'right' });
  
  // Footer with decorative elements
  const footerY = pageHeight - 25;
  
  // Footer background
  pdf.setFillColor(248, 250, 252);
  pdf.rect(0, footerY - 10, pageWidth, 35, 'F');
  
  pdf.setFontSize(8);
  pdf.setTextColor(120, 120, 120);
  pdf.setFont('helvetica', 'italic');
  
  if (companyProfile?.website || companyProfile?.company_email) {
    let footerText = 'Thank you for your business! ';
    if (companyProfile.website) {
      footerText += `Visit: ${companyProfile.website} `;
    }
    if (companyProfile.company_email) {
      footerText += `Contact: ${companyProfile.company_email}`;
    }
    
    pdf.text(footerText, pageWidth / 2, footerY, { align: 'center' });
  }
  
  // Decorative footer line
  pdf.setDrawColor(primaryRgb.r, primaryRgb.g, primaryRgb.b);
  pdf.setLineWidth(2);
  pdf.line(20, footerY + 8, pageWidth - 20, footerY + 8);
  
  // Save the PDF
  pdf.save(`invoice-${invoice.id.slice(-8)}.pdf`);
};

export default generateInvoicePDF;
