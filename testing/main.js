#!/usr/bin/env node

/**
 * Main Test Orchestrator
 * Coordinates the entire testing workflow
 */

import { validateConfig } from './config.js';
import { discoverEndpoints } from './endpoint-discovery.js';
import { testEndpoint, AuthManager } from './test-runner.js';
import { generateReport, generateCISummary } from './reporter.js';
import { compareDatabase } from './db-comparison.js';

/**
 * Main test execution
 */
async function main() {
  console.log('🚀 Starting Production vs Local Comparison Tests');
  console.log('='.repeat(60));
  
  try {
    // 1. Validate configuration
    const config = validateConfig();
    
    // 2. Discover endpoints
    const endpoints = await discoverEndpoints();
    
    if (endpoints.length === 0) {
      console.error('❌ No endpoints discovered. Check endpoint-discovery.js');
      process.exit(1);
    }
    
    // 3. Setup authentication
    const authManager = new AuthManager();
    
    // Authenticate against both environments if credentials are provided
    if (config.TEST_EMAIL && config.TEST_PASSWORD) {
      console.log('🔐 Authenticating against environments...');
      await Promise.all([
        authManager.authenticate(config.LOCAL_BASE_URL, 'local'),
        authManager.authenticate(config.PROD_BASE_URL, 'prod')
      ]);
    } else {
      console.log('⚠️ No test credentials provided - testing public endpoints only');
    }
    
    // 4. Run endpoint tests
    console.log(`🧪 Testing ${endpoints.length} endpoints...`);
    const testResults = [];
    
    for (let i = 0; i < endpoints.length; i++) {
      const endpoint = endpoints[i];
      console.log(`[${i + 1}/${endpoints.length}] Testing ${endpoint.method} ${endpoint.path}`);
      
      const result = await testEndpoint(endpoint, authManager);
      testResults.push(result);
      
      // Small delay between requests to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    // 5. Run database comparison (optional)
    let dbComparison = null;
    try {
      dbComparison = await compareDatabase();
    } catch (error) {
      console.log(`⚠️ Database comparison skipped: ${error.message}`);
    }
    
    // 6. Generate report
    const summary = await generateReport(testResults);
    
    // 7. Include database results in final report if available
    if (dbComparison) {
      console.log('\n🗄️ Database Comparison Results:');
      
      if (dbComparison.error) {
        console.log(`❌ Database comparison failed: ${dbComparison.error}`);
      } else {
        const schemaDiff = dbComparison.schema_comparison;
        const rowCountDiff = dbComparison.row_count_comparison;
        
        console.log(`📊 Tables: Local ${schemaDiff.local_tables.length}, Prod ${schemaDiff.prod_tables.length}`);
        
        if (schemaDiff.missing_in_prod.length > 0) {
          console.log(`⚠️ Tables missing in prod: ${schemaDiff.missing_in_prod.join(', ')}`);
        }
        
        if (schemaDiff.missing_in_local.length > 0) {
          console.log(`⚠️ Tables missing in local: ${schemaDiff.missing_in_local.join(', ')}`);
        }
        
        const rowMismatches = rowCountDiff.filter(table => !table.match && !table.error);
        if (rowMismatches.length > 0) {
          console.log(`⚠️ Row count mismatches in ${rowMismatches.length} tables`);
        }
      }
      
      // Add database results to summary
      summary.database_comparison = dbComparison;
    }
    
    // 8. Generate CI summary and exit code
    const exitCode = generateCISummary(summary);
    
    console.log('\n📄 Test artifacts saved to ./artifacts/');
    console.log('✅ Test run complete!');
    
    process.exit(exitCode);
    
  } catch (error) {
    console.error('❌ Test execution failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Run main function
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}