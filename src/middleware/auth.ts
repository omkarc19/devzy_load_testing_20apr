import type { NextFunction, Request, Response } from 'express';
import { UnauthorizedError } from '../utils/errors.js';
import { timingSafeEqual } from 'node:crypto';

/**
 * Guards write endpoints with a shared API key supplied in `x-api-key`.
 * Uses a constant-time comparison to avoid leaking the key via timing.
 */
export function apiKeyAuth(expectedKey: string) {
  const expected = Buffer.from(expectedKey);

  return (req: Request, _res: Response, next: NextFunction): void => {
    const provided = req.header('x-api-key') ?? '';
    const providedBuf = Buffer.from(provided);

    if (
      providedBuf.length !== expected.length ||
      !timingSafeEqual(providedBuf, expected)
    ) {
      throw new UnauthorizedError('Missing or invalid API key');
    }

    next();
  };
}
