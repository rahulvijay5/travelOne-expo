import React, { useEffect, useState } from "react";
import {
  View,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Pressable,
} from "react-native";
import { Text } from "@/components/ui/text";
import { useUserStorage } from "@/hooks/useUserStorage";
import { useAuth } from "@clerk/clerk-expo";
import { Room, BookingDataInDb } from "@/types";
import { router } from "expo-router";
import { Picker } from "@react-native-picker/picker";
import {
  ArrowDown,
  ArrowUp,
  Calendar,
  List,
  Minus,
  Plus,
} from "lucide-react-native";
import { useTheme } from "@react-navigation/native";
import DatePicker from "@/components/DatePicker";
import RoomCard from "@/components/RoomCard";
import BookingManagementView from "@/components/bookings/BookingManagementView";
import BookingListView from "@/components/bookings/BookingListView";
import BookingModal from "@/components/bookings/BookingModal";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { startOfDay, isSameDay, isAfter, addDays, set } from "date-fns";
import { getHotelRoomsByStatus, getAvailableRooms } from "@lib/api";
import { navigateTo } from "@/lib/actions/navigation";

const getAdjustedCheckInTime = (selectedDate: Date, checkInTimeMinutes: number, currentHotelDetails: any) => {
  const now = new Date();
  const today = startOfDay(now);
  const selectedDay = startOfDay(selectedDate);
  const checkInTime = set(selectedDay, {
    hours: Math.floor(checkInTimeMinutes / 60),
    minutes: checkInTimeMinutes % 60,
    seconds: 0,
    milliseconds: 0
  });

  // If booking for a future date, use hotel's check-in time
  if (isAfter(selectedDay, today)) {
    return checkInTime;
  }

  // If booking for today
  if (isSameDay(selectedDay, today)) {
    // If current time is after check-in time, use current time
    if (isAfter(now, checkInTime)) {
      return now;
    }
    return checkInTime;
  }

  return checkInTime;
};

