import { View, ActivityIndicator, Share } from 'react-native'
import React, { useEffect, useState } from 'react'
import { useLocalSearchParams } from 'expo-router';
import { Text } from '@/components/ui/text';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@clerk/clerk-expo';
import api from '@/lib/api';
import { APP_NAME, APP_URL } from '@/lib/constants';

interface Manager {
  id: string;
  clerkId: string;
  name: string;
  email: string;
  phoneNumber: string;
  role: string;
}

const ManagePeople = () => {
  const params = useLocalSearchParams();
  const hotelId = params.hotelId as string;
  const { getToken } = useAuth();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResult, setSearchResult] = useState<Manager | null>(null);
  const [searchError, setSearchError] = useState('');
  
  const [managers, setManagers] = useState<Manager[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!hotelId) return;
    loadManagers();
  }, [hotelId]);

  const loadManagers = async () => {
    try {
      const token = await getToken();
      if (!token) {
        console.error("No auth token available");
        return;
      }

      console.log("Loading managers for hotel:", hotelId);
      const response = await api.getHotelManagers(hotelId, token);
      console.log("Managers response:", response);
      setManagers(response);
      setIsLoading(false);
    } catch (error) {
      console.error("Error loading managers:", error);
      setIsLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setSearchError('Please enter a phone number');
      return;
    }

    setIsSearching(true);
    setSearchError('');
    setSearchResult(null);

    try {
      const token = await getToken();
      if (!token) {
        console.error("No auth token available");
        setSearchError('Authentication error');
        return;
      }

      console.log("Searching for user with phone:", searchQuery);
      const response = await api.searchUserByPhone(searchQuery, token);
      console.log("Search response:", response);
      
      if (response && response.length > 0) {
        setSearchResult(response[0]);
      } else {
        setSearchError(`No user exists with this phone number, type correct phone number or invite them to ${APP_NAME} first!`);
      }
    } catch (error) {
      console.error("Error searching user:", error);
      setSearchError('Error searching for user');
    } finally {
      setIsSearching(false);
    }
  };

  const handleAddManager = async () => {
    if (!searchResult) return;

    try {
      const token = await getToken();
      if (!token) {
        console.error("No auth token available");
        setSearchError('Authentication error');
        return;
      }

      console.log("Adding manager:", searchResult.id, "to hotel:", hotelId);
      await api.addManagerToHotel(hotelId, searchResult.id, token);
      console.log("Manager added successfully");
      
      // Refresh managers list
      await loadManagers();
      
      // Clear search
      setSearchQuery('');
      setSearchResult(null);
    } catch (error) {
      console.error("Error adding manager:", error);
      setSearchError('Error adding manager to hotel');
    }
  };

  const handleRemoveManager = async (managerId: string) => {
    try {
      const token = await getToken();
      if (!token) {
        console.error("No auth token available");
        return;
      }

      console.log("Removing manager:", managerId, "from hotel:", hotelId);
      await api.removeManagerFromHotel(hotelId, managerId, token);
      console.log("Manager removed successfully");
      
      // Refresh managers list
      await loadManagers();
    } catch (error) {
      console.error("Error removing manager:", error);
    }
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Join ${APP_NAME} using this link: ${APP_URL}`,
      });
    } catch (error) {
      console.error("Error sharing app:", error);
    }
  };

  if (!hotelId) {
    return (
      <View className="flex-1 justify-center items-center">
        <Text className="text-red-500">Hotel ID is required</Text>
      </View>
    );
  }

  if (isLoading) {
    return (
      <View className="flex-1 justify-center items-center">
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View className="flex-1 p-4">
      {/* Search Section */}
      <View className="">
        <Text className="text-xl font-semibold mb-2 dark:text-white text-black">Search Manager</Text>
        <View className="flex-row gap-2 h-14 p-1 items-center justify-between border-2 dark:border-gray-800 border-gray-300 rounded-lg">
          <Input
            className="flex-1 dark:text-white text-black rounded-lg p-2"
            placeholder="Enter phone number"
            value={searchQuery}
            onChangeText={setSearchQuery}
            keyboardType="phone-pad"
          />
          <Button
            onPress={handleSearch}
            disabled={isSearching}
            className="w-1/5 justify-center bg-blue-500 p-2"
          >
            {isSearching ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <Text className="text-white font-bold text-lg">Search</Text>
            )}
          </Button>
        </View>

        {searchError ? (
          <View className="mt-2">
            <Text className="text-red-500">{searchError}</Text>
            <Button
              onPress={handleShare}
              variant="outline"
              className="mt-2 p-2 bg-blue-500 rounded-lg"
            >
              <Text className="font-bold text-lg text-white">Share App</Text>
            </Button>
          </View>
        ) : null}

        {searchResult ? (
          <View className="mt-4 bg-gray-100 dark:bg-gray-900 p-4 rounded-lg border dark:border-gray-300 border-gray-800">
            <Text className="font-semibold text-xl dark:text-white text-black">{searchResult.name}</Text>
            <Text className="text-muted-foreground text-right dark:text-white text-black">{searchResult.phoneNumber}</Text>
            <Button
              onPress={handleAddManager}
              className="mt-2 p-2 dark:bg-blue-900 bg-blue-400 rounded-lg"
            >
              <Text className="text-white font-bold text-lg">Add as Manager</Text>
            </Button>
          </View>
        ) : null}
      </View>

      <Separator className="my-4" />

      {/* Managers List */}
      <View>
        <Text className="text-xl font-semibold mb-4 dark:text-white text-black">Current Managers</Text>
        {managers.length === 0 ? (
          <Text className="text-muted-foreground dark:text-white text-black">No managers added yet</Text>
        ) : (
          <View className="space-y-2">
            {managers.map((manager) => (
              <View
                key={manager.id}
                className="flex-row justify-between items-center bg-gray-200 dark:bg-gray-800 p-4 rounded-lg border dark:border-gray-300 border-gray-800"
              >
                <View>
                  <Text className="font-semibold text-lg dark:text-white text-black">{manager.name}</Text>
                  <Text className="text-muted-foreground text-sm dark:text-white text-black">{manager.phoneNumber}</Text>
                </View>
                <Button
                  variant="destructive"
                  onPress={() => handleRemoveManager(manager.id)}
                  className="p-2 dark:bg-red-900 bg-red-400 rounded-lg px-4"
                >
                  <Text className="text-white font-bold text-lg">Remove</Text>
                </Button>
              </View>
            ))}
          </View>
        )}
      </View>
    </View>
  );
};

export default ManagePeople;