import { View, ScrollView } from 'react-native';
import React, { useEffect, useState } from 'react';
import { Text } from '@/components/ui/text';
import { Button } from '@/components/ui/button';
import { useUserStorage } from '@/hooks/useUserStorage';
import { useAuth } from '@clerk/clerk-expo';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Separator } from '@/components/ui/separator';
import { router } from 'expo-router';
import Feather from "@expo/vector-icons/Feather";
import SignOutButton from '@/components/auth/SignOutButton';

export default function ProfileScreen() {
  const { getUserData } = useUserStorage();
  const [userData, setUserData] = useState<any>(null);
  const { isSignedIn } = useAuth();

  useEffect(() => {
    const loadUserData = async () => {
      const data = await getUserData();
      setUserData(data);
    };
    loadUserData();
  }, []);

  if (!isSignedIn) {
    router.replace('/sign-in');
    return null;
  }

  const getRoleDisplay = (role: string) => {
    switch (role?.toUpperCase()) {
      case 'OWNER':
        return 'Hotel Owner';
      case 'MANAGER':
        return 'Hotel Manager';
      case 'USER':
        return 'Traveler';
      default:
        return role;
    }
  };

  return (
    <ScrollView className="flex-1 p-4">
      {/* User Info Section */}
      <View className="bg-lime-100 dark:bg-lime-950 p-6 rounded-xl mb-6">
        <Text className="text-2xl font-bold mb-2 dark:text-white">
          {userData?.name}
        </Text>
        <Text className="text-lg text-gray-600 dark:text-gray-300">
          {userData?.email}
        </Text>
        <View className="mt-2 bg-lime-200 dark:bg-lime-900 px-3 py-1 rounded-full self-start">
          <Text className="text-lime-800 dark:text-lime-200 font-medium">
            {getRoleDisplay(userData?.role)}
          </Text>
        </View>
      </View>

      {/* Quick Actions */}
      <Text className="text-xl font-bold mb-4 dark:text-white">Quick Actions</Text>
      <View className=" flex gap-2">
        <Button
          className="flex-row items-center justify-start py-4 pl-4 bg-lime-100 dark:bg-lime-950 rounded-xl"
          onPress={() => router.push('/scanqr')}
        >
          <Feather name="camera" size={24} color="#84cc16" />
          <Text className="ml-3 font-semibold dark:text-white text-lg">
            Scan QR Code
          </Text>
        </Button>

        {userData?.role === 'USER' && (
          <Button
            className="flex-row items-center justify-start py-4 pl-4 bg-lime-100 dark:bg-lime-950 rounded-xl"
            onPress={() => router.push('/bookings')}
          >
            <Feather name="book" size={24} color="#84cc16" />
            <Text className="ml-3 font-semibold dark:text-white text-lg">
              My Bookings
            </Text>
          </Button>
        )}

        {(userData?.role === 'OWNER' || userData?.role === 'MANAGER') && (
          <>
            <Button
              className="flex-row items-center justify-start py-4 pl-4 bg-lime-100 dark:bg-lime-950 rounded-xl"
              onPress={() => router.push('/createBookingByManager')}
            >
              <Feather name="plus-circle" size={24} color="#84cc16" />
              <Text className="ml-3 font-semibold dark:text-white text-lg">
                Create Booking
              </Text>
            </Button>
            <Button
              className="flex-row items-center justify-start py-4 pl-4 bg-lime-100 dark:bg-lime-950 rounded-xl"
              onPress={() => router.push('/bookings')}
            >
              <Feather name="list" size={24} color="#84cc16" />
              <Text className="ml-3 font-semibold dark:text-white text-lg">
                Manage Bookings
              </Text>
            </Button>
          </>
        )}

        {userData?.role === 'OWNER' && (
          <Button
            className="flex-row items-center justify-start py-4 pl-4 bg-lime-100 dark:bg-lime-950 rounded-xl"
            onPress={() => router.push('/ownedHotels')}
          >
            <Feather name="home" size={24} color="#84cc16" />
            <Text className="ml-3 font-semibold dark:text-white text-lg">
              My Hotels
            </Text>
          </Button>
        )}
      </View>

      {/* Settings */}
      <View className="mt-6">
        <Text className="text-xl font-bold mb-4 dark:text-white">Settings</Text>
        <View className="space-y-4 flex gap-2">
          <View className="flex-row items-center justify-between bg-lime-100 dark:bg-lime-950 p-4 rounded-xl">
            <Text className="text-lg font-medium dark:text-white">Theme</Text>
            <ThemeToggle />
          </View>
          
          {/* <Button
            className="flex-row items-center justify-start py-4 pl-4 bg-lime-100 dark:bg-lime-950 rounded-xl"
            onPress={() => router.push('/onboarding')}
          >
            <Feather name="help-circle" size={24} color="#84cc16" />
            <Text className="ml-3 font-semibold dark:text-white text-lg">
              View Onboarding
            </Text>
          </Button> */}

          <Button
            className="flex-row items-center justify-start py-4 pl-4 bg-lime-100 dark:bg-lime-950 rounded-xl"
            onPress={() => router.push('/terms')}
          >
            <Feather name="file-text" size={24} color="#84cc16" />
            <Text className="ml-3 font-semibold dark:text-white text-lg">
              Terms & Conditions
            </Text>
          </Button>

          <Button
            className="flex-row items-center justify-start py-4 pl-4 bg-lime-100 dark:bg-lime-950 rounded-xl"
            onPress={() => router.push('/privacy')}
          >
            <Feather name="shield" size={24} color="#84cc16" />
            <Text className="ml-3 font-semibold dark:text-white text-lg">
              Privacy Policy
            </Text>
          </Button>
        </View>
      </View>

      {/* Sign Out */}
      <View className="mt-6 mb-10">
        <SignOutButton />
      </View>
    </ScrollView>
  );
}