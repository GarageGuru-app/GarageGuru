import { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import { useTheme } from "@/lib/theme";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Settings, Moon, Sun } from "lucide-react";
import { useToast } from "@/hooks/use-toast";


export default function Login() {
  const [, navigate] = useLocation();
  const { login } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast({
        title: "Login Failed",
        description: "Please enter both email and password",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      await login(email, password);
      // Clear fields only on successful login
      setEmail("");
      setPassword("");
      // Force navigation to dashboard
      setTimeout(() => {
        navigate("/dashboard");
      }, 100);
    } catch (error) {
      // Don't clear fields on error so user can retry
      toast({
        title: "Login Failed",
        description: error instanceof Error ? error.message : "Invalid credentials",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
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
            <Input
              id="password"
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="bg-white/10 border-white/20 placeholder-white/70 text-white focus:border-white/50"
              required
            />
          </div>

          <Button
            type="submit"
            disabled={isLoading}
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

          <div className="text-center">
            <Button
              type="button"
              variant="link"
              onClick={() => navigate("/register")}
              className="text-blue-100 underline"
            >
              Request Access
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
