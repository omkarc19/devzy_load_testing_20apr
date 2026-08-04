import { childLogger } from '../utils/logger.js';
import type { AuditRepository } from '../repositories/audit.repository.js';

const log = childLogger('notifications');

export class NotificationsService {
  constructor(private readonly audit: AuditRepository) {}

  async emitOrderStatusChange(orderId: string, status: string, customerEmail: string): Promise<void> {
    log.info({ orderId, status }, 'notification queued');
    await this.audit.append({
      actorId: 'notifications',
      action: 'notification.order_status',
      resourceType: 'order',
      resourceId: orderId,
      metadata: { status, customerEmail, channel: 'email' },
    });
  }
}
