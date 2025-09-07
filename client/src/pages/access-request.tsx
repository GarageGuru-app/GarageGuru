import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useTheme } from "@/context/theme-context";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { 
  Moon, 
  Sun, 
  Send,
  Clock,
  Building,
  User,
  MessageSquare,
  AlertCircle
} from "lucide-react";

export default function AccessRequest() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  
  const [selectedGarageId, setSelectedGarageId] = useState("");
  const [message, setMessage] = useState("");
  
  // Debug garage selection
  console.log("🔍 Debug - selectedGarageId:", selectedGarageId, "Type:", typeof selectedGarageId, "Length:", selectedGarageId?.length);

  // Fetch available garages for staff access
  const { data: garages, isLoading } = useQuery({
    queryKey: ["/api/garages", "staff_access"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/garages?purpose=staff_access");
      return response.json();
    },
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmitRequest = async () => {
    // Validate required fields
    if (!selectedGarageId) {
      toast({
        title: "Missing Information",
        description: "Please select a garage.",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await apiRequest("POST", "/api/auth/request-access", {
        email: user?.email,
        name: user?.name,
        requestType: "staff",
        garageId: selectedGarageId,
        message: message.trim(),
      });

      if (response.ok) {
        const result = await response.json();
        toast({
          title: "Request Sent", 
          description: result.message || "Your access request has been sent successfully.",
        });
        
        // Clear form
        setSelectedGarageId("");
        setMessage("");
      } else {
        const errorResult = await response.json();
        
        // Handle specific garage selection error
        if (errorResult.message && errorResult.message.includes("Garage selection is required")) {
          toast({
            title: "Garage Selection Required",
            description: "Please select a garage from the dropdown above to continue with your access request.",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Error",
            description: errorResult.message || "Failed to send access request. Please try again.",
            variant: "destructive",
          });
        }
        return;
      }
    } catch (error: any) {
      // Handle network or other errors
      if (error.message && error.message.includes("Garage selection is required")) {
        toast({
          title: "Garage Selection Required", 
          description: "Please select a garage from the dropdown above to continue with your access request.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error",
          description: error.message || "Failed to send access request. Please try again.",
          variant: "destructive",
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="gradient-header text-primary-foreground">
        <div className="flex items-center justify-between px-4 py-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
              <Building className="text-primary w-6 h-6" />
            </div>
            <div>
              <h1 className="text-lg font-semibold" data-testid="title-access-request">
                Request Garage Access
              </h1>
              <p className="text-sm text-blue-100">
                Join a garage to start working
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              className="text-primary-foreground hover:bg-white/10"
              data-testid="button-theme-toggle"
            >
              {theme === "dark" ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={logout}
              className="text-primary-foreground hover:bg-white/10"
              data-testid="button-logout"
            >
              Logout
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-4 py-6 max-w-2xl mx-auto space-y-6">
        {/* Status Card */}
        <Card className="border-orange-200 bg-orange-50 dark:bg-orange-950">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2 text-orange-800 dark:text-orange-200">
              <AlertCircle className="w-5 h-5" />
              <div>
                <p className="font-medium">Access Required</p>
                <p className="text-sm">You need to be assigned to a garage before you can start working. Please request access below.</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* User Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Your Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm text-muted-foreground">Name</Label>
                <p className="font-medium" data-testid="text-user-name">{user?.name}</p>
              </div>
              <div>
                <Label className="text-sm text-muted-foreground">Email</Label>
                <p className="font-medium" data-testid="text-user-email">{user?.email}</p>
              </div>
            </div>
            <div>
              <Label className="text-sm text-muted-foreground">Role</Label>
              <p className="font-medium capitalize" data-testid="text-user-role">
                {user?.role?.replace('_', ' ')}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Access Request Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Send className="w-5 h-5" />
              Request Access
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Garage Selection */}
            <div>
              <Label htmlFor="garage-select" className="text-base font-medium flex items-center gap-2">
                <Building className="w-4 h-4" />
                Select Garage
              </Label>
              <Select
                value={selectedGarageId}
                onValueChange={setSelectedGarageId}
              >
                <SelectTrigger className="mt-2" data-testid="select-garage">
                  <SelectValue placeholder="Choose a garage to join..." />
                </SelectTrigger>
                <SelectContent>
                  {isLoading ? (
                    <SelectItem value="" disabled>Loading garages...</SelectItem>
                  ) : garages && garages.length > 0 ? (
                    garages.map((garage: any) => (
                      <SelectItem key={garage.id} value={garage.id} data-testid={`option-garage-${garage.id}`}>
                        {garage.name}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="" disabled>No garages available</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Message */}
            <div>
              <Label htmlFor="message" className="text-base font-medium flex items-center gap-2">
                <MessageSquare className="w-4 h-4" />
                Additional Message
              </Label>
              <Textarea
                id="message"
                placeholder="Tell the garage admin why you'd like to join their team..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="mt-2"
                rows={3}
                data-testid="input-message"
              />
            </div>

            {/* Submit Button */}
            <Button
              onClick={handleSubmitRequest}
              disabled={isSubmitting || !selectedGarageId}
              className="w-full"
              data-testid="button-submit-request"
            >
              {isSubmitting ? (
                <>
                  <Clock className="w-4 h-4 mr-2 animate-spin" />
                  Sending Request...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Send Access Request
                </>
              )}
            </Button>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}