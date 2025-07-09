@@ .. @@
 import type { WorkerRequest, WorkerEnvironment, CORSConfig } from '../../types/worker-configuration';

 const defaultCorsConfig: CORSConfig = {
-  origin: Deno.env.get('CORS_ALLOW_ORIGIN') || true, // Allow all origins by default
-  methods: (Deno.env.get('CORS_ALLOW_METHODS') || 'GET,POST,PUT,DELETE,OPTIONS,PATCH').split(','),
+  origin: '*', // Allow all origins by default
+  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
   allowedHeaders: [
     'Content-Type',
     'Authorization',
@@ .. @@
     'X-API-Key',
     'X-Client-Version'
   ],
-  exposedHeaders: [
-    'X-Total-Count',
-    'X-Page-Count',
-    'X-Request-ID',
-    ...(Deno.env.get('CORS_EXPOSE_HEADERS') || '').split(',').filter(Boolean)
-  ],
-  credentials: Deno.env.get('CORS_CREDENTIALS') !== 'false',
-  maxAge: parseInt(Deno.env.get('CORS_MAX_AGE') || '86400') // 24 hours by default
+  exposedHeaders: ['X-Total-Count', 'X-Page-Count', 'X-Request-ID'],
+  credentials: true,
+  maxAge: 86400 // 24 hours by default
 };