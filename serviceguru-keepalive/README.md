# ServiceGuru Keep-Alive Service

🚗 **Netlify-hosted service to keep ServiceGuru alive on Render**

## 🎯 Purpose

This service runs on Netlify (which never spins down) and continuously pings your ServiceGuru app on Render every 2 minutes to prevent the 15-minute sleep timeout.

## ⚡ Features

- **Always-on monitoring** - Netlify doesn't spin down
- **Real-time dashboard** - Visual status and logs  
- **Statistics tracking** - Success/failure rates and uptime
- **Automatic startup** - Begins monitoring immediately
- **Professional logging** - Timestamped activity log
- **Responsive design** - Works on mobile and desktop

## 🚀 Deployment to Netlify

1. **Upload this folder** to a new Git repository
2. **Connect to Netlify**:
   - Go to [Netlify](https://netlify.com)
   - Click "Add new site" > "Import from Git"
   - Select your repository
   - Deploy settings are auto-configured via `netlify.toml`
3. **Your service is live!** - Opens automatically and starts pinging

## 🔧 How It Works

- **Pings every 2 minutes** to `https://garageguru-whh7.onrender.com`
- **Uses no-cors mode** to avoid CORS issues
- **Tracks statistics** and displays real-time status
- **Runs continuously** as long as the page is accessible
- **Self-monitoring** with error handling and timeouts

## 📊 Dashboard Features

- **Service Status** - Current ping status and last successful ping
- **Statistics** - Total pings, success rate, uptime counter
- **Activity Log** - Scrollable log of all ping attempts
- **Visual Indicators** - Color-coded status and pulsing animations

## 💡 Benefits

- ✅ **Zero maintenance** - Runs automatically 24/7
- ✅ **No server required** - Pure frontend solution  
- ✅ **Free hosting** - Netlify free tier is sufficient
- ✅ **Professional monitoring** - Dashboard for oversight
- ✅ **Reliable** - Netlify has 99.9% uptime

## 🌐 Access

Once deployed on Netlify, your keep-alive service will be available at:
`https://your-site-name.netlify.app`

The service will automatically start monitoring ServiceGuru and display real-time status.

---

**Powered by Netlify | Keeping ServiceGuru Always Available** 🎉