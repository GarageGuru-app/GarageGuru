#!/bin/bash

# Render.com Build Script
# This ensures all dependencies are properly installed

echo "🚀 Starting Render.com build process..."

echo "📦 Installing dependencies..."
npm install

echo "🔍 Verifying critical packages..."
node -e "
try {
  require('pg');
  console.log('✅ pg package installed successfully');
} catch (e) {
  console.error('❌ pg package not found:', e.message);
  process.exit(1);
}
"

echo "🔧 Building frontend..."
npm run build

echo "📋 Listing package.json scripts..."
node -e "
const pkg = require('./package.json');
console.log('Available scripts:', Object.keys(pkg.scripts));
"

echo "✅ Build completed successfully!"