import { useAuth } from "@/lib/auth";
import { useLocation } from "wouter";
import { useEffect } from "react";

interface ProtectedRouteProps {
  children: React.ReactNode;
  roles?: string[];
}

// Super Admin emails that can access /super-admin
const SUPER_ADMIN_EMAILS = [
  'gorla.ananthkalyan@gmail.com',
  'ananthautomotivegarage@gmail.com'
];

export default function ProtectedRoute({ children, roles }: ProtectedRouteProps) {
  const { user, garage, isLoading, routeUserBasedOnRole } = useAuth();
  const [location, navigate] = useLocation();

  useEffect(() => {
    console.log('🔥 [PROTECTED] useEffect triggered - location:', location, 'user:', !!user, 'isLoading:', isLoading);
    
    if (!isLoading && !user) {
      // Only navigate if we're not already on login page
      if (location !== '/login') {
        console.log('🔥 [PROTECTED] No user, redirecting to login from:', location);
        navigate("/login");
      } else {
        console.log('🔥 [PROTECTED] Already on login page, not redirecting');
      }
      return;
    }

    if (user && isLoading === false) {
      console.log('🔥 [PROTECTED] User authenticated, checking route permissions');
      console.log('🔥 [PROTECTED] User role:', user.role, 'Current location:', location);
      // Handle super admin route protection
      if (location === '/super-admin') {
        if (user.role !== 'super_admin' || !SUPER_ADMIN_EMAILS.includes(user.email)) {
          navigate('/unauthorized');
          return;
        }
      }

      // Handle role-based route protection
      if (roles && roles.length > 0) {
        if (!roles.includes(user.role)) {
          navigate('/unauthorized');
          return;
        }

        // Additional checks for specific roles
        if (user.role === 'garage_admin') {
          // Admin must have a garage except for garage-setup
          if (!garage && location !== '/garage-setup') {
            navigate('/garage-setup');
            return;
          }
        }

        if (user.role === 'mechanic_staff') {
          // Staff must have garage_id except for access-request
          if (!user.garageId && location !== '/access-request') {
            navigate('/access-request');
            return;
          }
        }
      }

      // Auto-redirect users to appropriate dashboards if they're on generic routes
      if (location === '/dashboard' || location === '/') {
        const correctRoute = routeUserBasedOnRole(user, garage);
        if (correctRoute && correctRoute !== location && correctRoute !== '/dashboard') {
          navigate(correctRoute);
          return;
        }
      }
    }
  }, [user, garage, isLoading, roles, navigate, location, routeUserBasedOnRole]);

  if (isLoading) {
    return (
      <div className="screen-content flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  // Super admin route protection
  if (location === '/super-admin') {
    if (user.role !== 'super_admin' || !SUPER_ADMIN_EMAILS.includes(user.email)) {
      return null; // Will redirect via useEffect
    }
  }

  // Role-based protection
  if (roles && roles.length > 0) {
    if (!roles.includes(user.role)) {
      return null; // Will redirect via useEffect
    }

    // Additional role-specific protections
    if (user.role === 'garage_admin' && !garage && location !== '/garage-setup') {
      return null; // Will redirect via useEffect
    }

    if (user.role === 'mechanic_staff' && !user.garageId && location !== '/access-request') {
      return null; // Will redirect via useEffect
    }
  }

  return <>{children}</>;
}
