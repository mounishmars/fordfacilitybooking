import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FacilitiesModule } from '../facilities/facilities.module';
import { TimeSlot } from '../facilities/time-slot.entity';
import { Booking } from './booking.entity';
import { BookingsService } from './bookings.service';
import { BookingsController } from './bookings.controller';
import { AdminBookingsController } from './admin-bookings.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Booking, TimeSlot]), FacilitiesModule],
  providers: [BookingsService],
  controllers: [BookingsController, AdminBookingsController],
  exports: [BookingsService],
})
export class BookingsModule {}
