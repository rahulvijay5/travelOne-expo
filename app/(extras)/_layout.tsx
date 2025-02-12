import React from "react";
import { router, Slot, Stack } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { Text } from "@/components/ui/text";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react-native";
import { Pressable } from "react-native";

const ExtrasLayout = () => {
  return (
    <SafeAreaProvider>
      <Stack>
        <Stack.Screen
          name="(owner)/hotelrules"
          options={{
            headerShown: true,
            headerLeft: () => <Text />,
            headerTitle: "Hotel Rules",
          }}
        />
        <Stack.Screen
          name="(rooms)/roomdetails"
          options={{
            headerShown: true,
            headerLeft: () => <Text />,
            headerTitle: "Room Details",
          }}
        />
        <Stack.Screen
          name="(owner)/newhotel"
          options={{
            headerShown: true,
            headerBackVisible: true,
            headerBackButtonDisplayMode: "minimal",
            headerTitle: "Create New Hotel",
          }}
        />
        <Stack.Screen
          name="onboarding"
          options={{
            headerShown: false,
            headerTitle: "Onboarding",
          }}
        />
        <Stack.Screen
          name="(helpers)/not-authenticated"
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="(helpers)/not-authorized"
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="scanqr"
          options={{
            headerShown: true,
            headerTitle: "Scan QR Code",
            headerBackVisible: true,
            headerBackButtonDisplayMode: "minimal",
          }}
        />
        
        <Stack.Screen
          name="(owner)/managePeople"
          options={{
            headerShown: true,
            headerBackButtonDisplayMode: "minimal",
            headerTitle: "Manage People",
          }}
        />
        <Stack.Screen
          name="(owner)/ownedHotels"
          options={{
            headerShown: true,
            headerBackButtonDisplayMode: "minimal",
            headerTitle: "Your Owned Hotels",
          }}
        />
        <Stack.Screen
          name="(owner)/manageRooms"
          options={{
            headerShown: true,
            headerBackButtonDisplayMode: "minimal",
            headerTitle: "Manage Rooms",
          }}
        />
        <Stack.Screen
          name="(rooms)/roomPage"
          options={{
            headerShown: true,
            headerBackButtonDisplayMode: "minimal",
            headerTitle: "Room Page",
          }}
        />
        <Stack.Screen
          name="bookings/[id]"
          options={{
            headerShown: true,
            headerBackButtonDisplayMode: "minimal",
            headerTitle: "Booking Details",
          }}
        />
        <Stack.Screen
          name="user-profile"
          options={{
            headerShown: true,
            headerBackButtonDisplayMode: "minimal",
            headerTitle: "User Profile",
          }}
        />
        <Stack.Screen
          name="(bookings)/confirmBooking"
          options={{
            headerShown: false,
            headerBackButtonDisplayMode: "minimal",
            headerTitle: "Book Room",
          }}
        />
        <Stack.Screen
          name="(bookings)/createBookingByManager"
          options={{
            headerShown: true,
            headerBackButtonDisplayMode: "minimal",
            // headerBackVisible: true,
            headerLeft: () => (
              <Pressable onPress={() => router.back()}>
                <Text className="text-black dark:text-white"><ChevronLeft size={24} /></Text>
              </Pressable>
            ),
            headerTitle: "Create Booking",
          }}
        />
        <Stack.Screen
          name="(bookings)/managerConfirmBooking"
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="(bookings)/thankyou"
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="(helpers)/terms"
          options={{
            headerShown: true,
            
          }}
        />
        <Stack.Screen
          name="(helpers)/privacy"
          options={{
            headerShown: true,
          }}
        />
      </Stack>
    </SafeAreaProvider>
  );
};

export default ExtrasLayout;