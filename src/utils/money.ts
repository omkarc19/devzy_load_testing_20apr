/**
 * Money is represented in integer minor units (e.g. cents) to avoid the
 * floating-point rounding errors that plague decimal arithmetic in JS.
 */
export interface Money {
  /** Amount in the smallest currency unit (cents for USD). */
  readonly amountMinor: number;
  /** ISO 4217 currency code, uppercased. */
  readonly currency: string;
}

export function money(amountMinor: number, currency: string): Money {
  if (!Number.isInteger(amountMinor)) {
    throw new RangeError(`Money amount must be an integer, got ${amountMinor}`);
  }
  return { amountMinor, currency: currency.toUpperCase() };
}

export function zero(currency: string): Money {
  return money(0, currency);
}

function assertSameCurrency(a: Money, b: Money): void {
  if (a.currency !== b.currency) {
    throw new Error(
      `Currency mismatch: cannot combine ${a.currency} with ${b.currency}`
    );
  }
}

export function add(a: Money, b: Money): Money {
  assertSameCurrency(a, b);
  return money(a.amountMinor + b.amountMinor, a.currency);
}

export function multiply(value: Money, quantity: number): Money {
  if (!Number.isInteger(quantity) || quantity < 0) {
    throw new RangeError(`Quantity must be a non-negative integer, got ${quantity}`);
  }
  return money(value.amountMinor * quantity, value.currency);
}

/**
 * Applies an integer percentage discount, rounding to the nearest minor unit.
 * `percent` is expressed as a whole number (e.g. 15 means 15%).
 */
export function applyPercentDiscount(value: Money, percent: number): Money {
  if (percent < 0 || percent > 100) {
    throw new RangeError(`Discount percent must be between 0 and 100, got ${percent}`);
  }
  const discounted = Math.round((value.amountMinor * (100 - percent)) / 100);
  return money(discounted, value.currency);
}

export function sum(values: Money[], currency: string): Money {
  return values.reduce((acc, v) => add(acc, v), zero(currency));
}

/** Formats money for display, e.g. `{ 1299, USD }` -> "12.99 USD". */
export function format(value: Money): string {
  const major = (value.amountMinor / 100).toFixed(2);
  return `${major} ${value.currency}`;
}
