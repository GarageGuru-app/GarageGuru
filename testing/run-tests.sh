#!/bin/bash

# Production vs Local Testing Script
# This script runs the automated testing workflow

set -e

echo "🚀 Starting Production vs Local Environment Testing"
echo "=================================================="

# Check if required environment variables are set
if [ -z "$PROD_BASE_URL" ]; then
    echo "❌ PROD_BASE_URL environment variable is required"
    echo "Please set: export PROD_BASE_URL=https://your-production-url.com"
    exit 1
fi

# Set default values for optional variables
export LOCAL_BASE_URL=${LOCAL_BASE_URL:-"http://localhost:5000"}
export REQUEST_TIMEOUT=${REQUEST_TIMEOUT:-"10000"}
export MAX_RETRIES=${MAX_RETRIES:-"3"}

echo "📍 Local URL: $LOCAL_BASE_URL"
echo "🌐 Production URL: $PROD_BASE_URL"

# Create artifacts directory
mkdir -p artifacts

# Install testing dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing testing dependencies..."
    npm install
fi

# Run the main test suite
echo "🧪 Running test suite..."
node main.js

# Capture exit code
TEST_EXIT_CODE=$?

if [ $TEST_EXIT_CODE -eq 0 ]; then
    echo "✅ All tests passed! Production matches local environment."
else
    echo "❌ Tests failed! Check the report for details."
fi

echo "📄 Test results saved to ./artifacts/"
exit $TEST_EXIT_CODE