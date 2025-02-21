import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, Text } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useAuth } from '@clerk/clerk-expo';
import { BookingDataInDb } from '@/types/index';
import BookingDetails from '@/components/bookings/BookingDetails';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getBookingById } from '@lib/api';

export default function BookingDetailsPage() {
  const params = useLocalSearchParams();
  const { getToken } = useAuth();
  const [booking, setBooking] = useState<BookingDataInDb | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const updateLocalStorage = async (updatedBooking: BookingDataInDb) => {
    try {
      // Get current hotel bookings from storage
      const storedBookingsStr = await AsyncStorage.getItem(`hotelBookings_${updatedBooking.hotelId}`);
      if (storedBookingsStr) {
        const storedBookings = JSON.parse(storedBookingsStr);
        // Update the specific booking
        const updatedBookings = storedBookings.map((b: BookingDataInDb) => 
          b.id === updatedBooking.id ? updatedBooking : b
        );
        // Store updated bookings
        await AsyncStorage.setItem(
          `hotelBookings_${updatedBooking.hotelId}`,
          JSON.stringify(updatedBookings)
        );
      }
    } catch (err) {
      console.error('Error updating local storage:', err);
    }
  };

  const loadBookingDetails = async () => {
    try {
      setLoading(true);
      const token = await getToken();
      if (!token) {
        setError("Authentication required");
        return;
      }

      const response = await getBookingById(params.id as string, token);
      if (response.error) {
        setError(response.error);
      } else {
        setBooking(response);
        // Update local storage with fresh data
        await updateLocalStorage(response);
      }
    } catch (err) {
      setError("Failed to load booking details");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBookingDetails();
  }, [params.id]);

  const handleBookingUpdated = async () => {
    await loadBookingDetails();
  };

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center">
        <ActivityIndicator size="large" color="#84cc16" />
      </View>
    );
  }

  if (error || !booking) {
    return (
      <View className="flex-1 justify-center items-center p-4">
        <Text className="text-red-500 text-center mb-4">{error || "Booking not found"}</Text>
      </View>
    );
  }

  return (
    <BookingDetails
      booking={booking}
      onClose={() => router.back()}
      onBookingUpdated={handleBookingUpdated}
    />
  );
} 