import { Context, MiddlewareHandler, Next } from 'hono';
import { ContentfulStatusCode } from 'hono/utils/http-status';

/**
 * Middleware for handling errors in API routes
 */
export const errorHandler = (): MiddlewareHandler => {
  return async (c: Context, next: Next) => {
    try {
      await next();
    } catch (error) {
      console.error('API Error:', error);
      
      // Determine status code based on error type
      let status = 500;
      if (error instanceof Error && (error.message === 'Transaction not found' || error.message.includes('not found'))) {
        status = 404;
      } else if (error instanceof Error && (error.message.includes('Invalid') || error.message.includes('Bad request'))) {
        status = 400;
      } else if (error instanceof Error && (error.message.includes('Unauthorized') || error.message.includes('Authentication'))) {
        status = 401;
      } else if (error instanceof Error && (error.message.includes('Forbidden') || error.message.includes('Permission'))) {
        status = 403;
      }
      
      // Send error response
      return c.json({
        success: false,
        error: error instanceof Error ? error.message : 'Internal Server Error',
        status
      }, status as ContentfulStatusCode);
    }
  };
}; 