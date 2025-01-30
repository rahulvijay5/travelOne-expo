import React from "react";
import { Slot, Stack } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { Text } from "@/components/ui/text";

const ExtrasLayout = () => {
  return (
    <SafeAreaProvider>
      <Stack>
        <Stack.Screen
          name="hotelrules"
          options={{
            headerShown: true,
            headerLeft: () => <Text/>,
            headerTitle: "Hotel Rules",
          }}
        />
        <Stack.Screen
          name="roomdetails"
          options={{
            headerShown: true,
            headerLeft: () => <Text/>,
            headerTitle: "Room Details",
          }}
        />
        <Stack.Screen
          name="newhotel"
          options={{
            headerShown: true,
            headerLeft: () => <Text/>,
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
      </Stack>
    </SafeAreaProvider>
  );
};

export default ExtrasLayout;
