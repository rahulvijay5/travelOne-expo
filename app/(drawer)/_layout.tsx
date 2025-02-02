import { GestureHandlerRootView } from "react-native-gesture-handler";
import { Drawer } from "expo-router/drawer";
import {
  DrawerContentComponentProps,
  DrawerItem,
} from "@react-navigation/drawer";
import { DrawerContentScrollView } from "@react-navigation/drawer";
import Feather from "@expo/vector-icons/Feather";
import { Redirect, router, Tabs, usePathname } from "expo-router";
import { useEffect } from "react";
import { FlatList, View, Image, Pressable } from "react-native";
import { SignedOut, useAuth, useClerk } from "@clerk/clerk-expo";
import { Separator } from "@/components/ui/separator";
import { useColorScheme } from "@/lib/useColorScheme";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Text } from "@/components/ui/text";
import { HotelData } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import SignOutButton from "@/components/auth/SignOutButton";
import { useUserStorage } from "@/hooks/useUserStorage";
import React from "react";

const CustomDrawerContent = (props: DrawerContentComponentProps) => {
  const pathname = usePathname();
  const { signOut } = useClerk();
  const { isDarkColorScheme } = useColorScheme();

  // if (!userData) {
  //   return <Redirect href="/(auth)/sign-in" />;
  // }

  return (
    <DrawerContentScrollView
      {...props}
      style={{ backgroundColor: isDarkColorScheme ? "#000" : "#fff" }}
    >
      <View className="p-2 w-full">
        <Text className="text-lg font-bold mb-4 dark:text-white">
          Current Stay
        </Text>
        <Button
          className="flex-row items-center justify-start mb-4 py-4 pl-4 bg-lime-100 dark:bg-lime-950 rounded-lg border-2 dark:border-lime-100 border-lime-600"
          onPress={() => {
            // Handle hotel selection
            console.log("Selected hotel:", 1);
          }}
        >
          <Image
            source={require("@/assets/images/favicon.png")}
            className="h-16 w-16 aspect-square mb-4 rounded-2xl
                "
          />
          <View className="ml-3 flex-1 items-start justify-start">
            <Text className="text-xl font-bold dark:text-white text-black">
              Sunset Paradise Hotel
            </Text>
            <Text className="text-sm text-gray-600 dark:text-gray-300">
              Code: 1234
            </Text>
            <Text className="text-sm text-gray-600 dark:text-gray-300">
              Location: Jaipur, Rajasthan, India
            </Text>
          </View>
        </Button>
        <Separator className="my-4 dark:bg-white bg-black w-2/3" />
        <Text className="text-lg font-bold mb-4 dark:text-white">
          Previous Stays
        </Text>
        <View>
          {HotelData.filter((item) => parseInt(item.hotelId) !== 1).map(
            (item) => (
              <Button
                key={item.hotelId}
                className="flex-row items-center justify-start mb-4 py-4 pl-4 bg-lime-100 dark:bg-lime-950 rounded-3xl"
                onPress={() => {
                  console.log("Selected hotel:", item.hotelId);
                }}
              >
                <Feather name="home" size={24} color="#84cc16" />
                <View className="ml-3">
                  <Text className="font-semibold dark:text-white text-lg truncate line-clamp-1">
                    {item.hotelName}
                  </Text>
                  <Text className="text-sm text-gray-600 dark:text-gray-300">
                    Code: {item.code}
                  </Text>
                </View>
              </Button>
            )
          )}
        </View>

       <SignOutButton/>
        <Button onPress={() => router.push("/(extras)/onboarding")} className="mt-16">
          <Text className="text-lg font-bold mb-4 dark:text-white">
            Onboarding
          </Text>
        </Button>
      </View>
    </DrawerContentScrollView>
  );
};

export default function Layout() {
  const { isDarkColorScheme } = useColorScheme();

  const { isSignedIn } = useAuth();

  const handleScanPress = () => {
    if (!isSignedIn) {
      router.push("/sign-up");
      return;
    }
    router.push("/scanqr");
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Drawer
        screenOptions={{
          drawerActiveBackgroundColor: "#84cc16",
          drawerActiveTintColor: "#84cc16",
          drawerType: "front",
          drawerIcon() {
            return <Feather name="list" size={24} color={"white"} />;
          },
          headerStyle: {
            backgroundColor: isDarkColorScheme ? "black" : "white",
          },
          headerTitle(props) {
            return (
              <Text className="text-2xl font-bold dark:text-white text-black">
                HotelOne
              </Text>
            );
          },
          headerTitleStyle: { color: "#A9A9A9" },
          headerRight: () => (
            <View className="flex-row items-center justify-end gap-2">
              <Button
                onPress={handleScanPress}
                className="flex-row items-center bg-lime-100 dark:bg-lime-950 p-2 rounded-full"
              >
                <Feather name="camera" size={24} color="#84cc16" />
              </Button>
              <ThemeToggle />
            </View>
          ),
          headerShadowVisible: false,
        }}
        drawerContent={(props) => <CustomDrawerContent {...props} />}
      />
    </GestureHandlerRootView>
  );
}
