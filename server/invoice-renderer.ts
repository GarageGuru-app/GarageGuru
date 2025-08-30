import PDFDocument from 'pdfkit';

// Single source of truth for currency formatting
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
}

// Single source of truth for invoice calculations
export function calculateTotals(serviceCharge: number, spareParts: any[]) {
  const partsTotal = spareParts.reduce((sum, part) => sum + (part.price * part.quantity), 0);
  const subTotal = partsTotal + serviceCharge;
  const grandTotal = subTotal; // No tax/discount for now
  
  return {
    partsTotal,
    serviceCharge,
    subTotal,
    grandTotal
  };
}

export interface InvoiceData {
  id: string;
  invoice_number: string;
  created_at: string;
  customer_name: string;
  phone: string;
  bike_number: string;
  complaint: string;
  service_charge: number;
  spare_parts: Array<{
    name: string;
    quantity: number;
    price: number;
  }>;
  garage_name: string;
  garage_phone: string;
  garage_logo?: string;
}

// Single source of truth PDF renderer
export function renderInvoicePDF(invoiceData: InvoiceData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ 
        size: 'A4',
        margins: { top: 50, bottom: 50, left: 50, right: 50 }
      });
      
      const buffers: Buffer[] = [];
      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', reject);

      const pageWidth = doc.page.width;
      let yPos = 80;

      // Calculate totals using single source of truth
      const totals = calculateTotals(
        Number(invoiceData.service_charge),
        invoiceData.spare_parts || []
      );

      // Garage name (centered, large, professional)
      doc.fontSize(22)
         .font('Helvetica-Bold')
         .fillColor('#000000')
         .text(invoiceData.garage_name, 0, yPos, { align: 'center', width: pageWidth });
      
      yPos += 35;
      
      // Phone number (centered, proper spacing)
      doc.fontSize(14)
         .font('Helvetica')
         .text(invoiceData.garage_phone || '', 0, yPos, { align: 'center', width: pageWidth });
      
      yPos += 70;
      
      // INVOICE title (centered, large, professional)
      doc.fontSize(24)
         .font('Helvetica-Bold')
         .text('INVOICE', 0, yPos, { align: 'center', width: pageWidth });
      
      yPos += 50;
      
      // Invoice details (left aligned, proper spacing)
      doc.fontSize(12)
         .font('Helvetica');
      
      doc.text(`Invoice Number: ${invoiceData.invoice_number}`, 50, yPos);
      yPos += 25;
      
      doc.text(`Date: ${new Date(invoiceData.created_at).toLocaleDateString('en-GB')}`, 50, yPos);
      yPos += 25;
      
      doc.text(`Customer: ${invoiceData.customer_name}`, 50, yPos);
      yPos += 25;
      
      doc.text(`Phone: ${invoiceData.phone}`, 50, yPos);
      yPos += 25;
      
      doc.text(`Bike Number: ${invoiceData.bike_number}`, 50, yPos);
      yPos += 50;
      
      // Services & Parts section
      doc.font('Helvetica-Bold')
         .text('Services & Parts:', 50, yPos);
      yPos += 25;
      
      // Service line
      doc.font('Helvetica')
         .text(invoiceData.complaint || 'Service Only', 50, yPos);
      yPos += 25;
      
      // Parts (if any)
      const spareParts = invoiceData.spare_parts || [];
      spareParts.forEach((part: any) => {
        doc.text(`${part.name} (Qty: ${part.quantity})`, 50, yPos);
        yPos += 25;
      });
      
      yPos += 30;
      
      // Totals section with proper currency formatting and positioning
      doc.font('Helvetica')
         .fontSize(12);
      
      // Parts Total - properly formatted currency, positioned left from edge
      doc.text('Parts Total:', 50, yPos);
      doc.text(formatCurrency(totals.partsTotal), pageWidth - 120, yPos, { align: 'right' });
      yPos += 20;
      
      // Service Charge - properly formatted currency, positioned left from edge  
      doc.text('Service Charge:', 50, yPos);
      doc.text(formatCurrency(totals.serviceCharge), pageWidth - 120, yPos, { align: 'right' });
      yPos += 25;
      
      // Total Amount (bold, emphasized) - properly formatted currency, positioned left from edge
      doc.font('Helvetica-Bold')
         .fontSize(14);
      doc.text('Total Amount:', 50, yPos);
      doc.text(formatCurrency(totals.grandTotal), pageWidth - 120, yPos, { align: 'right' });
      
      yPos += 70;
      
      // Thank you message (centered, professional)
      doc.font('Helvetica')
         .fontSize(14);
      doc.text(`Thank you for choosing ${invoiceData.garage_name}!`, 0, yPos, { align: 'center', width: pageWidth });
      
      yPos += 25;
      
      // Visit again message (centered, smaller)
      doc.fontSize(12);
      doc.text('Visit us again for all your bike service needs', 0, yPos, { align: 'center', width: pageWidth });

      doc.end();
      
    } catch (error) {
      reject(error);
    }
  });
}