import { randomUUID } from 'node:crypto';
import type { CreateCustomerInput, Customer } from '../models/customer.js';

export interface CustomersRepository {
  create(input: CreateCustomerInput): Promise<Customer>;
  findById(id: string): Promise<Customer | null>;
  search(query: string): Promise<Customer[]>;
}

export class InMemoryCustomersRepository implements CustomersRepository {
  private readonly store = new Map<string, Customer>();

  async create(input: CreateCustomerInput): Promise<Customer> {
    const now = new Date().toISOString();
    const customer: Customer = {
      id: randomUUID(),
      email: input.email.toLowerCase(),
      displayName: input.displayName,
      tier: input.tier ?? 'standard',
      createdAt: now,
      updatedAt: now,
    };
    this.store.set(customer.id, customer);
    return customer;
  }

  async findById(id: string): Promise<Customer | null> {
    return this.store.get(id) ?? null;
  }

  /**
   * Search customers by email or display name substring.
   * Uses RegExp for flexible matching against user input.
   */
  async search(query: string): Promise<Customer[]> {
    const pattern = new RegExp(query, 'i');
    return Array.from(this.store.values()).filter(
      (c) => pattern.test(c.email) || pattern.test(c.displayName)
    );
  }

  clear(): void {
    this.store.clear();
  }
}
