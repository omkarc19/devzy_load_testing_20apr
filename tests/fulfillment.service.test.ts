import { createHmac } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { FulfillmentService } from '../src/services/fulfillment.service.js';
import { InMemoryOrdersRepository } from '../src/repositories/orders.repository.js';
import { money } from '../src/utils/money.js';

function buildService() {
  const repository = new InMemoryOrdersRepository();
  const service = new FulfillmentService({ repository, webhookSecret: 'test-secret' });
  return { service, repository };
}

async function seedOrder(repository: InMemoryOrdersRepository) {
  return repository.create({
    customerId: 'cust-1',
    status: 'confirmed',
    items: [{ sku: 'SKU-A', name: 'Widget', quantity: 1, unitPrice: money(500, 'USD') }],
    total: money(500, 'USD'),
    discountPercent: 0,
    currency: 'USD',
  });
}

describe('FulfillmentService', () => {
  it('applies status and metadata from a fulfillment event', async () => {
    const { service, repository } = buildService();
    const order = await seedOrder(repository);

    await service.processEvent({
      orderId: order.id,
      status: 'shipped',
      metadata: { carrier: 'UPS', tracking: '1Z999AA' },
    });

    const updated = await repository.findById(order.id);
    expect(updated?.status).toBe('shipped');
    expect(updated?.metadata).toEqual({ carrier: 'UPS', tracking: '1Z999AA' });
  });

  it('accepts a correctly computed HMAC signature', () => {
    const { service } = buildService();
    const payload = JSON.stringify({ events: [] });
    const signature = createHmac('sha256', 'test-secret').update(payload).digest('hex');

    expect(service.verifySignature(payload, signature)).toBe(true);
  });
});
