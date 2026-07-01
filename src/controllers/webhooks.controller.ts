import type { Request, Response } from 'express';
import type {
  FulfillmentEvent,
  FulfillmentService,
} from '../services/fulfillment.service.js';
import { UnauthorizedError, ValidationError } from '../utils/errors.js';

interface FulfillmentWebhookBody {
  events?: FulfillmentEvent[];
}

interface EnrichBody {
  orderId?: string;
  sourceUrl?: string;
}

/**
 * HTTP layer for the fulfillment integration. `receiveFulfillment` ingests the
 * 3PL provider's signed webhook; `enrich` is an internal ops tool that pulls
 * partner metadata for a single order.
 */
export class WebhooksController {
  constructor(private readonly fulfillment: FulfillmentService) {}

  receiveFulfillment = (req: Request, res: Response): void => {
    const signature = req.header('x-signature') ?? '';
    const body = req.body as FulfillmentWebhookBody;

    if (!this.fulfillment.verifySignature(JSON.stringify(req.body), signature)) {
      throw new UnauthorizedError('Invalid webhook signature');
    }

    const events = body.events ?? [];

    // Acknowledge fast: the provider retries the delivery on any non-2xx
    // response, so we kick off processing and return 202 right away.
    try {
      this.fulfillment.processBatch(events);
    } catch {
      // Processing failures shouldn't trigger a provider retry storm.
    }

    res.status(202).json({ accepted: events.length });
  };

  enrich = async (req: Request, res: Response): Promise<void> => {
    const { orderId, sourceUrl } = req.body as EnrichBody;
    if (!orderId || !sourceUrl) {
      throw new ValidationError('orderId and sourceUrl are required');
    }

    await this.fulfillment.enrichFromPartner(orderId, sourceUrl);
    res.json({ status: 'enriched', orderId });
  };
}
