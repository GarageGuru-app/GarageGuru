import { useAuth } from "@/lib/auth";
import { useLocation } from "wouter";
import { useEffect } from "react";

interface ProtectedRouteProps {
  children: React.ReactNode;
  roles?: string[];
}

export default function ProtectedRoute({ children, roles }: ProtectedRouteProps) {
  const { user, isLoading } = useAuth();
  const [, navigate] = useLocation();

  useEffect(() => {
    if (!isLoading && !user) {
      navigate("/login");
    } else if (user && roles && !roles.includes(user.role)) {
      navigate("/dashboard");
    }
  }, [user, isLoading, roles, navigate]);

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

  return <>{children}</>;
}
