import { GestureHandlerRootView } from "react-native-gesture-handler";
import { Drawer } from "expo-router/drawer";
import { View, Pressable } from "react-native";
import { useAuth } from "@clerk/clerk-expo";
import { useColorScheme } from "@/lib/useColorScheme";
import { Text } from "@/components/ui/text";
import { useUserStorage } from "@/hooks/useUserStorage";
import React from "react";
import CustomDrawerContent from "@/components/CustomDrawerContent";
import { router } from "expo-router";
import { Feather } from "@expo/vector-icons";

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
