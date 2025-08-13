import { useAuth } from "@/lib/auth";
import BottomNav from "./BottomNav";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useLocation } from "wouter";

interface LayoutProps {
  children: React.ReactNode;
  showFab?: boolean;
}

export default function Layout({ children, showFab = true }: LayoutProps) {
  const { user } = useAuth();
  const [, navigate] = useLocation();

  const handleFabClick = () => {
    navigate("/job-card");
  };

  if (!user) {
    return <div className="mobile-container">{children}</div>;
  }

  return (
    <div className="mobile-container">
      {children}
      
      {showFab && (
        <Button
          onClick={handleFabClick}
          className="fab w-14 h-14 rounded-full shadow-lg"
          size="icon"
        >
          <Plus className="w-6 h-6" />
        </Button>
      )}
      
      <BottomNav />
    </div>
  );
}
