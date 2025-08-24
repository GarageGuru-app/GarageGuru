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
  AlertCircle
} from "lucide-react";

export default function AccessRequest() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  
  const [selectedGarageId, setSelectedGarageId] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch available garages for staff access
  const { data: garages, isLoading } = useQuery({
    queryKey: ["/api/garages", "staff_access"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/garages?purpose=staff_access");
      return response.json();
    },
  });

  const handleSubmitRequest = async () => {
    if (!selectedGarageId) {
      toast({
        title: "Garage Selection Required",
        description: "Please select a garage to request access to. Garage selection is mandatory for staff access requests.",
        variant: "destructive",
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
        throw new Error(errorResult.message || "Failed to send request");
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to send access request. Please try again.",
        variant: "destructive",
      });
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
              <Label htmlFor="garage-select" className="text-sm font-medium">
                Select Garage *
              </Label>
              <Select 
                value={selectedGarageId} 
                onValueChange={setSelectedGarageId}
                disabled={isLoading}
              >
                <SelectTrigger data-testid="select-garage" className={!selectedGarageId ? "border-red-300 dark:border-red-700" : ""}>
                  <SelectValue placeholder={isLoading ? "Loading garages..." : "Choose a garage to request access"} />
                </SelectTrigger>
                <SelectContent>
                  {garages?.map((garage: any) => (
                    <SelectItem key={garage.id} value={garage.id}>
                      <div className="flex flex-col">
                        <span className="font-medium">{garage.name}</span>
                        <span className="text-sm text-muted-foreground">
                          Owner: {garage.ownerName}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {!selectedGarageId && (
                <p className="text-sm text-red-600 dark:text-red-400 mt-1 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  Garage selection is required for staff access requests
                </p>
              )}
            </div>

            {/* Message */}
            <div>
              <Label htmlFor="message" className="text-sm font-medium">
                Message (Optional)
              </Label>
              <Textarea
                id="message"
                placeholder="Tell the garage owner why you'd like to work there..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={4}
                data-testid="textarea-message"
              />
              <p className="text-sm text-muted-foreground mt-1">
                Introduce yourself and mention any relevant experience
              </p>
            </div>

            {/* Submit Button */}
            <Button
              onClick={handleSubmitRequest}
              disabled={isSubmitting}
              className="w-full"
              data-testid="button-submit-request"
            >
              {isSubmitting ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Sending Request...</span>
                </div>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Send Access Request
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Information Card */}
        <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950">
          <CardContent className="p-4">
            <div className="flex items-start space-x-2 text-blue-800 dark:text-blue-200">
              <Mail className="w-5 h-5 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium mb-2">What happens next?</p>
                <ul className="space-y-1">
                  <li>• Your request will be sent to the garage admin</li>
                  <li>• They will review your request and contact you</li>
                  <li>• Once approved, you'll be able to access the staff dashboard</li>
                  <li>• You'll receive email notifications about your request status</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Alternative Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Need help?</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              If you don't see the garage you're looking for, ask the garage owner to:
            </p>
            <ul className="text-sm text-muted-foreground space-y-1 ml-4">
              <li>• Register their garage on the platform</li>
              <li>• Provide you with an activation code</li>
              <li>• Contact support for assistance</li>
            </ul>
            
            <div className="pt-2">
              <Button
                variant="outline"
                onClick={() => navigate("/register")}
                size="sm"
                data-testid="button-register-with-code"
              >
                I have an activation code
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}