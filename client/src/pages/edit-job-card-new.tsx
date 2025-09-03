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
import { HybridScanner } from "@/components/HybridScanner";

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
  waterWashCharge: string;
  dieselCharge: string;
  petrolCharge: string;
  foundryCharge: string;
  totalAmount: string;
}

export default function EditJobCard() {
  const [, navigate] = useLocation();
  const { garage } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  
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
    waterWashCharge: "0",
    dieselCharge: "0",
    petrolCharge: "0",
    foundryCharge: "0",
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
      const serviceCharge = Number(data.serviceCharge || "0");
      const waterWashCharge = Number(data.waterWashCharge || "0");
      const dieselCharge = Number(data.dieselCharge || "0");
      const petrolCharge = Number(data.petrolCharge || "0");
      const foundryCharge = Number(data.foundryCharge || "0");
      const totalAmount = totalPartsAmount + serviceCharge + waterWashCharge + dieselCharge + petrolCharge + foundryCharge;

      console.log('Updating job card with data:', {
        ...data,
        serviceCharge: serviceCharge,
        waterWashCharge: waterWashCharge,
        dieselCharge: dieselCharge,
        petrolCharge: petrolCharge,
        foundryCharge: foundryCharge,
        totalAmount: totalAmount,
      });

      const response = await apiRequest("PUT", `/api/garages/${garage.id}/job-cards/${jobCardId}`, {
        ...data,
        serviceCharge: serviceCharge,
        waterWashCharge: waterWashCharge,
        dieselCharge: dieselCharge,
        petrolCharge: petrolCharge,
        foundryCharge: foundryCharge,
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
        waterWashCharge: jobCard.water_wash_charge?.toString() || "0",
        dieselCharge: jobCard.diesel_charge?.toString() || "0",
        petrolCharge: jobCard.petrol_charge?.toString() || "0",
        foundryCharge: jobCard.foundry_charge?.toString() || "0",
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

  // Calculate totals when spare parts or charges change - using useMemo to prevent loops
  const calculatedTotal = useMemo(() => {
    const partsTotal = formData.spareParts?.reduce((sum, part) => sum + (part.price * part.quantity), 0) || 0;
    const serviceCharge = Number(formData.serviceCharge || "0");
    const waterWashCharge = Number(formData.waterWashCharge || "0");
    const dieselCharge = Number(formData.dieselCharge || "0");
    const petrolCharge = Number(formData.petrolCharge || "0");
    const foundryCharge = Number(formData.foundryCharge || "0");
    return (partsTotal + serviceCharge + waterWashCharge + dieselCharge + petrolCharge + foundryCharge).toString();
  }, [formData.spareParts, formData.serviceCharge, formData.waterWashCharge, formData.dieselCharge, formData.petrolCharge, formData.foundryCharge]);

  const handleInputChange = (field: keyof JobCardFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Handle scan result - similar to new job card
  const handleScanResult = (scannedData: string) => {
    const part = availableParts.find((p: any) => 
      p.partNumber === scannedData || 
      p.name.toLowerCase().includes(scannedData.toLowerCase())
    );
    
    if (part) {
      // Check if part is already added
      const existingIndex = formData.spareParts.findIndex(p => p.id === part.id);
      
      if (existingIndex >= 0) {
        // Increase quantity
        const updatedParts = [...formData.spareParts];
        updatedParts[existingIndex].quantity += 1;
        setFormData(prev => ({ ...prev, spareParts: updatedParts }));
      } else {
        // Add new part
        const newPart: SparePart = {
          id: part.id,
          partNumber: part.partNumber,
          name: part.name,
          quantity: 1,
          price: parseFloat(part.price)
        };
        setFormData(prev => ({ 
          ...prev, 
          spareParts: [...prev.spareParts, newPart] 
        }));
      }
      
      setShowScanner(false);
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
        price: Number(part.price || "0")
      };
      setFormData(prev => ({ ...prev, spareParts: [...prev.spareParts, newPart] }));
    }
    setSearchQuery("");
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
    
    // Clean up complaint by removing empty checklist items
    const cleanedFormData = { ...formData };
    if (cleanedFormData.complaint) {
      const lines = cleanedFormData.complaint.split('\n');
      const cleanedLines = lines.filter(line => {
        const trimmed = line.trim();
        // Keep non-empty lines and lines that aren't just empty checkboxes
        return trimmed && trimmed !== '☐' && trimmed !== '☐ ' && trimmed !== '☑' && trimmed !== '☑ ';
      });
      cleanedFormData.complaint = cleanedLines.join('\n');
    }
    
    updateJobCardMutation.mutate(cleanedFormData);
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
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowScanner(true)}
            className="text-white hover:bg-white/10"
          >
            <QrCode className="w-5 h-5" />
          </Button>
          <Badge variant="secondary" className="warning-bg warning-text">
            Pending
          </Badge>
        </div>
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
                  onBlur={(e) => {
                    // Auto-convert to checklist format when user finishes typing
                    const value = e.target?.value || '';
                    if (value.trim() && !value.includes('☐') && !value.includes('☑')) {
                      const lines = value.split('\n').filter(line => line.trim() !== '');
                      if (lines.length > 0) {
                        const checklistItems = lines.map(line => `☐ ${line.trim()}`);
                        handleInputChange("complaint", checklistItems.join('\n'));
                      }
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      const textareaValue = e.currentTarget?.value || '';
                      const lines = textareaValue.split('\n');
                      const lastLine = lines[lines.length - 1]?.trim();
                      
                      if (lastLine && lastLine !== '') {
                        // Convert all lines to checklist format if not already
                        const checklistItems = lines
                          .filter(line => line.trim() !== '') // Remove empty lines
                          .map(line => {
                            const trimmed = line.trim();
                            if (trimmed.startsWith('☐ ') || trimmed.startsWith('☑ ')) {
                              return line; // Keep existing checklist format
                            }
                            return `☐ ${trimmed}`; // Convert to checklist
                          });
                        
                        // Only add a new empty checklist item
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
                  onClick={(e) => {
                    // Handle checkbox toggling when clicking on checkboxes
                    const textarea = e.currentTarget;
                    const cursorPos = textarea.selectionStart || 0;
                    const textValue = textarea.value;
                    const lines = textValue.split('\n');
                    const currentLineIndex = textValue.substring(0, cursorPos).split('\n').length - 1;
                    const currentLine = lines[currentLineIndex];
                    
                    if (currentLine && (currentLine.includes('☐ ') || currentLine.includes('☑ '))) {
                      const clickX = e.nativeEvent.offsetX;
                      // If click is within first 20 pixels (where checkbox would be)
                      if (clickX <= 20) {
                        e.preventDefault();
                        let updatedLines = [...lines];
                        if (currentLine.includes('☐ ')) {
                          updatedLines[currentLineIndex] = currentLine.replace('☐ ', '☑ ');
                        } else if (currentLine.includes('☑ ')) {
                          updatedLines[currentLineIndex] = currentLine.replace('☑ ', '☐ ');
                        }
                        handleInputChange("complaint", updatedLines.join('\n'));
                      }
                    }
                  }}
                  placeholder="Describe the service or complaint..."
                  className="min-h-20 cursor-text"
                />
              </div>

              {/* Operational Charges */}
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-muted-foreground">Operational Charges (Optional)</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Water Wash (₹)</label>
                    <Input
                      type="number"
                      step="1"
                      min="0"
                      placeholder="0"
                      value={formData.waterWashCharge === "0" ? "" : formData.waterWashCharge}
                      onChange={(e) => {
                        const value = e.target.value;
                        handleInputChange("waterWashCharge", value || "0");
                      }}
                      onFocus={(e) => {
                        if (e.target.value === "0") {
                          e.target.value = "";
                          handleInputChange("waterWashCharge", "");
                        }
                      }}
                      style={{ appearance: "textfield" }}
                      className="[&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Diesel (₹)</label>
                    <Input
                      type="number"
                      step="1"
                      min="0"
                      placeholder="0"
                      value={formData.dieselCharge === "0" ? "" : formData.dieselCharge}
                      onChange={(e) => {
                        const value = e.target.value;
                        handleInputChange("dieselCharge", value || "0");
                      }}
                      onFocus={(e) => {
                        if (e.target.value === "0") {
                          e.target.value = "";
                          handleInputChange("dieselCharge", "");
                        }
                      }}
                      style={{ appearance: "textfield" }}
                      className="[&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Petrol (₹)</label>
                    <Input
                      type="number"
                      step="1"
                      min="0"
                      placeholder="0"
                      value={formData.petrolCharge === "0" ? "" : formData.petrolCharge}
                      onChange={(e) => {
                        const value = e.target.value;
                        handleInputChange("petrolCharge", value || "0");
                      }}
                      onFocus={(e) => {
                        if (e.target.value === "0") {
                          e.target.value = "";
                          handleInputChange("petrolCharge", "");
                        }
                      }}
                      style={{ appearance: "textfield" }}
                      className="[&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Foundry (₹)</label>
                    <Input
                      type="number"
                      step="1"
                      min="0"
                      placeholder="0"
                      value={formData.foundryCharge === "0" ? "" : formData.foundryCharge}
                      onChange={(e) => {
                        const value = e.target.value;
                        handleInputChange("foundryCharge", value || "0");
                      }}
                      onFocus={(e) => {
                        if (e.target.value === "0") {
                          e.target.value = "";
                          handleInputChange("foundryCharge", "");
                        }
                      }}
                      style={{ appearance: "textfield" }}
                      className="[&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Service Charge (₹)</label>
                <Input
                  type="number"
                  step="1"
                  min="0"
                  placeholder="Enter service charge"
                  value={formData.serviceCharge === "0" ? "" : formData.serviceCharge}
                  onChange={(e) => {
                    const value = e.target.value;
                    // Keep the value as-is to prevent floating point precision issues
                    handleInputChange("serviceCharge", value || "0");
                  }}
                  onFocus={(e) => {
                    if (e.target.value === "0") {
                      e.target.value = "";
                      handleInputChange("serviceCharge", "");
                    }
                  }}
                  style={{ appearance: "textfield" }}
                  className="[&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
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
                    onClick={() => setShowScanner(true)}
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
                  <span>₹{Number(formData.serviceCharge || "0").toFixed(2)}</span>
                </div>
                {(Number(formData.waterWashCharge || "0") > 0 || Number(formData.dieselCharge || "0") > 0 || Number(formData.petrolCharge || "0") > 0 || Number(formData.foundryCharge || "0") > 0) && (
                  <>
                    {Number(formData.waterWashCharge || "0") > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Water Wash:</span>
                        <span>₹{Number(formData.waterWashCharge || "0").toFixed(2)}</span>
                      </div>
                    )}
                    {Number(formData.dieselCharge || "0") > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Diesel:</span>
                        <span>₹{Number(formData.dieselCharge || "0").toFixed(2)}</span>
                      </div>
                    )}
                    {Number(formData.petrolCharge || "0") > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Petrol:</span>
                        <span>₹{Number(formData.petrolCharge || "0").toFixed(2)}</span>
                      </div>
                    )}
                    {Number(formData.foundryCharge || "0") > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Foundry:</span>
                        <span>₹{Number(formData.foundryCharge || "0").toFixed(2)}</span>
                      </div>
                    )}
                  </>
                )}
                <div className="flex justify-between text-lg font-semibold border-t pt-2">
                  <span>Total Amount:</span>
                  <span>₹{Number(calculatedTotal).toFixed(2)}</span>
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

      {/* HybridScanner Component */}
      <HybridScanner
        isOpen={showScanner}
        onClose={() => setShowScanner(false)}
        onScan={handleScanResult}
      />
    </div>
  );
}