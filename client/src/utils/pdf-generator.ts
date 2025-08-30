import jsPDF from 'jspdf';
import type { JobCard, Garage } from '@shared/schema';

interface InvoiceData {
  jobCard: JobCard;
  garage: Garage;
  serviceCharge: number;
  invoiceNumber: string;
}

export async function generateInvoicePDF(data: InvoiceData): Promise<Blob> {
  const { jobCard, garage, serviceCharge, invoiceNumber } = data;
  
  console.log('PDF Generator - Received jobCard data:', jobCard);
  
  // Database returns snake_case field names, handle both formats
  const customerName = (jobCard as any).customer_name || jobCard.customerName || 'N/A';
  const bikeNumber = (jobCard as any).bike_number || jobCard.bikeNumber || 'N/A';
  const phone = jobCard.phone || 'N/A';
  const spareParts = (jobCard as any).spare_parts || jobCard.spareParts || [];
  
  const pdf = new jsPDF();
  const pageWidth = pdf.internal.pageSize.width;
  
  let yPos = 40;
  
  // Garage name (centered, large, professional)
  pdf.setTextColor(0, 0, 0);
  pdf.setFontSize(22);
  pdf.setFont('helvetica', 'bold');
  pdf.text(garage.name, pageWidth / 2, yPos, { align: 'center' });
  
  yPos += 25;
  
  // Phone number (centered, smaller)
  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'normal');
  pdf.text(garage.phone || '', pageWidth / 2, yPos, { align: 'center' });
  
  yPos += 50;
  
  // INVOICE title (centered, large, professional)
  pdf.setFontSize(24);
  pdf.setFont('helvetica', 'bold');
  pdf.text('INVOICE', pageWidth / 2, yPos, { align: 'center' });
  
  yPos += 40;
  
  // Invoice details (left aligned, proper spacing)
  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'normal');
  
  pdf.text(`Invoice Number: ${invoiceNumber}`, 20, yPos);
  yPos += 20;
  
  pdf.text(`Date: ${new Date().toLocaleDateString('en-GB')}`, 20, yPos);
  yPos += 20;
  
  pdf.text(`Customer: ${customerName}`, 20, yPos);
  yPos += 20;
  
  pdf.text(`Phone: ${phone}`, 20, yPos);
  yPos += 20;
  
  pdf.text(`Bike Number: ${bikeNumber}`, 20, yPos);
  yPos += 40;
  
  // Services & Parts section
  pdf.setFont('helvetica', 'bold');
  pdf.text('Services & Parts:', 20, yPos);
  yPos += 25;
  
  // Service line
  pdf.setFont('helvetica', 'normal');
  const complaint = (jobCard as any).complaint || jobCard.complaint || 'Service Only';
  pdf.text(complaint, 20, yPos);
  yPos += 20;
  
  // Parts (if any)
  let partsTotal = 0;
  if (spareParts && Array.isArray(spareParts) && spareParts.length > 0) {
    spareParts.forEach((part: any) => {
      const lineTotal = part.price * part.quantity;
      partsTotal += lineTotal;
      pdf.text(`${part.name} (Qty: ${part.quantity})`, 20, yPos);
      yPos += 18;
    });
  }
  
  yPos += 30;
  
  // Totals section with proper alignment and spacing
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(12);
  
  // Parts Total with more space for price display (moved 10 digits left)
  pdf.text('Parts Total:', 20, yPos);
  const partsText = `Rs.${partsTotal.toFixed(2)}`;
  pdf.text(partsText, pageWidth - 80, yPos, { align: 'right' });
  yPos += 20;
  
  // Service Charge with more space for price display (moved 10 digits left) 
  pdf.text('Service Charge:', 20, yPos);
  const serviceText = `Rs.${serviceCharge.toFixed(2)}`;
  pdf.text(serviceText, pageWidth - 80, yPos, { align: 'right' });
  yPos += 25;
  
  // Total Amount (bold, emphasized) with more space (moved 10 digits left)
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(14);
  pdf.text('Total Amount:', 20, yPos);
  const totalText = `Rs.${(partsTotal + serviceCharge).toFixed(2)}`;
  pdf.text(totalText, pageWidth - 80, yPos, { align: 'right' });
  
  yPos += 50;
  
  // Thank you message (centered, professional)
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(14);
  pdf.text(`Thank you for choosing ${garage.name}!`, pageWidth / 2, yPos, { align: 'center' });
  
  yPos += 25;
  
  // Visit again message (centered, smaller)
  pdf.setFontSize(12);
  pdf.text('Visit us again for all your bike service needs', pageWidth / 2, yPos, { align: 'center' });
  
  return pdf.output('blob');
}

// Generate a unique download token for PDF access
export function generateDownloadToken(invoiceNumber: string): string {
  // Create a unique token based on invoice number and timestamp
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `${invoiceNumber}-${timestamp}-${random}`;
}

// Create a direct download URL for the PDF
export function createDownloadURL(downloadToken: string): string {
  const baseUrl = window.location.origin;
  return `${baseUrl}/invoice/download/${downloadToken}`;
}
