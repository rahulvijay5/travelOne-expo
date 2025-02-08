import React, { useEffect, useState } from 'react';
import { View, ScrollView, Image, Pressable, Alert, ActivityIndicator } from 'react-native';
import { Text } from '@/components/ui/text';
import { useLocalSearchParams, router } from 'expo-router';
import { useAuth } from '@clerk/clerk-expo';
import api from '@/lib/api';
import { Feather } from '@expo/vector-icons';

interface RoomDetails {
  id: string;
  roomNumber: string;
  type: string;
  price: number;
  maxOccupancy: number;
  features: string[];
  images: string[];
  status: string;
}

export default function RoomPage() {
  const params = useLocalSearchParams();
  const { getToken } = useAuth();
  const [room, setRoom] = useState<RoomDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadRoomDetails();
  }, [params.roomId]);

  const loadRoomDetails = async () => {
    try {
      setLoading(true);
      const token = await getToken();
      if (!token) {
        setError('Authentication required');
        return;
      }

      const response = await api.getRoomById(params.roomId as string, token);
      if (response.error) {
        setError(response.error);
      } else {
        setRoom(response);
      }
    } catch (err) {
      setError('Failed to load room details');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteRoom = () => {
    Alert.alert(
      'Delete Room',
      'Are you sure you want to delete this room? This action cannot be undone.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            // TODO: Implement delete room functionality
            Alert.alert('Coming Soon', 'Delete functionality will be available soon!');
          },
        },
      ]
    );
  };

  const handleUpdateRoom = () => {
    // TODO: Implement update room functionality
    Alert.alert('Coming Soon', 'Update functionality will be available soon!');
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

  if (!room) {
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
            className="w-screen h-64"
            resizeMode="cover"
          />
        ))}
      </ScrollView>

      {/* Room Details */}
      <View className="p-4 space-y-4">
        <View className="flex-row justify-between items-center">
          <Text className="text-2xl font-bold dark:text-white">
            Room {room.roomNumber}
          </Text>
          <View className="bg-lime-100 dark:bg-lime-900 px-3 py-1 rounded-full">
            <Text className="text-lime-800 dark:text-lime-200">
              {room.status}
            </Text>
          </View>
        </View>

        <View className="space-y-2">
          <View className="flex-row justify-between">
            <Text className="text-gray-600 dark:text-gray-300">Type</Text>
            <Text className="font-semibold dark:text-white">{room.type}</Text>
          </View>
          <View className="flex-row justify-between">
            <Text className="text-gray-600 dark:text-gray-300">Price per night</Text>
            <Text className="font-semibold dark:text-white">${room.price}</Text>
          </View>
          <View className="flex-row justify-between">
            <Text className="text-gray-600 dark:text-gray-300">Max Occupancy</Text>
            <Text className="font-semibold dark:text-white">{room.maxOccupancy} people</Text>
          </View>
        </View>

        {/* Features */}
        <View>
          <Text className="text-lg font-semibold mb-2 dark:text-white">Features</Text>
          <View className="flex-row flex-wrap gap-2">
            {room.features.map((feature, index) => (
              <View key={index} className="bg-gray-100 dark:bg-gray-800 px-3 py-1 rounded-full">
                <Text className="text-gray-800 dark:text-gray-200">{feature}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Action Buttons */}
        <View className="flex-row justify-between gap-4 mt-6">
          <Pressable
            onPress={handleUpdateRoom}
            className="flex-1 bg-blue-500 p-4 rounded-lg flex-row items-center justify-center"
          >
            <Feather name="edit" size={20} color="white" />
            <Text className="text-white ml-2">Update Details</Text>
          </Pressable>
          
          <Pressable
            onPress={handleDeleteRoom}
            className="flex-1 bg-red-500 p-4 rounded-lg flex-row items-center justify-center"
          >
            <Feather name="trash-2" size={20} color="white" />
            <Text className="text-white ml-2">Delete Room</Text>
          </Pressable>
        </View>
      </View>
    </ScrollView>
  );
}