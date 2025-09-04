import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SalesChart } from "@/components/SalesChart";
import { Analytics3DChart } from "@/components/Analytics3DChart";
import { NotificationPanel } from "@/components/NotificationPanel";
import { ArrowLeft, Filter, FileText, Settings, TrendingUp, IndianRupee, Bell, BarChart, Wrench, DollarSign, Lock } from "lucide-react";

export default function Sales() {
  const [, navigate] = useLocation();
  const { garage, user } = useAuth();
  const [showInitialLoading, setShowInitialLoading] = useState(true);

  // Show loading animation on every page visit
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowInitialLoading(false);
    }, 800); // Show wrench animation for 800ms on every visit
    return () => clearTimeout(timer);
  }, []);
  
  // Check if user is staff - restrict access to financial data
  const isStaff = user?.role === 'mechanic_staff';
  
  // Show access denied page for staff
  if (isStaff) {
    return (
      <div className="min-h-screen bg-background">
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
            <h2 className="text-lg font-semibold">Sales & Analytics</h2>
          </div>
        </div>
        <div className="screen-content flex items-center justify-center">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 mx-auto bg-destructive/10 rounded-full flex items-center justify-center">
              <Lock className="w-8 h-8 text-destructive" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-semibold">Access Restricted</h3>
              <p className="text-muted-foreground max-w-md">
                Sales and financial data are only available to garage administrators. 
                Please contact your garage admin for access to this information.
              </p>
            </div>
            <Button 
              variant="outline" 
              onClick={() => navigate("/dashboard")}
              className="mt-4"
            >
              Return to Dashboard
            </Button>
          </div>
        </div>
      </div>
    );
  }
  const [showNotifications, setShowNotifications] = useState(false);
  const [activeChart, setActiveChart] = useState<'service' | 'parts' | 'profit' | null>(null);
  const [analyticsData, setAnalyticsData] = useState<Array<any>>([]);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);

  const { data: salesStats, isLoading: statsLoading } = useQuery({
    queryKey: ["/api/garages", garage?.id, "sales", "stats"],
    queryFn: async () => {
      if (!garage?.id) return null;
      const response = await apiRequest("GET", `/api/garages/${garage.id}/sales/stats`);
      return response.json();
    },
    enabled: !!garage?.id,
  });

  const { data: todayStats, isLoading: todayStatsLoading } = useQuery({
    queryKey: ["/api/garages", garage?.id, "sales", "today"],
    queryFn: async () => {
      if (!garage?.id) return null;
      const response = await apiRequest("GET", `/api/garages/${garage.id}/sales/today`);
      return response.json();
    },
    enabled: !!garage?.id,
  });

  const { data: recentInvoices = [], isLoading: invoicesLoading } = useQuery({
    queryKey: ["/api/garages", garage?.id, "invoices"],
    queryFn: async () => {
      if (!garage?.id) return [];
      const response = await apiRequest("GET", `/api/garages/${garage.id}/invoices`);
      return response.json();
    },
    enabled: !!garage?.id,
  });

  const { data: monthlyData = [], isLoading: monthlyLoading } = useQuery({
    queryKey: ["/api/garages", garage?.id, "sales", "monthly"],
    queryFn: async () => {
      if (!garage?.id) return [];
      const response = await apiRequest("GET", `/api/garages/${garage.id}/sales/monthly`);
      return response.json();
    },
    enabled: !!garage?.id,
  });

  const { data: notificationCount = 0 } = useQuery({
    queryKey: ["/api/garages", garage?.id, "notifications", "unread-count"],
    queryFn: async () => {
      if (!garage?.id) return 0;
      const response = await apiRequest("GET", `/api/garages/${garage.id}/notifications/unread-count`);
      const data = await response.json();
      return data.count;
    },
    enabled: !!garage?.id,
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  const formatDate = (dateString: string) => {
    if (!dateString || dateString === 'Invalid Date') return 'Invalid Date';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Invalid Date';
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  // Handle analytics filter changes
  const handleAnalyticsFilterChange = async (filter: {
    period: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly' | 'custom';
    startDate?: string;
    endDate?: string;
  }) => {
    if (!garage?.id || !filter.startDate || !filter.endDate) return;
    
    setAnalyticsLoading(true);
    
    try {
      // Map period to groupBy correctly for enhanced granularity
      let groupBy: string;
      switch (filter.period) {
        case 'daily':
          // For daily view, always show daily data (7 days by default)
          groupBy = 'day';
          break;
        case 'weekly':
          groupBy = 'week';
          break;
        case 'monthly':
          groupBy = 'month';
          break;
        case 'quarterly':
          groupBy = 'quarter';
          break;
        case 'yearly':
          groupBy = 'year';
          break;
        case 'custom':
          // For custom range, determine groupBy based on date range duration
          const customStart = new Date(filter.startDate);
          const customEnd = new Date(filter.endDate);
          const customDaysDiff = Math.ceil((customEnd.getTime() - customStart.getTime()) / (1000 * 60 * 60 * 24));
          
          if (customDaysDiff === 0) {
            // Same day - show hourly data
            groupBy = 'hour';
          } else if (customDaysDiff <= 31) {
            groupBy = 'day';
          } else if (customDaysDiff <= 365) {
            groupBy = 'month';
          } else {
            groupBy = 'year';
          }
          break;
        default:
          groupBy = 'month';
      }
      
      console.log(`Fetching analytics: ${filter.startDate} to ${filter.endDate}, groupBy: ${groupBy}`);
      
      const response = await apiRequest(
        "GET", 
        `/api/garages/${garage.id}/sales/analytics?startDate=${filter.startDate}&endDate=${filter.endDate}&groupBy=${groupBy}`
      );
      const rawData = await response.json();
      console.log(`Analytics data received:`, rawData);
      
      // Transform the API data to match Analytics3DChart expected format
      const transformedData = rawData.map((item: any) => ({
        period: item.date || item.period || '',
        totalSales: Number(item.revenue || item.totalSales || 0),
        serviceCharges: Number(item.serviceCharges || 0),
        partsRevenue: Number(item.partsRevenue || 0),
        profit: Number(item.profit || item.serviceCharges || 0), // Profit calculation includes service charges
        invoiceCount: Number(item.count || item.invoiceCount || 0)
      }));
      
      setAnalyticsData(transformedData);
    } catch (error) {
      console.error('Failed to fetch analytics data:', error);
      setAnalyticsData([]);
    } finally {
      setAnalyticsLoading(false);
    }
  };

  const handleKPIClick = async (type: 'service' | 'parts' | 'profit') => {
    setActiveChart(type);
    
    // Load default monthly data for the last 6 months
    const endDate = new Date().toISOString().split('T')[0];
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - 6);
    
    await handleAnalyticsFilterChange({
      period: 'monthly',
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate
    });
  };

  const handleChartFilterChange = async (filter: {
    period: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly' | 'custom';
    startDate?: string;
    endDate?: string;
  }) => {
    await handleAnalyticsFilterChange(filter);
  };



  // Transform monthly data for chart display
  const transformedChartData = monthlyData.map((month: {
    month: string;
    year: number;
    serviceCharges: number;
    invoiceCount: number;
  }) => ({
    name: month.month.substring(0, 3), // Short month name
    amount: month.serviceCharges,
    percentage: Math.round((month.serviceCharges / (salesStats?.totalServiceCharges || 1)) * 100)
  })).reverse(); // Show oldest first for chart



  if (statsLoading || invoicesLoading || monthlyLoading || showInitialLoading) {
    return (
      <div className="min-h-screen bg-background">
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
            <h2 className="text-lg font-semibold">Service Charges & Analytics</h2>
          </div>
        </div>
        <div className="screen-content flex items-center justify-center">
          <div className="flex flex-col items-center space-y-3">
            <Wrench className="w-8 h-8 text-primary animate-spin" />
            <span className="text-muted-foreground">Loading...</span>
          </div>
        </div>
      </div>
    );
  }

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
          <h2 className="text-lg font-semibold">Service Charges & Analytics</h2>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="icon"
            className="text-white hover:bg-white/10 relative"
            onClick={() => setShowNotifications(true)}
          >
            <Bell className="w-5 h-5" />
            {notificationCount > 0 && (
              <div className="notification-badge">{notificationCount > 99 ? "99+" : notificationCount}</div>
            )}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="text-white hover:bg-white/10"
          >
            <Filter className="w-5 h-5" />
          </Button>
        </div>
      </div>

      <div className="screen-content space-y-4">
        {/* Analytics Filter */}


        {/* Enhanced KPI Cards */}
        <div className="grid grid-cols-1 gap-4">
          {/* Total Invoices */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm">Total Invoices</p>
                  <p className="text-2xl font-bold">{salesStats?.totalInvoices || 0}</p>
                </div>
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                  <FileText className="text-primary w-6 h-6" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Total Profit KPI - From All Invoices */}
          <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => handleKPIClick('profit')}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm">Total Profit (All Invoices)</p>
                  <p className="text-2xl font-bold success-text">₹{Number(salesStats?.totalProfit || 0).toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground flex items-center mt-1">
                    <BarChart className="w-3 h-3 mr-1" />
                    Click to view analytics
                  </p>
                </div>
                <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
                  <TrendingUp className="text-green-600 dark:text-green-400 w-6 h-6" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Service Revenue KPI - Clickable */}
          <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => handleKPIClick('service')}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm">Service Revenue</p>
                  <p className="text-2xl font-bold text-blue-600">₹{Number(salesStats?.totalServiceCharges || 0).toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground flex items-center mt-1">
                    <BarChart className="w-3 h-3 mr-1" />
                    Click to view analytics
                  </p>
                </div>
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                  <Wrench className="text-blue-600 dark:text-blue-400 w-6 h-6" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Parts Revenue KPI - Clickable */}
          <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => handleKPIClick('parts')}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm">Spares Revenue</p>
                  <p className="text-2xl font-bold text-green-600">₹{Number(salesStats?.totalPartsTotal || 0).toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground flex items-center mt-1">
                    <BarChart className="w-3 h-3 mr-1" />
                    Click to view analytics
                  </p>
                </div>
                <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
                  <Settings className="text-green-600 dark:text-green-400 w-6 h-6" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Today's Sales Section */}
          <div className="bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900 dark:to-pink-900 rounded-lg p-4 border">
            <h3 className="text-lg font-semibold text-purple-800 dark:text-purple-200 mb-3">Today's Sales</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <p className="text-sm text-purple-600 dark:text-purple-300">Today's Profit</p>
                <p className="text-xl font-bold text-purple-800 dark:text-purple-200">
                  ₹{Number(todayStats?.todayProfit || 0).toLocaleString()}
                </p>
              </div>
              <div className="text-center">
                <p className="text-sm text-purple-600 dark:text-purple-300">Today's Invoices</p>
                <p className="text-xl font-bold text-purple-800 dark:text-purple-200">
                  {todayStats?.todayInvoices || 0}
                </p>
              </div>
            </div>
            <div className="mt-3 text-center">
              <p className="text-xs text-purple-600 dark:text-purple-400">
                Today's Service: ₹{Number(todayStats?.todayService || 0).toLocaleString()} | 
                Parts: ₹{Number(todayStats?.todayParts || 0).toLocaleString()}
              </p>
            </div>
          </div>


        </div>

        {/* Service Charges Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Monthly Service Charges</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {transformedChartData.map((month: { name: string; amount: number; percentage: number }, index: number) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">{month.name}</span>
                  <div className="flex-1 mx-3">
                    <div className="w-full bg-muted rounded-full h-2">
                      <div 
                        className="bg-primary h-2 rounded-full transition-all duration-300" 
                        style={{ width: `${month.percentage}%` }}
                      />
                    </div>
                  </div>
                  <span className="text-sm font-medium">₹{Number(month.amount || 0).toLocaleString()}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Transactions */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            {recentInvoices.length === 0 ? (
              <div className="text-center text-muted-foreground py-4">
                No transactions yet
              </div>
            ) : (
              <div className="space-y-3">
                {recentInvoices.slice(0, 5).map((invoice: any) => (
                  <div key={invoice.id} className="flex items-center justify-between py-2 border-b border-border last:border-b-0">
                    <div>
                      <p className="font-medium">Invoice #{(invoice as any).invoice_number || invoice.invoiceNumber || 'N/A'}</p>
                      <p className="text-sm text-muted-foreground">{formatDate((invoice as any).created_at || invoice.createdAt)}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">₹{Number((invoice as any).total_amount || invoice.totalAmount || 0).toLocaleString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 3D Analytics Chart Modal */}
      <Analytics3DChart
        title={activeChart === 'service' ? 'Service Revenue' : 
               activeChart === 'parts' ? 'Spares Revenue' : 
               'Profit'}
        type={activeChart || 'service'}
        isOpen={!!activeChart}
        onClose={() => setActiveChart(null)}
        data={analyticsData}
        onFilterChange={handleChartFilterChange}
        isLoading={analyticsLoading}
      />

      {/* Notifications Panel */}
      <NotificationPanel
        isOpen={showNotifications}
        onClose={() => setShowNotifications(false)}
      />
    </div>
  );
}
