# ServiceGuru Mobile - Offline-First Android App

## 🚀 Features

- **Offline-First Architecture** - Works completely offline with SQLite/IndexedDB
- **No Homepage** - Direct login to role-based dashboard
- **Registration & Password Reset** - Requires internet connection for security
- **Complete Garage Management** - All features from the web app
- **Gmail Backup System** - Data sync via email
- **PWA Ready** - Progressive Web App for Android

## 🔧 Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

## 📱 Architecture

- **Frontend**: React + TypeScript + Tailwind CSS
- **Database**: Dexie (IndexedDB) for offline storage
- **Authentication**: Online registration/reset, offline login
- **State Management**: TanStack Query
- **UI**: Mobile-first responsive design

## 🌐 Online vs Offline Features

### Requires Internet:
- User registration
- Password reset
- Data backup to Gmail

### Works Offline:
- Login with existing credentials
- Customer management
- Job card tracking
- Spare parts inventory
- Invoice generation
- All daily operations

## 🏗️ Built by Quintellix Systems