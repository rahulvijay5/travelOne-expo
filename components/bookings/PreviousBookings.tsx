import { View, Text } from "react-native";
import React from "react";
import { BookingDataInDb } from "@/types/booking";
import { format } from "date-fns";
import { Pressable } from "react-native";
import { navigateTo } from "@/lib/actions/navigation";

const PreviousBookings = ({
  bookings,
  title = "Previous Bookings",
}: {
  bookings: BookingDataInDb[];
  title?: string;
}) => {
  return (
    <View>
      {title && (
        <Text className="text-xl font-bold mb-4 dark:text-white">{title}</Text>
      )}
      <View className="flex gap-1">
        {bookings.length > 0 ? bookings.map((booking: BookingDataInDb, index: number) => (
          <Pressable
            key={index}
            className="bg-gray-50 dark:bg-gray-800 p-4 rounded-xl"
            onPress={() => navigateTo(`/bookings/${booking.id}`)}
          >
            <View className="flex-row justify-between items-start">
              <View>
                <Text className="font-semibold text-lg dark:text-white">
                  {booking.hotel.hotelName}
                </Text>
                <Text className="text-gray-600 dark:text-gray-400">
                  {format(new Date(booking.checkIn), "MMM d, yyyy")} -{" "}
                  {format(new Date(booking.checkOut), "MMM d, yyyy")}
                </Text>
                <Text className="text-gray-600 dark:text-gray-400">
                  {booking.guests} guests
                </Text>
              </View>
              <View
                className={`px-3 py-1 rounded-full ${
                  booking.status === "CONFIRMED"
                    ? "bg-green-100 dark:bg-green-900"
                    : "bg-yellow-100 dark:bg-yellow-900"
                }`}
              >
                <Text
                  className={`${
                    booking.status === "CONFIRMED"
                      ? "text-green-800 dark:text-green-100"
                      : "text-yellow-800 dark:text-yellow-100"
                  }`}
                >
                  {booking.status}
                </Text>
              </View>
            </View>
            </Pressable>
          ))
         : (
          <View className="flex-1 justify-center items-center ">
            <Text className="text-gray-600 dark:text-gray-400">
              No previous bookings found
            </Text>
          </View>
        )}
      </View>
    </View>
  );
};

export default PreviousBookings;
