import type { NextFunction, Request, Response } from 'express';
import { UnauthorizedError } from '../utils/errors.js';

/**
 * Resolves the authenticated customer for self-service order endpoints.
 *
 * The upstream API gateway validates the customer's session and forwards the
 * resolved identity in the `x-customer-id` header. Handlers downstream read
 * `req.customerId` to scope data access to that customer.
 */
export function customerContext() {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const customerId = req.header('x-customer-id')?.trim();
    if (!customerId) {
      throw new UnauthorizedError('Missing customer context');
    }

    req.customerId = customerId;
    next();
  };
}
