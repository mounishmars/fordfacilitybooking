import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { BookingStatus } from '@ford/shared';
import { User } from '../users/user.entity';
import { Facility } from '../facilities/facility.entity';
import { TimeSlot } from '../facilities/time-slot.entity';

@Entity('bookings')
export class Booking {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, (user) => user.bookings, { onDelete: 'CASCADE' })
  user: User;

  @Column()
  userId: string;

  @ManyToOne(() => Facility, (facility) => facility.bookings, {
    onDelete: 'CASCADE',
  })
  facility: Facility;

  @Column()
  facilityId: string;

  @ManyToOne(() => TimeSlot, (slot) => slot.bookings, { onDelete: 'CASCADE' })
  slot: TimeSlot;

  @Column()
  slotId: string;

  @Column({ type: 'varchar', default: BookingStatus.PENDING })
  status: BookingStatus;

  @Column({ type: 'text', nullable: true })
  adminNote: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
