import { BadRequestException, Injectable } from '@nestjs/common';
import { UserRole } from '@ford/shared';
import { AuthProfile, AuthProvider } from './auth-provider.interface';

@Injectable()
export class MockAuthProvider implements AuthProvider {
  async validateIdentity(input: Record<string, unknown>): Promise<AuthProfile> {
    const email = String(input.email || '').trim().toLowerCase();
    const name = String(input.name || '').trim();
    const role = input.role as UserRole | undefined;

    if (!email || !name) {
      throw new BadRequestException('email and name are required for mock SSO');
    }
    if (role && !Object.values(UserRole).includes(role)) {
      throw new BadRequestException('invalid role');
    }

    return {
      ssoSubjectId: `mock:${email}`,
      email,
      name,
      role: role || UserRole.EMPLOYEE,
    };
  }
}
