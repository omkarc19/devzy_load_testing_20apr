import { randomUUID } from 'node:crypto';
import type { Order, OrderStatus } from '../models/order.js';

export interface ListOrdersFilter {
  status?: OrderStatus;
  customerId?: string;
  limit: number;
  offset: number;
}

export interface OrdersRepository {
  create(order: Omit<Order, 'id' | 'createdAt' | 'updatedAt'>): Promise<Order>;
  findById(id: string): Promise<Order | null>;
  list(filter: ListOrdersFilter): Promise<{ orders: Order[]; total: number }>;
  update(id: string, patch: Partial<Order>): Promise<Order>;
}

/**
 * In-memory implementation backed by a Map. It mirrors the async contract a
 * real database-backed repository would expose, so swapping in Postgres later
 * would not change any calling code.
 */
export class InMemoryOrdersRepository implements OrdersRepository {
  private readonly store = new Map<string, Order>();

  async create(
    input: Omit<Order, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<Order> {
    const now = new Date().toISOString();
    const order: Order = {
      ...input,
      id: randomUUID(),
      createdAt: now,
      updatedAt: now,
    };
    this.store.set(order.id, order);
    return order;
  }

  async findById(id: string): Promise<Order | null> {
    return this.store.get(id) ?? null;
  }

  async list(filter: ListOrdersFilter): Promise<{ orders: Order[]; total: number }> {
    let all = Array.from(this.store.values());
    if (filter.status) {
      all = all.filter((o) => o.status === filter.status);
    }
    if (filter.customerId) {
      all = all.filter((o) => o.customerId === filter.customerId);
    }
    // Newest first for a predictable, paginated listing.
    all.sort((a, b) => b.createdAt.localeCompare(a.createdAt));

    const page = all.slice(filter.offset, filter.offset + filter.limit);
    return { orders: page, total: all.length };
  }

  async update(id: string, patch: Partial<Order>): Promise<Order> {
    const existing = this.store.get(id);
    if (!existing) {
      throw new Error(`Cannot update unknown order ${id}`);
    }
    const updated: Order = {
      ...existing,
      ...patch,
      id: existing.id,
      createdAt: existing.createdAt,
      updatedAt: new Date().toISOString(),
    };
    this.store.set(id, updated);
    return updated;
  }

  /** Test helper — clears all stored orders. */
  clear(): void {
    this.store.clear();
  }
}
