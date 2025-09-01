import { useAuth } from "@/lib/auth";
import { useLocation } from "wouter";
import { useEffect, useState } from "react";
import { FullPageLoader } from "@/components/ui/loading-spinner";

interface ProtectedRouteProps {
  children: React.ReactNode;
  roles?: string[];
}

// Super Admin emails fetched from API
let SUPER_ADMIN_EMAILS: string[] = [
  'gorla.ananthkalyan@gmail.com',
  'ananthautomotivegarage@gmail.com'
];

// Fetch super admin emails from API
async function fetchSuperAdminEmails() {
  try {
    const response = await fetch('/api/config/super-admin-emails');
    if (response.ok) {
      const data = await response.json();
      SUPER_ADMIN_EMAILS = data.superAdminEmails || SUPER_ADMIN_EMAILS;
    }
  } catch (error) {
    console.log('Using fallback super admin emails');
  }
}

export default function ProtectedRoute({ children, roles }: ProtectedRouteProps) {
  const { user, garage, isLoading, routeUserBasedOnRole } = useAuth();
  const [location, navigate] = useLocation();
  const [emailsLoaded, setEmailsLoaded] = useState(false);

  // Fetch super admin emails on component mount
  useEffect(() => {
    if (!emailsLoaded) {
      fetchSuperAdminEmails().then(() => setEmailsLoaded(true));
    }
  }, [emailsLoaded]);

  useEffect(() => {
    if (!isLoading && !user) {
      // Only navigate if we're not already on login page
      if (location !== '/login') {
        navigate("/login");
      }
      return;
    }

    if (user && isLoading === false) {
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
    return <FullPageLoader text="Authenticating..." />;
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
