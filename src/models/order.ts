import type { Money } from '../utils/money.js';

/**
 * Lifecycle states an order can move through. Transitions are enforced in
 * {@link ../services/orders.service.ts}.
 */
export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'shipped'
  | 'delivered'
  | 'cancelled';

export const ORDER_STATUSES: readonly OrderStatus[] = [
  'pending',
  'confirmed',
  'shipped',
  'delivered',
  'cancelled',
];

/**
 * Allowed forward transitions. A status maps to the set of states it may move
 * to next. Terminal states map to an empty list.
 */
export const ALLOWED_TRANSITIONS: Record<OrderStatus, readonly OrderStatus[]> = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['shipped', 'cancelled'],
  shipped: ['delivered'],
  delivered: [],
  cancelled: [],
};

export interface OrderItem {
  readonly sku: string;
  readonly name: string;
  readonly quantity: number;
  /** Unit price at the time the order was placed. */
  readonly unitPrice: Money;
}

export interface Order {
  readonly id: string;
  readonly customerId: string;
  readonly status: OrderStatus;
  readonly items: readonly OrderItem[];
  /** Total after discounts. Computed by the pricing service. */
  readonly total: Money;
  /** Whole-number percentage discount applied to the subtotal. */
  readonly discountPercent: number;
  readonly currency: string;
  /** Free-form fulfillment metadata (carrier, tracking, partner fields). */
  readonly metadata?: Record<string, unknown>;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface CreateOrderItemInput {
  sku: string;
  name: string;
  quantity: number;
  unitPriceMinor: number;
}

export interface CreateOrderInput {
  customerId: string;
  items: CreateOrderItemInput[];
  currency?: string;
  discountPercent?: number;
}

export function isTerminalStatus(status: OrderStatus): boolean {
  return ALLOWED_TRANSITIONS[status].length === 0;
}

export function canTransition(from: OrderStatus, to: OrderStatus): boolean {
  return ALLOWED_TRANSITIONS[from].includes(to);
}
