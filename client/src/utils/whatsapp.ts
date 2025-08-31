export function sendWhatsAppMessage(phoneNumber: string, pdfUrl: string, garageName: string = 'GarageName'): void {
  const message = `మీ వాహనం సర్వీస్ విజయవంతంగా పూర్తయింది.
వివరాల కోసం దయచేసి క్రింది ఇన్వాయిస్‌ను చూడండి:

${pdfUrl}

మా గ్యారేజ్‌పై మీరు చూపిన విశ్వాసానికి ధన్యవాదాలు.
– ${garageName}.`;
  
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
