import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { BookingStatus, SlotStatus } from '@ford/shared';
import { Booking } from './booking.entity';
import { TimeSlot } from '../facilities/time-slot.entity';
import { FacilitiesService } from '../facilities/facilities.service';
import { User } from '../users/user.entity';
import { CreateBookingDto } from './dto/create-booking.dto';

@Injectable()
export class BookingsService {
  constructor(
    @InjectRepository(Booking)
    private readonly bookingsRepo: Repository<Booking>,
    @InjectRepository(TimeSlot)
    private readonly slotsRepo: Repository<TimeSlot>,
    private readonly facilitiesService: FacilitiesService,
  ) {}

  private async heldCount(slotId: string): Promise<number> {
    return this.bookingsRepo.count({
      where: {
        slotId,
        status: In([BookingStatus.PENDING, BookingStatus.CONFIRMED]),
      },
    });
  }

  async create(user: User, dto: CreateBookingDto) {
    let slot: TimeSlot | null = null;

    if (dto.slotId) {
      slot = await this.slotsRepo.findOne({ where: { id: dto.slotId } });
      if (!slot) {
        throw new NotFoundException('Slot not found');
      }
      if (slot.facilityId !== dto.facilityId) {
        throw new BadRequestException('Slot does not belong to facility');
      }
      if (slot.status === SlotStatus.BLOCKED) {
        throw new BadRequestException('This slot is blocked');
      }
    } else if (dto.startAt && dto.endAt) {
      const startAt = new Date(dto.startAt);
      const endAt = new Date(dto.endAt);
      if (!(startAt < endAt)) {
        throw new BadRequestException('startAt must be before endAt');
      }
      slot = await this.facilitiesService.ensureOpenSlot(
        dto.facilityId,
        startAt,
        endAt,
      );
    } else {
      throw new BadRequestException('Provide slotId or startAt/endAt');
    }

    const held = await this.heldCount(slot.id);
    if (held >= slot.capacity) {
      throw new BadRequestException('Slot is fully booked');
    }

    const existing = await this.bookingsRepo.findOne({
      where: {
        userId: user.id,
        slotId: slot.id,
        status: In([BookingStatus.PENDING, BookingStatus.CONFIRMED]),
      },
    });
    if (existing) {
      throw new BadRequestException('You already have a booking for this slot');
    }

    const booking = this.bookingsRepo.create({
      userId: user.id,
      facilityId: dto.facilityId,
      slotId: slot.id,
      status: BookingStatus.PENDING,
    });

    const saved = await this.bookingsRepo.save(booking);
    return this.findOneDetailed(saved.id);
  }

  findMine(userId: string) {
    return this.bookingsRepo.find({
      where: { userId },
      relations: ['facility', 'slot'],
      order: { createdAt: 'DESC' },
    });
  }

  async findAdminQueue(status?: BookingStatus) {
    return this.bookingsRepo.find({
      where: status ? { status } : {},
      relations: ['facility', 'slot', 'user'],
      order: { createdAt: 'ASC' },
    });
  }

  async findOneDetailed(id: string) {
    const booking = await this.bookingsRepo.findOne({
      where: { id },
      relations: ['facility', 'slot', 'user'],
    });
    if (!booking) {
      throw new NotFoundException('Booking not found');
    }
    return booking;
  }

  async cancel(user: User, id: string) {
    const booking = await this.findOneDetailed(id);
    if (booking.userId !== user.id) {
      throw new ForbiddenException('Not your booking');
    }
    if (
      booking.status !== BookingStatus.PENDING &&
      booking.status !== BookingStatus.CONFIRMED
    ) {
      throw new BadRequestException('Booking cannot be cancelled');
    }
    if (booking.status === BookingStatus.CONFIRMED) {
      const start = new Date(booking.slot.startAt);
      if (start.getTime() <= Date.now()) {
        throw new BadRequestException(
          'Confirmed booking can only be cancelled before start time',
        );
      }
    }
    booking.status = BookingStatus.CANCELLED;
    return this.bookingsRepo.save(booking);
  }

  async approve(id: string) {
    const booking = await this.findOneDetailed(id);
    if (booking.status !== BookingStatus.PENDING) {
      throw new BadRequestException('Only pending bookings can be approved');
    }
    const held = await this.heldCount(booking.slotId);
    // current pending counts toward held; ensure capacity when confirming
    if (held > booking.slot.capacity) {
      throw new BadRequestException('Slot capacity exceeded');
    }
    booking.status = BookingStatus.CONFIRMED;
    booking.adminNote = null;
    return this.bookingsRepo.save(booking);
  }

  async reject(id: string, adminNote?: string) {
    const booking = await this.findOneDetailed(id);
    if (booking.status !== BookingStatus.PENDING) {
      throw new BadRequestException('Only pending bookings can be rejected');
    }
    booking.status = BookingStatus.REJECTED;
    booking.adminNote = adminNote || 'Rejected by facility admin';
    return this.bookingsRepo.save(booking);
  }
}
