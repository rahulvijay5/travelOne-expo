import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Text } from "@/components/ui/text";
import { useUser, useAuth } from "@clerk/clerk-expo";
import { useClerk } from "@clerk/clerk-expo";
import { useUserStorage } from "@/hooks/useUserStorage";
import { router } from "expo-router";
import * as React from "react";
import { useState, useEffect } from "react";
import { Alert, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { getUserByClerkId, updateUserRole, createUser } from "@lib/api";

const onboarding = () => {
  const { signOut } = useClerk();
  const { storeUserData, getUserData } = useUserStorage();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const user = useUser();
  const { getToken } = useAuth();
  
  useEffect(() => {
    if (!user.isLoaded) return;
    
    if (!user.user) {
      router.replace("/(auth)/sign-in");
      return;
    }
    
    checkOnboardingStatus();
  }, [user.isLoaded]);

  const checkOnboardingStatus = async () => {
    if (!user.user?.id) return;
    
    try {
      setIsLoading(true);
      
      console.log("Checking onboarding status for clerkId:", user.user.id);

      const token = await getToken();
      if (!token) {
        console.error("No auth token available");
        setIsLoading(false);
        return;
      }
      
      // First check if user exists in DB
      try {
        const dbUser = await getUserByClerkId(user.user.id, token);
        console.log("DB User response:", dbUser);
        
        // If there's an error or user not found, just continue with onboarding
        if (dbUser.error === "User not found") {
          console.log("User not found in DB, continuing with onboarding");
          setIsLoading(false);
          return;
        }

        if (dbUser && dbUser.id) {
          console.log("User exists in DB, storing data and redirecting");
          await storeUserData({
            userId: dbUser.id.toString(),
            name: dbUser.name,
            email: dbUser.email,
            phone: dbUser.phoneNumber,
            clerkId: dbUser.clerkId,
            isOnboarded: true,
            currentStay: {
              hotelId: dbUser.hotelId,
              hotelCode: dbUser.hotelCode,
              hotelName: dbUser.hotelName
            },
            role: dbUser.role,
          });
          router.replace("/");
          return;
        }
      } catch (error) {
        console.error("Error checking user in DB:", error);
        // Don't throw here, continue checking local storage
      }

      // Then check local storage
      try {
        const userData = await getUserData();
        console.log("Local storage user data:", userData);

        if (userData?.isOnboarded) {
          console.log("User is onboarded in local storage, redirecting");
          router.replace("/");
          return;
        }
      } catch (storageError) {
        console.error("Error reading from local storage:", storageError);
      }
      
      // If we get here, user needs to be onboarded
      setIsLoading(false);
    } catch (error) {
      console.error("Error in checkOnboardingStatus:", error);
      setIsLoading(false);
    }
  };

  const handleOnboardingSubmit = async () => {
    if (!user.user?.id) {
      Alert.alert("Error", "Not authenticated");
      return;
    }

    if (!phone || !name || !user.user?.emailAddresses[0]?.emailAddress) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    try {
      setIsLoading(true);
      const email = user.user.emailAddresses[0].emailAddress;
      const token = await getToken();
      if (!token) {
        Alert.alert("Error", "Authentication failed");
        return;
      }

      console.log("Creating user with data:", {
        phone,
        email,
        name,
        clerkId: user.user.id
      });

      const userData = await createUser(
        phone,
        email,
        name,
        "CUSTOMER",
        user.user.id,
        token
      );

      console.log("User created:", userData);

      try {
        const roleResponse = await updateUserRole(user.user.id, "CUSTOMER", token);
        console.log("Role update response:", roleResponse);
      } catch (roleError) {
        console.error("Error updating role, but user was created:", roleError);
      }

      // Store user data in secure storage
      await storeUserData({
        userId: userData.id.toString(),
        name,
        email,
        phone,
        clerkId: user.user.id,
        isOnboarded: true,
        currentStay: {
          hotelId: "",
          hotelCode: "",
          hotelName: ""
        },
        role: "CUSTOMER",
      });

      Alert.alert("Success", "Account created successfully!");
      router.replace("/");
    } catch (error: any) {
      // console.error("Error in handleOnboardingSubmit:", error);
      if (error.message === "User with this phone number already exists") {
        Alert.alert("Error", "This phone number is already registered with us");
        setPhone("");
      } else {
        Alert.alert("Error", "Failed to create account. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 p-4 gap-2 flex items-center justify-center h-screen">
        <Text>Loading...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 p-4 gap-2">
      <Text className="text-2xl font-semibold dark:text-white text-black text-center my-2">Onboarding</Text>
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
      <Pressable
        onPress={handleOnboardingSubmit}
        className="mt-4 border-2 border-gray-300 bg-yellow-200 flex items-center justify-center"
      >
        <Text className="text-lg font-bold p-4 flex items-center justify-center">
          Submit
        </Text>
      </Pressable>

      <Pressable
        onPress={() => router.push("/(auth)/sign-in")}
        className="mt-4 border-2 border-gray-300 bg-yellow-200 flex items-center justify-center"
      >
        <Text className="text-lg font-bold p-4 ">SignIn</Text>
      </Pressable>
      <Pressable
        onPress={() => signOut()}
        className="mt-4 border-2 border-gray-300 bg-yellow-200 flex items-center justify-center"
      >
        <Text className="text-lg font-bold p-4 ">SignOut</Text>
      </Pressable>
    </SafeAreaView>
  );
};

export default onboarding;
