import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { useTheme } from "@/lib/theme";
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { NotificationPanel } from "@/components/NotificationPanel";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { 
  Settings, 
  Bell, 
  Moon, 
  Sun, 
  ClipboardList, 
  TrendingUp, 
  Users, 
  Cog,
  Clock,
  IndianRupee,
  TriangleAlert,
  FileText,
  Plus,
  Car,
  Wrench,
  UserX,
  UserCheck,
  RefreshCw
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";

export default function AdminDashboard() {
  const { user, garage } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, navigate] = useLocation();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showLowStockAlert, setShowLowStockAlert] = useState(false);

  const { data: pendingJobs } = useQuery({
    queryKey: ["/api/garages", garage?.id, "job-cards"],
    queryFn: async () => {
      if (!garage?.id) return [];
      const response = await apiRequest("GET", `/api/garages/${garage.id}/job-cards?status=pending`);
      return response.json();
    },
    enabled: !!garage?.id,
  });

  const { data: salesStats } = useQuery({
    queryKey: ["/api/garages", garage?.id, "sales", "stats"],
    queryFn: async () => {
      if (!garage?.id) return null;
      const response = await apiRequest("GET", `/api/garages/${garage.id}/sales/stats`);
      return response.json();
    },
    enabled: !!garage?.id,
  });

  const { data: todayStats } = useQuery({
    queryKey: ["/api/garages", garage?.id, "sales", "today"],
    queryFn: async () => {
      if (!garage?.id) return null;
      const response = await apiRequest("GET", `/api/garages/${garage.id}/sales/today`);
      return response.json();
    },
    enabled: !!garage?.id,
  });

  const { data: lowStockParts } = useQuery({
    queryKey: ["/api/garages", garage?.id, "spare-parts", "low-stock"],
    queryFn: async () => {
      if (!garage?.id) return [];
      const response = await apiRequest("GET", `/api/garages/${garage.id}/spare-parts/low-stock`);
      return response.json();
    },
    enabled: !!garage?.id,
  });

  // Fetch staff members for the garage
  const { data: staffMembers } = useQuery({
    queryKey: ["/api/garages", garage?.id, "staff"],
    queryFn: async () => {
      if (!garage?.id) return [];
      const response = await apiRequest("GET", `/api/garages/${garage.id}/staff`);
      return response.json();
    },
    enabled: !!garage?.id,
  });

  // Update user status mutation
  const updateUserStatusMutation = useMutation({
    mutationFn: ({ userId, status }: { userId: string; status: string }) => {
      return apiRequest('PATCH', `/api/users/${userId}/status`, { status });
    },
    onSuccess: (_, { status }) => {
      toast({
        title: 'Success',
        description: `Staff member ${status === 'suspended' ? 'suspended' : 'activated'} successfully`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/garages", garage?.id, "staff"] });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update staff status',
        variant: 'destructive',
      });
    },
  });

  const handleToggleStaffStatus = (userId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'suspended' : 'active';
    updateUserStatusMutation.mutate({ userId, status: newStatus });
  };

  // Show low stock alert if there are items
  useEffect(() => {
    if (lowStockParts && lowStockParts.length > 0) {
      setShowLowStockAlert(true);
    }
  }, [lowStockParts]);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="gradient-header text-primary-foreground">
        <div className="flex items-center justify-between px-2 sm:px-4 py-3 sm:py-4">
          <div className="flex items-center space-x-2 sm:space-x-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-white rounded-full flex items-center justify-center">
              <Settings className="text-primary w-4 h-4 sm:w-6 sm:h-6" />
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-semibold" data-testid="title-admin-dashboard">
                Admin Dashboard
              </h1>
              <p className="text-xs sm:text-sm text-blue-100">
                {garage?.name || "Admin Portal"}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-1 sm:space-x-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowNotifications(true)}
              className="text-primary-foreground hover:bg-white/10 relative p-1 sm:p-2"
              data-testid="button-notifications"
            >
              <Bell className="w-4 h-4 sm:w-5 sm:h-5" />
              {(lowStockParts?.length || 0) > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 sm:w-5 sm:h-5 flex items-center justify-center text-[10px] sm:text-xs">
                  {lowStockParts?.length}
                </span>
              )}
            </Button>
            
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              className="text-primary-foreground hover:bg-white/10 p-1 sm:p-2"
              data-testid="button-theme-toggle"
            >
              {theme === "dark" ? <Sun className="w-4 h-4 sm:w-5 sm:h-5" /> : <Moon className="w-4 h-4 sm:w-5 sm:h-5" />}
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-2 sm:px-4 py-4 sm:py-6 space-y-4 sm:space-y-6">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <Card data-testid="card-pending-jobs">
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center space-x-2">
                <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-orange-600" />
                <div>
                  <p className="text-xs sm:text-sm text-muted-foreground">Pending Jobs</p>
                  <p className="text-lg sm:text-2xl font-bold">{pendingJobs?.length || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card data-testid="card-today-revenue">
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <IndianRupee className="w-5 h-5 text-green-600" />
                <div>
                  <p className="text-sm text-muted-foreground">Today's Revenue</p>
                  <p className="text-2xl font-bold">₹{todayStats?.revenue || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card data-testid="card-total-revenue">
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <TrendingUp className="w-5 h-5 text-blue-600" />
                <div>
                  <p className="text-sm text-muted-foreground">Total Revenue</p>
                  <p className="text-2xl font-bold">₹{salesStats?.totalRevenue || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card data-testid="card-low-stock-alert">
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <TriangleAlert className="w-5 h-5 text-red-600" />
                <div>
                  <p className="text-sm text-muted-foreground">Low Stock</p>
                  <p className="text-2xl font-bold text-red-600">{lowStockParts?.length || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wrench className="w-5 h-5" />
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <Button
                onClick={() => navigate("/job-card")}
                className="h-20 flex flex-col items-center justify-center space-y-2"
                data-testid="button-new-job"
              >
                <Plus className="w-6 h-6" />
                <span>New Job Card</span>
              </Button>
              
              <Button
                variant="outline"
                onClick={() => navigate("/customers")}
                className="h-20 flex flex-col items-center justify-center space-y-2"
                data-testid="button-manage-customers"
              >
                <Users className="w-6 h-6" />
                <span>Customers</span>
              </Button>
              
              <Button
                variant="outline"
                onClick={() => navigate("/spare-parts")}
                className="h-20 flex flex-col items-center justify-center space-y-2"
                data-testid="button-spare-parts"
              >
                <Cog className="w-6 h-6" />
                <span>Spare Parts</span>
              </Button>
              
              <Button
                variant="outline"
                onClick={() => navigate("/sales")}
                className="h-20 flex flex-col items-center justify-center space-y-2"
                data-testid="button-sales-reports"
              >
                <FileText className="w-6 h-6" />
                <span>Sales Reports</span>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Staff Management */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Staff Management
            </CardTitle>
          </CardHeader>
          <CardContent>
            {staffMembers && staffMembers.length > 0 ? (
              <div className="space-y-3">
                {staffMembers.map((staff: any) => (
                  <div 
                    key={staff.id}
                    className="flex items-center justify-between p-3 bg-muted rounded-lg"
                    data-testid={`staff-row-${staff.id}`}
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium" data-testid={`staff-name-${staff.id}`}>{staff.name}</p>
                        <Badge 
                          variant={staff.status === 'active' ? 'default' : 'destructive'}
                          className="text-xs"
                          data-testid={`staff-status-badge-${staff.id}`}
                        >
                          {staff.status === 'active' ? 'Active' : 'Suspended'}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground" data-testid={`staff-email-${staff.id}`}>{staff.email}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs text-muted-foreground">
                        {staff.status === 'active' ? 'Active' : 'Suspended'}
                      </span>
                      <Switch
                        checked={staff.status === 'active'}
                        onCheckedChange={() => handleToggleStaffStatus(staff.id, staff.status || 'active')}
                        disabled={updateUserStatusMutation.isPending}
                        data-testid={`switch-toggle-staff-status-${staff.id}`}
                        className="data-[state=checked]:bg-green-500 data-[state=unchecked]:bg-red-500"
                      />
                      {updateUserStatusMutation.isPending && (
                        <RefreshCw className="w-3 h-3 animate-spin" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No staff members found</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ClipboardList className="w-5 h-5" />
              Recent Job Cards
            </CardTitle>
          </CardHeader>
          <CardContent>
            {pendingJobs && pendingJobs.length > 0 ? (
              <div className="space-y-3">
                {pendingJobs.slice(0, 5).map((job: any) => (
                  <div 
                    key={job.id}
                    className="flex items-center justify-between p-3 bg-muted rounded-lg"
                    data-testid={`job-card-${job.id}`}
                  >
                    <div>
                      <p className="font-medium">{job.customerName}</p>
                      <p className="text-sm text-muted-foreground">{job.bikeNumber}</p>
                      <p className="text-sm text-muted-foreground">{job.complaint}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">₹{job.totalAmount}</p>
                      <p className="text-sm text-muted-foreground">{job.status}</p>
                    </div>
                  </div>
                ))}
                
                <Button
                  variant="outline"
                  onClick={() => navigate("/pending-services")}
                  className="w-full mt-4"
                  data-testid="button-view-all-jobs"
                >
                  View All Pending Jobs
                </Button>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Car className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No pending job cards</p>
                <Button
                  onClick={() => navigate("/job-card")}
                  className="mt-4"
                  data-testid="button-create-first-job"
                >
                  Create Your First Job Card
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Notification Panel */}
      <NotificationPanel
        isOpen={showNotifications}
        onClose={() => setShowNotifications(false)}
        lowStockParts={lowStockParts || []}
      />

      {/* Low Stock Alert Dialog */}
      <AlertDialog open={showLowStockAlert} onOpenChange={setShowLowStockAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-red-600">
              <TriangleAlert className="w-5 h-5" />
              Low Stock Alert
            </AlertDialogTitle>
            <AlertDialogDescription>
              You have {lowStockParts?.length} items running low on stock. 
              Consider restocking to avoid service delays.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction 
              onClick={() => navigate("/spare-parts")}
              data-testid="button-manage-stock"
            >
              Manage Stock
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}