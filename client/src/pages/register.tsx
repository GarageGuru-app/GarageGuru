import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useTheme } from "@/lib/theme";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { ArrowLeft, Settings, Moon, Sun, Mail, Send, Clock, CheckCircle, Wrench, Smartphone, Monitor, Cloud, Download, CreditCard, Wifi } from "lucide-react";
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
    garageId: "",
    storageType: ""
  });
  const [showPricingAlert, setShowPricingAlert] = useState(false);
  const [showInstallAlert, setShowInstallAlert] = useState(false);
  const [pricingAcknowledged, setPricingAcknowledged] = useState(false);
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

  const handleStorageTypeChange = (value: string) => {
    setAccessRequest(prev => ({ ...prev, storageType: value }));
    setPricingAcknowledged(false);
    
    // Show appropriate alerts based on storage type
    if (value === "cloud") {
      setShowPricingAlert(true);
    } else if (value === "local_mobile" || value === "local_computer") {
      setShowInstallAlert(true);
    }
  };

  const handleAccessRequest = async (e: React.FormEvent) => {
    e.preventDefault();

    // For garage admin requests, validate storage type
    if (accessRequest.requestType === "admin" && !accessRequest.storageType) {
      toast({
        title: "Storage Type Required",
        description: "Please select a storage type to continue.",
        variant: "destructive"
      });
      return;
    }

    // Check pricing acknowledgment for cloud storage on admin requests
    if (accessRequest.requestType === "admin" && accessRequest.storageType === "cloud" && !pricingAcknowledged) {
      setShowPricingAlert(true);
      return;
    }

    setIsLoading(true);

    try {
      const requestData = {
        ...accessRequest,
        pricingAcknowledged: pricingAcknowledged,
        installationRequired: accessRequest.storageType?.startsWith("local") || false
      };

      const response = await apiRequest("POST", "/api/auth/request-access", requestData);
      const data = await response.json();

      if (response.ok) {
        setRequestSubmitted(true);
        toast({
          title: "Request Sent Successfully",
          description: "Your access request has been sent to the super admin. You'll receive an email notification once your request is reviewed.",
        });
        setAccessRequest({ email: "", name: "", requestType: "staff", message: "", garageId: "", storageType: "" });
        setPricingAcknowledged(false);
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
      <div className={`min-h-screen ${theme === 'dark' ? 'bg-gray-900 text-white' : 'gradient-header text-primary-foreground'}`}>
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
    <div className={`min-h-screen ${theme === 'dark' ? 'bg-gray-900 text-white' : 'gradient-header text-primary-foreground'}`}>
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/login")}
            className={theme === 'dark' ? "text-white hover:bg-white/10" : "text-primary-foreground hover:bg-white/10"}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className={theme === 'dark' ? "text-white hover:bg-white/10" : "text-primary-foreground hover:bg-white/10"}
          >
            {theme === "dark" ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </Button>
        </div>

        {/* Logo and Title */}
        <div className="text-center mb-8">
          <div className="w-24 h-24 mx-auto mb-4 bg-white rounded-full flex items-center justify-center">
            <Settings className="text-primary text-3xl w-12 h-12" />
          </div>
          <h1 className={`text-3xl font-bold mb-2 ${theme === 'dark' ? 'text-white' : ''}`}>Request Access</h1>
          <p className={theme === 'dark' ? 'text-gray-300' : 'text-blue-100'}>Get started with ServiceGuru</p>
        </div>

        {/* Access Request Form */}
        <Card className="bg-white/10 border-white/20 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Send className="w-5 h-5" />
              Request Access to ServiceGuru
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

              {/* Storage Type Selection - Only for Admin Access */}
              {accessRequest.requestType === "admin" && (
                <div>
                  <Label className="text-sm font-medium flex items-center gap-2 text-white">
                    <Settings className="w-4 h-4" />
                    Storage Type <span className="text-red-400">*</span>
                  </Label>
                  <div className="mt-2">
                    <Select value={accessRequest.storageType} onValueChange={handleStorageTypeChange}>
                      <SelectTrigger className="bg-white/10 border-white/20 text-white focus:border-white/50" data-testid="select-storage-type">
                        <SelectValue placeholder="Choose your preferred storage method..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="local_mobile">
                          <div className="flex items-center gap-2">
                            <Smartphone className="w-4 h-4" />
                            <div className="flex flex-col">
                              <span>Local Mobile App</span>
                              <span className="text-xs text-muted-foreground">Free • Offline capable • Android APK</span>
                            </div>
                          </div>
                        </SelectItem>
                        <SelectItem value="local_computer">
                          <div className="flex items-center gap-2">
                            <Monitor className="w-4 h-4" />
                            <div className="flex flex-col">
                              <span>Local Computer</span>
                              <span className="text-xs text-muted-foreground">Free • Offline capable • Desktop App</span>
                            </div>
                          </div>
                        </SelectItem>
                        <SelectItem value="cloud">
                          <div className="flex items-center gap-2">
                            <Cloud className="w-4 h-4" />
                            <div className="flex flex-col">
                              <span>Cloud Storage</span>
                              <span className="text-xs text-muted-foreground">Paid • Always online • Multi-device</span>
                            </div>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {/* Storage Type Information */}
                  {accessRequest.storageType && (
                    <div className="mt-3">
                      {accessRequest.storageType === "cloud" && (
                        <Alert className="border-blue-200/50 bg-blue-900/30">
                          <CreditCard className="w-4 h-4" />
                          <AlertDescription className="text-blue-100">
                            <strong>Cloud Storage:</strong> ₹499/month • Real-time sync • Multi-device access • Automatic backups • 24/7 support
                          </AlertDescription>
                        </Alert>
                      )}
                      {(accessRequest.storageType === "local_mobile" || accessRequest.storageType === "local_computer") && (
                        <Alert className="border-green-200/50 bg-green-900/30">
                          <Download className="w-4 h-4" />
                          <AlertDescription className="text-green-100">
                            <strong>Local Storage:</strong> Completely free • Works offline • Data stays on your device • 
                            {accessRequest.storageType === "local_mobile" ? " Android APK download" : " Desktop app installation"} required
                          </AlertDescription>
                        </Alert>
                      )}
                    </div>
                  )}
                  
                  {/* Important Note */}
                  <div className="mt-3 p-3 bg-orange-900/30 border border-orange-200/50 rounded-lg">
                    <div className="flex items-start gap-2 text-orange-100">
                      <Wifi className="w-4 h-4 mt-0.5 flex-shrink-0" />
                      <div className="text-xs">
                        <p className="font-medium">Internet Connection Required</p>
                        <p>Initial setup and access requests require internet connection, even for local storage options.</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

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
                    <Wrench className="w-4 h-4 text-primary animate-spin mr-2" />
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

        {/* Pricing Alert Dialog */}
        <AlertDialog open={showPricingAlert} onOpenChange={setShowPricingAlert}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-blue-600" />
                Cloud Storage Pricing
              </AlertDialogTitle>
              <AlertDialogDescription className="space-y-3">
                <p>You've selected <strong>Cloud Storage</strong> which includes:</p>
                <ul className="space-y-1 text-sm">
                  <li>✅ Real-time data synchronization</li>
                  <li>✅ Multi-device access</li>
                  <li>✅ Automatic backups</li>
                  <li>✅ 24/7 technical support</li>
                  <li>✅ Always up-to-date features</li>
                </ul>
                <div className="bg-blue-50 dark:bg-blue-950 p-3 rounded-lg">
                  <p className="font-semibold text-blue-800 dark:text-blue-200">
                    Monthly Subscription: ₹499/month per garage
                  </p>
                  <p className="text-xs text-blue-600 dark:text-blue-300 mt-1">
                    Billing starts after approval by super admin
                  </p>
                </div>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setShowPricingAlert(false)}>
                Choose Different Option
              </AlertDialogCancel>
              <AlertDialogAction 
                onClick={() => {
                  setPricingAcknowledged(true);
                  setShowPricingAlert(false);
                }}
              >
                I Understand - Continue
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Installation Alert Dialog */}
        <AlertDialog open={showInstallAlert} onOpenChange={setShowInstallAlert}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2">
                <Download className="w-5 h-5 text-green-600" />
                Local Storage Setup
              </AlertDialogTitle>
              <AlertDialogDescription className="space-y-3">
                <p>You've selected <strong>Local Storage</strong> - completely free option!</p>
                <ul className="space-y-1 text-sm">
                  <li>✅ No monthly fees</li>
                  <li>✅ Works completely offline</li>
                  <li>✅ Your data stays on your device</li>
                  <li>✅ Fast and responsive</li>
                </ul>
                <div className="bg-green-50 dark:bg-green-950 p-3 rounded-lg">
                  <p className="font-semibold text-green-800 dark:text-green-200">
                    {accessRequest.storageType === "local_mobile" 
                      ? "📱 Android APK installation required"
                      : "💻 Desktop app installation required"
                    }
                  </p>
                  <p className="text-xs text-green-600 dark:text-green-300 mt-1">
                    Download link will be provided after approval
                  </p>
                </div>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setShowInstallAlert(false)}>
                Choose Different Option
              </AlertDialogCancel>
              <AlertDialogAction onClick={() => setShowInstallAlert(false)}>
                Perfect - Continue
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}