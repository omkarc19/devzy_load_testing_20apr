import { childLogger } from '../utils/logger.js';
import { InsufficientStockError } from '../utils/errors.js';
import type { CreateOrderItemInput } from '../models/order.js';

const log = childLogger('inventory');

/**
 * Tracks available stock per SKU. In a production service this would call an
 * inventory micro-service; here it is an in-memory ledger seeded with demo
 * data so the order flow is self-contained.
 */
export class InventoryService {
  private readonly stock: Map<string, number>;

  constructor(seed: Record<string, number> = DEFAULT_STOCK) {
    this.stock = new Map(Object.entries(seed));
  }

  available(sku: string): number {
    return this.stock.get(sku) ?? 0;
  }

  /**
   * Verifies every requested item can be fulfilled. Throws on the first SKU
   * that lacks stock so the caller never partially reserves an order.
   */
  assertAvailable(items: readonly CreateOrderItemInput[]): void {
    for (const item of items) {
      const have = this.available(item.sku);
      if (have < item.quantity) {
        throw new InsufficientStockError(item.sku, item.quantity, have);
      }
    }
  }

  /**
   * Decrements stock for each item. Assumes {@link assertAvailable} has already
   * passed for this set of items.
   */
  reserve(items: readonly CreateOrderItemInput[]): void {
    for (const item of items) {
      const remaining = this.available(item.sku) - item.quantity;
      this.stock.set(item.sku, remaining);
      log.debug({ sku: item.sku, remaining }, 'reserved stock');
    }
  }

  /** Returns reserved units to stock, used when an order is cancelled. */
  release(items: readonly { sku: string; quantity: number }[]): void {
    for (const item of items) {
      this.stock.set(item.sku, this.available(item.sku) + item.quantity);
      log.debug({ sku: item.sku }, 'released stock');
    }
  }
}

const DEFAULT_STOCK: Record<string, number> = {
  'SKU-WIDGET': 120,
  'SKU-GADGET': 80,
  'SKU-GIZMO': 40,
  'SKU-DOODAD': 200,
};
