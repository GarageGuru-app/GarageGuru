import { useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import { 
  Home, 
  ClipboardList, 
  Users, 
  TrendingUp, 
  User 
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/supabase";

export default function BottomNav() {
  const [location, navigate] = useLocation();
  const { user, garage } = useAuth();

  const { data: pendingJobs } = useQuery({
    queryKey: ["/api/garages", garage?.id, "job-cards"],
    queryFn: async () => {
      if (!garage?.id) return [];
      const response = await apiRequest("GET", `/api/garages/${garage.id}/job-cards?status=pending`);
      return response.json();
    },
    enabled: !!garage?.id,
  });

  const pendingCount = pendingJobs?.length || 0;

  const navItems = [
    { path: "/dashboard", icon: Home, label: "Dashboard" },
    { 
      path: "/pending-services", 
      icon: ClipboardList, 
      label: "Services",
      badge: pendingCount > 0 ? pendingCount : undefined
    },
    { path: "/customers", icon: Users, label: "Customers" },
    ...(user?.role === "garage_admin" ? [
      { path: "/sales", icon: TrendingUp, label: "Sales" }
    ] : []),
    { path: "/profile", icon: User, label: "Profile" },
  ];

  return (
    <div className="bottom-nav bg-card border-t border-border">
      <div className="flex items-center justify-around py-2">
        {navItems.map((item) => {
          const isActive = location === item.path;
          const Icon = item.icon;
          
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`flex flex-col items-center py-2 px-3 transition-colors ${
                isActive 
                  ? "text-primary" 
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <div className="relative">
                <Icon className="w-5 h-5 mb-1" />
                {item.badge && (
                  <div className="notification-badge">
                    {item.badge > 99 ? "99+" : item.badge}
                  </div>
                )}
              </div>
              <span className="text-xs">{item.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
