/**
 * Endpoint Discovery System
 * Dynamically discovers API endpoints from the application
 */

import fs from 'fs/promises';
import path from 'path';
import { config } from './config.js';

/**
 * Discover endpoints by analyzing route files
 */
export async function discoverEndpoints() {
  console.log('🔍 Discovering API endpoints...');
  
  const endpoints = [];
  
  try {
    // Check server routes files (relative to project root)
    const routeFiles = [
      '../server/routes.ts',
      '../server/router.ts'
    ];
    
    for (const file of routeFiles) {
      try {
        const content = await fs.readFile(file, 'utf-8');
        const discoveredEndpoints = extractEndpointsFromFile(content, file);
        endpoints.push(...discoveredEndpoints);
      } catch (error) {
        console.log(`⚠️ Could not read ${file}: ${error.message}`);
      }
    }
    
    // Remove duplicates and sort
    const uniqueEndpoints = [...new Set(endpoints.map(e => JSON.stringify(e)))]
      .map(e => JSON.parse(e))
      .sort((a, b) => a.path.localeCompare(b.path));
    
    console.log(`✅ Discovered ${uniqueEndpoints.length} endpoints`);
    
    // Save discovered endpoints
    await saveEndpointsFile(uniqueEndpoints);
    
    return uniqueEndpoints;
  } catch (error) {
    console.error('❌ Endpoint discovery failed:', error.message);
    return await loadFallbackEndpoints();
  }
}

/**
 * Extract endpoints from route file content
 */
function extractEndpointsFromFile(content, filename) {
  const endpoints = [];
  
  // Regex patterns to match different route definitions
  const patterns = [
    // Express routes: app.get("/api/path", ...)
    /app\.(get|post|put|delete|patch)\s*\(\s*["']([^"']+)["']/g,
    // Hono routes: app.get('/api/path', ...)
    /app\.(get|post|put|delete|patch)\s*\(\s*['"]([^'"]+)['"]/g,
    // Router routes: router.get("/api/path", ...)
    /router\.(get|post|put|delete|patch)\s*\(\s*["']([^"']+)["']/g
  ];
  
  for (const pattern of patterns) {
    let match;
    while ((match = pattern.exec(content)) !== null) {
      const method = match[1].toUpperCase();
      const path = match[2];
      
      // Skip non-API routes and dynamic parameters for now
      if (path.startsWith('/api/') && !path.includes('*')) {
        endpoints.push({
          method,
          path,
          source: filename,
          requiresAuth: determineAuthRequirement(content, path),
          parameters: extractParameters(path)
        });
      }
    }
  }
  
  return endpoints;
}

/**
 * Determine if endpoint requires authentication
 */
function determineAuthRequirement(content, path) {
  // Look for authentication middleware near the route definition
  const authPatterns = [
    'authenticateToken',
    'authMiddleware',
    'requireAuth',
    'auth',
    'requireRole'
  ];
  
  // Simple heuristic: if auth middleware is mentioned in the file, assume auth is required
  // unless it's a public endpoint
  const publicEndpoints = ['/api/health', '/api/auth/login', '/api/auth/register'];
  
  if (publicEndpoints.some(pub => path.startsWith(pub))) {
    return false;
  }
  
  return authPatterns.some(pattern => content.includes(pattern));
}

/**
 * Extract path parameters from endpoint
 */
function extractParameters(path) {
  const params = [];
  const paramMatches = path.match(/:([^/]+)/g);
  
  if (paramMatches) {
    params.push(...paramMatches.map(p => p.substring(1)));
  }
  
  return params;
}

/**
 * Save discovered endpoints to JSON file
 */
async function saveEndpointsFile(endpoints) {
  try {
    await fs.mkdir(config.ARTIFACTS_DIR, { recursive: true });
    
    const endpointsData = {
      discovered_at: new Date().toISOString(),
      total_endpoints: endpoints.length,
      endpoints: endpoints.map(endpoint => ({
        ...endpoint,
        // Add TODO markers for manual configuration
        test_data: endpoint.method === 'POST' || endpoint.method === 'PUT' ? 
          '// TODO: Add test payload for this endpoint' : null,
        expected_status: '// TODO: Define expected status code',
        description: '// TODO: Add endpoint description'
      }))
    };
    
    const filePath = path.join(config.ARTIFACTS_DIR, config.ENDPOINTS_FILE);
    await fs.writeFile(filePath, JSON.stringify(endpointsData, null, 2));
    
    console.log(`📝 Endpoints saved to ${filePath}`);
    
    // Log TODOs for manual configuration
    const todosCount = endpoints.filter(e => 
      e.method === 'POST' || e.method === 'PUT' || e.parameters.length > 0
    ).length;
    
    if (todosCount > 0) {
      console.log(`⚠️ ${todosCount} endpoints need manual configuration in ${filePath}`);
    }
  } catch (error) {
    console.error('❌ Failed to save endpoints file:', error.message);
  }
}

/**
 * Load fallback endpoints if discovery fails
 */
async function loadFallbackEndpoints() {
  console.log('📂 Loading fallback endpoints...');
  
  const fallbackEndpoints = [
    { method: 'GET', path: '/api/health', requiresAuth: false, parameters: [] },
    { method: 'POST', path: '/api/auth/login', requiresAuth: false, parameters: [] },
    { method: 'GET', path: '/api/user/profile', requiresAuth: true, parameters: [] },
    { method: 'GET', path: '/api/garages', requiresAuth: true, parameters: [] },
    { method: 'GET', path: '/api/customers', requiresAuth: true, parameters: [] },
    { method: 'GET', path: '/api/spare-parts', requiresAuth: true, parameters: [] },
    { method: 'GET', path: '/api/job-cards', requiresAuth: true, parameters: [] }
  ];
  
  await saveEndpointsFile(fallbackEndpoints);
  return fallbackEndpoints;
}