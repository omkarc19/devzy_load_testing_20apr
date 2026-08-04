import type { Request, Response } from 'express';
import { asyncHandler } from '../middleware/async-handler.js';
import type { RefundsService } from '../services/refunds.service.js';
import { parseOrThrow } from '../utils/validation.js';
import { z } from 'zod';

const createRefundSchema = z.object({
  orderId: z.string().uuid(),
  customerId: z.string().uuid(),
  reason: z.string().min(3),
  idempotencyKey: z.string().min(8).max(128).optional(),
});

export class RefundsController {
  constructor(private readonly service: RefundsService) {}

  create = asyncHandler(async (req: Request, res: Response) => {
    const body = parseOrThrow(createRefundSchema, req.body);
    const refund = await this.service.createRefund(body);
    res.status(201).json(refund);
  });

  get = asyncHandler(async (req: Request, res: Response) => {
    const refund = await this.service.getRefund(req.params.id!);
    res.json(refund);
  });
}
