import AsyncStorage from '@react-native-async-storage/async-storage';

export const getCurrentHotel = async () => {
  try {
    const hotelId = await AsyncStorage.getItem('@current_hotel');
    return hotelId;
  } catch (error) {
    console.error('Error getting current hotel:', error);
    return null;
  }
};

export const setCurrentHotel = async (hotelId: string | null) => {
  try {
    if (hotelId) {
      await AsyncStorage.setItem('@current_hotel', hotelId);
    } else {
      await AsyncStorage.removeItem('@current_hotel');
    }
  } catch (error) {
    console.error('Error setting current hotel:', error);
  }
};