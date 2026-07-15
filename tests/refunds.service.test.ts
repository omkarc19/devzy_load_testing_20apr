import { describe, expect, it } from 'vitest';
import { RefundsService } from '../src/services/refunds.service.js';
import { InMemoryRefundsRepository } from '../src/repositories/refunds.repository.js';
import { InMemoryOrdersRepository } from '../src/repositories/orders.repository.js';
import { InMemoryAuditRepository } from '../src/repositories/audit.repository.js';
import { money } from '../src/utils/money.js';

describe('RefundsService', () => {
  it('issues a refund for a delivered order', async () => {
    const orders = new InMemoryOrdersRepository();
    const order = await orders.create({
      customerId: 'cust-a',
      status: 'delivered',
      items: [],
      total: money(1500, 'USD'),
      discountPercent: 0,
      currency: 'USD',
    });

    const service = new RefundsService(
      new InMemoryRefundsRepository(),
      orders,
      new InMemoryAuditRepository()
    );

    const refund = await service.createRefund({
      orderId: order.id,
      customerId: 'cust-a',
      reason: 'damaged item',
    });

    expect(refund.status).toBe('completed');
    expect(refund.amount.amountMinor).toBe(1500);
  });
});
