#!/bin/bash
set -e

echo "🚀 Building GarageGuru for Production..."

# Install dependencies
echo "📦 Installing dependencies..."
npm ci

# Build frontend only (backend runs directly with tsx)
echo "⚡ Building frontend with Vite..."
npx vite build

echo "✅ Build completed successfully!"
echo "🌐 Backend will run directly with tsx - no bundling needed"
echo "🌐 Ready for production deployment"