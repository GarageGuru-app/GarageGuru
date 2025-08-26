import { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Search, User, Phone, FileText, Bike } from "lucide-react";
import { callCustomer } from "@/utils/whatsapp";
import { useToast } from "@/hooks/use-toast";
import AddCustomerDialog from "@/components/AddCustomerDialog";

export default function Customers() {
  const [, navigate] = useLocation();
  const { garage } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");

  const { data: customers = [], isLoading } = useQuery({
    queryKey: ["/api/garages", garage?.id, "customers"],
    queryFn: async () => {
      if (!garage?.id) return [];
      const response = await apiRequest("GET", `/api/garages/${garage.id}/customers`);
      return response.json();
    },
    enabled: !!garage?.id,
  });

  const filteredCustomers = customers.filter((customer: any) =>
    customer.name?.toLowerCase?.()?.includes(searchTerm.toLowerCase()) ||
    customer.phone?.includes(searchTerm) ||
    customer.bikeNumber?.toLowerCase?.()?.includes(searchTerm.toLowerCase())
  );

  const formatLastVisit = (dateString: string | null, totalJobs: number) => {
    if (!dateString || totalJobs === 0) return "No visits yet";
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
    });
  };



  const handleViewInvoices = async (customerId: string) => {
    try {
      const response = await apiRequest("GET", `/api/garages/${garage?.id}/customers/${customerId}/invoices`);
      const invoices = await response.json();
      
      if (invoices.length === 0) {
        alert("No invoices found for this customer");
        return;
      }
      
      // For now, just show the count and open the first PDF if available
      const firstInvoice = invoices[0];
      if (firstInvoice.pdfUrl) {
        window.open(firstInvoice.pdfUrl, '_blank');
      } else {
        alert(`Customer has ${invoices.length} invoice(s) but no PDF available`);
      }
    } catch (error) {
      console.error("Error fetching customer invoices:", error);
      alert("Failed to fetch customer invoices");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="screen-header">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate("/dashboard")}
                className="text-white hover:bg-white/10"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <h2 className="text-lg font-semibold">Customers</h2>
            </div>
            <AddCustomerDialog />
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
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/dashboard")}
              className="text-white hover:bg-white/10"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h2 className="text-lg font-semibold">Customers</h2>
          </div>
          <AddCustomerDialog />
        </div>
      </div>

      <div className="screen-content">
        {/* Search Bar and Stats */}
        <div className="mb-6 space-y-4">
          <div className="relative search-bar-container">
            <Search className="search-icon w-4 h-4" />
            <Input
              type="text"
              placeholder="Search customers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
          
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>
              {searchTerm 
                ? `${filteredCustomers.length} of ${customers.length} customers` 
                : `${customers.length} total customers`
              }
            </span>
            <span>
              Total revenue: ₹{Number(customers.reduce((sum: number, customer: any) => sum + (parseFloat((customer as any).total_spent || customer.totalSpent) || 0), 0) || 0).toLocaleString()}
            </span>
          </div>
        </div>

        {/* Customer List */}
        {filteredCustomers.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <div className="text-muted-foreground">
                {searchTerm ? "No customers found matching your search" : "No customers yet"}
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {filteredCustomers.map((customer: any) => (
              <Card key={customer.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                        <User className="text-primary w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-semibold">{customer.name}</h3>
                        <p className="text-sm text-muted-foreground">{customer.phone}</p>
                        <div className="flex items-center space-x-1 text-sm text-muted-foreground">
                          <Bike className="w-3 h-3" />
                          <span>{(customer as any).bike_number || customer.bikeNumber || 'N/A'}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => callCustomer(customer.phone)}
                        className="w-10 h-10 success-bg hover:bg-green-200 dark:hover:bg-green-900/30"
                      >
                        <Phone className="w-4 h-4 text-green-700 dark:text-green-300" />
                      </Button>
                      
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleViewInvoices(customer.id)}
                        className="w-10 h-10 hover:bg-blue-100 dark:hover:bg-blue-900/30"
                      >
                        <FileText className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      </Button>
                    </div>
                  </div>
                  
                  <div className="mt-3 pt-3 border-t">
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <div>
                        {((customer as any).total_jobs || customer.totalJobs || 0) > 0 ? (
                          <span>Last visit: {formatLastVisit((customer as any).last_visit || customer.lastVisit, (customer as any).total_jobs || customer.totalJobs || 0)}</span>
                        ) : (
                          <span>No visits yet</span>
                        )}
                      </div>
                      <div className="text-right">
                        <div>{(customer as any).total_jobs || customer.totalJobs || 0} visits</div>
                        <div className="font-medium text-primary">₹{Number(parseFloat((customer as any).total_spent || customer.totalSpent) || 0).toLocaleString()}</div>
                      </div>
                    </div>
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