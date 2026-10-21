import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { FacilitiesModule } from './facilities/facilities.module';
import { BookingsModule } from './bookings/bookings.module';
import { User } from './users/user.entity';
import { Facility } from './facilities/facility.entity';
import { TimeSlot } from './facilities/time-slot.entity';
import { Booking } from './bookings/booking.entity';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const dbType = config.get<string>('DB_TYPE', 'sqlite');
        if (dbType === 'postgres') {
          return {
            type: 'postgres' as const,
            url:
              config.get<string>('DATABASE_URL') ||
              'postgres://ford:ford@localhost:5432/facility_booking',
            entities: [User, Facility, TimeSlot, Booking],
            synchronize: true,
          };
        }
        return {
          type: 'sqljs' as const,
          autoSave: true,
          location: config.get<string>('SQLITE_PATH', 'facility_booking.sqlite'),
          entities: [User, Facility, TimeSlot, Booking],
          synchronize: true,
        };
      },
    }),
    AuthModule,
    UsersModule,
    FacilitiesModule,
    BookingsModule,
  ],
})
export class AppModule {}
