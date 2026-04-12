import type { LinearClient } from '@linear/sdk';

export interface GetInitiativeInput {
  id: string;
}

export interface ListInitiativesInput {
  filter?: NonNullable<Parameters<LinearClient['initiatives']>[0]>['filter'];
  first?: number;
  after?: string;
}

export type CreateInitiativeInput = Parameters<LinearClient['createInitiative']>[0];

export type UpdateInitiativeInput = {
  id: string;
} & Parameters<LinearClient['updateInitiative']>[1];

export interface GetCustomerInput {
  id: string;
}

export interface ListCustomersInput {
  filter?: NonNullable<Parameters<LinearClient['customers']>[0]>['filter'];
  first?: number;
  after?: string;
}

export type CreateCustomerInput = Parameters<LinearClient['createCustomer']>[0];

export type UpdateCustomerInput = {
  id: string;
} & Parameters<LinearClient['updateCustomer']>[1];
