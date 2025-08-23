import { useAuth } from "@/lib/auth";
import { useLocation } from "wouter";
import { useEffect } from "react";

interface ProtectedRouteProps {
  children: React.ReactNode;
  roles?: string[];
}

export default function ProtectedRoute({ children, roles }: ProtectedRouteProps) {
  const { user, garage, isLoading } = useAuth();
  const [location, navigate] = useLocation();

  useEffect(() => {
    if (!isLoading && !user) {
      navigate("/login");
    } else if (user && roles && !roles.includes(user.role)) {
      navigate("/dashboard");
    } else if (user && user.role === 'garage_admin' && !garage && location !== '/garage-setup') {
      // Redirect garage admins without garage to setup page
      navigate("/garage-setup");
    }
  }, [user, garage, isLoading, roles, navigate, location]);

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

  if (roles && !roles.includes(user.role)) {
    return (
      <div className="screen-content flex items-center justify-center">
        <div className="text-destructive">Access denied</div>
      </div>
    );
  }

  // Allow garage setup page for admins without garage
  if (user.role === 'garage_admin' && !garage && location !== '/garage-setup') {
    return null;
  }

  return <>{children}</>;
}
