import React, { useState, useEffect } from "react";
import {
  View,
  ScrollView,
  TextInput,
  Alert,
  ActivityIndicator,
  Pressable,
  Platform,
  ToastAndroid,
} from "react-native";
import { Text } from "@/components/ui/text";
import { format, isAfter } from "date-fns";
import { useAuth } from "@clerk/clerk-expo";
import { BookingDataInDb } from "@/types/index";
import { router } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { useColorScheme } from "nativewind";
import { checkOutBooking, updateBookingPaymentStatus } from "@lib/api";
import useBookingStore from "@/lib/store/bookingStore";

interface BookingDetailsProps {
  booking: BookingDataInDb;
  onClose: () => void;
  onBookingUpdated: () => void;
}

export default function BookingDetails({
  booking,
  onClose,
  onBookingUpdated,
}: BookingDetailsProps) {
  const { getToken } = useAuth();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";
  const [paidAmount, setPaidAmount] = useState(
    booking.payment.totalAmount.toString()
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const clearCurrentBooking = useBookingStore((state) => state.clearCurrentBooking);

  // Check if checkout time has passed
  useEffect(() => {
    const checkOutTime = new Date(booking.checkOut);
    const now = new Date();
    
    if (isAfter(now, checkOutTime)) {
      Alert.alert(
        "Booking Ended",
        "Your booking period has ended. Would you like to check out now?",
        [
          {
            text: "Not Now",
            style: "cancel"
          },
          {
            text: "Check Out",
            style: "default",
            onPress: handleCheckOut
          }
        ]
      );
    }
  }, [booking.checkOut]);

  const handleCheckOut = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const token = await getToken();
      if (!token) throw new Error("Authentication required");

      const response = await checkOutBooking(booking.id, token);
      if (response?.status === 200) {
        // Clear the booking from store
        await clearCurrentBooking();
        
        Platform.OS === "ios" ? 
        Alert.alert("Success", "Booking checked out successfully") :
        ToastAndroid.show("Booking checked out successfully", ToastAndroid.SHORT);
        onBookingUpdated();
        router.push('/bookings');
      } else {
        throw new Error("Failed to check out booking");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to check out");
      console.error("Error checking out:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateBooking = async (newStatus: "PAID" | "FAILED") => {
    try {
      setIsLoading(true);
      setError(null);
      const token = await getToken();
      if (!token) throw new Error("Authentication required");

      const response = await updateBookingPaymentStatus(
        booking.id,
        parseFloat(paidAmount),
        newStatus,
        token
      );

      if (response?.status === 200) {
        Platform.OS === "ios" ? 
        Alert.alert(
          "Success",
          `Booking ${
            newStatus === "PAID" ? "confirmed" : "cancelled"
          } successfully`
        ) : (
          ToastAndroid.show(
            `Booking ${
              newStatus === "PAID" ? "confirmed" : "cancelled"
            } successfully`,
            ToastAndroid.SHORT
          )
        );
        onBookingUpdated();
        router.push('/bookings');
      } else {
        throw new Error("Failed to update booking");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update booking");
      console.error("Error updating booking:", err);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <View className="flex-1 justify-center items-center">
        <ActivityIndicator size="large" color="#84cc16" />
      </View>
    );
  }

  return (
    <ScrollView className="flex-1  nb p-4">
      {/* Booking Header */}
      <View className="flex-row justify-between items-center mb-4">
        <Text className="text-xl font-bold dark:text-white">
          Booking #{booking.id.slice(0, 8)}
        </Text>
        <View
          className={`${
            booking.status === "CONFIRMED"
              ? "bg-green-100 dark:bg-green-900"
              : booking.status === "PENDING"
              ? "bg-yellow-100 dark:bg-yellow-900"
              : booking.status === "CANCELLED"
              ? "bg-red-100 dark:bg-red-900"
              : "bg-blue-100 dark:bg-blue-900"
          } px-3 py-1 rounded-full`}
        >
          <Text
            className={`${
              booking.status === "CONFIRMED"
                ? "text-green-800 dark:text-green-100"
                : booking.status === "PENDING"
                ? "text-yellow-800 dark:text-yellow-100"
                : booking.status === "CANCELLED"
                ? "text-red-800 dark:text-red-100"
                : "text-blue-800 dark:text-blue-100"
            }`}
          >
            {booking.status.toLowerCase()}
          </Text>
        </View>
      </View>

      {/* Room Information */}
      <View className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg mb-4 flex gap-1 ">
        <View className="flex-row justify-between items-center">
          <Text className="text-lg font-semibold mb-2 dark:text-white">
            Room Information
          </Text>
          <Text className="font-medium dark:text-white text-lg  px-2 py-1 bg-blue-100 dark:bg-blue-900 rounded-lg">
            {booking.room.roomNumber}
          </Text>
        </View>
        <View className="space-y-2 flex gap-1 ">
          <View className="flex-row justify-between">
            <Text className="text-gray-600 dark:text-gray-300">Room Type:</Text>
            <Text className="font-medium dark:text-white">
              {booking.room.type}
            </Text>
          </View>
          <View className="flex-row justify-between">
            <Text className="text-gray-600 dark:text-gray-300">
              Price per Night:
            </Text>
            <Text className="font-medium dark:text-white">
              ₹{booking.room.price}
            </Text>
          </View>
          {/* <View className="flex-row justify-between">
            <Text className="text-gray-600 dark:text-gray-300">Max Occupancy:</Text>
            <Text className="font-medium dark:text-white">{booking.room.maxOccupancy}</Text>
          </View> */}
        </View>
      </View>

      {/* Customer Information */}
      <View className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg mb-4">
        <Text className="text-lg font-semibold mb-2 dark:text-white">
          Traveller Information
        </Text>
        <View className="flex gap-2">
          <View className="flex-row items-center gap-2">
            <Feather name="user" size={16} color={isDark ? "#fff" : "#000"} />
            <Text className="dark:text-white">{booking.customer.name}</Text>
          </View>
          <View className="flex-row items-center gap-2">
            <Feather name="phone" size={16} color={isDark ? "#fff" : "#000"} />
            <Text className="dark:text-white">
              {booking.customer.phoneNumber}
            </Text>
          </View>
        </View>
      </View>

      {/* Stay Details */}
      <View className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg mb-4">
        <Text className="text-lg font-semibold mb-2 dark:text-white">
          Stay Details
        </Text>
        <View className="space-y-2">
          <View className="flex-row justify-between">
            <Text className="text-gray-600 dark:text-gray-300">Check-in:</Text>
            <Text className="font-medium dark:text-white">
              {format(new Date(booking.checkIn), "dd MMM, hh:mm a")}
            </Text>
          </View>
          <View className="flex-row justify-between">
            <Text className="text-gray-600 dark:text-gray-300">Check-out:</Text>
            <Text className="font-medium dark:text-white">
              {format(new Date(booking.checkOut), "dd MMM, hh:mm a")}
            </Text>
          </View>
          <View className="flex-row justify-between">
            <Text className="text-gray-600 dark:text-gray-300">
              Number of Guests:
            </Text>
            <Text className="font-medium dark:text-white">
              {booking.guests}
            </Text>
          </View>
          <View className="flex-row justify-between">
            <Text className="text-gray-600 dark:text-gray-300">
              Booking Date:
            </Text>
            <Text className="font-medium dark:text-white">
              {format(new Date(booking.bookingTime), "dd MMM, hh:mm a")}
            </Text>
          </View>
        </View>
      </View>

      {/* Payment Information */}
      <View className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg mb-4">
        <View className="flex-row justify-between items-center mb-4">
          <Text className="text-lg font-semibold dark:text-white">
            Payment Information
          </Text>
          <View
            className={`px-3 py-1 rounded-full ${
              booking.payment.status === "PAID"
                ? "bg-green-100 dark:bg-green-900"
                : "bg-red-100 dark:bg-red-900"
            }`}
          >
            <Text
              className={
                booking.payment.status === "PAID"
                  ? "text-green-800 dark:text-green-100"
                  : "text-red-800 dark:text-red-100"
              }
            >
              {booking.payment.status.toLowerCase()}
            </Text>
          </View>
        </View>

        <View className="space-y-4">
          <View className="flex-row justify-between">
            <Text className="text-gray-600 dark:text-gray-300">
              Total Amount:
            </Text>
            <Text className="font-medium dark:text-white">
              ₹{booking.payment.totalAmount}
            </Text>
          </View>

          {booking.payment.status === "PAID" && (
            <View className="space-y-2 flex-row items-center justify-between">
              <Text className="text-gray-600 dark:text-gray-300">
                Paid Amount:
              </Text>
              <Text className="font-semibold dark:text-white">
                ₹{booking.payment.paidAmount}
              </Text>
            </View>
          )}

          {booking.payment.status === "PENDING" && (
            <View className="space-y-2 flex-row items-center justify-between">
              <Text className="text-gray-600 dark:text-gray-300">
                Paid Amount:
              </Text>
              <TextInput
                value={paidAmount}
                onChangeText={setPaidAmount}
                keyboardType="numeric"
                className="border border-gray-300 dark:border-gray-600 rounded-lg p-2 dark:text-white"
                placeholder="Enter paid amount"
              />
            </View>
          )}
        </View>
      </View>

      {error && <Text className="text-red-500 text-center mb-4">{error}</Text>}

      {/* Action Buttons */}
      {booking.payment.status === "PENDING" && (
        <View className="flex-row justify-end gap-4 mt-4">
          <Pressable
            onPress={() => {
              Alert.alert(
                "Cancel Booking",
                "Are you sure you want to cancel this booking?",
                [
                  { text: "No", style: "cancel" },
                  {
                    text: "Yes",
                    style: "destructive",
                    onPress: () => handleUpdateBooking("FAILED"),
                  },
                ]
              );
            }}
            className="bg-red-500 px-4 py-2 rounded-lg"
          >
            <Text className="text-white">Cancel Booking</Text>
          </Pressable>

          <Pressable
            onPress={() => handleUpdateBooking("PAID")}
            disabled={parseFloat(paidAmount) <= 0 || paidAmount === ""}
            className={`px-4 py-2 rounded-lg ${
              parseFloat(paidAmount) <= 0 || paidAmount === ""
                ? "bg-blue-400"
                : "bg-blue-500"
            }`}
          >
            <Text className="text-white">Confirm Booking</Text>
          </Pressable>
        </View>
      )}
      {booking.status === "CONFIRMED" && (
        <View className="flex-row justify-center gap-4 mt-4">
          <Pressable
            onPress={handleCheckOut}
            className="bg-red-500 px-4 py-2 rounded-lg"
          >
            <Text className="text-white">CheckOut</Text>
          </Pressable>
        </View>
      )}
    </ScrollView>
  );
}
