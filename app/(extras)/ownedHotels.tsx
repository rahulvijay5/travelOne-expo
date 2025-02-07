import { View, Text, ScrollView, Image } from "react-native";
import React, { useEffect, useState } from "react";
import { router, useLocalSearchParams } from "expo-router";
import { useUserStorage } from "@/hooks/useUserStorage";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "@clerk/clerk-expo";
import { HotelFormData, UserData } from "@/types";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { ArrowUpRightFromCircle } from "lucide-react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

const OwnedHotels = () => {
  const { getUserData, storeUserData } = useUserStorage();
  const { getToken } = useAuth();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [ownerId, setOwnerId] = useState<string | null>(null);
  const [hotels, setHotels] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const fetchUserData = async () => {
      try {
        const data = await getUserData();
        if (mounted) {
          setUserData(data);
          setOwnerId(data?.userId || null);
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
    };

    fetchUserData();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (ownerId) {
      const fetchOwnedHotels = async () => {
        try {
          setLoading(true);
          const token = await getToken();
          if (!token) {
            console.error("No auth token available");
            return;
          }
          const res = await api.getOwnedHotels(ownerId, token);
          if (res.ok && res.data) {
            setHotels(res.data);
          }
        } catch (error) {
          console.error("Error fetching hotels:", error);
        } finally {
          setLoading(false);
        }
      };
      fetchOwnedHotels();
    }
  }, [ownerId]);

  const handleManagePeople = (hotelId: string, hotelName: string) => {
    router.push({
      pathname: "/managePeople",
      params: { hotelId, hotelName },
    });
  };

  const navigateToHotelRules = (hotelId: string) => {
    router.push({
      pathname: "/hotelrules",
      params: { hotelId },
    });
  };

  if (loading) {
    return (
      <SafeAreaView>
        <Text>Loading...</Text>
      </SafeAreaView>
    );
  }

  console.log(hotels);

  return (
    <ScrollView className="p-4">
      {hotels.length === 0 ? (
        <Text className="text-lg dark:text-white text-black">
          No hotels found
        </Text>
      ) : (
        hotels.map((hotel, index) => (
          <View
            key={hotel.id || index}
            className="px-2 py-4 my-2 rounded-lg border border-gray-200 dark:border-gray-800"
          >
            <Image
              source={
                hotel.hotelImages[0]
                  ? { uri: hotel.hotelImages[0] }
                  : { uri: "" }
              }
              className="bg-gray-200 dark:bg-gray-800 rounded-lg h-20"
            />

            <View className="flex gap-1">
              <View className="flex items-center justify-between flex-row">
                <Text className="text-2xl mt-2 mb-1 font-bold flex-grow dark:text-white text-black">
                  {hotel.hotelName}
                </Text>
                <Button
                  onPress={async () => {
                    try {
                      const token = await getToken();
                      if (token) {
                        // Get complete hotel details including rules
                        const hotelDetails = await api.getHotelById(hotel.id, token);
                        if (hotelDetails) {
                          // Get rooms data
                          const rooms = await api.getHotelRooms(hotel.id, token);
                          if (rooms && !rooms.error) {
                            await AsyncStorage.setItem(
                              "@current_hotel_rooms",
                              JSON.stringify({
                                hotelId: hotel.id,
                                rooms: rooms.data || rooms
                              })
                            );
                          }

                          // Store hotel details
                          await AsyncStorage.setItem(
                            "@current_hotel_details",
                            JSON.stringify(hotelDetails)
                          );

                          // Update current stay in user data
                          await storeUserData({
                            currentStay: {
                              hotelId: hotel.id,
                              hotelCode: hotel.code,
                              hotelName: hotel.hotelName,
                            },
                          });

                          // Navigate to home
                          router.push({
                            pathname: "/",
                            params: { hotelId: hotel.id },
                          });
                        }
                      }
                    } catch (error) {
                      console.error("Error switching hotel:", error);
                    }
                  }}
                >
                  <ArrowUpRightFromCircle size={20} color="gray" />
                </Button>
              </View>

              <View className="flex-row justify-between items-end">
                <Text className=" text-gray-500">Hotel Code:</Text>
                <Text className="font-bold dark:text-white text-black text-lg">
                  {hotel.code}
                </Text>
              </View>
              <View className="flex-row justify-between items-end">
                <Text className=" text-gray-500">Address:</Text>
                <Text className=" text-gray-500">{hotel.address}</Text>
              </View>
              <View className="flex-row justify-between items-end">
                <Text className=" text-gray-500">Description:</Text>
                <Text className=" text-gray-500">{hotel.description}</Text>
              </View>
            </View>
            <View className="flex-row justify-between mt-4 gap-2 items-center">
              <Button
                className="p-3 bg-blue-500 flex-grow"
                onPress={() => navigateToHotelRules(hotel.id)}
              >
                <Text className="text-white font-bold text-lg">
                  Manage Rules
                </Text>
              </Button>
              <Button
                className=" p-3 bg-blue-500 flex-grow"
                onPress={() => handleManagePeople(hotel.id, hotel.hotelName)}
              >
                <Text className="text-white font-bold text-lg">
                  Manage People
                </Text>
              </Button>
            </View>
          </View>
        ))
      )}
    </ScrollView>
  );
};

export default OwnedHotels;
