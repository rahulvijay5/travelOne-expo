import React, { useEffect, useState } from "react";
import {
  View,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Image,
  Pressable,
} from "react-native";
import { Text } from "@/components/ui/text";
import { Button } from "@/components/ui/button";
import { useUserStorage } from "@/hooks/useUserStorage";
import { useAuth } from "@clerk/clerk-expo";
import api from "@/lib/api";
import { Room, BookingDataInDb } from "@/types";
import { router } from "expo-router";
import { Picker } from "@react-native-picker/picker";
import {
  ArrowDown,
  ArrowDown01Icon,
  ArrowUp,
  Calendar,
  List,
  Minus,
  Plus,
} from "lucide-react-native";
import { useTheme } from "@react-navigation/native";
import DateTimePicker from "@react-native-community/datetimepicker";
import DatePicker from "@/components/DatePicker";
import RoomCard from "@/components/RoomCard";
import BookingManagementView from "@/components/bookings/BookingManagementView";
import BookingListView from "@/components/bookings/BookingListView";
import BookingModal from "@/components/bookings/BookingModal";

const Bookings = () => {
  const { getUserData } = useUserStorage();
  const { getToken } = useAuth();
  const [loading, setLoading] = useState(true);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [userRole, setUserRole] = useState<string | null>(null);
  const theme = useTheme();
  const [currentHotelId, setCurrentHotelId] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    type: "",
    maxOccupancy: "2",
    features: [] as string[],
    checkIn: new Date(),
    checkOut: new Date(Date.now() + 86400000), // Tomorrow
  });

  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar');

  const [showFilters, setShowFilters] = useState(false);

  // Add state for modal and selected booking
  const [selectedBooking, setSelectedBooking] = useState<BookingDataInDb | null>(null);
  const [showModal, setShowModal] = useState(false);

  // Fetch user data and initialize
  useEffect(() => {
    const initialize = async () => {
      try {
        const userData = await getUserData();
        if (userData) {
          setUserRole(userData.role);
          // For owners/managers, we'll need to handle hotel selection
          // For now, we'll use the first hotel they manage
          // TODO: Add hotel selection UI for owners/managers
          if (userData.role === "OWNER" || userData.role === "MANAGER") {
            // Fetch their hotels and use the first one
            const token = await getToken();
            if (token) {
              const hotels = await api.getOwnedHotels(userData.userId, token);
              if (hotels?.data?.length > 0) {
                setCurrentHotelId(hotels.data[0].id);
              }
            }
          } else {
            setCurrentHotelId(userData.currentStay?.hotelId || null);
          }
        }
      } catch (error) {
        console.error("Error initializing:", error);
      } finally {
        setLoading(false);
      }
    };

    initialize();
    // console.log("currentHotelId", currentHotelId);
  }, []);

  // Fetch rooms when hotelId is available
  useEffect(() => {
    if (currentHotelId) {
      const fetchRooms = async () => {
        try {
          setLoading(true);
          const response = await api.getHotelRoomsByStatus(
            currentHotelId,
            "AVAILABLE"
          );
          setRooms(response);
        } catch (error) {
          console.error("Error fetching rooms:", error);
        } finally {
          setLoading(false);
        }
      };

      fetchRooms();
    }
  }, [currentHotelId]);

  const handleCreateBooking = (roomId: string, price: number) => {
    router.push({
      pathname: "/(extras)/createBooking",
      params: {
        roomId,
        hotelId: currentHotelId,
        noOfGuests: filters.maxOccupancy,
        checkIn: filters.checkIn.toISOString(),
        checkOut: filters.checkOut.toISOString(),
        price: price.toString(),
      },
    } as any);
  };

  const handleClearFilters = () => {
    setFilters((prev) => ({
      type: "",
      maxOccupancy: prev.maxOccupancy,
      features: [] as string[],
      checkIn: new Date(),
      checkOut: new Date(Date.now() + 86400000),
    }));
    setShowFilters(false);
  };

  const filteredRooms = rooms.filter((room) => {
    if (filters.type && room.type !== filters.type) return false;
    if (
      filters.maxOccupancy &&
      room.maxOccupancy < parseInt(filters.maxOccupancy)
    )
      return false;
    if (
      filters.features.length > 0 &&
      !filters.features.every((f) => room.features.includes(f))
    )
      return false;
    return true;
  });

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center">
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  // For owners/managers
  if (userRole === "OWNER" || userRole === "MANAGER") {
    return currentHotelId ? (
      <View className="flex-1">
        <View className="p-4">
          <View className="flex flex-row gap-2 mb-4 w-full justify-between items-center">
            <Text className="text-2xl font-bold dark:text-white">
              Bookings
            </Text>
            <View className="flex-row gap-2">
              <Button
                onPress={() =>
                  router.push({
                    pathname: "/(extras)/createBookingByManager",
                  } as any)
                }
                className="bg-blue-500"
              >
                <Text className="text-white text-lg">Create New Booking</Text>
              </Button>
              <Button
                onPress={() => setViewMode(prev => prev === 'calendar' ? 'list' : 'calendar')}
                className="bg-blue-500"
              >
                <Text className="text-white text-lg">
                  {viewMode === 'calendar' ? 
                    <List size={20} color="white"/> : 
                    <Calendar size={20} color="white"/>
                  }
                </Text>
              </Button>
            </View>
          </View>
        </View>
        <View className="flex-1">
          {viewMode === 'calendar' ? (
            <BookingManagementView hotelId={currentHotelId} />
          ) : (
            <BookingListView 
              hotelId={currentHotelId}
              setSelectedBooking={setSelectedBooking}
              setShowModal={setShowModal}
            />
          )}
        </View>
        <BookingModal 
          booking={selectedBooking}
          visible={showModal}
          onClose={() => setShowModal(false)}
        />
      </View>
    ) : (
      <View className="flex-1 justify-center items-center">
        <Text className="text-2xl font-bold dark:text-white">
          No hotel selected
        </Text>
      </View>
    );
  }

  // For guests
  return (
    <ScrollView className="flex-1 p-4">
      <View className="flex gap-2 mb-4">
        <View className="flex-row justify-between items-center">
          <Text className="text-2xl font-bold  dark:text-white">
            Available Rooms
          </Text>
          {/* Filters */}
          {!showFilters ? (
            <Button
              onPress={() => setShowFilters(!showFilters)}
              className="bg-gray-100 dark:bg-gray-800 rounded-lg px-4 py-2 flex-row justify-between items-center"
            >
              <Text className="text-lg font-semibold dark:text-white">
                Filters
              </Text>
              <ArrowDown size={24} color={theme.colors.text} />
            </Button>
          ) : (
            <Button
              onPress={() => setShowFilters(!showFilters)}
              className="bg-gray-200 dark:bg-gray-700 rounded-full p-2"
            >
              <ArrowUp size={24} color={theme.colors.text} />
            </Button>
          )}
        </View>

        {/* Filters */}
        {showFilters && (
          <View
            className="p-4 bg-gray-100 dark:bg-gray-800 rounded-lg flex gap-4 
          "
          >
            <View className="">
              <View className="flex-row justify-between items-center">
                <Text className="dark:text-white text-lg font-semibold">
                  Room Type
                </Text>
                <View className="flex-row items-center justify-end gap-2">
                  <Button
                    onPress={handleClearFilters}
                    className="bg-gray-200 dark:bg-gray-700 rounded-xl px-4 py-3"
                  >
                    <Text className="text-black dark:text-white">
                      Clear Filters
                    </Text>
                  </Button>
                </View>
              </View>
              <Picker
                selectedValue={filters.type}
                onValueChange={(itemValue: string) =>
                  setFilters((prev) => ({ ...prev, type: itemValue }))
                }
                className="dark:text-white h-40"
              >
                <Picker.Item label="All Types" value="" />
                {/* Add unique room types dynamically */}
                {Array.from(new Set(rooms.map((r) => r.type))).map((type) => (
                  <Picker.Item key={type} label={type} value={type} />
                ))}
              </Picker>
            </View>

            {/* Features filter */}
            <View className="flex-row justify-between items-center gap-2">
              <Text className="dark:text-white text-lg font-semibold">
                Features
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {Array.from(new Set(rooms.flatMap((r) => r.features))).map(
                  (feature) => (
                    <Pressable
                      key={feature}
                      onPress={() =>
                        setFilters((prev) => ({
                          ...prev,
                          features: prev.features.includes(feature)
                            ? prev.features.filter((f) => f !== feature)
                            : [...prev.features, feature],
                        }))
                      }
                      className={`mr-2 px-3 py-1 rounded-xl ${
                        filters.features.includes(feature)
                          ? "bg-blue-500"
                          : "bg-gray-300 dark:bg-gray-700"
                      }`}
                    >
                      <Text
                        className={
                          filters.features.includes(feature)
                            ? "text-white"
                            : "dark:text-white"
                        }
                      >
                        {feature}
                      </Text>
                    </Pressable>
                  )
                )}
              </ScrollView>
            </View>
          </View>
        )}

        <View className="flex-row justify-between items-center gap-2 bg-gray-100 dark:bg-gray-800 rounded-lg p-4">
          <Text className="dark:text-white text-lg font-semibold">
            Number of Guests
          </Text>
          <View className="flex-row items-center">
            <Button
              disabled={parseInt(filters.maxOccupancy) === 1}
              onPress={() =>
                setFilters((prev) => ({
                  ...prev,
                  maxOccupancy: (parseInt(prev.maxOccupancy) - 1).toString(),
                }))
              }
              className="bg-gray-200 dark:bg-gray-700   rounded-full p-2"
            >
              <Minus size={24} color={theme.colors.text} />
            </Button>
            <TextInput
              className="border border-gray-300 text-center text-xl font-semibold dark:border-gray-600 rounded-full flex items-center justify-center w-12 h-12 dark:text-white"
              value={filters.maxOccupancy}
              onChangeText={(value) =>
                setFilters((prev) => ({ ...prev, maxOccupancy: value }))
              }
              keyboardType="numeric"
              placeholder="2"
              placeholderTextColor="#666"
            />
            <Button
              onPress={() =>
                setFilters((prev) => ({
                  ...prev,
                  maxOccupancy: (parseInt(prev.maxOccupancy) + 1).toString(),
                }))
              }
              className="bg-gray-200 dark:bg-gray-700 rounded-full p-2"
            >
              <Plus size={24} color={theme.colors.text} />
            </Button>
          </View>
        </View>

        <View className="flex-row justify-between items-center gap-2 bg-gray-100 dark:bg-gray-800 rounded-lg p-4">
          <DatePicker
            label="Check-in"
            value={filters.checkIn}
            onChange={(date) => {
              setFilters((prev) => ({
                ...prev,
                checkIn: date,
                // If check-out is before new check-in, update it
                checkOut:
                  prev.checkOut < date
                    ? new Date(date.getTime() + 86400000)
                    : prev.checkOut,
              }));
            }}
            minimumDate={new Date()}
          />
          <DatePicker
            label="Check-out"
            value={filters.checkOut}
            onChange={(date) =>
              setFilters((prev) => ({ ...prev, checkOut: date }))
            }
            minimumDate={new Date(filters.checkIn.getTime() + 86400000)}
          />
        </View>
      </View>

      {/* Room List */}
      {filteredRooms.length === 0 ? (
        <Text className="text-lg dark:text-white text-center mt-4">
          No rooms found matching your criteria
        </Text>
      ) : (
        filteredRooms.map((room) => (
          <RoomCard
            key={room.id}
            room={room}
            onBookNow={(roomId, price) => handleCreateBooking(roomId, price)}
          />
        ))
      )}
    </ScrollView>
  );
};

export default Bookings;
