import { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import { useTheme } from "@/lib/theme";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { LogoUploader } from "@/components/LogoUploader";
import { ArrowLeft, Settings, Edit, Lock, Moon, Sun, LogOut, Save, Eye, EyeOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Profile() {
  const [, navigate] = useLocation();
  const { user, garage, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [editForm, setEditForm] = useState({
    name: garage?.name || "",
    ownerName: garage?.ownerName || "",
    phone: garage?.phone || "",
    email: garage?.email || "",
  });
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const updateGarageMutation = useMutation({
    mutationFn: async (data: any) => {
      if (!garage?.id) throw new Error("No garage selected");
      const response = await apiRequest("PUT", `/api/garages/${garage.id}`, data);
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Profile updated successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/user/profile"] });
      setIsEditDialogOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update profile",
        variant: "destructive",
      });
    },
  });

  const canEdit = user?.role === "garage_admin";

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateGarageMutation.mutate(editForm);
  };

  const changePasswordMutation = useMutation({
    mutationFn: async (data: { currentPassword: string; newPassword: string }) => {
      return apiRequest('POST', '/api/auth/change-password', data);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Password changed successfully",
      });
      setIsPasswordDialogOpen(false);
      setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to change password",
        variant: "destructive",
      });
    }
  });

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast({
        title: "Error",
        description: "New passwords do not match",
        variant: "destructive",
      });
      return;
    }

    if (passwordForm.newPassword.length < 8) {
      toast({
        title: "Error",
        description: "Password must be at least 8 characters long",
        variant: "destructive",
      });
      return;
    }

    // Validate password strength
    if (!/[A-Z]/.test(passwordForm.newPassword)) {
      toast({
        title: "Error",
        description: "Password must contain at least one uppercase letter",
        variant: "destructive",
      });
      return;
    }

    if (!/[a-z]/.test(passwordForm.newPassword)) {
      toast({
        title: "Error",
        description: "Password must contain at least one lowercase letter",
        variant: "destructive",
      });
      return;
    }

    if (!/[0-9]/.test(passwordForm.newPassword)) {
      toast({
        title: "Error",
        description: "Password must contain at least one number",
        variant: "destructive",
      });
      return;
    }

    // Check if new password is same as current password
    if (passwordForm.newPassword === passwordForm.currentPassword) {
      toast({
        title: "Error",
        description: "New password cannot be the same as your current password",
        variant: "destructive",
      });
      return;
    }

    changePasswordMutation.mutate({
      currentPassword: passwordForm.currentPassword,
      newPassword: passwordForm.newPassword
    });
  };

  const handleLogoutConfirm = () => {
    logout();
    navigate("/login");
    setShowLogoutDialog(false);
  };

  const formatJoinDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'long',
      year: 'numeric'
    });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="screen-header">
        <div className="flex items-center space-x-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/dashboard")}
            className="text-white hover:bg-white/10"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h2 className="text-lg font-semibold">Profile</h2>
        </div>
        {canEdit && (
          <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
            <DialogTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="text-white hover:bg-white/10"
              >
                <Edit className="w-5 h-5" />
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-sm mx-auto">
              <DialogHeader>
                <DialogTitle>Edit Profile</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleEditSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="garageName">Garage Name</Label>
                  <Input
                    id="garageName"
                    value={editForm.name}
                    onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="ownerName">Owner Name</Label>
                  <Input
                    id="ownerName"
                    value={editForm.ownerName}
                    onChange={(e) => setEditForm(prev => ({ ...prev, ownerName: e.target.value }))}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={editForm.phone}
                    onChange={(e) => setEditForm(prev => ({ ...prev, phone: e.target.value }))}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={editForm.email}
                    onChange={(e) => setEditForm(prev => ({ ...prev, email: e.target.value }))}
                    required
                  />
                </div>
                <div className="flex space-x-2">
                  <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)} className="flex-1">
                    Cancel
                  </Button>
                  <Button type="submit" className="flex-1" disabled={updateGarageMutation.isPending}>
                    <Save className="w-4 h-4 mr-2" />
                    Save
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="screen-content space-y-4">
        {/* Profile Header */}
        <Card>
          <CardContent className="p-6 text-center">
            <div className="w-20 h-20 mx-auto bg-primary/10 rounded-full flex items-center justify-center mb-4 overflow-hidden">
              {garage?.logo ? (
                <img 
                  src={garage.logo} 
                  alt="Garage Logo" 
                  className="w-full h-full object-cover rounded-full"
                />
              ) : (
                <Settings className="text-primary w-10 h-10" />
              )}
            </div>
            <h3 className="text-xl font-bold">{garage?.name || "ServiceGuru"}</h3>
            <p className="text-muted-foreground">{user?.role?.replace('_', ' ')}</p>
          </CardContent>
        </Card>

        {/* Profile Details */}
        <Card>
          <CardHeader>
            <CardTitle>Garage Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between py-2">
              <span className="text-muted-foreground">Owner Name</span>
              <span className="font-medium">{garage?.ownerName || "N/A"}</span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-muted-foreground">Phone</span>
              <span className="font-medium">{garage?.phone || "N/A"}</span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-muted-foreground">Email</span>
              <span className="font-medium">{garage?.email || user?.email}</span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-muted-foreground">Joined</span>
              <span className="font-medium">
                {garage?.createdAt ? new Date(garage.createdAt).toLocaleDateString() : "N/A"}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Logo Management */}
        {canEdit ? (
          <LogoUploader 
            currentLogoUrl={garage?.logo || ""} 
            onLogoUpdated={(newLogoUrl) => {
              // Logo will be updated via mutation in LogoUploader
            }} 
          />
        ) : garage?.logo && (
          <Card>
            <CardHeader>
              <CardTitle>Garage Logo</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <img 
                src={garage.logo} 
                alt="Garage logo" 
                className="mx-auto h-24 w-24 object-contain rounded-lg border-2 border-dashed border-muted-foreground/20"
              />
              <p className="text-sm text-muted-foreground mt-2">
                Logo can only be changed by garage admin
              </p>
            </CardContent>
          </Card>
        )}

        {/* Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Dialog open={isPasswordDialogOpen} onOpenChange={setIsPasswordDialogOpen}>
              <DialogTrigger asChild>
                <button className="w-full flex items-center justify-between py-3 text-left">
                  <div className="flex items-center space-x-3">
                    <Lock className="w-5 h-5 text-muted-foreground" />
                    <span>Change Password</span>
                  </div>
                  <ArrowLeft className="w-4 h-4 text-muted-foreground rotate-180" />
                </button>
              </DialogTrigger>
              <DialogContent className="max-w-sm mx-auto">
                <DialogHeader>
                  <DialogTitle>Change Password</DialogTitle>
                </DialogHeader>
                <form onSubmit={handlePasswordSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="currentPassword">Current Password</Label>
                    <div className="relative">
                      <Input
                        id="currentPassword"
                        type={showCurrentPassword ? 'text' : 'password'}
                        value={passwordForm.currentPassword}
                        onChange={(e) => setPasswordForm(prev => ({ ...prev, currentPassword: e.target.value }))}
                        required
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      >
                        {showCurrentPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="newPassword">New Password</Label>
                    <div className="relative">
                      <Input
                        id="newPassword"
                        type={showNewPassword ? 'text' : 'password'}
                        value={passwordForm.newPassword}
                        onChange={(e) => setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))}
                        required
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                      >
                        {showNewPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
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
                    <Label htmlFor="confirmPassword">Confirm New Password</Label>
                    <div className="relative">
                      <Input
                        id="confirmPassword"
                        type={showConfirmPassword ? 'text' : 'password'}
                        value={passwordForm.confirmPassword}
                        onChange={(e) => setPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                        required
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <Button type="button" variant="outline" onClick={() => setIsPasswordDialogOpen(false)} className="flex-1">
                      Cancel
                    </Button>
                    <Button type="submit" className="flex-1" disabled={changePasswordMutation.isPending}>
                      {changePasswordMutation.isPending ? 'Updating...' : 'Update Password'}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>

            <div className="flex items-center justify-between py-3">
              <div className="flex items-center space-x-3">
                {theme === "dark" ? (
                  <Moon className="w-5 h-5 text-muted-foreground" />
                ) : (
                  <Sun className="w-5 h-5 text-muted-foreground" />
                )}
                <span>Dark Mode</span>
              </div>
              <button
                onClick={toggleTheme}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
                  theme === "dark" ? "bg-primary" : "bg-gray-300"
                }`}
              >
                <span className="sr-only">Toggle dark mode</span>
                <span 
                  className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                    theme === "dark" ? "translate-x-6" : "translate-x-1"
                  }`} 
                />
              </button>
            </div>

            <AlertDialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
              <AlertDialogTrigger asChild>
                <button 
                  className="w-full flex items-center justify-between py-3 text-destructive"
                  data-testid="button-logout-profile"
                >
                  <div className="flex items-center space-x-3">
                    <LogOut className="w-5 h-5" />
                    <span>Logout</span>
                  </div>
                  <ArrowLeft className="w-4 h-4 rotate-180" />
                </button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Confirm Logout</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to logout? You will need to sign in again to access your account.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel data-testid="button-cancel-logout-profile">
                    Cancel
                  </AlertDialogCancel>
                  <AlertDialogAction 
                    onClick={handleLogoutConfirm}
                    data-testid="button-confirm-logout-profile"
                  >
                    Logout
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
