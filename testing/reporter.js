/**
 * Test Results Reporter
 * Generates summary tables and JSON artifacts
 */

import fs from 'fs/promises';
import path from 'path';
import { config } from './config.js';

/**
 * Generate and display test report
 */
export async function generateReport(testResults) {
  console.log('\n📊 Test Results Summary');
  console.log('='.repeat(80));
  
  const summary = {
    total_endpoints: testResults.length,
    passed: 0,
    failed: 0,
    errors: 0,
    report_generated_at: new Date().toISOString()
  };
  
  // Print table header
  console.log('| Endpoint | Local Status | Prod Status | Schema | Latency (ms) | Status |');
  console.log('|----------|--------------|-------------|--------|--------------|--------|');
  
  // Process each test result
  for (const result of testResults) {
    const status = getTestStatus(result);
    summary[status]++;
    
    const localStatus = result.local?.status || 'ERROR';
    const prodStatus = result.prod?.status || 'ERROR';
    const schemaMatch = result.comparison?.schema_match ? '✅' : '❌';
    const latencyDiff = result.comparison?.latency_difference || 0;
    const statusIcon = getStatusIcon(result);
    
    // Format endpoint name
    const endpoint = result.endpoint.length > 25 ? 
      result.endpoint.substring(0, 22) + '...' : 
      result.endpoint;
    
    console.log(
      `| ${endpoint.padEnd(25)} | ${String(localStatus).padEnd(12)} | ${String(prodStatus).padEnd(11)} | ${schemaMatch.padEnd(6)} | ${String(latencyDiff).padEnd(12)} | ${statusIcon} |`
    );
  }
  
  console.log('='.repeat(80));
  console.log(`✅ Passed: ${summary.passed} | ❌ Failed: ${summary.failed} | 🚫 Errors: ${summary.errors}`);
  
  // Save detailed JSON report
  await saveJsonReport(testResults, summary);
  
  return summary;
}

/**
 * Get test status classification
 */
function getTestStatus(result) {
  if (!result.local || !result.prod) {
    return 'errors';
  }
  
  if (result.local.status === 'ERROR' || result.prod.status === 'ERROR') {
    return 'errors';
  }
  
  if (result.comparison.status_match && result.comparison.schema_match) {
    return 'passed';
  }
  
  return 'failed';
}

/**
 * Get status icon for display
 */
function getStatusIcon(result) {
  const status = getTestStatus(result);
  
  switch (status) {
    case 'passed': return '✅';
    case 'failed': return '❌';
    case 'errors': return '🚫';
    default: return '❓';
  }
}

/**
 * Save detailed JSON report
 */
async function saveJsonReport(testResults, summary) {
  try {
    await fs.mkdir(config.ARTIFACTS_DIR, { recursive: true });
    
    const report = {
      ...summary,
      test_configuration: {
        local_base_url: config.LOCAL_BASE_URL,
        prod_base_url: config.PROD_BASE_URL,
        request_timeout: config.REQUEST_TIMEOUT,
        max_retries: config.MAX_RETRIES
      },
      test_results: testResults.map(result => ({
        ...result,
        // Add detailed analysis
        analysis: analyzeTestResult(result)
      }))
    };
    
    const reportPath = path.join(config.ARTIFACTS_DIR, config.REPORT_FILE);
    await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
    
    console.log(`📄 Detailed report saved to ${reportPath}`);
    
    return reportPath;
  } catch (error) {
    console.error('❌ Failed to save JSON report:', error.message);
  }
}

/**
 * Analyze individual test result
 */
function analyzeTestResult(result) {
  const analysis = {
    status: getTestStatus(result),
    issues: [],
    recommendations: []
  };
  
  if (!result.local || !result.prod) {
    analysis.issues.push('One or both environments failed to respond');
    analysis.recommendations.push('Check environment availability and authentication');
    return analysis;
  }
  
  // Status code analysis
  if (!result.comparison.status_match) {
    analysis.issues.push(`Status code mismatch: Local ${result.local.status} vs Prod ${result.prod.status}`);
    
    if (result.local.status < 400 && result.prod.status >= 400) {
      analysis.recommendations.push('Production endpoint may be broken or missing');
    } else if (result.local.status >= 400 && result.prod.status < 400) {
      analysis.recommendations.push('Local endpoint may be broken or have different behavior');
    }
  }
  
  // Schema analysis
  if (!result.comparison.schema_match) {
    analysis.issues.push('Response schema differs between environments');
    analysis.recommendations.push('Check for API version differences or missing migrations');
  }
  
  // Performance analysis
  if (result.comparison.latency_difference > 5000) {
    analysis.issues.push(`High latency difference: ${result.comparison.latency_difference}ms`);
    analysis.recommendations.push('Investigate production performance bottlenecks');
  }
  
  // Error analysis
  if (result.local.error) {
    analysis.issues.push(`Local error: ${result.local.error}`);
  }
  
  if (result.prod.error) {
    analysis.issues.push(`Production error: ${result.prod.error}`);
  }
  
  return analysis;
}

/**
 * Generate summary for CI/CD
 */
export function generateCISummary(summary) {
  const exitCode = summary.failed > 0 || summary.errors > 0 ? 1 : 0;
  
  if (exitCode === 0) {
    console.log('\n🎉 All tests passed! Production environment matches local.');
  } else {
    console.log('\n⚠️ Tests failed! Production environment differs from local.');
    console.log(`Failed tests: ${summary.failed}, Errors: ${summary.errors}`);
  }
  
  return exitCode;
}