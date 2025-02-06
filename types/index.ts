export type UserRole = "SUPERADMIN" | "OWNER" | "MANAGER" | "CUSTOMER";

export type RoomStatus = "BOOKED" | "AVAILABLE" | "MAINTENANCE";

export type BookingStatus = "CONFIRMED" | "CANCELLED" | "PENDING" | "COMPLETED";

export type PaymentStatus = "PENDING" | "PAID" | "REFUNDED" | "FAILED";

export interface User {
  id: number;
  phoneNumber: string;
  role: UserRole;
  createdAt: string;
  updatedAt: string;
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

export interface HotelFormData {
  hotelName: string;
  description: string;
  location: string;
  address: string;
  totalRooms: number;
  contactNumber: string;
  amenities: string[];
  hotelImages: string[];
  owner: string;
  customAmenity?: string; // Temporary field for UI only, won't be sent to API
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

export interface HotelManagerName {
  name: string;
}

export interface HotelRules {
  id: string;
  hotelId: string;
  petsAllowed: boolean;
  maxPeopleInOneRoom: number;
  extraMattressOnAvailability: boolean;
  parking: boolean;
  swimmingPool: boolean;
  swimmingPoolTimings?: string;
  ownRestaurant: boolean;
  checkInTime: string;
  checkOutTime: string;
  guestInfoNeeded: boolean;
  smokingAllowed: boolean;
  alcoholAllowed: boolean;
  eventsAllowed: boolean;
  minimumAgeForCheckIn: number;
}

export interface HotelDetails {
  id: string;
  hotelName: string;
  description: string;
  location: string;
  address: string;
  totalRooms: number;
  code: string;
  contactNumber: string;
  amenities: string[];
  hotelImages: string[];
  createdAt: string;
  updatedAt: string;
  managers: HotelManagerName[];
  rules: HotelRules;
}

export interface Room {
  id: string;
  hotelId: string;
  roomNumber: string;
  type: string;
  price: number;
  maxOccupancy: number;
  available: boolean;
  features: string[];
  images: string[];
}

export interface Booking {
  id: string;
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
}

export interface BookingData {
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
  room: {
    id: string;
    roomNumber: string;
    type: string;
    roomStatus: RoomStatus;
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