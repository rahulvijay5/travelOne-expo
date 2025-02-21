// booking.ts
import { PaymentStatus, BookingStatus } from "./payment";
import { BookingStatusEnum, RoomStatusEnum } from "./statusEnums";

export enum BookingCreatedBy {
  MANAGER = "MANAGER",
  CUSTOMER = "CUSTOMER",
}

export interface Booking {
  hotelId: string;
  roomId: string;
  customerId: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  status: BookingStatus;
  payment: {
    totalAmount: number;
    paidAmount: number;
    status: PaymentStatus;
    transactionId: string;
  };
  createdBy: BookingCreatedBy;
}

export interface BookingData extends Omit<Booking, "status"> {
  status: BookingStatus;
}

export type BookingDataInDb = {
  id: string;
  hotelId: string;
  roomId: string;
  customerId: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  status: BookingStatus;
  bookingTime: string;
  updatedAt: string;
  hotel: {
    id: string;
    hotelName: string;
    code: string;
  };
  room: {
    id: string;
    roomNumber: string;
    type: string;
    roomStatus: RoomStatusEnum;
    price: number;
  };
  customer: {
    id: string;
    name: string;
    email: string;
    phoneNumber: string;
  };
  payment: {
    id: string;
    status: PaymentStatus;
    totalAmount: number;
    paidAmount: number;
    transactionId?: string;
  };
};

export interface CheckBookingStatusResponse {
  booking: {
    id: string;
    status: BookingStatus;
    checkIn: string;
    checkOut: string;
    guests: number;
    payment: {
      paidAmount: number;
      totalAmount: number;
      status: PaymentStatus;
    };
    room: {
      roomNumber: string;
      type: string;
    };
  };
}