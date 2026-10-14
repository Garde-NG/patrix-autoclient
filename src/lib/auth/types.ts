export interface User {
  id: string;
  email: string;
  name: string;
  is_active: boolean;
  is_suspended: boolean;
  last_login_at: string | null;
  created_at: string;
}

export interface Tokens {
  access_token: string;
  refresh_token: string;
  expires_in: number;
}

export interface TokenResponse extends Tokens {
  token_type: string;
  user: User;
}
