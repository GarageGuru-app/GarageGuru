#!/bin/bash
set -e

echo "🚀 Building GarageGuru for Production..."

# Install dependencies
echo "📦 Installing dependencies..."
npm ci

# Build frontend only (keep backend as TypeScript)
echo "⚡ Building frontend with Vite..."
vite build

# Copy server files to dist for production
echo "📁 Copying server files..."
cp -r server dist/
cp -r shared dist/
cp package.json dist/
cp package-lock.json dist/

echo "✅ Build completed successfully!"
echo "🌐 Ready for production deployment"