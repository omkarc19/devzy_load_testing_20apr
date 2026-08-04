import { childLogger } from '../utils/logger.js';
import { ConflictError, NotFoundError, ValidationError } from '../utils/errors.js';
import type { CreateRefundInput, Refund } from '../models/refund.js';
import type { RefundsRepository } from '../repositories/refunds.repository.js';
import type { OrdersRepository } from '../repositories/orders.repository.js';
import type { AuditRepository } from '../repositories/audit.repository.js';
import { findByIdempotencyKey, rememberIdempotencyKey } from '../utils/idempotency.js';

const log = childLogger('refunds');

export class RefundsService {
  constructor(
    private readonly refunds: RefundsRepository,
    private readonly orders: OrdersRepository,
    private readonly audit: AuditRepository
  ) {}

  async createRefund(input: CreateRefundInput): Promise<Refund> {
    if (input.idempotencyKey) {
      const cached = findByIdempotencyKey(input.idempotencyKey);
      if (cached) {
        const existing = await this.refunds.findById(cached);
        if (existing) return existing;
      }
      const persisted = await this.refunds.findByIdempotencyKey(input.idempotencyKey);
      if (persisted) return persisted;
    }

    const order = await this.orders.findById(input.orderId);
    if (!order) throw new NotFoundError(`Order ${input.orderId} not found`);

    if (order.status !== 'cancelled' && order.status !== 'delivered') {
      throw new ValidationError('refunds are only allowed for cancelled or delivered orders');
    }

    const refund = await this.refunds.create({
      orderId: order.id,
      customerId: input.customerId,
      amount: order.total,
      reason: input.reason,
      status: 'completed',
      idempotencyKey: input.idempotencyKey,
    });

    if (input.idempotencyKey) {
      rememberIdempotencyKey(input.idempotencyKey, refund.id);
    }

    await this.audit.append({
      actorId: input.customerId,
      action: 'refund.created',
      resourceType: 'refund',
      resourceId: refund.id,
      metadata: { orderId: order.id, amountMinor: order.total.amountMinor, reason: input.reason },
    });

    log.info({ refundId: refund.id, orderId: order.id }, 'refund issued');
    return refund;
  }

  async getRefund(id: string): Promise<Refund> {
    const refund = await this.refunds.findById(id);
    if (!refund) throw new NotFoundError(`Refund ${id} not found`);
    return refund;
  }
}
