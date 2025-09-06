#!/usr/bin/env node

// ServiceGuru Keep-Alive Script for Render
// Pings the deployed app every 2 minutes to prevent spin-down

const https = require('https');
const http = require('http');

const SERVICEGURU_URL = 'https://garageguru-whh7.onrender.com';
const PING_INTERVAL = 2 * 60 * 1000; // 2 minutes in milliseconds

function pingServiceGuru() {
  const url = new URL(SERVICEGURU_URL);
  const protocol = url.protocol === 'https:' ? https : http;
  
  const options = {
    hostname: url.hostname,
    port: url.port || (url.protocol === 'https:' ? 443 : 80),
    path: '/',
    method: 'GET',
    timeout: 10000, // 10 second timeout
    headers: {
      'User-Agent': 'ServiceGuru-KeepAlive/1.0'
    }
  };

  const req = protocol.request(options, (res) => {
    const timestamp = new Date().toISOString();
    console.log(`✅ [${timestamp}] ServiceGuru pinged successfully - Status: ${res.statusCode}`);
    
    // Consume response data to free up memory
    res.on('data', () => {});
    res.on('end', () => {});
  });

  req.on('error', (error) => {
    const timestamp = new Date().toISOString();
    console.error(`❌ [${timestamp}] ServiceGuru ping failed:`, error.message);
  });

  req.on('timeout', () => {
    const timestamp = new Date().toISOString();
    console.error(`⏰ [${timestamp}] ServiceGuru ping timed out`);
    req.destroy();
  });

  req.end();
}

// Start the keep-alive service
console.log('🚀 ServiceGuru Keep-Alive started');
console.log(`📡 Pinging ${SERVICEGURU_URL} every 2 minutes`);
console.log('⏹️  Press Ctrl+C to stop\n');

// Initial ping
pingServiceGuru();

// Set up interval for regular pings
const intervalId = setInterval(pingServiceGuru, PING_INTERVAL);

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 ServiceGuru Keep-Alive shutting down...');
  clearInterval(intervalId);
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 ServiceGuru Keep-Alive terminated');
  clearInterval(intervalId);
  process.exit(0);
});