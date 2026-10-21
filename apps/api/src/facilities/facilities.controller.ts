import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { FacilitiesService } from './facilities.service';

@ApiTags('facilities')
@ApiBearerAuth('JWT')
@Controller('facilities')
@UseGuards(JwtAuthGuard)
export class FacilitiesController {
  constructor(private readonly facilitiesService: FacilitiesService) {}

  @Get()
  @ApiOperation({ summary: 'List active facilities' })
  list() {
    return this.facilitiesService.findAllActive();
  }

  @Get(':id/availability')
  @ApiOperation({ summary: 'Availability for a facility in a date range' })
  @ApiQuery({ name: 'from', example: '2026-10-21T00:00:00.000Z' })
  @ApiQuery({ name: 'to', example: '2026-10-22T00:00:00.000Z' })
  availability(
    @Param('id') id: string,
    @Query('from') from: string,
    @Query('to') to: string,
  ) {
    return this.facilitiesService.getAvailability(id, from, to);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get facility by id' })
  one(@Param('id') id: string) {
    return this.facilitiesService.findOne(id);
  }
}
