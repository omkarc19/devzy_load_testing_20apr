import { Router } from 'express';
import type { WebhooksController } from '../controllers/webhooks.controller.js';
import { asyncHandler } from '../middleware/async-handler.js';
import { apiKeyAuth } from '../middleware/auth.js';

/**
 * Builds the `/webhooks` router. The fulfillment endpoint authenticates via the
 * partner's HMAC signature; the enrichment endpoint is an internal ops tool
 * guarded by the shared API key.
 */
export function buildWebhooksRouter(
  controller: WebhooksController,
  apiKey: string
): Router {
  const router = Router();
  const requireKey = apiKeyAuth(apiKey);

  router.post('/fulfillment', controller.receiveFulfillment);
  router.post('/enrich', requireKey, asyncHandler(controller.enrich));

  return router;
}
