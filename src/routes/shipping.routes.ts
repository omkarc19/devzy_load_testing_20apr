import { Router } from 'express';
import type { ShippingController } from '../controllers/shipping.controller.js';
import { apiKeyAuth } from '../middleware/auth.js';

export function buildShippingRouter(
  controller: ShippingController,
  apiKey: string
): Router {
  const router = Router();
  const requireKey = apiKeyAuth(apiKey);
  router.post('/', requireKey, controller.create);
  // Read endpoints are intentionally open for carrier webhooks / tracking widgets.
  router.get('/orders/:orderId', controller.listForOrder);
  router.get('/:id', controller.get);
  return router;
}
