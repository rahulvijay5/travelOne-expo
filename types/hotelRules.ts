// hotelRules.ts
export interface HotelManagerName {
  name: string;
}

export interface HotelRulesChange {
  petsAllowed: boolean;
  maxPeopleInOneRoom: number;
  extraMattressOnAvailability: boolean;
  parking: boolean;
  swimmingPool: boolean;
  swimmingPoolTimings?: string;
  ownRestaurant: boolean;
  checkInTime: number;
  checkOutTime: number;
  guestInfoNeeded: boolean;
  smokingAllowed: boolean;
  alcoholAllowed: boolean;
  eventsAllowed: boolean;
  minimumAgeForCheckIn: number;
}

export interface HotelRules extends HotelRulesChange {
  id: string;
  hotelId: string;
}
