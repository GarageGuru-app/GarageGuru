#!/bin/bash
echo "🚀 ServiceGuru Android APK Generator"
echo "======================================"

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Please run this script from the mobile-serviceguru directory"
    exit 1
fi

echo "📦 Step 1: Building production web app..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Build failed. Please fix build errors first."
    exit 1
fi

echo "✅ Build completed successfully!"
echo ""
echo "📱 APK Generation Options:"
echo "=========================="
echo ""
echo "Option 1: Online APK Builder (Recommended)"
echo "-------------------------------------------"
echo "1. Zip the entire 'dist' folder that was just created"
echo "2. Go to: https://www.pwabuilder.com/"
echo "3. Enter URL: https://your-domain.com (or upload the dist folder)"
echo "4. Click 'Generate' and select Android"
echo "5. Download your APK file!"
echo ""
echo "Option 2: Local Build (Requires Android Studio)"
echo "------------------------------------------------"
echo "1. Install Android Studio and Android SDK"
echo "2. Install Capacitor: npm install @capacitor/cli @capacitor/core --legacy-peer-deps"
echo "3. Run: npx cap init ServiceGuru com.quintellix.serviceguru"
echo "4. Run: npx cap add android"
echo "5. Run: npx cap copy android"
echo "6. Run: npx cap open android"
echo "7. In Android Studio: Build → Generate Signed Bundle/APK"
echo ""
echo "Option 3: PWA Installation (No APK needed)"
echo "------------------------------------------"
echo "1. Deploy the 'dist' folder to any web server"
echo "2. Visit the URL on Android device"
echo "3. Browser will prompt: 'Add to Home Screen'"
echo "4. App installs like native Android app!"
echo ""
echo "🎯 Production Build Ready!"
echo "Location: mobile-serviceguru/dist/"
echo "Size: $(du -sh dist | cut -f1)"
echo ""
echo "Your ServiceGuru mobile app includes:"
echo "✅ Offline SQLite database"  
echo "✅ PWA with service worker"
echo "✅ Mobile-optimized UI"
echo "✅ Online registration/password reset"
echo "✅ All garage management features"
echo ""
echo "🏗️ Built by Quintellix Systems"