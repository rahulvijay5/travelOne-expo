import { View, ScrollView, Image, Pressable } from "react-native";
import React, { useEffect, useState } from "react";
import { Text } from "@/components/ui/text";
import { getUserProfile } from "@/lib/api/users";
import { useLocalSearchParams, router } from "expo-router";
import { useAuth } from "@clerk/clerk-expo";
import { navigateTo } from "@/lib/actions/navigation";
import { format } from "date-fns";
import { Feather } from "@expo/vector-icons";
import { useColorScheme } from "nativewind";

const UserProfile = () => {
  const { userId } = useLocalSearchParams();
  const { getToken } = useAuth();
  const [userProfile, setUserProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        setLoading(true);
        const token = await getToken();
        if (!token) {
          navigateTo("/not-authenticated");
          return;
        }
        const profile = await getUserProfile(userId as string, token);
        console.log("userProfile", profile);
        setUserProfile(profile);
      } catch (error) {
        console.error("Error fetching profile:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchUserProfile();
  }, [userId]);

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center">
        <Text className="text-lg dark:text-white">Loading profile...</Text>
      </View>
    );
  }

  if (!userProfile) {
    return (
      <View className="flex-1 justify-center items-center">
        <Text className="text-lg dark:text-white">User not found</Text>
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-white dark:bg-gray-900">
      {/* Header Section */}
      <View className="p-6 bg-lime-100 dark:bg-lime-950">
        <View className="items-center">
          <View className="w-32 h-32 bg-lime-500 rounded-full items-center justify-center mb-4">
            <Text className="text-4xl text-white font-bold">
              {userProfile.name[0]}
            </Text>
          </View>
          <Text className="text-2xl font-bold dark:text-white mb-2">
            {userProfile.name}
          </Text>
          <View className="bg-lime-200 dark:bg-lime-900 px-4 py-1 rounded-full">
            <Text className="text-lime-800 dark:text-lime-200 font-medium">
              {userProfile.role}
            </Text>
          </View>
        </View>

        <View className="mt-6 flex items-center justify-center gap-2">
          <View className="flex-row items-center">
            <Feather name="mail" size={20} color={isDark ? "#e5e7eb" : "#374151"} />
            <Text className="ml-2 dark:text-gray-300">{userProfile.email}</Text>
          </View>
          <View className="flex-row items-center">
            <Feather name="phone" size={20} color={isDark ? "#e5e7eb" : "#374151"} />
            <Text className="ml-2 dark:text-gray-300">{userProfile.phoneNumber}</Text>
          </View>
        </View>
      </View>

      {/* Bookings Section */}
      {userProfile.bookings && userProfile.bookings.length > 0 && (
      <View className="p-6">
        <Text className="text-xl font-bold mb-4 dark:text-white">
          Recent Bookings
        </Text>
        <View className="flex gap-1">
          {userProfile.bookings.map((booking: any, index: number) => (
            <Pressable
              key={index}
              className="bg-gray-50 dark:bg-gray-800 p-4 rounded-xl"
              onPress={() => navigateTo("/bookings")}
            >
              <View className="flex-row justify-between items-start">
                <View>
                  <Text className="font-semibold text-lg dark:text-white">
                    {booking.hotel.hotelName}
                  </Text>
                  <Text className="text-gray-600 dark:text-gray-400">
                    {format(new Date(booking.checkIn), "MMM d, yyyy")} -{" "}
                    {format(new Date(booking.checkOut), "MMM d, yyyy")}
                  </Text>
                  <Text className="text-gray-600 dark:text-gray-400">
                    {booking.guests} guests
                  </Text>
                </View>
                <View className={`px-3 py-1 rounded-full ${
                  booking.status === "CONFIRMED"
                    ? "bg-green-100 dark:bg-green-900"
                    : "bg-yellow-100 dark:bg-yellow-900"
                }`}>
                  <Text className={`${
                    booking.status === "CONFIRMED"
                      ? "text-green-800 dark:text-green-100"
                      : "text-yellow-800 dark:text-yellow-100"
                  }`}>
                    {booking.status}
                  </Text>
                </View>
              </View>
            </Pressable>
          ))}
        </View>
      </View>
      )}

      {/* Owned Hotels Section */}
      {userProfile.ownedHotels && userProfile.ownedHotels.length > 0 && (
        <View className="p-6">
          <Text className="text-xl font-bold mb-4 dark:text-white">
            Owned Hotels
          </Text>
          <View className="flex gap-1">
            {userProfile.ownedHotels.map((hotel: any, index: number) => (
              <Pressable
                key={index}
                className="bg-gray-50 dark:bg-gray-800 p-4 rounded-xl flex-row items-center"
                onPress={() => navigateTo("/ownedHotels")}
              >
                <Feather name="home" size={24} color={isDark ? "#e5e7eb" : "#374151"} />
                <View className="ml-3">
                  <Text className="font-semibold text-lg dark:text-white">
                    {hotel.hotelName}
                  </Text>
                  <Text className="text-gray-600 dark:text-gray-400">
                    Code: {hotel.code}
                  </Text>
                </View>
              </Pressable>
            ))}
          </View>
        </View>
      )}

      {/* Managed Hotels Section */}
      {userProfile.managedHotels && userProfile.managedHotels.length > 0 && (
        <View className="p-6">
          <Text className="text-xl font-bold mb-4 dark:text-white">
            Managed Hotels
          </Text>
          <View className="flex gap-1">
            {userProfile.managedHotels.map((hotel: any, index: number) => (
              <Pressable
                key={index}
                className="bg-gray-50 dark:bg-gray-800 p-4 rounded-xl flex-row items-center"
                onPress={() => navigateTo("/managedHotels")}
              >
                <Feather name="briefcase" size={24} color={isDark ? "#e5e7eb" : "#374151"} />
                <View className="ml-3">
                  <Text className="font-semibold text-lg dark:text-white">
                    {hotel.hotelName}
                  </Text>
                  <Text className="text-gray-600 dark:text-gray-400">
                    Code: {hotel.code}
                  </Text>
                </View>
              </Pressable>
            ))}
          </View>
        </View>
      )}

      {/* Account Info */}
      <View className="p-6">
        <Text className="text-xl font-bold mb-4 dark:text-white">
          Account Info
        </Text>
        <View className="bg-gray-50 dark:bg-gray-800 p-4 rounded-xl space-y-3">
          <View className="flex-row justify-between">
            <Text className="text-gray-600 dark:text-gray-400">Member since</Text>
            <Text className="dark:text-white">
              {format(new Date(userProfile.createdAt), "MMMM d, yyyy")}
            </Text>
          </View>
          <View className="flex-row justify-between">
            <Text className="text-gray-600 dark:text-gray-400">Last updated</Text>
            <Text className="dark:text-white">
              {format(new Date(userProfile.updatedAt), "MMMM d, yyyy")}
            </Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
};

export default UserProfile;
