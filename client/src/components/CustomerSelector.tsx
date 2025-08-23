import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/supabase";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Search, Plus } from "lucide-react";
import AddCustomerDialog from "./AddCustomerDialog";

interface Customer {
  id: string;
  name: string;
  phone: string;
  bikeNumber: string;
  notes?: string;
}

interface CustomerSelectorProps {
  onCustomerSelect: (customer: Customer) => void;
  selectedCustomer?: Customer | null;
}

export default function CustomerSelector({ onCustomerSelect, selectedCustomer }: CustomerSelectorProps) {
  const { garage } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [showResults, setShowResults] = useState(false);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const { data: searchResults = [] } = useQuery({
    queryKey: ["/api/garages", garage?.id, "customers", "search", debouncedQuery],
    queryFn: async () => {
      if (!garage?.id || !debouncedQuery.trim()) return [];
      const response = await apiRequest("GET", `/api/garages/${garage.id}/customers/search?q=${encodeURIComponent(debouncedQuery)}`);
      return response.json();
    },
    enabled: !!garage?.id && !!debouncedQuery.trim(),
  });

  const handleCustomerSelect = (customer: Customer) => {
    onCustomerSelect(customer);
    setSearchQuery(`${customer.name} - ${customer.bike_number}`);
    setShowResults(false);
  };

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    setShowResults(true);
    
    // Clear selection if user is typing new search
    if (selectedCustomer && value !== `${selectedCustomer.name} - ${selectedCustomer.bikeNumber}`) {
      // Don't clear immediately - let user type
    }
  };

  const handleCustomerCreated = (customer: Customer) => {
    handleCustomerSelect(customer);
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Customer Selection</Label>
        <div className="relative">
          <div className="relative search-bar-container">
            <Search className="search-icon w-4 h-4" />
            <Input
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              onFocus={() => setShowResults(true)}
              placeholder="Search by name, phone, or bike number..."
              className="search-input"
            />
          </div>
          
          {showResults && searchQuery.trim() && (
            <Card className="absolute top-full left-0 right-0 z-50 mt-1 max-h-60 overflow-y-auto">
              <CardContent className="p-0">
                {searchResults.length > 0 ? (
                  <div className="divide-y">
                    {searchResults.map((customer: Customer) => (
                      <button
                        key={customer.id}
                        onClick={() => handleCustomerSelect(customer)}
                        className="w-full text-left p-3 hover:bg-muted transition-colors"
                      >
                        <div className="font-medium">{customer.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {customer.phone} • {customer.bike_number}
                        </div>
                      </button>
                    ))}
                  </div>
                ) : debouncedQuery.trim() ? (
                  <div className="p-3 text-center text-muted-foreground">
                    No customers found matching "{debouncedQuery}"
                  </div>
                ) : null}
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <div className="flex gap-2">
        <AddCustomerDialog
          trigger={
            <Button variant="outline" size="sm" className="flex-1">
              <Plus className="w-4 h-4 mr-2" />
              Add New Customer
            </Button>
          }
          onCustomerCreated={handleCustomerCreated}
        />
      </div>

      {selectedCustomer && (
        <Card>
          <CardContent className="p-4">
            <div className="space-y-2">
              <h4 className="font-medium">Selected Customer</h4>
              <div className="text-sm space-y-1">
                <div><strong>Name:</strong> {selectedCustomer.name}</div>
                <div><strong>Phone:</strong> {selectedCustomer.phone}</div>
                <div><strong>Bike:</strong> {selectedCustomer.bike_number}</div>
                {selectedCustomer.notes && (
                  <div><strong>Notes:</strong> {selectedCustomer.notes}</div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}