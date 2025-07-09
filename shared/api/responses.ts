/**
 * Standardized API response utilities for serverless functions
 * Used by both Supabase Edge Functions and Cloudflare Pages Functions
 */

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  status?: number;
}

/**
 * Create a successful API response
 */
export function successResponse<T = unknown>(data: T, message?: string): ApiResponse<T> {
  return {
    success: true,
    data,
    message,
    status: 200
  };
}

/**
 * Create an error API response
 */
export function errorResponse(error: string | Error, status: number = 400): ApiResponse {
  return {
    success: false,
    error: error instanceof Error ? error.message : error,
    status
  };
}

/**
 * Create a not found API response
 */
export function notFoundResponse(resource: string): ApiResponse {
  return {
    success: false,
    error: `${resource} not found`,
    status: 404
  };
}

/**
 * Create an unauthorized API response
 */
export function unauthorizedResponse(message: string = 'Unauthorized'): ApiResponse {
  return {
    success: false,
    error: message,
    status: 401
  };
}

/**
 * Create a forbidden API response
 */
export function forbiddenResponse(message: string = 'Forbidden'): ApiResponse {
  return {
    success: false,
    error: message,
    status: 403
  };
}

/**
 * Create a validation error API response
 */
export function validationErrorResponse(errors: Record<string, string>): ApiResponse {
  return {
    success: false,
    error: 'Validation failed',
    data: { errors },
    status: 422
  };
}

/**
 * Convert an API response to a Response object
 */
export function toResponse<T>(apiResponse: ApiResponse<T>, headers: Record<string, string> = {}): Response {
  return new Response(
    JSON.stringify(apiResponse),
    {
      status: apiResponse.status || (apiResponse.success ? 200 : 400),
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    }
  );
}