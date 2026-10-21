import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Booking } from '../bookings/booking.entity';
import { Facility } from './facility.entity';
import { TimeSlot } from './time-slot.entity';
import { FacilitiesService } from './facilities.service';
import { FacilitiesController } from './facilities.controller';
import { AdminFacilitiesController } from './admin-facilities.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Facility, TimeSlot, Booking])],
  providers: [FacilitiesService],
  controllers: [FacilitiesController, AdminFacilitiesController],
  exports: [FacilitiesService],
})
export class FacilitiesModule {}
