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
  const logoUrl = garage.logo || 'https://res.cloudinary.com/dcueubsl8/image/upload/v1754845196/garage-logos/sjrppoab6sslhvm5rl7a.jpg';
  
  if (logoUrl) {
    try {
      console.log('PDF Generator - Attempting to load logo:', logoUrl);
      const response = await fetch(logoUrl);
      
      if (!response.ok) {
        console.error('PDF Generator - Logo fetch failed:', response.status);
        throw new Error(`Failed to fetch logo: ${response.status}`);
      }
      
      const blob = await response.blob();
      console.log('PDF Generator - Logo blob size:', blob.size);
      
      if (blob.size < 5000000) { // Increased size limit to 5MB
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const img = new Image();
        
        const logoData = await new Promise<string>((resolve, reject) => {
          img.onload = () => {
            canvas.width = 40;
            canvas.height = 40;
            ctx?.drawImage(img, 0, 0, 40, 40);
            const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
            console.log('PDF Generator - Logo converted to data URL successfully');
            resolve(dataUrl);
          };
          img.onerror = (err) => {
            console.error('PDF Generator - Image load error:', err);
            reject(err);
          };
          img.src = URL.createObjectURL(blob);
        });
        
        pdf.addImage(logoData, 'JPEG', 20, 5, 20, 20);
        console.log('PDF Generator - Logo added to PDF successfully');
      } else {
        console.error('PDF Generator - Logo file too large:', blob.size);
      }
    } catch (error) {
      console.error('PDF Generator - Failed to load garage logo:', error);
    }
  } else {
    console.log('PDF Generator - No logo URL provided');
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
  
  console.log('🔄 Starting Cloudinary upload...');
  console.log('🔧 Cloud name:', cloudName ? `Set (${cloudName})` : 'Missing');
  console.log('🔧 Upload preset:', uploadPreset ? `Set (${uploadPreset})` : 'Missing');
  console.log('📄 PDF blob size:', pdfBlob.size, 'bytes');
  console.log('📝 Filename:', filename);
  
  // Test Cloudinary configuration
  if (cloudName === 'dcueubsl8' && uploadPreset === 'garage-pdfs') {
    console.log('✅ Cloudinary configuration matches expected values');
  } else {
    console.warn('⚠️ Cloudinary configuration mismatch:');
    console.warn('  Expected cloud name: dcueubsl8, got:', cloudName);
    console.warn('  Expected preset: garage-pdfs, got:', uploadPreset);
  }
  
  if (!cloudName || !uploadPreset) {
    console.error('Cloudinary configuration missing:', { cloudName: !!cloudName, uploadPreset: !!uploadPreset });
    throw new Error('Cloudinary configuration missing. Please add VITE_CLOUDINARY_CLOUD_NAME and VITE_CLOUDINARY_UPLOAD_PRESET environment variables.');
  }
  
  const formData = new FormData();
  // Create a proper File object - upload as binary with a neutral filename
  const pdfFile = new File([pdfBlob], filename ? `${filename}` : 'invoice', { 
    type: 'application/octet-stream', // Use binary type to bypass format restrictions
    lastModified: Date.now()
  });
  
  formData.append('file', pdfFile);
  formData.append('upload_preset', uploadPreset);
  formData.append('resource_type', 'raw'); // Try raw again with binary type
  
  console.log('📋 FormData contents:');
  console.log('  - file:', pdfFile);
  console.log('  - upload_preset:', uploadPreset);
  console.log('  - resource_type: raw');
  console.log('  - file size:', pdfFile.size);
  console.log('  - file type:', pdfFile.type);
  
  if (filename) {
    // Ensure filename has .pdf extension for Cloudinary
    const pdfFilename = filename.endsWith('.pdf') ? filename : `${filename}.pdf`;
    formData.append('public_id', pdfFilename);
  }
  
  try {
    console.log('🚀 Sending request to Cloudinary...');
    const uploadUrl = `https://api.cloudinary.com/v1_1/${cloudName}/raw/upload`;
    console.log('📡 Upload URL:', uploadUrl);
    
    const response = await fetch(uploadUrl, {
      method: 'POST',
      body: formData,
    });
    
    console.log('📥 Response status:', response.status);
    console.log('📥 Response headers:', Object.fromEntries(response.headers.entries()));
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Cloudinary response error:', response.status, errorText);
      
      // Parse error details if possible
      let errorDetails = errorText;
      try {
        const errorJson = JSON.parse(errorText);
        errorDetails = errorJson.error?.message || errorText;
        console.error('❌ Parsed error:', errorJson);
        
        // Check for common Cloudinary errors
        if (errorJson.error?.message?.includes('Invalid upload preset')) {
          console.error('❌ SOLUTION: Upload preset "' + uploadPreset + '" does not exist or is not configured for unsigned uploads');
          console.error('❌ Go to Cloudinary Dashboard → Settings → Upload → Upload presets');
          console.error('❌ Make sure preset "' + uploadPreset + '" exists and Signing Mode is set to "Unsigned"');
        }
      } catch (e) {
        console.error('❌ Raw error text:', errorText);
      }
      
      throw new Error(`Failed to upload PDF: ${response.status} - ${errorDetails}`);
    }
    
    const data = await response.json();
    console.log('✅ Cloudinary upload successful!');
    console.log('📊 Upload data:', data);
    
    // Return the secure_url with proper PDF download configuration
    const pdfUrl = data.secure_url;
    
    // Transform URL to proper PDF download URL with attachment flag
    let finalUrl = pdfUrl;
    
    // For regular uploads, add the attachment flag for PDF download
    if (pdfUrl.includes('/upload/')) {
      const urlParts = pdfUrl.split('/upload/');
      if (urlParts.length === 2) {
        // Add fl_attachment flag to force download as PDF
        finalUrl = `${urlParts[0]}/upload/fl_attachment/${urlParts[1]}`;
      }
    }
    
    return finalUrl;
  } catch (error) {
    console.error('❌ Cloudinary upload error:', error);
    console.error('❌ Error type:', error instanceof Error ? 'Error' : typeof error);
    console.error('❌ Error message:', error instanceof Error ? error.message : String(error));
    
    if (error instanceof TypeError && error.message.includes('fetch')) {
      console.error('❌ Network error - possible CORS or connectivity issue');
      throw new Error('Network error: Unable to connect to cloud storage. Please check your internet connection.');
    }
    
    throw new Error(`Cloud upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
