/**
 * Test Runner for API Endpoint Comparison
 * Runs tests against local and production environments
 */

import { config } from './config.js';

/**
 * Authentication helper
 */
class AuthManager {
  constructor() {
    this.tokens = {
      local: null,
      prod: null
    };
  }
  
  async authenticate(baseUrl, environment) {
    if (!config.TEST_EMAIL || !config.TEST_PASSWORD) {
      console.log(`⚠️ No test credentials provided for ${environment} authentication`);
      return null;
    }
    
    try {
      const response = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: config.TEST_EMAIL,
          password: config.TEST_PASSWORD
        }),
        timeout: config.REQUEST_TIMEOUT
      });
      
      if (response.ok) {
        const data = await response.json();
        this.tokens[environment] = data.token;
        console.log(`✅ Authenticated for ${environment}`);
        return data.token;
      } else {
        console.log(`❌ Authentication failed for ${environment}: ${response.status}`);
        return null;
      }
    } catch (error) {
      console.log(`❌ Authentication error for ${environment}: ${error.message}`);
      return null;
    }
  }
  
  getAuthHeaders(environment) {
    const token = this.tokens[environment];
    return token ? { 'Authorization': `Bearer ${token}` } : {};
  }
}

/**
 * Test a single endpoint against both environments
 */
export async function testEndpoint(endpoint, authManager) {
  console.log(`🧪 Testing ${endpoint.method} ${endpoint.path}...`);
  
  const results = {
    endpoint: `${endpoint.method} ${endpoint.path}`,
    local: null,
    prod: null,
    comparison: {
      status_match: false,
      schema_match: false,
      latency_difference: 0
    }
  };
  
  // Test local environment
  results.local = await makeRequest(
    config.LOCAL_BASE_URL,
    endpoint,
    authManager.getAuthHeaders('local'),
    'local'
  );
  
  // Test production environment
  results.prod = await makeRequest(
    config.PROD_BASE_URL,
    endpoint,
    authManager.getAuthHeaders('prod'),
    'prod'
  );
  
  // Compare results
  if (results.local && results.prod) {
    results.comparison = compareResponses(results.local, results.prod);
  }
  
  return results;
}

/**
 * Make HTTP request to endpoint
 */
async function makeRequest(baseUrl, endpoint, authHeaders, environment) {
  const url = buildUrl(baseUrl, endpoint);
  const startTime = Date.now();
  
  try {
    const response = await fetch(url, {
      method: endpoint.method,
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders
      },
      body: getTestPayload(endpoint),
      timeout: config.REQUEST_TIMEOUT
    });
    
    const endTime = Date.now();
    const responseTime = endTime - startTime;
    
    let responseData = null;
    let contentType = response.headers.get('content-type');
    
    if (contentType && contentType.includes('application/json')) {
      try {
        responseData = await response.json();
      } catch (error) {
        responseData = { error: 'Failed to parse JSON response' };
      }
    } else {
      responseData = { 
        content_type: contentType,
        body_length: (await response.text()).length 
      };
    }
    
    return {
      status: response.status,
      response_time: responseTime,
      data: normalizeResponseData(responseData),
      headers: Object.fromEntries(response.headers.entries()),
      environment
    };
  } catch (error) {
    return {
      status: 'ERROR',
      response_time: Date.now() - startTime,
      error: error.message,
      environment
    };
  }
}

/**
 * Build URL with parameter substitution
 */
function buildUrl(baseUrl, endpoint) {
  let path = endpoint.path;
  
  // Replace common path parameters with test values
  const paramMappings = {
    ':id': 'test-id-123',
    ':garageId': 'test-garage-123',
    ':customerId': 'test-customer-123',
    ':userId': 'test-user-123',
    ':jobCardId': 'test-job-123',
    ':invoiceId': 'test-invoice-123'
  };
  
  for (const [param, value] of Object.entries(paramMappings)) {
    path = path.replace(param, value);
  }
  
  // Handle any remaining parameters
  path = path.replace(/:([^/]+)/g, 'test-$1');
  
  return `${baseUrl}${path}`;
}

/**
 * Get test payload for POST/PUT requests
 */
function getTestPayload(endpoint) {
  if (!['POST', 'PUT', 'PATCH'].includes(endpoint.method)) {
    return null;
  }
  
  // Basic test payloads - these should be configured in endpoints.generated.json
  const testPayloads = {
    '/api/auth/login': {
      email: config.TEST_EMAIL || 'test@example.com',
      password: config.TEST_PASSWORD || 'test123'
    },
    '/api/garages': {
      name: 'Test Garage',
      owner_name: 'Test Owner',
      phone: '1234567890'
    },
    '/api/customers': {
      name: 'Test Customer',
      phone: '1234567890',
      bikeNumber: 'TEST123'
    }
  };
  
  const payload = testPayloads[endpoint.path];
  return payload ? JSON.stringify(payload) : null;
}

/**
 * Normalize response data to remove dynamic values for comparison
 */
function normalizeResponseData(data) {
  if (!data || typeof data !== 'object') {
    return data;
  }
  
  const normalized = JSON.parse(JSON.stringify(data));
  
  // Remove or normalize dynamic fields
  const dynamicFields = [
    'id', 'created_at', 'updated_at', 'timestamp', 'token',
    'access_token', 'refresh_token', 'expires_at', 'last_login',
    'password', 'hash', 'session_id'
  ];
  
  function normalizeDynamic(obj) {
    if (Array.isArray(obj)) {
      return obj.map(normalizeDynamic);
    }
    
    if (obj && typeof obj === 'object') {
      const result = {};
      for (const [key, value] of Object.entries(obj)) {
        if (dynamicFields.includes(key.toLowerCase())) {
          result[key] = '[DYNAMIC]';
        } else if (typeof value === 'string' && value.match(/^\d{4}-\d{2}-\d{2}/)) {
          // Normalize ISO date strings
          result[key] = '[TIMESTAMP]';
        } else if (typeof value === 'string' && value.length > 20 && value.match(/^[a-zA-Z0-9+/=]+$/)) {
          // Normalize tokens and encoded strings
          result[key] = '[TOKEN]';
        } else {
          result[key] = normalizeDynamic(value);
        }
      }
      return result;
    }
    
    return obj;
  }
  
  return normalizeDynamic(normalized);
}

/**
 * Compare responses between local and production
 */
function compareResponses(localResult, prodResult) {
  const comparison = {
    status_match: localResult.status === prodResult.status,
    schema_match: false,
    latency_difference: Math.abs(localResult.response_time - prodResult.response_time)
  };
  
  // Compare normalized response schemas
  if (localResult.data && prodResult.data) {
    const localSchema = getResponseSchema(localResult.data);
    const prodSchema = getResponseSchema(prodResult.data);
    comparison.schema_match = JSON.stringify(localSchema) === JSON.stringify(prodSchema);
  } else {
    comparison.schema_match = localResult.data === prodResult.data;
  }
  
  return comparison;
}

/**
 * Extract response schema for comparison
 */
function getResponseSchema(data) {
  if (Array.isArray(data)) {
    return data.length > 0 ? ['array', getResponseSchema(data[0])] : ['array', 'empty'];
  }
  
  if (data && typeof data === 'object') {
    const schema = {};
    for (const [key, value] of Object.entries(data)) {
      schema[key] = getResponseSchema(value);
    }
    return schema;
  }
  
  return typeof data;
}

export { AuthManager };