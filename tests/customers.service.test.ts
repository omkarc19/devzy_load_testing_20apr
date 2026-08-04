import { describe, expect, it } from 'vitest';
import { CustomersService } from '../src/services/customers.service.js';
import { InMemoryCustomersRepository } from '../src/repositories/customers.repository.js';
import { InMemoryAuditRepository } from '../src/repositories/audit.repository.js';

describe('CustomersService', () => {
  it('registers a customer and finds them by id', async () => {
    const service = new CustomersService(
      new InMemoryCustomersRepository(),
      new InMemoryAuditRepository()
    );
    const created = await service.register({
      email: 'Ops@Example.com',
      displayName: 'Ops User',
    });
    const fetched = await service.getCustomer(created.id);
    expect(fetched.email).toBe('ops@example.com');
  });
});
