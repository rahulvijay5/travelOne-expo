import React, { useEffect, useState } from 'react';
import { View, FlatList, ActivityIndicator, Pressable } from 'react-native';
import { format, parseISO, isEqual, startOfDay } from 'date-fns';
import { Text } from '@/components/ui/text';
import { BookingDataInDb } from '@/types';
import { useAuth } from '@clerk/clerk-expo';
import api from '@/lib/api';
import { useColorScheme } from 'nativewind';
import { Button } from '../ui/button';

interface BookingListViewProps {
  hotelId: string;
  onBookingPress?: (booking: BookingDataInDb) => void;
  setSelectedBooking?: (booking: BookingDataInDb) => void;
  setShowModal?: (show: boolean) => void;
}

export default function BookingListView({ 
  hotelId, 
  onBookingPress,
  setSelectedBooking,
  setShowModal 
}: BookingListViewProps) {
  const { getToken } = useAuth();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const [bookings, setBookings] = useState<BookingDataInDb[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const ITEMS_PER_PAGE = 15;

  const fetchBookings = async (pageNum: number) => {
    try {
      const token = await getToken();
      const response = await api.getFilteredHotelBookings(
        hotelId,
        {
          sortBy: 'checkIn',
          sortOrder: 'asc',
          page: pageNum,
          limit: ITEMS_PER_PAGE,
        },
        token || undefined
      );

      if (pageNum === 1) {
        setBookings(response.data);
      } else {
        setBookings(prev => [...prev, ...response.data]);
      }
      
      setHasMore(response.data.length === ITEMS_PER_PAGE);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching bookings:', error);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings(1);
  }, [hotelId]);

  const handleBookingPress = (booking: BookingDataInDb) => {
    if (onBookingPress) {
      onBookingPress(booking);
    } else if (setSelectedBooking && setShowModal) {
      setSelectedBooking(booking);
      setShowModal(true);
    }
  };

  const renderDateHeader = (date: Date) => (
    <View className="py-2 px-4 bg-gray-100 dark:bg-gray-800">
      <Text className="font-bold text-gray-700 dark:text-gray-300">
        {format(date, 'EEEE, MMMM d, yyyy')}
      </Text>
    </View>
  );

  const renderBookingItem = ({ item, index }: { item: BookingDataInDb; index: number }) => {
    const currentDate = startOfDay(parseISO(item.checkIn));
    const previousDate = index > 0 ? startOfDay(parseISO(bookings[index - 1].checkIn)) : null;
    const showDateHeader = !previousDate || !isEqual(currentDate, previousDate);

    return (
      <View>
        {showDateHeader && renderDateHeader(currentDate)}
        <Pressable 
          className={`p-4 border-b w-full border-gray-200 dark:border-gray-700 ${
            isDark ? 'bg-gray-900' : 'bg-white'
          }`}
          // onTouchEnd={() => handleBookingPress(item)}
          onPress={() => handleBookingPress(item)}
        >
          <View className="flex-row justify-between items-start">
            <View>
              <Text className="font-bold text-lg dark:text-white">
                Room {item.room.roomNumber}
              </Text>
              <Text className="text-gray-600 dark:text-gray-400">
                {item.customer.name}
              </Text>
            </View>
            <View className="items-end">
              <Text className={`font-semibold ${
                item.status === 'CONFIRMED' ? 'text-green-500' :
                item.status === 'PENDING' ? 'text-yellow-500' :
                item.status === 'CANCELLED' ? 'text-red-500' :
                'text-blue-500'
              }`}>
                {item.status}
              </Text>
              <Text className="text-gray-600 dark:text-gray-400">
                {format(parseISO(item.checkIn), 'h:mm a')} - {format(parseISO(item.checkOut), 'h:mm a')}
              </Text>
            </View>
          </View>
          <View className="mt-2">
            <Text className="text-gray-600 dark:text-gray-400">
              {item.guests} guests • ₹{item.payment.totalAmount}
            </Text>
          </View>
      </Pressable>
        </View>
    );
  };

  if (loading && page === 1) {
    return (
      <View className="flex-1 justify-center items-center">
        <ActivityIndicator size="large" color={isDark ? '#ffffff' : '#000000'} />
      </View>
    );
  }

  return (
    <View className="flex-1">
      <FlatList
        data={bookings}
        renderItem={renderBookingItem}
        keyExtractor={item => item.id}
        onEndReached={() => {
          if (hasMore && !loading) {
            setPage(prev => prev + 1);
            fetchBookings(page + 1);
          }
        }}
        onEndReachedThreshold={0.5}
        ListFooterComponent={() => 
          loading ? (
            <View className="py-4">
              <ActivityIndicator size="small" color={isDark ? '#ffffff' : '#000000'} />
            </View>
          ) : null
        }
      />
    </View>
  );
} 

// import React, { useEffect, useState } from 'react';
// import { View, FlatList, ActivityIndicator, TouchableOpacity } from 'react-native';
// import { format, parseISO, isEqual, startOfDay } from 'date-fns';
// import { Text } from '@/components/ui/text';
// import { BookingDataInDb } from '@/types';
// import { useAuth } from '@clerk/clerk-expo';
// import api from '@/lib/api';
// import { useColorScheme } from 'nativewind';
// import { router } from 'expo-router';

// interface BookingListViewProps {
//   hotelId: string;
//   onBookingPress?: (booking: BookingDataInDb) => void;
//   setSelectedBooking?: (booking: BookingDataInDb) => void;
//   setShowModal?: (show: boolean) => void;
// }

// export default function BookingListView({ 
//   hotelId, 
//   onBookingPress,
//   setSelectedBooking,
//   setShowModal 
// }: BookingListViewProps) {
//   const { getToken } = useAuth();
//   const { colorScheme } = useColorScheme();
//   const isDark = colorScheme === 'dark';
//   const [bookings, setBookings] = useState<BookingDataInDb[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [refreshing, setRefreshing] = useState(false);
//   const [page, setPage] = useState(1);
//   const [hasMore, setHasMore] = useState(true);
//   const ITEMS_PER_PAGE = 15;

//   const fetchBookings = async (pageNum: number, shouldRefresh: boolean = false) => {
//     try {
//       const token = await getToken();
//       const response = await api.getFilteredHotelBookings(
//         hotelId,
//         {
//           sortBy: 'checkOut',
//           sortOrder: 'asc',
//           page: pageNum,
//           limit: ITEMS_PER_PAGE,
//         },
//         token || undefined
//       );

//       if (shouldRefresh) {
//         setBookings(response.data);
//       } else {
//         setBookings(prev => [...prev, ...response.data]);
//       }
      
//       setHasMore(response.data.length === ITEMS_PER_PAGE);
//     } catch (error) {
//       console.error('Error fetching bookings:', error);
//     } finally {
//       setLoading(false);
//       setRefreshing(false);
//     }
//   };

//   useEffect(() => {
//     fetchBookings(1, true);
//   }, [hotelId]);

//   const handleRefresh = () => {
//     setRefreshing(true);
//     setPage(1);
//     fetchBookings(1, true);
//   };

//   const handleLoadMore = () => {
//     if (!loading && hasMore) {
//       const nextPage = page + 1;
//       setPage(nextPage);
//       fetchBookings(nextPage);
//     }
//   };

//   const handleBookingPress = (booking: BookingDataInDb) => {
//     if (onBookingPress) {
//       onBookingPress(booking);
//     } else if (setSelectedBooking && setShowModal) {
//       setSelectedBooking(booking);
//       setShowModal(true);
//     }
//   };

//   const handleViewDetails = (booking: BookingDataInDb) => {
//     router.push({
//       pathname: "/(extras)/bookingDetails",
//       params: { bookingId: booking.id }
//     } as any);
//   };

//   const renderDateHeader = (date: Date) => (
//     <View className="py-2 px-4 bg-gray-100 dark:bg-gray-800">
//       <Text className="font-bold text-gray-700 dark:text-gray-300">
//         {format(date, 'EEEE, MMMM d, yyyy')}
//       </Text>
//     </View>
//   );

//   const renderBookingItem = ({ item, index }: { item: BookingDataInDb; index: number }) => {
//     const currentDate = startOfDay(parseISO(item.checkIn));
//     const previousDate = index > 0 ? startOfDay(parseISO(bookings[index - 1].checkIn)) : null;
//     const showDateHeader = !previousDate || !isEqual(currentDate, previousDate);

//     return (
//       <View>
//         {showDateHeader && renderDateHeader(currentDate)}
//         <TouchableOpacity 
//           className={`p-4 border-b border-gray-200 dark:border-gray-700 ${
//             isDark ? 'bg-gray-900' : 'bg-white'
//           }`}
//           onPress={() => handleBookingPress(item)}
//           activeOpacity={0.7}
//         >
//           <View className="flex-row justify-between items-start">
//             <View>
//               <Text className="font-bold text-lg dark:text-white">
//                 Room {item.room.roomNumber}
//               </Text>
//               <Text className="text-gray-600 dark:text-gray-400">
//                 {item.customer.name}
//               </Text>
//             </View>
//             <View className="items-end">
//               <Text className={`font-semibold ${
//                 item.status === 'CONFIRMED' ? 'text-green-500' :
//                 item.status === 'PENDING' ? 'text-yellow-500' :
//                 item.status === 'CANCELLED' ? 'text-red-500' :
//                 'text-blue-500'
//               }`}>
//                 {item.status}
//               </Text>
//               <Text className="text-gray-600 dark:text-gray-400">
//                 {format(parseISO(item.checkIn), 'd MMM, h:mm a')} - {format(parseISO(item.checkOut), 'MMM d, h:mm a')}
//               </Text>
//             </View>
//           </View>
//           <View className="mt-2 flex-row justify-between items-center">
//             <Text className="text-gray-600 dark:text-gray-400">
//               {item.guests} guests • ₹{item.payment.totalAmount}
//             </Text>
//             <TouchableOpacity
//               className="bg-blue-500 px-3 py-1 rounded-lg"
//               onPress={() => handleViewDetails(item)}
//             >
//               <Text className="text-white">View Details</Text>
//             </TouchableOpacity>
//           </View>
//         </TouchableOpacity>
//       </View>
//     );
//   };

//   if (loading && !refreshing && bookings.length === 0) {
//     return (
//       <View className="flex-1 justify-center items-center">
//         <ActivityIndicator size="large" color={isDark ? '#ffffff' : '#000000'} />
//       </View>
//     );
//   }

//   return (
//     <View className="flex-1">
//       <FlatList
//         data={bookings}
//         renderItem={renderBookingItem}
//         keyExtractor={item => item.id}
//         onEndReached={handleLoadMore}
//         onEndReachedThreshold={0.5}
//         refreshing={refreshing}
//         onRefresh={handleRefresh}
//         ListFooterComponent={() => 
//           loading && !refreshing ? (
//             <View className="py-4">
//               <ActivityIndicator size="small" color={isDark ? '#ffffff' : '#000000'} />
//             </View>
//           ) : null
//         }
//       />
//     </View>
//   );
// } 