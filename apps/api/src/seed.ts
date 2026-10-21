import { NestFactory } from '@nestjs/core';
import { FacilityType, SlotStatus } from '@ford/shared';
import { AppModule } from './app.module';
import { FacilitiesService } from './facilities/facilities.service';
import { DataSource } from 'typeorm';
import { Facility } from './facilities/facility.entity';
import { TimeSlot } from './facilities/time-slot.entity';

function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function addHours(d: Date, h: number) {
  return new Date(d.getTime() + h * 60 * 60 * 1000);
}

async function seed() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const facilitiesService = app.get(FacilitiesService);
  const dataSource = app.get(DataSource);
  const facilitiesRepo = dataSource.getRepository(Facility);
  const slotsRepo = dataSource.getRepository(TimeSlot);

  const existing = await facilitiesRepo.count();
  if (existing === 0) {
    await facilitiesService.create({
      name: 'Main Turf',
      type: FacilityType.TURF,
      location: 'Sports Complex - Field A',
      capacity: 1,
    });
    await facilitiesService.create({
      name: 'Badminton Court 1',
      type: FacilityType.BADMINTON,
      location: 'Indoor Arena - Court 1',
      capacity: 1,
    });
    await facilitiesService.create({
      name: 'Badminton Court 2',
      type: FacilityType.BADMINTON,
      location: 'Indoor Arena - Court 2',
      capacity: 1,
    });
    console.log('Created facilities: Turf + Badminton courts');
  } else {
    console.log(`Facilities already present (${existing}), skipping create`);
  }

  const facilities = await facilitiesRepo.find();
  const today = startOfDay(new Date());
  let createdSlots = 0;

  for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
    const day = new Date(today);
    day.setDate(day.getDate() + dayOffset);

    for (const facility of facilities) {
      // Hourly slots 08:00–20:00
      for (let hour = 8; hour < 20; hour++) {
        const startAt = addHours(day, hour);
        const endAt = addHours(day, hour + 1);
        const found = await slotsRepo.findOne({
          where: { facilityId: facility.id, startAt, endAt },
        });
        if (!found) {
          await slotsRepo.save(
            slotsRepo.create({
              facilityId: facility.id,
              startAt,
              endAt,
              status: SlotStatus.OPEN,
              capacity: facility.capacity,
            }),
          );
          createdSlots += 1;
        }
      }
    }
  }

  console.log(`Seed complete. New open slots: ${createdSlots}`);
  await app.close();
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
