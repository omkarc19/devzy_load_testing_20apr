import { describe, expect, it } from 'vitest';
import {
  add,
  applyPercentDiscount,
  format,
  money,
  multiply,
  sum,
  zero,
} from '../src/utils/money.js';

describe('money', () => {
  it('rejects non-integer amounts', () => {
    expect(() => money(10.5, 'USD')).toThrow(RangeError);
  });

  it('uppercases the currency code', () => {
    expect(money(100, 'usd').currency).toBe('USD');
  });

  it('adds amounts in the same currency', () => {
    expect(add(money(150, 'USD'), money(250, 'USD'))).toEqual(money(400, 'USD'));
  });

  it('throws on currency mismatch', () => {
    expect(() => add(money(100, 'USD'), money(100, 'EUR'))).toThrow(/mismatch/);
  });

  it('multiplies by a quantity', () => {
    expect(multiply(money(99, 'USD'), 3)).toEqual(money(297, 'USD'));
  });

  it('rejects negative quantities', () => {
    expect(() => multiply(money(99, 'USD'), -1)).toThrow(RangeError);
  });

  it('applies a percentage discount with rounding', () => {
    // 15% of 999 = 149.85 -> rounds to 150
    expect(applyPercentDiscount(money(999, 'USD'), 15)).toEqual(money(150, 'USD'));
  });

  it('rejects out-of-range discounts', () => {
    expect(() => applyPercentDiscount(money(100, 'USD'), 150)).toThrow(RangeError);
  });

  it('sums a list of money', () => {
    const total = sum([money(100, 'USD'), money(200, 'USD'), money(50, 'USD')], 'USD');
    expect(total).toEqual(money(350, 'USD'));
  });

  it('returns zero for an empty list', () => {
    expect(sum([], 'EUR')).toEqual(zero('EUR'));
  });

  it('formats for display', () => {
    expect(format(money(1299, 'USD'))).toBe('12.99 USD');
  });
});
