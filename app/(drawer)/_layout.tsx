import { GestureHandlerRootView } from "react-native-gesture-handler";
import { Drawer } from "expo-router/drawer";
import {
  DrawerContentComponentProps,
  DrawerItem,
} from "@react-navigation/drawer";
import { DrawerContentScrollView } from "@react-navigation/drawer";
import Feather from "@expo/vector-icons/Feather";
import { Redirect, router, Tabs, usePathname } from "expo-router";
import { useEffect, useState } from "react";
import { FlatList, View, Image, Pressable, ActivityIndicator } from "react-native";
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
import api from "@/lib/api";
import AsyncStorage from "@react-native-async-storage/async-storage";

const CustomDrawerContent = (props: DrawerContentComponentProps) => {
  const pathname = usePathname();
  const { signOut } = useClerk();
  const { getToken } = useAuth();
  const { isDarkColorScheme } = useColorScheme();
  const { getUserData } = useUserStorage();
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [currentHotel, setCurrentHotel] = useState<any>(null);
  const [ownedHotels, setOwnedHotels] = useState<any[]>([]);
  const [previousStays, setPreviousStays] = useState<any[]>([]);

  useEffect(() => {
    const initialize = async () => {
      try {
        const userData = await getUserData();
        if (!userData) return;

        setUserRole(userData.role);

        // Get current hotel from storage
        const hotelDetailsStr = await AsyncStorage.getItem("@current_hotel_details");
        const currentHotelDetails = hotelDetailsStr ? JSON.parse(hotelDetailsStr) : null;
        setCurrentHotel(currentHotelDetails);

        // If owner, fetch owned hotels
        if (userData.role === "OWNER" && userData.userId) {
          const token = await getToken();
          if (token) {
            const res = await api.getOwnedHotels(userData.userId, token);
            if (res.ok && res.data) {
              setOwnedHotels(res.data);
            }
          }
        }

        // For regular users, show previous stays
        if (userData.role === "USER") {
          setPreviousStays(HotelData.filter((item) => parseInt(item.hotelId) !== 1));
        }
      } catch (error) {
        console.error("Error initializing drawer:", error);
      } finally {
        setLoading(false);
      }
    };

    initialize();
  }, []);

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center">
        <ActivityIndicator size="large" color="#84cc16" />
      </View>
    );
  }

  return (
    <DrawerContentScrollView
      {...props}
      style={{ backgroundColor: isDarkColorScheme ? "#000" : "#fff" }}
    >
      <View className="p-2 w-full">
        {/* Current Hotel Section */}
        {currentHotel && (
          <>
            <Text className="text-lg font-bold mb-4 dark:text-white">
              {userRole === "MANAGER" ? "Managing Hotel" : "Current Stay"}
            </Text>
            <Pressable
              className="flex-row items-center justify-start mb-4 py-4 pl-4 bg-lime-100 dark:bg-lime-950 rounded-lg border-2 dark:border-lime-100 border-lime-600"
              onPress={() => {
                console.log("Selected hotel:", currentHotel.id);
              }}
            >
              <Image
                source={
                  currentHotel.hotelImages?.[0]
                    ? { uri: currentHotel.hotelImages[0] }
                    : require("@/assets/images/favicon.png")
                }
                className="h-16 w-16 aspect-square mb-4 rounded-2xl"
              />
              <View className="ml-3 flex-1 items-start justify-start">
                <Text className="text-xl font-bold dark:text-white text-black">
                  {currentHotel.hotelName}
                </Text>
                <Text className="text-sm text-gray-600 dark:text-gray-300">
                  Code: {currentHotel.code}
                </Text>
                <Text className="text-sm text-gray-600 dark:text-gray-300">
                  Location: {currentHotel.location || currentHotel.address}
                </Text>
              </View>
            </Pressable>
          </>
        )}

        {/* Owner/Manager Specific Options */}
        {(userRole === "OWNER" || userRole === "MANAGER") && (
          <>
            <Separator className="my-4 dark:bg-white bg-black w-2/3" />
            <Text className="text-lg font-bold mb-4 dark:text-white">
              Management Options
            </Text>
            <Pressable
              className="flex-row items-center justify-start mb-4 py-4 pl-4 bg-lime-100 dark:bg-lime-950 rounded-3xl"
              onPress={() => router.push("/createBookingByManager")}
            >
              <Feather name="plus-circle" size={24} color="#84cc16" />
              <Text className="ml-3 font-semibold dark:text-white text-lg">
                Create New Booking
              </Text>
            </Pressable>
            <Pressable
              className="flex-row items-center justify-start mb-4 py-4 pl-4 bg-lime-100 dark:bg-lime-950 rounded-3xl"
              onPress={() => router.push("/bookings")}
            >
              <Feather name="book" size={24} color="#84cc16" />
              <Text className="ml-3 font-semibold dark:text-white text-lg">
                View All Bookings
              </Text>
            </Pressable>
          </>
        )}

        {/* Owner Specific Options */}
        {userRole === "OWNER" && (
          <>
            <Separator className="my-4 dark:bg-white bg-black w-2/3" />
            <Text className="text-lg font-bold mb-4 dark:text-white">
              Owner Options
            </Text>
            <Pressable
              className="flex-row items-center justify-start mb-4 py-4 pl-4 bg-lime-100 dark:bg-lime-950 rounded-3xl"
              onPress={() => router.push("/ownedHotels")}
            >
              <Feather name="home" size={24} color="#84cc16" />
              <Text className="ml-3 font-semibold dark:text-white text-lg">
                My Hotels
              </Text>
            </Pressable>
            <Pressable
              className="flex-row items-center justify-start mb-4 py-4 pl-4 bg-lime-100 dark:bg-lime-950 rounded-3xl"
              onPress={() => router.push("/newhotel")}
            >
              <Feather name="plus" size={24} color="#84cc16" />
              <Text className="ml-3 font-semibold dark:text-white text-lg">
                Create New Hotel
              </Text>
            </Pressable>
          </>
        )}

        {/* Previous Stays for Regular Users */}
        {userRole === "USER" && previousStays.length > 0 && (
          <>
            <Separator className="my-4 dark:bg-white bg-black w-2/3" />
            <Text className="text-lg font-bold mb-4 dark:text-white">
              Previous Stays
            </Text>
            <View>
              {previousStays.map((item) => (
                <Pressable
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
                </Pressable>
              ))}
            </View>
          </>
        )}

        <View className="flex-row items-center justify-between gap-2 mt-16">          
          <SignOutButton />
          <ThemeToggle />
        </View> 
      </View>
    </DrawerContentScrollView>
  );
};

export default function Layout() {
  const { isDarkColorScheme } = useColorScheme();
  const { getUserData } = useUserStorage();
  const userData = getUserData();

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
            return <Feather name="list" size={24} color={isDarkColorScheme ? "white" : "black"} />;
          },
          headerStyle: {
            backgroundColor: isDarkColorScheme ? "black" : "white",
          },
          headerTitle(props) {
            return (
              <Text className="text-2xl font-bold dark:text-white text-black">
                {/* {userData ? userData?.currentStay?.hotelName : "HotelOne"} */}
                HotelOne
              </Text>
            );
          },
          headerTitleStyle: { color: "#A9A9A9" },
          headerRight: () => (
            <View className="flex-row items-center justify-end gap-2">
              <Pressable
                onPress={handleScanPress}
                className="flex-row items-center bg-lime-100 dark:bg-lime-950 p-2 rounded-full"
              >
                <Feather name="camera" size={24} color="#84cc16" />
              </Pressable>
            </View>
          ),
          headerShadowVisible: false,
        }}
        drawerContent={(props) => <CustomDrawerContent {...props} />}
      />
    </GestureHandlerRootView>
  );
}
