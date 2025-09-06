import React, { useState, useEffect } from 'react';
import { 
  User as UserIcon, 
  Building2 as Garage,
  Settings,
  Database,
  Smartphone,
  LogOut,
  RotateCcw as Sync,
  Info,
  Shield
} from 'lucide-react';
import { User, DatabaseManager, Garage as GarageType, db } from '../lib/database';
import MobileHeader from '../components/MobileHeader';
import MobileNavigation from '../components/MobileNavigation';
import LoadingSpinner from '../components/LoadingSpinner';
// import serviceguruLogo from '../assets/serviceguru-logo-final.jpeg';

interface ProfilePageProps {
  user: User;
  onLogout: () => void;
}

const ProfilePage: React.FC<ProfilePageProps> = ({ user, onLogout }) => {
  const [garage, setGarage] = useState<GarageType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'success' | 'error'>('idle');
  const [databaseStats, setDatabaseStats] = useState({
    customers: 0,
    jobCards: 0,
    spareParts: 0,
    invoices: 0,
    pendingSync: 0
  });

  useEffect(() => {
    loadProfileData();
  }, [user.garage_id]);

  const loadProfileData = async () => {
    try {
      setIsLoading(true);
      
      // Load garage info
      const garageData = await DatabaseManager.getCurrentGarage();
      setGarage(garageData);

      // Load database statistics
      const [customers, jobCards, spareParts, invoices, syncLogs] = await Promise.all([
        db.customers.where('garage_id').equals(user.garage_id).count(),
        db.job_cards.where('garage_id').equals(user.garage_id).count(),
        db.spare_parts.where('garage_id').equals(user.garage_id).count(),
        db.invoices.where('garage_id').equals(user.garage_id).count(),
        db.sync_logs.where('synced').equals(0).count()
      ]);

      setDatabaseStats({
        customers,
        jobCards,
        spareParts,
        invoices,
        pendingSync: syncLogs
      });
    } catch (error) {
      console.error('Error loading profile data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSyncData = async () => {
    setSyncStatus('syncing');
    
    try {
      const success = await DatabaseManager.syncWithGmail();
      setSyncStatus(success ? 'success' : 'error');
      
      // Refresh sync counts
      const pendingSync = await db.sync_logs.where('synced').equals(0).count();
      setDatabaseStats(prev => ({ ...prev, pendingSync }));
      
      setTimeout(() => setSyncStatus('idle'), 3000);
    } catch (error) {
      console.error('Sync error:', error);
      setSyncStatus('error');
      setTimeout(() => setSyncStatus('idle'), 3000);
    }
  };

  const handleLogout = () => {
    if (confirm('Are you sure you want to logout?')) {
      DatabaseManager.logout();
      onLogout();
    }
  };

  const getSyncStatusMessage = () => {
    switch (syncStatus) {
      case 'syncing': return 'Syncing with Gmail...';
      case 'success': return 'Sync completed successfully!';
      case 'error': return 'Sync failed. Try again.';
      default: return `${databaseStats.pendingSync} records pending sync`;
    }
  };

  const getSyncStatusColor = () => {
    switch (syncStatus) {
      case 'syncing': return 'text-blue-600 bg-blue-100';
      case 'success': return 'text-green-600 bg-green-100';
      case 'error': return 'text-red-600 bg-red-100';
      default: return databaseStats.pendingSync > 0 ? 'text-orange-600 bg-orange-100' : 'text-green-600 bg-green-100';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <MobileHeader title="Profile" showBack />
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <MobileHeader title="Profile" showBack />

      <div className="mobile-container pt-6 pb-8">
        
        {/* User Profile Card */}
        <div className="mobile-card text-center">
          <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-blue-100 flex items-center justify-center">
            <UserIcon className="w-10 h-10 text-blue-600" />
          </div>
          
          <h2 className="text-xl font-bold text-gray-900 mb-2">{user.name}</h2>
          <p className="text-gray-600 mb-1">{user.email}</p>
          <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
            user.role === 'garage_admin' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
          }`}>
            {user.role === 'garage_admin' ? 'Admin' : 'Mechanic'}
          </span>
        </div>

        {/* Garage Information */}
        <div className="mobile-card">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <Garage className="w-5 h-5 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Garage Information</h3>
          </div>
          
          <div className="space-y-3">
            <div>
              <p className="text-sm font-medium text-gray-700">Garage Name</p>
              <p className="text-gray-600">{garage?.name || 'Not available'}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700">Owner</p>
              <p className="text-gray-600">{garage?.owner_name || 'Not available'}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700">Contact</p>
              <p className="text-gray-600">{garage?.phone || 'Not available'}</p>
              <p className="text-gray-600">{garage?.email || 'Not available'}</p>
            </div>
          </div>
        </div>

        {/* Database Statistics */}
        <div className="mobile-card">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
              <Database className="w-5 h-5 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Data Overview</h3>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <p className="text-2xl font-bold text-gray-900">{databaseStats.customers}</p>
              <p className="text-sm text-gray-600">Customers</p>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <p className="text-2xl font-bold text-gray-900">{databaseStats.jobCards}</p>
              <p className="text-sm text-gray-600">Job Cards</p>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <p className="text-2xl font-bold text-gray-900">{databaseStats.spareParts}</p>
              <p className="text-sm text-gray-600">Spare Parts</p>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <p className="text-2xl font-bold text-gray-900">{databaseStats.invoices}</p>
              <p className="text-sm text-gray-600">Invoices</p>
            </div>
          </div>
        </div>

        {/* Sync Status & Actions */}
        <div className="mobile-card">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
              <Sync className="w-5 h-5 text-purple-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Data Backup & Sync</h3>
          </div>
          
          <div className={`p-3 rounded-lg mb-4 ${getSyncStatusColor()}`}>
            <div className="flex items-center space-x-2">
              <Sync className={`w-4 h-4 ${syncStatus === 'syncing' ? 'animate-spin' : ''}`} />
              <span className="text-sm font-medium">
                {getSyncStatusMessage()}
              </span>
            </div>
          </div>

          <button
            onClick={handleSyncData}
            disabled={syncStatus === 'syncing'}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {syncStatus === 'syncing' ? 'Syncing...' : 'Sync with Gmail'}
          </button>
          
          <p className="text-xs text-gray-500 mt-2 text-center">
            Backup your data to Gmail for safe keeping
          </p>
        </div>

        {/* Settings & Actions */}
        <div className="mobile-card">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
              <Settings className="w-5 h-5 text-gray-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Settings & Actions</h3>
          </div>
          
          <div className="space-y-3">
            <button className="w-full flex items-center space-x-3 p-3 bg-gray-50 rounded-lg text-left">
              <UserIcon className="w-5 h-5 text-gray-600" />
              <span className="text-gray-700">Edit Profile</span>
            </button>
            
            <button className="w-full flex items-center space-x-3 p-3 bg-gray-50 rounded-lg text-left">
              <Smartphone className="w-5 h-5 text-gray-600" />
              <span className="text-gray-700">App Settings</span>
            </button>
            
            <button className="w-full flex items-center space-x-3 p-3 bg-gray-50 rounded-lg text-left">
              <Shield className="w-5 h-5 text-gray-600" />
              <span className="text-gray-700">Change Password</span>
            </button>
            
            <button className="w-full flex items-center space-x-3 p-3 bg-gray-50 rounded-lg text-left">
              <Info className="w-5 h-5 text-gray-600" />
              <span className="text-gray-700">About ServiceGuru</span>
            </button>
          </div>
        </div>

        {/* App Information */}
        <div className="mobile-card bg-blue-50 border border-blue-200">
          <div className="text-center">
            <h3 className="font-semibold text-blue-800 mb-2">ServiceGuru Mobile</h3>
            <p className="text-sm text-blue-600 mb-2">
              Offline-first garage management system
            </p>
            <p className="text-xs text-blue-500">
              Version 1.0.0 • Built by Quintellix Systems
            </p>
          </div>
        </div>

        {/* Logout Button */}
        <button
          onClick={handleLogout}
          className="w-full bg-red-600 text-white py-3 rounded-lg font-medium flex items-center justify-center space-x-2"
        >
          <LogOut className="w-5 h-5" />
          <span>Logout</span>
        </button>
      </div>

      <MobileNavigation userRole={user.role} />
    </div>
  );
};

export default ProfilePage;