import React from 'react';
import { View, Image, Pressable } from 'react-native';
import { Text } from '@/components/ui/text';
import { Button } from '@/components/ui/button';
import { Room } from '@/types';

interface RoomCardProps {
  room: Room;
  onBookNow: (roomId: string, price: number) => void;
  hideImage?: boolean;
}

const RoomCard = ({ room, onBookNow, hideImage = false }: RoomCardProps) => {
  return (
    <View className="mb-4 bg-white border border-gray-600 shadow-lg shadow-black dark:shadow-gray-300 dark:bg-gray-800 rounded-lg overflow-hidden">
      {!hideImage && room.images[0] && (
        <Image
          source={{ uri: room.images[0] }}
          className="w-full h-48"
          resizeMode="cover"
        />
      )}
      <View className="p-4">
        <View className="flex-row justify-between items-center">
          <Text className="text-xl font-bold dark:text-white">
            {room.type}
          </Text>
          <Text className="text-gray-600 text-lg dark:text-gray-300">
            Room {room.roomNumber}
          </Text>
        </View>
        <View className="flex-row justify-between items-center">
          <Text className="text-gray-600 dark:text-gray-300">
            Max Occupancy: {room.maxOccupancy}
          </Text>
          <Text className="text-lg font-semibold dark:text-white">
            ₹{room.price}/night
          </Text>
        </View>

        <View className="flex-row flex-wrap mt-2">
          {room.features.map((feature) => (
            <View
              key={feature}
              className="bg-gray-200 dark:bg-gray-700 rounded-full px-2 py-1 mr-2 mb-2"
            >
              <Text className="text-sm dark:text-white">{feature}</Text>
            </View>
          ))}
        </View>

        <Pressable
          onPress={() => onBookNow(room.id, room.price)}
          className="mt-3 bg-blue-500 p-2 rounded-lg"
        >
          <Text className="text-white text-lg">Book Now</Text>
        </Pressable>
      </View>
    </View>
  );
};

export default RoomCard; 