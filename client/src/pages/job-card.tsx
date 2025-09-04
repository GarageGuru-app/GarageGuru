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
    waterWashCharge: "",
    dieselCharge: "",
    petrolCharge: "",
    foundryCharge: "",
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
    // Auto-format phone number with +91 prefix for India
    if (field === 'phone') {
      let formattedValue = value;
      // Remove any existing country codes and non-numeric characters except +
      formattedValue = formattedValue.replace(/[^\d+]/g, '');
      
      // If user is typing a number without +91, add it automatically
      if (formattedValue && !formattedValue.startsWith('+91') && !formattedValue.startsWith('+')) {
        formattedValue = '+91' + formattedValue;
      }
      // If user typed 91 but missing the +, add it
      else if (formattedValue.startsWith('91') && !formattedValue.startsWith('+91')) {
        formattedValue = '+' + formattedValue;
      }
      
      value = formattedValue;
    }
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleCustomerSelect = (customer: any) => {
    setSelectedCustomer(customer);
    
    // Format phone number with +91 when selecting existing customer
    let formattedPhone = customer.phone || '';
    if (formattedPhone && !formattedPhone.startsWith('+91') && !formattedPhone.startsWith('+')) {
      formattedPhone = '+91' + formattedPhone.replace(/[^\d]/g, '');
    }
    
    setFormData(prev => ({
      ...prev,
      customerName: customer.name,
      phone: formattedPhone,
      bikeNumber: customer.bikeNumber || customer.bike_number
    }));
  };

  const addSparePart = () => {
    setSelectedParts(prev => [...prev, { id: "", partNumber: "", name: "", quantity: 1, price: 0 }]);
  };

  const reserveInventory = async (partId: string, quantity: number) => {
    try {
      const response = await fetch(`/api/garages/${garage?.id}/spare-parts/${partId}/reserve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ quantity })
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message);
      }
      
      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Inventory reservation failed:', error);
      throw error;
    }
  };

  const releaseInventory = async (partId: string, quantity: number) => {
    try {
      await fetch(`/api/garages/${garage?.id}/spare-parts/${partId}/release`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ quantity })
      });
    } catch (error) {
      console.error('Inventory release failed:', error);
    }
  };

  const updateSparePart = async (index: number, field: string, value: any) => {
    if (field === "id") {
      const part = spareParts.find((p: any) => p.id === value);
      if (part) {
        try {
          // Reserve 1 unit immediately when part is selected
          await reserveInventory(part.id, 1);
          
          setSelectedParts(prev => {
            const updated = [...prev];
            updated[index] = {
              id: part.id,
              partNumber: part.partNumber,
              name: part.name,
              quantity: 1,
              price: Number(part.price),
            };
            return updated;
          });
          
          toast({
            title: "Part Reserved",
            description: `${part.name} reserved from inventory`,
          });
        } catch (error) {
          toast({
            title: "Reservation Failed",
            description: error.message,
            variant: "destructive",
          });
        }
      }
    } else if (field === "quantity") {
      const currentPart = selectedParts[index];
      if (currentPart.id && value !== currentPart.quantity) {
        const quantityDiff = value - currentPart.quantity;
        
        try {
          if (quantityDiff > 0) {
            // Reserve additional units
            await reserveInventory(currentPart.id, quantityDiff);
            toast({
              title: "Additional Units Reserved",
              description: `${quantityDiff} more ${currentPart.name} reserved`,
            });
          } else {
            // Release units back to inventory
            await releaseInventory(currentPart.id, Math.abs(quantityDiff));
            toast({
              title: "Units Released",
              description: `${Math.abs(quantityDiff)} ${currentPart.name} returned to inventory`,
            });
          }
          
          setSelectedParts(prev => {
            const updated = [...prev];
            updated[index] = { ...updated[index], [field]: value };
            return updated;
          });
        } catch (error) {
          toast({
            title: "Inventory Update Failed",
            description: error.message,
            variant: "destructive",
          });
        }
      } else {
        setSelectedParts(prev => {
          const updated = [...prev];
          updated[index] = { ...updated[index], [field]: value };
          return updated;
        });
      }
    } else {
      setSelectedParts(prev => {
        const updated = [...prev];
        updated[index] = { ...updated[index], [field]: value };
        return updated;
      });
    }
  };

  const removeSparePart = async (index: number) => {
    const partToRemove = selectedParts[index];
    if (partToRemove.id && partToRemove.quantity > 0) {
      // Release the reserved inventory back to stock
      await releaseInventory(partToRemove.id, partToRemove.quantity);
      toast({
        title: "Inventory Released",
        description: `${partToRemove.quantity} ${partToRemove.name} returned to inventory`,
      });
    }
    
    setSelectedParts(prev => prev.filter((_, i) => i !== index));
  };

  const handleBarcodeScanned = async (barcode: string) => {
    const part = spareParts.find((p: any) => p.barcode === barcode || p.partNumber === barcode || p.part_number === barcode);
    if (part) {
      const existingIndex = selectedParts.findIndex(p => p.id === part.id);
      if (existingIndex >= 0) {
        // Part already exists, increase quantity by 1
        const newQuantity = selectedParts[existingIndex].quantity + 1;
        await updateSparePart(existingIndex, "quantity", newQuantity);
      } else {
        // New part, reserve 1 unit
        try {
          await reserveInventory(part.id, 1);
          
          setSelectedParts(prev => [...prev, {
            id: part.id,
            partNumber: part.partNumber || part.part_number,
            name: part.name,
            quantity: 1,
            price: Number(part.price),
          }]);
          
          toast({
            title: "Part Reserved",
            description: `${part.name} reserved from inventory`,
          });
        } catch (error) {
          toast({
            title: "Reservation Failed",
            description: error.message,
            variant: "destructive",
          });
        }
      }
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
      waterWashCharge: formData.waterWashCharge || "0",
      dieselCharge: formData.dieselCharge || "0",
      petrolCharge: formData.petrolCharge || "0",
      foundryCharge: formData.foundryCharge || "0",
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
                onChange={(e) => {
                  const newValue = e.target.value;
                  
                  // Auto-convert to checkbox when user types after some characters
                  if (newValue.length > 3 && newValue.endsWith(' ') && !newValue.includes('☐') && !newValue.includes('☑')) {
                    // Convert the current line to a checkbox format
                    const lines = newValue.split('\n');
                    const lastLineIndex = lines.length - 1;
                    const lastLine = lines[lastLineIndex];
                    
                    if (lastLine && lastLine.trim().length > 2) {
                      lines[lastLineIndex] = `☐ ${lastLine.trim()} `;
                      handleInputChange("complaint", lines.join('\n'));
                      return;
                    }
                  }
                  
                  // Default behavior - just update the value
                  handleInputChange("complaint", newValue);
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
                placeholder="Describe the issue in detail...&#10;Type and press SPACE to create checklist items"
                rows={4}
                required
              />
              <div className="text-xs text-muted-foreground mt-1">
                Type and press SPACE to create checklist items • Click ☐/☑ to toggle completion
              </div>
            </CardContent>
          </Card>

          {/* Charges */}
          <Card>
            <CardHeader>
              <CardTitle>Service & Operational Charges</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Operational Charges */}
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-muted-foreground">Operational Charges (Optional)</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <Label htmlFor="waterWashCharge">Water Wash (₹)</Label>
                    <Input
                      id="waterWashCharge"
                      type="number"
                      min="0"
                      value={formData.waterWashCharge || ""}
                      onChange={(e) => handleInputChange("waterWashCharge", e.target.value)}
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <Label htmlFor="dieselCharge">Diesel (₹)</Label>
                    <Input
                      id="dieselCharge"
                      type="number"
                      min="0"
                      value={formData.dieselCharge || ""}
                      onChange={(e) => handleInputChange("dieselCharge", e.target.value)}
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <Label htmlFor="petrolCharge">Petrol (₹)</Label>
                    <Input
                      id="petrolCharge"
                      type="number"
                      min="0"
                      value={formData.petrolCharge || ""}
                      onChange={(e) => handleInputChange("petrolCharge", e.target.value)}
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <Label htmlFor="foundryCharge">Foundry (₹)</Label>
                    <Input
                      id="foundryCharge"
                      type="number"
                      min="0"
                      value={formData.foundryCharge || ""}
                      onChange={(e) => handleInputChange("foundryCharge", e.target.value)}
                      placeholder="0"
                    />
                  </div>
                </div>
              </div>

              {/* Service Charge */}
              <div className="space-y-2">
                <Label htmlFor="serviceCharge">Service Charge (₹)</Label>
                <Input
                  id="serviceCharge"
                  type="number"
                  step="any"
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
