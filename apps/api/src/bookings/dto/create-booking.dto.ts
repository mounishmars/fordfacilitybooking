import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsOptional, IsUUID } from 'class-validator';

export class CreateBookingDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  facilityId: string;

  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Prefer booking an existing open slot by id',
  })
  @IsOptional()
  @IsUUID()
  slotId?: string;

  @ApiPropertyOptional({
    description: 'Or request a concrete window (creates/finds OPEN slot)',
    example: '2026-10-22T08:00:00.000Z',
  })
  @IsOptional()
  @IsDateString()
  startAt?: string;

  @ApiPropertyOptional({ example: '2026-10-22T09:00:00.000Z' })
  @IsOptional()
  @IsDateString()
  endAt?: string;
}
