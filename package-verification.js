// Package verification script for debugging production deployments
// Run with: node package-verification.js

console.log('🔍 Package Verification Script');
console.log('===============================');

async function verifyPackages() {
  const requiredPackages = [
    'express',
    'cors', 
    'pg',
    'bcrypt',
    'jsonwebtoken'
  ];
  
  console.log('📦 Checking required packages...\n');
  
  for (const pkg of requiredPackages) {
    try {
      await import(pkg);
      console.log(`✅ ${pkg} - Available`);
    } catch (error) {
      console.log(`❌ ${pkg} - Missing or Error: ${error.message}`);
    }
  }
  
  console.log('\n🔧 Node.js Environment:');
  console.log(`Node Version: ${process.version}`);
  console.log(`Platform: ${process.platform}`);
  console.log(`Architecture: ${process.arch}`);
  
  console.log('\n📂 Process Info:');
  console.log(`Working Directory: ${process.cwd()}`);
  console.log(`Script Path: ${import.meta.url}`);
  
  console.log('\n🌍 Environment Variables:');
  console.log(`NODE_ENV: ${process.env.NODE_ENV || 'undefined'}`);
  console.log(`DATABASE_URL: ${process.env.DATABASE_URL ? 'configured' : 'missing'}`);
  console.log(`PORT: ${process.env.PORT || 'undefined'}`);
}

verifyPackages().catch(console.error);