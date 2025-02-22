import { Text } from "@/components/ui/text";
import { useUser, useAuth } from "@clerk/clerk-expo";
import { useClerk } from "@clerk/clerk-expo";
import { useUserStorage } from "@/hooks/useUserStorage";
import { router } from "expo-router";
import * as React from "react";
import { useState, useEffect, useRef } from "react";
import {
  Alert,
  Pressable,
  View,
  ActivityIndicator,
  useColorScheme,
  TextInput,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { getUserByClerkId, updateUserRole, createUser } from "@lib/api";
import { Feather } from "@expo/vector-icons";
import { navigateTo } from "@/lib/actions/navigation";
import { z } from "zod";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";
import { APP_NAME } from "@/lib/constants";
import useBookingStore from "@/lib/store/bookingStore";
import { useHotelStore } from "@/lib/store/hotelStore";
import { getCurrentBookingOfUser } from "@/lib/api/bookings";
import { processCode } from "@/lib/actions/processCode";

const phoneSchema = z.string().regex(/^[6-9]\d{9}$/, {
  message: "Please enter a valid 10-digit phone number starting with 6-9",
});

type FeatureIcon = "smartphone" | "key" | "bell" | "coffee";

interface Feature {
  icon: FeatureIcon;
  title: string;
  description: string;
}

const features: Feature[] = [
  {
    icon: "smartphone",
    title: "Easy Booking",
    description: "Book your perfect stay in just a few taps",
  },
  {
    icon: "key",
    title: "Digital Keys",
    description: "Access your room with your phone",
  },
  {
    icon: "bell",
    title: "Real-time Updates",
    description: "Get instant notifications about your stay",
  },
  {
    icon: "coffee",
    title: "Room Service",
    description: "Order food and services directly from the app",
  },
];

const Onboarding = () => {
  const { signOut } = useClerk();
  const { storeUserData, getUserData } = useUserStorage();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const scrollViewRef = useRef(null);
  const [currentFeature, setCurrentFeature] = useState(0);
  const [isInitialCheck, setIsInitialCheck] = useState(true);

  const user = useUser();
  const { getToken, userId } = useAuth();

  const initializeBookingStore = useBookingStore(
    (state) => state.initializeFromStorage
  );
  const initializeHotelStore = useHotelStore(
    (state) => state.initializeFromStorage
  );
  const setCurrentBooking = useBookingStore((state) => state.setCurrentBooking);

  useEffect(() => {
    const initializeUser = async () => {
      if (!user.isLoaded) return;

      if (!user.user) {
        router.replace("/(auth)/sign-in");
        return;
      }

      // Set initial name from user data
      if (user.user?.firstName || user.user?.externalAccounts[0]?.firstName) {
        setName(
          `${
            user.user?.firstName || user.user?.externalAccounts[0]?.firstName
          } ${
            user.user?.lastName ||
            user.user?.externalAccounts[0]?.lastName ||
            ""
          }`
        );
      }

      if (isInitialCheck) {
        await checkOnboardingStatus();
        setIsInitialCheck(false);
      }
    };

    initializeUser();
  }, [user.isLoaded, isInitialCheck]);

  // Auto-scroll feature carousel
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentFeature((prev) => (prev + 1) % features.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const validatePhone = (value: string) => {
    try {
      phoneSchema.parse(value);
      setPhoneError("");
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        setPhoneError(error.errors[0].message);
      } else {
        setPhoneError("Invalid phone number");
      }
      return false;
    }
  };

  const checkOnboardingStatus = async () => {
    if (!user.user?.id) return;

    try {
      setIsLoading(true);
      console.log("Checking onboarding status for clerkId:", user.user.id);

      const token = await getToken();
      if (!token) {
        console.error("No auth token available");
        return;
      }

      // First check if user exists in DB
      const dbUser = await getUserByClerkId(user.user.id, token);
      console.log("DB User response:", dbUser);

      if (dbUser && !dbUser.error) {

        // Check for current booking using DB user ID
        const currentBooking = await getCurrentBookingOfUser(dbUser.id, token);

        if (currentBooking && !currentBooking.error) {
          // Store the current booking
          console.log("Found a current booking, setting it");
          await setCurrentBooking(currentBooking);

          // Process hotel code to set up hotel data if booking exists
          if (currentBooking.hotel?.code) {
            await processCode({
              code: currentBooking.hotel.code,
              token,
              getToken,
              getUserData,
              forceRefetch: true,
            });
          }
        }

        // Store user data and redirect
        await storeUserData({
          userId: dbUser.id.toString(),
          name: dbUser.name,
          email: dbUser.email,
          phone: dbUser.phoneNumber,
          clerkId: dbUser.clerkId,
          isOnboarded: true,
          currentStay: {
            hotelId: dbUser.hotelId || "",
            hotelCode: dbUser.hotelCode || "",
            hotelName: dbUser.hotelName || "",
          },
          role: dbUser.role,
        });
        router.replace("/");
        return;
      }

      // Then check local storage
      const userData = await getUserData();
      console.log("Local storage user data:", userData);

      if (userData?.isOnboarded) {
        console.log("User is onboarded in local storage, redirecting");
        router.replace("/");
        return;
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

    if (!validatePhone(phone)) {
      return;
    }

    if (!phone || !name) {
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
        clerkId: user.user.id,
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
        const roleResponse = await updateUserRole(
          user.user.id,
          "CUSTOMER",
          token
        );
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
          hotelName: "",
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
      <SafeAreaView className="flex-1 justify-center items-center">
        <View className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg">
          <ActivityIndicator size="large" color="#0284c7" />
          <Text className="mt-4 text-gray-600 dark:text-gray-300 text-center">
            Setting up your profile...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View className="flex-1">
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Feature Showcase */}
        <View className="h-[45vh] bg-blue-500 dark:bg-blue-600 p-6 relative w-screen">
          <View className="absolute inset-0 justify-center items-center">
            <View className="grid  gap-6 flex-wrap items-center">
              {Array.from({ length: 132 }).map((_, index) => (
                <View
                  key={index}
                  className="w-4 h-4 bg-white/5 rounded-full "
                />
              ))}
            </View>
          </View>
          <Animated.View
            entering={FadeInUp}
            className="flex-1 justify-center items-center z-10"
          >
            <View className="w-16 h-16 bg-white/20 rounded-full items-center justify-center mb-6">
              <Feather
                name={features[currentFeature].icon}
                size={32}
                color="white"
              />
            </View>
            <Text className="text-white text-2xl font-bold text-center mb-2">
              {features[currentFeature].title}
            </Text>
            <Text className="text-white/80 text-center text-lg">
              {features[currentFeature].description}
            </Text>
          </Animated.View>
        </View>

        {/* Welcome Message */}
        <View className="px-6 py-8">
          <Text className="text-3xl font-bold dark:text-white text-black text-center">
            Welcome to {APP_NAME}
          </Text>
          <Text className="text-gray-500 dark:text-gray-400 text-center mt-2">
            Let's get started with your profile
          </Text>
        </View>

        {/* Simple Form */}
        <View className="px-6">
          <Animated.View
            entering={FadeInDown.delay(200)}
            className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-md flex gap-2"
          >
            <View className="">
              <Text className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Your Name
              </Text>
              <TextInput
                placeholder="Enter your name"
                value={name}
                onChangeText={setName}
                className="dark:text-white text-black p-4 rounded-xl border-2 border-gray-200 dark:border-gray-600 bg-transparent"
              />
            </View>

            <View className="mb-6">
              <Text className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Phone Number
              </Text>
              <TextInput
                placeholder="Enter 10-digit phone number"
                value={phone}
                onChangeText={(value) => {
                  setPhone(value);
                  validatePhone(value);
                }}
                keyboardType="phone-pad"
                maxLength={10}
                className="dark:text-white text-black p-4 rounded-xl border-2 border-gray-200 dark:border-gray-600 bg-transparent"
              />
              {phoneError && (
                <Text className="text-red-500 text-sm mt-1">{phoneError}</Text>
              )}
            </View>

            <Pressable
              onPress={handleOnboardingSubmit}
              className="bg-blue-500 rounded-xl overflow-hidden"
            >
              <View className="px-6 py-4 flex-row items-center justify-center">
                <Text className="text-white font-semibold text-lg mr-2">
                  Continue
                </Text>
                <Feather name="arrow-right" size={20} color="white" />
              </View>
            </Pressable>
          </Animated.View>

          <Text className="text-center text-gray-500 dark:text-gray-400 mt-6 text-sm px-4">
            By continuing, you agree to our{" "}
            <Text
              className="text-blue-500"
              onPress={() => navigateTo("/terms")}
            >
              Terms
            </Text>{" "}
            and{" "}
            <Text
              className="text-blue-500"
              onPress={() => navigateTo("/privacy")}
            >
              Privacy Policy
            </Text>
          </Text>
        </View>
      </ScrollView>
    </View>
  );
};

export default Onboarding;
