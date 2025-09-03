import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Plus } from "lucide-react";

interface AddCustomerDialogProps {
  trigger?: React.ReactNode;
  onCustomerCreated?: (customer: any) => void;
}

export default function AddCustomerDialog({ trigger, onCustomerCreated }: AddCustomerDialogProps) {
  const { garage } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    bikeNumber: "",
    notes: ""
  });

  const createCustomerMutation = useMutation({
    mutationFn: async (data: any) => {
      if (!garage?.id) throw new Error("No garage selected");
      const response = await apiRequest("POST", `/api/garages/${garage.id}/customers`, data);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to create customer");
      }
      
      return response.json();
    },
    onSuccess: (customer) => {
      toast({
        title: "Success",
        description: "Customer added successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/garages", garage?.id, "customers"] });
      onCustomerCreated?.(customer);
      setOpen(false);
      setFormData({ name: "", phone: "", bikeNumber: "", notes: "" });
    },
    onError: (error: any) => {
      const errorMessage = error.message || "Failed to add customer";
      
      toast({
        title: "Duplicate Customer",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.phone || !formData.bikeNumber) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }
    createCustomerMutation.mutate(formData);
  };

  const handleInputChange = (field: string, value: string) => {
    // Convert bike number to uppercase automatically
    if (field === 'bikeNumber') {
      value = value.toUpperCase();
    }
    // Auto-format phone number with +91 prefix for India
    else if (field === 'phone') {
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

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button className="bg-primary text-white">
            <Plus className="w-4 h-4 mr-2" />
            Add Customer
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add New Customer</DialogTitle>
          <DialogDescription>
            Add a new customer to your garage management system.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Customer Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleInputChange("name", e.target.value)}
              placeholder="Enter customer name"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number *</Label>
            <Input
              id="phone"
              value={formData.phone}
              onChange={(e) => handleInputChange("phone", e.target.value)}
              placeholder="+91 will be added automatically"
              required
              data-testid="input-customer-phone"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="bikeNumber">Bike Number *</Label>
            <Input
              id="bikeNumber"
              value={formData.bikeNumber}
              onChange={(e) => handleInputChange("bikeNumber", e.target.value)}
              placeholder="Enter bike number"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => handleInputChange("notes", e.target.value)}
              placeholder="Additional notes about the customer"
              rows={3}
            />
          </div>
          
          <div className="flex gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={createCustomerMutation.isPending}
              className="flex-1 bg-primary text-white"
            >
              {createCustomerMutation.isPending ? "Adding..." : "Add Customer"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}