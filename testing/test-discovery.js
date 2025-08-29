#!/usr/bin/env node

/**
 * Simple test script to verify endpoint discovery
 */

import { discoverEndpoints } from './endpoint-discovery.js';

async function testDiscovery() {
  console.log('🔍 Testing endpoint discovery...');
  
  try {
    const endpoints = await discoverEndpoints();
    console.log(`✅ Discovered ${endpoints.length} endpoints`);
    
    endpoints.forEach(endpoint => {
      console.log(`  ${endpoint.method} ${endpoint.path} (auth: ${endpoint.requiresAuth})`);
    });
    
  } catch (error) {
    console.error('❌ Discovery failed:', error.message);
  }
}

testDiscovery();