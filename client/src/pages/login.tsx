import { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import { useTheme } from "@/lib/theme";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Settings, Moon, Sun, Mail, Lock, Eye, EyeOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";


export default function Login() {
  const [, navigate] = useLocation();
  const { login } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);

  // Super admin emails
  const SUPER_ADMIN_EMAILS = [
    'gorla.ananthkalyan@gmail.com',
    'ananthautomotivegarage@gmail.com'
  ];
  const [showMfaDialog, setShowMfaDialog] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [mfaOtp, setMfaOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [mfaToken, setMfaToken] = useState("");
  const [mfaStep, setMfaStep] = useState<'request' | 'verify' | 'change'>('request');

  // Regular forgot password states
  const [forgotPasswordStep, setForgotPasswordStep] = useState<'request' | 'verify' | 'reset'>('request');
  const [forgotOtp, setForgotOtp] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [resetPassword, setResetPassword] = useState("");
  const [resetConfirmPassword, setResetConfirmPassword] = useState("");
  const [isLoadingForgot, setIsLoadingForgot] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('🔥 [LOGIN] Form submitted, isLoading:', isLoading);
    
    // Prevent double submission
    if (isLoading) {
      console.log('🔥 [LOGIN] Already loading, preventing double submission');
      return;
    }
    
    if (!email || !password) {
      console.log('🔥 [LOGIN] Missing email or password');
      toast({
        title: "Login Failed",
        description: "Please enter both email and password",
        variant: "destructive",
      });
      return;
    }

    console.log('🔥 [LOGIN] Starting login process for:', email);
    setIsLoading(true);

    try {
      console.log('🔥 [LOGIN] Calling auth login function');
      const redirectPath = await login(email, password);
      console.log('🔥 [LOGIN] Login successful, redirectPath:', redirectPath);
      
      // Clear fields only on successful login
      setEmail("");
      setPassword("");
      
      // Navigate to the appropriate route based on user role
      if (redirectPath) {
        console.log('🔥 [LOGIN] Navigating to:', redirectPath);
        // Use setTimeout to ensure React state updates are flushed before navigation
        setTimeout(() => {
          navigate(redirectPath);
        }, 10);
      }
    } catch (error) {
      console.log('🔥 [LOGIN] Login failed with error:', error);
      toast({
        title: "Login Failed",
        description: error instanceof Error ? error.message : "Invalid credentials",
        variant: "destructive",
      });
    } finally {
      console.log('🔥 [LOGIN] Setting isLoading to false');
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!forgotEmail) {
      toast({
        title: "Error",
        description: "Please enter your email address",
        variant: "destructive",
      });
      return;
    }

    // Check if email is a super admin email
    if (SUPER_ADMIN_EMAILS.includes(forgotEmail)) {
      // Redirect to MFA process for super admin
      toast({
        title: "Super Admin Detected",
        description: "Please use the Super Admin Password Reset (MFA) option for secure password reset.",
      });
      setShowForgotPassword(false);
      setShowMfaDialog(true);
      return;
    }

    // Handle regular user forgot password
    setIsLoadingForgot(true);
    try {
      // Use raw fetch to handle error responses properly
      const token = localStorage.getItem('auth-token');
      const headers: HeadersInit = { "Content-Type": "application/json" };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch('/api/forgot-password/request', {
        method: 'POST',
        headers,
        body: JSON.stringify({ email: forgotEmail }),
        credentials: "include",
      });

      if (response.ok) {
        const data = await response.json();
        toast({
          title: "Reset Code Sent",
          description: data.message || "Check your email for the password reset code",
        });
        setForgotPasswordStep('verify');
      } else {
        // Handle HTTP error responses (403, 400, etc.)
        try {
          const errorData = await response.json();
          if (errorData.isSuspended) {
            toast({
              title: "Account Suspended", 
              description: errorData.message,
              variant: "destructive",
            });
            return;
          }
          if (errorData.isInactive) {
            toast({
              title: "Account Inactive",
              description: errorData.message,
              variant: "destructive",
            });
            return;
          }
          toast({
            title: "Error",
            description: errorData.message || 'Failed to send reset code',
            variant: "destructive",
          });
        } catch (parseError) {
          // If JSON parsing fails, show generic error
          toast({
            title: "Error",
            description: 'Failed to send reset code',
            variant: "destructive",
          });
        }
      }
    } catch (error: any) {
      // Handle network errors or other exceptions
      toast({
        title: "Error",
        description: error.message || "Network error. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingForgot(false);
    }
  };

  const handleMfaRequest = async () => {
    // Validate email input
    const currentEmail = forgotEmail || 'gorla.ananthkalyan@gmail.com';
    
    if (!SUPER_ADMIN_EMAILS.includes(currentEmail)) {
      toast({
        title: "Access Denied",
        description: "This feature is only available for super admin accounts.",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await apiRequest('POST', '/api/mfa/request', { 
        email: currentEmail,
        purpose: 'password_change' 
      });

      if (response.ok) {
        toast({
          title: "OTP Sent",
          description: "Check your email for the verification code",
        });
        setMfaStep('verify');
      } else {
        throw new Error('Failed to send OTP');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send OTP",
        variant: "destructive",
      });
    }
  };

  const handleMfaVerify = async () => {
    if (!mfaOtp || mfaOtp.length !== 6) {
      toast({
        title: "Error",
        description: "Please enter a valid 6-digit OTP",
        variant: "destructive",
      });
      return;
    }

    try {
      const currentEmail = forgotEmail || 'gorla.ananthkalyan@gmail.com';
      const response = await apiRequest('POST', '/api/mfa/verify', { 
        email: currentEmail,
        code: mfaOtp,
        purpose: 'password_change' 
      });

      if (response.ok) {
        const data = await response.json();
        setMfaToken(data.token);
        setMfaStep('change');
        toast({
          title: "OTP Verified",
          description: "Now enter your new password",
        });
      } else {
        throw new Error('Invalid OTP');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Invalid or expired OTP",
        variant: "destructive",
      });
    }
  };

  const handleForgotVerify = async () => {
    if (!forgotOtp || forgotOtp.length !== 6) {
      toast({
        title: "Error",
        description: "Please enter a valid 6-digit code",
        variant: "destructive",
      });
      return;
    }

    setIsLoadingForgot(true);
    try {
      const response = await apiRequest('POST', '/api/forgot-password/verify', { 
        email: forgotEmail,
        code: forgotOtp
      });

      if (response.ok) {
        const data = await response.json();
        setResetToken(data.resetToken);
        setForgotPasswordStep('reset');
        toast({
          title: "Code Verified",
          description: "Now enter your new password",
        });
      } else {
        throw new Error('Invalid code');
      }
    } catch (error: any) {
      const errorData = await error.response?.json?.() || {};
      toast({
        title: "Error",
        description: errorData.message || "Invalid or expired code",
        variant: "destructive",
      });
    } finally {
      setIsLoadingForgot(false);
    }
  };

  const handlePasswordReset = async () => {
    if (!resetPassword || resetPassword.length < 8) {
      toast({
        title: "Error",
        description: "Password must be at least 8 characters",
        variant: "destructive",
      });
      return;
    }

    if (!/[A-Z]/.test(resetPassword)) {
      toast({
        title: "Error",
        description: "Password must contain at least one uppercase letter",
        variant: "destructive",
      });
      return;
    }

    if (!/[a-z]/.test(resetPassword)) {
      toast({
        title: "Error",
        description: "Password must contain at least one lowercase letter",
        variant: "destructive",
      });
      return;
    }

    if (!/[0-9]/.test(resetPassword)) {
      toast({
        title: "Error",
        description: "Password must contain at least one number",
        variant: "destructive",
      });
      return;
    }

    if (resetPassword !== resetConfirmPassword) {
      toast({
        title: "Error",
        description: "Passwords do not match",
        variant: "destructive",
      });
      return;
    }

    setIsLoadingForgot(true);
    try {
      const response = await apiRequest('POST', '/api/forgot-password/reset', { 
        resetToken,
        newPassword: resetPassword
      });

      if (response.ok) {
        const data = await response.json();
        toast({
          title: "Success",
          description: data.message || "Password reset successfully",
        });
        // Reset all state and close dialog
        setShowForgotPassword(false);
        setForgotPasswordStep('request');
        setForgotEmail("");
        setForgotOtp("");
        setResetToken("");
        setResetPassword("");
        setResetConfirmPassword("");
      } else {
        throw new Error('Failed to reset password');
      }
    } catch (error: any) {
      const errorData = await error.response?.json?.() || {};
      toast({
        title: "Error",
        description: errorData.message || "Failed to reset password",
        variant: "destructive",
      });
    } finally {
      setIsLoadingForgot(false);
    }
  };

  const handlePasswordChange = async () => {
    if (!newPassword || newPassword.length < 8) {
      toast({
        title: "Error",
        description: "Password must be at least 8 characters",
        variant: "destructive",
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({
        title: "Error",
        description: "Passwords do not match",
        variant: "destructive",
      });
      return;
    }

    try {
      const currentEmail = forgotEmail || 'gorla.ananthkalyan@gmail.com';
      const response = await apiRequest('POST', '/api/mfa/change-password', { 
        email: currentEmail,
        newPassword,
        purpose: 'password_change' 
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Password changed successfully",
        });
        setShowMfaDialog(false);
        setMfaStep('request');
        setMfaOtp("");
        setNewPassword("");
        setConfirmPassword("");
        setMfaToken("");
      } else {
        throw new Error('Failed to change password');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to change password",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="gradient-header text-primary-foreground min-h-screen">
      <div className="flex flex-col h-full justify-center px-6">
        {/* Header */}
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

        {/* Logo and Title */}
        <div className="text-center mb-8">
          <div className="w-24 h-24 mx-auto mb-4 bg-white rounded-full flex items-center justify-center">
            <Settings className="text-primary text-3xl w-12 h-12" />
          </div>
          <h1 className="text-3xl font-bold mb-2">GarageGuru</h1>
          <p className="text-blue-100">Professional Garage Management</p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="email" className="block text-sm font-medium mb-2">
              Email
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-white/10 border-white/20 placeholder-white/70 text-white focus:border-white/50"
              required
            />
          </div>

          <div>
            <Label htmlFor="password" className="block text-sm font-medium mb-2">
              Password
            </Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-white/10 border-white/20 placeholder-white/70 text-white focus:border-white/50 pr-10"
                required
                data-testid="input-password"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 text-white/70 hover:text-white hover:bg-transparent"
                onClick={() => setShowPassword(!showPassword)}
                data-testid="button-toggle-password"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          <Button
            type="submit"
            disabled={isLoading || !email || !password}
            className="w-full bg-white text-primary hover:bg-gray-100"
          >
            {isLoading ? (
              <div className="flex items-center justify-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Signing In...</span>
              </div>
            ) : (
              "Sign In"
            )}
          </Button>

          <div className="text-center space-y-2">
            <div className="flex flex-col space-y-2">
              <Button
                type="button"
                variant="link"
                onClick={() => setShowForgotPassword(true)}
                className="text-blue-100 underline text-sm"
                data-testid="button-forgot-password"
              >
                Forgot Password?
              </Button>
              
              <Button
                type="button"
                variant="link"
                onClick={() => setShowMfaDialog(true)}
                className="text-blue-100 underline text-sm"
                data-testid="button-super-admin-mfa"
              >
                Super Admin Password Reset (MFA)
              </Button>
            </div>
            
            <Separator className="bg-white/20" />
            
            <Button
              type="button"
              variant="link"
              onClick={() => navigate("/register")}
              className="text-blue-100 underline"
              data-testid="button-request-access"
            >
              Request Access
            </Button>
          </div>
        </form>
      </div>

      {/* Forgot Password Dialog */}
      <Dialog open={showForgotPassword} onOpenChange={(open) => {
        setShowForgotPassword(open);
        if (!open) {
          // Reset state when dialog is closed
          setForgotPasswordStep('request');
          setForgotEmail("");
          setForgotOtp("");
          setResetToken("");
          setResetPassword("");
          setResetConfirmPassword("");
        }
      }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Mail className="w-5 h-5" />
              {forgotPasswordStep === 'request' && 'Forgot Password'}
              {forgotPasswordStep === 'verify' && 'Enter Verification Code'}
              {forgotPasswordStep === 'reset' && 'Set New Password'}
            </DialogTitle>
            <DialogDescription>
              {forgotPasswordStep === 'request' && 'Enter your email address to receive a password reset code.'}
              {forgotPasswordStep === 'verify' && 'Enter the 6-digit code sent to your email address.'}
              {forgotPasswordStep === 'reset' && 'Enter your new password below.'}
            </DialogDescription>
          </DialogHeader>
          
          {forgotPasswordStep === 'request' && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="forgot-email">Email Address</Label>
                <Input
                  id="forgot-email"
                  type="email"
                  placeholder="Enter your email"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  data-testid="input-forgot-email"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setShowForgotPassword(false)}
                  className="flex-1"
                  data-testid="button-cancel-forgot"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleForgotPassword}
                  disabled={isLoadingForgot}
                  className="flex-1"
                  data-testid="button-send-reset"
                >
                  {isLoadingForgot ? 'Sending...' : 'Send Reset Code'}
                </Button>
              </div>
            </div>
          )}
          
          {forgotPasswordStep === 'verify' && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="forgot-otp">Verification Code</Label>
                <Input
                  id="forgot-otp"
                  type="text"
                  value={forgotOtp}
                  onChange={(e) => setForgotOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="Enter 6-digit code"
                  maxLength={6}
                  className="text-center text-lg tracking-widest"
                  data-testid="input-forgot-otp"
                />
                <p className="text-sm text-gray-500 mt-1">
                  Code sent to {forgotEmail}
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setForgotPasswordStep('request')}
                  className="flex-1"
                  data-testid="button-back-to-email"
                >
                  Back
                </Button>
                <Button
                  onClick={handleForgotVerify}
                  disabled={isLoadingForgot || forgotOtp.length !== 6}
                  className="flex-1"
                  data-testid="button-verify-code"
                >
                  {isLoadingForgot ? 'Verifying...' : 'Verify Code'}
                </Button>
              </div>
            </div>
          )}
          
          {forgotPasswordStep === 'reset' && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="reset-password">New Password</Label>
                <Input
                  id="reset-password"
                  type="password"
                  value={resetPassword}
                  onChange={(e) => setResetPassword(e.target.value)}
                  placeholder="Enter new password"
                  data-testid="input-reset-password"
                />
                <div className="text-xs text-gray-600 mt-1">
                  Password must contain:
                  <ul className="list-disc list-inside ml-2">
                    <li>At least 8 characters</li>
                    <li>One uppercase letter</li>
                    <li>One lowercase letter</li>
                    <li>One number</li>
                  </ul>
                </div>
              </div>
              <div>
                <Label htmlFor="reset-confirm-password">Confirm New Password</Label>
                <Input
                  id="reset-confirm-password"
                  type="password"
                  value={resetConfirmPassword}
                  onChange={(e) => setResetConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  data-testid="input-reset-confirm-password"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setForgotPasswordStep('verify')}
                  className="flex-1"
                  data-testid="button-back-to-verify"
                >
                  Back
                </Button>
                <Button
                  onClick={handlePasswordReset}
                  disabled={isLoadingForgot || !resetPassword || !resetConfirmPassword}
                  className="flex-1"
                  data-testid="button-reset-password"
                >
                  {isLoadingForgot ? 'Resetting...' : 'Reset Password'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* MFA Dialog */}
      <Dialog open={showMfaDialog} onOpenChange={setShowMfaDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Lock className="w-5 h-5" />
              Super Admin Password Reset
            </DialogTitle>
            <DialogDescription>
              {mfaStep === 'request' && "Request an OTP to reset your super admin password"}
              {mfaStep === 'verify' && "Enter the 6-digit OTP sent to your email"}
              {mfaStep === 'change' && "Enter your new password"}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {mfaStep === 'request' && (
              <div className="text-center space-y-4">
                <p className="text-sm text-muted-foreground">
                  An OTP will be sent to super admin for verification.
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setShowMfaDialog(false)}
                    className="flex-1"
                    data-testid="button-cancel-mfa"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleMfaRequest}
                    className="flex-1"
                    data-testid="button-request-otp"
                  >
                    Send OTP
                  </Button>
                </div>
              </div>
            )}
            
            {mfaStep === 'verify' && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="mfa-otp">6-Digit OTP</Label>
                  <Input
                    id="mfa-otp"
                    type="text"
                    placeholder="000000"
                    value={mfaOtp}
                    onChange={(e) => setMfaOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    maxLength={6}
                    className="text-center text-lg tracking-wider"
                    data-testid="input-mfa-otp"
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setMfaStep('request');
                      setMfaOtp('');
                    }}
                    className="flex-1"
                    data-testid="button-back-to-request"
                  >
                    Back
                  </Button>
                  <Button
                    onClick={handleMfaVerify}
                    className="flex-1"
                    disabled={mfaOtp.length !== 6}
                    data-testid="button-verify-otp"
                  >
                    Verify OTP
                  </Button>
                </div>
              </div>
            )}
            
            {mfaStep === 'change' && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="new-password">New Password</Label>
                  <Input
                    id="new-password"
                    type="password"
                    placeholder="Enter new password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    data-testid="input-new-password"
                  />
                </div>
                <div>
                  <Label htmlFor="confirm-password">Confirm Password</Label>
                  <Input
                    id="confirm-password"
                    type="password"
                    placeholder="Confirm new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    data-testid="input-confirm-password"
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setMfaStep('verify');
                      setNewPassword('');
                      setConfirmPassword('');
                    }}
                    className="flex-1"
                    data-testid="button-back-to-verify"
                  >
                    Back
                  </Button>
                  <Button
                    onClick={handlePasswordChange}
                    className="flex-1"
                    disabled={!newPassword || !confirmPassword || newPassword !== confirmPassword}
                    data-testid="button-change-password"
                  >
                    Change Password
                  </Button>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
