import { View, Text, TouchableOpacity, Pressable } from "react-native";
import React from "react";
import { useClerk, useUser } from "@clerk/clerk-expo";
import { useUserStorage } from "@/hooks/useUserStorage";
import { router } from "expo-router";
import { Button } from "../ui/button";

const SignOutButton = () => {
  const { signOut } = useClerk();
  const { clearUserData } = useUserStorage();

  const handleSignOut = async () => {
    try {
      await clearUserData();
      await signOut(); // Sign out from Clerk
      router.replace("/(auth)/sign-in");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };
  return (
    <Button onPress={handleSignOut} className="bg-red-500 border p-4 rounded-lg">
      <Text className="dark:text-white text-black font-semibold">Sign Out</Text>
    </Button>
  );
};

export default SignOutButton;
