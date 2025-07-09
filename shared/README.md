# Shared Utilities

This directory contains shared utilities that are used by both the backend server and serverless functions (Supabase Edge Functions and Cloudflare Pages Functions).

## Directory Structure

- `/api` - API utilities for serverless functions
  - `/auth.ts` - Authentication utilities 
  - `/cors.ts` - CORS handling utilities
  - `/logging.ts` - Logging utilities
  - `/responses.ts` - Standardized API responses
  - `/validation.ts` - Request validation utilities
  - `/middleware.ts` - Middleware functions
  - `/index.ts` - Central export file

- `/utils` - General utilities
  - `/errorHandling.js` - Error handling utilities
  - `/toastManager.js` - Toast notification manager
  - `/logger.js` - Logging utilities

- `/config.js` - Shared configuration

## Usage

### In Backend Server

```javascript
import { getConfig } from '../shared/config.js';
import { logger } from '../shared/utils/logger.js';

// Get configuration
const apiTimeout = getConfig('api.timeout', 30000);

// Use logger
logger.info('Server started', { port: 3001 });
```

### In Serverless Functions

```typescript
import { 
  corsHeaders, 
  handleCORS,
  createSupabaseClient,
  getUser,
  successResponse,
  errorResponse,
  toResponse
} from "../../shared/api/index.ts"

serve(async (req) => {
  // Handle CORS
  const corsResponse = handleCORS(req);
  if (corsResponse) return corsResponse;
  
  // Authenticate user
  const supabase = createSupabaseClient(req);
  const user = await getUser(supabase);
  
  // Return response
  return toResponse(successResponse({ message: 'Hello world' }), corsHeaders);
});
```

## Best Practices

1. Always import from the shared utilities rather than duplicating code
2. Maintain consistency in API responses by using the standardized response utilities
3. Use the shared configuration to access environment variables
4. Keep the shared utilities small and focused on a single responsibility
5. Document any changes to the shared utilities in this README