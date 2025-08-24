import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import BottomNav from './BottomNav';
import DesktopLayout from './DesktopLayout';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { useLocation } from 'wouter';

interface LayoutProps {
  children: React.ReactNode;
  showFab?: boolean;
}

export default function Layout({ children, showFab = true }: LayoutProps) {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const checkIsDesktop = () => {
      setIsDesktop(window.innerWidth >= 1024);
    };

    checkIsDesktop();
    window.addEventListener('resize', checkIsDesktop);

    return () => window.removeEventListener('resize', checkIsDesktop);
  }, []);

  const handleFabClick = () => {
    navigate('/job-card');
  };

  if (!user) {
    return (
      <>
        <div className="mobile-container">{children}</div>
        <div className="desktop-container">{children}</div>
      </>
    );
  }

  // Use desktop layout for screens >= 1024px
  if (isDesktop) {
    return (
      <DesktopLayout showFab={showFab}>
        {children}
      </DesktopLayout>
    );
  }

  // Use mobile layout for smaller screens
  return (
    <div className="mobile-container">
      {children}
      
      {showFab && (
        <Button
          onClick={handleFabClick}
          className="fab w-14 h-14 rounded-full shadow-lg"
          size="icon"
          data-testid="button-fab-new-job"
        >
          <Plus className="w-6 h-6" />
        </Button>
      )}
      
      <BottomNav />
    </div>
  );
}
