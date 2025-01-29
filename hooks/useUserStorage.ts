import * as SecureStore from 'expo-secure-store';

interface UserData {
  name: string;
  email: string;
  phone: string;
  clerkId: string;
  isOnboarded: boolean;
  currentStay: string;
  role: string;
  lastUpdated: string;
}

const USER_STORAGE_KEY = 'user_data';

export const useUserStorage = () => {
  const storeUserData = async (data: Partial<UserData>) => {
    try {
      const existingData = await SecureStore.getItemAsync(USER_STORAGE_KEY);
      const currentData = existingData ? JSON.parse(existingData) : {};
      
      const newData = {
        ...currentData,
        ...data,
        lastUpdated: new Date().toISOString(),
      };

      await SecureStore.setItemAsync(USER_STORAGE_KEY, JSON.stringify(newData));
      return true;
    } catch (error) {
      console.error('Error storing user data:', error);
      return false;
    }
  };

  const getUserData = async (): Promise<UserData | null> => {
    try {
      const data = await SecureStore.getItemAsync(USER_STORAGE_KEY);
      return data ? JSON.parse(data) : null;
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

  return {
    storeUserData,
    getUserData,
    clearUserData,
  };
}; 