// Proxy function for Supabase API requests
// This function forwards requests to Supabase while adding authentication headers

export async function onRequest(context) {
  // Extract path without the /supabase prefix
  const url = new URL(context.request.url);
  const path = url.pathname.replace(/^\/supabase/, '');
  
  // Get the Supabase URL and key from environment variables
  const supabaseUrl = context.env.SUPABASE_URL || 'https://your-project.supabase.co';
  const supabaseKey = context.env.SUPABASE_ANON_KEY || '';
  
  if (!supabaseUrl || !supabaseKey) {
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Supabase configuration is missing'
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
  }
  
  // Build the target URL
  const targetUrl = `${supabaseUrl}${path}${url.search}`;
  
  try {
    // Create a new request with the same method, headers, and body
    const newRequest = new Request(targetUrl, {
      method: context.request.method,
      headers: new Headers(context.request.headers),
      body: context.request.body,
      redirect: 'follow'
    });
    
    // Add Supabase authentication headers
    newRequest.headers.set('apikey', supabaseKey);
    
    // Forward the Authorization header if it exists
    const authHeader = context.request.headers.get('Authorization');
    if (authHeader) {
      newRequest.headers.set('Authorization', authHeader);
    }
    
    // Make the request to Supabase
    const response = await fetch(newRequest);
    
    // Create a new response with the Supabase response
    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: response.headers
    });
  } catch (error) {
    // Handle errors
    return new Response(
      JSON.stringify({
        success: false,
        error: `Error proxying to Supabase: ${error.message}`
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
  }
}