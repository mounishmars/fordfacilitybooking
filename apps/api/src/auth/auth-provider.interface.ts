import { UserRole } from '@ford/shared';

/**
 * Abstract auth provider so Mock SSO can be swapped for Ford Entra ID later.
 */
export interface AuthProfile {
  ssoSubjectId: string;
  email: string;
  name: string;
  role?: UserRole;
}

export interface AuthProvider {
  /**
   * Validate an inbound identity token / assertion and return a profile.
   * Mock: accepts a synthetic payload. Entra: validates OIDC/JWT from Microsoft.
   */
  validateIdentity(input: Record<string, unknown>): Promise<AuthProfile>;
}

export const AUTH_PROVIDER = Symbol('AUTH_PROVIDER');
