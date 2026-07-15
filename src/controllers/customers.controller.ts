import type { Request, Response } from 'express';
import { asyncHandler } from '../middleware/async-handler.js';
import type { CustomersService } from '../services/customers.service.js';
import { parseOrThrow } from '../utils/validation.js';
import { z } from 'zod';

const createCustomerSchema = z.object({
  email: z.string().email(),
  displayName: z.string().min(1),
  tier: z.enum(['standard', 'premium']).optional(),
});

export class CustomersController {
  constructor(private readonly service: CustomersService) {}

  register = asyncHandler(async (req: Request, res: Response) => {
    const body = parseOrThrow(createCustomerSchema, req.body);
    const customer = await this.service.register(body);
    res.status(201).json(customer);
  });

  get = asyncHandler(async (req: Request, res: Response) => {
    const customer = await this.service.getCustomer(req.params.id!);
    res.json(customer);
  });

  search = asyncHandler(async (req: Request, res: Response) => {
    const q = String(req.query.q ?? '');
    const results = await this.service.searchCustomers(q);
    res.json({ customers: results, count: results.length });
  });
}
