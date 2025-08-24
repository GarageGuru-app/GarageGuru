import { useState } from 'react';
import { useAuth } from '@/lib/auth';
import { useTheme } from '@/lib/theme';
import { useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { NotificationPanel } from '@/components/NotificationPanel';
import {
  Home,
  ClipboardList,
  Users,
  TrendingUp,
  User,
  Package,
  FileText,
  Settings,
  Bell,
  Moon,
  Sun,
  Menu,
  LogOut,
  Building2,
  Plus,
  ChevronRight,
  BarChart3,
  UserCog
} from 'lucide-react';

interface DesktopLayoutProps {
  children: React.ReactNode;
  showFab?: boolean;
}

interface NavItem {
  path: string;
  icon: React.ElementType;
  label: string;
  badge?: number;
  roles?: string[];
}

export default function DesktopLayout({ children, showFab = true }: DesktopLayoutProps) {
  const { user, garage, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [location, navigate] = useLocation();
  const [showNotifications, setShowNotifications] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Fetch pending jobs for badge
  const { data: pendingJobs } = useQuery({
    queryKey: ['/api/garages', garage?.id, 'job-cards'],
    queryFn: async () => {
      if (!garage?.id) return [];
      const response = await apiRequest('GET', `/api/garages/${garage.id}/job-cards?status=pending`);
      return response.json();
    },
    enabled: !!garage?.id,
  });

  // Fetch unread notifications count
  const { data: unreadCount } = useQuery({
    queryKey: ['/api/garages', garage?.id, 'notifications', 'unread-count'],
    queryFn: async () => {
      if (!garage?.id) return 0;
      const response = await apiRequest('GET', `/api/garages/${garage.id}/notifications/unread-count`);
      return response.json();
    },
    enabled: !!garage?.id,
  });

  const pendingCount = pendingJobs?.length || 0;

  const getNavItems = (): NavItem[] => {
    const baseItems: NavItem[] = [
      {
        path: user?.role === 'garage_admin' ? '/admin-dashboard' : '/staff-dashboard',
        icon: Home,
        label: 'Dashboard'
      },
      {
        path: '/pending-services',
        icon: ClipboardList,
        label: 'Services',
        badge: pendingCount > 0 ? pendingCount : undefined
      },
      { path: '/customers', icon: Users, label: 'Customers' },
      { path: '/invoices', icon: FileText, label: 'Invoices' },
    ];

    // Add admin-only items
    if (user?.role === 'garage_admin') {
      baseItems.push(
        { path: '/spare-parts', icon: Package, label: 'Spare Parts', roles: ['garage_admin'] },
        { path: '/sales', icon: TrendingUp, label: 'Sales', roles: ['garage_admin'] }
      );
    }

    baseItems.push({ path: '/profile', icon: User, label: 'Profile' });

    return baseItems;
  };

  const getBreadcrumbs = () => {
    const pathMap: Record<string, string> = {
      '/admin-dashboard': 'Admin Dashboard',
      '/staff-dashboard': 'Staff Dashboard',
      '/dashboard': 'Dashboard',
      '/pending-services': 'Pending Services',
      '/customers': 'Customers',
      '/invoices': 'Invoices',
      '/spare-parts': 'Spare Parts',
      '/sales': 'Sales',
      '/profile': 'Profile',
      '/job-card': 'New Job Card',
      '/super-admin': 'Super Admin'
    };

    return pathMap[location] || 'Dashboard';
  };

  const handleFabClick = () => {
    navigate('/job-card');
  };

  if (!user) {
    return <div className="desktop-container">{children}</div>;
  }

  const navItems = getNavItems();

  return (
    <div className="desktop-container">
      {/* Sidebar */}
      <div className={`desktop-sidebar ${sidebarCollapsed ? 'collapsed' : ''}`}>
        <div className="sidebar-header">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <Building2 className="w-5 h-5 text-primary-foreground" />
            </div>
            {!sidebarCollapsed && (
              <div>
                <h2 className="font-semibold text-sm">{garage?.name}</h2>
                <p className="text-xs text-muted-foreground">{user.name}</p>
              </div>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="ml-auto"
          >
            <Menu className="w-4 h-4" />
          </Button>
        </div>

        <nav className="sidebar-nav">
          {navItems.map((item) => {
            const isActive = location === item.path;
            const Icon = item.icon;
            
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`nav-item ${isActive ? 'active' : ''}`}
                data-testid={`nav-${item.label.toLowerCase().replace(' ', '-')}`}
              >
                <div className="nav-icon">
                  <Icon className="w-5 h-5" />
                  {item.badge && (
                    <div className="nav-badge">
                      {item.badge > 99 ? '99+' : item.badge}
                    </div>
                  )}
                </div>
                {!sidebarCollapsed && (
                  <span className="nav-label">{item.label}</span>
                )}
              </button>
            );
          })}
        </nav>

        <div className="sidebar-footer">
          <Button
            variant="ghost"
            size={sidebarCollapsed ? 'sm' : 'default'}
            onClick={logout}
            className="w-full justify-start"
            data-testid="button-logout"
          >
            <LogOut className="w-4 h-4" />
            {!sidebarCollapsed && <span className="ml-2">Logout</span>}
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="desktop-main">
        {/* Header */}
        <header className="desktop-header">
          <div className="header-left">
            <div className="breadcrumbs">
              <Home className="w-4 h-4 text-muted-foreground" />
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
              <span className="font-medium">{getBreadcrumbs()}</span>
            </div>
          </div>

          <div className="header-right">
            {/* Quick Actions */}
            {showFab && (
              <Button
                onClick={handleFabClick}
                size="sm"
                className="gap-2"
                data-testid="button-new-job-card"
              >
                <Plus className="w-4 h-4" />
                New Job
              </Button>
            )}

            {/* Theme Toggle */}
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleTheme}
              data-testid="button-theme-toggle"
            >
              {theme === 'dark' ? (
                <Sun className="w-4 h-4" />
              ) : (
                <Moon className="w-4 h-4" />
              )}
            </Button>

            {/* Notifications */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowNotifications(true)}
              className="relative"
              data-testid="button-notifications"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <div className="notification-badge">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </div>
              )}
            </Button>

            {/* User Profile */}
            <div className="flex items-center gap-2 pl-2 border-l border-border">
              <Avatar className="w-8 h-8">
                <AvatarFallback className="text-xs">
                  {user.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="hidden md:block">
                <p className="text-sm font-medium">{user.name}</p>
                <p className="text-xs text-muted-foreground">
                  {user.role === 'garage_admin' ? 'Admin' : 'Staff'}
                </p>
              </div>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <main className="desktop-content">
          {children}
        </main>
      </div>

      {/* Notification Panel */}
      <NotificationPanel
        isOpen={showNotifications}
        onClose={() => setShowNotifications(false)}
      />
    </div>
  );
}