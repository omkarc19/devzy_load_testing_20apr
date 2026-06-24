import type { NextFunction, Request, Response } from 'express';
import { AppError, ValidationError } from '../utils/errors.js';
import { childLogger } from '../utils/logger.js';

const log = childLogger('http');

interface ErrorBody {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

/**
 * Central error handler. Known {@link AppError}s map to their declared status
 * code; anything else is treated as an unexpected 500 and logged with its
 * stack so the client never sees internal details.
 */
export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  // Express requires the 4-arg signature to recognize this as an error handler.
  _next: NextFunction
): void {
  if (err instanceof AppError) {
    const body: ErrorBody = {
      error: { code: err.code, message: err.message },
    };
    if (err instanceof ValidationError && err.details !== undefined) {
      body.error.details = err.details;
    }
    res.status(err.statusCode).json(body);
    return;
  }

  log.error({ err }, 'unhandled error');
  res.status(500).json({
    error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' },
  });
}

/** Fallback for unmatched routes. */
export function notFoundHandler(_req: Request, res: Response): void {
  res.status(404).json({
    error: { code: 'NOT_FOUND', message: 'Route not found' },
  });
}
