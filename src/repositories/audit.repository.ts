import { randomUUID } from 'node:crypto';
import type { AuditEvent } from '../models/audit-event.js';

export interface AuditRepository {
  append(event: Omit<AuditEvent, 'id' | 'createdAt'>): Promise<AuditEvent>;
  listByResource(resourceType: string, resourceId: string): Promise<AuditEvent[]>;
}

export class InMemoryAuditRepository implements AuditRepository {
  private readonly events: AuditEvent[] = [];

  async append(event: Omit<AuditEvent, 'id' | 'createdAt'>): Promise<AuditEvent> {
    const record: AuditEvent = {
      ...event,
      id: randomUUID(),
      createdAt: new Date().toISOString(),
    };
    this.events.push(record);
    return record;
  }

  async listByResource(resourceType: string, resourceId: string): Promise<AuditEvent[]> {
    return this.events.filter(
      (e) => e.resourceType === resourceType && e.resourceId === resourceId
    );
  }

  clear(): void {
    this.events.length = 0;
  }
}
