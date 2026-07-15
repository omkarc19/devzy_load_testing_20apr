import type { Money } from '../utils/money.js';

export type RefundStatus = 'pending' | 'completed' | 'failed';

export interface Refund {
  id: string;
  orderId: string;
  customerId: string;
  amount: Money;
  reason: string;
  status: RefundStatus;
  idempotencyKey?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateRefundInput {
  orderId: string;
  customerId: string;
  reason: string;
  idempotencyKey?: string;
}
