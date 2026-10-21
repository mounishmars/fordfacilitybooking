import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { User } from '../users/user.entity';
import { BookingsService } from './bookings.service';
import { CreateBookingDto } from './dto/create-booking.dto';

@ApiTags('bookings')
@ApiBearerAuth('JWT')
@Controller('bookings')
@UseGuards(JwtAuthGuard)
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @Post()
  @ApiOperation({
    summary: 'Request a booking (status PENDING until admin approves)',
  })
  create(@CurrentUser() user: User, @Body() dto: CreateBookingDto) {
    return this.bookingsService.create(user, dto);
  }

  @Get('me')
  @ApiOperation({ summary: 'My bookings' })
  mine(@CurrentUser() user: User) {
    return this.bookingsService.findMine(user.id);
  }

  @Post(':id/cancel')
  @ApiOperation({ summary: 'Cancel my booking' })
  cancel(@CurrentUser() user: User, @Param('id') id: string) {
    return this.bookingsService.cancel(user, id);
  }
}
