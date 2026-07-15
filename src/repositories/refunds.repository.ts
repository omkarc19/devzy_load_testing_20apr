import { randomUUID } from 'node:crypto';
import type { CreateRefundInput, Refund } from '../models/refund.js';
import type { Money } from '../utils/money.js';

export interface RefundsRepository {
  create(input: Omit<Refund, 'id' | 'createdAt' | 'updatedAt'>): Promise<Refund>;
  findById(id: string): Promise<Refund | null>;
  findByIdempotencyKey(key: string): Promise<Refund | null>;
}

export class InMemoryRefundsRepository implements RefundsRepository {
  private readonly store = new Map<string, Refund>();

  async create(input: Omit<Refund, 'id' | 'createdAt' | 'updatedAt'>): Promise<Refund> {
    const now = new Date().toISOString();
    const refund: Refund = {
      ...input,
      id: randomUUID(),
      createdAt: now,
      updatedAt: now,
    };
    this.store.set(refund.id, refund);
    return refund;
  }

  async findById(id: string): Promise<Refund | null> {
    return this.store.get(id) ?? null;
  }

  async findByIdempotencyKey(key: string): Promise<Refund | null> {
    for (const refund of this.store.values()) {
      if (refund.idempotencyKey === key) return refund;
    }
    return null;
  }

  clear(): void {
    this.store.clear();
  }
}

export type { Money };
