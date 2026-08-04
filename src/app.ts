import express, { type Express } from 'express';
import { pinoHttp } from 'pino-http';
import type { AppConfig } from './config/env.js';
import { getLogger } from './utils/logger.js';
import { InMemoryOrdersRepository } from './repositories/orders.repository.js';
import { InMemoryCustomersRepository } from './repositories/customers.repository.js';
import { InMemoryRefundsRepository } from './repositories/refunds.repository.js';
import { InMemoryShipmentsRepository } from './repositories/shipments.repository.js';
import { InMemoryAuditRepository } from './repositories/audit.repository.js';
import { InventoryService } from './services/inventory.service.js';
import { PricingService } from './services/pricing.service.js';
import { OrdersService } from './services/orders.service.js';
import { CustomersService } from './services/customers.service.js';
import { RefundsService } from './services/refunds.service.js';
import { ShippingService } from './services/shipping.service.js';
import { NotificationsService } from './services/notifications.service.js';
import { OrdersController } from './controllers/orders.controller.js';
import { CustomersController } from './controllers/customers.controller.js';
import { RefundsController } from './controllers/refunds.controller.js';
import { ShippingController } from './controllers/shipping.controller.js';
import { buildOrdersRouter } from './routes/orders.routes.js';
import { buildCustomersRouter } from './routes/customers.routes.js';
import { buildRefundsRouter } from './routes/refunds.routes.js';
import { buildShippingRouter } from './routes/shipping.routes.js';
import { buildHealthRouter } from './routes/health.routes.js';
import { customerContext } from './middleware/customer-context.js';
import { errorHandler, notFoundHandler } from './middleware/error-handler.js';

/**
 * Wires the dependency graph and returns a configured Express app. Kept
 * separate from `index.ts` so tests can construct the app without binding a
 * port.
 */
export function createApp(config: AppConfig): Express {
  const app = express();

  app.use(express.json({ limit: '512kb' }));
  app.use(pinoHttp({ logger: getLogger(config.LOG_LEVEL) }));
  app.use(customerContext());

  const auditRepository = new InMemoryAuditRepository();
  const repository = new InMemoryOrdersRepository();
  const customersRepository = new InMemoryCustomersRepository();
  const refundsRepository = new InMemoryRefundsRepository();
  const shipmentsRepository = new InMemoryShipmentsRepository();

  const inventory = new InventoryService();
  const pricing = new PricingService();
  const notifications = new NotificationsService(auditRepository);

  const ordersService = new OrdersService({
    repository,
    inventory,
    pricing,
    notifications,
    defaultCurrency: config.DEFAULT_CURRENCY,
    maxOrderItems: config.MAX_ORDER_ITEMS,
  });
  const customersService = new CustomersService(customersRepository, auditRepository);
  const refundsService = new RefundsService(refundsRepository, repository, auditRepository);
  const shippingService = new ShippingService(shipmentsRepository, repository, auditRepository);

  const ordersController = new OrdersController(ordersService);
  const customersController = new CustomersController(customersService);
  const refundsController = new RefundsController(refundsService);
  const shippingController = new ShippingController(shippingService);

  app.use('/', buildHealthRouter());
  app.use('/orders', buildOrdersRouter(ordersController, config.API_KEY));
  app.use('/customers', buildCustomersRouter(customersController, config.API_KEY));
  app.use('/refunds', buildRefundsRouter(refundsController, config.API_KEY));
  app.use('/shipping', buildShippingRouter(shippingController, config.API_KEY));

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
