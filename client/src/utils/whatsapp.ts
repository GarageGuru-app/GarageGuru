export function sendWhatsAppMessage(phoneNumber: string, pdfUrl: string): void {
  const message = `మీ బండి రిపేర్ పూర్తయ్యింది దయచేసి. వివరాల కొరకు కింద ఉన్న PDFని చూడండి ధన్యవాదాలు.\n\n${pdfUrl}`;
  
  // Clean phone number (remove any non-digits except +)
  const cleanPhone = phoneNumber.replace(/[^\d+]/g, '');
  
  // Create WhatsApp URL
  const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
  
  // Open WhatsApp in new window/tab
  window.open(whatsappUrl, '_blank');
}

export function callCustomer(phoneNumber: string): void {
  // Use tel: protocol to open phone dialer
  window.location.href = `tel:${phoneNumber}`;
}
