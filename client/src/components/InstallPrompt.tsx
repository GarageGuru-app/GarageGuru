import React, { useState, useEffect } from 'react';
import { Download, X, Smartphone, Monitor, Share, Plus } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const InstallPrompt: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Check if app is already installed/standalone
    const checkStandalone = () => {
      const isInStandaloneMode = window.matchMedia('(display-mode: standalone)').matches ||
                                 (window.navigator as any).standalone ||
                                 document.referrer.includes('android-app://');
      setIsStandalone(isInStandaloneMode);
    };

    // Check if iOS
    const checkIOS = () => {
      const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
      setIsIOS(isIOSDevice);
    };

    checkStandalone();
    checkIOS();

    // Listen for the beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      
      // Show install prompt after a delay
      setTimeout(() => {
        setShowPrompt(true);
      }, 5000);
    };

    // For testing and iOS - show prompt after delay
    const showPromptTimer = setTimeout(() => {
      if (!isStandalone) {
        setShowPrompt(true);
      }
    }, 3000);

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      clearTimeout(showPromptTimer);
    };
  }, [isStandalone]);

  const handleInstall = async () => {
    if (!deferredPrompt) {
      // Fallback for browsers that don't support the API
      alert('To install ServiceGuru:\n\n1. Open browser menu\n2. Select "Add to Home Screen"\n3. Tap "Add" to install');
      return;
    }

    try {
      await deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      
      if (choiceResult.outcome === 'accepted') {
        console.log('✅ PWA installation accepted');
      } else {
        console.log('❌ PWA installation dismissed');
      }
      
      setDeferredPrompt(null);
      setShowPrompt(false);
    } catch (error) {
      console.error('❌ Install prompt error:', error);
      alert('To install ServiceGuru, use your browser\'s "Add to Home Screen" option');
    }
  };

  const dismissPrompt = () => {
    setShowPrompt(false);
    localStorage.setItem('installPromptDismissed', Date.now().toString());
  };

  // Don't show if already installed
  if (isStandalone || !showPrompt) {
    return null;
  }

  // Check if user dismissed recently (within 7 days)
  const lastDismissed = localStorage.getItem('installPromptDismissed');
  if (lastDismissed && Date.now() - parseInt(lastDismissed) < 7 * 24 * 60 * 60 * 1000) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 lg:left-auto lg:right-4 lg:bottom-4 lg:w-96">
      <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 p-6 animate-slide-up">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
              {isIOS ? <Smartphone className="w-6 h-6 text-white" /> : <Monitor className="w-6 h-6 text-white" />}
            </div>
            <div>
              <h3 className="font-bold text-gray-900 text-lg">Install ServiceGuru</h3>
              <p className="text-sm text-gray-600">Get the full app experience</p>
            </div>
          </div>
          <button
            onClick={dismissPrompt}
            className="text-gray-400 hover:text-gray-600 transition-colors p-1"
            data-testid="button-dismiss-install"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {isIOS ? (
          <div className="space-y-4">
            <p className="text-sm text-gray-700">
              To install this app on your iOS device:
            </p>
            <ol className="text-sm text-gray-600 space-y-2 pl-4">
              <li className="flex items-center space-x-2">
                <span className="w-5 h-5 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold">1</span>
                <span>Tap the <Share className="inline w-4 h-4 mx-1" /> Share button in Safari</span>
              </li>
              <li className="flex items-center space-x-2">
                <span className="w-5 h-5 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold">2</span>
                <span>Select "Add to Home Screen"</span>
              </li>
              <li className="flex items-center space-x-2">
                <span className="w-5 h-5 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold">3</span>
                <span>Tap "Add" to confirm</span>
              </li>
            </ol>
            <button
              onClick={dismissPrompt}
              className="w-full bg-gray-100 text-gray-700 py-3 px-4 rounded-xl font-medium hover:bg-gray-200 transition-colors"
            >
              Got it!
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              <p className="text-sm text-gray-700">
                • Access ServiceGuru instantly from your home screen
              </p>
              <p className="text-sm text-gray-700">
                • Work offline with cached data
              </p>
              <p className="text-sm text-gray-700">
                • Get push notifications for important updates
              </p>
              <p className="text-sm text-gray-700">
                • Native app-like experience
              </p>
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={handleInstall}
                className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 text-white py-3 px-4 rounded-xl font-medium hover:from-blue-600 hover:to-purple-700 transition-all flex items-center justify-center space-x-2"
                data-testid="button-install-app"
              >
                <Download className="w-4 h-4" />
                <span>Install App</span>
              </button>
              
              <button
                onClick={dismissPrompt}
                className="bg-gray-100 text-gray-700 py-3 px-4 rounded-xl font-medium hover:bg-gray-200 transition-colors"
              >
                Later
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default InstallPrompt;