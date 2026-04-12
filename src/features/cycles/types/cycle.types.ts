export interface GetCycleInput {
  id: string;
}

export interface ListCyclesInput {
  filter?: Record<string, unknown>;
  teamId?: string;
  first?: number;
  after?: string;
}

export interface GetCurrentCycleInput {
  filter?: Record<string, unknown>;
  teamId?: string;
}
