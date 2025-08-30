#!/bin/bash
set -e

echo "🚀 Building GarageGuru for Production..."

# Install dependencies
echo "📦 Installing dependencies..."
npm ci

# Build the application (frontend + backend)
echo "⚡ Building application..."
npm run build

echo "✅ Build completed successfully!"
echo "🌐 Ready for production deployment"