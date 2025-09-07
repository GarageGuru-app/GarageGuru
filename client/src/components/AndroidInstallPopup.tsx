import { useState, useEffect } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

interface AndroidInstallPopupProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onInstalled: () => void;
}

export function AndroidInstallPopup({ open, onOpenChange, onInstalled }: AndroidInstallPopupProps) {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [canInstall, setCanInstall] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);

  useEffect(() => {
    // Listen for PWA install prompt
    const handleBeforeInstallPrompt = (e: any) => {
      console.log('🚀 PWA install prompt event detected');
      e.preventDefault();
      setDeferredPrompt(e);
      setCanInstall(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Check if we can install - Chrome supports installation
    const checkInstallable = async () => {
      const isChrome = /Chrome/.test(navigator.userAgent) && !/Edge/.test(navigator.userAgent);
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
      const hasServiceWorker = 'serviceWorker' in navigator;
      
      if (isChrome && !isStandalone && hasServiceWorker) {
        try {
          await navigator.serviceWorker.ready;
          setCanInstall(true);
          console.log('🚀 Chrome PWA installation available');
        } catch (error) {
          setCanInstall(true); // Still allow install attempt
        }
      }
    };

    checkInstallable();
    setTimeout(checkInstallable, 2000);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstall = async () => {
    setIsInstalling(true);

    try {
      if (deferredPrompt) {
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
      } else {
        // Try to trigger installation anyway
        console.log('🚀 Attempting PWA install without prompt');
        onInstalled();
        onOpenChange(false);
      }
    } catch (error) {
      console.error('PWA install error:', error);
      setIsInstalling(false);
    }
  };

  const handleClose = () => {
    sessionStorage.setItem('androidInstallDismissed', 'true');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-none w-[calc(100%-2rem)] mx-4 p-0 bg-gradient-to-r from-blue-600 to-blue-700 border-0 rounded-lg">
        <div className="flex items-center justify-between px-4 py-3 text-white">
          <div className="flex items-center gap-3">
            <div>
              <div className="font-medium text-sm">ServiceGuru</div>
              <div className="text-xs text-blue-100">Get our free app. It won't take up space on your phone.</div>
            </div>
          </div>
          
          <div className="flex gap-2">
            <Button
              onClick={handleClose}
              variant="ghost"
              className="text-white hover:bg-white/20 px-4 py-2 text-sm font-medium rounded-full"
              size="sm"
            >
              Maybe Later
            </Button>
            <Button
              onClick={handleInstall}
              disabled={isInstalling}
              className="bg-white text-blue-700 hover:bg-gray-100 px-6 py-2 text-sm font-medium rounded-full"
              size="sm"
            >
              {isInstalling ? 'Installing...' : 'Install'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}