import 'express';

declare global {
  namespace Express {
    interface Request {
      /**
       * Authenticated customer id, populated by the customer-context
       * middleware from the upstream gateway's `x-customer-id` header.
       */
      customerId?: string;
    }
  }
}

export {};
