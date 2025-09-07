import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Download, Smartphone, Wifi, WifiOff, X } from "lucide-react";
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
    const checkInstallable = () => {
      // Check if it's a Chrome-based browser and not already installed
      const isChrome = /Chrome/.test(navigator.userAgent) && !/Edge/.test(navigator.userAgent);
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
      const hasServiceWorker = 'serviceWorker' in navigator;
      
      if (isChrome && !isStandalone && hasServiceWorker) {
        setCanInstall(true);
        console.log('🚀 Chrome PWA installation available');
      }
    };

    // Check immediately and after a small delay for manifest to load
    checkInstallable();
    setTimeout(checkInstallable, 1000);

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
        // Fallback: Show Chrome menu instructions for installation
        console.log('🚀 No native prompt, showing Chrome install instructions');
        
        // Check if Chrome supports installation
        const isChrome = /Chrome/.test(navigator.userAgent) && !/Edge/.test(navigator.userAgent);
        
        if (isChrome) {
          // Show instructions for Chrome installation
          alert(`To install ServiceGuru app:
          
1. Click the three dots menu (⋮) in Chrome
2. Select "Install ServiceGuru" or "Add to Home screen"
3. Click "Install" in the popup

This will add ServiceGuru as a standalone app on your device!`);
        } else {
          // For other browsers, just add to home screen
          alert(`To add ServiceGuru to your home screen:
          
1. Open your browser menu
2. Look for "Add to Home screen" option
3. Follow the prompts to add the shortcut

This will give you quick access to ServiceGuru!`);
        }
        
        // Still count this as "installed" since user was guided
        setTimeout(() => {
          onInstalled();
          onOpenChange(false);
        }, 2000);
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
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <img src={serviceguruLogo} alt="ServiceGuru" className="w-8 h-8 rounded" />
              Install ServiceGuru App
            </DialogTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleLater}
              className="h-6 w-6"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <DialogDescription>
            Get the best ServiceGuru experience by installing our Android app
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Connection Status */}
          <Alert className={isOnline ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}>
            <div className="flex items-center gap-2">
              {isOnline ? (
                <Wifi className="w-4 h-4 text-green-600" />
              ) : (
                <div className="animate-pulse">
                  <WifiOff className="w-4 h-4 text-red-600" />
                </div>
              )}
              <AlertDescription className={isOnline ? "text-green-800" : "text-red-800"}>
                {isOnline ? (
                  "✅ Connected to internet"
                ) : (
                  <div className="flex items-center gap-2">
                    <span>❌ No internet connection</span>
                    <div className="animate-spin w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full"></div>
                  </div>
                )}
              </AlertDescription>
            </div>
          </Alert>

          {/* App Features */}
          <div className="space-y-3">
            <h4 className="font-medium flex items-center gap-2">
              <Smartphone className="w-4 h-4" />
              Why install the app?
            </h4>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span>⚡ Faster performance and offline access</span>
              </li>
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span>📱 Native Android app experience</span>
              </li>
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span>🔔 Push notifications for important updates</span>
              </li>
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span>🏠 Add to home screen for quick access</span>
              </li>
            </ul>
          </div>

          {/* Installation Buttons */}
          <div className="flex gap-2 pt-4">
            <Button
              onClick={handleInstall}
              disabled={!isOnline || isInstalling}
              className="flex-1"
              data-testid="button-install-app"
            >
              {isInstalling ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                  <span>Installing...</span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Download className="w-4 h-4" />
                  <span>
                    {canInstall || /Chrome/.test(navigator.userAgent) ? "Install App" : "Add to Home Screen"}
                  </span>
                </div>
              )}
            </Button>
            
            <Button
              variant="outline"
              onClick={handleLater}
              className="flex-1"
              data-testid="button-maybe-later"
            >
              Maybe Later
            </Button>
          </div>

          {/* Connection Help */}
          {!isOnline && (
            <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded-lg">
              <p className="font-medium mb-1">Need internet connection:</p>
              <p>• Check your WiFi or mobile data</p>
              <p>• Try refreshing the page once connected</p>
              <div className="flex items-center gap-1 mt-2">
                <div className="animate-pulse w-2 h-2 bg-gray-400 rounded-full"></div>
                <span>Checking connection...</span>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}