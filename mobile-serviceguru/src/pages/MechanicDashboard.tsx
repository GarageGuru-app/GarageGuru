import React, { useState, useEffect } from 'react';
import { 
  Wrench, 
  Clock, 
  CheckCircle, 
  FileText, 
  Users,
  Package,
  MessageCircle
} from 'lucide-react';
import { User, db } from '../lib/database';
import MobileHeader from '../components/MobileHeader';
import MobileNavigation from '../components/MobileNavigation';
import LoadingSpinner from '../components/LoadingSpinner';

interface MechanicDashboardProps {
  user: User;
}

const MechanicDashboard: React.FC<MechanicDashboardProps> = ({ user }) => {
  const [stats, setStats] = useState({
    myJobs: 0,
    completedToday: 0,
    inProgress: 0,
    pending: 0
  });
  const [recentJobs, setRecentJobs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadMechanicData();
  }, [user.garage_id]);

  const loadMechanicData = async () => {
    try {
      setIsLoading(true);

      // Get all job cards for this garage
      const jobCards = await db.job_cards
        .where('garage_id')
        .equals(user.garage_id)
        .reverse() // Most recent first
        .toArray();

      // Calculate stats
      const today = new Date().toDateString();
      const todayJobs = jobCards.filter(job => 
        job.created_at.toDateString() === today
      );
      
      const completedToday = todayJobs.filter(job => 
        job.status === 'completed' || job.status === 'invoiced'
      ).length;

      const inProgress = jobCards.filter(job => job.status === 'in_progress').length;
      const pending = jobCards.filter(job => job.status === 'pending').length;

      setStats({
        myJobs: jobCards.length,
        completedToday,
        inProgress,
        pending
      });

      // Get recent jobs with customer data
      const recentJobsWithCustomers = await Promise.all(
        jobCards.slice(0, 5).map(async (job) => {
          const customer = await db.customers.get(job.customer_id);
          return { ...job, customer };
        })
      );

      setRecentJobs(recentJobsWithCustomers);
    } catch (error) {
      console.error('Error loading mechanic data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'text-orange-600 bg-orange-100';
      case 'in_progress': return 'text-blue-600 bg-blue-100';
      case 'completed': return 'text-green-600 bg-green-100';
      case 'invoiced': return 'text-purple-600 bg-purple-100';
      default: return 'text-gray-600 bg-gray-100';
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
        title="Mechanic Dashboard"
        rightAction={{
          icon: <MessageCircle className="w-5 h-5" />,
          onClick: () => {
            alert('Mesthri Assistant coming soon!');
          }
        }}
      />

      <div className="mobile-container pt-6 pb-8">
        
        {/* Welcome Section */}
        <div className="mobile-card bg-gradient-to-r from-green-500 to-green-600 text-white">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
              <Wrench className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Hello, {user.name}!</h2>
              <p className="text-green-100">Ready to work on some vehicles?</p>
            </div>
          </div>
        </div>

        {/* Work Stats */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          
          <div className="mobile-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pending Jobs</p>
                <p className="text-2xl font-bold text-orange-600">{stats.pending}</p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                <Clock className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </div>

          <div className="mobile-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">In Progress</p>
                <p className="text-2xl font-bold text-blue-600">{stats.inProgress}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <Wrench className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="mobile-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Completed Today</p>
                <p className="text-2xl font-bold text-green-600">{stats.completedToday}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="mobile-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Jobs</p>
                <p className="text-2xl font-bold text-gray-900">{stats.myJobs}</p>
              </div>
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                <FileText className="w-6 h-6 text-gray-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Recent Job Cards */}
        <div className="mobile-card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Job Cards</h3>
          
          {recentJobs.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No job cards yet</p>
              <p className="text-sm text-gray-400">Job cards will appear here once created</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentJobs.map((job) => (
                <div key={job.id} className="border border-gray-200 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <Users className="w-4 h-4 text-gray-400" />
                      <span className="font-medium text-gray-900">
                        {job.customer?.name || 'Unknown Customer'}
                      </span>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(job.status)}`}>
                      {job.status.replace('_', ' ')}
                    </span>
                  </div>
                  
                  <p className="text-sm text-gray-600 mb-2">{job.complaint}</p>
                  
                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <span>₹{job.service_charges}</span>
                    <span>{new Date(job.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="mobile-card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-2 gap-3">
            
            <button className="flex flex-col items-center p-4 bg-blue-50 rounded-lg border border-blue-100 active:bg-blue-100">
              <FileText className="w-6 h-6 text-blue-600 mb-2" />
              <span className="text-sm font-medium text-blue-600">View Jobs</span>
            </button>

            <button className="flex flex-col items-center p-4 bg-green-50 rounded-lg border border-green-100 active:bg-green-100">
              <Users className="w-6 h-6 text-green-600 mb-2" />
              <span className="text-sm font-medium text-green-600">Customers</span>
            </button>

            <button className="flex flex-col items-center p-4 bg-purple-50 rounded-lg border border-purple-100 active:bg-purple-100">
              <Package className="w-6 h-6 text-purple-600 mb-2" />
              <span className="text-sm font-medium text-purple-600">Spare Parts</span>
            </button>

            <button className="flex flex-col items-center p-4 bg-orange-50 rounded-lg border border-orange-100 active:bg-orange-100">
              <MessageCircle className="w-6 h-6 text-orange-600 mb-2" />
              <span className="text-sm font-medium text-orange-600">Mesthri Help</span>
            </button>
          </div>
        </div>

        {/* Tips Section */}
        <div className="mobile-card bg-blue-50 border border-blue-200">
          <div className="flex items-start space-x-3">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
              💡
            </div>
            <div>
              <p className="font-medium text-blue-800">Pro Tip</p>
              <p className="text-sm text-blue-600">
                Use the barcode scanner in Spare Parts to quickly find and add parts to job cards!
              </p>
            </div>
          </div>
        </div>
      </div>

      <MobileNavigation userRole={user.role} />
    </div>
  );
};

export default MechanicDashboard;