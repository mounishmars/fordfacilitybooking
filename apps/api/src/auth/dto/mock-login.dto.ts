import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsOptional, IsString, MinLength } from 'class-validator';
import { UserRole } from '@ford/shared';

export class MockLoginDto {
  @ApiProperty({ example: 'employee@ford.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'Ford Employee' })
  @IsString()
  @MinLength(1)
  name: string;

  @ApiPropertyOptional({
    enum: UserRole,
    example: UserRole.EMPLOYEE,
    description: 'EMPLOYEE for mobile, FACILITY_ADMIN for admin portal',
  })
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;
}
