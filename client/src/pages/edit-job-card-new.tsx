import { useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import React, { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Plus, Trash2, Save, Loader2, QrCode } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useBarcodeScanner } from "@/hooks/use-barcode-scanner";

interface SparePart {
  id: string;
  partNumber: string;
  name: string;
  quantity: number;
  price: number;
}

interface JobCardFormData {
  customerName: string;
  phone: string;
  bikeNumber: string;
  complaint: string;
  spareParts: SparePart[];
  serviceCharge: string;
  totalAmount: string;
}

export default function EditJobCard() {
  const [, navigate] = useLocation();
  const { garage } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { startScanning } = useBarcodeScanner();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  
  // Get job card ID from URL
  const jobCardId = window.location.pathname.split('/').pop();

  // Form state
  const [formData, setFormData] = useState<JobCardFormData>({
    customerName: "",
    phone: "",
    bikeNumber: "",
    complaint: "",
    spareParts: [],
    serviceCharge: "0",
    totalAmount: "0"
  });

  // Fetch job card data
  const { data: jobCard, isLoading } = useQuery({
    queryKey: ["/api/garages", garage?.id, "job-cards", jobCardId],
    queryFn: async () => {
      if (!garage?.id || !jobCardId) return null;
      const response = await apiRequest("GET", `/api/garages/${garage.id}/job-cards/${jobCardId}`);
      return response.json();
    },
    enabled: !!garage?.id && !!jobCardId,
  });

  // Fetch spare parts for search
  const { data: availableParts = [] } = useQuery({
    queryKey: ["/api/garages", garage?.id, "spare-parts"],
    queryFn: async () => {
      if (!garage?.id) return [];
      const response = await apiRequest("GET", `/api/garages/${garage.id}/spare-parts`);
      return response.json();
    },
    enabled: !!garage?.id,
  });

  // Update job card mutation
  const updateJobCardMutation = useMutation({
    mutationFn: async (data: JobCardFormData) => {
      if (!garage?.id || !jobCardId) throw new Error("Missing garage or job card ID");
      
      const totalPartsAmount = data.spareParts?.reduce((sum, part) => sum + (part.price * part.quantity), 0) || 0;
      const serviceCharge = parseFloat(data.serviceCharge || "0");
      const totalAmount = totalPartsAmount + serviceCharge;

      console.log('Updating job card with data:', {
        ...data,
        serviceCharge: serviceCharge,
        totalAmount: totalAmount,
      });

      const response = await apiRequest("PUT", `/api/garages/${garage.id}/job-cards/${jobCardId}`, {
        ...data,
        serviceCharge: serviceCharge,
        totalAmount: totalAmount,
      });
      
      return response.json();
    },
    onSuccess: (data) => {
      console.log('Job card updated successfully:', data);
      toast({
        title: "Success",
        description: "Job card updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/garages", garage?.id, "job-cards"] });
      navigate("/pending-services");
    },
    onError: (error: any) => {
      console.error('Update job card error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update job card",
        variant: "destructive",
      });
    },
  });

  // Load job card data into form - only once
  useEffect(() => {
    if (jobCard) {
      console.log('Loading job card data:', jobCard);
      const spareParts = Array.isArray(jobCard.spare_parts) ? jobCard.spare_parts : 
                        (typeof jobCard.spare_parts === 'string' ? JSON.parse(jobCard.spare_parts || '[]') : []);
      
      setFormData({
        customerName: jobCard.customer_name || "",
        phone: jobCard.phone || "",
        bikeNumber: jobCard.bike_number || "",
        complaint: jobCard.complaint || "",
        spareParts: spareParts,
        serviceCharge: jobCard.service_charge?.toString() || "0",
        totalAmount: jobCard.total_amount?.toString() || "0"
      });
    }
  }, [jobCard?.id]); // Only depend on job card ID to prevent loops

  // Search spare parts
  useEffect(() => {
    if (searchQuery.length < 2) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    const filtered = availableParts.filter((part: any) =>
      part.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      part.part_number?.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setSearchResults(filtered);
    setIsSearching(false);
  }, [searchQuery, availableParts]);

  // Calculate totals when spare parts or service charge changes - using useMemo to prevent loops
  const calculatedTotal = useMemo(() => {
    const partsTotal = formData.spareParts?.reduce((sum, part) => sum + (part.price * part.quantity), 0) || 0;
    const serviceCharge = parseFloat(formData.serviceCharge || "0");
    return (partsTotal + serviceCharge).toString();
  }, [formData.spareParts, formData.serviceCharge]);

  // Update total only when calculated value changes
  useEffect(() => {
    if (formData.totalAmount !== calculatedTotal) {
      setFormData(prev => ({ ...prev, totalAmount: calculatedTotal }));
    }
  }, [calculatedTotal]); // Only depend on calculated total

  const handleInputChange = (field: keyof JobCardFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const addSparePart = (part: any) => {
    const existingPartIndex = formData.spareParts.findIndex((p) => p.id === part.id);
    
    if (existingPartIndex >= 0) {
      const updatedParts = [...formData.spareParts];
      updatedParts[existingPartIndex].quantity += 1;
      setFormData(prev => ({ ...prev, spareParts: updatedParts }));
    } else {
      const newPart = {
        id: part.id,
        partNumber: part.part_number || "",
        name: part.name,
        quantity: 1,
        price: parseFloat(part.price || "0")
      };
      setFormData(prev => ({ ...prev, spareParts: [...prev.spareParts, newPart] }));
    }
    setSearchQuery("");
  };

  const handleBarcodeScanned = (barcode: string) => {
    const part = availableParts.find((p: any) => p.barcode === barcode);
    if (part) {
      addSparePart(part);
      toast({
        title: "Part Added",
        description: `${part.name} added to job card`,
      });
    } else {
      toast({
        title: "Part Not Found",
        description: "No spare part found with this barcode",
        variant: "destructive",
      });
    }
  };

  const removeSparePart = (index: number) => {
    const updatedParts = formData.spareParts.filter((_, i) => i !== index);
    setFormData(prev => ({ ...prev, spareParts: updatedParts }));
  };

  const updateSparePartQuantity = (index: number, quantity: number) => {
    if (quantity <= 0) return;
    const updatedParts = [...formData.spareParts];
    updatedParts[index].quantity = quantity;
    setFormData(prev => ({ ...prev, spareParts: updatedParts }));
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    updateJobCardMutation.mutate(formData);
  };

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
            <h2 className="text-lg font-semibold">Edit Job Card</h2>
          </div>
        </div>
        <div className="screen-content flex items-center justify-center">
          <div className="flex flex-col items-center space-y-3">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <span className="text-muted-foreground">Loading job card...</span>
          </div>
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
            onClick={() => navigate("/pending-services")}
            className="text-white hover:bg-white/10"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h2 className="text-lg font-semibold">Edit Job Card</h2>
        </div>
        <Badge variant="secondary" className="warning-bg warning-text">
          Pending
        </Badge>
      </div>

      <div className="screen-content">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Customer Information */}
          <Card>
            <CardHeader>
              <CardTitle>Customer Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Customer Name</label>
                <Input 
                  value={formData.customerName} 
                  disabled 
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Phone Number</label>
                <Input 
                  value={formData.phone} 
                  disabled 
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Bike Number</label>
                <Input 
                  value={formData.bikeNumber} 
                  disabled 
                />
              </div>
            </CardContent>
          </Card>

          {/* Service Details */}
          <Card>
            <CardHeader>
              <CardTitle>Service Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Complaint / Service Description</label>
                <Textarea
                  value={formData.complaint}
                  onChange={(e) => handleInputChange("complaint", e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      const textareaValue = e.currentTarget?.value || '';
                      const lines = textareaValue.split('\n').filter(line => line.trim() !== '');
                      const lastLine = textareaValue.split('\n').pop()?.trim();
                      
                      if (lastLine && lastLine !== '') {
                        // Convert current content to checklist format
                        const checklistItems = lines.map(line => 
                          line.trim().startsWith('☐ ') || line.trim().startsWith('☑ ') ? line : `☐ ${line.trim()}`
                        );
                        
                        // Add the new line as a checklist item if it's not empty
                        if (lastLine && !checklistItems.some(item => item.includes(lastLine))) {
                          checklistItems.push(`☐ ${lastLine}`);
                        }
                        
                        const newValue = checklistItems.join('\n') + '\n☐ ';
                        handleInputChange("complaint", newValue);
                        
                        // Position cursor at the end
                        setTimeout(() => {
                          const textarea = e.currentTarget;
                          if (textarea) {
                            textarea.selectionStart = textarea.selectionEnd = newValue.length;
                          }
                        }, 0);
                      }
                    }
                  }}
                  placeholder="Describe the service or complaint..."
                  className="min-h-20"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Service Charge (₹)</label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={formData.serviceCharge}
                  onChange={(e) => handleInputChange("serviceCharge", e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Spare Parts */}
          <Card>
            <CardHeader>
              <CardTitle>Spare Parts</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Search for spare parts */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-sm font-medium">Add Spare Parts</label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => startScanning(handleBarcodeScanned)}
                    className="flex items-center space-x-1"
                  >
                    <QrCode className="w-4 h-4" />
                    <span>Scan</span>
                  </Button>
                </div>
                <div className="relative">
                  <Input
                    type="text"
                    placeholder="Search spare parts..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  {(searchQuery.length >= 2 && searchResults.length > 0) && (
                    <div className="absolute z-10 w-full mt-1 bg-background border rounded-md shadow-lg max-h-60 overflow-auto">
                      {isSearching ? (
                        <div className="p-3 text-center text-muted-foreground">
                          Searching...
                        </div>
                      ) : (
                        searchResults.map((part: any) => (
                          <button
                            key={part.id}
                            type="button"
                            className="w-full px-3 py-2 text-left hover:bg-muted/50 border-b last:border-0"
                            onClick={() => addSparePart(part)}
                          >
                            <div className="flex justify-between items-center">
                              <div>
                                <div className="font-medium">{part.name}</div>
                                {part.part_number && (
                                  <div className="text-sm text-muted-foreground">
                                    PN: {part.part_number}
                                  </div>
                                )}
                              </div>
                              <div className="text-right">
                                <div className="font-medium">₹{part.price}</div>
                                <div className="text-sm text-muted-foreground">
                                  Stock: {part.quantity}
                                </div>
                              </div>
                            </div>
                          </button>
                        ))
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Selected spare parts */}
              {formData.spareParts && formData.spareParts.length > 0 && (
                <div className="space-y-3">
                  <label className="block text-sm font-medium">Selected Parts</label>
                  {formData.spareParts.map((part, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex-1">
                        <div className="font-medium">{part.name}</div>
                        {part.partNumber && (
                          <div className="text-sm text-muted-foreground">
                            PN: {part.partNumber}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="flex items-center space-x-1">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => updateSparePartQuantity(index, part.quantity - 1)}
                            disabled={part.quantity <= 1}
                          >
                            -
                          </Button>
                          <span className="w-8 text-center text-sm">{part.quantity}</span>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => updateSparePartQuantity(index, part.quantity + 1)}
                          >
                            +
                          </Button>
                        </div>
                        <div className="text-right min-w-16">
                          <div className="font-medium">₹{(part.price * part.quantity).toFixed(2)}</div>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeSparePart(index)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Total */}
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Parts Total:</span>
                  <span>₹{(formData.spareParts?.reduce((sum, part) => sum + (part.price * part.quantity), 0) || 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Service Charge:</span>
                  <span>₹{parseFloat(formData.serviceCharge || "0").toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-lg font-semibold border-t pt-2">
                  <span>Total Amount:</span>
                  <span>₹{formData.totalAmount || "0"}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Submit Button */}
          <Button
            type="submit"
            size="lg"
            className="w-full"
            disabled={updateJobCardMutation.isPending}
          >
            {updateJobCardMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Updating...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Update Job Card
              </>
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}