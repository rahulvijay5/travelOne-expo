// room.ts
import { Entity } from './common';
import { RoomStatusEnum } from './statusEnums';

export type RoomStatus = "BOOKED" | "AVAILABLE" | "MAINTENANCE";

export interface Room extends Entity {
  hotelId: string;
  roomNumber: string;
  type: string;
  price: number;
  maxOccupancy: number;
  available: boolean;
  features: string[];
  images: string[];
}

export interface RoomDetailsByID extends Room {
  roomStatus: RoomStatusEnum;
}

export interface RoomForm {
  type: string;
  roomNumber: string;
  price: string;
  maxOccupancy: string;
  available: boolean;
  features: string[];
  customFeature: string;
  images: string[];
}

export interface CreateRoomForm {
  type: string;
  roomNumber: string;
  price: number;
  maxOccupancy: number;
  features: string[];
  images: string[];
}

export interface UpdateRoomForm {
  type: string;
  roomNumber: string;
  price: string;
  maxOccupancy: string;
  available: boolean;
  features: string[];
}
