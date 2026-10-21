import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsOptional, IsString, MinLength } from 'class-validator';

export class BlockSlotDto {
  @ApiProperty({ format: 'uuid' })
  @IsString()
  facilityId: string;

  @ApiProperty({ example: '2026-10-22T08:00:00.000Z' })
  @IsDateString()
  startAt: string;

  @ApiProperty({ example: '2026-10-22T10:00:00.000Z' })
  @IsDateString()
  endAt: string;

  @ApiPropertyOptional({ example: 'Maintenance' })
  @IsOptional()
  @IsString()
  @MinLength(1)
  reason?: string;
}
