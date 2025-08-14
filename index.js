// Production Entry Point for Render.com
// This file ensures we use the correct server with pg driver

console.log('🚀 Starting production server...');
console.log('📦 Checking pg package availability...');

try {
  // Test if pg package is available
  const { Pool } = await import('pg');
  console.log('✅ pg package loaded successfully');
  
  // Start the standalone server
  await import('./standalone-server.js');
} catch (error) {
  console.error('❌ Error starting server:', error);
  console.error('📦 Package availability check failed');
  
  // Try alternative approach
  console.log('🔄 Attempting fallback server start...');
  process.exit(1);
}