/**
 * Validation utilities for serverless functions
 * Used by both Supabase Edge Functions and Cloudflare Pages Functions
 */

/**
 * Validate that required fields are present in an object
 */
export function validateRequiredFields<T extends Record<string, unknown>>(
  data: T,
  requiredFields: string[]
): { valid: boolean; missing: string[] } {
  const missing = requiredFields.filter(field => {
    const value = data[field];
    return value === undefined || value === null || value === '';
  });
  
  return {
    valid: missing.length === 0,
    missing
  };
}

/**
 * Validate an email address
 */
export function validateEmail(email: string): boolean {
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(email);
}

/**
 * Validate a URL
 */
export function validateUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Sanitize an object by removing specified fields
 */
export function sanitizeObject<T extends Record<string, unknown>>(
  obj: T,
  fieldsToRemove: string[]
): Partial<T> {
  const result = { ...obj };
  
  for (const field of fieldsToRemove) {
    delete result[field];
  }
  
  return result;
}

/**
 * Sanitize a string to prevent XSS
 */
export function sanitizeString(str: string): string {
  return str
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}