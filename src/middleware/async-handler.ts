import type { NextFunction, Request, Response, RequestHandler } from 'express';

/**
 * Wraps an async route handler so a rejected promise is forwarded to Express's
 * error middleware instead of producing an unhandled rejection.
 */
export function asyncHandler(
  handler: (req: Request, res: Response, next: NextFunction) => Promise<void>
): RequestHandler {
  return (req, res, next) => {
    handler(req, res, next).catch(next);
  };
}
