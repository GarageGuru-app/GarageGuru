import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Building2, ArrowRight } from "lucide-react";

interface GarageFormData {
  name: string;
  ownerName: string;
  phone: string;
  email: string;
}

export default function GarageSetup() {
  const [, navigate] = useLocation();
  const { user, garage } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Handle redirects in useEffect to avoid render-time navigation
  useEffect(() => {
    if (garage) {
      navigate("/admin-dashboard");
      return;
    }
    
    if (user && user.role !== 'garage_admin') {
      navigate("/admin-dashboard");
      return;
    }
  }, [garage, user?.role]);
  
  // Show loading or return null while redirecting
  if (garage || user?.role !== 'garage_admin') {
    return null;
  }

  const [formData, setFormData] = useState<GarageFormData>({
    name: "",
    ownerName: user?.name || "",
    phone: "",
    email: user?.email || "",
  });

  const createGarageMutation = useMutation({
    mutationFn: async (data: GarageFormData) => {
      const response = await apiRequest("POST", "/api/garages", data);
      return response.json();
    },
    onSuccess: async (garage) => {
      toast({
        title: "Success",
        description: "Garage created successfully! Welcome to ServiceGuru.",
        variant: "default",
      });
      
      // Force refresh of auth context by refetching profile
      try {
        const token = localStorage.getItem("auth-token");
        const response = await apiRequest("GET", "/api/user/profile");
        const data = await response.json();
        
        // This will trigger a page refresh/redirect through auth context
        if (data.garage) {
          window.location.href = "/dashboard";
        }
      } catch (error) {
        console.error("Profile refresh error:", error);
        // Fallback: force page reload
        setTimeout(() => window.location.reload(), 500);
      }
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create garage",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.ownerName || !formData.phone) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }
    createGarageMutation.mutate(formData);
  };

  const handleInputChange = (field: keyof GarageFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-600 to-blue-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="bg-white/95 backdrop-blur-sm border-0 shadow-xl">
          <CardHeader className="text-center space-y-4">
            <div className="w-16 h-16 mx-auto bg-blue-100 rounded-full flex items-center justify-center">
              <Building2 className="w-8 h-8 text-blue-600" />
            </div>
            <div>
              <CardTitle className="text-2xl font-bold text-gray-900">
                Setup Your Garage
              </CardTitle>
              <p className="text-gray-600 mt-2">
                Welcome! Let's set up your garage details to get started.
              </p>
            </div>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name" className="block text-sm font-medium mb-2">
                  Garage Name *
                </Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Enter your garage name"
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  className="w-full"
                  required
                  data-testid="input-garage-name"
                />
              </div>

              <div>
                <Label htmlFor="ownerName" className="block text-sm font-medium mb-2">
                  Owner Name *
                </Label>
                <Input
                  id="ownerName"
                  type="text"
                  placeholder="Enter owner's full name"
                  value={formData.ownerName}
                  onChange={(e) => handleInputChange("ownerName", e.target.value)}
                  className="w-full"
                  required
                  data-testid="input-owner-name"
                />
              </div>

              <div>
                <Label htmlFor="phone" className="block text-sm font-medium mb-2">
                  Phone Number *
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="Enter phone number"
                  value={formData.phone}
                  onChange={(e) => handleInputChange("phone", e.target.value)}
                  className="w-full"
                  required
                  data-testid="input-phone"
                />
              </div>

              <div>
                <Label htmlFor="email" className="block text-sm font-medium mb-2">
                  Email Address
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter email address"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  className="w-full"
                  data-testid="input-email"
                />
              </div>

              <div className="pt-4">
                <Button
                  type="submit"
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                  disabled={createGarageMutation.isPending}
                  data-testid="button-create-garage"
                >
                  {createGarageMutation.isPending ? (
                    "Creating Garage..."
                  ) : (
                    <>
                      Create Garage & Continue
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </>
                  )}
                </Button>
              </div>
            </form>

            <div className="mt-6 text-center">
              <p className="text-xs text-gray-500">
                * Required fields. This information will be used for your garage profile.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}