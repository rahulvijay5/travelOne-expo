import { View } from 'react-native'
import { Button } from '@/components/ui/button'
import { Text } from '@/components/ui/text'
import React, { useEffect, useState } from 'react'
import { useUserStorage } from '@/hooks/useUserStorage';
import { router } from 'expo-router';

const NewHotelButton = () => {
  const { getUserData } = useUserStorage();
  const [isOwner, setIsOwner] = useState(false);

  useEffect(() => {
    const checkUserRole = async () => {
      const userStore = await getUserData();
      if (userStore && userStore.role === "OWNER") {
        setIsOwner(true);
      }
    };
    checkUserRole();
  }, []);

  if (!isOwner) return null;

  return (
    <Button onPress={() => router.push("/(extras)/newhotel")} className="mt-16">
      <Text className="text-lg font-bold mb-4 dark:text-white">
        New Hotel
      </Text>
    </Button>
  );
};

export default NewHotelButton