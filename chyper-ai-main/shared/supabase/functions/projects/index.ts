// Supabase Edge Function for Projects API
import { serve } from 'https://deno.land/std@0.170.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// CORS headers for all responses
const corsHeaders = {
  'Access-Control-Allow-Origin': Deno.env.get('CORS_ALLOW_ORIGIN') || '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: corsHeaders,
      status: 204,
    });
  }

  try {
    // Create Supabase client using the request's authorization header
    const authorization = req.headers.get('Authorization');
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: { headers: { Authorization: authorization ?? '' } },
        auth: { persistSession: false },
      }
    );

    // Get the authenticated user's ID
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Unauthorized',
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401,
      });
    }

    const url = new URL(req.url);
    const pathParts = url.pathname.split('/');
    const projectId = pathParts[pathParts.length - 1];
    const isProjectIdRequest = projectId && projectId !== 'projects';

    // Handle different HTTP methods
    if (req.method === 'GET') {
      if (isProjectIdRequest) {
        // Get specific project by ID
        const { data, error } = await supabase
          .from('projects')
          .select('*')
          .eq('id', projectId)
          .eq('owner_id', user.id)
          .single();

        if (error) {
          throw error;
        }

        return new Response(JSON.stringify({
          success: true,
          data,
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      } else {
        // Get all projects for the user
        const { data, error } = await supabase
          .from('projects')
          .select('*')
          .eq('owner_id', user.id);

        if (error) {
          throw error;
        }

        return new Response(JSON.stringify({
          success: true,
          data,
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    } else if (req.method === 'POST') {
      // Create a new project
      const projectData = await req.json();
      
      const { data, error } = await supabase
        .from('projects')
        .insert({
          name: projectData.name,
          description: projectData.description,
          framework: projectData.framework || 'React',
          status: 'active',
          owner_id: user.id,
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      return new Response(JSON.stringify({
        success: true,
        data,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 201,
      });
    } else if (req.method === 'PUT' && isProjectIdRequest) {
      // Update existing project
      const projectData = await req.json();
      
      const { data, error } = await supabase
        .from('projects')
        .update(projectData)
        .eq('id', projectId)
        .eq('owner_id', user.id)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return new Response(JSON.stringify({
        success: true,
        data,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } else if (req.method === 'DELETE' && isProjectIdRequest) {
      // Delete a project
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', projectId)
        .eq('owner_id', user.id);

      if (error) {
        throw error;
      }

      return new Response(JSON.stringify({
        success: true,
        message: 'Project deleted successfully',
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Method not supported
    return new Response(JSON.stringify({
      success: false,
      error: 'Method not supported',
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 405,
    });
  } catch (error) {
    // Handle any errors
    console.error('Error processing request:', error.message);
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});