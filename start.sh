#!/bin/bash
# Render.com start script for GarageGuru
echo "Starting GarageGuru on Render.com..."

# Set environment
export NODE_ENV=production

# Start the application
node dist/index.js