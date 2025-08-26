import { useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertJobCardSchema } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { useBarcodeScanner } from "@/hooks/use-barcode-scanner";
import { ArrowLeft, Plus, Trash2, Save, Loader2, QrCode } from "lucide-react";
import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import * as z from "zod";

const formSchema = insertJobCardSchema.extend({
  complaint: z.string().min(1, "Complaint/service description is required"),
});

type FormData = z.infer<typeof formSchema>;

interface SparePart {
  id: string;
  partNumber: string;
  name: string;
  quantity: number;
  price: number;
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

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      customerName: "",
      phone: "",
      bikeNumber: "",
      complaint: "",
      spareParts: [],
      serviceCharge: "0",
      totalAmount: "0"
    },
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
    mutationFn: async (data: FormData) => {
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

  // Populate form when job card data is loaded
  useEffect(() => {
    if (jobCard) {
      console.log('Loading job card data:', jobCard);
      const spareParts = Array.isArray(jobCard.spare_parts) ? jobCard.spare_parts : 
                        (typeof jobCard.spare_parts === 'string' ? JSON.parse(jobCard.spare_parts || '[]') : []);
      
      form.reset({
        customerName: jobCard.customer_name || "",
        phone: jobCard.phone || "",
        bikeNumber: jobCard.bike_number || "",
        complaint: jobCard.complaint || "",
        spareParts: spareParts,
        serviceCharge: jobCard.service_charge?.toString() || "0",
        totalAmount: jobCard.total_amount?.toString() || "0"
      });
    }
  }, [jobCard]);  // Removed 'form' from dependencies to prevent infinite loop

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

  const watchedSpareParts = form.watch("spareParts");
  const watchedServiceCharge = form.watch("serviceCharge");

  // Calculate totals
  useEffect(() => {
    const partsTotal = watchedSpareParts?.reduce((sum, part) => sum + (part.price * part.quantity), 0) || 0;
    const serviceCharge = parseFloat(watchedServiceCharge || "0");
    form.setValue("totalAmount", (partsTotal + serviceCharge).toString());
  }, [watchedSpareParts, watchedServiceCharge]);  // Removed 'form' from dependencies

  const addSparePart = (part: any) => {
    const currentParts = form.getValues("spareParts") || [];
    const existingPartIndex = currentParts.findIndex((p) => p.id === part.id);
    
    if (existingPartIndex >= 0) {
      const updatedParts = [...currentParts];
      updatedParts[existingPartIndex].quantity += 1;
      form.setValue("spareParts", updatedParts);
    } else {
      form.setValue("spareParts", [
        ...currentParts,
        {
          id: part.id,
          partNumber: part.part_number || "",
          name: part.name,
          quantity: 1,
          price: parseFloat(part.price || "0")
        }
      ]);
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
    const currentParts = form.getValues("spareParts") || [];
    form.setValue("spareParts", currentParts.filter((_, i) => i !== index));
  };

  const updateSparePartQuantity = (index: number, quantity: number) => {
    if (quantity <= 0) return;
    const currentParts = form.getValues("spareParts") || [];
    const updatedParts = [...currentParts];
    updatedParts[index].quantity = quantity;
    form.setValue("spareParts", updatedParts);
  };

  const onSubmit = (data: FormData) => {
    updateJobCardMutation.mutate(data);
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
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Customer Information */}
            <Card>
              <CardHeader>
                <CardTitle>Customer Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="customerName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Customer Name</FormLabel>
                      <FormControl>
                        <Input {...field} disabled />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone Number</FormLabel>
                      <FormControl>
                        <Input {...field} disabled />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="bikeNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Bike Number</FormLabel>
                      <FormControl>
                        <Input {...field} disabled />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Service Details */}
            <Card>
              <CardHeader>
                <CardTitle>Service Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="complaint"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Complaint / Service Description</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          placeholder="Describe the service or complaint...\nPress Enter to create checklist items"
                          className="min-h-20"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              const currentValue = field.value || '';
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
                                field.onChange(newValue);
                                
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
                          onChange={(e) => {
                            const value = e.target?.value || '';
                            field.onChange(value);
                          }}
                        />
                      </FormControl>
                      <div className="text-xs text-muted-foreground mt-1">
                        Press Enter to create checklist items • Click ☐/☑ to toggle completion
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="serviceCharge"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Service Charge (₹)</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="0.00"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
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
                    <FormLabel>Add Spare Parts</FormLabel>
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
                {watchedSpareParts && watchedSpareParts.length > 0 && (
                  <div className="space-y-3">
                    <FormLabel>Selected Parts</FormLabel>
                    {watchedSpareParts.map((part, index) => (
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
                    <span>₹{(watchedSpareParts?.reduce((sum, part) => sum + (part.price * part.quantity), 0) || 0).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Service Charge:</span>
                    <span>₹{parseFloat(watchedServiceCharge || "0").toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-lg font-semibold border-t pt-2">
                    <span>Total Amount:</span>
                    <span>₹{form.watch("totalAmount") || "0"}</span>
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
        </Form>
      </div>
    </div>
  );
}