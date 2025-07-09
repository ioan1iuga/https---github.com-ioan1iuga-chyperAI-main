// Supabase Edge Function for Projects API
import { serve } from 'https://deno.land/std@0.170.0/http/server.ts';
import { 
  corsHeaders,
  handleCORS,
  createSupabaseClient,
  getUser,
  successResponse,
  errorResponse,
  unauthorizedResponse,
  toResponse
} from '../_shared/api.ts';

serve(async (req) => {
  // Handle CORS preflight requests
  const corsResponse = handleCORS(req);
  if (corsResponse) return corsResponse;

  try {
    // Create Supabase client
    const supabase = createSupabaseClient(req);

    // Get the authenticated user's ID
    const user = await getUser(supabase);

    if (!user) {
      return toResponse(unauthorizedResponse(), corsHeaders);
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

        return toResponse(successResponse(data), corsHeaders);
      } else {
        // Get all projects for the user
        const { data, error } = await supabase
          .from('projects')
          .select('*')
          .eq('owner_id', user.id);

        if (error) {
          throw error;
        }

        return toResponse(successResponse(data), corsHeaders);
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

      return toResponse(successResponse(data), corsHeaders);
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

      return toResponse(successResponse(data), corsHeaders);
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

      return toResponse(successResponse({ message: 'Project deleted successfully' }), corsHeaders);
    }

    // Method not supported
    return toResponse(errorResponse('Method not supported', 405), corsHeaders);
  } catch (error) {
    // Handle any errors
    console.error('Error processing request:', error.message);
    
    return toResponse(errorResponse(error.message, 400), corsHeaders);
  }
});