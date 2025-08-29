# Production vs Local Environment Testing

Automated testing system that compares your production and local environments after deployment to ensure they match.

## Quick Start

1. **Set Environment Variables**
```bash
export PROD_BASE_URL=https://your-production-url.replit.app
export TEST_EMAIL=your-test-email@example.com
export TEST_PASSWORD=your-test-password
```

2. **Run Tests**
```bash
# From project root
node test-prod.js

# Or from testing directory
cd testing
npm install
./run-tests.sh
```

## Environment Variables

### Required
- `PROD_BASE_URL` - Your production application URL

### Optional
- `LOCAL_BASE_URL` - Local development URL (default: http://localhost:5000)
- `TEST_EMAIL` - Test user email for authenticated endpoints
- `TEST_PASSWORD` - Test user password for authenticated endpoints
- `LOCAL_DB_URL` - Local database connection string
- `PROD_DB_URL` - Production database connection string
- `REQUEST_TIMEOUT` - Request timeout in milliseconds (default: 10000)
- `MAX_RETRIES` - Maximum retry attempts (default: 3)

## What It Tests

### API Endpoints
- Automatically discovers API endpoints from your route files
- Compares status codes between local and production
- Validates response schemas match
- Measures response time differences
- Handles authentication for protected endpoints

### Database (Optional)
- Compares table schemas between environments
- Checks row counts for data consistency
- Identifies missing tables or columns

## Output

### Console Summary
```
📊 Test Results Summary
================================================================================
| Endpoint                  | Local Status | Prod Status | Schema | Latency (ms) | Status |
|---------------------------|--------------|-------------|--------|--------------|--------|
| GET /api/health          | 200          | 200         | ✅     | 45           | ✅     |
| POST /api/auth/login     | 200          | 200         | ✅     | 120          | ✅     |
| GET /api/customers       | 200          | 200         | ✅     | 89           | ✅     |
================================================================================
✅ Passed: 15 | ❌ Failed: 0 | 🚫 Errors: 0
```

### Artifacts
- `artifacts/prod-test-report.json` - Detailed test results
- `artifacts/endpoints.generated.json` - Discovered endpoints with TODOs

## CI/CD Integration

### Replit Deployments
The system automatically runs after deployment if configured properly.

### Manual Integration
Add to your deployment pipeline:
```bash
# After deployment
PROD_BASE_URL=https://your-app.replit.app node test-prod.js
```

### Exit Codes
- `0` - All tests passed
- `1` - Tests failed or errors occurred

## Configuration

### Custom Test Data
Edit `artifacts/endpoints.generated.json` to add:
- Custom test payloads for POST/PUT endpoints
- Expected status codes
- Endpoint descriptions

Example:
```json
{
  "method": "POST",
  "path": "/api/customers",
  "test_data": {
    "name": "Test Customer",
    "phone": "1234567890",
    "bikeNumber": "TEST123"
  },
  "expected_status": 201
}
```

### Authentication
The system supports JWT token authentication. Set `TEST_EMAIL` and `TEST_PASSWORD` to test protected endpoints.

## Troubleshooting

### Common Issues

1. **"PROD_BASE_URL environment variable is required"**
   - Set the production URL: `export PROD_BASE_URL=https://your-app.replit.app`

2. **"No endpoints discovered"**
   - Check that route files exist in `server/routes.ts` or `server/router.ts`
   - Manual endpoints will be generated in `artifacts/endpoints.generated.json`

3. **Authentication failures**
   - Verify `TEST_EMAIL` and `TEST_PASSWORD` are correct
   - Check that the test user exists in both environments

4. **Database comparison fails**
   - Ensure `LOCAL_DB_URL` and `PROD_DB_URL` are set correctly
   - Database comparison is optional and will be skipped if URLs are missing

### Debug Mode
Run with debug logging:
```bash
DEBUG=1 node test-prod.js
```

## Advanced Usage

### Custom Endpoint Discovery
If automatic discovery fails, manually edit `artifacts/endpoints.generated.json`:

```json
{
  "discovered_at": "2025-01-01T00:00:00.000Z",
  "total_endpoints": 5,
  "endpoints": [
    {
      "method": "GET",
      "path": "/api/custom-endpoint",
      "requiresAuth": true,
      "parameters": ["id"],
      "test_data": null,
      "expected_status": 200,
      "description": "Custom endpoint for testing"
    }
  ]
}
```

### Database Schema Validation
Set database URLs to enable schema comparison:
```bash
export LOCAL_DB_URL=postgresql://user:pass@localhost:5432/local_db
export PROD_DB_URL=postgresql://user:pass@prod-host:5432/prod_db
```

The system will compare:
- Table existence
- Column definitions
- Data types
- Row counts