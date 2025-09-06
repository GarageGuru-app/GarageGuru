# ServiceGuru Android APK Build Instructions

## 📱 Generate Android APK File

### Prerequisites:
- Android Studio installed
- Java Development Kit (JDK) 11 or higher
- Android SDK with Build Tools

### Steps to Build APK:

1. **Build the web app for production:**
   ```bash
   cd mobile-serviceguru
   npm run build
   ```

2. **Initialize Capacitor (if not done):**
   ```bash
   npx cap init ServiceGuru com.quintellix.serviceguru
   ```

3. **Add Android platform:**
   ```bash
   npx cap add android
   ```

4. **Copy web assets to Android:**
   ```bash
   npx cap copy android
   ```

5. **Sync Capacitor plugins:**
   ```bash
   npx cap sync android
   ```

6. **Open in Android Studio:**
   ```bash
   npx cap open android
   ```

7. **Build APK in Android Studio:**
   - Go to Build → Generate Signed Bundle / APK
   - Choose APK
   - Select release build variant
   - Sign with your keystore (or create new one)
   - Build APK

### Alternative Command Line Build:
```bash
cd android
./gradlew assembleRelease
```

APK will be generated at:
`mobile-serviceguru/android/app/build/outputs/apk/release/app-release.apk`

## 🏗️ Project Configuration:

- **App ID:** com.quintellix.serviceguru
- **App Name:** ServiceGuru  
- **Version:** 1.0.0
- **Minimum SDK:** API 22 (Android 5.1)
- **Target SDK:** API 34 (Android 14)

## 📋 Features Included:
- ✅ Offline SQLite database
- ✅ Camera permissions for barcode scanning
- ✅ File storage for PDF generation
- ✅ Network access for online features
- ✅ PWA functionality with service worker
- ✅ Native Android UI with Capacitor

## 🔧 Troubleshooting:
- If build fails, run: `npx cap clean android`
- For permission issues: Check AndroidManifest.xml
- For Gradle issues: Update Android Gradle Plugin