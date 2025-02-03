import React, { useState } from 'react';
import { View, ScrollView, TextInput, ActivityIndicator } from 'react-native';
import { Text } from '@/components/ui/text';
import { Button } from '@/components/ui/button';
import { useLocalSearchParams, router } from 'expo-router';
import { useUserStorage } from '@/hooks/useUserStorage';
import { useAuth } from '@clerk/clerk-expo';
import DateTimePicker from '@react-native-community/datetimepicker';
import api from '@/lib/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

const CreateBookingByManager = () => {
  const { getUserData } = useUserStorage();
  const { getToken } = useAuth();
  const [loading, setLoading] = useState(false);
  const [guests, setGuests] = useState('1');
  const [checkIn, setCheckIn] = useState(new Date());
  const [checkOut, setCheckOut] = useState(new Date(Date.now() + 86400000)); // Tomorrow
  const [showCheckInPicker, setShowCheckInPicker] = useState(false);
  const [showCheckOutPicker, setShowCheckOutPicker] = useState(false);
  const [customerPhone, setCustomerPhone] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleCreateBooking = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = await getToken();
      if (!token) {
        throw new Error('Not authenticated');
      }

      // First, search for customer by phone
      const customerResponse = await api.searchUserByPhone(customerPhone, token);
      if (!customerResponse || customerResponse.error) {
        throw new Error('Customer not found. Please ask them to register first.');
      }

      // TODO: Add room selection UI
      // For now, we'll just show an error
      throw new Error('Room selection not implemented yet');

      // The rest of the booking creation logic will go here
      // Similar to the guest booking flow
    } catch (error) {
      console.error('Error creating booking:', error);
      setError(error instanceof Error ? error.message : 'Failed to create booking');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView className="flex-1 p-4">
      <View className="space-y-4">
        <Text className="text-2xl font-bold mb-4 dark:text-white">Create Booking for Customer</Text>

        {error && (
          <View className="bg-red-100 dark:bg-red-900 p-3 rounded-lg mb-4">
            <Text className="text-red-500 dark:text-red-100">{error}</Text>
          </View>
        )}

        <View>
          <Text className="text-base mb-2 dark:text-white">Customer Phone Number</Text>
          <TextInput
            className="border border-gray-300 dark:border-gray-600 rounded-lg p-3 dark:text-white"
            value={customerPhone}
            onChangeText={setCustomerPhone}
            keyboardType="phone-pad"
            placeholder="Enter customer's phone number"
            placeholderTextColor="#666"
          />
        </View>

        <View>
          <Text className="text-base mb-2 dark:text-white">Number of Guests</Text>
          <TextInput
            className="border border-gray-300 dark:border-gray-600 rounded-lg p-3 dark:text-white"
            value={guests}
            onChangeText={setGuests}
            keyboardType="numeric"
            placeholder="Enter number of guests"
            placeholderTextColor="#666"
          />
        </View>

        <View>
          <Text className="text-base mb-2 dark:text-white">Check-in Date</Text>
          <Button
            onPress={() => setShowCheckInPicker(true)}
            className="bg-blue-500"
          >
            <Text className="text-white">{checkIn.toLocaleDateString()}</Text>
          </Button>
          {showCheckInPicker && (
            <DateTimePicker
              value={checkIn}
              mode="date"
              onChange={(event, date) => {
                setShowCheckInPicker(false);
                if (date) setCheckIn(date);
              }}
              minimumDate={new Date()}
            />
          )}
        </View>

        <View>
          <Text className="text-base mb-2 dark:text-white">Check-out Date</Text>
          <Button
            onPress={() => setShowCheckOutPicker(true)}
            className="bg-blue-500"
          >
            <Text className="text-white">{checkOut.toLocaleDateString()}</Text>
          </Button>
          {showCheckOutPicker && (
            <DateTimePicker
              value={checkOut}
              mode="date"
              onChange={(event, date) => {
                setShowCheckOutPicker(false);
                if (date) setCheckOut(date);
              }}
              minimumDate={new Date(checkIn.getTime() + 86400000)}
            />
          )}
        </View>

        <Button
          onPress={handleCreateBooking}
          className="mt-6 bg-blue-500"
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text className="text-white text-lg">Create Booking</Text>
          )}
        </Button>
      </View>
    </ScrollView>
  );
};

export default CreateBookingByManager; 