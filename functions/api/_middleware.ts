/**
 * Cloudflare Workers middleware for API routes
 *
 * Provides:
 * - CORS headers for cross-origin requests
 * - Global error handling with proper JSON responses
 * - Request/response logging
 */

export interface Env {
  DB: D1Database;
}

/**
 * CORS headers configuration
 */
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Max-Age': '86400', // 24 hours
};

/**
 * Add CORS headers to response
 */
function addCorsHeaders(response: Response): Response {
  const newResponse = new Response(response.body, response);
  Object.entries(CORS_HEADERS).forEach(([key, value]) => {
    newResponse.headers.set(key, value);
  });
  return newResponse;
}

/**
 * Handle OPTIONS preflight requests
 */
function handleOptions(): Response {
  return new Response(null, {
    status: 204,
    headers: CORS_HEADERS,
  });
}

/**
 * Error response helper
 */
function errorResponse(status: number, message: string, details?: unknown): Response {
  const body = {
    error: message,
    ...(details && { details }),
  };

  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...CORS_HEADERS,
    },
  });
}

/**
 * Middleware: Handle requests before they reach the handler
 */
export async function onRequest(
  context: EventContext<Env, string, Record<string, unknown>>
): Promise<Response> {
  const { request, next } = context;

  try {
    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return handleOptions();
    }

    // Log incoming request
    console.log(`[${request.method}] ${new URL(request.url).pathname}`);

    // Call next handler in chain
    const response = await next();

    // Add CORS headers to response
    return addCorsHeaders(response);

  } catch (error) {
    // Global error handler
    console.error('Unhandled error in middleware:', error);

    // Determine error type and status
    let status = 500;
    let message = 'Internal server error';
    let details: unknown = undefined;

    if (error instanceof Error) {
      message = error.message;
      details = {
        name: error.name,
        stack: error.stack?.split('\n').slice(0, 3), // First 3 lines of stack
      };

      // Classify common error types
      if (error.message.includes('not found')) {
        status = 404;
      } else if (error.message.includes('unauthorized') || error.message.includes('forbidden')) {
        status = 403;
      } else if (error.message.includes('bad request') || error.message.includes('invalid')) {
        status = 400;
      }
    }

    return errorResponse(status, message, details);
  }
}
