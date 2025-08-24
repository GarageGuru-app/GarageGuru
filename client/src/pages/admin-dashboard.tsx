import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { useTheme } from "@/lib/theme";
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  Clock,
  IndianRupee,
  TriangleAlert,
  FileText,
  Plus,
  Car,
  Wrench,
  UserX,
  UserCheck,
  RefreshCw,
  Home,
  BarChart3,
  UserCircle,
  Package,
  LogOut,
  Building2,
  Calendar
} from "lucide-react";

export default function AdminDashboard() {
  const { user, garage, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, navigate] = useLocation();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showLowStockAlert, setShowLowStockAlert] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const { data: pendingJobs, refetch: refetchJobs } = useQuery({
    queryKey: ["/api/garages", garage?.id, "job-cards"],
    queryFn: async () => {
      if (!garage?.id) return [];
      const response = await apiRequest("GET", `/api/garages/${garage.id}/job-cards`);
      const data = await response.json();
      return data.filter((job: any) => job.status === "pending");
    },
    enabled: !!garage?.id,
  });

  const { data: todaySales, refetch: refetchTodaySales } = useQuery({
    queryKey: ["/api/garages", garage?.id, "sales", "today"],
    queryFn: async () => {
      if (!garage?.id) return { totalRevenue: 0, totalJobs: 0, totalProfit: 0 };
      const response = await apiRequest("GET", `/api/garages/${garage.id}/sales/today`);
      return response.json();
    },
    enabled: !!garage?.id,
  });

  const { data: salesStats, refetch: refetchSalesStats } = useQuery({
    queryKey: ["/api/garages", garage?.id, "sales", "stats"],
    queryFn: async () => {
      if (!garage?.id) return { totalRevenue: 0, totalJobs: 0, totalProfit: 0 };
      const response = await apiRequest("GET", `/api/garages/${garage.id}/sales/stats`);
      return response.json();
    },
    enabled: !!garage?.id,
  });

  const { data: lowStockParts, refetch: refetchLowStock } = useQuery({
    queryKey: ["/api/garages", garage?.id, "spare-parts", "low-stock"],
    queryFn: async () => {
      if (!garage?.id) return [];
      const response = await apiRequest("GET", `/api/garages/${garage.id}/spare-parts/low-stock`);
      return response.json();
    },
    enabled: !!garage?.id,
  });

  const { data: staffMembers, refetch: refetchStaff } = useQuery({
    queryKey: ["/api/garages", garage?.id, "staff"],
    queryFn: async () => {
      if (!garage?.id) return [];
      const response = await apiRequest("GET", `/api/garages/${garage.id}/staff`);
      return response.json();
    },
    enabled: !!garage?.id,
  });

  const { data: accessRequests, refetch: refetchAccessRequests } = useQuery({
    queryKey: ["/api/access-requests"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/access-requests");
      return response.json();
    },
  });

  // Check for low stock alert
  useEffect(() => {
    if (lowStockParts && lowStockParts.length > 0) {
      setShowLowStockAlert(true);
    }
  }, [lowStockParts]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([
        refetchJobs(),
        refetchTodaySales(),
        refetchSalesStats(),
        refetchLowStock(),
        refetchStaff(),
        refetchAccessRequests()
      ]);
      toast({
        title: 'Success',
        description: 'Data refreshed successfully',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to refresh data',
        variant: 'destructive',
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-2" data-testid="title-admin-dashboard">
                <Building2 className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
                Admin Dashboard
              </h1>
              <p className="text-sm sm:text-base text-muted-foreground">
                {garage?.name || 'GarageGuru'} - Manage your garage operations
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={isRefreshing}
                data-testid="button-refresh"
              >
                <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline ml-2">{isRefreshing ? 'Refreshing...' : 'Refresh'}</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowNotifications(true)}
                className="relative"
                data-testid="button-notifications"
              >
                <Bell className="w-4 h-4" />
                {(lowStockParts?.length || 0) > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center text-xs">
                    {lowStockParts?.length}
                  </span>
                )}
                <span className="hidden sm:inline ml-2">Notifications</span>
              </Button>
              <Button
                size="sm"
                onClick={() => navigate("/job-card")}
                data-testid="button-new-job-card"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline ml-2">New Job Card</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={toggleTheme}
                data-testid="button-theme-toggle"
              >
                {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
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
          <Card data-testid="stat-pending-jobs">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Car className="w-5 h-5 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">Pending Jobs</p>
                  <p className="text-2xl font-bold" data-testid="count-pending-jobs">
                    {pendingJobs?.length || 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card data-testid="stat-today-revenue">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <IndianRupee className="w-5 h-5 text-green-600" />
                <div>
                  <p className="text-sm text-muted-foreground">Today's Revenue</p>
                  <p className="text-2xl font-bold text-green-600" data-testid="amount-today-revenue">
                    ₹{todaySales?.totalRevenue?.toLocaleString() || '0'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card data-testid="stat-total-staff">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-600" />
                <div>
                  <p className="text-sm text-muted-foreground">Total Staff</p>
                  <p className="text-2xl font-bold text-blue-600" data-testid="count-total-staff">
                    {staffMembers?.length || 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card data-testid="stat-low-stock-items">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Package className="w-5 h-5 text-red-600" />
                <div>
                  <p className="text-sm text-muted-foreground">Low Stock Items</p>
                  <p className="text-2xl font-bold text-red-600" data-testid="count-low-stock">
                    {lowStockParts?.length || 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="jobs" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4 mb-4">
            <TabsTrigger value="jobs" data-testid="tab-jobs" className="text-xs sm:text-sm">
              Pending Jobs
            </TabsTrigger>
            <TabsTrigger value="sales" data-testid="tab-sales" className="text-xs sm:text-sm">
              Sales Overview
            </TabsTrigger>
            <TabsTrigger value="staff" data-testid="tab-staff" className="text-xs sm:text-sm">
              Staff Management
            </TabsTrigger>
            <TabsTrigger value="requests" data-testid="tab-requests" className="text-xs sm:text-sm">
              Access Requests
            </TabsTrigger>
          </TabsList>

          {/* Pending Jobs Tab */}
          <TabsContent value="jobs" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Car className="w-5 h-5" />
                  Pending Job Cards
                </CardTitle>
              </CardHeader>
              <CardContent>
                {pendingJobs && pendingJobs.length > 0 ? (
                  <div className="space-y-4">
                    {pendingJobs.slice(0, 5).map((job: any) => (
                      <div 
                        key={job.id} 
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 cursor-pointer"
                        onClick={() => navigate(`/job-card/${job.id}`)}
                        data-testid={`job-card-${job.id}`}
                      >
                        <div>
                          <p className="font-medium" data-testid={`job-vehicle-${job.id}`}>
                            {job.vehicle_number}
                          </p>
                          <p className="text-sm text-muted-foreground" data-testid={`job-customer-${job.id}`}>
                            {job.customer_name}
                          </p>
                        </div>
                        <Badge variant="outline" data-testid={`job-status-${job.id}`}>
                          {job.status}
                        </Badge>
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
          </TabsContent>

          {/* Sales Overview Tab */}
          <TabsContent value="sales" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Today's Sales</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <p className="text-2xl font-bold text-green-600">
                      ₹{todaySales?.totalRevenue?.toLocaleString() || '0'}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {todaySales?.totalJobs || 0} jobs completed
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Profit: ₹{todaySales?.totalProfit?.toLocaleString() || '0'}
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Total Revenue</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <p className="text-2xl font-bold">
                      ₹{salesStats?.totalRevenue?.toLocaleString() || '0'}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {salesStats?.totalJobs || 0} total jobs
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Total Profit: ₹{salesStats?.totalProfit?.toLocaleString() || '0'}
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => navigate("/sales-analytics")}
                    data-testid="button-view-analytics"
                  >
                    <BarChart3 className="w-4 h-4 mr-2" />
                    View Analytics
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => navigate("/spare-parts")}
                    data-testid="button-manage-inventory"
                  >
                    <Package className="w-4 h-4 mr-2" />
                    Manage Inventory
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Staff Management Tab */}
          <TabsContent value="staff" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Staff Members
                </CardTitle>
              </CardHeader>
              <CardContent>
                {staffMembers && staffMembers.length > 0 ? (
                  <div className="space-y-4">
                    {staffMembers.map((staff: any) => (
                      <div 
                        key={staff.id} 
                        className="flex items-center justify-between p-4 border rounded-lg"
                        data-testid={`staff-member-${staff.id}`}
                      >
                        <div>
                          <p className="font-medium" data-testid={`staff-name-${staff.id}`}>
                            {staff.name}
                          </p>
                          <p className="text-sm text-muted-foreground" data-testid={`staff-email-${staff.id}`}>
                            {staff.email}
                          </p>
                        </div>
                        <Badge 
                          variant={staff.status === 'active' ? 'default' : 'secondary'}
                          data-testid={`staff-status-${staff.id}`}
                        >
                          {staff.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No staff members yet</p>
                    <p className="text-sm">Staff can request access to join your garage</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Access Requests Tab */}
          <TabsContent value="requests" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserCheck className="w-5 h-5" />
                  Access Requests
                </CardTitle>
              </CardHeader>
              <CardContent>
                {accessRequests && accessRequests.length > 0 ? (
                  <div className="space-y-4">
                    {accessRequests.map((request: any) => (
                      <div 
                        key={request.id} 
                        className="flex items-center justify-between p-4 border rounded-lg"
                        data-testid={`access-request-${request.id}`}
                      >
                        <div>
                          <p className="font-medium" data-testid={`request-name-${request.id}`}>
                            {request.name}
                          </p>
                          <p className="text-sm text-muted-foreground" data-testid={`request-email-${request.id}`}>
                            {request.email}
                          </p>
                          <p className="text-sm text-muted-foreground" data-testid={`request-role-${request.id}`}>
                            Requested role: {request.requested_role}
                          </p>
                        </div>
                        <Badge 
                          variant={request.status === 'pending' ? 'outline' : 'default'}
                          data-testid={`request-status-${request.id}`}
                        >
                          {request.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <UserCheck className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No access requests</p>
                    <p className="text-sm">New access requests will appear here</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Notification Panel */}
      <NotificationPanel
        isOpen={showNotifications}
        onClose={() => setShowNotifications(false)}
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

      {/* Mobile Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 lg:hidden">
        <div className="grid grid-cols-5 py-2">
          <button 
            onClick={() => navigate('/admin-dashboard')}
            className="flex flex-col items-center justify-center p-2 text-blue-600"
            data-testid="bottom-nav-dashboard"
          >
            <Home className="w-5 h-5" />
            <span className="text-xs mt-1">Dashboard</span>
          </button>
          <button 
            onClick={() => navigate('/pending-services')}
            className="flex flex-col items-center justify-center p-2 text-gray-600 dark:text-gray-400"
            data-testid="bottom-nav-services"
          >
            <Wrench className="w-5 h-5" />
            <span className="text-xs mt-1">Services</span>
          </button>
          <button 
            onClick={() => navigate('/customers')}
            className="flex flex-col items-center justify-center p-2 text-gray-600 dark:text-gray-400"
            data-testid="bottom-nav-customers"
          >
            <Users className="w-5 h-5" />
            <span className="text-xs mt-1">Customers</span>
          </button>
          <button 
            onClick={() => navigate('/sales-analytics')}
            className="flex flex-col items-center justify-center p-2 text-gray-600 dark:text-gray-400"
            data-testid="bottom-nav-sales"
          >
            <BarChart3 className="w-5 h-5" />
            <span className="text-xs mt-1">Sales</span>
          </button>
          <button 
            onClick={() => navigate('/profile')}
            className="flex flex-col items-center justify-center p-2 text-gray-600 dark:text-gray-400"
            data-testid="bottom-nav-profile"
          >
            <UserCircle className="w-5 h-5" />
            <span className="text-xs mt-1">Profile</span>
          </button>
        </div>
      </div>

      {/* Add bottom padding for mobile to prevent overlap */}
      <div className="h-16 lg:hidden"></div>
    </div>
  );
}