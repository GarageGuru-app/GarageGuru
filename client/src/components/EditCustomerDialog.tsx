import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Edit } from "lucide-react";

interface EditCustomerDialogProps {
  customer: any;
  trigger?: React.ReactNode;
  onCustomerUpdated?: (customer: any) => void;
}

export default function EditCustomerDialog({ customer, trigger, onCustomerUpdated }: EditCustomerDialogProps) {
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

  // Populate form when customer changes or dialog opens
  useEffect(() => {
    if (customer && open) {
      setFormData({
        name: customer.name || "",
        phone: customer.phone || "",
        bikeNumber: customer.bikeNumber || customer.bike_number || "",
        notes: customer.notes || ""
      });
    }
  }, [customer, open]);

  const updateCustomerMutation = useMutation({
    mutationFn: async (data: any) => {
      if (!garage?.id || !customer?.id) throw new Error("Missing garage or customer ID");
      const response = await apiRequest("PUT", `/api/garages/${garage.id}/customers/${customer.id}`, data);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update customer");
      }
      
      return response.json();
    },
    onSuccess: (updatedCustomer) => {
      toast({
        title: "Success",
        description: "Customer updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/garages", garage?.id, "customers"] });
      onCustomerUpdated?.(updatedCustomer);
      setOpen(false);
    },
    onError: (error: any) => {
      const errorMessage = error.message || "Failed to update customer";
      
      toast({
        title: "Error",
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
    updateCustomerMutation.mutate(formData);
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
      {trigger ? (
        <div onClick={() => setOpen(true)} className="cursor-pointer">
          {trigger}
        </div>
      ) : (
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setOpen(true)}
          className="w-10 h-10 hover:bg-orange-100 dark:hover:bg-orange-900/30"
          data-testid="button-edit-customer"
        >
          <Edit className="w-4 h-4 text-orange-600 dark:text-orange-400" />
        </Button>
      )}
      
      <DialogContent className="sm:max-w-[425px]" data-testid="dialog-edit-customer">
        <DialogHeader>
          <DialogTitle>Edit Customer</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit-name">Customer Name *</Label>
            <Input
              id="edit-name"
              type="text"
              value={formData.name}
              onChange={(e) => handleInputChange("name", e.target.value)}
              placeholder="Enter customer name"
              required
              data-testid="input-edit-customer-name"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="edit-phone">Phone Number *</Label>
            <Input
              id="edit-phone"
              type="tel"
              value={formData.phone}
              onChange={(e) => handleInputChange("phone", e.target.value)}
              placeholder="Enter phone number"
              required
              data-testid="input-edit-customer-phone"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="edit-bikeNumber">Bike Number *</Label>
            <Input
              id="edit-bikeNumber"
              type="text"
              value={formData.bikeNumber}
              onChange={(e) => handleInputChange("bikeNumber", e.target.value)}
              placeholder="Enter bike number"
              required
              data-testid="input-edit-customer-bike"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="edit-notes">Notes (Optional)</Label>
            <Textarea
              id="edit-notes"
              value={formData.notes}
              onChange={(e) => handleInputChange("notes", e.target.value)}
              placeholder="Any additional notes about the customer"
              rows={3}
              data-testid="input-edit-customer-notes"
            />
          </div>
          
          <div className="flex justify-end space-x-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              data-testid="button-cancel-edit"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={updateCustomerMutation.isPending}
              data-testid="button-save-customer"
            >
              {updateCustomerMutation.isPending ? "Updating..." : "Update Customer"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}