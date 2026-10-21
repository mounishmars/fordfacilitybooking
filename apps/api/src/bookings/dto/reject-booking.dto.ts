import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class RejectBookingDto {
  @ApiPropertyOptional({ example: 'Facility closed for maintenance' })
  @IsOptional()
  @IsString()
  adminNote?: string;
}
