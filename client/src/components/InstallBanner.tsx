import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Download, X, Smartphone } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function InstallBanner() {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);

  useEffect(() => {
    // Listen for the beforeinstallprompt event
    const handleBeforeInstallPrompt = (event: Event) => {
      console.log('📱 Install prompt available');
      event.preventDefault(); // Prevent the default browser install prompt
      
      const installEvent = event as BeforeInstallPromptEvent;
      setInstallPrompt(installEvent);
      setShowBanner(true);
    };

    // Listen for successful app installation
    const handleAppInstalled = () => {
      console.log('✅ ServiceGuru installed successfully!');
      setShowBanner(false);
      setInstallPrompt(null);
    };

    // Check if already installed (standalone mode)
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    const isInWebAppiOS = (window.navigator as any).standalone === true;
    
    if (isStandalone || isInWebAppiOS) {
      console.log('📱 App already installed');
      return;
    }

    // Add event listeners
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstall = async () => {
    if (!installPrompt) return;

    setIsInstalling(true);

    try {
      // Show the install prompt
      await installPrompt.prompt();
      
      // Wait for user choice
      const choiceResult = await installPrompt.userChoice;
      
      if (choiceResult.outcome === 'accepted') {
        console.log('✅ User accepted the install prompt');
        setShowBanner(false);
      } else {
        console.log('❌ User dismissed the install prompt');
      }
    } catch (error) {
      console.error('❌ Error during installation:', error);
    } finally {
      setIsInstalling(false);
      setInstallPrompt(null);
    }
  };

  const handleCancel = () => {
    console.log('❌ User cancelled install banner');
    setShowBanner(false);
    setInstallPrompt(null);
  };

  if (!showBanner || !installPrompt) {
    return null;
  }

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg">
      <div className="flex items-center justify-between p-3 max-w-md mx-auto">
        <div className="flex items-center space-x-3 flex-1">
          <div className="bg-white/20 p-2 rounded-full">
            <Smartphone className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold">Install ServiceGuru</p>
            <p className="text-xs opacity-90">Get quick access from your home screen</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2 ml-3">
          <Button
            size="sm"
            variant="secondary"
            onClick={handleInstall}
            disabled={isInstalling}
            className="bg-white text-blue-600 hover:bg-white/90 text-xs px-3 py-1.5 h-auto"
            data-testid="button-install-app"
          >
            {isInstalling ? (
              <>
                <div className="w-3 h-3 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mr-1" />
                Installing...
              </>
            ) : (
              <>
                <Download className="w-3 h-3 mr-1" />
                Install
              </>
            )}
          </Button>
          
          <Button
            size="sm"
            variant="ghost"
            onClick={handleCancel}
            className="text-white hover:bg-white/20 p-1.5 h-auto"
            data-testid="button-cancel-install"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}