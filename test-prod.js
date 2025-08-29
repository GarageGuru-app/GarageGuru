#!/usr/bin/env node

/**
 * Production Testing Entry Point
 * This script can be run directly or called from CI/CD
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';

const execAsync = promisify(exec);

async function runProductionTests() {
  console.log('🚀 Garage Guru - Production Environment Testing');
  console.log('================================================');
  
  try {
    // Change to testing directory and run tests
    const testingDir = path.join(process.cwd(), 'testing');
    process.chdir(testingDir);
    
    // Make the script executable
    await execAsync('chmod +x run-tests.sh');
    
    // Run the test script
    const { stdout, stderr } = await execAsync('./run-tests.sh');
    
    console.log(stdout);
    if (stderr) {
      console.error(stderr);
    }
    
  } catch (error) {
    console.error('❌ Production testing failed:', error.message);
    
    if (error.stdout) {
      console.log('📤 Output:', error.stdout);
    }
    
    if (error.stderr) {
      console.error('📥 Errors:', error.stderr);
    }
    
    process.exit(error.code || 1);
  }
}

// Handle command line arguments
const args = process.argv.slice(2);

if (args.includes('--help') || args.includes('-h')) {
  console.log(`
Usage: node test-prod.js [options]

Environment Variables:
  PROD_BASE_URL     Production base URL (required)
  LOCAL_BASE_URL    Local base URL (default: http://localhost:5000)
  TEST_EMAIL        Test user email for authentication
  TEST_PASSWORD     Test user password for authentication
  LOCAL_DB_URL      Local database URL (optional)
  PROD_DB_URL       Production database URL (optional)

Options:
  --help, -h        Show this help message

Examples:
  export PROD_BASE_URL=https://myapp.replit.app
  export TEST_EMAIL=test@example.com
  export TEST_PASSWORD=password123
  node test-prod.js
`);
  process.exit(0);
}

// Run the tests
runProductionTests();