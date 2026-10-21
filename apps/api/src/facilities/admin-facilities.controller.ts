import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@ford/shared';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { FacilitiesService } from './facilities.service';
import { CreateFacilityDto } from './dto/create-facility.dto';
import { UpdateFacilityDto } from './dto/update-facility.dto';
import { BlockSlotDto } from './dto/block-slot.dto';

@ApiTags('admin')
@ApiBearerAuth('JWT')
@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.FACILITY_ADMIN)
export class AdminFacilitiesController {
  constructor(private readonly facilitiesService: FacilitiesService) {}

  @Get('facilities')
  @ApiOperation({ summary: 'List all facilities (admin)' })
  listAll() {
    return this.facilitiesService.findAll();
  }

  @Post('facilities')
  @ApiOperation({ summary: 'Create facility' })
  create(@Body() dto: CreateFacilityDto) {
    return this.facilitiesService.create(dto);
  }

  @Patch('facilities/:id')
  @ApiOperation({ summary: 'Update facility' })
  update(@Param('id') id: string, @Body() dto: UpdateFacilityDto) {
    return this.facilitiesService.update(id, dto);
  }

  @Post('slots/block')
  @ApiOperation({ summary: 'Block a time slot (maintenance/events)' })
  block(@Body() dto: BlockSlotDto) {
    return this.facilitiesService.blockSlot(dto);
  }
}
