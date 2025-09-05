import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { useTheme } from "@/lib/theme";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
  FileText
} from "lucide-react";


export default function Dashboard() {
  const { user, garage } = useAuth();
  const { theme, toggleTheme } = useTheme();
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
      if (!garage?.id || user?.role !== "garage_admin") return null;
      const response = await apiRequest("GET", `/api/garages/${garage.id}/sales/stats`);
      return response.json();
    },
    enabled: !!garage?.id && user?.role === "garage_admin",
  });

  const { data: todayStats } = useQuery({
    queryKey: ["/api/garages", garage?.id, "sales", "today"],
    queryFn: async () => {
      if (!garage?.id || user?.role !== "garage_admin") return null;
      const response = await apiRequest("GET", `/api/garages/${garage.id}/sales/today`);
      return response.json();
    },
    enabled: !!garage?.id && user?.role === "garage_admin",
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

  const { data: unreadCount = 0 } = useQuery({
    queryKey: ["/api/garages", garage?.id, "notifications", "unread-count"],
    queryFn: async () => {
      if (!garage?.id) return 0;
      const response = await apiRequest("GET", `/api/garages/${garage.id}/notifications/unread-count`);
      const data = await response.json();
      return data.count;
    },
    enabled: !!garage?.id,
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const pendingCount = pendingJobs?.length || 0;
  const lowStockCount = lowStockParts?.length || 0;
  const todaySales = todayStats?.todayProfit || 0;

  // Show low stock alert popup on login if there are low stock items
  useEffect(() => {
    if (lowStockCount > 0 && garage?.id) {
      const alertShownKey = `lowStockAlert_${garage.id}_${new Date().toDateString()}`;
      const hasShownToday = localStorage.getItem(alertShownKey);
      
      if (!hasShownToday) {
        setShowLowStockAlert(true);
        localStorage.setItem(alertShownKey, 'true');
      }
    }
  }, [lowStockCount, garage?.id]);

  const quickActions = [
    {
      title: "New Job Card",
      icon: ClipboardList,
      path: "/job-card",
      bgColor: "bg-primary/10",
      iconColor: "text-primary",
    },
    {
      title: "Pending Services",
      icon: Clock,
      path: "/pending-services",
      bgColor: "warning-bg",
      iconColor: "warning-text",
    },
    {
      title: "Invoices",
      icon: FileText,
      path: "/invoices",
      bgColor: "success-bg",
      iconColor: "success-text",
    },
    {
      title: "Customers",
      icon: Users,
      path: "/customers",
      bgColor: "bg-orange-100 dark:bg-orange-900/20",
      iconColor: "text-orange-600",
    },
    {
      title: "Spare Parts",
      icon: Cog,
      path: "/spare-parts",
      bgColor: "bg-purple-100 dark:bg-purple-900/20",
      iconColor: "text-purple-600",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="screen-header">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center overflow-hidden">
            {garage?.logo ? (
              <img 
                src={garage.logo} 
                alt="Garage Logo" 
                className="w-full h-full object-cover"
              />
            ) : (
              <Settings className="w-5 h-5 text-white" />
            )}
          </div>
          <div>
            <h2 className="font-semibold">{garage?.name || "ServiceGuru"}</h2>
            <p className="text-sm text-blue-100">{user?.role?.replace('_', ' ')}</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowNotifications(true)}
            className="text-white hover:bg-white/10 relative"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <div className="notification-badge">{unreadCount}</div>
            )}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className="text-white hover:bg-white/10"
          >
            {theme === "dark" ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </Button>
        </div>
      </div>

      <div className="screen-content">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm">Pending Jobs</p>
                  <p className="text-2xl font-bold">{pendingCount}</p>
                </div>
                <div className="icon-container warning-bg">
                  <Clock className="warning-text text-xl w-6 h-6" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm">Today's Profit</p>
                  <p className="text-2xl font-bold">₹{Number(todayStats?.todayProfit || 0).toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">Service charges only</p>
                </div>
                <div className="icon-container success-bg">
                  <IndianRupee className="success-text text-xl w-6 h-6" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Additional Revenue Stats for Admin */}
        {user?.role === "garage_admin" && (
          <div className="grid grid-cols-1 gap-4 mb-6">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-muted-foreground text-sm">Total Revenue</p>
                    <p className="text-2xl font-bold">₹{Number((salesStats?.totalServiceCharges || 0) + (salesStats?.totalPartsTotal || 0)).toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">Service + Parts from {salesStats?.totalInvoices || 0} invoices</p>
                  </div>
                  <div className="icon-container bg-blue-100 dark:bg-blue-900">
                    <TrendingUp className="text-blue-600 dark:text-blue-400 text-xl w-6 h-6" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Quick Actions Grid */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <Card 
                key={action.title}
                className="action-card cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => navigate(action.path)}
              >
                <CardContent className="p-6 flex flex-col items-center space-y-3">
                  <div className={`icon-container ${action.bgColor}`}>
                    <Icon className={`${action.iconColor} text-2xl w-8 h-8`} />
                  </div>
                  <span className="font-semibold text-center">{action.title}</span>
                </CardContent>
              </Card>
            );
          })}
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
              <AlertDialogTitle className="flex items-center space-x-2">
                <TriangleAlert className="w-5 h-5 text-destructive" />
                <span>Low Stock Alert</span>
              </AlertDialogTitle>
              <AlertDialogDescription>
                You have {lowStockCount} spare part{lowStockCount !== 1 ? 's' : ''} running low on stock. 
                Please check your inventory and reorder as needed to avoid service disruptions.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogAction
                onClick={() => {
                  setShowLowStockAlert(false);
                  navigate("/spare-parts");
                }}
                className="bg-destructive hover:bg-destructive/90"
              >
                View Spare Parts
              </AlertDialogAction>
              <AlertDialogAction
                onClick={() => setShowLowStockAlert(false)}
              >
                Dismiss
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
