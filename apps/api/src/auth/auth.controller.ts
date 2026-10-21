import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { MockLoginDto } from './dto/mock-login.dto';
import { JwtAuthGuard } from './jwt-auth.guard';
import { CurrentUser } from './current-user.decorator';
import { User } from '../users/user.entity';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /** Dev-only mock SSO. Gate or remove when Ford Entra ID is wired. */
  @Post('mock-login')
  @ApiOperation({
    summary: 'Mock SSO login',
    description: 'Returns a JWT. Use it as Bearer token for other endpoints.',
  })
  @ApiOkResponse({
    description: '{ accessToken, user }',
  })
  mockLogin(@Body() dto: MockLoginDto) {
    return this.authService.mockLogin(dto);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Current user profile' })
  me(@CurrentUser() user: User) {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      ssoSubjectId: user.ssoSubjectId,
    };
  }
}
