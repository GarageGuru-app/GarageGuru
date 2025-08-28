import { Hono } from 'hono';
import { serve } from '@hono/node-server';
import router from './router';

// Serverless/Node.js adapter for dual runtime support
export function createHandler(app: Hono) {
  return async (req: any, res?: any) => {
    // Serverless environment (Vercel)
    if (!res && req instanceof Request) {
      return app.fetch(req);
    }
    
    // Node.js environment (local development)
    if (res && typeof res.writeHead === 'function') {
      try {
        // Convert Node.js req to standard Request
        const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
        const method = req.method || 'GET';
        const headers = new Headers();
        
        // Copy headers
        for (const [key, value] of Object.entries(req.headers)) {
          if (typeof value === 'string') {
            headers.set(key, value);
          } else if (Array.isArray(value)) {
            headers.set(key, value.join(', '));
          }
        }
        
        // Handle body
        let body: any = undefined;
        if (method !== 'GET' && method !== 'HEAD') {
          body = await new Promise((resolve) => {
            let data = '';
            req.on('data', (chunk: any) => {
              data += chunk;
            });
            req.on('end', () => {
              resolve(data || undefined);
            });
          });
        }
        
        const request = new Request(url.toString(), {
          method,
          headers,
          body: body || undefined
        });
        
        // Process with Hono
        const response = await app.fetch(request);
        
        // Convert Response back to Node.js response
        res.statusCode = response.status;
        
        // Set headers
        response.headers.forEach((value, key) => {
          res.setHeader(key, value);
        });
        
        // Send body
        const responseBody = await response.text();
        res.end(responseBody);
        
      } catch (error) {
        console.error('Adapter error:', error);
        res.statusCode = 500;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({
          error: 'Internal server error',
          details: error instanceof Error ? error.message : 'Unknown error'
        }));
      }
    } else {
      throw new Error('Invalid request/response objects provided to adapter');
    }
  };
}

// Start server for local development
export function startServer(port: number = 5000) {
  console.log('🚀 Starting Hono server...');
  
  serve({
    fetch: router.fetch,
    port
  });
  
  console.log(`🌐 Server running on http://0.0.0.0:${port}`);
}

// Export the handler for both environments
export const handler = createHandler(router);
export default handler;