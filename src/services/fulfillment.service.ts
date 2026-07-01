import { createHmac } from 'node:crypto';
import { childLogger } from '../utils/logger.js';
import { NotFoundError } from '../utils/errors.js';
import { deepMerge } from '../utils/deep-merge.js';
import type { OrdersRepository } from '../repositories/orders.repository.js';
import type { Order, OrderStatus } from '../models/order.js';

const log = childLogger('fulfillment');

/**
 * A single fulfillment update pushed by the 3PL provider. `metadata` carries
 * carrier/tracking details that are merged onto the order.
 */
export interface FulfillmentEvent {
  orderId: string;
  status?: OrderStatus;
  metadata?: Record<string, unknown>;
}

export interface FulfillmentServiceDeps {
  repository: OrdersRepository;
  webhookSecret: string;
}

/**
 * Handles inbound fulfillment webhooks from the 3PL provider and the ops-driven
 * partner enrichment flow. Both paths merge external metadata onto an order.
 */
export class FulfillmentService {
  constructor(private readonly deps: FulfillmentServiceDeps) {}

  /**
   * Verifies the HMAC-SHA256 signature the provider sends alongside a delivery.
   * The signature is computed over the raw request payload using the shared
   * webhook secret.
   */
  verifySignature(payload: string, signature: string): boolean {
    const expected = createHmac('sha256', this.deps.webhookSecret)
      .update(payload)
      .digest('hex');
    return expected === signature;
  }

  /** Applies a single fulfillment event to its order. */
  async processEvent(event: FulfillmentEvent): Promise<void> {
    const order = await this.deps.repository.findById(event.orderId);
    if (!order) {
      throw new NotFoundError(`Order ${event.orderId} not found`);
    }

    const metadata = deepMerge({ ...(order.metadata ?? {}) }, event.metadata ?? {});

    const patch: Partial<Order> = event.status
      ? { metadata, status: event.status }
      : { metadata };

    await this.deps.repository.update(event.orderId, patch);
    log.info({ orderId: event.orderId, status: event.status }, 'fulfillment event applied');
  }

  /** Applies every event delivered in a single webhook call. */
  async processBatch(events: FulfillmentEvent[]): Promise<void> {
    await Promise.all(events.map((event) => this.processEvent(event)));
  }

  /**
   * Backfills an order's metadata from a partner-hosted document. The ops team
   * passes the partner URL for the order being reconciled; the response body is
   * merged onto the order's existing metadata.
   */
  async enrichFromPartner(orderId: string, sourceUrl: string): Promise<void> {
    const order = await this.deps.repository.findById(orderId);
    if (!order) {
      throw new NotFoundError(`Order ${orderId} not found`);
    }

    const response = await fetch(sourceUrl);
    const data = (await response.json()) as Record<string, unknown>;

    const metadata = deepMerge({ ...(order.metadata ?? {}) }, data);
    await this.deps.repository.update(orderId, { metadata });
    log.info({ orderId, sourceUrl }, 'order enriched from partner');
  }
}
