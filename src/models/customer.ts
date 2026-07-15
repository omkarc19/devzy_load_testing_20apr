export interface Customer {
  id: string;
  email: string;
  displayName: string;
  tier: 'standard' | 'premium';
  createdAt: string;
  updatedAt: string;
}

export interface CreateCustomerInput {
  email: string;
  displayName: string;
  tier?: Customer['tier'];
}