const getAdjustedCheckOutTime = (checkOutDate: Date, checkOutTimeMinutes: number) => {
  return set(checkOutDate, {
    hours: Math.floor(checkOutTimeMinutes / 60),
    minutes: checkOutTimeMinutes % 60,
    seconds: 0,
    milliseconds: 0
  });
};

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

  const [viewMode, setViewMode] = useState<"calendar" | "list">("calendar");

  const [showFilters, setShowFilters] = useState(false);

  // Add state for modal and selected booking
  const [selectedBooking, setSelectedBooking] =
    useState<BookingDataInDb | null>(null);
  const [showModal, setShowModal] = useState(false);

  const [hotelDetails, setHotelDetails] = useState<any>(null);

  const [searchInitiated, setSearchInitiated] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [priceRange, setPriceRange] = useState<{ min: number; max: number } | null>(null);

  // Fetch user data and initialize
  useEffect(() => {
    const initialize = async () => {
      try {
        const userData = await getUserData();
        if (userData) {
          setUserRole(userData.role || null);
          const hotelDetailsStr = await AsyncStorage.getItem("@current_hotel_details");
          const parsedHotel = hotelDetailsStr ? JSON.parse(hotelDetailsStr) : null;
          if (parsedHotel) {
            setHotelDetails(parsedHotel);
            setCurrentHotelId(parsedHotel.id);

            // Set initial check-in time based on hotel rules
            if (parsedHotel.rules?.checkInTime) {
              const adjustedCheckIn = getAdjustedCheckInTime(
                new Date(),
                parsedHotel.rules.checkInTime,
                parsedHotel
              );
              setFilters(prev => ({
                ...prev,
                checkIn: adjustedCheckIn,
                checkOut: addDays(adjustedCheckIn, 1)
              }));
            }
          }
        }
      } catch (error) {
        console.error("Error initializing:", error);
      } finally {
        setLoading(false);
      }
    };

    initialize();
  }, []);

  // Fetch rooms when hotelId is available
  useEffect(() => {
    if (currentHotelId) {
      const fetchRooms = async () => {
    try {
      setLoading(true);
          const response = await getHotelRoomsByStatus(
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
    navigateTo("/confirmBooking", {
      roomId,
      hotelId: currentHotelId,
      noOfGuests: filters.maxOccupancy,
      checkIn: filters.checkIn.toISOString(),
      checkOut: filters.checkOut.toISOString(),
      price: price.toString(),
    });
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

  // Update check-in time when date changes
  const handleCheckInDateChange = async (date: Date) => {
    const hotelDetailsStr = await AsyncStorage.getItem("@current_hotel_details");
    const currentHotelDetails = hotelDetailsStr ? JSON.parse(hotelDetailsStr) : null;
    
    if (currentHotelDetails?.rules?.checkInTime) {
      const adjustedCheckIn = getAdjustedCheckInTime(
        date,
        currentHotelDetails.rules.checkInTime,
        currentHotelDetails
      );
      setFilters(prev => ({
        ...prev,
        checkIn: adjustedCheckIn,
        checkOut: addDays(adjustedCheckIn, 1)
      }));
    }
  };

  const handleCheckOutDateChange = (date: Date) => {
    if (hotelDetails?.rules?.checkOutTime) {
      const adjustedCheckOut = getAdjustedCheckOutTime(
        date,
        hotelDetails.rules.checkOutTime
      );
      setFilters((prev) => ({ ...prev, checkOut: adjustedCheckOut }));
    }
  };

  const handleSearchRooms = async () => {
    try {
      setLoading(true);
      setSearchError(null);

      if (!hotelDetails?.rules?.checkInTime || !hotelDetails?.rules?.checkOutTime) {
        setSearchError("Hotel check-in/out times not configured");
        return;
      }

      const token = await getToken();
      const adjustedCheckIn = getAdjustedCheckInTime(
        filters.checkIn,
        hotelDetails.rules.checkInTime,
        hotelDetails
      );

      const adjustedCheckOut = getAdjustedCheckOutTime(
        filters.checkOut,
        hotelDetails.rules.checkOutTime
      );

      const response = await getAvailableRooms(
        currentHotelId!,
        adjustedCheckIn.toISOString(),
        adjustedCheckOut.toISOString(),
        parseInt(filters.maxOccupancy),
        token || undefined
      );

      setRooms(response.availableRooms);
      setPriceRange(response.priceRange);
      setSearchInitiated(true);
      // setFilteredRooms(response.availableRooms);
    } catch (error) {
      console.error("Error searching rooms:", error);
      setSearchError(error instanceof Error ? error.message : "Failed to search rooms");
    } finally {
      setLoading(false);
    }
  };

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
          <View className="flex flex-row gap-2 w-full justify-between items-center">
            <Text className="text-2xl font-bold dark:text-white">Bookings</Text>
            <View className="flex-row gap-2">
              <Pressable
                onPress={() =>
                  navigateTo("/createBookingByManager")
                }
                className="bg-blue-500 rounded-lg p-2"
              >
                <Text className="text-white text-lg">Create New Booking</Text>
              </Pressable>
              <Pressable
                onPress={() =>
                  setViewMode((prev) =>
                    prev === "calendar" ? "list" : "calendar"
                  )
                }
                className="bg-blue-500 rounded-lg p-2 flex items-center justify-center"
              >
                <Text className="text-white text-lg">
                  {viewMode === "calendar" ? (
                    <List size={20} color="white" />
                  ) : (
                    <Calendar size={20} color="white" />
                  )}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
        <View className="flex-1">
          {viewMode === "calendar" ? (
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
  return currentHotelId ? (
    <ScrollView className="flex-1 p-4">
      <View className="flex gap-2 mb-4">
        <View className="flex-row justify-between items-center">
          <Text className="text-2xl font-bold  dark:text-white">
            Available Rooms
          </Text>
          {/* Filters */}
          {!showFilters ? (
            <Pressable
              onPress={() => setShowFilters(!showFilters)}
              className="bg-gray-100 dark:bg-gray-800 rounded-lg px-4 py-2 flex-row justify-between items-center"
            >
              <Text className="text-lg font-semibold dark:text-white">
                Filters
              </Text>
              <ArrowDown size={24} color={theme.colors.text} />
            </Pressable>
          ) : (
            <Pressable
              onPress={() => setShowFilters(!showFilters)}
              className="bg-gray-200 dark:bg-gray-700 rounded-full p-2"
            >
              <ArrowUp size={24} color={theme.colors.text} />
            </Pressable>
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
                  <Pressable
                    onPress={handleClearFilters}
                    className="bg-gray-200 dark:bg-gray-700 rounded-xl px-4 py-3"
                  >
                    <Text className="text-black dark:text-white">
                      Clear Filters
                    </Text>
                  </Pressable>
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
            <Pressable
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
            </Pressable>
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
            <Pressable
              onPress={() =>
                setFilters((prev) => ({
                  ...prev,
                  maxOccupancy: (parseInt(prev.maxOccupancy) + 1).toString(),
                }))
              }
              className="bg-gray-200 dark:bg-gray-700 rounded-full p-2"
            >
              <Plus size={24} color={theme.colors.text} />
            </Pressable>
          </View>
        </View>

        <View className="">
          <View className="flex flex-row gap-2 items-center justify-between bg-gray-100 dark:bg-gray-800 rounded-lg p-4">
            <DatePicker
              value={filters.checkIn}
              onChange={handleCheckInDateChange}
              minimumDate={new Date()}
              label="Check-in Date"
            />
            <DatePicker
              value={filters.checkOut}
              onChange={handleCheckOutDateChange}
              minimumDate={addDays(filters.checkIn, 1)}
              label="Check-out Date"
            />
          </View>
        </View>

        <Pressable
          onPress={handleSearchRooms}
          className="bg-blue-500 p-3 rounded-lg mt-4"
        >
          <Text className="text-white text-center text-lg font-semibold">
            Search Available Rooms
          </Text>
        </Pressable>

        {searchError && (
          <View className="bg-red-100 dark:bg-red-900 p-3 rounded-lg mt-4">
            <Text className="text-red-500 dark:text-red-100">{searchError}</Text>
          </View>
        )}

        {/* Price Range Info */}
        {searchInitiated && priceRange && (
          <View className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg mt-4 flex flex-row justify-between items-center">
            <Text className="text-lg font-semibold dark:text-white mb-2">
              Available Price Range:
            </Text>
            <Text className="dark:text-white">
              ₹{priceRange.min} - ₹{priceRange.max} / night
            </Text>
          </View>
        )}

        {/* Room List */}
        {searchInitiated && (
          <>
            {loading ? (
              <View className="flex-1 justify-center items-center py-8">
                <ActivityIndicator size="large" color="#0000ff" />
              </View>
            ) : filteredRooms.length === 0 ? (
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
          </>
        )}
      </View>
    </ScrollView>
  ) : (
    <View className="flex-1 justify-center items-center gap-4">
      <Pressable onPress={() => router.push('/scanqr')} className="dark:bg-lime-500 bg-lime-300 h-56 w-56 rounded-full flex items-center justify-center shadow-md shadow-black/50">
          <Text className="text-2xl font-bold">Scan QR Code</Text>
        </Pressable>
      <Text className="text-2xl font-bold dark:text-white">
        No hotel selected
      </Text>
    </View>
  );
};

export default Bookings;
