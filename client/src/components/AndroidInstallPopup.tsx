import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, Smartphone, Wifi, WifiOff } from "lucide-react";
import serviceguruLogo from "@/assets/serviceguru-logo-final.jpeg";

interface AndroidInstallPopupProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onInstalled: () => void;
}

export function AndroidInstallPopup({ open, onOpenChange, onInstalled }: AndroidInstallPopupProps) {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [canInstall, setCanInstall] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Listen for PWA install prompt
    const handleBeforeInstallPrompt = (e: any) => {
      console.log('🚀 PWA install prompt event detected');
      e.preventDefault();
      setDeferredPrompt(e);
      setCanInstall(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Check if we can install - Chrome often supports installation even without the event
    const checkInstallable = async () => {
      // Check if it's a Chrome-based browser and not already installed
      const isChrome = /Chrome/.test(navigator.userAgent) && !/Edge/.test(navigator.userAgent);
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
      const hasServiceWorker = 'serviceWorker' in navigator;
      
      if (isChrome && !isStandalone && hasServiceWorker) {
        // Wait for service worker to be ready
        try {
          await navigator.serviceWorker.ready;
          setCanInstall(true);
          console.log('🚀 Chrome PWA installation available with service worker ready');
        } catch (error) {
          console.log('⚠️ Service worker not ready, but Chrome supports installation');
          setCanInstall(true);
        }
      }
    };

    // Check immediately and after delays for manifest and service worker to load
    checkInstallable();
    setTimeout(checkInstallable, 1000);
    setTimeout(checkInstallable, 3000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstall = async () => {
    setIsInstalling(true);

    try {
      if (deferredPrompt) {
        // Use the native install prompt if available
        console.log('🚀 Triggering native PWA install prompt');
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        
        if (outcome === 'accepted') {
          console.log('✅ PWA install accepted');
          onInstalled();
          onOpenChange(false);
        } else {
          console.log('❌ PWA install declined');
          setIsInstalling(false);
        }
        setDeferredPrompt(null);
        setCanInstall(false);
      } else {
        // Force the native install prompt by reloading and trying again
        console.log('🚀 No native prompt available, checking PWA requirements');
        
        // Check if app is already installed or standalone
        const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
        const isInStandaloneMode = (window.navigator as any).standalone === true;
        
        if (isStandalone || isInStandaloneMode) {
          console.log('✅ App is already installed');
          onInstalled();
          onOpenChange(false);
        } else {
          // Let the user know there's an issue
          console.error('❌ PWA install not available - checking manifest and service worker');
          alert('PWA installation is not available right now. Please try refreshing the page or use Chrome browser for best experience.');
          setIsInstalling(false);
        }
      }
    } catch (error) {
      console.error('PWA install error:', error);
      setIsInstalling(false);
    }
  };

  const handleLater = () => {
    // Mark as dismissed for this session
    sessionStorage.setItem('androidInstallDismissed', 'true');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm max-w-[300px] mx-4">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <Smartphone className="h-4 w-4 text-blue-600" />
            Install App
          </DialogTitle>
          <DialogDescription className="text-sm">
            Add ServiceGuru to your home screen
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          {/* App Logo */}
          <div className="text-center">
            <div className="w-14 h-14 mx-auto bg-blue-100 rounded-lg flex items-center justify-center mb-2">
              <img src={serviceguruLogo} alt="ServiceGuru" className="w-10 h-10 rounded object-cover" />
            </div>
          </div>

          {/* Install Button */}
          <div className="space-y-2">
            <Button 
              onClick={handleInstall} 
              className="w-full" 
              disabled={!canInstall || isInstalling}
              size="sm"
            >
              <Download className="mr-2 h-4 w-4" />
              {isInstalling ? 'Installing...' : 'Install App'}
            </Button>
            
            <Button 
              variant="outline" 
              onClick={handleLater} 
              className="w-full"
              size="sm"
            >
              Maybe Later
            </Button>
          </div>

          {/* Connection Status */}
          <div className="flex items-center justify-center gap-2 text-xs">
            {isOnline ? (
              <>
                <Wifi className="h-3 w-3 text-green-600" />
                <span className="text-green-600">Online</span>
              </>
            ) : (
              <>
                <WifiOff className="h-3 w-3 text-red-600" />
                <span className="text-red-600">Offline</span>
              </>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}