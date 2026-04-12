export interface StartSubscriptionInput {
  topic: string;
  filter?: Record<string, unknown>;
}

export interface StopSubscriptionInput {
  subscriptionId: string;
}
