import { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Search, FileText, Download, MessageCircle, Calendar, User, Bike } from "lucide-react";

export default function Invoices() {
  const [, navigate] = useLocation();
  const { garage } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");

  const { data: invoices = [], isLoading } = useQuery({
    queryKey: ["/api/garages", garage?.id, "invoices"],
    queryFn: async () => {
      if (!garage?.id) return [];
      const response = await apiRequest("GET", `/api/garages/${garage.id}/invoices`);
      return response.json();
    },
    enabled: !!garage?.id,
  });

  const filteredInvoices = invoices.filter((invoice: any) =>
    invoice.invoice_number?.toLowerCase?.()?.includes(searchTerm.toLowerCase()) ||
    invoice.customer_name?.toLowerCase?.()?.includes(searchTerm.toLowerCase()) ||
    invoice.bike_number?.toLowerCase?.()?.includes(searchTerm.toLowerCase())
  );

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return 'No date';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Invalid date';
    const today = new Date();
    
    if (date.toDateString() === today.toDateString()) {
      return `Today, ${date.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit', 
        hour12: true 
      })}`;
    }
    
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    if (date.toDateString() === yesterday.toDateString()) {
      return `Yesterday, ${date.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit', 
        hour12: true 
      })}`;
    }
    
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined,
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  // Transform old Cloudinary URLs to proper PDF download format
  const transformPdfUrl = (url: string): string => {
    if (url.includes('/raw/upload/')) {
      // Transform old raw URLs to proper PDF download URLs
      const publicId = url.split('/').pop() || 'invoice';
      return url.replace('/raw/upload/', '/upload/fl_attachment:' + publicId + '.pdf/');
    } else if (url.includes('/upload/') && !url.includes('fl_attachment')) {
      // Add attachment flag to regular upload URLs
      const urlParts = url.split('/upload/');
      if (urlParts.length === 2) {
        const publicId = urlParts[1].split('/').pop() || 'invoice';
        return `${urlParts[0]}/upload/fl_attachment:${publicId}.pdf/${urlParts[1]}`;
      }
    }
    return url;
  };

  const downloadPDF = async (downloadUrl: string, invoiceNumber: string) => {
    if (!downloadUrl) {
      return;
    }
    
    try {
      // Fetch invoice data from the download endpoint
      const response = await fetch(downloadUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch invoice data: ${response.status}`);
      }
      
      const result = await response.json();
      if (!result.success || !result.invoice) {
        throw new Error('Invalid invoice data received');
      }

      // Import PDF generator dynamically
      const { generateInvoicePDF } = await import('@/utils/pdf-generator');
      
      // Transform the invoice data to match the expected format
      const invoiceData = {
        ...result.invoice,
        jobCard: {
          id: result.invoice.id,
          customerName: result.invoice.customer_name,
          phone: result.invoice.phone,
          bikeNumber: result.invoice.bike_number,
          complaint: result.invoice.complaint,
          serviceCharge: Number(result.invoice.service_charge),
          spareParts: result.invoice.spare_parts || [],
          totalAmount: Number(result.invoice.total_amount)
        },
        garage: {
          name: result.invoice.garage_name,
          phone: result.invoice.garage_phone
        }
      };

      // Generate PDF using client-side generator
      const pdfBlob = await generateInvoicePDF(invoiceData.jobCard);
      
      // Create download link
      const url = URL.createObjectURL(pdfBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${invoiceNumber}.pdf`;
      a.style.display = 'none';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
    } catch (error) {
      console.error('Error downloading PDF:', error);
      alert('Failed to download PDF. Please try again.');
    }
  };

  const sendWhatsApp = (phone: string, pdfUrl: string) => {
    // Use Telugu message like in whatsapp.ts
    const message = `మీ బండి రిపేర్ పూర్తయ్యింది దయచేసి. వివరాల కొరకు కింద ఉన్న PDFని చూడండి ధన్యవాదాలు.\n\n${pdfUrl}`;
    const whatsappUrl = `https://wa.me/${phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="screen-header">
          <div className="flex items-center space-x-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/dashboard")}
              className="text-white hover:bg-white/10"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h2 className="text-lg font-semibold">Invoices</h2>
          </div>
        </div>
        <div className="screen-content flex items-center justify-center">
          <div className="animate-pulse text-muted-foreground">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="screen-header">
        <div className="flex items-center space-x-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/dashboard")}
            className="text-white hover:bg-white/10"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h2 className="text-lg font-semibold">Invoices</h2>
        </div>
        <div className="bg-white/20 px-3 py-1 rounded-full">
          <span className="text-sm font-medium">{filteredInvoices.length} Invoices</span>
        </div>
      </div>

      <div className="screen-content">
        {/* Search Bar */}
        <div className="mb-4">
          <div className="relative search-bar-container">
            <Search className="search-icon w-4 h-4" />
            <Input
              type="text"
              placeholder="Search by invoice number, customer, or bike number..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
        </div>

        {/* Invoices List */}
        {filteredInvoices.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <div className="text-muted-foreground">
                {searchTerm ? "No invoices found matching your search" : "No invoices generated yet"}
              </div>
              {!searchTerm && (
                <Button 
                  className="mt-4" 
                  onClick={() => navigate("/pending-services")}
                >
                  Generate First Invoice
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {filteredInvoices.map((invoice: any) => (
              <Card key={invoice.id} className="border-l-4 border-l-success">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-success/10 rounded-full flex items-center justify-center">
                        <FileText className="text-success w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-semibold">{invoice.invoice_number}</h3>
                        <p className="text-sm text-muted-foreground">₹{Number(invoice.total_amount || 0).toLocaleString()}</p>
                      </div>
                    </div>
                    <Badge variant="secondary" className="success-bg success-text">
                      Completed
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground mb-3">
                    <div className="flex items-center space-x-2">
                      <User className="w-4 h-4" />
                      <span>{invoice.customer_name || 'N/A'}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Bike className="w-4 h-4" />
                      <span>{invoice.bike_number || 'N/A'}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Calendar className="w-4 h-4" />
                      <span>{formatDate(invoice.created_at)}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <MessageCircle className="w-4 h-4" />
                      <span>{invoice.whatsapp_sent ? 'Sent' : 'Not sent'}</span>
                    </div>
                    {invoice.visit_count && (
                      <div className="flex items-center space-x-2 col-span-2">
                        <User className="w-4 h-4" />
                        <span className="text-primary font-medium">Customer visits: {invoice.visit_count}</span>
                      </div>
                    )}
                  </div>

                  <div className="text-sm bg-muted/30 p-2 rounded mb-3">
                    <div className="flex justify-between">
                      <span>Parts Total:</span>
                      <span>₹{Number(invoice.parts_total).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Service Charge:</span>
                      <span>₹{Number(invoice.service_charge).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between font-semibold border-t pt-1 mt-1">
                      <span>Total:</span>
                      <span>₹{Number(invoice.total_amount).toFixed(2)}</span>
                    </div>
                  </div>

                  <div className="flex justify-end space-x-2">
                    {invoice.download_token && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => downloadPDF(`/invoice/download/${invoice.download_token}`, invoice.invoice_number)}
                          className="px-3 py-1 text-xs"
                          data-testid={`button-download-${invoice.id}`}
                        >
                          <Download className="w-3 h-3 mr-1" />
                          Download PDF
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => sendWhatsApp(invoice.phone || '', `${import.meta.env.VITE_APP_URL || window.location.origin}/invoice/download/${invoice.download_token}`)}
                          className="px-3 py-1 text-xs"
                          data-testid={`button-whatsapp-${invoice.id}`}
                        >
                          <MessageCircle className="w-3 h-3 mr-1" />
                          WhatsApp
                        </Button>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}