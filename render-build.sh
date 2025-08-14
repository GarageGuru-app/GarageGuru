#!/bin/bash

# Build script for Render.com deployment
echo "🚀 Starting GarageGuru Backend Build..."

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Build the application
echo "🔨 Building application..."
npm run build

echo "✅ Build completed successfully!"
echo "🎯 Ready for deployment on Render.com"