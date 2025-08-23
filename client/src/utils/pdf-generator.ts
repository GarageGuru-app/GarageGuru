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
  
  // Handle field name inconsistencies by checking both formats
  const customerName = jobCard.customerName || jobCard.customer_name || 'N/A';
  const bikeNumber = jobCard.bikeNumber || jobCard.bike_number || 'N/A';
  const phone = jobCard.phone || 'N/A';
  const spareParts = jobCard.spareParts || jobCard.spare_parts || [];
  
  const pdf = new jsPDF();
  const pageWidth = pdf.internal.pageSize.width;
  
  let yPos = 20;
  
  // Add logo if exists - optimized for smaller file size
  if (garage.logo) {
    try {
      const response = await fetch(garage.logo);
      const blob = await response.blob();
      
      // Only process if image is reasonable size (< 500KB)
      if (blob.size < 500000) {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const img = new Image();
        
        const imageData = await new Promise<string>((resolve, reject) => {
          img.onload = () => {
            // Resize to small dimensions for PDF
            canvas.width = 120;
            canvas.height = 60;
            ctx?.drawImage(img, 0, 0, 120, 60);
            
            // Convert to JPEG with compression
            const compressedData = canvas.toDataURL('image/jpeg', 0.7);
            resolve(compressedData);
          };
          img.onerror = reject;
          img.src = URL.createObjectURL(blob);
        });
        
        // Add compressed logo to PDF
        pdf.addImage(imageData, 'JPEG', 20, 10, 30, 15);
        yPos = 35;
      }
    } catch (error) {
      console.error('Failed to load logo:', error);
      // Continue without logo
    }
  }
  
  // Header
  pdf.setFontSize(20);
  pdf.setFont('helvetica', 'bold');
  pdf.text(garage.name, pageWidth / 2, yPos, { align: 'center' });
  
  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'normal');
  pdf.text(garage.phone, pageWidth / 2, yPos + 10, { align: 'center' });
  
  // Invoice details
  pdf.setFontSize(16);
  pdf.setFont('helvetica', 'bold');
  pdf.text('INVOICE', pageWidth / 2, yPos + 30, { align: 'center' });
  
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  
  // Customer details
  yPos += 50;
  pdf.text(`Invoice Number: ${invoiceNumber}`, 20, yPos);
  pdf.text(`Date: ${new Date().toLocaleDateString()}`, 20, yPos + 10);
  pdf.text(`Customer: ${customerName}`, 20, yPos + 20);
  pdf.text(`Phone: ${phone}`, 20, yPos + 30);
  pdf.text(`Bike Number: ${bikeNumber}`, 20, yPos + 40);
  
  // Services & Parts
  yPos += 60;
  pdf.setFont('helvetica', 'bold');
  pdf.text('Services & Parts:', 20, yPos);
  
  pdf.setFont('helvetica', 'normal');
  yPos += 10;
  
  let partsTotal = 0;
  
  if (spareParts && Array.isArray(spareParts) && spareParts.length > 0) {
    spareParts.forEach((part: any) => {
      const lineTotal = part.price * part.quantity;
      partsTotal += lineTotal;
      
      // Display both part number and name
      // Handle part number field name variations  
      const partNumber = part.partNumber || part.part_number || '';
      const partName = part.name || 'Unnamed Part';
      const partDisplay = partNumber ? `PN: ${partNumber} — ${partName}` : partName;
      pdf.text(`${partDisplay} — Qty ${part.quantity} x ₹${part.price}`, 20, yPos);
      pdf.text(`₹${lineTotal.toFixed(2)}`, pageWidth - 40, yPos, { align: 'right' });
      yPos += 10;
    });
  } else {
    // Add a line for service only (no parts)
    pdf.text('Service Only', 20, yPos);
    yPos += 10;
  }
  
  // Totals
  yPos += 10;
  pdf.line(20, yPos, pageWidth - 20, yPos); // Line separator
  
  yPos += 10;
  pdf.text('Parts Total:', 20, yPos);
  pdf.text(`₹${partsTotal.toFixed(2)}`, pageWidth - 40, yPos, { align: 'right' });
  
  yPos += 10;
  pdf.text('Service Charge:', 20, yPos);
  pdf.text(`₹${serviceCharge.toFixed(2)}`, pageWidth - 40, yPos, { align: 'right' });
  
  yPos += 10;
  pdf.setFont('helvetica', 'bold');
  pdf.text('Total Amount:', 20, yPos);
  pdf.text(`₹${(partsTotal + serviceCharge).toFixed(2)}`, pageWidth - 40, yPos, { align: 'right' });
  
  // Footer
  yPos += 30;
  pdf.setFontSize(8);
  pdf.setFont('helvetica', 'normal');
  pdf.text('Thank you for choosing ' + garage.name, pageWidth / 2, yPos, { align: 'center' });
  
  return pdf.output('blob');
}

export async function uploadPDFToCloudinary(pdfBlob: Blob, filename?: string): Promise<string> {
  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;
  
  if (!cloudName || !uploadPreset) {
    throw new Error('Cloudinary configuration missing. Please add VITE_CLOUDINARY_CLOUD_NAME and VITE_CLOUDINARY_UPLOAD_PRESET environment variables.');
  }
  
  const formData = new FormData();
  formData.append('file', pdfBlob);
  formData.append('upload_preset', uploadPreset);
  formData.append('resource_type', 'raw');
  if (filename) {
    formData.append('public_id', filename);
  }
  
  try {
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/raw/upload`,
      {
        method: 'POST',
        body: formData,
      }
    );
    
    if (!response.ok) {
      throw new Error('Failed to upload PDF');
    }
    
    const data = await response.json();
    return data.secure_url;
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    throw new Error('Failed to upload PDF to cloud storage');
  }
}
