import React, { useState, useEffect } from "react";
import {
  View,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Switch,
  Pressable,
} from "react-native";
import { Text } from "@/components/ui/text";
import { Button } from "@/components/ui/button";
import { router } from "expo-router";
import { useUserStorage } from "@/hooks/useUserStorage";
import { useAuth } from "@clerk/clerk-expo";
import DatePicker from "@/components/DatePicker";
import { Minus, Plus, Search } from "lucide-react-native";
import { useTheme } from "@react-navigation/native";
import { Room, HotelDetails } from "@/types";
import RoomCard from "@/components/RoomCard";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { startOfDay, isSameDay, isAfter, addDays, set } from "date-fns";
import { getHotelById, getHotelRoomsByStatus, getAvailableRooms, searchUserByPhone } from "@lib/api";
import { navigateTo } from "@/lib/actions/navigation";

const getAdjustedCheckInTime = (selectedDate: Date, checkInTimeMinutes: number, currentHotelDetails: any) => {
  const now = new Date();
  const today = startOfDay(now);
  console.log("Selected Date:", selectedDate);
  const selectedDay = startOfDay(selectedDate);
  console.log("selectedDay:", selectedDay);
  const checkInTime = set(selectedDay, {
    hours: Math.floor(checkInTimeMinutes / 60),
    minutes: checkInTimeMinutes % 60,
    seconds: 0,
    milliseconds: 0
  });
  console.log("checkInTime:", checkInTime);

  // If booking for a future date, use hotel's check-in time
  if (isAfter(selectedDay, today)) {
    return checkInTime;
  }

  // If booking for today

  if (isSameDay(selectedDay, today)) {
    // If current time is after check-in time, use current time
    console.log("isAfter(now, checkInTime):", isAfter(now, checkInTime));
    if (isAfter(now, checkInTime)) {
      console.log("now:", now);
      return now;
    }
    return checkInTime;
  }

  return checkInTime;
};

const getAdjustedCheckOutTime = (checkOutDate: Date, checkOutTimeMinutes: number) => {
  console.log("checkOutDate:", checkOutDate);
  const checkOutTime = set(checkOutDate, {
    hours: Math.floor(checkOutTimeMinutes / 60),
    minutes: checkOutTimeMinutes % 60,
    seconds: 0,
    milliseconds: 0
  });
  console.log("checkOutTime:", checkOutTime);
  return checkOutTime;
};

