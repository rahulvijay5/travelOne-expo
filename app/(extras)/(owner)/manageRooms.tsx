import { View, Text, Pressable, TouchableOpacity } from "react-native";
import React, { useEffect, useState } from "react";
import { useLocalSearchParams, router } from "expo-router";
import { PlusCircleIcon, RefreshCcw } from "lucide-react-native";
import { useAuth } from "@clerk/clerk-expo";
import { Room } from "@/types";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getHotelRooms } from "@lib/api";
import { navigateTo } from "@/lib/actions/navigation";

const manageRooms = () => {
  const { hotelId } = useLocalSearchParams<{ hotelId: string }>();
  const [rooms, setRooms] = useState<Room[]>([]);
  const { getToken } = useAuth();
  const [reload, setReload] = useState<boolean>(false);

  const navigateToHotelRooms = (hotelId: string) => {
    navigateTo("/roomdetails", { hotelId });
  };

  const navigateToRoomView = (roomId: string) => {
    navigateTo("/roomPage", { roomId });
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
            console.log("Rooms loaded in manageRooms");
            setRooms(sortedRooms);
          }
        } else {
          const token = await getToken();
          if (!token) {
            navigateTo("/not-authenticated");
            return;
          }
          const roomsFromDb = await getHotelRooms(hotelId, token!);
          console.log("Rooms from db:", roomsFromDb);
          if (roomsFromDb && !roomsFromDb.error) {
            setRooms(roomsFromDb);
            await AsyncStorage.setItem(
              "@current_hotel_rooms",
              JSON.stringify({
                hotelId: hotelId,
                rooms: roomsFromDb,
              })
            );
          }
        }
      } catch (error) {
        console.error("Error loading rooms:", error);
      }
    };
    loadRooms();
  }, [hotelId, reload]);

  if(rooms.length === 0){
    return (
      <View className="flex-1 items-center justify-center">
        <Text className="text-xl font-semibold dark:text-white">No rooms found</Text>
        <TouchableOpacity
          className="flex flex-row items-center gap-2 bg-blue-500 p-2 px-4 my-4 rounded-md"
          onPress={() => navigateToHotelRooms(hotelId)}
        >
          <Text className="text-lg text-white">Add Rooms</Text>
          <PlusCircleIcon color="white" className="w-4 h-4" />
        </TouchableOpacity>
        
      </View>
    );
  }

  return (
    <View className="p-2 flex gap-2">
      <View className="flex flex-row justify-between items-center">
        <Text className="text-2xl font-bold dark:text-white">Manage Rooms</Text>
        <View className="flex flex-row items-center gap-2">
        <TouchableOpacity
          className="flex flex-row items-center gap-2 bg-blue-500 p-2 px-4 my-4 rounded-md"
          onPress={() => navigateToHotelRooms(hotelId)}
        >
          <Text className="text-lg text-white">Add Rooms</Text>
          <PlusCircleIcon color="white" className="w-4 h-4" />
        </TouchableOpacity>
        <TouchableOpacity
          className="flex flex-row items-center gap-2 bg-gray-500 p-2 px-2 my-4 rounded-md"
          onPress={() => setReload(!reload)}
        >

          <RefreshCcw color="white" className="w-2 h-2 " />
        </TouchableOpacity>
        </View>
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
