// export const API_URL = process.env.EXPO_PUBLIC_API_URL;
// export const APP_URL = process.env.EXPO_PUBLIC_APP_URL;
// export const CLERK_KEY = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY
// export const SECURITY_KEY = process.env.EXPO_PUBLIC_SECURITY_KEY;

import Constants from 'expo-constants';

export const API_URL = Constants.expoConfig?.extra?.API_URL || '';
export const APP_URL = Constants.expoConfig?.extra?.APP_URL || '';
export const CLERK_KEY = Constants.expoConfig?.extra?.CLERK_KEY || '';
export const SECURITY_KEY = Constants.expoConfig?.extra?.SECURITY_KEY || '';