import React, { useState } from 'react';
import { View, ScrollView, TextInput, TouchableOpacity } from 'react-native';
import { Text } from '@/components/ui/text';
import { Button } from '@/components/ui/button';
import { useLocalSearchParams, router } from 'expo-router';
import { RoomForm } from '@/types';
import { defaultRoomFeatures } from '@/lib/constants';
const RoomDetails = () => {
  const { id } = useLocalSearchParams();
  const [rooms, setRooms] = useState<RoomForm[]>([]);
  const [currentRoom, setCurrentRoom] = useState<RoomForm>({
      roomNumber: '',
    type: '',
    price: '',
    maxOccupancy: '',
    available: true,
    features: [],
    customFeature: '',
    images: [],
  });

  const handleFeatureToggle = (feature: string) => {
    setCurrentRoom(prev => ({
      ...prev,
      features: prev.features.includes(feature)
        ? prev.features.filter(f => f !== feature)
        : [...prev.features, feature]
    }));
  };

  const addCustomFeature = () => {
    if (currentRoom.customFeature.trim()) {
      setCurrentRoom(prev => ({
        ...prev,
        features: [...prev.features, prev.customFeature.trim()],
        customFeature: ''
      }));
    }
  };

  const addRoom = () => {
    // Validate required fields
    const requiredFields = ['name', 'type', 'roomNumber', 'price', 'maxOccupancy'];
    const missingFields = requiredFields.filter(field => !currentRoom[field as keyof RoomForm]);
    
    if (missingFields.length > 0) {
      alert(`Please fill in all required fields: ${missingFields.join(', ')}`);
      return;
    }

    setRooms(prev => [...prev, currentRoom]);
    setCurrentRoom({
      type: '',
      roomNumber: '',
      price: '',
      maxOccupancy: '',
      available: true,
      features: [],
      customFeature: '',
      images: [],
    });
  };

  const handleFinish = () => {
    if (rooms.length === 0) {
      alert('Please add at least one room');
      return;
    }

    // Here you would typically save the rooms to the backend
    // For now, we'll just redirect back to the main screen
    router.push("/(drawer)/(tabs)");
  };

  return (
    <ScrollView className="flex-1">
        <View className="w-full h-0.5 bg-gray-200 rounded-full">
        <View className="w-full h-full bg-blue-500 rounded-full" />
      </View>
      <View className="flex-1 p-4">
      

      {/* Added Rooms List */}
      {rooms.length > 0 && (
        <View className="mb-6">
          <Text className="text-lg font-semibold mb-2 dark:text-white">Added Rooms:</Text>
          {rooms.map((room, index) => (
            <View key={index} className="bg-gray-100 dark:bg-gray-800 p-3 rounded-lg mb-2">
              <Text className="dark:text-white">{room.roomNumber} - {room.type}</Text>
              <Text className="dark:text-white">Price: ${room.price}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Room Form */}
      <View className="space-y-4 gap-3">
        {/* <View>
          <Text className="text-base mb-2 dark:text-white">Room Name *</Text>
          <TextInput
            className="border border-gray-300 dark:border-gray-600 rounded-lg p-3 dark:text-white"
            value={currentRoom.name}
            onChangeText={(text) => setCurrentRoom(prev => ({ ...prev, name: text }))}
            placeholder="Enter room name"
            placeholderTextColor="#666"
          />
        </View> */}
        <View>
          <Text className="text-base mb-2 dark:text-white">Room Number *</Text>
          <TextInput
            className="border border-gray-300 dark:border-gray-600 rounded-lg p-3 dark:text-white"
            value={currentRoom.roomNumber}
            onChangeText={(text) => setCurrentRoom(prev => ({ ...prev, roomNumber: text }))}
            placeholder="Enter room number"
            placeholderTextColor="#666"
          />
        </View>

        <View>
          <Text className="text-base mb-2 dark:text-white">Room Type *</Text>
          <TextInput
            className="border border-gray-300 dark:border-gray-600 rounded-lg p-3 dark:text-white"
            value={currentRoom.type}
            onChangeText={(text) => setCurrentRoom(prev => ({ ...prev, type: text }))}
            placeholder="e.g., Standard, Deluxe, Suite"
            placeholderTextColor="#666"
          />
        </View>


        <View className="flex-row items-center gap-2 justify-between">
          <Text className="text-base mb-2 dark:text-white">Price per Night *</Text>
          <TextInput
            className="border border-gray-300 w-1/3 dark:border-gray-600 rounded-lg p-3 dark:text-white"
            value={currentRoom.price}
            onChangeText={(text) => setCurrentRoom(prev => ({ ...prev, price: text.replace(/[^0-9]/g, '') }))}
            placeholder="Enter price"
            placeholderTextColor="#666"
            keyboardType="numeric"
          />
        </View>

        <View className="flex-row items-center gap-2 justify-between">
          <Text className="text-base mb-2 dark:text-white">Max Occupancy: *</Text>
          <TextInput
            className="border border-gray-300 dark:border-gray-600 rounded-lg p-2 px-4 dark:text-white"
            value={currentRoom.maxOccupancy}
            onChangeText={(text) => setCurrentRoom(prev => ({ ...prev, maxOccupancy: text.replace(/[^0-9]/g, '') }))}
            placeholder="2"
            placeholderTextColor="#666"
            keyboardType="numeric"
          />
        </View>

        <View>
          <Text className="text-base mb-2 dark:text-white">Features</Text>
          <View className="flex-row flex-wrap gap-2">
            {defaultRoomFeatures.map((feature) => (
              <Button
                key={feature}
                onPress={() => handleFeatureToggle(feature)}
                className={`px-3 py-2  ${
                  currentRoom.features.includes(feature)
                    ? 'bg-blue-500'
                    : 'bg-gray-200 dark:bg-gray-700'
                }`}
              >
                <Text className={currentRoom.features.includes(feature) ? 'text-white' : 'dark:text-white'}>
                  {feature}
                </Text>
              </Button>
            ))}
          </View>
        </View>

        <View className="flex-row items-center gap-2">
          <TextInput
            className="flex-1 border border-gray-300 dark:border-gray-600 rounded-lg p-3 dark:text-white"
            value={currentRoom.customFeature}
            onChangeText={(text) => setCurrentRoom(prev => ({ ...prev, customFeature: text }))}
            placeholder="Add custom feature"
            placeholderTextColor="#666"
          />
          <Button onPress={addCustomFeature} className="bg-blue-500">
            <Text className="text-white">Add</Text>
          </Button>
        </View>

        <Button
          onPress={addRoom}
          className="mt-6 bg-blue-500"
        >
          <Text className="text-white text-lg">Add Room</Text>
        </Button>

        {rooms.length > 0 && (
          <Button
            onPress={handleFinish}
            className="mt-4 bg-green-500"
          >
            <Text className="text-white text-lg">Finish Setup</Text>
          </Button>
        )}
      </View>

      </View>
    </ScrollView>
  );
};

export default RoomDetails; 