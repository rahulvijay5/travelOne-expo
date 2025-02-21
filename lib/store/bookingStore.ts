import { Booking } from '@/types';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';

interface BookingState {
  currentBooking: Booking | null;
  setCurrentBooking: (booking: Booking | null) => void;
  clearCurrentBooking: () => void;
  initializeFromStorage: () => Promise<void>;
}

const useBookingStore = create<BookingState>((set) => ({
  currentBooking: null,
  setCurrentBooking: (booking) => set({ currentBooking: booking }),
  clearCurrentBooking: () => set({ currentBooking: null }),
  initializeFromStorage: async () => {
    const storedBooking = await AsyncStorage.getItem('currentBooking');
    if (storedBooking) {
      set({ currentBooking: JSON.parse(storedBooking) });
    }
  },
}));

export default useBookingStore;
