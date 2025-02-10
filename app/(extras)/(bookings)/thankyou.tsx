import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, Pressable } from 'react-native';
import { Text } from '@/components/ui/text';
import { useAuth } from '@clerk/clerk-expo';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { useUserStorage } from '@/hooks/useUserStorage';
import { getBookingById } from '@lib/api';

const ThankYou = () => {
  const { getToken } = useAuth();
  const { getUserData } = useUserStorage();
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('Creating your booking...');
  const [error, setError] = useState<string | null>(null);
  const [bookingDetails, setBookingDetails] = useState<any>(null);

  useEffect(() => {
    let mounted = true;
    let pollInterval: NodeJS.Timeout;
    let pollCount = 0;
    const MAX_POLLS = 20; // Maximum number of polling attempts (30 seconds)

    const checkBookingStatus = async () => {
      console.log("checking booking status");
      try {
        const bookingId = await AsyncStorage.getItem('currentBookingId');
        const token = await getToken();
        const userData = await getUserData();

        if (!bookingId || !token) {
          throw new Error('Booking information not found');
        }

        const response = await getBookingById(bookingId, token);

        if (!mounted) return;

        // Store booking details for display
        setBookingDetails(response);

        if (response.status === 'CONFIRMED') {
          setMessage('Booking confirmed! Thank you for booking with us.');
          setLoading(false);
          clearInterval(pollInterval);
          
          // Clear the current booking ID
          // await AsyncStorage.removeItem('currentBookingId');
          
          // After 4 seconds, redirect to bookings page
          setTimeout(() => {
            router.replace('/');
          }, 4000);
        } else if (response.status === 'CANCELLED') {
          setError('Booking was cancelled');
          setLoading(false);
          clearInterval(pollInterval);
        } else if (response.status === 'PENDING') {
          // For owners/managers, we don't need to wait for confirmation

          //practically no use because if they are creating a booking then response is Confirmed by default.
          //also booking will not be fetched as in their storage we are not storing current booking Id
          if (userData?.role === 'OWNER' || userData?.role === 'MANAGER') {
            setMessage('Booking created successfully!');
            setLoading(false);
            clearInterval(pollInterval);
            
            // Clear the current booking ID
            await AsyncStorage.removeItem('currentBookingId');
            
            // After 4 seconds, redirect to bookings page
            setTimeout(() => {
              router.replace('/(drawer)/(tabs)/bookings');
            }, 4000);
          } else {
            pollCount++;
            if (pollCount >= MAX_POLLS) {
              setMessage('Your booking is pending approval from the hotel.');
              setLoading(false);
              clearInterval(pollInterval);
            } else {
              setMessage('Waiting for confirmation from hotel...');
            }
          }
        }
      } catch (error) {
        if (!mounted) return;
        console.error('Error checking booking status:', error);
        setError('Failed to check booking status');
        setLoading(false);
        clearInterval(pollInterval);
      }
    };

    // Start polling after 15 seconds
    setTimeout(() => {
      pollInterval = setInterval(checkBookingStatus, 4000);
    }, 15000);

    // Initial check
    checkBookingStatus();
    
    return () => {
      mounted = false;
      clearInterval(pollInterval);
    };
  }, []);

  if (error) {
    return (
      <View className="flex-1 justify-center items-center p-4">
        <Text className="text-red-500 text-lg mb-4">{error}</Text>
        <Pressable 
          onPress={() => router.back()}
          className="bg-blue-500 px-4 py-2 rounded-lg"
        >
          <Text className="text-white">Go Back</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View className="flex-1 justify-center items-center p-4">
      <Text className="text-2xl font-bold mb-6 dark:text-white text-center">
        {message}
      </Text>

      {bookingDetails && (
        <View className="bg-white dark:bg-gray-800 rounded-lg p-4 w-full mb-6 border border-gray-200 dark:border-gray-700">
          <Text className="text-lg font-bold dark:text-white mb-4">Booking Details</Text>
          
          <View className="space-y-2">
            <View className="flex-row justify-between">
              <Text className="dark:text-white">Check-in</Text>
              <Text className="dark:text-white font-semibold">
                {new Date(bookingDetails.checkIn).toLocaleDateString()}
              </Text>
            </View>
            
            <View className="flex-row justify-between">
              <Text className="dark:text-white">Check-out</Text>
              <Text className="dark:text-white font-semibold">
                {new Date(bookingDetails.checkOut).toLocaleDateString()}
              </Text>
            </View>

            <View className="flex-row justify-between">
              <Text className="dark:text-white">Guests</Text>
              <Text className="dark:text-white font-semibold">{bookingDetails.guests}</Text>
            </View>

            <View className="h-px bg-gray-200 dark:bg-gray-700 my-2" />

            <View className="flex-row justify-between">
              <Text className="dark:text-white font-bold">Total Amount</Text>
              <Text className="dark:text-white font-bold">₹{bookingDetails.payment.totalAmount}</Text>
            </View>

            <View className="flex-row justify-between">
              <Text className="dark:text-white">Payment Status</Text>
              <Text className={`font-semibold ${
                bookingDetails.payment.status === 'COMPLETED' 
                  ? 'text-green-500' 
                  : 'text-yellow-500'
              }`}>
                {bookingDetails.payment.status}
              </Text>
            </View>
          </View>
        </View>
      )}

      {loading && (
        <>
          <ActivityIndicator size="large" color="#0000ff" />
          <Text className="text-lg mt-4 dark:text-white text-center">
            Please wait while we process your booking...
          </Text>
        </>
      )}
    </View>
  );
};

export default ThankYou; 