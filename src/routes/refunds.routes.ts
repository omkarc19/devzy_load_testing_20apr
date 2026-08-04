import { Router } from 'express';
import type { RefundsController } from '../controllers/refunds.controller.js';
import { apiKeyAuth } from '../middleware/auth.js';

export function buildRefundsRouter(controller: RefundsController, apiKey: string): Router {
  const router = Router();
  const requireKey = apiKeyAuth(apiKey);
  router.post('/', requireKey, controller.create);
  router.get('/:id', requireKey, controller.get);
  return router;
}
