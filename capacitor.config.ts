import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.serviceguru.app',
  appName: 'ServiceGuru',
  webDir: 'www',
  server: {
    // Your deployed ServiceGuru URL on Render
    url: 'https://garageguru-whh7.onrender.com',
    cleartext: true,
    allowNavigation: ['*']
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#1e40af',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: true
    },
    StatusBar: {
      style: 'DEFAULT',
      backgroundColor: '#1e40af'
    },
    App: {
      launchAutoHide: true
    },
    Camera: {
      permissions: ['camera', 'storage']
    },
    Filesystem: {
      permissions: ['storage', 'camera']
    },
    Device: {
      permissions: []
    }
  },
  android: {
    allowMixedContent: true,
    captureInput: true,
    webContentsDebuggingEnabled: true,
    loggingBehavior: 'debug'
  }
};

export default config;
