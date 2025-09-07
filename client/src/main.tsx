import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Register ServiceGuru Service Worker for PWA functionality
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    console.log('🔄 Registering ServiceGuru Service Worker...');
    
    navigator.serviceWorker.register('/sw.js', { scope: '/' })
      .then((registration) => {
        console.log('✅ ServiceGuru SW registered successfully');
        console.log('✅ ServiceGuru SW registered successfully:', registration.scope);
        
        // Listen for updates
        registration.addEventListener('updatefound', () => {
          console.log('🔄 Service worker update found');
          const newWorker = registration.installing;
          
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                // New update available
                console.log('📱 New app version available!');
                
                // Optionally show update notification
                if (confirm('New version available! Reload to update?')) {
                  newWorker.postMessage({ type: 'SKIP_WAITING' });
                  window.location.reload();
                }
              }
            });
          }
        });
      })
      .catch((error) => {
        console.error('❌ ServiceGuru SW registration failed:', error);
      });

    // Listen for service worker messages
    navigator.serviceWorker.addEventListener('message', (event) => {
      if (event.data && event.data.type === 'SW_UPDATED') {
        console.log('🎉 ServiceGuru updated to latest version');
      }
    });
  });
} else {
  console.warn('⚠️ Service Workers not supported in this browser');
}

// Listen for beforeinstallprompt globally to help with PWA installation
let deferredInstallPrompt = null;

window.addEventListener('beforeinstallprompt', (e) => {
  console.log('🎯 beforeinstallprompt event fired - PWA can be installed!');
  e.preventDefault();
  deferredInstallPrompt = e;
  
  // Dispatch custom event for install prompt component
  window.dispatchEvent(new CustomEvent('pwaInstallAvailable', { detail: e }));
});

// Listen for app installation
window.addEventListener('appinstalled', () => {
  console.log('🎉 ServiceGuru PWA was installed successfully!');
  deferredInstallPrompt = null;
});

createRoot(document.getElementById("root")!).render(<App />);
