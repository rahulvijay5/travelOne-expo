// hotel.ts
import { Entity } from './common';
import { HotelRules, HotelManagerName } from './hotelRules';

export interface HotelDetails extends Entity {
  hotelName: string;
  description: string;
  location: string;
  address: string;
  code: string;
  contactNumber: string;
  amenities: string[];
  hotelImages: string[];
  managers: HotelManagerName[];
  rules: HotelRules;
}

export interface HotelFormData {
  hotelName: string;
  description: string;
  location: string;
  address: string;
  contactNumber: string;
  amenities: string[];
  hotelImages: string[];
  owner: string;
  customAmenity?: string;
}
