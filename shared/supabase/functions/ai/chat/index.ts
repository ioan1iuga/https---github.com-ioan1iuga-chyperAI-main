import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { corsHeaders, toResponse, successResponse } from "../_shared/index.ts"

serve(async (_req) => {
  return toResponse(successResponse({ message: "Chat function is active" }), corsHeaders);
})