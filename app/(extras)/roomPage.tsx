import React, { useEffect, useState } from "react";
import {
  View,
  ScrollView,
  Image,
  Pressable,
  Alert,
  ActivityIndicator,
  TextInput,
} from "react-native";
import { Text } from "@/components/ui/text";
import { useLocalSearchParams, router } from "expo-router";
import { useAuth } from "@clerk/clerk-expo";
import api from "@/lib/api";
import { Feather } from "@expo/vector-icons";
import { RoomDetailsByID, UpdateRoomForm } from "@/types";
import { defaultRoomFeatures } from "@/lib/constants";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getRoomById, deleteRoom, updateRoom } from "@lib/api";

export default function RoomPage() {
  const params = useLocalSearchParams();
  const { getToken } = useAuth();
  const [room, setRoom] = useState<RoomDetailsByID | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedRoom, setEditedRoom] = useState<UpdateRoomForm | null>(null);
  const [customFeature, setCustomFeature] = useState("");

  useEffect(() => {
    loadRoomDetails();
  }, [params.roomId]);

  const loadRoomDetails = async () => {
    try {
      setLoading(true);
      const token = await getToken();
      if (!token) {
        setError("Authentication required");
        return;
      }

      const response = await getRoomById(params.roomId as string, token);
      if (response.error) {
        setError(response.error);
      } else {
        setRoom(response);
        setEditedRoom({
          type: response.type,
          price: response.price.toString(),
          maxOccupancy: response.maxOccupancy.toString(),
          available: response.available,
          features: [...response.features],
          roomNumber: response.roomNumber,
        });
      }
    } catch (err) {
      setError("Failed to load room details");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleFeatureToggle = (feature: string) => {
    if (!editedRoom) return;
    setEditedRoom((prev) => ({
      ...prev!,
      features: prev!.features.includes(feature)
        ? prev!.features.filter((f) => f !== feature)
        : [...prev!.features, feature],
    }));
  };

  const addCustomFeature = () => {
    if (customFeature.trim() && editedRoom) {
      setEditedRoom((prev) => ({
        ...prev!,
        features: [...prev!.features, customFeature.trim()],
      }));
      setCustomFeature("");
    }
  };

  const handleDeleteRoom = () => {
    Alert.alert(
      "Delete Room",
      "Warning: This action cannot be undone. Deleting this room will also delete all associated bookings. Are you sure you want to proceed?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              const token = await getToken();
              if (!token) {
                setError("Authentication required");
                return;
              }

              await deleteRoom(params.roomId as string, token);

              const cachedHotel = await AsyncStorage.getItem("@current_hotel");
              const cachedRoomsStr = await AsyncStorage.getItem(
                "@current_hotel_rooms"
              );
              const cachedRooms = cachedRoomsStr
                ? JSON.parse(cachedRoomsStr)
                : { rooms: [] };

              // Remove the deleted room from cached rooms
              const updatedRooms = cachedRooms.rooms.filter(
                (room: any) => room.roomId !== params.roomId
              );

              await AsyncStorage.setItem(
                "@current_hotel_rooms",
                JSON.stringify({
                  hotelId: cachedHotel ? JSON.parse(cachedHotel).hotelId : null,
                  rooms: updatedRooms,
                })
              );

              Alert.alert("Success", "Room deleted successfully");
              router.back();
            } catch (err) {
              console.error(err);
              Alert.alert("Error", "Failed to delete room");
            }
          },
        },
      ]
    );
  };

  const handleUpdateRoom = async () => {
    if (!editedRoom) return;

    try {
      const token = await getToken();
      if (!token) {
        setError("Authentication required");
        return;
      }

      const result = await updateRoom(
        params.roomId as string,
        {
          ...editedRoom,
          price: editedRoom.price,
          maxOccupancy: editedRoom.maxOccupancy,
        },
        token
      );

      if (result.success) {
        Alert.alert("Success", "Room updated successfully");
        setIsEditing(false);
        loadRoomDetails(); // Reload room details
      } else {
        Alert.alert("Error", result.error || "Failed to update room");
      }
    } catch (err) {
      console.error(err);
      Alert.alert("Error", "Failed to update room");
    }
  };

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center">
        <ActivityIndicator size="large" color="#84cc16" />
      </View>
    );
  }

  if (error) {
    return (
      <View className="flex-1 justify-center items-center p-4">
        <Text className="text-red-500 text-center mb-4">{error}</Text>
        <Pressable
          onPress={() => router.back()}
          className="bg-blue-500 px-6 py-3 rounded-lg"
        >
          <Text className="text-white">Go Back</Text>
        </Pressable>
      </View>
    );
  }

  if (!room || !editedRoom) {
    return (
      <View className="flex-1 justify-center items-center p-4">
        <Text className="text-center mb-4 dark:text-white">Room not found</Text>
        <Pressable
          onPress={() => router.back()}
          className="bg-blue-500 px-6 py-3 rounded-lg"
        >
          <Text className="text-white">Go Back</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-white dark:bg-black">
      {/* Room Images */}
      <ScrollView horizontal pagingEnabled className="h-64">
        {room.images.map((image, index) => (
          <Image
            key={index}
            source={{ uri: image }}
            className="w-screen h-64 relative"
            resizeMode="cover"
          />
        ))}
        {room.images.length > 1 && (
          <Text className="text-gray-300 text-sm text-center absolute bottom-0 z-10 p-4">
            Swipe to view more
          </Text>
        )}
      </ScrollView>

      {/* Room Details */}
      <View className="p-4 space-y-4 flex gap-3">
        <View className="flex-row justify-between items-center">
          <Text className="text-2xl font-bold dark:text-white">
            Room {room.roomNumber}
          </Text>
          <View className="bg-lime-100 dark:bg-lime-900 px-3 py-1 rounded-full">
            <Text className="text-lime-800 dark:text-lime-200">
              {room.roomStatus}
            </Text>
          </View>
        </View>

        <View className="space-y-2 flex gap-2">
          <View className="flex-row justify-between items-center">
            <Text className="text-gray-600 dark:text-gray-300">Type</Text>
            {isEditing ? (
              <TextInput
                value={editedRoom.type}
                onChangeText={(text) =>
                  setEditedRoom((prev) => ({ ...prev!, type: text }))
                }
                className="border border-gray-300 dark:border-gray-600 rounded-lg p-2 dark:text-white text-right"
                placeholder="Room type"
              />
            ) : (
              <Text className="font-semibold dark:text-white">{room.type}</Text>
            )}
          </View>
          <View className="flex-row justify-between items-center">
            <Text className="text-gray-600 dark:text-gray-300">
              Price per night
            </Text>
            {isEditing ? (
              <TextInput
                value={editedRoom.price}
                onChangeText={(text) =>
                  setEditedRoom((prev) => ({
                    ...prev!,
                    price: text.replace(/[^0-9]/g, ""),
                  }))
                }
                keyboardType="numeric"
                className="border border-gray-300 dark:border-gray-600 rounded-lg p-2 dark:text-white text-right"
                placeholder="Price"
              />
            ) : (
              <Text className="font-semibold dark:text-white">
                {room.price}
              </Text>
            )}
          </View>
          <View className="flex-row justify-between items-center">
            <Text className="text-gray-600 dark:text-gray-300">
              Max Occupancy
            </Text>
            {isEditing ? (
              <TextInput
                value={editedRoom.maxOccupancy}
                onChangeText={(text) =>
                  setEditedRoom((prev) => ({
                    ...prev!,
                    maxOccupancy: text.replace(/[^0-9]/g, ""),
                  }))
                }
                keyboardType="numeric"
                className="border border-gray-300 dark:border-gray-600 rounded-lg p-2 dark:text-white text-right"
                placeholder="Max occupancy"
              />
            ) : (
              <Text className="font-semibold dark:text-white">
                {room.maxOccupancy} people
              </Text>
            )}
          </View>
        </View>

        {/* Features */}
        <View>
          <Text className="text-lg font-semibold mb-2 dark:text-white">
            Features
          </Text>
          {isEditing ? (
            <>
              <View className="flex-row flex-wrap gap-2">
                {[
                  ...defaultRoomFeatures,
                  ...editedRoom.features.filter(
                    (f) => !defaultRoomFeatures.includes(f as any)
                  ),
                ].map((feature) => (
                  <Pressable
                    key={feature}
                    onPress={() => handleFeatureToggle(feature)}
                    className={`px-3 py-2 rounded-lg ${
                      editedRoom.features.includes(feature)
                        ? "bg-blue-500"
                        : "bg-gray-200 dark:bg-gray-700"
                    }`}
                  >
                    <Text
                      className={
                        editedRoom.features.includes(feature)
                          ? "text-white"
                          : "dark:text-white"
                      }
                    >
                      {feature}
                    </Text>
                  </Pressable>
                ))}
              </View>
              <View className="flex-row items-center gap-2 mt-3">
                <TextInput
                  value={customFeature}
                  onChangeText={setCustomFeature}
                  placeholder="Add custom feature"
                  className="flex-1 border border-gray-300 dark:border-gray-600 rounded-lg p-2 dark:text-white"
                  placeholderTextColor="#666"
                />
                <Pressable
                  onPress={addCustomFeature}
                  className="bg-blue-500 px-4 py-2 rounded-lg"
                >
                  <Text className="text-white">Add</Text>
                </Pressable>
              </View>
            </>
          ) : (
            <View className="flex-row flex-wrap gap-2">
              {room.features.map((feature, index) => (
                <View
                  key={index}
                  className="bg-gray-100 dark:bg-gray-800 px-3 py-1 rounded-full"
                >
                  <Text className="text-gray-800 dark:text-gray-200">
                    {feature}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Action Buttons */}
        <View className="flex-row justify-between gap-4 mt-6">
          {isEditing ? (
            <>
              <Pressable
                onPress={() => {
                  setIsEditing(false);
                  setEditedRoom({
                    type: room.type,
                    price: room.price.toString(),
                    maxOccupancy: room.maxOccupancy.toString(),
                    available: true,
                    features: [...room.features],
                    roomNumber: room.roomNumber,
                  });
                }}
                className="flex-1 bg-gray-500 p-4 rounded-lg flex-row items-center justify-center"
              >
                <Feather name="x" size={20} color="white" />
                <Text className="text-white ml-2">Cancel</Text>
              </Pressable>
              <Pressable
                onPress={handleUpdateRoom}
                className="flex-1 bg-green-500 p-4 rounded-lg flex-row items-center justify-center"
              >
                <Feather name="check" size={20} color="white" />
                <Text className="text-white ml-2">Save Changes</Text>
              </Pressable>
            </>
          ) : (
            <View className="flex-row w-full gap-2">
              <Pressable
                onPress={handleDeleteRoom}
                className="flex-1 bg-red-500 p-4 rounded-lg flex-row items-center justify-center"
              >
                <Feather name="trash-2" size={20} color="white" />
                <Text className="text-white ml-2">Delete Room</Text>
              </Pressable>
              <Pressable
                onPress={() => setIsEditing(true)}
                className="flex-1 bg-blue-500 p-4 flex-grow rounded-lg flex-row items-center justify-center"
              >
                <Feather name="edit" size={20} color="white" />
                <Text className="text-white ml-2 ">Edit Details</Text>
              </Pressable>
            </View>
          )}
        </View>
      </View>
    </ScrollView>
  );
}
