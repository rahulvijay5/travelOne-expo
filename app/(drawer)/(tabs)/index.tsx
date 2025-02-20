import { useEffect, useState } from "react";
import {
  View,
  Text,
  Dimensions,
  Pressable,
  ActivityIndicator,
} from "react-native";
import { useColorScheme } from "@/lib/useColorScheme";
import { useUserStorage } from "@/hooks/useUserStorage";
import { router, useLocalSearchParams } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { HotelDetails } from "@/types";
import { useAuth } from "@clerk/clerk-expo";
import { getHotelById, getHotelRooms } from "@lib/api";
import HotelView from "@/components/HotelView";
import { useHotelStore } from "@/lib/store/hotelStore";

const { width } = Dimensions.get("window");

export default function HomeScreen() {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { isDarkColorScheme } = useColorScheme();
  const { getUserData, storeUserData } = useUserStorage();
  const [UserIsManager, setUserIsManager] = useState(false);
  const { getToken } = useAuth();
  const params = useLocalSearchParams();
  const { currentHotel, setCurrentHotel } = useHotelStore();

  useEffect(() => {
    loadCurrentHotel();
  }, []); // Run on initial load

  // Separate effect for handling param changes
  useEffect(() => {
    if (params?.hotelId) {
      loadCurrentHotel();
    }
  }, [params?.hotelId]);

  const loadCurrentHotel = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const userData = await getUserData();
      const user = userData;

      if (user?.role === "MANAGER" || user?.role === "OWNER") {
        setUserIsManager(true);
      }

      // Check onboarding first
      const hasOnboardingCompleted = userData?.isOnboarded;
      if (!hasOnboardingCompleted) {
        router.push("/onboarding");
        return;
      }

      // If we have a hotelId in params, load that specific hotel
      const hotelIdParam = params?.hotelId as string | undefined;
      if (hotelIdParam) {
        const token = await getToken();
        if (token) {
          const hotelDetails = await getHotelById(hotelIdParam, token);
          if (hotelDetails) {
            // Get rooms data if user is owner or manager
            if (user?.role === "OWNER" || user?.role === "MANAGER") {
              const rooms = await getHotelRooms(hotelIdParam, token);
              if (rooms && !rooms.error) {
                await AsyncStorage.setItem(
                  "@current_hotel_rooms",
                  JSON.stringify({
                    hotelId: hotelIdParam,
                    rooms: rooms.data || rooms,
                  })
                );
              }
            }

            await storeUserData({
              currentStay: {
                hotelId: hotelDetails.id,
                hotelCode: hotelDetails.code,
                hotelName: hotelDetails.hotelName,
              },
            });
            setCurrentHotel(hotelDetails);
            setIsLoading(false);
            return;
          }
        }
      }

      // If no hotelId in params or failed to load specific hotel,
      // try to load from current stay
      if (!userData?.currentStay) {
        setIsLoading(false);
        return;
      }

      // Try to load hotel details from storage
      const hotelDetails = await AsyncStorage.getItem("@current_hotel_details");
      if (!hotelDetails) {
        await storeUserData({ currentStay: undefined });
        setIsLoading(false);
        return;
      }

      try {
        const parsedHotel = JSON.parse(hotelDetails);
        if (!parsedHotel.id || !parsedHotel.hotelName) {
          throw new Error("Invalid hotel data");
        }

        // If we have a parsedHotel but it doesn't have rules, fetch them
        if (
          !parsedHotel.rules &&
          (user?.role === "OWNER" || user?.role === "MANAGER")
        ) {
          const token = await getToken();
          if (token) {
            const completeHotelDetails = await getHotelById(
              parsedHotel.id,
              token
            );
            if (completeHotelDetails) {
              setCurrentHotel(completeHotelDetails);
              return;
            }
          }
        }

        setCurrentHotel(parsedHotel);
      } catch (parseError) {
        console.error("Error parsing hotel data:", parseError);
        setError("Invalid hotel data. Please scan the QR code again.");
        await storeUserData({ currentStay: undefined });
      }
    } catch (error) {
      console.error("Error loading hotel details:", error);
      setError("Failed to load hotel details. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator
          size="large"
          color={isDarkColorScheme ? "#84cc16" : "#65a30d"}
        />
        <Text className="mt-4 text-lg dark:text-white text-black">
          Loading hotel details...
        </Text>
      </View>
    );
  }

  if (error) {
    return (
      <View className="flex-1 items-center justify-center p-4 gap-4">
        <Text className="text-red-500 text-center mb-4">{error}</Text>
        <Pressable
          onPress={() => router.push("/scanqr")}
          className="dark:bg-lime-500 bg-lime-300 h-56 w-56 rounded-full shadow-md shadow-black/50"
        >
          <Text className="text-2xl font-bold">Scan QR Code</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View className="flex-1">
      <HotelView currentHotel={currentHotel} UserIsManager={UserIsManager} />
    </View>
  );
}
