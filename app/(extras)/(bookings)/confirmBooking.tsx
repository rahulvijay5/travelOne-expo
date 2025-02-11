import React, { useState, useEffect } from 'react';
import { View, ScrollView, ActivityIndicator, Image, Pressable, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text } from '@/components/ui/text';
import { Button } from '@/components/ui/button';
import { useLocalSearchParams, router } from 'expo-router';
import { useUserStorage } from '@/hooks/useUserStorage';
import { useAuth } from '@clerk/clerk-expo';
import DateTimePicker from '@react-native-community/datetimepicker';
import { createBooking, saveBookingToStorage, getHotelRoomsByStatus, getRoomById } from '@lib/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ArrowLeft, ChevronLeft } from 'lucide-react-native';
import { useTheme } from '@react-navigation/native';
import { Room } from '@/types';
import { navigateTo } from '@/lib/actions/navigation';
// import DocumentUploader from '@/components/DocumentUploader';

const CreateBooking = () => {
  const { roomId, hotelId, noOfGuests, checkIn, checkOut, price } = useLocalSearchParams();
  const { getUserData } = useUserStorage();
  const { colors } = useTheme();
  const { getToken } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [room, setRoom] = useState<Room | null>(null);
  const [paymentMode, setPaymentMode] = useState<'ONLINE' | 'OFFLINE'>('OFFLINE');
  const [guestInfoNeeded, setGuestInfoNeeded] = useState(false);
  const [documentUrl, setDocumentUrl] = useState<string | null>(null);

useEffect(() => {
  const fetchRoomDetails = async () => {
    const token = await getToken();
    if (!token) {
      navigateTo("/not-authenticated");
      return;
    }
    const response = await getRoomById(roomId as string, token);
    if (response.error) {
      setError(response.error);
    } else {
      setRoom(response);
    }
  };
  fetchRoomDetails();
}, [roomId, hotelId]);


  // Fetch room details
  // useEffect(() => {
  //   const fetchData = async () => {
  //     try {
  //       const [
  //         roomsResponse, 
  //         // hotelDetails
  //       ] = await Promise.all([
  //         getHotelRoomsByStatus(hotelId as string),
  //         // AsyncStorage.getItem('@current_hotel_details')
  //       ]);
  //       const roomData = roomsResponse.find((r: Room) => r.id === roomId);
  //       if (roomData) {
  //         setRoom(roomData);
  //       }
  //       // if (hotelDetails) {
  //       //   const hotelDetailsData = JSON.parse(hotelDetails);
  //       //   setGuestInfoNeeded(hotelDetailsData.rules.guestInfoNeeded);
  //       // }
  //     } catch (error) {
  //       console.error('Error fetching data:', error);
  //       setError('Failed to fetch booking details');
  //     }
  //   };

  //   fetchData();
  // }, [roomId, hotelId]);



  const handleCreateBooking = async () => {
    // if (guestInfoNeeded && !documentUrl) {
    //   setError('Document Required, Please upload your government ID.');
    //   return;
    // }
    try {
      setLoading(true);
      setError(null);
      const userData = await getUserData();
      const token = await getToken();

      if (!userData?.userId || !token) {
        throw new Error('User not authenticated');
      }

      const checkInDate = new Date(checkIn as string);
      const checkOutDate = new Date(checkOut as string);
      const nights = Math.ceil((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24));
      const totalAmount = nights * parseFloat(price as string);

      const bookingData = {
        hotelId: hotelId as string,
        roomId: roomId as string,
        customerId: userData.userId,
        checkIn: checkInDate.toISOString(),
        checkOut: checkOutDate.toISOString(),
        guests: parseInt(noOfGuests as string),
        status: "PENDING" as const,
        payment: {
          totalAmount,
          paidAmount: 0,
          status: "PENDING" as const,
          transactionId: "OFFLINE"
        },
        // documentUrl
      };

      const response = await createBooking(bookingData, token);
      
      // Save booking data to storage
      await saveBookingToStorage(response);
      
      // Store booking ID for thank you page
      await AsyncStorage.setItem('currentBookingId', response.id);

      // Navigate to thank you page
      navigateTo('/thankyou');
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
{/* 
          {guestInfoNeeded && (
            <DocumentUploader onUploadSuccess={(url: string) => setDocumentUrl(url)} />
          )} */}

          {room && (
            <View className="bg-white dark:bg-gray-800 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
              {room.images[0] && (
                <Image
                  source={{ uri: room.images[0] }}
                  className="w-full h-48"
                  resizeMode="cover"
                />
              )}
              <View className="p-4">
                <View className="flex-row justify-between items-center">
                  <Text className="text-xl font-bold dark:text-white">{room.type}</Text>
                  <Text className="text-gray-600 text-xl font-bold dark:text-gray-300">{room.roomNumber}</Text>
                </View>
                {/* <Text className="text-gray-600 dark:text-gray-300 mt-1">Max Occupancy: {room.maxOccupancy}</Text>
                <Text className="text-lg font-semibold dark:text-white mt-2">₹{room.price}/night</Text> */}
                
                <View className="flex-row flex-wrap mt-2">
                  {room.features.map(feature => (
                    <View key={feature} className="bg-gray-200 dark:bg-gray-700 rounded-full px-2 py-1 mr-2 mb-2">
                      <Text className="text-sm dark:text-white">{feature}</Text>
                    </View>
                  ))}
                </View>
              </View>
            </View>
          )}

          <View className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
            <Text className="text-lg font-bold dark:text-white mb-4">Booking Details</Text>
            
            <View className="space-y-2">
              <View className="flex-row justify-between">
                <Text className="dark:text-white">Check-in</Text>
                <Text className="dark:text-white font-semibold">{checkInDate.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</Text>
              </View>
              
              <View className="flex-row justify-between">
                <Text className="dark:text-white">Check-out</Text>
                <Text className="dark:text-white font-semibold">{checkOutDate.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</Text>
              </View>

              <View className="flex-row justify-between">
                <Text className="dark:text-white">Number of Nights</Text>
                <Text className="dark:text-white font-semibold">{nights}</Text>
              </View>

              <View className="flex-row justify-between">
                <Text className="dark:text-white">Guests</Text>
                <Text className="dark:text-white font-semibold">{noOfGuests}</Text>
              </View>

              <View className="h-px bg-gray-200 dark:bg-gray-700 my-2" />

              <View className="flex-row justify-between items-center">
                <Text className="dark:text-white font-bold">Total Amount</Text>
                <Text className="dark:text-white text-xl font-bold">₹{totalAmount}</Text>
              </View>
            </View>
          </View>

          <View className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
            <Text className="text-lg font-bold dark:text-white mb-4">Payment Mode</Text>
            
            <View className="flex-row gap-2">
              <Pressable
                onPress={() => setPaymentMode('OFFLINE')}
                className={`flex-1 p-2 rounded-lg ${paymentMode === 'OFFLINE' ? 'bg-blue-500' : 'bg-gray-300 dark:bg-gray-700'}`}
              >
                <Text className={` text-center ${ paymentMode === 'OFFLINE' ? 'text-white' : 'text-gray-600 dark:text-gray-300'}`}>
                  Pay at Hotel
                </Text>
              </Pressable>
              
              <Pressable
                disabled
                className="flex-1 bg-gray-300 dark:bg-gray-700 opacity-50 p-2 rounded-lg"
              >
                <Text className="text-gray-600 text-center dark:text-gray-300">Pay Online</Text>
              </Pressable>
            </View>
          </View>

          <Pressable
            onPress={handleCreateBooking}
            className="bg-blue-500 p-4 rounded-lg"
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text className="text-white text-lg font-semibold text-center">
                Confirm Booking - Pay at Hotel
              </Text>
            )}
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default CreateBooking; 