import React, { useEffect, useState } from "react";
import {
  View,
  ScrollView,
  TextInput,
  Pressable,
  Image,
} from "react-native";
import { Text } from "@/components/ui/text";
import { useLocalSearchParams, router } from "expo-router";
import { RoomForm } from "@/types";
import { defaultRoomFeatures } from "@/lib/constants";
import { Trash2 } from "lucide-react-native";

import { useAuth } from "@clerk/clerk-expo";
import CustomImagePicker from "@/components/ImagePicker";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { uploadImages, createMultipleRooms, getHotelRooms } from "@lib/api";

type HotelRulesPageParams = {
  hotelId: string;
  createNewHotel?: string;
};

const RoomDetails = () => {
  const params = useLocalSearchParams<HotelRulesPageParams>();
  const [rooms, setRooms] = useState<RoomForm[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { getToken } = useAuth();
  const [hotelId, setHotelId] = useState<string | null>(null);
  const [creatingNewHotel, setCreatingNewHotel] = useState(false);

  const [currentRoom, setCurrentRoom] = useState<RoomForm>({
    roomNumber: "",
    type: "",
    price: "",
    maxOccupancy: "2",
    available: true,
    features: [],
    customFeature: "",
    images: [],
  });

  useEffect(() => {
    console.log("params in hotelrules", params);
    if (params.hotelId) {
      setHotelId(params.hotelId);
    }
    if (params.createNewHotel === "true") {
      setCreatingNewHotel(true);
    }
  }, [params.hotelId, params.createNewHotel]);

  useEffect(() => {
    const getTempRooms = async () => {
      const tempRooms = await AsyncStorage.getItem("@temp_rooms");
      if (tempRooms) {
        setRooms(JSON.parse(tempRooms).rooms);
      }
    };
    getTempRooms();
  }, []);

  const handleFeatureToggle = (feature: string) => {
    setCurrentRoom((prev) => ({
      ...prev,
      features: prev.features.includes(feature)
        ? prev.features.filter((f) => f !== feature)
        : [...prev.features, feature],
    }));
  };

  const handleDeleteRoom = async (index: number) => {
    setRooms((prev) => prev.filter((_, i) => i !== index));
    await AsyncStorage.setItem(
      "@temp_rooms",
      JSON.stringify({
        rooms: rooms.filter((_, i) => i !== index),
      })
    );
  };

  const handleImagesSelected = (images: string[]) => {
    // Limiting to 2 images per room for now
    const limitedImages = images.slice(0, 2);
    setCurrentRoom((prev) => ({
      ...prev,
      images: limitedImages,
    }));
  };

  const addCustomFeature = async () => {
    if (currentRoom.customFeature.trim()) {
      setCurrentRoom((prev) => ({
        ...prev,
        features: [...prev.features, prev.customFeature.trim()],
        customFeature: "",
      }));
    }
  };

  const addRoom = async () => {
    // Validate required fields
    const requiredFields = ["type", "roomNumber", "price", "maxOccupancy"];
    const missingFields = requiredFields.filter(
      (field) => !currentRoom[field as keyof RoomForm]
    );

    if (rooms.find((room) => room.roomNumber == currentRoom.roomNumber)) {
      setError("Room number already exists");
      return;
    }

    if (missingFields.length > 0) {
      setError(
        `Please fill in all required fields: ${missingFields.join(", ")}`
      );
      return;
    }

    if (currentRoom.maxOccupancy === "") {
      setError("Please enter a valid maximum occupancy");
      return;
    }

    if (currentRoom.images.length === 0) {
      setError("Please add at least one room image");
      return;
    }

    setRooms((prev) => [...prev, currentRoom]);

    await AsyncStorage.setItem(
      "@temp_rooms",
      JSON.stringify({
        rooms: [...rooms, currentRoom],
      })
    );

    setCurrentRoom({
      type: "",
      roomNumber: "",
      price: "",
      maxOccupancy: "",
      available: true,
      features: [],
      customFeature: "",
      images: [],
    });
    setError("");
  };

  const handleFinish = async () => {
    try {
      setLoading(true);
      setError("");

      if (rooms.length === 0) {
        setError("Please add at least one room");
        return;
      }

      const token = await getToken();
      if (!token) {
        setError("Authentication error. Please sign in again.");
        return;
      }

      // Format rooms data according to API requirements
      const formattedRooms = rooms.map(room => ({
        roomNumber: room.roomNumber,
        type: room.type,
        price: parseInt(room.price),
        maxOccupancy: parseInt(room.maxOccupancy),
        features: room.features,
        images: room.images
      }));

      // Upload images for each room
      const roomsWithUploadedImages = await Promise.all(
        formattedRooms.map(async (room) => {
          try {
            const uploadedImageUrls = await uploadImages(
              room.images,
              "RoomImages",
              token
            );
            return {
              ...room,
              images: uploadedImageUrls,
            };
          } catch (error) {
            console.error("Error uploading room images:", error);
            throw new Error("Failed to upload room images");
          }
        })
      );

      // Create rooms with uploaded image URLs
      try {
        const res = await createMultipleRooms(
          roomsWithUploadedImages,
          hotelId as string,
          token
        );

        if (res.error) {
          throw new Error(res.error);
        }

        // Update rooms in AsyncStorage
        await AsyncStorage.removeItem("@temp_rooms");

        const rooms = await getHotelRooms(hotelId as string, token);
        if (rooms && !rooms.error) {
          await AsyncStorage.setItem(
            "@current_hotel_rooms",
              JSON.stringify({
                hotelId: hotelId,
                rooms: rooms.data || rooms,
              })
            );
          }

        if (creatingNewHotel) {
          router.replace("/");
        } else {
          router.replace("/ownedHotels");
        }
      } catch (err: any) {
        console.error("Error creating rooms:", err);
        setError(err.message || "Failed to create rooms");
      }
    } catch (err: any) {
      console.error("Error creating rooms:", err);
      setError(err.message || "Failed to create rooms");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView className="flex-1">
      <View className="w-full h-0.5 bg-gray-200 rounded-full">
        <View className="w-full h-full bg-blue-500 rounded-full" />
      </View>
      <View>
        <CustomImagePicker
          images={currentRoom.images}
          onImagesSelected={handleImagesSelected}
          maxImages={2}
          title="Room"
        />
      </View>
      <View className="flex-1 p-4">
        <View className="space-y-4 gap-3">
          <View className="flex-row items-center gap-2 justify-between">
            <Text className="text-base font-semibold mb-2 dark:text-white">
              Room Number
            </Text>
            <TextInput
              className="border border-gray-300 w-1/3 dark:border-gray-600 rounded-lg p-3 dark:text-white"
              value={currentRoom.roomNumber}
              onChangeText={(text) =>
                setCurrentRoom((prev) => ({ ...prev, roomNumber: text }))
              }
              placeholder="Enter room number"
              placeholderTextColor="#666"
            />
          </View>

          <View className="flex-row items-center gap-4 justify-between">
            <Text className="text-base mb-2 dark:text-white">Room Type </Text>
            <TextInput
              className="border flex-grow border-gray-300 dark:border-gray-600 rounded-lg p-3 dark:text-white"
              value={currentRoom.type}
              onChangeText={(text) =>
                setCurrentRoom((prev) => ({ ...prev, type: text }))
              }
              placeholder="e.g., Standard, Deluxe, Suite"
              placeholderTextColor="#666"
            />
          </View>

          <View className="flex-row items-center gap-2 justify-between">
            <Text className="text-base mb-2 dark:text-white">
              Price per Night
            </Text>
            <TextInput
              className="border border-gray-300 w-1/3 dark:border-gray-600 rounded-lg p-3 dark:text-white"
              value={currentRoom.price}
              onChangeText={(text) =>
                setCurrentRoom((prev) => ({
                  ...prev,
                  price: text.replace(/[^0-9]/g, ""),
                }))
              }
              placeholder="Enter price"
              placeholderTextColor="#666"
              keyboardType="numeric"
            />
          </View>

          <View className="flex-row items-center gap-2 justify-between">
            <Text className="text-base mb-2 dark:text-white">
              Max Occupancy:
            </Text>
            <TextInput
              className="border border-gray-300 w-1/3 text-right dark:border-gray-600 rounded-lg p-3 dark:text-white"
              value={currentRoom.maxOccupancy}
              onChangeText={(text) =>
                setCurrentRoom((prev) => ({
                  ...prev,
                  maxOccupancy: text.replace(/[^0-9]/g, ""),
                }))
              }
              placeholder="2"
              placeholderTextColor="#666"
              keyboardType="numeric"
            />
          </View>

          <View>
            <Text className="text-base mb-2 dark:text-white">Features</Text>
            <View className="flex-row flex-wrap gap-2">
              {[
                ...defaultRoomFeatures,
                ...currentRoom.features.filter(
                  (f) => !defaultRoomFeatures.includes(f as any)
                ),
              ].map((feature) => (
                <Pressable
                  key={feature}
                  onPress={() => handleFeatureToggle(feature)}
                  className={`px-3 py-2 rounded-lg ${
                    currentRoom.features.includes(feature)
                      ? "bg-blue-500"
                      : "bg-gray-200 dark:bg-gray-700"
                  }`}
                >
                  <Text
                    className={
                      currentRoom.features.includes(feature)
                        ? "text-white"
                        : "dark:text-white"
                    }
                  >
                    {feature}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          <View className="flex-row items-center gap-2 mt-3">
            <TextInput
              className="flex-1 border border-gray-300 dark:border-gray-600 rounded-lg p-3 dark:text-white"
              value={currentRoom.customFeature}
              onChangeText={(text) =>
                setCurrentRoom((prev) => ({ ...prev, customFeature: text }))
              }
              placeholder="Add custom feature"
              placeholderTextColor="#666"
              onSubmitEditing={addCustomFeature}
            />
            <Pressable
              onPress={addCustomFeature}
              className="bg-blue-500 rounded-lg p-3 px-4"
            >
              <Text className="text-white">Add</Text>
            </Pressable>
          </View>

          {error && <Text className="text-red-500 mt-4">{error}</Text>}

          <View
            className={`flex-row gap-2 ${rooms.length == 0 ? "mb-10" : ""}`}
          >
            {!creatingNewHotel && rooms.length <= 0 && (
              <Pressable
                onPress={() => router.back()}
                className="bg-blue-500 rounded-lg p-3 px-4"
              >
                <Text className="text-white text-lg text-center">Go Back</Text>
              </Pressable>
            )}
            <Pressable
              onPress={addRoom}
              className="flex-grow bg-blue-500 rounded-lg p-3 px-4"
            >
              <Text className="text-white text-lg text-center font-bold">
                Add Room
              </Text>
            </Pressable>
          </View>

          {rooms.length > 0 && (
            <Pressable
              onPress={handleFinish}
              className=" bg-green-500 rounded-lg p-3 px-4"
              disabled={loading}
            >
              <Text className="text-white text-lg text-center font-bold">
                {loading ? "Creating Rooms..." : "Finish Setup"}
              </Text>
            </Pressable>
          )}
        </View>

        {/* Added Rooms List */}
        {rooms.length > 0 && (
          <View className="my-8 border-t-2 border-gray-200 pt-4">
            <Text className="text-xl text-center font-semibold mb-4 dark:text-white">
              Added Rooms
            </Text>
            {rooms.map((room, index) => (
              <View
                key={index}
                className="bg-gray-100 dark:bg-gray-800 flex flex-row justify-between items-center p-3 rounded-lg mb-2"
              >
                <View className="flex items-start gap-2">
                  <Text className="dark:text-white font-semibold">
                    {room.roomNumber} - {room.type}
                  </Text>
                  <Text className="dark:text-white">
                    Price: {room.price} per night
                  </Text>
                  <Text className="dark:text-white">
                    Images: {room.images.length}/2
                  </Text>
                </View>
                <View className="flex-col items-end gap-3">
                <Image
                    source={{ uri: room.images[0] }}
                    className="w-20 h-10 rounded-lg"
                  />
                <Pressable
                  className="bg-red-400 px-2 rounded-full p-2"
                  onPress={() => handleDeleteRoom(index)}
                >
                  <Text className="text-white">
                    <Trash2 size={20} color="white" />
                  </Text>
                </Pressable>
                </View>
              </View>
            ))}
          </View>
        )}
      </View>
    </ScrollView>
  );
};

export default RoomDetails;
