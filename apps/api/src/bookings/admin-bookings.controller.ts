import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { BookingStatus, UserRole } from '@ford/shared';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { BookingsService } from './bookings.service';
import { RejectBookingDto } from './dto/reject-booking.dto';

@ApiTags('admin')
@ApiBearerAuth('JWT')
@Controller('admin/bookings')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.FACILITY_ADMIN)
export class AdminBookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @Get()
  @ApiOperation({ summary: 'List bookings (optional status filter)' })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: BookingStatus,
    example: BookingStatus.PENDING,
  })
  list(@Query('status') status?: BookingStatus) {
    return this.bookingsService.findAdminQueue(status);
  }

  @Post(':id/approve')
  @ApiOperation({ summary: 'Approve pending booking' })
  approve(@Param('id') id: string) {
    return this.bookingsService.approve(id);
  }

  @Post(':id/reject')
  @ApiOperation({ summary: 'Reject pending booking' })
  reject(@Param('id') id: string, @Body() dto: RejectBookingDto) {
    return this.bookingsService.reject(id, dto.adminNote);
  }
}
