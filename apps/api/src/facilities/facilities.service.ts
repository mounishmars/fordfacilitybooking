import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, In, Repository } from 'typeorm';
import { BookingStatus, SlotStatus } from '@ford/shared';
import { Facility } from './facility.entity';
import { TimeSlot } from './time-slot.entity';
import { Booking } from '../bookings/booking.entity';
import { CreateFacilityDto } from './dto/create-facility.dto';
import { UpdateFacilityDto } from './dto/update-facility.dto';
import { BlockSlotDto } from './dto/block-slot.dto';

@Injectable()
export class FacilitiesService {
  constructor(
    @InjectRepository(Facility)
    private readonly facilitiesRepo: Repository<Facility>,
    @InjectRepository(TimeSlot)
    private readonly slotsRepo: Repository<TimeSlot>,
    @InjectRepository(Booking)
    private readonly bookingsRepo: Repository<Booking>,
  ) {}

  findAllActive() {
    return this.facilitiesRepo.find({
      where: { active: true },
      order: { name: 'ASC' },
    });
  }

  findAll() {
    return this.facilitiesRepo.find({ order: { name: 'ASC' } });
  }

  async findOne(id: string) {
    const facility = await this.facilitiesRepo.findOne({ where: { id } });
    if (!facility) {
      throw new NotFoundException('Facility not found');
    }
    return facility;
  }

  create(dto: CreateFacilityDto) {
    const facility = this.facilitiesRepo.create({
      name: dto.name,
      type: dto.type,
      location: dto.location,
      active: dto.active ?? true,
      capacity: dto.capacity ?? 1,
    });
    return this.facilitiesRepo.save(facility);
  }

  async update(id: string, dto: UpdateFacilityDto) {
    const facility = await this.findOne(id);
    Object.assign(facility, dto);
    return this.facilitiesRepo.save(facility);
  }

  async getAvailability(facilityId: string, from: string, to: string) {
    await this.findOne(facilityId);
    const fromDate = new Date(from);
    const toDate = new Date(to);
    if (Number.isNaN(fromDate.getTime()) || Number.isNaN(toDate.getTime())) {
      throw new BadRequestException('Invalid from/to dates');
    }
    if (fromDate >= toDate) {
      throw new BadRequestException('from must be before to');
    }

    const slots = await this.slotsRepo.find({
      where: {
        facilityId,
        startAt: Between(fromDate, toDate),
      },
      order: { startAt: 'ASC' },
    });

    const slotIds = slots.map((s) => s.id);
    const holdings =
      slotIds.length === 0
        ? []
        : await this.bookingsRepo.find({
            where: {
              slotId: In(slotIds),
              status: In([BookingStatus.PENDING, BookingStatus.CONFIRMED]),
            },
          });

    const heldBySlot = holdings.reduce<Record<string, number>>((acc, b) => {
      acc[b.slotId] = (acc[b.slotId] || 0) + 1;
      return acc;
    }, {});

    return slots.map((slot) => {
      const heldCount = heldBySlot[slot.id] || 0;
      const available =
        slot.status === SlotStatus.OPEN && heldCount < slot.capacity;
      return {
        id: slot.id,
        facilityId: slot.facilityId,
        startAt: slot.startAt.toISOString(),
        endAt: slot.endAt.toISOString(),
        status: slot.status,
        capacity: slot.capacity,
        heldCount,
        available,
        blockReason: slot.blockReason,
      };
    });
  }

  async blockSlot(dto: BlockSlotDto) {
    const facility = await this.findOne(dto.facilityId);
    const startAt = new Date(dto.startAt);
    const endAt = new Date(dto.endAt);
    if (!(startAt < endAt)) {
      throw new BadRequestException('startAt must be before endAt');
    }

    const slot = this.slotsRepo.create({
      facilityId: facility.id,
      startAt,
      endAt,
      status: SlotStatus.BLOCKED,
      capacity: facility.capacity,
      blockReason: dto.reason || 'Blocked by admin',
    });
    return this.slotsRepo.save(slot);
  }

  async ensureOpenSlot(facilityId: string, startAt: Date, endAt: Date) {
    const facility = await this.findOne(facilityId);
    let slot = await this.slotsRepo.findOne({
      where: {
        facilityId,
        startAt,
        endAt,
      },
    });

    if (!slot) {
      slot = await this.slotsRepo.save(
        this.slotsRepo.create({
          facilityId,
          startAt,
          endAt,
          status: SlotStatus.OPEN,
          capacity: facility.capacity,
        }),
      );
    }

    if (slot.status === SlotStatus.BLOCKED) {
      throw new BadRequestException('This slot is blocked');
    }

    return slot;
  }
}
