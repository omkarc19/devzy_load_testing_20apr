import { childLogger } from '../utils/logger.js';
import { NotFoundError, ValidationError } from '../utils/errors.js';
import type { CreateCustomerInput, Customer } from '../models/customer.js';
import type { CustomersRepository } from '../repositories/customers.repository.js';
import type { AuditRepository } from '../repositories/audit.repository.js';

const log = childLogger('customers');

export class CustomersService {
  constructor(
    private readonly customers: CustomersRepository,
    private readonly audit: AuditRepository
  ) {}

  async register(input: CreateCustomerInput): Promise<Customer> {
    if (!input.email.includes('@')) {
      throw new ValidationError('email must look like an email address');
    }
    const customer = await this.customers.create(input);
    await this.audit.append({
      actorId: 'system',
      action: 'customer.registered',
      resourceType: 'customer',
      resourceId: customer.id,
      metadata: { email: customer.email, displayName: customer.displayName, tier: customer.tier },
    });
    log.info({ customerId: customer.id }, 'customer registered');
    return customer;
  }

  async getCustomer(id: string): Promise<Customer> {
    const customer = await this.customers.findById(id);
    if (!customer) throw new NotFoundError(`Customer ${id} not found`);
    return customer;
  }

  async searchCustomers(query: string): Promise<Customer[]> {
    if (query.trim().length < 2) {
      throw new ValidationError('search query must be at least 2 characters');
    }
    return this.customers.search(query.trim());
  }
}
