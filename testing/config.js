/**
 * Environment Configuration for Automated Testing
 * Reads configuration from environment variables without hardcoding URLs or secrets
 */

export const config = {
  // Environment URLs - must be provided via environment variables
  LOCAL_BASE_URL: process.env.LOCAL_BASE_URL || 'http://localhost:5000',
  PROD_BASE_URL: process.env.PROD_BASE_URL,
  
  // Database URLs for optional DB comparison
  LOCAL_DB_URL: process.env.LOCAL_DB_URL,
  PROD_DB_URL: process.env.PROD_DB_URL,
  
  // Test authentication credentials (if needed)
  TEST_EMAIL: process.env.TEST_EMAIL,
  TEST_PASSWORD: process.env.TEST_PASSWORD,
  
  // Timeouts and retry configuration
  REQUEST_TIMEOUT: parseInt(process.env.REQUEST_TIMEOUT || '10000'),
  MAX_RETRIES: parseInt(process.env.MAX_RETRIES || '3'),
  
  // Output paths
  ARTIFACTS_DIR: 'artifacts',
  ENDPOINTS_FILE: 'endpoints.generated.json',
  REPORT_FILE: 'prod-test-report.json'
};

export function validateConfig() {
  const required = [];
  
  if (!config.PROD_BASE_URL) {
    required.push('PROD_BASE_URL');
  }
  
  if (required.length > 0) {
    throw new Error(`Missing required environment variables: ${required.join(', ')}`);
  }
  
  console.log('✅ Configuration validated');
  console.log(`📍 Local URL: ${config.LOCAL_BASE_URL}`);
  console.log(`🌐 Production URL: ${config.PROD_BASE_URL}`);
  
  return config;
}