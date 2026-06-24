import { Router } from 'express';
import type { OrdersController } from '../controllers/orders.controller.js';
import { asyncHandler } from '../middleware/async-handler.js';
import { apiKeyAuth } from '../middleware/auth.js';

/**
 * Builds the `/orders` router. Read endpoints are public; write endpoints are
 * guarded by the API-key middleware.
 */
export function buildOrdersRouter(
  controller: OrdersController,
  apiKey: string
): Router {
  const router = Router();
  const requireKey = apiKeyAuth(apiKey);

  router.get('/', asyncHandler(controller.list));
  router.get('/:id', asyncHandler(controller.getById));

  router.post('/', requireKey, asyncHandler(controller.create));
  router.patch('/:id/status', requireKey, asyncHandler(controller.updateStatus));
  router.post('/:id/cancel', requireKey, asyncHandler(controller.cancel));

  return router;
}
