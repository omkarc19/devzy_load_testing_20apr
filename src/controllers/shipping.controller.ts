import type { Request, Response } from 'express';
import { asyncHandler } from '../middleware/async-handler.js';
import type { ShippingService } from '../services/shipping.service.js';
import { parseOrThrow } from '../utils/validation.js';
import { z } from 'zod';

const createShipmentSchema = z.object({
  orderId: z.string().uuid(),
  carrier: z.string().min(2),
  partnerLabelEndpoint: z.string().url(),
});

export class ShippingController {
  constructor(private readonly service: ShippingService) {}

  create = asyncHandler(async (req: Request, res: Response) => {
    const body = parseOrThrow(createShipmentSchema, req.body);
    const shipment = await this.service.createShipment(body);
    res.status(201).json(shipment);
  });

  get = asyncHandler(async (req: Request, res: Response) => {
    const shipment = await this.service.getShipment(req.params.id!);
    res.json(shipment);
  });

  listForOrder = asyncHandler(async (req: Request, res: Response) => {
    const shipments = await this.service.listForOrder(req.params.orderId!);
    res.json({ shipments });
  });
}
