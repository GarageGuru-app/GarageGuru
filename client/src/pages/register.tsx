import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import { useTheme } from "@/lib/theme";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Settings, Moon, Sun, Mail } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Register() {
  const [, navigate] = useLocation();
  const { register } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    name: "",
    activationCode: "",
    garageName: "",
    ownerName: "",
    phone: "",
    selectedGarageId: "",
  });
  const [availableGaragesForStaff, setAvailableGaragesForStaff] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showAccessRequest, setShowAccessRequest] = useState(false);
  const [accessRequest, setAccessRequest] = useState({
    email: "",
    name: "",
    requestType: "staff",
    message: "",
    garageId: ""
  });
  const [availableGarages, setAvailableGarages] = useState<any[]>([]);

  // Check if it's an admin code by the word "ADMIN" in the code
  const isAdmin = formData.activationCode.toUpperCase().includes("ADMIN");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await register(formData);
      navigate("/dashboard");
    } catch (error) {
      toast({
        title: "Registration Failed",
        description: error instanceof Error ? error.message : "Registration failed",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  useEffect(() => {
    // Fetch available garages for staff access request
    const fetchGarages = async () => {
      try {
        const response = await fetch("/api/garages?purpose=staff_access");
        const garages = await response.json();
        setAvailableGarages(garages);
      } catch (error) {
        console.error("Failed to fetch garages:", error);
      }
    };

    if (showAccessRequest) {
      fetchGarages();
    }
  }, [showAccessRequest]);

  useEffect(() => {
    // Fetch available garages for staff registration
    const fetchGaragesForStaff = async () => {
      try {
        const response = await fetch("/api/garages?purpose=staff_access");
        const garages = await response.json();
        setAvailableGaragesForStaff(garages);
      } catch (error) {
        console.error("Failed to fetch garages for staff:", error);
      }
    };

    // Only fetch when it's a staff activation code (not admin)
    if (formData.activationCode && !isAdmin && formData.activationCode.toUpperCase().includes("STAFF")) {
      fetchGaragesForStaff();
    }
  }, [formData.activationCode, isAdmin]);

  const handleAccessRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/request-access", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(accessRequest),
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: "Access Request Sent",
          description: data.message || "Your request has been sent to the super admin. You'll receive an activation code if approved.",
        });
        setShowAccessRequest(false);
        setAccessRequest({ email: "", name: "", requestType: "staff", message: "" });
      } else {
        // Display the actual server error message
        toast({
          title: "Request Failed",
          description: data.message || "Failed to send access request. Please try again.",
          variant: "destructive",
        });
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
          <h2 className="text-lg font-semibold">Register</h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className="text-primary-foreground hover:bg-white/10"
          >
            {theme === "dark" ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </Button>
        </div>

        {/* Access Request Notice */}
        <div className="bg-blue-500/20 border border-blue-400 rounded-lg p-4 mb-6">
          <div className="flex items-center space-x-2">
            <Settings className="w-5 h-5 text-blue-200" />
            <h3 className="font-semibold text-blue-100">Access Request</h3>
          </div>
          <p className="text-blue-200 text-sm mt-2">
            Request access from super admin. If you have an activation code, proceed with registration.
            Without a code, click "Request Access" below.
          </p>
        </div>

        {/* Registration Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="activationCode" className="block text-sm font-medium mb-2">
              Activation Code
            </Label>
            <Input
              id="activationCode"
              type="text"
              placeholder="Enter 8-character activation code (e.g., A1B2C3D4)"
              value={formData.activationCode}
              onChange={(e) => handleInputChange("activationCode", e.target.value)}
              className="bg-white/10 border-white/20 placeholder-white/70 text-white focus:border-white/50"
              required
            />
            <p className="text-xs text-blue-200 mt-1">
              Format: 8-character alphanumeric code<br/>
              <span className="text-green-400">✓ Code is auto-generated when you request access</span>
            </p>
          </div>

          <div>
            <Label htmlFor="name" className="block text-sm font-medium mb-2">
              Full Name
            </Label>
            <Input
              id="name"
              type="text"
              placeholder="Enter your full name"
              value={formData.name}
              onChange={(e) => handleInputChange("name", e.target.value)}
              className="bg-white/10 border-white/20 placeholder-white/70 text-white focus:border-white/50"
              required
            />
          </div>

          <div>
            <Label htmlFor="email" className="block text-sm font-medium mb-2">
              Email
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="Enter your email"
              value={formData.email}
              onChange={(e) => handleInputChange("email", e.target.value)}
              className="bg-white/10 border-white/20 placeholder-white/70 text-white focus:border-white/50"
              required
            />
          </div>

          <div>
            <Label htmlFor="password" className="block text-sm font-medium mb-2">
              Password
            </Label>
            <Input
              id="password"
              type="password"
              placeholder="Enter your password"
              value={formData.password}
              onChange={(e) => handleInputChange("password", e.target.value)}
              className="bg-white/10 border-white/20 placeholder-white/70 text-white focus:border-white/50"
              required
            />
          </div>

          {isAdmin && (
            <>
              <div>
                <Label htmlFor="garageName" className="block text-sm font-medium mb-2">
                  Garage Name
                </Label>
                <Input
                  id="garageName"
                  type="text"
                  placeholder="Enter garage name"
                  value={formData.garageName}
                  onChange={(e) => handleInputChange("garageName", e.target.value)}
                  className="bg-white/10 border-white/20 placeholder-white/70 text-white focus:border-white/50"
                  required
                />
              </div>

              <div>
                <Label htmlFor="ownerName" className="block text-sm font-medium mb-2">
                  Owner Name
                </Label>
                <Input
                  id="ownerName"
                  type="text"
                  placeholder="Enter owner name"
                  value={formData.ownerName}
                  onChange={(e) => handleInputChange("ownerName", e.target.value)}
                  className="bg-white/10 border-white/20 placeholder-white/70 text-white focus:border-white/50"
                  required
                />
              </div>

              <div>
                <Label htmlFor="phone" className="block text-sm font-medium mb-2">
                  Phone Number
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="Enter phone number"
                  value={formData.phone}
                  onChange={(e) => handleInputChange("phone", e.target.value)}
                  className="bg-white/10 border-white/20 placeholder-white/70 text-white focus:border-white/50"
                  required
                />
              </div>
            </>
          )}

          {!isAdmin && formData.activationCode.toUpperCase().includes("STAFF") && (
            <div>
              <Label htmlFor="garageSelection" className="block text-sm font-medium mb-2">
                Select Garage to Join
              </Label>
              <Select 
                value={formData.selectedGarageId} 
                onValueChange={(value) => handleInputChange("selectedGarageId", value)}
              >
                <SelectTrigger className="bg-white/10 border-white/20 text-white focus:border-white/50">
                  <SelectValue placeholder="Choose garage to work with" />
                </SelectTrigger>
                <SelectContent>
                  {availableGaragesForStaff.map((garage) => (
                    <SelectItem key={garage.id} value={garage.id}>
                      {garage.name} - {garage.owner_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {availableGaragesForStaff.length === 0 && (
                <p className="text-yellow-400 text-xs mt-1">
                  Loading available garages...
                </p>
              )}
              {formData.activationCode && availableGaragesForStaff.length > 0 && !formData.selectedGarageId && (
                <p className="text-orange-400 text-xs mt-1">
                  Please select a garage to join
                </p>
              )}
            </div>
          )}

          <Button
            type="submit"
            disabled={isLoading}
            className="w-full bg-white text-primary hover:bg-gray-100"
          >
            {isLoading ? "Creating Account..." : "Create Account"}
          </Button>
        </form>

        {/* Request Access Section */}
        <div className="mt-8 border-t border-white/20 pt-6">
          <div className="text-center mb-4">
            <p className="text-blue-100 text-sm mb-2">Don't have an activation code?</p>
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowAccessRequest(!showAccessRequest)}
              className="bg-white/10 border-white/20 text-white hover:bg-white/20"
            >
              <Mail className="w-4 h-4 mr-2" />
              Request Access from Super Admin
            </Button>
          </div>

          {showAccessRequest && (
            <form onSubmit={handleAccessRequest} className="space-y-4 bg-white/5 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-center">Access Request</h3>
              <div className="bg-blue-900/30 border border-blue-400/30 rounded-lg p-3 mb-4">
                <p className="text-xs text-blue-200 text-center">
                  🔑 <strong>Auto-Generated Codes:</strong> The system will create a unique activation code for you.<br/>
                  Super admin will receive it via email and provide it to you.
                </p>
              </div>
              
              <div>
                <Label htmlFor="requestEmail" className="block text-sm font-medium mb-2">
                  Your Email
                </Label>
                <Input
                  id="requestEmail"
                  type="email"
                  placeholder="Enter your email"
                  value={accessRequest.email}
                  onChange={(e) => setAccessRequest(prev => ({ ...prev, email: e.target.value }))}
                  className="bg-white/10 border-white/20 placeholder-white/70 text-white focus:border-white/50"
                  required
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
                  <SelectTrigger className="bg-white/10 border-white/20 text-white focus:border-white/50">
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
                    <SelectTrigger className="bg-white/10 border-white/20 text-white focus:border-white/50">
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
                  className="bg-white/10 border-white/20 placeholder-white/70 text-white focus:border-white/50 min-h-[80px]"
                />
              </div>

              <div className="flex space-x-3">
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                >
                  {isLoading ? "Sending..." : "Send Request"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowAccessRequest(false)}
                  className="flex-1 bg-white/10 border-white/20 text-white hover:bg-white/20"
                >
                  Cancel
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
