#!/bin/bash
# Render.com start script for GarageGuru
echo "Starting GarageGuru on Render.com..."

# Debug: Show current directory and files
echo "Current directory: $(pwd)"
echo "Files in current directory:"
ls -la
echo "Files in dist directory:"
ls -la dist/ || echo "No dist directory found"

# Set environment
export NODE_ENV=production

# Start the application
node dist/index.js