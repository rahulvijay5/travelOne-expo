import { router } from 'expo-router';

export const navigateTo = (pathname: string, params?: Record<string, any>) => {
  router.push({ pathname, params });
};

export const navigateBack = () => {
  router.back();
};