import { Router } from 'express';
import type { CustomersController } from '../controllers/customers.controller.js';
import { apiKeyAuth } from '../middleware/auth.js';

export function buildCustomersRouter(
  controller: CustomersController,
  apiKey: string
): Router {
  const router = Router();
  const requireKey = apiKeyAuth(apiKey);
  router.post('/', requireKey, controller.register);
  router.get('/search', requireKey, controller.search);
  router.get('/:id', requireKey, controller.get);
  return router;
}
