import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { useTheme } from "@/lib/theme";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { 
  Settings, 
  Moon, 
  Sun, 
  Send,
  Clock,
  Mail,
  Building,
  User,
  MessageSquare,
  CheckCircle,
  AlertCircle,
  Smartphone,
  Monitor,
  Cloud,
  Download,
  CreditCard,
  Wifi,
  WifiOff
} from "lucide-react";

export default function AccessRequest() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  
  const [selectedGarageId, setSelectedGarageId] = useState("");
  const [storageType, setStorageType] = useState("");
  const [message, setMessage] = useState("");
  const [showPricingAlert, setShowPricingAlert] = useState(false);
  const [showInstallAlert, setShowInstallAlert] = useState(false);
  const [pricingAcknowledged, setPricingAcknowledged] = useState(false);
  
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

  const handleStorageTypeChange = (value: string) => {
    setStorageType(value);
    setPricingAcknowledged(false);
    
    // Show appropriate alerts based on storage type
    if (value === "cloud") {
      setShowPricingAlert(true);
    } else if (value === "local_mobile" || value === "local_computer") {
      setShowInstallAlert(true);
    }
  };

  const handleSubmitRequest = async () => {
    // Validate required fields
    if (!selectedGarageId || !storageType) {
      toast({
        title: "Missing Information",
        description: "Please select both garage and storage type.",
        variant: "destructive"
      });
      return;
    }

    // Check pricing acknowledgment for cloud storage
    if (storageType === "cloud" && !pricingAcknowledged) {
      setShowPricingAlert(true);
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await apiRequest("POST", "/api/auth/request-access", {
        email: user?.email,
        name: user?.name,
        requestType: "staff",
        garageId: selectedGarageId,
        storageType: storageType,
        message: message.trim(),
        pricingAcknowledged: pricingAcknowledged,
        installationRequired: storageType.startsWith("local"),
      });

      if (response.ok) {
        const result = await response.json();
        toast({
          title: "Request Sent", 
          description: result.message || "Your access request has been sent successfully.",
        });
        
        // Clear form
        setSelectedGarageId("");
        setStorageType("");
        setMessage("");
        setPricingAcknowledged(false);
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

            {/* Storage Type Selection */}
            <div>
              <Label className="text-base font-medium flex items-center gap-2">
                <Settings className="w-4 h-4" />
                Storage Type <span className="text-red-500">*</span>
              </Label>
              <div className="mt-2">
                <Select value={storageType} onValueChange={handleStorageTypeChange}>
                  <SelectTrigger data-testid="select-storage-type">
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
              {storageType && (
                <div className="mt-3">
                  {storageType === "cloud" && (
                    <Alert className="border-blue-200 bg-blue-50 dark:bg-blue-950">
                      <CreditCard className="w-4 h-4" />
                      <AlertDescription>
                        <strong>Cloud Storage:</strong> ₹499/month • Real-time sync • Multi-device access • Automatic backups • 24/7 support
                      </AlertDescription>
                    </Alert>
                  )}
                  {(storageType === "local_mobile" || storageType === "local_computer") && (
                    <Alert className="border-green-200 bg-green-50 dark:bg-green-950">
                      <Download className="w-4 h-4" />
                      <AlertDescription>
                        <strong>Local Storage:</strong> Completely free • Works offline • Data stays on your device • 
                        {storageType === "local_mobile" ? " Android APK download" : " Desktop app installation"} required
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              )}
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
              disabled={isSubmitting || !selectedGarageId || !storageType}
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
                    Billing starts after approval by garage admin
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
                    {storageType === "local_mobile" 
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