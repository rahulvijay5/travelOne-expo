import React from "react";
import { router, Slot, Stack } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { Text } from "@/components/ui/text";
import { Button } from "@/components/ui/button";

const ExtrasLayout = () => {
  return (
    <SafeAreaProvider>
      <Stack>
        <Stack.Screen
          name="hotelrules"
          options={{
            headerShown: true,
            headerLeft: () => <Text />,
            headerTitle: "Hotel Rules",
          }}
        />
        <Stack.Screen
          name="roomdetails"
          options={{
            headerShown: true,
            headerLeft: () => <Text />,
            headerTitle: "Room Details",
          }}
        />
        <Stack.Screen
          name="newhotel"
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
          name="not-authenticated"
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="not-authorized"
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
            headerLeft: () => (
              <Button onPress={() => router.back()}>
                <Text className="text-black dark:text-white"> Go Back</Text>
              </Button>
            ),
            headerBackButtonDisplayMode: "minimal",
          }}
        />
        
        <Stack.Screen
          name="managePeople"
          options={{
            headerShown: true,
            headerBackButtonDisplayMode: "minimal",
            headerTitle: "Manage People",
          }}
        />
        <Stack.Screen
          name="ownedHotels"
          options={{
            headerShown: true,
            headerBackButtonDisplayMode: "minimal",
            headerLeft: () => (
              <Button onPress={() => router.back()}>
                <Text className="text-black dark:text-white"> Go Back</Text>
              </Button>
            ),
            headerTitle: "Your Owned Hotels",
          }}
        />
      </Stack>
    </SafeAreaProvider>
  );
};

export default ExtrasLayout;
