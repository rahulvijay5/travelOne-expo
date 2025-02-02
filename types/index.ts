export interface User {
  id: number;
  phoneNumber: string;
  role: "SUPERADMIN" | "OWNER" | "MANAGER" | "CUSTOMER";
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

export interface HotelManager {
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
  managers: HotelManager[];
  rules: HotelRules;
}

export interface Group {
  id: number;
  name: string;
  ownerId: number;
  createdAt: string;
  updatedAt: string;
  owner: User;
  managers: User[];
  members: User[];
  todos: Todo[];
}

export interface Todo {
  id: number;
  title: string;
  status: boolean;
  groupId: number;
  creatorId: number;
  createdAt: string;
  updatedAt: string;
  creator: User;
  group: Group;
}
