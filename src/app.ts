import express, { type Express } from 'express';
import { pinoHttp } from 'pino-http';
import type { AppConfig } from './config/env.js';
import { getLogger } from './utils/logger.js';
import { InMemoryOrdersRepository } from './repositories/orders.repository.js';
import { InventoryService } from './services/inventory.service.js';
import { PricingService } from './services/pricing.service.js';
import { OrdersService } from './services/orders.service.js';
import { OrdersController } from './controllers/orders.controller.js';
import { buildOrdersRouter } from './routes/orders.routes.js';
import { buildHealthRouter } from './routes/health.routes.js';
import { errorHandler, notFoundHandler } from './middleware/error-handler.js';

/**
 * Wires the dependency graph and returns a configured Express app. Kept
 * separate from `index.ts` so tests can construct the app without binding a
 * port.
 */
export function createApp(config: AppConfig): Express {
  const app = express();

  app.use(express.json({ limit: '256kb' }));
  app.use(pinoHttp({ logger: getLogger(config.LOG_LEVEL) }));

  const repository = new InMemoryOrdersRepository();
  const inventory = new InventoryService();
  const pricing = new PricingService();
  const ordersService = new OrdersService({
    repository,
    inventory,
    pricing,
    defaultCurrency: config.DEFAULT_CURRENCY,
    maxOrderItems: config.MAX_ORDER_ITEMS,
  });
  const ordersController = new OrdersController(ordersService);

  app.use('/', buildHealthRouter());
  app.use('/orders', buildOrdersRouter(ordersController, config.API_KEY));

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
