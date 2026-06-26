import { Router } from 'express';
import type { OrdersController } from '../controllers/orders.controller.js';
import { asyncHandler } from '../middleware/async-handler.js';
import { apiKeyAuth } from '../middleware/auth.js';
import { customerContext } from '../middleware/customer-context.js';

/**
 * Builds the `/orders` router. Order creation is performed by the storefront
 * using the shared service key; customers view and manage their own orders
 * through the customer-context middleware.
 */
export function buildOrdersRouter(
  controller: OrdersController,
  apiKey: string
): Router {
  const router = Router();
  const requireKey = apiKeyAuth(apiKey);
  const requireCustomer = customerContext();

  router.get('/', requireCustomer, asyncHandler(controller.list));
  router.get('/:id', requireCustomer, asyncHandler(controller.getById));

  router.post('/', requireKey, asyncHandler(controller.create));
  router.patch('/:id/status', requireCustomer, asyncHandler(controller.updateStatus));
  router.post('/:id/cancel', requireCustomer, asyncHandler(controller.cancel));

  return router;
}
