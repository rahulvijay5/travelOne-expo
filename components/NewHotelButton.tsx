import { Pressable, View } from 'react-native'
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
    <Pressable onPress={() => router.push("/newhotel")} className=" bg-blue-500 w-full p-3 rounded-lg">
      <Text className="text-lg font-bold text-white text-center">
        New Hotel
      </Text>
    </Pressable>
  );
};

export default NewHotelButton