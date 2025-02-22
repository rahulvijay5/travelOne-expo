import { create } from 'zustand';
import { Room } from '@/types';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface RoomState {
  rooms: Room[] | null;
  hotelId: string | null;
  setRooms: (rooms: Room[] | null, hotelId: string) => void;
  clearRooms: () => void;
  initializeFromStorage: () => Promise<void>;
  updateRoom: (updatedRoom: Room) => void;
  deleteRoom: (roomId: string) => void;
  addRoom: (room: Room) => void;
  getRoomById: (roomId: string) => Room | undefined;
  getRoomsByHotelId: (hotelId: string) => Room[];
}

export const useRoomStore = create<RoomState>((set, get) => ({
  rooms: [],
  hotelId: null,
  setRooms: async (rooms, hotelId) => {
    set({ rooms, hotelId });
    if (rooms) {
      await AsyncStorage.setItem('@current_hotel_rooms', JSON.stringify({
        hotelId,
        rooms
      }));
    } else {
      await AsyncStorage.removeItem('@current_hotel_rooms');
    }
  },
  clearRooms: async () => {
    set({ rooms: [], hotelId: null });
    await AsyncStorage.removeItem('@current_hotel_rooms');
  },
  initializeFromStorage: async () => {
    try {
      const storedRooms = await AsyncStorage.getItem('@current_hotel_rooms');
      if (storedRooms) {
        const parsedData = JSON.parse(storedRooms);
        set({ 
          rooms: parsedData.rooms,
          hotelId: parsedData.hotelId
        });
      }
    } catch (error) {
      console.error('Error initializing rooms from storage:', error);
    }
  },
  updateRoom: async (updatedRoom: Room) => {
    const { rooms, hotelId } = get();
    if (!rooms) return;

    const updatedRooms = rooms.map(room => 
      room.id === updatedRoom.id ? updatedRoom : room
    );
    
    set({ rooms: updatedRooms });
    if (hotelId) {
      await AsyncStorage.setItem('@current_hotel_rooms', JSON.stringify({
        hotelId,
        rooms: updatedRooms
      }));
    }
  },
  deleteRoom: async (roomId: string) => {
    const { rooms, hotelId } = get();
    if (!rooms) return;

    const updatedRooms = rooms.filter(room => room.id !== roomId);
    set({ rooms: updatedRooms });
    if (hotelId) {
      await AsyncStorage.setItem('@current_hotel_rooms', JSON.stringify({
        hotelId,
        rooms: updatedRooms
      }));
    }
  },
  addRoom: async (room: Room) => {
    const { rooms, hotelId } = get();
    if (!rooms) return;

    const updatedRooms = [...rooms, room];
    set({ rooms: updatedRooms });
    if (hotelId) {
      await AsyncStorage.setItem('@current_hotel_rooms', JSON.stringify({
        hotelId,
        rooms: updatedRooms
      }));
    }
  },
  getRoomById: (roomId: string) => {
    const { rooms } = get();
    return rooms?.find(room => room.id === roomId);
  },
  getRoomsByHotelId: (hotelId: string) => {
    const { rooms } = get();
    return rooms?.filter(room => room.hotelId === hotelId) || [];
  }
})); 