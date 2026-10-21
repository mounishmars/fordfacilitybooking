export enum UserRole {
  EMPLOYEE = 'EMPLOYEE',
  FACILITY_ADMIN = 'FACILITY_ADMIN',
}

export enum FacilityType {
  TURF = 'TURF',
  BADMINTON = 'BADMINTON',
}

export enum SlotStatus {
  OPEN = 'OPEN',
  BLOCKED = 'BLOCKED',
}

export enum BookingStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  REJECTED = 'REJECTED',
  CANCELLED = 'CANCELLED',
}

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  ssoSubjectId: string;
}

export interface FacilityDto {
  id: string;
  name: string;
  type: FacilityType | string;
  location: string;
  active: boolean;
  capacity: number;
}

export interface TimeSlotDto {
  id: string;
  facilityId: string;
  startAt: string;
  endAt: string;
  status: SlotStatus;
  capacity: number;
  heldCount: number;
  available: boolean;
}

export interface BookingDto {
  id: string;
  userId: string;
  facilityId: string;
  slotId: string;
  status: BookingStatus;
  adminNote?: string | null;
  createdAt: string;
  updatedAt: string;
  facility?: FacilityDto;
  slot?: TimeSlotDto;
  user?: Pick<AuthUser, 'id' | 'email' | 'name' | 'role'>;
}
