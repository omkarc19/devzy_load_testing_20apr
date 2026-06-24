import {
  add,
  applyPercentDiscount,
  money,
  multiply,
  zero,
  type Money,
} from '../utils/money.js';
import type { CreateOrderItemInput } from '../models/order.js';

export interface PricedTotals {
  subtotal: Money;
  total: Money;
}

/**
 * Computes order totals. Pricing is deliberately simple: subtotal is the sum
 * of line items, then a single whole-order percentage discount is applied.
 */
export class PricingService {
  /**
   * @param items   line items to price
   * @param currency ISO 4217 code the order is denominated in
   * @param discountPercent whole-number percentage discount (0–100)
   */
  price(
    items: readonly CreateOrderItemInput[],
    currency: string,
    discountPercent = 0
  ): PricedTotals {
    let subtotal = zero(currency);
    for (const item of items) {
      const line = multiply(money(item.unitPriceMinor, currency), item.quantity);
      subtotal = add(subtotal, line);
    }

    const total =
      discountPercent > 0
        ? applyPercentDiscount(subtotal, discountPercent)
        : subtotal;

    return { subtotal, total };
  }
}
