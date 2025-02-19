import { GestureHandlerRootView } from "react-native-gesture-handler";
import { Drawer } from "expo-router/drawer";
import { View, Pressable } from "react-native";
import { useAuth } from "@clerk/clerk-expo";
import { useColorScheme } from "@/lib/useColorScheme";
import { Text } from "@/components/ui/text";
import React, { useCallback, useEffect, useRef } from "react";
import CustomDrawerContent from "@/components/CustomDrawerContent";
import { router } from "expo-router";
import { AntDesign, Feather } from "@expo/vector-icons";
import { useHotelStore } from "@/lib/store/hotelStore";
import { APP_NAME } from "@/lib/constants";
import QRCodeBottomSheet from "@/components/QRCodeBottomSheet";
import { APP_URL } from "@/lib/config/index";
import BottomSheet from "@gorhom/bottom-sheet";

export default function DrawerLayout() {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";
  const { currentHotel, initializeFromStorage } = useHotelStore();
  const bottomSheetRef = useRef<BottomSheet>(null);
  const { isSignedIn } = useAuth();

  useEffect(() => {
    initializeFromStorage();
  }, []);
  const handleCloseQRCode = useCallback(() => {
    if (bottomSheetRef.current) {
      bottomSheetRef.current.close();
    }
  }, []);

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
            return (
              <Feather
                name="list"
                size={24}
                color={isDark ? "white" : "black"}
              />
            );
          },
          headerStyle: {
            backgroundColor: isDark ? "black" : "white",
          },
          headerTintColor: isDark ? "white" : "black",
          drawerStyle: {
            backgroundColor: isDark ? "black" : "white",
          },
          headerTitle: () => (
            <Text className="text-2xl font-bold dark:text-white text-black line-clamp-1 truncate">
              {currentHotel?.hotelName || APP_NAME}
            </Text>
          ),
          headerRight: () =>
            currentHotel?.hotelName ? (
              <Pressable
                onPress={() => {
                  if (bottomSheetRef.current) {
                    bottomSheetRef.current.snapToIndex(0);
                  }
                }}
                className="mr-4"
              >
                <AntDesign
                  name="qrcode"
                  size={24}
                  color={isDark ? "#9ca3af" : "#4b5563"}
                />
              </Pressable>
            ) : (
              <View className="flex-row items-center justify-end gap-2 mr-2">
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

      <QRCodeBottomSheet
        bottomSheetRef={bottomSheetRef}
        appUrl={APP_URL || "https://travelone.app"}
        onClose={handleCloseQRCode}
      />
    </GestureHandlerRootView>
  );
}
