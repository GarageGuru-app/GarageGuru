import { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, QrCode, Plus, Trash2, Scan } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { HybridScanner } from "@/components/HybridScanner";
import CustomerSelector from "@/components/CustomerSelector";

interface SparePartUsed {
  id: string;
  partNumber: string;
  name: string;
  quantity: number;
  price: number;
}

export default function JobCard() {
  const [, navigate] = useLocation();
  const { garage } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showScanner, setShowScanner] = useState(false);

  const [formData, setFormData] = useState({
    customerName: "",
    phone: "",
    bikeNumber: "",
    complaint: "",
    serviceCharge: "",
    date: new Date().toISOString().split('T')[0],
  });

  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [selectedParts, setSelectedParts] = useState<SparePartUsed[]>([]);

  const { data: spareParts = [] } = useQuery({
    queryKey: ["/api/garages", garage?.id, "spare-parts"],
    queryFn: async () => {
      if (!garage?.id) return [];
      const response = await apiRequest("GET", `/api/garages/${garage.id}/spare-parts`);
      return response.json();
    },
    enabled: !!garage?.id,
  });

  const createJobCardMutation = useMutation({
    mutationFn: async (data: any) => {
      if (!garage?.id) throw new Error("No garage selected");
      const response = await apiRequest("POST", `/api/garages/${garage.id}/job-cards`, data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Job card created successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/garages", garage?.id] });
      navigate("/pending-services");
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create job card",
        variant: "destructive",
      });
    },
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleCustomerSelect = (customer: any) => {
    setSelectedCustomer(customer);
    setFormData(prev => ({
      ...prev,
      customerName: customer.name,
      phone: customer.phone,
      bikeNumber: customer.bikeNumber || customer.bike_number
    }));
  };

  const addSparePart = () => {
    setSelectedParts(prev => [...prev, { id: "", partNumber: "", name: "", quantity: 1, price: 0 }]);
  };

  const updateSparePart = (index: number, field: string, value: any) => {
    setSelectedParts(prev => {
      const updated = [...prev];
      if (field === "id") {
        const part = spareParts.find((p: any) => p.id === value);
        if (part) {
          updated[index] = {
            id: part.id,
            partNumber: part.partNumber,
            name: part.name,
            quantity: updated[index].quantity,
            price: Number(part.price),
          };
        }
      } else {
        updated[index] = { ...updated[index], [field]: value };
      }
      return updated;
    });
  };

  const removeSparePart = (index: number) => {
    setSelectedParts(prev => prev.filter((_, i) => i !== index));
  };

  const handleBarcodeScanned = (barcode: string) => {
    const part = spareParts.find((p: any) => p.barcode === barcode || p.partNumber === barcode || p.part_number === barcode);
    if (part) {
      const existingIndex = selectedParts.findIndex(p => p.id === part.id);
      if (existingIndex >= 0) {
        updateSparePart(existingIndex, "quantity", selectedParts[existingIndex].quantity + 1);
      } else {
        setSelectedParts(prev => [...prev, {
          id: part.id,
          partNumber: part.partNumber || part.part_number,
          name: part.name,
          quantity: 1,
          price: Number(part.price),
        }]);
      }
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedCustomer) {
      toast({
        title: "Error",
        description: "Please select a customer",
        variant: "destructive",
      });
      return;
    }

    if (!formData.complaint) {
      toast({
        title: "Error",
        description: "Please enter complaint description",
        variant: "destructive",
      });
      return;
    }

    // Calculate only spare parts total
    const partsTotal = selectedParts.reduce((sum, part) => sum + (part.price * part.quantity), 0);
    // Use the actual service charge from form data (should be entered separately)
    const serviceCharge = parseFloat(formData.serviceCharge || '0');
    const totalAmount = partsTotal + serviceCharge;
    
    // Clean up complaint by removing empty checklist items
    let cleanedComplaint = formData.complaint;
    if (cleanedComplaint) {
      const lines = cleanedComplaint.split('\n');
      const cleanedLines = lines.filter(line => {
        const trimmed = line.trim();
        // Keep non-empty lines and lines that aren't just empty checkboxes
        return trimmed && trimmed !== '☐' && trimmed !== '☐ ' && trimmed !== '☑' && trimmed !== '☑ ';
      });
      cleanedComplaint = cleanedLines.join('\n');
    }
    
    const submitData = {
      customerName: selectedCustomer.name,
      phone: selectedCustomer.phone,
      bikeNumber: selectedCustomer.bikeNumber || selectedCustomer.bike_number,
      complaint: cleanedComplaint,
      spareParts: selectedParts,
      serviceCharge: serviceCharge.toString(),
      totalAmount: totalAmount.toString(),
    };

    createJobCardMutation.mutate(submitData);
  };

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
          <h2 className="text-lg font-semibold">New Job Card</h2>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setShowScanner(true)}
          className="text-white hover:bg-white/10"
        >
          <QrCode className="w-5 h-5" />
        </Button>
      </div>

      <div className="screen-content">
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Customer Details */}
          <Card>
            <CardHeader>
              <CardTitle>Customer Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <CustomerSelector
                onCustomerSelect={handleCustomerSelect}
                selectedCustomer={selectedCustomer}
              />

              <div>
                <Label htmlFor="date">Date</Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => handleInputChange("date", e.target.value)}
                  required
                />
              </div>
            </CardContent>
          </Card>

          {/* Complaint Description */}
          <Card>
            <CardHeader>
              <CardTitle>Complaint Description</CardTitle>
            </CardHeader>
            <CardContent>
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
                placeholder="Describe the issue in detail...&#10;Press Enter to create checklist items"
                rows={4}
                required
              />
              <div className="text-xs text-muted-foreground mt-1">
                Press Enter to create checklist items • Click ☐/☑ to toggle completion
              </div>
            </CardContent>
          </Card>

          {/* Service Charge */}
          <Card>
            <CardHeader>
              <CardTitle>Service Charge</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="serviceCharge">Service Charge (₹)</Label>
                <Input
                  id="serviceCharge"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.serviceCharge}
                  onChange={(e) => handleInputChange("serviceCharge", e.target.value)}
                  placeholder="Enter service charge amount..."
                />
                <div className="text-xs text-muted-foreground">
                  Enter the labor/service charges separate from spare parts cost
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Spare Parts */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Spare Parts Used</CardTitle>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={addSparePart}
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {selectedParts.map((part, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <div className="flex-1">
                    <Select
                      value={part.id}
                      onValueChange={(value) => updateSparePart(index, "id", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select spare part..." />
                      </SelectTrigger>
                      <SelectContent>
                        {spareParts.map((sparePart: any) => (
                          <SelectItem key={sparePart.id} value={sparePart.id}>
                            PN: {sparePart.partNumber} — {sparePart.name} - ₹{sparePart.price}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Input
                    type="number"
                    min="1"
                    value={part.quantity}
                    onChange={(e) => updateSparePart(index, "quantity", parseInt(e.target.value))}
                    className="w-20 [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    style={{ appearance: "textfield" }}
                    placeholder="Qty"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeSparePart(index)}
                    className="text-destructive"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}

              <Button
                type="button"
                variant="outline"
                className="w-full border-dashed"
                onClick={() => setShowScanner(true)}
              >
                <Scan className="w-4 h-4 mr-2" />
                Scan Barcode/QR Code
              </Button>
            </CardContent>
          </Card>

          <Button
            type="submit"
            className="w-full"
            disabled={createJobCardMutation.isPending}
          >
            {createJobCardMutation.isPending ? "Saving..." : "Save Job Card"}
          </Button>
        </form>
      </div>

      {/* HybridScanner Component */}
      <HybridScanner
        isOpen={showScanner}
        onClose={() => setShowScanner(false)}
        onScan={handleBarcodeScanned}
      />
    </div>
  );
}
