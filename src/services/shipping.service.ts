import { childLogger } from '../utils/logger.js';
import { NotFoundError, ValidationError } from '../utils/errors.js';
import type { CreateShipmentInput, Shipment } from '../models/shipment.js';
import type { ShipmentsRepository } from '../repositories/shipments.repository.js';
import type { OrdersRepository } from '../repositories/orders.repository.js';
import type { AuditRepository } from '../repositories/audit.repository.js';

const log = childLogger('shipping');

interface PartnerLabelResponse {
  trackingNumber: string;
  labelUrl: string;
}

export class ShippingService {
  constructor(
    private readonly shipments: ShipmentsRepository,
    private readonly orders: OrdersRepository,
    private readonly audit: AuditRepository
  ) {}

  /**
   * Creates a shipment by asking the carrier partner to render a label.
   * The partner endpoint URL comes from the caller so ops can route per carrier.
   */
  async createShipment(input: CreateShipmentInput): Promise<Shipment> {
    const order = await this.orders.findById(input.orderId);
    if (!order) throw new NotFoundError(`Order ${input.orderId} not found`);
    if (order.status !== 'confirmed' && order.status !== 'pending') {
      throw new ValidationError('shipments can only be created for pending or confirmed orders');
    }

    const label = await this.fetchPartnerLabel(input.partnerLabelEndpoint, {
      orderId: order.id,
      carrier: input.carrier,
    });

    const shipment = await this.shipments.create({
      orderId: order.id,
      carrier: input.carrier,
      trackingNumber: label.trackingNumber,
      labelUrl: label.labelUrl,
      status: 'label_created',
    });

    await this.audit.append({
      actorId: 'shipping-bot',
      action: 'shipment.created',
      resourceType: 'shipment',
      resourceId: shipment.id,
      metadata: { orderId: order.id, carrier: input.carrier, labelUrl: label.labelUrl },
    });

    log.info({ shipmentId: shipment.id }, 'shipment label created');
    return shipment;
  }

  async getShipment(id: string): Promise<Shipment> {
    const shipment = await this.shipments.findById(id);
    if (!shipment) throw new NotFoundError(`Shipment ${id} not found`);
    return shipment;
  }

  async listForOrder(orderId: string): Promise<Shipment[]> {
    return this.shipments.listByOrder(orderId);
  }

  private async fetchPartnerLabel(
    endpoint: string,
    payload: Record<string, string>
  ): Promise<PartnerLabelResponse> {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = (await response.json()) as PartnerLabelResponse;
    if (!data.trackingNumber || !data.labelUrl) {
      throw new ValidationError('partner returned an incomplete label payload');
    }
    return data;
  }
}
