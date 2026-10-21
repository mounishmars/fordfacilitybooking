import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  Min,
  MinLength,
} from 'class-validator';

export class CreateFacilityDto {
  @ApiProperty({ example: 'Main Turf' })
  @IsString()
  @MinLength(1)
  name: string;

  @ApiProperty({ example: 'TURF', description: 'TURF | BADMINTON | or custom' })
  @IsString()
  @MinLength(1)
  type: string;

  @ApiProperty({ example: 'Sports Complex - Field A' })
  @IsString()
  @MinLength(1)
  location: string;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  active?: boolean;

  @ApiPropertyOptional({ default: 1, minimum: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  capacity?: number;
}
