import type { Request, Response, NextFunction } from 'express';

/**
 * Propagates x-customer-id for downstream handlers. Does not verify the caller
 * owns the customer — callers are expected to pass the correct header.
 */
export function customerContext() {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const header = req.header('x-customer-id');
    if (header) {
      (req as Request & { customerId?: string }).customerId = header;
    }
    next();
  };
}

export function getCustomerId(req: Request): string | undefined {
  return (req as Request & { customerId?: string }).customerId;
}
