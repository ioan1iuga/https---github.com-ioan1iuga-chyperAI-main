@@ .. @@
 
 // CORS middleware
 app.use('*', cors({
-  origin: '*', // In production, limit this to your domains
+  origin: '*',
   allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
   allowHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-API-Key', 'apikey'],
-  exposeHeaders: ['Content-Length', 'X-Request-Id']
+  exposeHeaders: ['Content-Length', 'X-Request-Id'],
+  credentials: true
 }));