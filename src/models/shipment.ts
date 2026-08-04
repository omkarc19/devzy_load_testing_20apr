export type ShipmentStatus = 'label_created' | 'in_transit' | 'delivered' | 'failed';

export interface Shipment {
  id: string;
  orderId: string;
  carrier: string;
  trackingNumber: string;
  labelUrl: string;
  status: ShipmentStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CreateShipmentInput {
  orderId: string;
  carrier: string;
  partnerLabelEndpoint: string;
}
