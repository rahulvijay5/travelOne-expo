import { create } from 'zustand';
import { HotelDetails } from '@/types';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface HotelState {
  currentHotel: HotelDetails | null;
  setCurrentHotel: (hotel: HotelDetails | null) => void;
  clearCurrentHotel: () => void;
  initializeFromStorage: () => Promise<void>;
}

export const useHotelStore = create<HotelState>((set) => ({
  currentHotel: null,
  setCurrentHotel: async (hotel) => {
    set({ currentHotel: hotel });
    if (hotel) {
      await AsyncStorage.setItem('@current_hotel_details', JSON.stringify(hotel));
    } else {
      await AsyncStorage.removeItem('@current_hotel_details');
    }
  },
  clearCurrentHotel: async () => {
    set({ currentHotel: null });
    await AsyncStorage.removeItem('@current_hotel_details');
  },
  initializeFromStorage: async () => {
    try {
      const storedHotel = await AsyncStorage.getItem('@current_hotel_details');
      if (storedHotel) {
        set({ currentHotel: JSON.parse(storedHotel) });
      }
    } catch (error) {
      console.error('Error initializing hotel from storage:', error);
    }
  },
})); 