import { View, ActivityIndicator, Pressable } from "react-native";
import React, { useEffect } from "react";
import PreviousBookings from "@/components/bookings/PreviousBookings";
import { navigateTo } from "@/lib/actions/navigation";
import { getUserProfile } from "@/lib/api";
import { useUserStorage } from "@/hooks/useUserStorage";
import { useAuth } from "@clerk/clerk-expo";
import { useState } from "react";
import { BookingDataInDb } from "@/types/booking";
import { Nullable } from "@/types";
import { Text } from "@/components/ui/text";
import { Calendar } from "lucide-react-native";

const PreviousBookingsPage = () => {
  const { getUserData } = useUserStorage();
  const { getToken } = useAuth();
  const [bookings, setBookings] = useState<BookingDataInDb[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<Nullable<string>>(null);
  const [error, setError] = useState<Nullable<string>>(null);

  useEffect(() => {
    const fetchUserId = async () => {
      const userData = await getUserData();
      if (userData) {
        setUserId(userData.userId);
      } else {
        navigateTo("/not-authenticated");
      }
    };
    fetchUserId();
  }, []);

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!userId) return;
      
      setLoading(true);
      setError(null);
      
      try {
        const token = await getToken();
        if (!token) {
          navigateTo("/not-authenticated");
          return;
        }
        const profile = await getUserProfile(userId, token);
        console.log("User profile:", profile);
        
        if (profile && profile.bookings) {
          setBookings(profile.bookings);
        } else {
          setBookings([]);
        }
      } catch (error) {
        console.error("Error fetching profile:", error);
        setError("Failed to load your bookings. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, [userId]);

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center p-4">
        <ActivityIndicator size="large" color="#0284c7" />
        <Text className="mt-4 text-gray-600 dark:text-gray-300">
          Loading your bookings...
        </Text>
      </View>
    );
  }

  if (error) {
    return (
      <View className="flex-1 justify-center items-center p-4">
        <Text className="text-red-500 text-center mb-4">{error}</Text>
        <Pressable 
          onPress={() => setUserId(userId)}
          className="bg-blue-500 px-4 py-2 rounded-lg"
        >
          <Text className="text-white">Try Again</Text>
        </Pressable>
      </View>
    );
  }

  if (bookings.length === 0) {
    return (
      <View className="flex-1 justify-center items-center p-4">
        <Calendar size={48} color="#9ca3af" />
        <Text className="text-lg font-semibold mt-4 mb-2 text-center dark:text-white">
          No Previous Bookings
        </Text>
        <Text className="text-gray-600 dark:text-gray-300 text-center">
          You haven't made any bookings yet. Start exploring hotels to make your first booking!
        </Text>
      </View>
    );
  }

  return (
    <View className="flex-1 p-4">
      <PreviousBookings bookings={bookings} title="" />
    </View>
  );
};

export default PreviousBookingsPage;
