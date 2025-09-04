import { useState, useEffect } from "react";
import { useLocation, useParams } from "wouter";
import { useAuth } from "@/lib/auth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { ArrowLeft, FileText, Share, Wrench, AlertTriangle, CheckCircle2, Edit } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

import { generateInvoicePDF, generateDownloadToken, createDownloadURL } from "@/utils/pdf-generator";
import { sendWhatsAppMessage } from "@/utils/whatsapp";

export default function Invoice() {
  const { jobCardId } = useParams();
  const [, navigate] = useLocation();
  const { garage, user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [serviceCharge, setServiceCharge] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isRefreshingDB, setIsRefreshingDB] = useState(false);
  const [isSharingWhatsApp, setIsSharingWhatsApp] = useState(false);
  const [completionNotes, setCompletionNotes] = useState("");
  const [workSummary, setWorkSummary] = useState("");
  const [showPartsConfirmation, setShowPartsConfirmation] = useState(false);
  const [pendingWhatsAppShare, setPendingWhatsAppShare] = useState(false);

  const { data: jobCard, isLoading } = useQuery({
    queryKey: ["/api/garages", garage?.id, "job-cards", jobCardId],
    queryFn: async () => {
      if (!garage?.id || !jobCardId) return null;
      const response = await apiRequest("GET", `/api/garages/${garage.id}/job-cards/${jobCardId}`);
      return response.json();
    },
    enabled: !!garage?.id && !!jobCardId,
  });

  // Set service charge when job card loads
  useEffect(() => {
    if (jobCard?.service_charge) {
      setServiceCharge(Number(jobCard.service_charge) || 0);
    }
  }, [jobCard]);

  const createInvoiceMutation = useMutation({
    mutationFn: async (invoiceData: any) => {
      if (!garage?.id) throw new Error("No garage selected");
      // Server automatically updates job card status to "completed" when invoice is created
      const response = await apiRequest("POST", `/api/garages/${garage.id}/invoices`, invoiceData);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Invoice created and service completed successfully",
      });
      // Invalidate specific queries to ensure UI updates
      queryClient.invalidateQueries({ queryKey: ["/api/garages", garage?.id, "job-cards"] });
      queryClient.invalidateQueries({ queryKey: ["/api/garages", garage?.id, "job-cards", "pending"] });
      queryClient.invalidateQueries({ queryKey: ["/api/garages", garage?.id, "invoices"] });
      navigate("/admin-dashboard");
    },
    onError: (error: any) => {
      console.error('Invoice creation error:', error);
      let errorMessage = "Failed to create invoice";
      
      if (error?.message?.includes("already exists")) {
        errorMessage = "This service already has an invoice. Cannot create duplicate invoices.";
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="screen-header">
          <div className="flex items-center space-x-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/pending-services")}
              className="text-white hover:bg-white/10"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h2 className="text-lg font-semibold">Generate Invoice</h2>
          </div>
        </div>
        <div className="screen-content flex items-center justify-center">
          <div className="flex flex-col items-center space-y-3">
            <Wrench className="w-8 h-8 text-primary animate-spin" />
            <span className="text-muted-foreground">Loading job card details...</span>
          </div>
        </div>
      </div>
    );
  }

  if (!jobCard || !garage) {
    return (
      <div className="min-h-screen bg-background">
        <div className="screen-content flex items-center justify-center">
          <div className="text-destructive">Job card not found</div>
        </div>
      </div>
    );
  }

  const spareParts = (jobCard as any).spare_parts || jobCard.spareParts || [];
  const partsTotal = Array.isArray(spareParts) 
    ? spareParts.reduce((sum: number, part: any) => sum + (part.price * part.quantity), 0)
    : 0;
  
  // Get operational charges from job card
  const waterWashCharge = Number((jobCard as any).water_wash_charge || 0);
  const dieselCharge = Number((jobCard as any).diesel_charge || 0);
  const petrolCharge = Number((jobCard as any).petrol_charge || 0);
  const foundryCharge = Number((jobCard as any).foundry_charge || 0);
  
  // Service charge includes all operational charges: water wash, diesel, petrol, and foundry
  const combinedServiceCharge = serviceCharge + waterWashCharge + dieselCharge + petrolCharge + foundryCharge;
  
  const totalAmount = partsTotal + combinedServiceCharge;
  
  // Create short, simple invoice filename
  const createInvoiceFilename = (invoiceId: string) => {
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, ''); // YYYYMMDD
    const invoiceIdShort = invoiceId.slice(0, 8); // First 8 chars of invoice ID
    
    return `INV-${dateStr}-${invoiceIdShort}`;
  };
  
  const invoiceNumber = `INV-${Date.now()}`;

  // Handle spare parts confirmation dialog
  const handleInvoiceGeneration = (sendWhatsApp: boolean = false) => {
    if (spareParts && spareParts.length > 0) {
      // Show spare parts confirmation if there are parts
      setPendingWhatsAppShare(sendWhatsApp);
      setShowPartsConfirmation(true);
    } else {
      // No spare parts, proceed directly
      handleGeneratePDF(sendWhatsApp);
    }
  };

  const handlePartsConfirmed = () => {
    setShowPartsConfirmation(false);
    handleGeneratePDF(pendingWhatsAppShare);
  };

  const handleEditJobCard = () => {
    setShowPartsConfirmation(false);
    navigate(`/edit-job-card/${jobCardId}`);
  };

  const handlePreviewPDF = async () => {
    setIsGenerating(true);
    
    try {
      // Generate PDF for preview
      const pdfBlob = await generateInvoicePDF({
        jobCard,
        garage,
        serviceCharge: combinedServiceCharge,
        invoiceNumber,
      });
      
      // Open PDF in new tab for preview with proper MIME type
      const pdfUrl = URL.createObjectURL(new Blob([pdfBlob], { type: 'application/pdf' }));
      window.open(pdfUrl, '_blank');
      
      // Clean up the URL after a delay
      setTimeout(() => URL.revokeObjectURL(pdfUrl), 1000);
      
      toast({
        title: "Success",
        description: "PDF opened for preview",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to preview PDF",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGeneratePDF = async (sendWhatsApp: boolean = false) => {
    setIsGenerating(true);
    if (sendWhatsApp) {
      setIsSharingWhatsApp(true);
    }
    
    try {
      console.log('Creating invoice with data:', {
        jobCardId: jobCard.id,
        invoiceNumber,
        customerName: jobCard.customerName,
        bikeNumber: jobCard.bikeNumber,
        phone: jobCard.phone,
        complaint: jobCard.complaint,
        spareParts: jobCard.spareParts,
        serviceCharge,
        partsTotal,
        totalAmount,
        customerId: jobCard.customer_id
      });

      // Show database refresh loading if sending WhatsApp
      if (sendWhatsApp) {
        setIsRefreshingDB(true);
        toast({
          title: "Processing...",
          description: "Creating invoice and updating database",
        });
      }

      // Generate PDF
      const pdfBlob = await generateInvoicePDF({
        jobCard,
        garage,
        serviceCharge: combinedServiceCharge,
        invoiceNumber,
      });
      
      // Generate download token for PDF access
      const downloadToken = generateDownloadToken(invoiceNumber);
      const downloadUrl = createDownloadURL(downloadToken);
      console.log('🔗 Generated download URL:', downloadUrl);
      
      // Create invoice record with completion details
      const createdInvoice = await createInvoiceMutation.mutateAsync({
        jobCardId: jobCard.id,
        customerId: (jobCard as any).customer_id || jobCard.customerId,
        invoiceNumber,
        downloadToken,
        totalAmount: String(totalAmount),
        partsTotal: String(partsTotal), 
        serviceCharge: String(serviceCharge),
        whatsappSent: sendWhatsApp,
        completionNotes,
        workSummary: workSummary || `Service completed for ${(jobCard as any).bike_number || jobCard.bikeNumber} - ${jobCard.complaint}`,
      });
      
      // Generate proper filename and update PDF
      const finalFilename = createInvoiceFilename(createdInvoice.id);
      
      // Wait for database to fully commit changes (especially important for WhatsApp sharing)
      if (sendWhatsApp) {
        toast({
          title: "Processing...",
          description: "Finalizing invoice with latest data",
        });
        
        // Force refresh the data from database to ensure we have the latest values
        await queryClient.invalidateQueries({ queryKey: ["/api/garages", garage?.id, "job-cards", jobCardId] });
        await queryClient.invalidateQueries({ queryKey: ["/api/garages", garage?.id, "invoices"] });
        
        // Small delay to ensure database consistency
        await new Promise(resolve => setTimeout(resolve, 1000));
        setIsRefreshingDB(false);
      }
      
      // Re-generate PDF with proper filename and fresh data
      const finalPdfBlob = await generateInvoicePDF({
        jobCard,
        garage,
        serviceCharge: combinedServiceCharge,
        invoiceNumber: finalFilename,
      });
      
      // Update the download token with final filename
      const finalDownloadToken = generateDownloadToken(finalFilename);
      const finalDownloadUrl = createDownloadURL(finalDownloadToken);
      console.log('🔗 Final download URL:', finalDownloadUrl);
      
      // Update the invoice record with the final download token
      await apiRequest("PATCH", `/api/invoices/${createdInvoice.id}`, {
        download_token: finalDownloadToken
      });
      
      if (sendWhatsApp) {
        // Additional delay before sharing to ensure all data is synced
        toast({
          title: "Preparing to share...",
          description: "Generating final invoice PDF with correct amounts",
        });
        
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Check user's WhatsApp auto-open preference before opening WhatsApp  
        if (user?.auto_whatsapp_share !== false) {
          // Send WhatsApp message with download URL
          sendWhatsAppMessage(jobCard.phone || '', finalDownloadUrl, garage?.name || 'GarageName');
          toast({
            title: "Success",
            description: "Invoice generated and WhatsApp opened with correct amounts",
          });
        } else {
          toast({
            title: "Success",
            description: "Invoice generated successfully. WhatsApp auto-open is disabled in your profile settings.",
          });
        }
      } else {
        // Just download PDF with proper filename and extension
        // Use the finalPdfBlob directly as it's already a proper PDF Blob from jsPDF
        const url = URL.createObjectURL(finalPdfBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${finalFilename}.pdf`;
        a.style.display = 'none';
        document.body.appendChild(a); // Ensure element is in DOM
        a.click();
        document.body.removeChild(a); // Clean up
        URL.revokeObjectURL(url);
        
        toast({
          title: "Success",
          description: "Invoice PDF downloaded",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to generate invoice",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
      setIsSharingWhatsApp(false);
      setIsRefreshingDB(false);
    }
  };

  return (
    <div className="min-h-screen bg-background relative">
      {/* Loading Overlay for Database Refresh */}
      {isRefreshingDB && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 mx-4 max-w-sm w-full text-center space-y-4">
            <Wrench className="w-12 h-12 text-primary animate-spin mx-auto" />
            <div>
              <h3 className="font-semibold">Updating Database</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Ensuring invoice has the latest service charges and parts data
              </p>
            </div>
          </div>
        </div>
      )}
      
      {/* Loading Overlay for WhatsApp Sharing */}
      {isSharingWhatsApp && !isRefreshingDB && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 mx-4 max-w-sm w-full text-center space-y-4">
            <Wrench className="w-12 h-12 text-primary animate-spin mx-auto" />
            <div>
              <h3 className="font-semibold">Preparing WhatsApp</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Generating final invoice with correct amounts
              </p>
            </div>
          </div>
        </div>
      )}
      
      {/* Header */}
      <div className="screen-header">
        <div className="flex items-center space-x-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/pending-services")}
            className="text-white hover:bg-white/10"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h2 className="text-lg font-semibold">Generate Invoice</h2>
        </div>
      </div>

      <div className="screen-content space-y-4">
        {/* Invoice Preview */}
        <Card>
          <CardContent className="p-4">
            {/* Garage Header */}
            <div className="flex items-center space-x-3 pb-4 border-b border-border">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                <FileText className="text-primary w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold">{garage.name}</h3>
                <p className="text-sm text-muted-foreground">{garage.phone}</p>
              </div>
            </div>

            {/* Invoice Details */}
            <div className="py-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Invoice Date:</span>
                <span>{new Date().toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Customer:</span>
                <span>{(jobCard as any).customer_name || jobCard.customerName || 'N/A'}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Bike Number:</span>
                <span>{(jobCard as any).bike_number || jobCard.bikeNumber || 'N/A'}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Complaint:</span>
                <span className="text-right max-w-[200px]">{jobCard.complaint}</span>
              </div>
            </div>

            {/* Services & Parts */}
            <div className="border-t border-border pt-4">
              <h4 className="font-semibold mb-3">Services & Parts</h4>
              
              <div className="space-y-2">
                {Array.isArray((jobCard as any).spare_parts || jobCard.spareParts) && ((jobCard as any).spare_parts || jobCard.spareParts).map((part: any, index: number) => (
                  <div key={index} className="flex justify-between text-sm">
                    <span>
                      {part.partNumber ? `PN: ${part.partNumber} — ${part.name}` : part.name} — Qty {part.quantity} x ₹{part.price}
                    </span>
                    <span>₹{(part.price * part.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>
              
              <div className="mt-4 pt-3 border-t border-border">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Parts Total:</span>
                  <span>₹{partsTotal.toFixed(2)}</span>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Service Charge:</span>
                    <div className="flex flex-col items-end">
                      <Input
                        type="number"
                        min="0"
                        step="1"
                        value={serviceCharge === 0 ? "" : serviceCharge}
                        onChange={(e) => setServiceCharge(Number(e.target.value) || 0)}
                        onFocus={(e) => {
                          if (e.target.value === "0") {
                            e.target.value = "";
                            setServiceCharge(0);
                          }
                        }}
                        className="w-24 h-8 text-right text-sm [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        style={{ appearance: "textfield" }}
                        placeholder="0"
                      />
                    </div>
                  </div>
                  {(waterWashCharge > 0 || dieselCharge > 0 || petrolCharge > 0 || foundryCharge > 0) && (
                    <div className="text-xs text-muted-foreground italic ml-1">
                      *Includes {[waterWashCharge > 0 ? 'water wash' : '', dieselCharge > 0 ? 'diesel' : '', petrolCharge > 0 ? 'petrol' : '', foundryCharge > 0 ? 'foundry' : ''].filter(Boolean).join(', ')} charges
                    </div>
                  )}
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground font-medium">Total Service:</span>
                    <span className="font-medium">₹{combinedServiceCharge.toFixed(2)}</span>
                  </div>
                </div>
                <div className="flex justify-between font-semibold text-lg mt-2 pt-2 border-t border-border">
                  <span>Total Amount:</span>
                  <span className="text-primary">₹{totalAmount.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Completion Details */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Service Completion Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Work Summary</label>
              <Textarea
                value={workSummary}
                onChange={(e) => setWorkSummary(e.target.value)}
                placeholder="Brief summary of work performed (e.g., 'Oil change, brake pad replacement, general inspection')"
                className="resize-none"
                rows={2}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Completion Notes</label>
              <Textarea
                value={completionNotes}
                onChange={(e) => setCompletionNotes(e.target.value)}
                placeholder="Additional notes about the service (optional)"
                className="resize-none"
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="space-y-3">
          <Button
            onClick={() => handleInvoiceGeneration(true)}
            disabled={isGenerating || isSharingWhatsApp || isRefreshingDB}
            className="w-full"
          >
            <Share className="w-4 h-4 mr-2" />
            {isRefreshingDB 
              ? "Updating database..." 
              : isSharingWhatsApp 
              ? "Preparing WhatsApp..." 
              : isGenerating 
              ? "Generating..." 
              : "Generate PDF & Send WhatsApp"
            }
          </Button>
          
          <Button
            onClick={() => handlePreviewPDF()}
            disabled={isGenerating || isSharingWhatsApp || isRefreshingDB}
            variant="outline"
            className="w-full"
          >
            <FileText className="w-4 h-4 mr-2" />
            Preview PDF
          </Button>
          
          <Button
            onClick={() => handleInvoiceGeneration(false)}
            disabled={isGenerating || isSharingWhatsApp || isRefreshingDB}
            variant="outline"
            className="w-full"
          >
            <FileText className="w-4 h-4 mr-2" />
            {isGenerating ? "Generating..." : "Download PDF"}
          </Button>
        </div>
      </div>

      {/* Spare Parts Confirmation Dialog */}
      <Dialog open={showPartsConfirmation} onOpenChange={setShowPartsConfirmation}>
        <DialogContent className="max-w-md mx-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              Confirm Spare Parts
            </DialogTitle>
            <DialogDescription>
              Please verify that these spare parts are correct for this job before generating the invoice:
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-3 max-h-60 overflow-y-auto">
            <div className="text-sm font-medium text-muted-foreground">
              Customer: {jobCard?.customer_name} | Bike: {jobCard?.bike_number}
            </div>
            
            {spareParts && spareParts.length > 0 ? (
              spareParts.map((part: any, index: number) => (
                <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex-1">
                    <div className="font-medium">{part.name}</div>
                    <div className="text-sm text-muted-foreground">
                      Qty: {part.quantity} × ₹{part.price}
                    </div>
                  </div>
                  <div className="text-right font-medium">
                    ₹{(part.price * part.quantity).toFixed(2)}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center text-muted-foreground py-4">
                No spare parts added
              </div>
            )}
            
            {spareParts && spareParts.length > 0 && (
              <div className="flex justify-between items-center pt-2 border-t font-medium">
                <span>Total Parts:</span>
                <span>₹{partsTotal.toFixed(2)}</span>
              </div>
            )}
          </div>
          
          <div className="space-y-3 pt-4">
            <div className="flex items-center gap-2 text-sm text-amber-600 bg-amber-50 p-2 rounded">
              <AlertTriangle className="w-4 h-4" />
              Are these parts correct for this service?
            </div>
            
            <div className="flex gap-2">
              <Button
                onClick={handleEditJobCard}
                variant="outline"
                className="flex-1"
                data-testid="button-edit-job-card"
              >
                <Edit className="w-4 h-4 mr-2" />
                Edit Job Card
              </Button>
              
              <Button
                onClick={handlePartsConfirmed}
                className="flex-1"
                data-testid="button-confirm-parts"
              >
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Confirm & Generate Invoice
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