const CreateBookingByManager = () => {
  const { getUserData } = useUserStorage();
  const { getToken } = useAuth();
  const [loading, setLoading] = useState(false);
  const [guests, setGuests] = useState("1");
  const [checkIn, setCheckIn] = useState(new Date());
  const [checkOut, setCheckOut] = useState(new Date(Date.now() + 86400000));
  const [customerPhone, setCustomerPhone] = useState("");
  const [error, setError] = useState<string | null>(null);
  const theme = useTheme();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [filteredRooms, setFilteredRooms] = useState<Room[]>([]);
  const [currentHotelId, setCurrentHotelId] = useState<string | null>(null);
  const [customerId, setCustomerId] = useState<string | null>(null);
  const [customerName, setCustomerName] = useState<string | null>(null);
  const [roomSearch, setRoomSearch] = useState("");
  const [extraMattress, setExtraMattress] = useState(false);
  const [hotelDetails, setHotelDetails] = useState<HotelDetails | null>(null);
  const [noRoomsAvailable, setNoRoomsAvailable] = useState(false);
  const [searchInitiated, setSearchInitiated] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [priceRange, setPriceRange] = useState<{ min: number; max: number } | null>(null);

  // Fetch user data and initialize
  useEffect(() => {
    const initialize = async () => {
      try {
        const userData = await getUserData();
        if (userData) {
          console.log("userData:", userData);
          let hotelId = userData.currentStay?.hotelId;

          if (!hotelId) {
            const hotelDetailsStr = await AsyncStorage.getItem(
              "@current_hotel_details"
            );
            console.log("hotelDetails:", hotelDetailsStr);
            if (hotelDetailsStr) {
              const parsedHotel = JSON.parse(hotelDetailsStr);
              console.log("parsedHotel:", parsedHotel);
              hotelId = parsedHotel.id;
              setHotelDetails(parsedHotel);

              // Set initial check-in time based on hotel rules
              if (parsedHotel.rules?.checkInTime) {
                const adjustedCheckIn = getAdjustedCheckInTime(
                  new Date(),
                  parsedHotel.rules.checkInTime,
                  parsedHotel
                );
                setCheckIn(adjustedCheckIn);
                const adjustedCheckOut = getAdjustedCheckOutTime(
                  addDays(adjustedCheckIn, 1),
                  parsedHotel.rules.checkOutTime
                );
                setCheckOut(adjustedCheckOut);
              }
            }
          } else {
            // Fetch hotel details if we have hotelId
            const token = await getToken();
            if (token) {
              const details = await getHotelById(hotelId, token);
              setHotelDetails(details);

              // Set initial check-in time based on hotel rules
              if (details.rules?.checkInTime) {
                const adjustedCheckIn = getAdjustedCheckInTime(
                  new Date(),
                  details.rules.checkInTime,
                  details
                );
                setCheckIn(adjustedCheckIn);
                const adjustedCheckOut = getAdjustedCheckOutTime(
                  addDays(adjustedCheckIn, 1),
                  details.rules.checkOutTime
                );
                setCheckOut(adjustedCheckOut);
              }
            }
          }

          if (hotelId) {
            setCurrentHotelId(hotelId);
          } else {
            setError("Please select a hotel first. Redirecting...");
            setTimeout(() => {  
              router.push("/scanqr");
            }, 2500);
          }
        }
      } catch (error) {
        console.error("Error initializing:", error);
        setError("Failed to initialize");
      }
    };

    initialize();
  }, []);

  const fetchRooms = async (hotelId: string) => {
    try {
      setLoading(true);
      console.log("Fetching rooms for hotel:", hotelId);
      const response = await getHotelRoomsByStatus(hotelId, "AVAILABLE");
      console.log("Rooms response:", response);
      
      // Sort rooms by room number
      const sortedRooms = response.sort((a: Room, b: Room) =>
        a.roomNumber.localeCompare(b.roomNumber, undefined, { numeric: true })
      );

      if(sortedRooms.length == 0){
        setNoRoomsAvailable(true);
        return;
      }

      setRooms(sortedRooms);
      setFilteredRooms(sortedRooms);
    } catch (error) {
      console.error("Error fetching rooms:", error);
      setError("Failed to fetch rooms");
    } finally {
      setLoading(false);
    }
  };

  // Apply filters
  useEffect(() => {
    let filtered = [...rooms];

    // Apply room number search
    if (roomSearch) {
      filtered = filtered.filter((room) =>
        room.roomNumber.toLowerCase().includes(roomSearch.toLowerCase())
      );
    }

    // Apply occupancy filter
    const requestedGuests = parseInt(guests);
    filtered = filtered.filter((room) => {
      const maxAllowedGuests =
        extraMattress && hotelDetails?.rules.extraMattressOnAvailability
          ? room.maxOccupancy + 1
          : room.maxOccupancy;
      return maxAllowedGuests >= requestedGuests;
    });

    setFilteredRooms(filtered);
  }, [rooms, guests, roomSearch, extraMattress]);

  const handleSearchCustomer = async () => {
    console.log("extra mattress:", hotelDetails?.rules.extraMattressOnAvailability);
    try {
      setLoading(true);
      setError(null);

      const token = await getToken();
      if (!token) {
        throw new Error("Not authenticated");
      }
      if(!currentHotelId){
        setError("No hotel selected. Please select a hotel first.");
        setTimeout(() => {
          router.push("/scanqr");
        }, 2500);
        return;
      }

      let customerResponse = await searchUserByPhone(customerPhone, token);
      if (!customerResponse || customerResponse.error) {
        setError("Customer not found. Please ask them to register first.");
        return;
      }
      console.log("customerResponse:", customerResponse);
      setCustomerId(customerResponse[0].id);
      setCustomerName(customerResponse[0].name);
      fetchRooms(currentHotelId!);
      setError(null);
    } catch (error) {
      console.error("Error searching customer:", error);
      setError(
        error instanceof Error ? error.message : "Failed to search customer"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSelectRoom = (roomId: string, price: number) => {
    if (!customerId) {
      setError("Please search for a customer first");
      return;
    }

    navigateTo("/managerConfirmBooking", {
      roomId,
      hotelId: currentHotelId,
      customerId,
      noOfGuests: guests,
      checkIn: checkIn.toISOString(),
      checkOut: checkOut.toISOString(),
      price: price.toString(),
      extraMattress: extraMattress.toString(),
    });
  };

  const handleSearchRooms = async () => {
    try {
      setLoading(true);
      setSearchError(null);
      
      if (!customerPhone.trim()) {
        setSearchError("Please enter customer's phone number");
        return;
      }

      if (!hotelDetails?.rules?.checkInTime || !hotelDetails?.rules?.checkOutTime) {
        setSearchError("Hotel check-in/out times not configured");
        return;
      }

      const token = await getToken();
      const adjustedCheckIn = getAdjustedCheckInTime(
        checkIn,
        hotelDetails.rules.checkInTime,
        hotelDetails
      );

      const adjustedCheckOut = getAdjustedCheckOutTime(
        checkOut,
        hotelDetails.rules.checkOutTime
      );

      console.log("adjustedCheckIn:", adjustedCheckIn);
      console.log("adjustedCheckOut:", adjustedCheckOut);

      const response = await getAvailableRooms(
        currentHotelId!,
        adjustedCheckIn.toISOString(),
        adjustedCheckOut.toISOString(),
        parseInt(guests),
        token || undefined
      );

      setRooms(response.availableRooms);
      setPriceRange(response.priceRange);
      setSearchInitiated(true);
      setFilteredRooms(response.availableRooms);
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

  return (
    <ScrollView className="flex-1 p-4">
      <View className="space-y-4">
        {/* <Text className="text-2xl font-bold mb-4 dark:text-white">Create Booking for Customer</Text> */}

        {error && (
          <View className="bg-red-100 dark:bg-red-900 p-3 rounded-lg mb-4">
            <Text className="text-red-500 dark:text-red-100">{error}</Text>
          </View>
        )}

        <View className="rounded-lg border-gray-200 dark:border-gray-700">
          {!customerId ? (
            <>
              <Text className="text-lg font-semibold mb-2 dark:text-white">
                Customer Phone Number
              </Text>
              <View className="flex-row gap-2 mb-4">
                <TextInput
                  className="flex-1 border border-gray-300 dark:border-gray-600 rounded-lg p-3 dark:text-white"
                  value={customerPhone}
                  onChangeText={setCustomerPhone}
                  keyboardType="phone-pad"
                  placeholder="Enter customer's phone number"
                  placeholderTextColor="#666"
                />
                <Pressable
                  onPress={handleSearchCustomer}
                  className="bg-blue-500 rounded-lg p-3"
                  disabled={loading || !customerPhone}
                >
                  <Text className="text-white">Search</Text>
                </Pressable>
              </View>
            </>
          ) : (
            <Text className="text-xl font-semibold mb-2 dark:text-white">
              Name: {customerName}
            </Text>
          )}
        </View>
        <View className="border border-gray-200 dark:border-gray-700 p-4 rounded-lg">
          <View className="my-2">
            <View className="flex flex-row gap-2 items-center justify-between">
              <Text className="text-lg font-semibold dark:text-white">
                Number of Guests
              </Text>
              <View className="flex-row items-center">
                <Pressable
                  disabled={parseInt(guests) === 1}
                  onPress={() =>
                    setGuests((prev) => (parseInt(prev) - 1).toString())
                  }
                  className="bg-gray-200 dark:bg-gray-700 rounded-full p-2"
                >
                  <Minus size={24} color={theme.colors.text} />
                </Pressable>
                <TextInput
                  className="border border-gray-300 text-center text-xl font-semibold dark:border-gray-600 rounded-full w-12 h-12 dark:text-white"
                  value={guests}
                  onChangeText={setGuests}
                  keyboardType="numeric"
                  placeholder="2"
                  placeholderTextColor="#666"
                />
                <Pressable
                  onPress={() =>
                    setGuests((prev) => (parseInt(prev) + 1).toString())
                  }
                  className="bg-gray-200 dark:bg-gray-700 rounded-full p-2"
                >
                  <Plus size={24} color={theme.colors.text} />
                </Pressable>
              </View>
            </View>
          </View>

          {hotelDetails?.rules.extraMattressOnAvailability && (
            <View className="flex-row items-center justify-between mt-4">
              <Text className="text-base dark:text-white">Extra Mattress</Text>
              <Switch
                value={extraMattress}
                onValueChange={setExtraMattress}
                trackColor={{ false: "#767577", true: "#81b0ff" }}
                thumbColor={extraMattress ? "#1e40af" : "#f4f3f4"}
              />
            </View>
          )}

          <View className="my-4">
            <View className="flex flex-row gap-2 items-center justify-between">
              <DatePicker
                value={checkIn}
                onChange={(date) => {
                  if (hotelDetails?.rules?.checkInTime) {
                    const adjustedCheckIn = getAdjustedCheckInTime(
                      date,
                      hotelDetails.rules.checkInTime,
                      hotelDetails
                    );
                    setCheckIn(adjustedCheckIn);
                    if (isAfter(adjustedCheckIn, checkOut)) {
                      const adjustedCheckOut = getAdjustedCheckOutTime(
                        addDays(adjustedCheckIn, 1),
                        hotelDetails.rules.checkOutTime
                      );
                      setCheckOut(adjustedCheckOut);
                    }
                  }
                }}
                minimumDate={new Date()}
                label="Check-in Date"
              />
              <DatePicker
                value={checkOut}
                onChange={(date) => {
                  if (hotelDetails?.rules?.checkOutTime) {
                    const adjustedCheckOut = getAdjustedCheckOutTime(
                      date,
                      hotelDetails.rules.checkOutTime
                    );
                    setCheckOut(adjustedCheckOut);
                  }
                }}
                minimumDate={addDays(checkIn, 1)}
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
          {/* {searchInitiated && priceRange && (
            <View className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg mt-4">
              <Text className="text-lg font-semibold dark:text-white mb-2">
                Price Range
              </Text>
              <Text className="dark:text-white">
                ₹{priceRange.min} - ₹{priceRange.max} per night
              </Text>
            </View>
          )} */}
        </View>

        {noRoomsAvailable && (
          <View className="bg-red-100 dark:bg-red-900 p-3 rounded-lg my-4">
            <Text className="text-red-500 dark:text-red-100">No Rooms Available for today</Text>
          </View>
        )}

        {customerId && !noRoomsAvailable && searchInitiated && (
          <>
            <View className="flex-row justify-between items-center gap-2 my-4">
              <Text className="text-xl font-bold dark:text-white">
                Available Rooms
              </Text>
              <View className="flex-row items-center bg-gray-100 dark:bg-gray-800 rounded-lg px-3 py-2 gap-2 max-w-1/2 w-1/3">
                <Search size={20} color={theme.colors.text} />
                <TextInput
                  className="flex-1 w-full dark:text-white"
                  value={roomSearch}
                  onChangeText={setRoomSearch}
                  placeholder="Search room number"
                  placeholderTextColor="#666"
                />
              </View>
            </View>
            <View className="space-y-4">
              {filteredRooms.length === 0 ? (
                <Text className="text-center dark:text-white mt-4">
                  No rooms available matching your criteria
                </Text>
              ) : (
                filteredRooms.map((room) => (
                  <RoomCard
                    key={room.id}
                    room={room}
                    onBookNow={(roomId, price) => handleSelectRoom(roomId, price)}
                    hideImage={true}
                  />
                ))
              )}
            </View>
          </>
        )}
      </View>
    </ScrollView>
  );
};

export default CreateBookingByManager;
