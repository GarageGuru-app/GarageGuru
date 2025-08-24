import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/lib/auth';
import { 
  Users, 
  Building2, 
  Calendar, 
  Shield, 
  UserCog, 
  Key, 
  Clock,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Search,
  Filter,
  RefreshCw,
  LogOut
} from 'lucide-react';

// Super Admin emails that can access this page
const SUPER_ADMIN_EMAILS = [
  'gorla.ananthkalyan@gmail.com',
  'ananthautomotivegarage@gmail.com'
];

interface Garage {
  id: string;
  name: string;
  owner_name: string;
  phone: string;
  email: string;
  created_at: string;
  userCount: number;
  adminCount: number;
  staffCount: number;
  users: User[];
}

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  garage_id?: string;
  created_at: string;
}

interface Stats {
  totalGarages: number;
  totalUsers: number;
  newUsers7Days: number;
  newUsers30Days: number;
}

interface AccessRequest {
  id: string;
  garage_id: string;
  email: string;
  name: string;
  requested_role: string;
  status: string;
  created_at: string;
}

interface AuditLog {
  id: string;
  actor_email: string;
  target_email: string;
  action: string;
  details: any;
  created_at: string;
}

// MFA Password Change Component
const MFAPasswordChange: React.FC = () => {
  const [step, setStep] = useState<'request' | 'verify' | 'change'>('request');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [otpToken, setOtpToken] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { updateToken } = useAuth();

  const requestOtp = async () => {
    setLoading(true);
    try {
      await apiRequest('POST', '/api/mfa/request', {
        email,
        purpose: 'password_change'
      });
      setStep('verify');
      toast({
        title: 'OTP Sent',
        description: 'Check your email for the verification code. Code sent to both super admin emails.',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to send OTP',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async () => {
    setLoading(true);
    try {
      const response = await apiRequest('POST', '/api/mfa/verify', {
        email,
        code: otp,
        purpose: 'password_change'
      });
      const data = await response.json();
      setOtpToken(data.otp_verified_token);
      setStep('change');
      toast({
        title: 'OTP Verified',
        description: 'You can now set a new password.',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Invalid OTP',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const changePassword = async () => {
    // Validate passwords match
    if (newPassword !== confirmPassword) {
      toast({
        title: 'Error',
        description: 'Passwords do not match. Please try again.',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      const response = await apiRequest('POST', '/api/password/change', {
        email,
        otp_verified_token: otpToken,
        new_password: newPassword
      });
      const data = await response.json();
      
      // Update auth token to stay logged in
      if (data.token) {
        updateToken(data.token);
      }
      
      toast({
        title: 'Success',
        description: 'Password changed successfully. Security notification sent to both admin emails.',
      });
      setStep('request');
      setEmail('');
      setOtp('');
      setNewPassword('');
      setConfirmPassword('');
      setOtpToken('');
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to change password',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Key className="w-5 h-5" />
          Change Super Admin Password
        </CardTitle>
        <CardDescription>
          Secure password change with email-OTP verification
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {step === 'request' && (
          <>
            <div className="space-y-2">
              <label className="text-sm font-medium">Super Admin Email</label>
              <Input
                type="email"
                placeholder="Enter your super admin email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                data-testid="input-admin-email"
              />
            </div>
            <Button 
              onClick={requestOtp} 
              disabled={!email || loading}
              className="w-full"
              data-testid="button-request-otp"
            >
              {loading ? 'Sending...' : 'Send OTP'}
            </Button>
          </>
        )}

        {step === 'verify' && (
          <>
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                OTP sent to both super admin emails. Enter the 6-digit code below.
              </AlertDescription>
            </Alert>
            <div className="space-y-2">
              <label className="text-sm font-medium">6-Digit OTP Code</label>
              <Input
                type="text"
                maxLength={6}
                placeholder="000000"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                data-testid="input-otp-code"
              />
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={() => setStep('request')}
                data-testid="button-back-to-request"
              >
                Back
              </Button>
              <Button 
                onClick={verifyOtp} 
                disabled={otp.length !== 6 || loading}
                className="flex-1"
                data-testid="button-verify-otp"
              >
                {loading ? 'Verifying...' : 'Verify OTP'}
              </Button>
            </div>
          </>
        )}

        {step === 'change' && (
          <>
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                OTP verified! Set your new password (minimum 8 characters).
              </AlertDescription>
            </Alert>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">New Password</label>
                <Input
                  type="password"
                  placeholder="Enter new password (min 8 characters)"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  data-testid="input-new-password"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Confirm New Password</label>
                <Input
                  type="password"
                  placeholder="Re-enter new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  data-testid="input-confirm-password"
                />
                {newPassword && confirmPassword && newPassword !== confirmPassword && (
                  <p className="text-sm text-red-500">Passwords do not match</p>
                )}
              </div>
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={() => setStep('verify')}
                data-testid="button-back-to-verify"
              >
                Back
              </Button>
              <Button 
                onClick={changePassword} 
                disabled={newPassword.length < 8 || confirmPassword.length < 8 || newPassword !== confirmPassword || loading}
                className="flex-1"
                data-testid="button-change-password"
              >
                {loading ? 'Changing...' : 'Change Password'}
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

// Main Super Admin Page Component
export default function SuperAdminPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGarage, setSelectedGarage] = useState<Garage | null>(null);
  const [showMFA, setShowMFA] = useState(false);
  const [processingAction, setProcessingAction] = useState<{ requestId: string; action: 'approve' | 'deny' } | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Check if current user has super admin email access
  const { user: currentUser, logout } = useAuth();
  
  // Remove this useEffect - let ProtectedRoute handle auth

  // Fetch garages and stats
  const { data: garageData, isLoading: loadingGarages, refetch: refetchGarages } = useQuery({
    queryKey: ['/api/super-admin/garages'],
    enabled: currentUser && SUPER_ADMIN_EMAILS.includes(currentUser.email || '')
  });

  // Fetch access requests
  const { data: accessRequests, refetch: refetchAccessRequests } = useQuery({
    queryKey: ['/api/access-requests'],
    enabled: currentUser && SUPER_ADMIN_EMAILS.includes(currentUser.email || '')
  });

  // Fetch audit logs
  const { data: auditLogs, refetch: refetchAuditLogs } = useQuery({
    queryKey: ['/api/super-admin/audit-logs'],
    enabled: currentUser && SUPER_ADMIN_EMAILS.includes(currentUser.email || '')
  });

  // Process access request mutation
  const processRequestMutation = useMutation({
    mutationFn: async ({ requestId, action, role }: { requestId: string, action: 'approve' | 'deny', role?: string }) => {
      return apiRequest('POST', `/api/access-requests/${requestId}/process`, { action, role });
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Access request processed successfully',
      });
      setProcessingAction(null);
      refetchAccessRequests();
      refetchGarages();
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to process request',
        variant: 'destructive',
      });
      setProcessingAction(null);
    },
  });

  // Role toggle mutation
  const toggleRoleMutation = useMutation({
    mutationFn: async ({ userId }: { userId: string }) => {
      return apiRequest('POST', `/api/super-admin/users/${userId}/toggle-role`, {});
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'User role updated successfully',
      });
      refetchGarages();
      refetchAuditLogs();
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update role',
        variant: 'destructive',
      });
    },
  });

  // Show loading while waiting for auth data
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  const garages: Garage[] = (garageData as any)?.garages || [];
  const stats: Stats = (garageData as any)?.stats || { totalGarages: 0, totalUsers: 0, newUsers7Days: 0, newUsers30Days: 0 };

  const filteredGarages = garages.filter(garage => 
    garage.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    garage.owner_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    garage.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleToggleRole = (userId: string) => {
    toggleRoleMutation.mutate({ userId });
  };

  const handleApproveRequest = (requestId: string, requestedRole: string) => {
    setProcessingAction({ requestId, action: 'approve' });
    // Convert requested role to actual system role
    const role = requestedRole === 'admin' ? 'garage_admin' : 'mechanic_staff';
    processRequestMutation.mutate({ requestId, action: 'approve', role });
  };

  const handleDenyRequest = (requestId: string) => {
    setProcessingAction({ requestId, action: 'deny' });
    processRequestMutation.mutate({ requestId, action: 'deny' });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-2" data-testid="title-super-admin">
                <Shield className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
                Super Admin Dashboard
              </h1>
              <p className="text-sm sm:text-base text-muted-foreground">Manage garages, users, and system settings</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => refetchGarages()}
                disabled={loadingGarages}
                data-testid="button-refresh"
              >
                <RefreshCw className={`w-4 h-4 ${loadingGarages ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline ml-2">Refresh</span>
              </Button>
              <Button
                size="sm"
                onClick={() => setShowMFA(true)}
                data-testid="button-change-password"
              >
                <Key className="w-4 h-4" />
                <span className="hidden sm:inline ml-2">Change Password</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={logout}
                data-testid="button-logout"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline ml-2">Logout</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        {/* Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card data-testid="stat-total-garages">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">Total Garages</p>
                  <p className="text-2xl font-bold" data-testid="count-total-garages">{stats.totalGarages}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card data-testid="stat-total-users">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">Total Users</p>
                  <p className="text-2xl font-bold" data-testid="count-total-users">{stats.totalUsers}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card data-testid="stat-new-users-7days">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-green-600" />
                <div>
                  <p className="text-sm text-muted-foreground">New (7 days)</p>
                  <p className="text-2xl font-bold text-green-600" data-testid="count-new-users-7days">{stats.newUsers7Days}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card data-testid="stat-new-users-30days">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-blue-600" />
                <div>
                  <p className="text-sm text-muted-foreground">New (30 days)</p>
                  <p className="text-2xl font-bold text-blue-600" data-testid="count-new-users-30days">{stats.newUsers30Days}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="garages" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3 mb-4">
            <TabsTrigger value="garages" data-testid="tab-garages" className="text-xs sm:text-sm">Garages</TabsTrigger>
            <TabsTrigger value="access-requests" data-testid="tab-access-requests" className="text-xs sm:text-sm">Requests</TabsTrigger>
            <TabsTrigger value="audit-logs" data-testid="tab-audit-logs" className="text-xs sm:text-sm">Audit Logs</TabsTrigger>
          </TabsList>

          {/* Garages & Users Tab */}
          <TabsContent value="garages" className="space-y-4">
            {/* Search and Filters */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search garages..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                  data-testid="input-search-garages"
                />
              </div>
            </div>

            {/* Garages List */}
            <div className="grid grid-cols-1 gap-4">
              {loadingGarages ? (
                <div className="col-span-full flex items-center justify-center py-8">
                  <RefreshCw className="w-6 h-6 animate-spin" />
                  <span className="ml-2">Loading garages...</span>
                </div>
              ) : (
                filteredGarages.map((garage) => (
                  <Card key={garage.id} className="cursor-pointer hover:bg-accent/50" data-testid={`garage-card-${garage.id}`}>
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-lg" data-testid={`garage-name-${garage.id}`}>{garage.name}</CardTitle>
                          <CardDescription data-testid={`garage-owner-${garage.id}`}>Owner: {garage.owner_name}</CardDescription>
                        </div>
                        <Badge variant="outline" data-testid={`garage-user-count-${garage.id}`}>
                          {garage.userCount} users
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="text-sm text-muted-foreground">
                          <p data-testid={`garage-email-${garage.id}`}>📧 {garage.email}</p>
                          <p data-testid={`garage-phone-${garage.id}`}>📞 {garage.phone}</p>
                          <p data-testid={`garage-created-${garage.id}`}>📅 Created: {new Date(garage.created_at).toLocaleDateString()}</p>
                        </div>
                        
                        <div className="flex items-center gap-4 text-xs">
                          <span className="flex items-center gap-1" data-testid={`garage-admin-count-${garage.id}`}>
                            <UserCog className="w-3 h-3" />
                            {garage.adminCount} Admin{garage.adminCount !== 1 ? 's' : ''}
                          </span>
                          <span className="flex items-center gap-1" data-testid={`garage-staff-count-${garage.id}`}>
                            <Users className="w-3 h-3" />
                            {garage.staffCount} Staff
                          </span>
                        </div>

                        {/* Users List */}
                        <div className="space-y-2">
                          <h4 className="text-sm font-medium">Users:</h4>
                          {garage.users.map((user) => (
                            <div key={user.id} className="flex items-center justify-between p-2 rounded bg-accent/20" data-testid={`user-row-${user.id}`}>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate" data-testid={`user-name-${user.id}`}>{user.name}</p>
                                <p className="text-xs text-muted-foreground truncate" data-testid={`user-email-${user.id}`}>{user.email}</p>
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge 
                                  variant={user.role === 'garage_admin' ? 'default' : 'secondary'}
                                  data-testid={`user-role-badge-${user.id}`}
                                >
                                  {user.role === 'garage_admin' ? 'Admin' : 'Staff'}
                                </Badge>
                                {user.role !== 'super_admin' && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleToggleRole(user.id)}
                                    disabled={toggleRoleMutation.isPending}
                                    data-testid={`button-toggle-role-${user.id}`}
                                  >
                                    {toggleRoleMutation.isPending ? (
                                      <RefreshCw className="w-3 h-3 animate-spin" />
                                    ) : (
                                      <>↔ Toggle</>
                                    )}
                                  </Button>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          {/* Access Requests Tab */}
          <TabsContent value="access-requests">
            <Card>
              <CardHeader>
                <CardTitle>Access Requests</CardTitle>
                <CardDescription>Pending requests for garage access</CardDescription>
              </CardHeader>
              <CardContent>
                {(accessRequests as any)?.length ? (
                  <div className="space-y-4">
                    {(accessRequests as any[])?.map((request: AccessRequest) => (
                      <div key={request.id} className="flex items-center justify-between p-4 border rounded" data-testid={`access-request-${request.id}`}>
                        <div>
                          <p className="font-medium" data-testid={`request-name-${request.id}`}>{request.name}</p>
                          <p className="text-sm text-muted-foreground" data-testid={`request-email-${request.id}`}>{request.email}</p>
                          <p className="text-xs text-muted-foreground" data-testid={`request-role-${request.id}`}>Requested: {request.requested_role}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge 
                            variant={request.status === 'pending' ? 'outline' : request.status === 'approved' ? 'default' : 'destructive'}
                            data-testid={`request-status-${request.id}`}
                          >
                            {request.status}
                          </Badge>
                          {request.status === 'pending' && (
                            <div className="flex gap-1">
                              <Button 
                                size="sm" 
                                variant="default" 
                                onClick={() => handleApproveRequest(request.id, request.requested_role)}
                                disabled={processingAction?.requestId === request.id}
                                data-testid={`button-approve-${request.id}`}
                              >
                                {processingAction?.requestId === request.id && processingAction?.action === 'approve' ? (
                                  <RefreshCw className="w-3 h-3 animate-spin" />
                                ) : (
                                  <CheckCircle className="w-3 h-3" />
                                )}
                              </Button>
                              <Button 
                                size="sm" 
                                variant="destructive" 
                                onClick={() => handleDenyRequest(request.id)}
                                disabled={processingAction?.requestId === request.id}
                                data-testid={`button-deny-${request.id}`}
                              >
                                {processingAction?.requestId === request.id && processingAction?.action === 'deny' ? (
                                  <RefreshCw className="w-3 h-3 animate-spin" />
                                ) : (
                                  <XCircle className="w-3 h-3" />
                                )}
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-4" data-testid="no-access-requests">No access requests found</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Audit Logs Tab */}
          <TabsContent value="audit-logs">
            <Card>
              <CardHeader>
                <CardTitle>Audit Logs</CardTitle>
                <CardDescription>Recent system activities and changes</CardDescription>
              </CardHeader>
              <CardContent>
                {(auditLogs as any)?.length ? (
                  <div className="space-y-2">
                    {(auditLogs as any[])?.slice(0, 20).map((log: AuditLog) => (
                      <div key={log.id} className="flex items-start gap-3 p-3 border rounded text-sm" data-testid={`audit-log-${log.id}`}>
                        <Clock className="w-4 h-4 mt-0.5 text-muted-foreground" />
                        <div className="flex-1">
                          <p data-testid={`log-action-${log.id}`}>
                            <span className="font-medium">{log.actor_email}</span> performed{' '}
                            <span className="font-medium text-primary">{log.action}</span>
                            {log.target_email && (
                              <> on <span className="font-medium">{log.target_email}</span></>
                            )}
                          </p>
                          {log.details && (
                            <p className="text-xs text-muted-foreground mt-1" data-testid={`log-details-${log.id}`}>
                              {JSON.stringify(log.details)}
                            </p>
                          )}
                          <p className="text-xs text-muted-foreground" data-testid={`log-timestamp-${log.id}`}>
                            {new Date(log.created_at).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-4" data-testid="no-audit-logs">No audit logs found</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* MFA Password Change Modal */}
      <Dialog open={showMFA} onOpenChange={setShowMFA}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Super Admin Password Change</DialogTitle>
            <DialogDescription>
              Secure password change with multi-factor authentication
            </DialogDescription>
          </DialogHeader>
          <MFAPasswordChange />
        </DialogContent>
      </Dialog>
    </div>
  );
}