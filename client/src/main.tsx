import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import "./styles/mobile.css";

// Register Service Worker for PWA functionality
const registerServiceWorker = async () => {
  if ('serviceWorker' in navigator) {
    try {
      console.log('🔄 Registering ServiceGuru Service Worker...');
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/'
      });
      
      if (registration.installing) {
        console.log('⚙️ Service worker installing');
      } else if (registration.waiting) {
        console.log('⏳ Service worker installed');
      } else if (registration.active) {
        console.log('✅ Service worker active');
      }

      // Listen for updates
      registration.addEventListener('updatefound', () => {
        console.log('🔄 Service worker update found');
      });

      console.log('✅ ServiceGuru SW registered successfully:', registration);
    } catch (error) {
      console.error('❌ ServiceGuru SW registration failed:', error);
    }
  } else {
    console.log('⚠️ Service Worker not supported');
  }
};

// Initialize mobile PWA features
function initMobilePWA() {
  // Add mobile viewport meta if not present
  if (!document.querySelector('meta[name="viewport"]')) {
    const viewport = document.createElement('meta');
    viewport.name = 'viewport';
    viewport.content = 'width=device-width, initial-scale=1.0, maximum-scale=1, user-scalable=no';
    document.head.appendChild(viewport);
  }

  // Prevent context menu on long press (mobile)
  document.addEventListener('contextmenu', (e) => {
    if (window.innerWidth <= 768) {
      e.preventDefault();
    }
  });

  // Prevent pull-to-refresh
  document.body.style.overscrollBehavior = 'none';

  // Add mobile classes for styling
  if (window.innerWidth <= 768) {
    document.body.classList.add('mobile-device');
  }

  // Detect PWA mode
  if (window.matchMedia('(display-mode: standalone)').matches) {
    document.body.classList.add('pwa-mode');
    console.log('📱 ServiceGuru running as PWA');
  }

  // Handle orientation changes
  window.addEventListener('orientationchange', () => {
    setTimeout(() => {
      window.scrollTo(0, 0);
    }, 100);
  });
}

// Initialize PWA features
initMobilePWA();

// Register service worker for PWA installation
registerServiceWorker();

createRoot(document.getElementById("root")!).render(<App />);
