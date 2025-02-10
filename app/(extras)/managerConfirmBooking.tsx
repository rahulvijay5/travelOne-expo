import React, { useState, useEffect } from 'react';
import { View, ScrollView, TextInput, ActivityIndicator, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text } from '@/components/ui/text';
import { Button } from '@/components/ui/button';
import { useLocalSearchParams, router } from 'expo-router';
import { useUserStorage } from '@/hooks/useUserStorage';
import { useAuth } from '@clerk/clerk-expo';
import api from '@/lib/api';
import { ChevronLeft } from 'lucide-react-native';
import { useTheme } from '@react-navigation/native';
import { Room } from '@/types';

const ManagerConfirmBooking = () => {
  const { roomId, hotelId, customerId, noOfGuests, checkIn, checkOut, price, extraMattress } = useLocalSearchParams();
  const { getUserData } = useUserStorage();
  const { colors } = useTheme();
  const { getToken } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [room, setRoom] = useState<Room | null>(null);
  const [paidAmount, setPaidAmount] = useState('0');
  const [bookingConfirmed, setBookingConfirmed] = useState(false);
  // Fetch room details
  useEffect(() => {
    const fetchRoom = async () => {
      try {
        const response = await api.getHotelRoomsByStatus(hotelId as string);
        const roomData = response.find((r: Room) => r.id === roomId);
        if (roomData) {
          setRoom(roomData);
        }
      } catch (error) {
        console.error('Error fetching room:', error);
        setError('Failed to fetch room details');
      }
    };

    fetchRoom();
    
  }, [roomId, hotelId]);

  const handleCreateBooking = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = await getToken();

      if (!token) {
        throw new Error('User not authenticated');
      }

      const checkInDate = new Date(checkIn as string);
      const checkOutDate = new Date(checkOut as string);
      const nights = Math.ceil((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24));
      const totalAmount = nights * parseFloat(price as string);

      const bookingData = {
        hotelId: hotelId as string,
        roomId: roomId as string,
        customerId: customerId as string,
        checkIn: checkInDate.toISOString(),
        checkOut: checkOutDate.toISOString(),
        guests: parseInt(noOfGuests as string),
        status: "CONFIRMED" as const,
        payment: {
          totalAmount,
          paidAmount: parseFloat(paidAmount),
          status: "PAID" as const,
          transactionId: "OFFLINE"
        }
      };

      const response = await api.createBooking(bookingData, token);

      setError(response.error);

      // Save booking data to storage
      if(!response.error){
        setBookingConfirmed(true);
        setTimeout(() => {
          setBookingConfirmed(false);
          router.replace('/(drawer)/(tabs)/bookings');
        }, 2000);
      }
      
    } catch (error) {
      console.error('Error creating booking:', error);
      setError(error instanceof Error ? error.message : 'Failed to create booking');
    } finally {
      setLoading(false);
    }
  };

  const checkInDate = new Date(checkIn as string);
  const checkOutDate = new Date(checkOut as string);
  const nights = Math.ceil((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24));
  const totalAmount = nights * parseFloat(price as string);

  return (
    <SafeAreaView className="flex-1">   
      <ScrollView className="flex-1 p-4">
        <View className="flex gap-4">
          <View className="flex-row justify-start items-center">
            <Pressable onPress={() => router.back()}>
              <ChevronLeft size={24} color={colors.text} />
            </Pressable>
            <Text className="text-2xl font-bold dark:text-white">Confirm Booking</Text>
          </View>

          {error && (
            <View className="bg-red-100 dark:bg-red-900 p-3 rounded-lg">
              <Text className="text-red-500 dark:text-red-100">{error}</Text>
            </View>
          )}

          {bookingConfirmed && (
            <View className="bg-green-100 dark:bg-green-900 p-3 rounded-lg">
              <Text className="text-green-500 dark:text-green-100">Booking confirmed successfully!</Text>
            </View>
          )}

          {room && (
            <View className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
              <View className="flex-row justify-between items-center">
                <Text className="text-xl font-bold dark:text-white">{room.type}</Text>
                <Text className="text-gray-600 text-xl font-bold dark:text-gray-300">{room.roomNumber}</Text>
              </View>
              <View className="flex-row justify-between items-center mt-2">
                <Text className="text-gray-600 dark:text-gray-300">Max Occupancy: {room.maxOccupancy}</Text>
                <Text className="text-lg font-semibold dark:text-white">₹{room.price}/night</Text>
              </View>
              <View className="flex-row flex-wrap mt-2">
                {room.features.map(feature => (
                  <View key={feature} className="bg-gray-200 dark:bg-gray-700 rounded-full px-2 py-1 mr-2 mb-2">
                    <Text className="text-sm dark:text-white">{feature}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          <View className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
            <Text className="text-lg font-bold dark:text-white mb-4">Booking Details</Text>
            
            <View className="space-y-2">
              <View className="flex-row justify-between">
                <Text className="dark:text-white">Check-in</Text>
                <Text className="dark:text-white font-semibold">{checkInDate.toLocaleDateString()}</Text>
              </View>
              
              <View className="flex-row justify-between">
                <Text className="dark:text-white">Check-out</Text>
                <Text className="dark:text-white font-semibold">{checkOutDate.toLocaleDateString()}</Text>
              </View>

              <View className="flex-row justify-between">
                <Text className="dark:text-white">Number of Nights</Text>
                <Text className="dark:text-white font-semibold">{nights}</Text>
              </View>

              <View className="flex-row justify-between">
                <Text className="dark:text-white">Guests</Text>
                <Text className="dark:text-white font-semibold">{noOfGuests}</Text>
              </View>

              {extraMattress==="true" && (
                <View className="flex-row justify-between">
                  <Text className="dark:text-white">Extra Mattress</Text>
                  <Text className="dark:text-white font-semibold">Yes</Text>
                </View>
              )}
              <View className="h-px bg-gray-200 dark:bg-gray-700 my-2" />

              <View className="flex-row justify-between items-center">
                <Text className="dark:text-white font-bold">Total Amount</Text>
                <Text className="dark:text-white text-xl font-bold">₹{totalAmount}</Text>
              </View>
            </View>
          </View>

          <View className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
            <Text className="text-lg font-bold dark:text-white mb-4">Payment Details</Text>
            
            <View className="space-y-4">
              <View className='flex items-center justify-between flex-row'>
                <Text className="dark:text-white mb-2">Amount Paid</Text>
                <TextInput
                  className="border border-gray-300 dark:border-gray-600 rounded-lg p-3 dark:text-white"
                  value={paidAmount}
                  onChangeText={setPaidAmount}
                  keyboardType="numeric"
                  placeholder="Enter amount paid"
                  placeholderTextColor="#666"
                />
              </View>

              {/* <View className="flex-row justify-between items-center">
                <Text className="dark:text-white">Payment Status</Text>
                <Text className={`font-semibold ${
                  parseFloat(paidAmount) >= totalAmount 
                    ? 'text-green-500' 
                    : 'text-yellow-500'
                }`}>
                  {parseFloat(paidAmount) >= totalAmount ? 'COMPLETED' : 'PENDING'}
                </Text>
              </View>

              {parseFloat(paidAmount) < totalAmount && (
                <View className="flex-row justify-between items-center">
                  <Text className="dark:text-white">Remaining Amount</Text>
                  <Text className="text-yellow-500 font-semibold">
                    ₹{totalAmount - parseFloat(paidAmount || '0')}
                  </Text>
                </View>
              )} */}
            </View>
          </View>

          <Pressable
            onPress={handleCreateBooking}
            className="bg-blue-500 p-4 rounded-lg"
            disabled={loading || parseFloat(paidAmount) === 0}
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text className="text-white text-lg font-semibold text-center">
                Confirm Booking
              </Text>
            )}
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default ManagerConfirmBooking; 