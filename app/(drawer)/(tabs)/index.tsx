import { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, TextInput, StyleSheet, ScrollView, Image, Dimensions } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Group } from '@/types';
import currentUser from '@/hooks/getCurrentUser';
import JoinGroup from '@/components/JoinGroup';
import GroupManagement from '@/components/GroupManagement';
import api from '@/lib/api';
import { getCurrentGroup, setCurrentGroup } from '@/hooks/getCurrentGroup';
import { router } from 'expo-router';
import { HotelData } from '@/lib/constants';
import { useColorScheme } from '@/lib/useColorScheme';
import Feather from '@expo/vector-icons/Feather';
import { getCurrentHotel, setCurrentHotel } from '@/hooks/getCurrentHotel';

const { width } = Dimensions.get('window');

export default function HomeScreen() {
  const [currentHotel, setCurrentHotelState] = useState(HotelData[0]);
  const { isDarkColorScheme } = useColorScheme();

  useEffect(() => {
    loadCurrentHotel();
  }, []);

  const loadCurrentHotel = async () => {
    const hotelId = await getCurrentHotel();
    if (hotelId) {
      const hotel = HotelData.find(h => h.hotelId === hotelId);
      if (hotel) {
        setCurrentHotelState(hotel);
      }
    }
  };

  return (
    <ScrollView className="flex-1 bg-white dark:bg-black">
      {/* Hero Section */}
      <View className="relative">
        <Image
          source={{ uri: currentHotel.hotelImages[0] }}
          style={{ width, height: width * 0.7 }}
          className="bg-gray-200"
        />
        <View className="absolute bottom-0 left-0 right-0 p-4 bg-black/50">
          <Text className="text-2xl font-bold text-white">
            {currentHotel.hotelName}
          </Text>
          <Text className="text-white mt-1">
            {currentHotel.location}
          </Text>
        </View>
      </View>

      {/* Description */}
      <View className="p-4">
        <Text className="text-lg dark:text-white">
          {currentHotel.description}
        </Text>
      </View>

      {/* Amenities */}
      <View className="p-4">
        <Text className="text-xl font-bold mb-4 dark:text-white">
          Amenities & Services
        </Text>
        <View className="flex-row flex-wrap gap-4">
          {currentHotel.amenities.map((amenity, index) => (
            <View
              key={index}
              className="bg-lime-100 dark:bg-lime-950 rounded-lg p-3 flex-row items-center"
              style={{ width: (width - 32) / 2 - 8 }}
            >
              <Feather name="check-circle" size={20} color="#84cc16" />
              <Text className="ml-2 flex-1 dark:text-white">{amenity}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Rules */}
      <View className="p-4">
        <Text className="text-xl font-bold mb-4 dark:text-white">
          Hotel Rules
        </Text>
        <View className="bg-gray-100 dark:bg-gray-900 rounded-lg p-4">
          <View className="flex-row justify-between mb-2">
            <Text className="dark:text-white">Check-in Time</Text>
            <Text className="dark:text-white">{currentHotel.rules.checkInTime}</Text>
          </View>
          <View className="flex-row justify-between mb-2">
            <Text className="dark:text-white">Check-out Time</Text>
            <Text className="dark:text-white">{currentHotel.rules.checkOutTime}</Text>
          </View>
          <View className="flex-row justify-between mb-2">
            <Text className="dark:text-white">Pets Allowed</Text>
            <Text className="dark:text-white">{currentHotel.rules.petsAllowed ? 'Yes' : 'No'}</Text>
          </View>
          <View className="flex-row justify-between mb-2">
            <Text className="dark:text-white">Max People/Room</Text>
            <Text className="dark:text-white">{currentHotel.rules.maxPeopleInOneRoom}</Text>
          </View>
        </View>
      </View>

      {/* Contact */}
      <View className="p-4 mb-8">
        <Text className="text-xl font-bold mb-4 dark:text-white">
          Contact Information
        </Text>
        <View className="bg-gray-100 dark:bg-gray-900 rounded-lg p-4">
          <View className="flex-row items-center mb-2">
            <Feather name="phone" size={20} color={isDarkColorScheme ? "white" : "black"} />
            <Text className="ml-2 dark:text-white">{currentHotel.contactNumber}</Text>
          </View>
          <View className="flex-row items-center">
            <Feather name="mail" size={20} color={isDarkColorScheme ? "white" : "black"} />
            <Text className="ml-2 dark:text-white">{currentHotel.owner.email}</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#fff',
  },
  createGroup: {
    flexDirection: 'row',
    marginBottom: 16,
    gap: 8,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 8,
    marginRight: 8,
  },
  createButton: {
    backgroundColor: '#007AFF',
    padding: 10,
    borderRadius: 8,
    justifyContent: 'center',
  },
  createButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  list: {
    flex: 1,
  },
  groupItem: {
    flexDirection: 'row',
    padding: 16,
    borderWidth: 1,
    borderColor: '#eee',
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: '#fff',
  },
  selectedGroupItem: {
    borderColor: '#007AFF',
    backgroundColor: '#f0f8ff',
  },
  groupInfo: {
    flex: 1,
  },
  groupName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  groupId: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  groupDetails: {
    fontSize: 14,
    color: '#666',
  },
  deleteButton: {
    backgroundColor: '#FF3B30',
    padding: 8,
    borderRadius: 6,
    alignSelf: 'center',
    marginLeft: 8,
  },
  deleteButtonText: {
    color: '#fff',
  },
});
