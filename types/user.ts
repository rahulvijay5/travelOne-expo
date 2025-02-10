// user.ts
import { Entity } from './common';

export type UserRole = "SUPERADMIN" | "OWNER" | "MANAGER" | "CUSTOMER";

export interface User extends Entity {
  phoneNumber: string;
  role: UserRole;
}

export interface UserData {
  userId: string;
  name: string;
  email: string;
  phone: string;
  clerkId: string;
  isOnboarded: boolean;
  currentStay: {
    hotelId: string;
    hotelCode: string;
    hotelName: string;
  } | null;
  role: string;
  lastUpdated: string;
}
