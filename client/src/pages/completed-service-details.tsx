import { useParams, useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, User, Calendar, Phone, FileText, Settings, IndianRupee, Package, Wrench } from "lucide-react";
import { format } from "date-fns";

export default function CompletedServiceDetails() {
  const { id } = useParams();
  const [, navigate] = useLocation();
  const { garage } = useAuth();

  const { data: jobCard, isLoading } = useQuery({
    queryKey: ["/api/garages", garage?.id, "job-cards", id],
    queryFn: async () => {
      if (!garage?.id || !id) return null;
      const response = await apiRequest("GET", `/api/garages/${garage.id}/job-cards/${id}`);
      return await response.json();
    },
    enabled: !!garage?.id && !!id,
  });

  const { data: invoice } = useQuery({
    queryKey: ["/api/garages", garage?.id, "invoices", "by-job-card", id],
    queryFn: async () => {
      if (!garage?.id || !id) return null;
      try {
        const response = await apiRequest("GET", `/api/garages/${garage.id}/invoices`);
        const invoices = await response.json();
        return invoices.find((inv: any) => inv.job_card_id === id);
      } catch {
        return null;
      }
    },
    enabled: !!garage?.id && !!id,
  });

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "dd MMM yyyy, hh:mm a");
    } catch {
      return "Invalid Date";
    }
  };

  const calculateTotals = () => {
    if (!jobCard) return { partsTotal: 0, serviceCharge: 0, total: 0 };
    
    const partsTotal = Array.isArray(jobCard.spare_parts) 
      ? jobCard.spare_parts.reduce((sum: number, part: any) => sum + (part.price * part.quantity), 0)
      : 0;
    const serviceCharge = Number(jobCard.service_charge) || 0;
    const total = partsTotal + serviceCharge;
    
    return { partsTotal, serviceCharge, total };
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="screen-header">
          <div className="flex items-center space-x-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/completed-services")}
              className="text-white hover:bg-white/10"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h2 className="text-lg font-semibold">Service Details</h2>
          </div>
        </div>
        <div className="screen-content flex items-center justify-center">
          <div className="flex flex-col items-center space-y-3">
            <Wrench className="w-8 h-8 text-primary animate-spin" />
            <span className="text-muted-foreground">Loading service details...</span>
          </div>
        </div>
      </div>
    );
  }

  if (!jobCard) {
    return (
      <div className="min-h-screen bg-background">
        <div className="screen-header">
          <div className="flex items-center space-x-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/completed-services")}
              className="text-white hover:bg-white/10"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h2 className="text-lg font-semibold">Service Details</h2>
          </div>
        </div>
        <div className="screen-content">
          <Card>
            <CardContent className="p-8 text-center">
              <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Service Not Found</h3>
              <p className="text-muted-foreground">The requested service details could not be found.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const { partsTotal, serviceCharge, total } = calculateTotals();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="screen-header">
        <div className="flex items-center space-x-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/completed-services")}
            className="text-white hover:bg-white/10"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h2 className="text-lg font-semibold">Service Details</h2>
            <p className="text-sm text-white/80">{jobCard.customer_name} - {jobCard.bike_number}</p>
          </div>
        </div>
      </div>

      <div className="screen-content space-y-4">
        {/* Status and Basic Info */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center space-x-2">
                <User className="w-5 h-5" />
                <span>Customer Information</span>
              </CardTitle>
              <Badge variant="secondary" className="bg-green-100 text-green-800">
                Completed
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div className="flex items-center space-x-2 mb-2">
                  <User className="w-4 h-4 text-muted-foreground" />
                  <span className="font-medium">Customer Name</span>
                </div>
                <p className="text-lg">{jobCard.customer_name}</p>
              </div>
              <div>
                <div className="flex items-center space-x-2 mb-2">
                  <Settings className="w-4 h-4 text-muted-foreground" />
                  <span className="font-medium">Bike Number</span>
                </div>
                <p className="text-lg">{jobCard.bike_number}</p>
              </div>
              <div>
                <div className="flex items-center space-x-2 mb-2">
                  <Phone className="w-4 h-4 text-muted-foreground" />
                  <span className="font-medium">Phone</span>
                </div>
                <p className="text-lg">{jobCard.phone}</p>
              </div>
              <div>
                <div className="flex items-center space-x-2 mb-2">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <span className="font-medium">Completed Date</span>
                </div>
                <p className="text-lg">{formatDate(jobCard.completed_at || jobCard.created_at)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Service Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <FileText className="w-5 h-5" />
              <span>Service Details</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">Original Complaint</h4>
              <p className="text-muted-foreground bg-muted p-3 rounded-md">{jobCard.complaint}</p>
            </div>

            {jobCard.work_summary && (
              <div>
                <h4 className="font-medium mb-2">Work Summary</h4>
                <p className="text-muted-foreground bg-muted p-3 rounded-md">{jobCard.work_summary}</p>
              </div>
            )}

            {jobCard.completion_notes && (
              <div>
                <h4 className="font-medium mb-2">Completion Notes</h4>
                <p className="text-muted-foreground bg-muted p-3 rounded-md">{jobCard.completion_notes}</p>
              </div>
            )}

            {jobCard.completed_by && (
              <div>
                <h4 className="font-medium mb-2">Completed By</h4>
                <p className="text-muted-foreground">{jobCard.completed_by}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Spare Parts Used */}
        {Array.isArray(jobCard.spare_parts) && jobCard.spare_parts.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Package className="w-5 h-5" />
                <span>Spare Parts Used</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {jobCard.spare_parts.map((part: any, index: number) => (
                  <div key={index} className="flex justify-between items-center p-3 border rounded-md">
                    <div className="flex-1">
                      <h4 className="font-medium">{part.name}</h4>
                      {part.partNumber && (
                        <p className="text-sm text-muted-foreground">Part Number: {part.partNumber}</p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Qty: {part.quantity}</p>
                      <p className="font-medium">₹{part.price} each</p>
                      <p className="text-sm font-semibold">₹{(part.price * part.quantity).toFixed(2)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Billing Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <IndianRupee className="w-5 h-5" />
              <span>Billing Summary</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between text-sm">
              <span>Parts Total:</span>
              <span>₹{partsTotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Service Charge:</span>
              <span>₹{serviceCharge.toFixed(2)}</span>
            </div>
            <Separator />
            <div className="flex justify-between text-lg font-semibold">
              <span>Total Amount:</span>
              <span className="text-primary">₹{total.toFixed(2)}</span>
            </div>
            
            {invoice && (
              <div className="mt-4 pt-3 border-t border-border">
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Invoice Number:</span>
                  <span>{invoice.invoice_number}</span>
                </div>
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>WhatsApp Status:</span>
                  <span>{invoice.whatsapp_sent ? "Sent" : "Not Sent"}</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}