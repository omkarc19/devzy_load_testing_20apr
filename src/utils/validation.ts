import { z } from 'zod';
import { ValidationError } from './errors.js';

/**
 * Zod schema for the create-order request body. SKU and currency formats are
 * constrained so obviously malformed payloads are rejected at the edge.
 */
export const createOrderSchema = z.object({
  customerId: z.string().min(1).max(64),
  currency: z
    .string()
    .length(3)
    .regex(/^[A-Za-z]{3}$/, 'currency must be a 3-letter code')
    .optional(),
  discountPercent: z.number().int().min(0).max(100).optional(),
  items: z
    .array(
      z.object({
        sku: z.string().min(1).max(64),
        name: z.string().min(1).max(256),
        quantity: z.number().int().positive(),
        unitPriceMinor: z.number().int().nonnegative(),
      })
    )
    .min(1, 'an order must contain at least one item'),
});

export const updateStatusSchema = z.object({
  status: z.enum(['pending', 'confirmed', 'shipped', 'delivered', 'cancelled']),
});

/**
 * Body schema for the bulk order-lookup endpoint. Capped at 100 ids so a single
 * request cannot ask for an unbounded number of orders.
 */
export const batchGetOrdersSchema = z.object({
  ids: z.array(z.string().min(1).max(64)).min(1).max(100),
});

export const listOrdersQuerySchema = z.object({
  status: z
    .enum(['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'])
    .optional(),
  limit: z.coerce.number().int().positive().max(100).default(20),
  offset: z.coerce.number().int().nonnegative().default(0),
});

/**
 * Parses `input` with `schema`, converting Zod failures into a domain
 * {@link ValidationError} that the error middleware understands.
 */
export function parseOrThrow<T>(schema: z.ZodType<T>, input: unknown): T {
  const result = schema.safeParse(input);
  if (!result.success) {
    throw new ValidationError('Request validation failed', result.error.flatten());
  }
  return result.data;
}
