import React from 'react';
import { useLocation } from 'wouter';
import { 
  Home, 
  Users, 
  FileText, 
  Package, 
  Receipt, 
  BarChart3,
  Settings,
  User
} from 'lucide-react';

interface MobileNavigationProps {
  userRole: 'garage_admin' | 'mechanic_staff';
}

const MobileNavigation: React.FC<MobileNavigationProps> = ({ userRole }) => {
  const [location, navigate] = useLocation();

  const adminNavItems = [
    { path: '/admin-dashboard', icon: Home, label: 'Home' },
    { path: '/customers', icon: Users, label: 'Customers' },
    { path: '/job-cards', icon: FileText, label: 'Jobs' },
    { path: '/spare-parts', icon: Package, label: 'Parts' },
    { path: '/invoices', icon: Receipt, label: 'Invoices' }
  ];

  const mechanicNavItems = [
    { path: '/mechanic-dashboard', icon: Home, label: 'Home' },
    { path: '/customers', icon: Users, label: 'Customers' },
    { path: '/job-cards', icon: FileText, label: 'Jobs' },
    { path: '/spare-parts', icon: Package, label: 'Parts' },
    { path: '/profile', icon: User, label: 'Profile' }
  ];

  const navItems = userRole === 'garage_admin' ? adminNavItems : mechanicNavItems;

  return (
    <div className="mobile-nav">
      {navItems.map(({ path, icon: Icon, label }) => (
        <button
          key={path}
          onClick={() => navigate(path)}
          className={`mobile-nav-item ${location === path ? 'active' : ''}`}
        >
          <Icon className="w-5 h-5 mb-1" />
          <span className="text-xs">{label}</span>
        </button>
      ))}
    </div>
  );
};

export default MobileNavigation;