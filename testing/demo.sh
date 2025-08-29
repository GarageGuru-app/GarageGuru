#!/bin/bash

# Demo script showing how to use the testing system
echo "🚀 Garage Guru - Production Testing Demo"
echo "========================================"

# Check if this is a demo run (no production URL set)
if [ -z "$PROD_BASE_URL" ]; then
    echo "📋 DEMO MODE: No PROD_BASE_URL set"
    echo ""
    echo "To run actual tests, set environment variables:"
    echo "  export PROD_BASE_URL=https://your-app.replit.app"
    echo "  export TEST_EMAIL=your-test-email@example.com"
    echo "  export TEST_PASSWORD=your-test-password"
    echo ""
    echo "🔍 Running endpoint discovery only..."
    
    node test-discovery.js
    
    echo ""
    echo "📄 Example usage:"
    echo "  PROD_BASE_URL=https://garage-guru.replit.app node ../test-prod.js"
    echo ""
    echo "✅ Demo complete! Check artifacts/ for generated endpoint configuration."
    
else
    echo "🧪 Running full production comparison..."
    ./run-tests.sh
fi