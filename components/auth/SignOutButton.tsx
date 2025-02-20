import { View, Text, TouchableOpacity, Pressable, useColorScheme } from "react-native";
import React from "react";
import { useClerk, useUser } from "@clerk/clerk-expo";
import { useUserStorage } from "@/hooks/useUserStorage";
import { router } from "expo-router";
import { Button } from "../ui/button";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LogOutIcon } from "lucide-react-native";
import { useHotelStore } from "@/lib/store/hotelStore";
const SignOutButton = ({
  isLogoButton = false,
}: {
  isLogoButton?: boolean;
}) => {
  const { signOut } = useClerk();
  const { clearUserData } = useUserStorage();
  const colorScheme  = useColorScheme();
  const isColorSchemeDark = colorScheme === "dark";
  const { clearCurrentHotel } = useHotelStore();
  const handleSignOut = async () => {
    try {
      await clearUserData();
      await clearCurrentHotel();
      await signOut(); // Sign out from Clerk
      router.replace("/(auth)/sign-in");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };
  if (isLogoButton) {
    return (
      <View className="flex justify-center items-center">
        <Pressable
          onPress={handleSignOut}
          className="dark:bg-red-500 bg-red-300 w-fit  border-red-500 p-3 rounded-lg"
        >
          <Text className="dark:text-white text-center text-black font-semibold">
            <LogOutIcon size={24} color={isColorSchemeDark ? "white" : "black"}/>
          </Text>
        </Pressable>
      </View>
    );
  }
  return (
    <View className="flex justify-center items-center">
      <Pressable
        onPress={handleSignOut}
        className="dark:bg-red-800 bg-red-500 w-fit shadow-sm shadow-red-500/50  p-3 rounded-lg"
      >
        <Text className="text-white text-center font-semibold">
          Sign Out
        </Text>
      </Pressable>
    </View>
  );
};

export default SignOutButton;
