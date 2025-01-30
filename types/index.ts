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
  currentStay: string;
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
  customAmenity: string;
  hotelImages: string[];
  owner: string;
  managers: [];
  rooms: [];
  bookings: [];
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

export interface HotelRules {
  petsAllowed: boolean;
  maxPeopleInOneRoom: string;
  extraMattressOnAvailability: boolean;
  parking: boolean;
  swimmingPool: boolean;
  swimmingPoolTimings: string;
  ownRestaurant: boolean;
  checkInTime: string;
  checkOutTime: string;
  guestInfoNeeded: boolean;
  smokingAllowed: boolean;
  alcoholAllowed: boolean;
  eventsAllowed: boolean;
  minimumAgeForCheckIn: string;
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
