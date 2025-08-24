import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useTheme } from "@/lib/theme";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Settings, Moon, Sun, Mail, Send, Clock, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

export default function AccessRequestPage() {
  const [, navigate] = useLocation();
  const { theme, toggleTheme } = useTheme();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [accessRequest, setAccessRequest] = useState({
    email: "",
    name: "",
    requestType: "staff",
    message: "",
    garageId: ""
  });
  const [availableGarages, setAvailableGarages] = useState<any[]>([]);
  const [requestSubmitted, setRequestSubmitted] = useState(false);

  useEffect(() => {
    // Fetch available garages for staff access request
    const fetchGarages = async () => {
      try {
        const response = await apiRequest("GET", "/api/garages?purpose=staff_access");
        const garages = await response.json();
        setAvailableGarages(garages);
      } catch (error) {
        console.error("Failed to fetch garages:", error);
      }
    };

    if (accessRequest.requestType === "staff") {
      fetchGarages();
    }
  }, [accessRequest.requestType]);

  const handleAccessRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await apiRequest("POST", "/api/auth/request-access", accessRequest);
      const data = await response.json();

      if (response.ok) {
        setRequestSubmitted(true);
        toast({
          title: "Request Sent Successfully",
          description: "Your access request has been sent to the super admin. You'll receive an email notification once your request is reviewed.",
        });
        setAccessRequest({ email: "", name: "", requestType: "staff", message: "", garageId: "" });
      } else {
        // Handle specific garage selection error
        if (data.message && data.message.includes("Garage selection is required")) {
          toast({
            title: "Garage Selection Required",
            description: "Please select a garage from the dropdown above to continue with your access request.",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Request Failed", 
            description: data.message || "Failed to send access request. Please try again.",
            variant: "destructive",
          });
        }
      }
    } catch (error) {
      toast({
        title: "Request Failed",
        description: "Failed to send access request. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (requestSubmitted) {
    return (
      <div className="gradient-header text-primary-foreground min-h-screen">
        <div className="flex flex-col h-full justify-center px-6">
          {/* Header */}
          <div className="absolute top-4 left-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                setRequestSubmitted(false);
                navigate("/login");
              }}
              className="text-primary-foreground hover:bg-white/10"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </div>

          <div className="absolute top-4 right-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              className="text-primary-foreground hover:bg-white/10"
            >
              {theme === "dark" ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </Button>
          </div>

          {/* Success Message */}
          <div className="text-center mb-8">
            <div className="w-24 h-24 mx-auto mb-4 bg-green-500 rounded-full flex items-center justify-center">
              <CheckCircle className="text-white text-3xl w-12 h-12" />
            </div>
            <h1 className="text-3xl font-bold mb-2">Request Sent!</h1>
            <p className="text-blue-100 mb-4">Your access request has been submitted successfully.</p>
            
            <Card className="bg-white/10 border-white/20 backdrop-blur-sm">
              <CardContent className="p-6">
                <div className="space-y-4 text-left">
                  <div className="flex items-center gap-3">
                    <Mail className="w-5 h-5 text-yellow-300" />
                    <span>You'll receive an email notification once reviewed</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Clock className="w-5 h-5 text-yellow-300" />
                    <span>Processing typically takes 24-48 hours</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-green-300" />
                    <span>You'll get login credentials if approved</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="mt-6">
              <Button
                onClick={() => navigate("/login")}
                className="bg-white text-primary hover:bg-white/90"
                data-testid="button-back-to-login"
              >
                Back to Login
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="gradient-header text-primary-foreground min-h-screen">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/login")}
            className="text-primary-foreground hover:bg-white/10"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className="text-primary-foreground hover:bg-white/10"
          >
            {theme === "dark" ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </Button>
        </div>

        {/* Logo and Title */}
        <div className="text-center mb-8">
          <div className="w-24 h-24 mx-auto mb-4 bg-white rounded-full flex items-center justify-center">
            <Settings className="text-primary text-3xl w-12 h-12" />
          </div>
          <h1 className="text-3xl font-bold mb-2">Request Access</h1>
          <p className="text-blue-100">Get started with GarageGuru</p>
        </div>

        {/* Access Request Form */}
        <Card className="bg-white/10 border-white/20 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Send className="w-5 h-5" />
              Request Access to GarageGuru
            </CardTitle>
            <CardDescription className="text-blue-100">
              Submit your request to get access to the garage management system. A super admin will review and approve your request.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAccessRequest} className="space-y-4">
              <div>
                <Label htmlFor="requestEmail" className="block text-sm font-medium mb-2">
                  Email Address
                </Label>
                <Input
                  id="requestEmail"
                  type="email"
                  placeholder="Enter your email"
                  value={accessRequest.email}
                  onChange={(e) => setAccessRequest(prev => ({ ...prev, email: e.target.value }))}
                  className="bg-white/10 border-white/20 placeholder-white/70 text-white focus:border-white/50"
                  required
                  data-testid="input-email"
                />
              </div>

              <div>
                <Label htmlFor="requestName" className="block text-sm font-medium mb-2">
                  Your Name
                </Label>
                <Input
                  id="requestName"
                  type="text"
                  placeholder="Enter your full name"
                  value={accessRequest.name}
                  onChange={(e) => setAccessRequest(prev => ({ ...prev, name: e.target.value }))}
                  className="bg-white/10 border-white/20 placeholder-white/70 text-white focus:border-white/50"
                  required
                  data-testid="input-name"
                />
              </div>

              <div>
                <Label htmlFor="requestType" className="block text-sm font-medium mb-2">
                  Access Type Requested
                </Label>
                <Select 
                  value={accessRequest.requestType} 
                  onValueChange={(value) => setAccessRequest(prev => ({ ...prev, requestType: value, garageId: "" }))}
                >
                  <SelectTrigger className="bg-white/10 border-white/20 text-white focus:border-white/50" data-testid="select-access-type">
                    <SelectValue placeholder="Select access type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="staff">Staff Access</SelectItem>
                    <SelectItem value="admin">Admin Access</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {accessRequest.requestType === "staff" && (
                <div>
                  <Label htmlFor="garageSelection" className="block text-sm font-medium mb-2">
                    Select Garage to Join
                  </Label>
                  <Select 
                    value={accessRequest.garageId} 
                    onValueChange={(value) => setAccessRequest(prev => ({ ...prev, garageId: value }))}
                  >
                    <SelectTrigger className="bg-white/10 border-white/20 text-white focus:border-white/50" data-testid="select-garage">
                      <SelectValue placeholder="Choose garage to work with" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableGarages.map((garage) => (
                        <SelectItem key={garage.id} value={garage.id}>
                          {garage.name} - {garage.owner_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {availableGarages.length === 0 && (
                    <p className="text-yellow-400 text-xs mt-1">
                      No garages available. Contact admin to create a garage first.
                    </p>
                  )}
                  {!accessRequest.garageId && availableGarages.length > 0 && (
                    <p className="text-yellow-200 text-xs mt-1">
                      Please select a garage to enable the submit button
                    </p>
                  )}
                </div>
              )}

              <div>
                <Label htmlFor="requestMessage" className="block text-sm font-medium mb-2">
                  Message (Optional)
                </Label>
                <Textarea
                  id="requestMessage"
                  placeholder="Explain why you need access to the garage management system"
                  value={accessRequest.message}
                  onChange={(e) => setAccessRequest(prev => ({ ...prev, message: e.target.value }))}
                  className="bg-white/10 border-white/20 placeholder-white/70 text-white focus:border-white/50 resize-none"
                  rows={3}
                  data-testid="textarea-message"
                />
              </div>

              <Button
                type="submit"
                className="w-full bg-white text-primary hover:bg-white/90 font-medium"
                disabled={
                  isLoading || 
                  !accessRequest.email || 
                  !accessRequest.name ||
                  (accessRequest.requestType === "staff" && !accessRequest.garageId)
                }
                data-testid="button-submit-request"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mr-2" />
                    Sending Request...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Send Access Request
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Information Card */}
        <Card className="bg-white/5 border-white/10 backdrop-blur-sm mt-6">
          <CardContent className="p-4">
            <h3 className="text-white font-medium mb-2">What happens next?</h3>
            <div className="space-y-2 text-sm text-blue-100">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-300 rounded-full" />
                <span>Super admin receives email notification</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-300 rounded-full" />
                <span>Request reviewed within 24-48 hours</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-300 rounded-full" />
                <span>You'll receive approval/denial email</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-300 rounded-full" />
                <span>If approved, you'll get login credentials</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}