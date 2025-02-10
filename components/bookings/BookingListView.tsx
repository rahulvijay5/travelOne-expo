import React, { useEffect, useState } from 'react';
import { View, FlatList, ActivityIndicator, Pressable, RefreshControl } from 'react-native';
import { format, parseISO, isEqual, startOfDay } from 'date-fns';
import { Text } from '@/components/ui/text';
import { BookingDataInDb } from '@/types/index';
import { useAuth } from '@clerk/clerk-expo';
import { useColorScheme } from 'nativewind';
import { getFilteredHotelBookings } from '@lib/api';

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
  const [refreshing, setRefreshing] = useState(false);

  const fetchBookings = async (pageNum: number) => {
    try {
      const token = await getToken();
      const response = await getFilteredHotelBookings(
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

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await fetchBookings(1);
    setRefreshing(false);
  }, [hotelId]);

  const renderDateHeader = (date: Date) => (
    <View className="py-2 px-4 bg-gray-100 dark:bg-gray-800">
      <Text className="font-bold text-gray-700  dark:text-gray-300">
        {format(date, 'EEEE, d MMM, yyyy')}
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
          className={`p-4 border w-full border-gray-200  dark:border-gray-700 ${
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
              {item.guests} guests • ₹{item.payment.totalAmount} </Text>
            </View>
          </View>
          <View className="mt-2">
            <Text className="text-gray-600 dark:text-gray-400">
              
            {format(parseISO(item.checkIn), 'h:mm a')} - {format(parseISO(item.checkOut), 'h:mm a, d MMM')}
             
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

  if (bookings.length === 0) {
    return (
      <View className="flex-1 justify-center items-center">
        <Text>No bookings found</Text>
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
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[isDark ? '#ffffff' : '#000000']}
            tintColor={isDark ? '#ffffff' : '#000000'}
          />
        }
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