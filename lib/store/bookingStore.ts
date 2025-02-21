import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface Payment {
  paidAmount: number;
  status: string;
  totalAmount: number;
}

interface Room {
  roomNumber: string;
  type: string;
}

interface Booking {
  id: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  status: string;
  payment: Payment;
  room: Room;
}

interface BookingState {
  currentBooking: Booking | null;
  setCurrentBooking: (booking: Booking | null) => void;
  clearCurrentBooking: () => void;
  initializeFromStorage: () => Promise<void>;
}

const useBookingStore = create<BookingState>((set) => ({
  currentBooking: null,
  setCurrentBooking: async (booking) => {
    set({ currentBooking: booking });
    if (booking) {
      await AsyncStorage.setItem('currentBooking', JSON.stringify(booking));
    } else {
      await AsyncStorage.removeItem('currentBooking');
    }
  },
  clearCurrentBooking: async () => {
    set({ currentBooking: null });
    await AsyncStorage.removeItem('currentBooking');
  },
  initializeFromStorage: async () => {
    const storedBooking = await AsyncStorage.getItem('currentBooking');
    if (storedBooking) {
      set({ currentBooking: JSON.parse(storedBooking) });
    }
  },
}));

export default useBookingStore;
