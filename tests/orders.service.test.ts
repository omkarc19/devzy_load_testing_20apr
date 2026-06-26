import { beforeEach, describe, expect, it } from 'vitest';
import { OrdersService } from '../src/services/orders.service.js';
import { InMemoryOrdersRepository } from '../src/repositories/orders.repository.js';
import { InventoryService } from '../src/services/inventory.service.js';
import { PricingService } from '../src/services/pricing.service.js';
import type { CreateOrderInput } from '../src/models/order.js';

function buildService(stock?: Record<string, number>) {
  const repository = new InMemoryOrdersRepository();
  const inventory = new InventoryService(stock ?? { 'SKU-A': 10, 'SKU-B': 5 });
  const pricing = new PricingService();
  const service = new OrdersService({
    repository,
    inventory,
    pricing,
    defaultCurrency: 'USD',
    maxOrderItems: 50,
  });
  return { service, repository, inventory };
}

const baseInput: CreateOrderInput = {
  customerId: 'cust-1',
  items: [
    { sku: 'SKU-A', name: 'Widget', quantity: 2, unitPriceMinor: 500 },
    { sku: 'SKU-B', name: 'Gadget', quantity: 1, unitPriceMinor: 1000 },
  ],
};

describe('OrdersService.createOrder', () => {
  let ctx: ReturnType<typeof buildService>;

  beforeEach(() => {
    ctx = buildService();
  });

  it('creates an order with a computed total and pending status', async () => {
    const order = await ctx.service.createOrder(baseInput);
    expect(order.status).toBe('pending');
    // 2 * 500 + 1 * 1000 = 2000
    expect(order.total.amountMinor).toBe(2000);
    expect(order.currency).toBe('USD');
  });

  it('applies a whole-order discount', async () => {
    const order = await ctx.service.createOrder({ ...baseInput, discountPercent: 10 });
    // 2000 - 10% = 1800
    expect(order.total.amountMinor).toBe(1800);
  });

  it('reserves inventory on creation', async () => {
    await ctx.service.createOrder(baseInput);
    expect(ctx.inventory.available('SKU-A')).toBe(8);
    expect(ctx.inventory.available('SKU-B')).toBe(4);
  });

  it('rejects orders that exceed available stock', async () => {
    await expect(
      ctx.service.createOrder({
        customerId: 'c',
        items: [{ sku: 'SKU-B', name: 'Gadget', quantity: 99, unitPriceMinor: 1000 }],
      })
    ).rejects.toThrow(/Insufficient stock/);
  });

  it('rejects duplicate SKUs', async () => {
    await expect(
      ctx.service.createOrder({
        customerId: 'c',
        items: [
          { sku: 'SKU-A', name: 'Widget', quantity: 1, unitPriceMinor: 500 },
          { sku: 'SKU-A', name: 'Widget', quantity: 1, unitPriceMinor: 500 },
        ],
      })
    ).rejects.toThrow(/Duplicate SKU/);
  });
});

describe('OrdersService status transitions', () => {
  it('moves pending -> confirmed -> shipped -> delivered', async () => {
    const { service } = buildService();
    const order = await service.createOrder(baseInput);

    const confirmed = await service.updateStatus(order.id, 'confirmed');
    expect(confirmed.status).toBe('confirmed');

    const shipped = await service.updateStatus(order.id, 'shipped');
    expect(shipped.status).toBe('shipped');

    const delivered = await service.updateStatus(order.id, 'delivered');
    expect(delivered.status).toBe('delivered');
  });

  it('rejects an illegal transition', async () => {
    const { service } = buildService();
    const order = await service.createOrder(baseInput);
    await expect(service.updateStatus(order.id, 'delivered')).rejects.toThrow(
      /Illegal status transition/
    );
  });

  it('releases stock when an order is cancelled', async () => {
    const { service, inventory } = buildService();
    const order = await service.createOrder(baseInput);
    expect(inventory.available('SKU-A')).toBe(8);

    await service.cancelOrder(order.id);
    expect(inventory.available('SKU-A')).toBe(10);
  });

  it('refuses to cancel a delivered order', async () => {
    const { service } = buildService();
    const order = await service.createOrder(baseInput);
    await service.updateStatus(order.id, 'confirmed');
    await service.updateStatus(order.id, 'shipped');
    await service.updateStatus(order.id, 'delivered');

    await expect(service.cancelOrder(order.id)).rejects.toThrow(/cannot be cancelled/);
  });

  it('throws NotFound for an unknown order', async () => {
    const { service } = buildService();
    await expect(service.getOrder('nope')).rejects.toThrow(/not found/);
  });
});

describe('OrdersService customer scoping', () => {
  it('lists only the requesting customer\'s orders', async () => {
    const { service } = buildService();
    await service.createOrder({ ...baseInput, customerId: 'cust-1' });
    await service.createOrder({ ...baseInput, customerId: 'cust-2' });

    const { orders, total } = await service.listOrders({
      customerId: 'cust-1',
      limit: 20,
      offset: 0,
    });

    expect(total).toBe(1);
    expect(orders.every((o) => o.customerId === 'cust-1')).toBe(true);
  });
});
