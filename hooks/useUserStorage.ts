import { User, UserData } from '@/types';
import * as SecureStore from 'expo-secure-store';

const USER_STORAGE_KEY = 'user_data';

export const useUserStorage = () => {
  const storeUserData = async (data: Partial<UserData>) => {
    try {
      let existingData: Partial<UserData> = {};
      
      try {
        const stored = await SecureStore.getItemAsync(USER_STORAGE_KEY);
        if (stored) {
          existingData = JSON.parse(stored);
        }
      } catch (parseError) {
        console.error('Error parsing existing user data:', parseError);
        // Continue with empty existing data if parse fails
      }
      
      const newData = {
        ...existingData,
        ...data,
        userId: data.userId?.toString() || existingData.userId,
        lastUpdated: new Date().toISOString(),
      };

      const stringifiedData = JSON.stringify(newData);
      console.log('Storing data:', stringifiedData);
      
      await SecureStore.setItemAsync(USER_STORAGE_KEY, stringifiedData);
      return true;
    } catch (error) {
      console.error('Error storing user data:', error);
      return false;
    }
  };

 const getUserData = async (): Promise<UserData | null> => {
    try {
      const data = await SecureStore.getItemAsync(USER_STORAGE_KEY);
      
      if (!data) return null;
      
      try {
        if (data.startsWith('<')) {
          console.error('Invalid data format received');
          return null;
        }
        
        const parsedData = JSON.parse(data);
        if (parsedData?.userId) {
          parsedData.userId = parsedData.userId.toString();
        }
        return parsedData;
      } catch (parseError) {
        console.error('Error parsing user data:', parseError);
        return null;
      }
    } catch (error) {
      console.error('Error getting user data:', error);
      return null;
    }
  };

  const clearUserData = async () => {
    try {
      await SecureStore.deleteItemAsync(USER_STORAGE_KEY);
      return true;
    } catch (error) {
      console.error('Error clearing user data:', error);
      return false;
    }
  };

  const updateUserData = async (data: Partial<UserData>) => { 
    const userData = await getUserData();
    if (userData) {
      await storeUserData({ ...userData, ...data });
    }
  };

  return {
    storeUserData,
    getUserData,
    clearUserData,
    updateUserData,
  };
}; 