import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { FacilityType } from '@ford/shared';
import { TimeSlot } from './time-slot.entity';
import { Booking } from '../bookings/booking.entity';

@Entity('facilities')
export class Facility {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ type: 'varchar' })
  type: FacilityType | string;

  @Column()
  location: string;

  @Column({ default: true })
  active: boolean;

  @Column({ type: 'int', default: 1 })
  capacity: number;

  @OneToMany(() => TimeSlot, (slot) => slot.facility)
  slots: TimeSlot[];

  @OneToMany(() => Booking, (booking) => booking.facility)
  bookings: Booking[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
