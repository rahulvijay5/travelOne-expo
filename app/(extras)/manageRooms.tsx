import { View, Text, Pressable, TouchableOpacity } from "react-native";
import React, { useEffect, useState } from "react";
import { useLocalSearchParams, router } from "expo-router";
import { PlusCircleIcon } from "lucide-react-native";
import api from "@/lib/api";
import { useAuth } from "@clerk/clerk-expo";
import { Room } from "@/types";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Button } from "@/components/ui/button";
const manageRooms = () => {
  const { hotelId } = useLocalSearchParams<{ hotelId: string }>();
  const [rooms, setRooms] = useState<Room[]>([]);

  const navigateToHotelRooms = (hotelId: string) => {
    router.push({
      pathname: "/roomdetails",
      params: { hotelId },
    });
  };

  const navigateToRoomView = (roomId: string) => {
    router.push({
      pathname: "/roomPage",
      params: { roomId },
    });
  };

  useEffect(() => {
    const loadRooms = async () => {
      try {
        const roomsData = await AsyncStorage.getItem("@current_hotel_rooms");
        if (roomsData) {
          const parsedData = JSON.parse(roomsData);
          if (parsedData.hotelId === hotelId) {
            const roomsArray = Array.isArray(parsedData.rooms)
              ? parsedData.rooms
              : [];
            const sortedRooms = roomsArray.sort(
              (a: any, b: any) =>
                parseInt(a.roomNumber) - parseInt(b.roomNumber)
            );
            console.log("Loaded rooms:", sortedRooms);
            setRooms(sortedRooms);
          }
        }
      } catch (error) {
        console.error("Error loading rooms:", error);
      }
    };
    loadRooms();
  }, [hotelId]);

  return (
    <View className="p-2 flex gap-2">
      <View className="flex flex-row justify-between items-center">
        <Text className="text-2xl font-bold dark:text-white">Manage Rooms</Text>
        <TouchableOpacity
          className="flex flex-row items-center gap-2 bg-blue-500 p-2 px-4 rounded-md"
          onPress={() => navigateToHotelRooms(hotelId)}
        >
          <Text className="text-lg text-white">Add Room</Text>
          <PlusCircleIcon color="white" className="w-4 h-4" />
        </TouchableOpacity>
      </View>
      <View className="flex flex-row flex-wrap justify-center gap-2 mt-4">
        
      {rooms.map((room) => (
          <Pressable
            onPress={() => navigateToRoomView(room.id)}
            key={room.id}
            className="h-16 bg-gray-200 w-5/12 rounded-md text-center items-center flex justify-center"
          >
            <Text>{room.roomNumber}</Text>
          </Pressable>
          
        ))}
      </View>
    </View>
  );
};

export default manageRooms;
