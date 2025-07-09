@@ .. @@
 
 // CORS headers for all responses
 export const corsHeaders = {
-  'Access-Control-Allow-Origin': '*',
+  'Access-Control-Allow-Origin': '*', 
   'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
-  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
+  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS, PATCH',
+  'Access-Control-Allow-Credentials': 'true',
+  'Access-Control-Max-Age': '86400'
 };