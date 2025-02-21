import React, { useEffect, useState } from "react";
import { View, ActivityIndicator, Pressable } from "react-native";
import { Text } from "@/components/ui/text";
import { useAuth } from "@clerk/clerk-expo";
import { router, useLocalSearchParams } from "expo-router";
import { useUserStorage } from "@/hooks/useUserStorage";
import { checkBookingStatusFromApi } from "@lib/api";
import { format } from "date-fns";
import { CheckBookingStatusResponse } from "@/types/booking";

const ThankYou = () => {
  const { getToken } = useAuth();
  const { getUserData } = useUserStorage();
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("Creating your booking...");
  const [error, setError] = useState<string | null>(null);
  const [bookingDetails, setBookingDetails] =
    useState<CheckBookingStatusResponse | null>(null);
  const { passedBookingId } = useLocalSearchParams();

  useEffect(() => {
    let mounted = true;
    let pollInterval: NodeJS.Timeout | null = null;
    let startPollingTimeout: NodeJS.Timeout | null = null;
    let pollCount = 0;
    const MAX_POLLS = 20;

    const checkBookingStatus = async () => {
      if (!mounted) return;
      
      pollCount++;
      console.log(
        `[Poll #${pollCount}] Checking booking status at ${format(new Date(), "HH:mm:ss")}`
      );

      try {
        const bookingId = passedBookingId as string;
        const token = await getToken();
        const userData = await getUserData();

        if (!bookingId || !token) {
          throw new Error("Booking information not found");
        }

        const response = await checkBookingStatusFromApi(bookingId, token);
        // console.log("Received booking details:", response);

        if (!mounted) return;

        setBookingDetails(response);

        const stopPolling = () => {
          if (pollInterval) {
            clearInterval(pollInterval);
            pollInterval = null;
          }
        };

        if (response.booking.status === "CONFIRMED") {
          console.log("Booking confirmed, stopping polls");
          setMessage("Booking confirmed! Thank you for booking with us.");
          setLoading(false);
          stopPolling();

          setTimeout(() => {
            router.replace("/");
          }, 3000);
        } else if (response.booking.status === "CANCELLED") {
          console.log("Booking cancelled, stopping polls");
          setError("Booking was cancelled");
          setLoading(false);
          stopPolling();
        } else if (response.booking.status === "PENDING") {
          if (userData?.role === "OWNER" || userData?.role === "MANAGER") {
            console.log("Manager/Owner booking, stopping polls");
            setMessage("Booking created successfully!");
            setLoading(false);
            stopPolling();

            setTimeout(() => {
              router.replace("/(drawer)/(tabs)/bookings");
            }, 3000);
          } else {
            if (pollCount >= MAX_POLLS) {
              console.log("Max polls reached, stopping");
              setMessage("Your booking is pending approval from the hotel.");
              setLoading(false);
              stopPolling();
            } else {
              setMessage("Waiting for confirmation from hotel...");
            }
          }
        }
      } catch (error) {
        if (!mounted) return;
        console.error("Error checking booking status:", error);
        setError("Failed to check booking status");
        setLoading(false);
        if (pollInterval) {
          clearInterval(pollInterval);
          pollInterval = null;
        }
      }
    };

    // Initial check
    console.log("Starting initial check");
    checkBookingStatus();

    // Start polling after 30 seconds
    console.log("Will start polling in 30 seconds");
    startPollingTimeout = setTimeout(() => {
      console.log("Starting polling interval");
      if (mounted && !pollInterval) {
        pollInterval = setInterval(checkBookingStatus, 4500);
      }
    }, 30000);

    return () => {
      console.log("Cleaning up polling");
      mounted = false;
      if (startPollingTimeout) {
        clearTimeout(startPollingTimeout);
      }
      if (pollInterval) {
        clearInterval(pollInterval);
        pollInterval = null;
      }
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

      {bookingDetails?.booking && (
        <View className="bg-white dark:bg-gray-800 rounded-lg p-4 w-full mb-6 border border-gray-200 dark:border-gray-700">
          <Text className="text-lg font-bold dark:text-white mb-4">
            Booking Details
          </Text>

          <View className="space-y-2">
            <View className="flex-row justify-between">
              <Text className="dark:text-white">Room</Text>
              <Text className="dark:text-white font-semibold">
                {bookingDetails.booking.room.roomNumber} ({bookingDetails.booking.room.type})
              </Text>
            </View>

            <View className="flex-row justify-between">
              <Text className="dark:text-white">Check-in</Text>
              <Text className="dark:text-white font-semibold">
                {format(new Date(bookingDetails.booking.checkIn), "d MMM, yyyy")}
              </Text>
            </View>

            <View className="flex-row justify-between">
              <Text className="dark:text-white">Check-out</Text>
              <Text className="dark:text-white font-semibold">
                {format(new Date(bookingDetails.booking.checkOut), "d MMM, yyyy")}
              </Text>
            </View>

            <View className="flex-row justify-between">
              <Text className="dark:text-white">Guests</Text>
              <Text className="dark:text-white font-semibold">
                {bookingDetails.booking.guests}
              </Text>
            </View>

            <View className="h-px bg-gray-200 dark:bg-gray-700 my-2" />

            <View className="flex-row justify-between">
              <Text className="dark:text-white font-bold">Total Amount</Text>
              <Text className="dark:text-white font-bold">
                ₹{bookingDetails.booking.payment?.totalAmount || 0}
              </Text>
            </View>

            <View className="flex-row justify-between">
              <Text className="dark:text-white">Payment Status</Text>
              <Text
                className={`font-semibold ${
                  bookingDetails.booking.payment?.status === "PAID"
                    ? "text-green-500"
                    : "text-yellow-500"
                }`}
              >
                {bookingDetails.booking.payment?.status || "PENDING"}
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
