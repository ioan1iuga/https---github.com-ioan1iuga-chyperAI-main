# Shared Architecture Documentation

## Overview

This document describes the shared architecture between the backend server and serverless functions. The goal is to maintain a single source of truth for common functionality, reduce code duplication, and ensure consistent behavior across different environments.

## Shared Directory Structure

The `shared` directory contains code that is used by both the backend server and serverless functions:

```
/shared
├── /api                # API utilities for serverless functions
│   ├── auth.ts         # Authentication utilities
│   ├── cors.ts         # CORS handling
│   ├── deployment.ts   # Deployment utilities
│   ├── index.ts        # Main exports
│   ├── logging.ts      # Logging utilities
│   ├── middleware.ts   # Middleware functions
│   ├── responses.ts    # Standard API responses
│   └── validation.ts   # Input validation
├── /utils              # Shared utilities
│   ├── errorHandling.js # Error handling
│   ├── logger.js       # Logging
│   └── toastManager.js # Toast notifications
└── config.js           # Shared configuration
```

## Implementation Details

### API Utilities

1. **Standard API Responses**: All API endpoints use the same response format:
   ```json
   {
     "success": true|false,
     "data": {...},       // Present when success is true
     "error": "...",      // Present when success is false
     "message": "...",    // Optional message
     "status": 200        // HTTP status code
   }
   ```

2. **CORS Handling**: All endpoints use the same CORS configuration:
   ```javascript
   corsHeaders = {
     'Access-Control-Allow-Origin': '*',
     'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
     'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
   }
   ```

3. **Authentication**: Both backend and serverless functions use the same authentication flow:
   - Extract token from Authorization header
   - Verify token with Supabase or JWT
   - Get user profile from database

4. **Error Handling**: Standardized error handling with consistent logging and response formats.

### Configuration Management

The shared configuration system provides:

1. **Environment Variables**: Access to environment variables with sensible defaults
2. **Feature Flags**: Centralized control of feature availability
3. **Service Endpoints**: Consistent service endpoints across environments

Usage:
```javascript
import { getConfig } from '../shared/config.js';

const apiTimeout = getConfig('api.timeout', 30000);
const isProduction = getConfig('isProduction', false);
```

## Migration Process

We have migrated from separate code bases to a shared architecture:

1. **Identify Duplication**: Identified duplicate code between backend and serverless functions
2. **Create Shared Utilities**: Extracted common code into shared modules
3. **Update References**: Updated imports to use the shared modules
4. **Testing**: Ensured consistent behavior across environments
5. **Documentation**: Created this document to explain the architecture

## Benefits

- **Single Source of Truth**: Changes to shared code affect all environments
- **Reduced Duplication**: Less code to maintain
- **Consistent Behavior**: Same response format, error handling, and authentication flow
- **Easier Maintenance**: Changes to shared functionality only need to be made once
- **Better Testing**: Shared code can be tested once and used everywhere

## Best Practices

1. **Always Use Shared Utilities**: Never duplicate functionality that exists in the shared directory
2. **Update Documentation**: When adding or changing shared functionality, update this document
3. **Backward Compatibility**: Maintain backward compatibility when updating shared code
4. **Testing**: Test shared code in all environments before deploying
5. **Configuration Over Code**: Use configuration for environment-specific values

## Future Improvements

- Further consolidate common code
- Create TypeScript interfaces for shared types
- Add automated tests for shared utilities
- Create a common package that can be imported by both backend and serverless functions