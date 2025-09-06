import React, { useState, useEffect } from 'react';
import { 
  Users, 
  FileText, 
  Package, 
  Receipt, 
  TrendingUp,
  AlertTriangle,
  IndianRupee,
  Calendar,
  MessageCircle
} from 'lucide-react';
import { User, db, DatabaseManager } from '../lib/database';
import MobileHeader from '../components/MobileHeader';
import MobileNavigation from '../components/MobileNavigation';
import LoadingSpinner from '../components/LoadingSpinner';

interface AdminDashboardProps {
  user: User;
}

interface DashboardStats {
  totalCustomers: number;
  pendingJobs: number;
  lowStockItems: number;
  todaySales: number;
  totalInvoices: number;
  monthlyRevenue: number;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ user }) => {
  const [stats, setStats] = useState<DashboardStats>({
    totalCustomers: 0,
    pendingJobs: 0,
    lowStockItems: 0,
    todaySales: 0,
    totalInvoices: 0,
    monthlyRevenue: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [garage, setGarage] = useState<any>(null);

  useEffect(() => {
    loadDashboardData();
  }, [user.garage_id]);

  const loadDashboardData = async () => {
    try {
      setIsLoading(true);
      
      // Get garage info
      const garageData = await DatabaseManager.getCurrentGarage();
      setGarage(garageData);

      // Get dashboard statistics
      const [customers, jobCards, spareParts, invoices] = await Promise.all([
        db.customers.where('garage_id').equals(user.garage_id).toArray(),
        db.job_cards.where('garage_id').equals(user.garage_id).toArray(),
        db.spare_parts.where('garage_id').equals(user.garage_id).toArray(),
        db.invoices.where('garage_id').equals(user.garage_id).toArray()
      ]);

      const pendingJobs = jobCards.filter(job => job.status === 'pending').length;
      const lowStockItems = spareParts.filter(part => part.quantity <= part.low_stock_threshold).length;
      
      const today = new Date();
      const todayInvoices = invoices.filter(invoice => 
        invoice.created_at.toDateString() === today.toDateString()
      );
      const todaySales = todayInvoices.reduce((sum, invoice) => sum + invoice.total_amount, 0);

      const currentMonth = today.getMonth();
      const currentYear = today.getFullYear();
      const monthlyInvoices = invoices.filter(invoice => 
        invoice.created_at.getMonth() === currentMonth && 
        invoice.created_at.getFullYear() === currentYear
      );
      const monthlyRevenue = monthlyInvoices.reduce((sum, invoice) => sum + invoice.total_amount, 0);

      setStats({
        totalCustomers: customers.length,
        pendingJobs,
        lowStockItems,
        todaySales,
        totalInvoices: invoices.length,
        monthlyRevenue
      });
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <MobileHeader title="Loading..." />
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <MobileHeader 
        title={garage?.name || 'Admin Dashboard'}
        rightAction={{
          icon: <MessageCircle className="w-5 h-5" />,
          onClick: () => {
            // Open Mesthri chatbot - to be implemented
            alert('Mesthri Chatbot coming soon!');
          }
        }}
      />

      <div className="mobile-container pt-6 pb-8">
        
        {/* Welcome Section */}
        <div className="mobile-card bg-gradient-to-r from-blue-500 to-blue-600 text-white">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Welcome back, {user.name}!</h2>
              <p className="text-blue-100">Here's your garage overview</p>
            </div>
          </div>
        </div>

        {/* Key Stats Grid */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          
          <div className="mobile-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Customers</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalCustomers}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="mobile-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pending Jobs</p>
                <p className="text-2xl font-bold text-gray-900">{stats.pendingJobs}</p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                <FileText className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </div>

          <div className="mobile-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Low Stock Items</p>
                <p className="text-2xl font-bold text-red-600">{stats.lowStockItems}</p>
              </div>
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </div>

          <div className="mobile-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Today's Sales</p>
                <p className="text-2xl font-bold text-green-600">₹{stats.todaySales}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <IndianRupee className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Revenue Summary */}
        <div className="mobile-card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Revenue Summary</h3>
            <Calendar className="w-5 h-5 text-gray-400" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">Total Invoices</p>
              <p className="text-xl font-bold text-gray-900">{stats.totalInvoices}</p>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">Monthly Revenue</p>
              <p className="text-xl font-bold text-blue-600">₹{stats.monthlyRevenue}</p>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mobile-card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-2 gap-3">
            
            <button className="flex flex-col items-center p-4 bg-blue-50 rounded-lg border border-blue-100 active:bg-blue-100">
              <Users className="w-6 h-6 text-blue-600 mb-2" />
              <span className="text-sm font-medium text-blue-600">Add Customer</span>
            </button>

            <button className="flex flex-col items-center p-4 bg-green-50 rounded-lg border border-green-100 active:bg-green-100">
              <FileText className="w-6 h-6 text-green-600 mb-2" />
              <span className="text-sm font-medium text-green-600">New Job Card</span>
            </button>

            <button className="flex flex-col items-center p-4 bg-purple-50 rounded-lg border border-purple-100 active:bg-purple-100">
              <Package className="w-6 h-6 text-purple-600 mb-2" />
              <span className="text-sm font-medium text-purple-600">Add Part</span>
            </button>

            <button className="flex flex-col items-center p-4 bg-orange-50 rounded-lg border border-orange-100 active:bg-orange-100">
              <Receipt className="w-6 h-6 text-orange-600 mb-2" />
              <span className="text-sm font-medium text-orange-600">Create Invoice</span>
            </button>
          </div>
        </div>

        {/* Alerts */}
        {stats.lowStockItems > 0 && (
          <div className="mobile-card bg-red-50 border border-red-200">
            <div className="flex items-center space-x-3">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              <div>
                <p className="font-medium text-red-800">Low Stock Alert</p>
                <p className="text-sm text-red-600">
                  {stats.lowStockItems} items need restocking
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Offline Mode Notice */}
        <div className="mobile-card bg-blue-50 border border-blue-200">
          <div className="text-center">
            <p className="text-sm font-medium text-blue-800">✨ Offline Mode Active</p>
            <p className="text-xs text-blue-600">All data saved locally. Sync when online for backup.</p>
          </div>
        </div>
      </div>

      <MobileNavigation userRole={user.role} />
    </div>
  );
};

export default AdminDashboard;