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
  
  let yPos = 20;
  
  // Add header background color
  pdf.setFillColor(37, 99, 235); // Blue background
  pdf.rect(0, 0, pageWidth, 45, 'F');
  
  // Add garage logo if available
  console.log('PDF Generator - Garage data:', garage);
  console.log('PDF Generator - Garage logo URL:', garage.logo);
  
  if (garage.logo) {
    try {
      console.log('PDF Generator - Attempting to fetch logo from:', garage.logo);
      const response = await fetch(garage.logo);
      console.log('PDF Generator - Logo fetch response status:', response.status);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch logo: ${response.status}`);
      }
      
      const blob = await response.blob();
      console.log('PDF Generator - Logo blob size:', blob.size, 'bytes');
      
      if (blob.size < 500000) {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const img = new Image();
        
        const logoData = await new Promise<string>((resolve, reject) => {
          img.onload = () => {
            console.log('PDF Generator - Logo image loaded successfully');
            canvas.width = 40;
            canvas.height = 40;
            ctx?.drawImage(img, 0, 0, 40, 40);
            resolve(canvas.toDataURL('image/jpeg', 0.8));
          };
          img.onerror = (error) => {
            console.error('PDF Generator - Logo image load failed:', error);
            reject(error);
          };
          img.src = URL.createObjectURL(blob);
        });
        
        pdf.addImage(logoData, 'JPEG', 20, 5, 20, 20);
        console.log('PDF Generator - Logo added to PDF successfully');
      } else {
        console.warn('PDF Generator - Logo file too large:', blob.size, 'bytes');
      }
    } catch (error) {
      console.error('PDF Generator - Failed to load garage logo:', error);
    }
  } else {
    console.log('PDF Generator - No garage logo available');
  }
  
  // Header text (white on blue background)
  pdf.setTextColor(255, 255, 255); // White text
  pdf.setFontSize(20);
  pdf.setFont('helvetica', 'bold');
  pdf.text(garage.name, pageWidth / 2, 20, { align: 'center' });
  
  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'normal');
  pdf.text(garage.phone || 'Contact: N/A', pageWidth / 2, 32, { align: 'center' });
  
  // Reset text color for rest of document
  pdf.setTextColor(0, 0, 0); // Black text
  
  // Invoice title with orange accent
  pdf.setFillColor(249, 115, 22); // Orange background
  pdf.rect(0, 45, pageWidth, 20, 'F');
  
  pdf.setTextColor(255, 255, 255); // White text
  pdf.setFontSize(16);
  pdf.setFont('helvetica', 'bold');
  pdf.text('INVOICE', pageWidth / 2, 57, { align: 'center' });
  
  // Reset text color
  pdf.setTextColor(0, 0, 0);
  
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  
  // Customer details
  yPos = 75;
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
      pdf.text(`${partDisplay} — Qty ${part.quantity} x Rs.${Number(part.price).toFixed(2)}`, 20, yPos);
      pdf.text(`Rs.${lineTotal.toFixed(2)}`, pageWidth - 40, yPos, { align: 'right' });
      yPos += 10;
    });
  } else {
    // Add a line for service only (no parts)
    pdf.text('Service Only', 20, yPos);
    yPos += 10;
  }
  
  // Totals section with background
  yPos += 10;
  pdf.setFillColor(248, 250, 252); // Light gray background
  pdf.rect(15, yPos, pageWidth - 30, 40, 'F');
  pdf.setDrawColor(203, 213, 225); // Gray border
  pdf.rect(15, yPos, pageWidth - 30, 40, 'S');
  
  yPos += 12;
  pdf.setTextColor(71, 85, 105); // Dark gray text
  pdf.setFont('helvetica', 'normal');
  pdf.text('Parts Total:', 20, yPos);
  pdf.text(`Rs.${partsTotal.toFixed(2)}`, pageWidth - 25, yPos, { align: 'right' });
  
  yPos += 10;
  pdf.text('Service Charge:', 20, yPos);
  pdf.text(`Rs.${serviceCharge.toFixed(2)}`, pageWidth - 25, yPos, { align: 'right' });
  
  // Total amount with emphasis
  yPos += 12;
  pdf.setFillColor(37, 99, 235); // Blue background for total
  pdf.rect(15, yPos - 3, pageWidth - 30, 12, 'F');
  
  pdf.setTextColor(255, 255, 255); // White text
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(12);
  pdf.text('Total Amount:', 20, yPos + 3);
  pdf.text(`Rs.${(partsTotal + serviceCharge).toFixed(2)}`, pageWidth - 25, yPos + 3, { align: 'right' });
  
  pdf.setTextColor(0, 0, 0); // Reset text color
  pdf.setFontSize(10);
  
  // Footer with thank you message
  yPos += 25;
  pdf.setFillColor(34, 197, 94); // Green background
  pdf.rect(0, yPos, pageWidth, 15, 'F');
  
  pdf.setTextColor(255, 255, 255); // White text
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Thank you for choosing ' + garage.name + '!', pageWidth / 2, yPos + 8, { align: 'center' });
  
  pdf.setTextColor(0, 0, 0); // Reset text color
  pdf.setFontSize(8);
  pdf.setFont('helvetica', 'normal');
  pdf.text('Visit us again for all your bike service needs', pageWidth / 2, yPos + 20, { align: 'center' });
  
  return pdf.output('blob');
}

export async function uploadPDFToCloudinary(pdfBlob: Blob, filename?: string): Promise<string> {
  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;
  
  if (!cloudName || !uploadPreset) {
    throw new Error('Cloudinary configuration missing. Please add VITE_CLOUDINARY_CLOUD_NAME and VITE_CLOUDINARY_UPLOAD_PRESET environment variables.');
  }
  
  const formData = new FormData();
  // Create a proper File object with PDF content type
  const pdfFile = new File([pdfBlob], filename ? `${filename}.pdf` : 'invoice.pdf', { 
    type: 'application/pdf',
    lastModified: Date.now()
  });
  
  formData.append('file', pdfFile);
  formData.append('upload_preset', uploadPreset);
  formData.append('resource_type', 'auto'); // Let Cloudinary auto-detect
  formData.append('format', 'pdf'); // Explicitly specify format
  
  if (filename) {
    // Ensure filename has .pdf extension for Cloudinary
    const pdfFilename = filename.endsWith('.pdf') ? filename : `${filename}.pdf`;
    formData.append('public_id', pdfFilename);
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
      const errorText = await response.text();
      console.error('Cloudinary response error:', response.status, errorText);
      throw new Error(`Failed to upload PDF: ${response.status} ${errorText}`);
    }
    
    const data = await response.json();
    console.log('Cloudinary upload successful:', data);
    
    // Return the secure_url - try different approaches for better PDF access
    const pdfUrl = data.secure_url;
    console.log('Original Cloudinary URL:', pdfUrl);
    
    // Try different URL formats to ensure PDF accessibility
    const urlParts = pdfUrl.split('/upload/');
    if (urlParts.length === 2) {
      // Method 1: Try with resource_type and format specification
      const improvedUrl = `${urlParts[0]}/upload/fl_attachment/${urlParts[1]}`;
      console.log('Improved PDF URL:', improvedUrl);
      
      // Test the URL accessibility
      return improvedUrl;
    }
    
    return pdfUrl;
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    console.error('Error details:', error instanceof Error ? error.message : 'Unknown error');
    throw new Error('Failed to upload PDF to cloud storage');
  }
}
