import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Text } from "@/components/ui/text";
import { useSignIn, useUser } from "@clerk/clerk-expo";
import { useClerk } from "@clerk/clerk-expo";
import { useUserStorage } from "@/hooks/useUserStorage";
import { router } from "expo-router";
import * as React from "react";
import { useState, useEffect } from "react";
import { Alert, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import api from "@/lib/api";

const onboarding = () => {
  const { signOut } = useClerk();
  const { storeUserData, getUserData } = useUserStorage();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const user = useUser();
  if(!user){
    router.replace("/(auth)/sign-in");
    return null;
  }
  const clerkId = user.user?.id || '';

  useEffect(() => {
    checkOnboardingStatus();
  }, []);

  const checkOnboardingStatus = async () => {
    try {
      const userData = await getUserData();
      if (userData?.isOnboarded) {
        router.replace("/");
        return;
      }
      setIsLoading(false);
    } catch (error) {
      console.error("Error checking onboarding status:", error);
      setIsLoading(false);
    }
  };

  const handleOnboardingSubmit = async () => {
    if (!phone || !name || !user?.user?.emailAddresses[0]?.emailAddress) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    try {
      const email = user.user.emailAddresses[0].emailAddress;
      
      await api.createUser(phone, email, name, "CUSTOMER", clerkId);
      
      // Store user data in secure storage
      await storeUserData({
        name,
        email,
        phone,
        clerkId,
        isOnboarded: true,
        currentStay: "",
        role: "CUSTOMER"
      });

      Alert.alert("Success", "Account created successfully!");
      router.replace("/");
    } catch (error: any) {
      console.error(error);
      if (error.message === "User with this phone number already exists") {
        Alert.alert("Error", "This phone number is already registered with us");
      } else {
        Alert.alert("Error", "Failed to create account. Please try again.");
      }
    }
  };

  if (!user) {
    router.replace("/");
    return null;
  }

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 p-4 gap-2">
        <Text>Loading...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 p-4 gap-2">
      <Text>Onboarding</Text>
      <Input
        placeholder="Enter your name"
        value={name}
        onChangeText={setName}
        className="dark:text-white text-black p-4 rounded-lg border-2 border-gray-300"
      />
      <Text className="dark:text-white text-gray-500 p-4 rounded-lg border border-gray-300">
        {user?.user?.emailAddresses[0].emailAddress}
      </Text>
      <Input
        placeholder="Enter your phone number"
        value={phone}
        onChangeText={setPhone}
        className="dark:text-white text-black p-4 rounded-lg border-2 border-gray-300"
      />
      <Button
        onPress={handleOnboardingSubmit}
        className="mt-4 border-2 border-gray-300 bg-yellow-200 flex items-center justify-center"
      >
        <Text className="text-lg font-bold p-4 dark:text-white flex items-center justify-center">
          Submit
        </Text>
      </Button>

      <Button
        onPress={() => router.push("/(auth)/sign-in")}
        className="mt-4 border-2 border-gray-300 bg-yellow-200 flex items-center justify-center"
      >
        <Text className="text-lg font-bold p-4 dark:text-white">SignIn</Text>
      </Button>
      <Button
        onPress={() => signOut()}
        className="mt-4 border-2 border-gray-300 bg-yellow-200 flex items-center justify-center"
      >
        <Text className="text-lg font-bold p-4 dark:text-white">SignOut</Text>
      </Button>
    </SafeAreaView>
  );
};

export default onboarding;
