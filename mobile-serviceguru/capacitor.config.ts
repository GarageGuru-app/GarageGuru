import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.quintellix.serviceguru',
  appName: 'ServiceGuru',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: "#1E40AF",
      showSpinner: true,
      spinnerColor: "#FFFFFF"
    },
    StatusBar: {
      style: 'DEFAULT',
      backgroundColor: "#1E40AF"
    }
  }
};

export default config;