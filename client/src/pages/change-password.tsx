import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/lib/auth';
import { useToast } from '@/hooks/use-toast';
import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useLocation } from 'wouter';
import { Eye, EyeOff, Lock, AlertTriangle } from 'lucide-react';

const changePasswordSchema = z.object({
  currentPassword: z.string().optional(),
  newPassword: z.string()
    .min(8, 'Password must be at least 8 characters long')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  confirmPassword: z.string()
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type ChangePasswordForm = z.infer<typeof changePasswordSchema>;

export default function ChangePasswordPage() {
  const { user, refreshUser } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const isForced = user?.must_change_password === true;

  const form = useForm<ChangePasswordForm>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    }
  });

  const changePasswordMutation = useMutation({
    mutationFn: async (data: ChangePasswordForm) => {
      // Client-side validation: Check if new password is same as current password
      if (!isForced && data.newPassword === data.currentPassword) {
        throw new Error("New password cannot be the same as your current password");
      }

      const payload = isForced 
        ? { newPassword: data.newPassword }
        : { currentPassword: data.currentPassword, newPassword: data.newPassword };
      
      return apiRequest('POST', '/api/auth/change-password', payload);
    },
    onSuccess: async () => {
      toast({
        title: "Success",
        description: "Password changed successfully",
      });
      
      // Refresh user data to update must_change_password status
      await refreshUser();
      
      // Redirect based on user role using proper routes
      if (user?.role === 'super_admin') {
        setLocation('/super-admin');
      } else if (user?.role === 'garage_admin') {
        setLocation('/admin-dashboard');
      } else if (user?.role === 'mechanic_staff') {
        setLocation('/staff-dashboard');
      } else {
        setLocation('/dashboard');
      }
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to change password",
        variant: "destructive",
      });
    }
  });

  const onSubmit = (data: ChangePasswordForm) => {
    changePasswordMutation.mutate(data);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <Lock className="h-12 w-12 text-blue-600" />
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          {isForced ? 'Change Your Password' : 'Update Password'}
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          {isForced 
            ? 'For security reasons, you must change your temporary password'
            : 'Update your account password'
          }
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5" />
              Change Password
            </CardTitle>
            <CardDescription>
              {isForced 
                ? 'You are using a temporary password. Please create a new password to continue.'
                : 'Enter your current password and choose a new one.'
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isForced && (
              <Alert className="mb-6">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Password Change Required:</strong> You must change your temporary password before you can access the system.
                </AlertDescription>
              </Alert>
            )}

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                {!isForced && (
                  <FormField
                    control={form.control}
                    name="currentPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Current Password</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input
                              {...field}
                              type={showCurrentPassword ? 'text' : 'password'}
                              placeholder="Enter your current password"
                              data-testid="input-current-password"
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                              onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                              data-testid="toggle-current-password"
                            >
                              {showCurrentPassword ? (
                                <EyeOff className="h-4 w-4" />
                              ) : (
                                <Eye className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                <FormField
                  control={form.control}
                  name="newPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>New Password</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            {...field}
                            type={showNewPassword ? 'text' : 'password'}
                            placeholder="Enter your new password"
                            data-testid="input-new-password"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                            onClick={() => setShowNewPassword(!showNewPassword)}
                            data-testid="toggle-new-password"
                          >
                            {showNewPassword ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </FormControl>
                      <FormMessage />
                      <div className="text-xs text-gray-600 mt-1">
                        Password must contain:
                        <ul className="list-disc list-inside ml-2">
                          <li>At least 8 characters</li>
                          <li>One uppercase letter</li>
                          <li>One lowercase letter</li>
                          <li>One number</li>
                        </ul>
                      </div>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confirm New Password</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            {...field}
                            type={showConfirmPassword ? 'text' : 'password'}
                            placeholder="Confirm your new password"
                            data-testid="input-confirm-password"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            data-testid="toggle-confirm-password"
                          >
                            {showConfirmPassword ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={changePasswordMutation.isPending}
                  data-testid="button-change-password"
                >
                  {changePasswordMutation.isPending ? 'Changing Password...' : 'Change Password'}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}