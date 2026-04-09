export interface GetUserInput {
  id?: string;
}

export interface ListUsersInput {
  filter?: Record<string, unknown>;
  first?: number;
  after?: string;
  orderBy?: string;
}

export interface SearchUsersInput extends Omit<ListUsersInput, 'orderBy'> {
  query: string;
}

export interface User {
  id?: string;
  name?: string;
  email?: string;
  displayName?: string;
  active?: boolean;
}

export interface UserResponse {
  viewer: User;
}
