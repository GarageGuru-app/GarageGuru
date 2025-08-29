#!/bin/bash
# Render.com build script for GarageGuru
echo "Building GarageGuru for Render.com..."

# Install dependencies
npm install

# Build the application (frontend + backend)
npm run build

echo "Render build completed successfully!"