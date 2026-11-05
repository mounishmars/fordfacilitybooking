import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { SlotStatus } from '@ford/shared';
import { Facility } from './facility.entity';
import { Booking } from '../bookings/booking.entity';

@Entity('time_slots')
export class TimeSlot {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Facility, (facility) => facility.slots, {
    onDelete: 'CASCADE',
  })
  facility: Facility;

  @Column()
  facilityId: string;

  // Use timestamp (Postgres + SQLite); "datetime" is SQLite-only and breaks Neon/Postgres
  @Column({ type: 'timestamp' })
  startAt: Date;

  @Column({ type: 'timestamp' })
  endAt: Date;

  @Column({ type: 'varchar', default: SlotStatus.OPEN })
  status: SlotStatus;

  @Column({ type: 'int', default: 1 })
  capacity: number;

  @Column({ type: 'text', nullable: true })
  blockReason: string | null;

  @OneToMany(() => Booking, (booking) => booking.slot)
  bookings: Booking[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
