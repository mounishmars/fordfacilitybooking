import { Inject, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { AUTH_PROVIDER, AuthProvider } from './auth-provider.interface';
import { MockLoginDto } from './dto/mock-login.dto';

@Injectable()
export class AuthService {
  constructor(
    @Inject(AUTH_PROVIDER) private readonly authProvider: AuthProvider,
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async mockLogin(dto: MockLoginDto) {
    const profile = await this.authProvider.validateIdentity({
      email: dto.email,
      name: dto.name,
      role: dto.role,
    });

    const user = await this.usersService.upsertFromSso({
      email: profile.email,
      name: profile.name,
      ssoSubjectId: profile.ssoSubjectId,
      role: profile.role!,
    });

    const accessToken = await this.jwtService.signAsync({
      sub: user.id,
      email: user.email,
      role: user.role,
    });

    return {
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        ssoSubjectId: user.ssoSubjectId,
      },
    };
  }
}
