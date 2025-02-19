import {
  View,
  ScrollView,
  Image,
  Pressable,
  Dimensions,
  Linking,
} from "react-native";
import { Text } from "@/components/ui/text";
import React, { useRef, useCallback } from "react";
import { useColorScheme } from "@/lib/useColorScheme";
import { router } from "expo-router";
import { Nullable, HotelDetails } from "@/types";
import { formatTimeFromMinutes } from "@/lib/utils";
import { AntDesign, Feather, Ionicons } from "@expo/vector-icons";
import HotelAnalytics from "@/components/analytics/HotelAnalytics";
import BottomSheet, { BottomSheetBackdrop } from "@gorhom/bottom-sheet";
import QRCodeBottomSheet from "@/components/QRCodeBottomSheet";
import { APP_URL } from "@/lib/config/index";

const HotelView = ({
  currentHotel,
  UserIsManager,
}: {
  currentHotel: Nullable<HotelDetails>;
  UserIsManager: boolean;
}) => {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";
  const width = Dimensions.get("window").width;
  const bottomSheetRef = useRef<BottomSheet>(null);

  const handleOpenQRCode = useCallback(() => {
    console.log("open qr code");
    if (bottomSheetRef.current) {
      bottomSheetRef.current.expand();
    }
  }, []);

  const handleCloseQRCode = useCallback(() => {
    if (bottomSheetRef.current) {
      bottomSheetRef.current.close();
    }
  }, []);

  if (!currentHotel) {
    return (
      <View className="flex-1 items-center justify-center p-4 gap-20">
        <Pressable
          onPress={() => router.push("/scanqr")}
          className="dark:bg-lime-500 flex items-center justify-center bg-lime-300 h-56 w-56 rounded-full shadow-md shadow-black/50"
        >
          <Text className="text-2xl font-bold">Scan QR Code</Text>
        </Pressable>
        <Text className="text-xl text-center px-6 dark:text-white text-black mb-4">
          Seems like you don't have an active hotel stay. Scan a QR code to
          start your stay.
        </Text>
      </View>
    );
  }

  if (UserIsManager) {
    return (
      <View className="flex-1 bg-white dark:bg-black">
        <View className="flex-1">
          {/* Manager Header */}
          {/* <View className="flex justify-between gap-2 items-center flex-row p-4">
            <View className="bg-white dark:bg-gray-800 shadow-sm rounded-xl p-3">
              <Text className="text-2xl font-bold dark:text-white">
                {currentHotel.hotelName}
              </Text>
              <Text className="text-gray-500 dark:text-gray-400 mt-1">
                Hotel Code: {currentHotel.code}
              </Text>
            </View>
            <Pressable
              onPress={() => {
                if (bottomSheetRef.current) {
                  bottomSheetRef.current.snapToIndex(0);
                }
              }}
              className="bg-white dark:bg-gray-800 p-3 rounded-xl shadow-sm"
            >
              <AntDesign
                name="qrcode"
                size={32}
                color={isDark ? "#9ca3af" : "#4b5563"}
              />
            </Pressable>
          </View> */}

          {/* Analytics Section */}
          <HotelAnalytics hotelId={currentHotel.id} />
        </View>

        {/* QR Code Bottom Sheet */}
        <QRCodeBottomSheet
          bottomSheetRef={bottomSheetRef}
          appUrl={APP_URL || "https://travelone.app"}
          onClose={handleCloseQRCode}
        />
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-white dark:bg-black">
      {/* Hero Section */}
      <View className="relative">
        <Image
          source={{ uri: currentHotel.hotelImages[0] }}
          style={{ width, height: width * 0.7 }}
          className="bg-gray-200"
        />
        <View
          className="absolute top-0 right-0 p-3"
          style={{
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            borderBottomLeftRadius: 10,
          }}
        >
          <Text className="text-2xl font-bold text-white">
            {currentHotel.code}
          </Text>
        </View>
        <View
          className="absolute bottom-0 left-0 right-0 p-4"
          style={{ backgroundColor: "rgba(0, 0, 0, 0.5)" }}
        >
          <Text className="text-2xl font-bold text-white">
            {currentHotel.hotelName}
          </Text>
          <Text className="text-white mt-1">{currentHotel.location}</Text>
        </View>
      </View>

      {/* Hotel Details */}
      <View className="p-2 flex gap-4">
        {/* Description */}
        <View className="space-y-2">
          <Text className="text-lg font-bold dark:text-white text-black">
            About
          </Text>
          <Text className="text-gray-600 dark:text-gray-300">
            {currentHotel.description}
          </Text>
        </View>

        <View>
          <Text className="text-lg font-bold mb-2 dark:text-white text-black">
            Amenities
          </Text>
          <View className="flex-row flex-wrap gap-1">
            {currentHotel.amenities.map((amenity, index) => (
              <View
                key={index}
                className="bg-gray-100 dark:bg-gray-800 rounded-full px-4 py-2 m-1"
              >
                <Text className="text-gray-800 dark:text-gray-200">
                  {amenity}
                </Text>
              </View>
            ))}
          </View>
        </View>

        <View className="flex justify-center items-center">
          <Pressable
            onPress={() => router.push("/bookings")}
            className="dark:bg-lime-500 bg-lime-300 w-full rounded-2xl shadow-sm py-4 px-2 shadow-black/50"
          >
            <Text className="text-2xl text-center font-bold">
              Book a Room Now
            </Text>
          </Pressable>
        </View>

        {/* Rules */}
        <View>
          <Text className="text-lg font-bold mb-2 dark:text-white text-black">
            Hotel Guidelines
          </Text>
          <View className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 flex gap-1">
            <View className="flex-row justify-between items-center">
              <Text className="text-gray-600 dark:text-gray-300">Check-in</Text>
              <Text className="text-gray-800 dark:text-gray-100 font-medium">
                {currentHotel?.rules?.checkInTime &&
                !isNaN(currentHotel.rules.checkInTime)
                  ? formatTimeFromMinutes(currentHotel.rules.checkInTime)
                  : "Not set"}
              </Text>
            </View>
            <View className="flex-row justify-between items-center">
              <Text className="text-gray-600 dark:text-gray-300">
                Check-out
              </Text>
              <Text className="text-gray-800 dark:text-gray-100 font-medium">
                {currentHotel?.rules?.checkOutTime &&
                !isNaN(currentHotel.rules.checkOutTime)
                  ? formatTimeFromMinutes(currentHotel.rules.checkOutTime)
                  : "Not set"}
              </Text>
            </View>
            <View className="flex-row justify-between items-center">
              <Text className="text-gray-600 dark:text-gray-300">
                Max People/Room
              </Text>
              <Text className="text-gray-800 dark:text-gray-100 font-medium">
                {currentHotel?.rules?.maxPeopleInOneRoom}
              </Text>
            </View>
            <View className="flex-row justify-between items-center">
              <Text className="text-gray-600 dark:text-gray-300">
                Minimum Age
              </Text>
              <Text className="text-gray-800 dark:text-gray-100 font-medium">
                {currentHotel?.rules?.minimumAgeForCheckIn}+
              </Text>
            </View>
            <View className="flex-row flex-wrap gap-2 mt-2">
              {currentHotel?.rules?.petsAllowed && (
                <View className="bg-green-100 dark:bg-green-900 px-3 py-1 rounded-full">
                  <Text className="text-green-800 dark:text-green-100">
                    Pets Allowed
                  </Text>
                </View>
              )}
              {currentHotel?.rules?.parking && (
                <View
                  className="px-3 py-1 rounded-full"
                  style={{ backgroundColor: "rgba(0, 0, 100, 0.1)" }}
                >
                  <Text className="text-blue-800 dark:text-blue-100">
                    Parking Available
                  </Text>
                </View>
              )}
              {currentHotel?.rules?.swimmingPool && (
                <View
                  className="px-3 py-1 rounded-full"
                  style={{ backgroundColor: "rgba(0, 100, 100, 0.1)" }}
                >
                  <Text className="text-cyan-800 dark:text-cyan-100">
                    Swimming Pool
                  </Text>
                </View>
              )}
            </View>
          </View>
        </View>

        {/* Contact & Address */}
        <View>
          <Text className="text-lg font-bold mb-2 dark:text-white text-black">
            Contact & Location
          </Text>
          <View className="flex gap-2">
            <Pressable
              onPress={() =>
                Linking.openURL(`tel:${currentHotel?.contactNumber}`)
              }
              className="flex-row items-center"
            >
              <Ionicons
                name="call"
                size={20}
                color={isDark ? "#9ca3af" : "#4b5563"}
              />
              <Text className="text-gray-600 dark:text-gray-300 ml-2">
                {currentHotel?.contactNumber}
              </Text>
            </Pressable>
            <View className="flex-row items-center">
              <Ionicons
                name="location"
                size={20}
                color={isDark ? "#9ca3af" : "#4b5563"}
              />
              <Text className="text-gray-600 dark:text-gray-300 ml-2">
                {currentHotel?.address}
              </Text>
            </View>
          </View>
        </View>

        {/* Managers */}
        <View>
          <Text className="text-lg font-bold mb-2 dark:text-white text-black">
            Hotel Managers
          </Text>
          <View className="flex-row flex-wrap gap-1">
            {currentHotel.managers.map((manager, index) => (
              <View
                key={index}
                className="flex-row items-center bg-gray-100 dark:bg-gray-800 rounded-full px-4 py-2 m-1"
              >
                <Ionicons
                  name="person"
                  size={16}
                  color={isDark ? "#9ca3af" : "#4b5563"}
                />
                <Text className="text-gray-800 dark:text-gray-200 ml-2">
                  {manager.name}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Hotel Images */}
        <View>
          <Text className="text-lg font-bold mb-2 dark:text-white text-black">
            Gallery
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {currentHotel.hotelImages.map((image, index) => (
              <Image
                key={index}
                source={{ uri: image }}
                style={{
                  width: width * 0.8,
                  height: width * 0.6,
                  marginRight: 10,
                }}
                className="rounded-lg"
              />
            ))}
          </ScrollView>
        </View>
      </View>
    </ScrollView>
  );
};

export default HotelView;
