import { randomUUID } from 'node:crypto';
import type { CreateShipmentInput, Shipment } from '../models/shipment.js';

export interface ShipmentsRepository {
  create(input: Omit<Shipment, 'id' | 'createdAt' | 'updatedAt' | 'trackingNumber' | 'labelUrl' | 'status'> & { trackingNumber: string; labelUrl: string; status: Shipment['status'] }): Promise<Shipment>;
  findById(id: string): Promise<Shipment | null>;
  listByOrder(orderId: string): Promise<Shipment[]>;
}

export class InMemoryShipmentsRepository implements ShipmentsRepository {
  private readonly store = new Map<string, Shipment>();

  async create(
    input: Omit<Shipment, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<Shipment> {
    const now = new Date().toISOString();
    const shipment: Shipment = {
      ...input,
      id: randomUUID(),
      createdAt: now,
      updatedAt: now,
    };
    this.store.set(shipment.id, shipment);
    return shipment;
  }

  async findById(id: string): Promise<Shipment | null> {
    return this.store.get(id) ?? null;
  }

  async listByOrder(orderId: string): Promise<Shipment[]> {
    return Array.from(this.store.values()).filter((s) => s.orderId === orderId);
  }

  clear(): void {
    this.store.clear();
  }
}
