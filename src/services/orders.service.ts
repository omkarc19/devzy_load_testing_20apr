import { childLogger } from '../utils/logger.js';
import { ConflictError, NotFoundError, ValidationError } from '../utils/errors.js';
import {
  canTransition,
  isTerminalStatus,
  type CreateOrderInput,
  type Order,
  type OrderItem,
  type OrderStatus,
} from '../models/order.js';
import { money } from '../utils/money.js';
import type { OrdersRepository, ListOrdersFilter } from '../repositories/orders.repository.js';
import type { InventoryService } from './inventory.service.js';
import type { PricingService } from './pricing.service.js';

const log = childLogger('orders');

export interface OrdersServiceDeps {
  repository: OrdersRepository;
  inventory: InventoryService;
  pricing: PricingService;
  defaultCurrency: string;
  maxOrderItems: number;
}

/**
 * Orchestrates the order lifecycle: validates input, checks and reserves
 * inventory, prices the order, and enforces status-transition rules.
 */
export class OrdersService {
  constructor(private readonly deps: OrdersServiceDeps) {}

  async createOrder(input: CreateOrderInput): Promise<Order> {
    const currency = (input.currency ?? this.deps.defaultCurrency).toUpperCase();

    if (input.items.length > this.deps.maxOrderItems) {
      throw new ValidationError(
        `An order may contain at most ${this.deps.maxOrderItems} items`
      );
    }

    this.assertNoDuplicateSkus(input.items.map((i) => i.sku));

    // Reserve stock only after confirming everything is available, so a
    // failure midway never leaves a partially reserved order.
    this.deps.inventory.assertAvailable(input.items);
    this.deps.inventory.reserve(input.items);

    const { total } = this.deps.pricing.price(
      input.items,
      currency,
      input.discountPercent ?? 0
    );

    const items: OrderItem[] = input.items.map((i) => ({
      sku: i.sku,
      name: i.name,
      quantity: i.quantity,
      unitPrice: money(i.unitPriceMinor, currency),
    }));

    const order = await this.deps.repository.create({
      customerId: input.customerId,
      status: 'pending',
      items,
      total,
      discountPercent: input.discountPercent ?? 0,
      currency,
    });

    log.info({ orderId: order.id, total: total.amountMinor }, 'order created');
    return order;
  }

  async getOrder(id: string): Promise<Order> {
    const order = await this.deps.repository.findById(id);
    if (!order) {
      throw new NotFoundError(`Order ${id} not found`);
    }
    return order;
  }

  async listOrders(filter: ListOrdersFilter): Promise<{ orders: Order[]; total: number }> {
    return this.deps.repository.list(filter);
  }

  async updateStatus(id: string, next: OrderStatus): Promise<Order> {
    const order = await this.getOrder(id);

    if (order.status === next) {
      return order;
    }

    if (!canTransition(order.status, next)) {
      throw new ConflictError(
        `Illegal status transition: ${order.status} -> ${next}`
      );
    }

    if (next === 'cancelled') {
      this.deps.inventory.release(
        order.items.map((i) => ({ sku: i.sku, quantity: i.quantity }))
      );
    }

    const updated = await this.deps.repository.update(id, { status: next });
    log.info({ orderId: id, from: order.status, to: next }, 'order status changed');
    return updated;
  }

  async cancelOrder(id: string): Promise<Order> {
    const order = await this.getOrder(id);
    if (isTerminalStatus(order.status)) {
      throw new ConflictError(
        `Order ${id} is already ${order.status} and cannot be cancelled`
      );
    }
    return this.updateStatus(id, 'cancelled');
  }

  private assertNoDuplicateSkus(skus: string[]): void {
    const seen = new Set<string>();
    for (const sku of skus) {
      if (seen.has(sku)) {
        throw new ValidationError(`Duplicate SKU in order: ${sku}`);
      }
      seen.add(sku);
    }
  }
}
