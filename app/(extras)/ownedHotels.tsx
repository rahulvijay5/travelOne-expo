import { View, Text, ScrollView, Image, Alert, Pressable } from "react-native";
import React, { useEffect, useState } from "react";
import { router, useLocalSearchParams } from "expo-router";
import { useUserStorage } from "@/hooks/useUserStorage";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "@clerk/clerk-expo";
import { UserData } from "@/types";
import api from "@/lib/api";
import { ArrowUpRightFromCircle } from "lucide-react-native";
import { processCode } from "@/lib/actions/processCode";

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

  const navigateToManageRooms = (hotelId: string) => {
    router.push({
      pathname: "/manageRooms",
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
                  ? { uri: (hotel.hotelImages[0]) }
                  : { uri: "" }
              }
              className="bg-gray-200 dark:bg-gray-800 rounded-lg h-20"
            />

            <View className="flex gap-1">
              <View className="flex items-center justify-between flex-row mt-2">
                <Text className="text-2xl mt-2 mb-1 font-bold flex-grow dark:text-white text-black">
                  {hotel.hotelName}
                </Text>
                <Pressable
                  onPress={async () => {
                    try {
                      const token = await getToken();
                      if (token) {
                        const result = await processCode({
                          code: hotel.code,
                          token,
                          getToken,
                          getUserData,
                          storeUserData,
                          forceRefetch: true // Always get fresh data when switching hotels
                        });

                        if (result.success) {
                          router.push({
                            pathname: "/",
                            params: { hotelId: hotel.id },
                          });
                        } else {
                          Alert.alert("Error", result.error);
                        }
                      }
                    } catch (error) {
                      console.error("Error switching hotel:", error);
                      Alert.alert("Error", "Failed to switch hotel. Please try again.");
                    }
                  }}
                >
                  <ArrowUpRightFromCircle size={20} color="gray" />
                </Pressable>
              </View>

              <View className="flex-row justify-between items-end">
                <Text className=" text-gray-500">Hotel Code:</Text>
                <Text className="font-bold dark:text-white text-black text-lg text-left">
                  {hotel.code}
                </Text>
              </View>
              <View className="flex-row justify-between items-start">
                <Text className=" text-gray-500 w-1/3">Address:</Text>
                <Text className=" text-gray-500 w-2/3">{hotel.address}</Text>
              </View>
              {/* <View className="flex-row justify-between items-start w-full ">
                <Text className=" text-gray-500 w-1/3">Description:</Text>
                <Text className=" text-gray-500 w-2/3 text-justify line-clamp-3 truncate">{hotel.description}</Text>
              </View> */}
            </View>
            <View className="flex-row justify-between mt-4 gap-2 items-center">
              <Pressable
                className="p-2 bg-blue-500 flex-grow rounded-lg"
                onPress={() => navigateToHotelRules(hotel.id)}
              >
                <Text className="text-white font-bold text-lg text-center">
                  Manage Rules
                </Text>
              </Pressable>
              <Pressable
                className=" p-2 bg-blue-500 flex-grow rounded-lg"
                onPress={() => handleManagePeople(hotel.id, hotel.hotelName)}
              >
                <Text className="text-white font-bold text-lg text-center">
                  Manage People
                </Text>
              </Pressable>
            </View>
            <Pressable
                className=" p-2 bg-blue-500 mt-2 flex-grow rounded-lg"
                onPress={() => navigateToManageRooms(hotel.id)}
              >
                <Text className="text-white font-bold text-lg text-center">
                  Manage Rooms
                </Text>
              </Pressable>
          </View>
        ))
      )}
    </ScrollView>
  );
};

export default OwnedHotels;
