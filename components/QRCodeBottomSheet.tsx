import React, { useCallback, useMemo, useEffect, useState } from "react";
import {
  View,
  Pressable,
  Dimensions,
  Share,
  Alert,
  ToastAndroid,
} from "react-native";
import { Text } from "@/components/ui/text";
import BottomSheet, {
  BottomSheetBackdrop,
  BottomSheetView,
} from "@gorhom/bottom-sheet";
import QRCode from "react-native-qrcode-svg";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import * as MediaLibrary from "expo-media-library";
import { useColorScheme } from "@/lib/useColorScheme";
import { captureRef } from "react-native-view-shot";
import * as Clipboard from "expo-clipboard";
import { useHotelStore } from "@/lib/store/hotelStore";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useUserStorage } from "@/hooks/useUserStorage";

const { width } = Dimensions.get("window");
const QR_SIZE = width * 0.6;

interface QRCodeBottomSheetProps {
  bottomSheetRef: React.RefObject<BottomSheet>;
  appUrl: string;
  onClose: () => void;
}

export default function QRCodeBottomSheet({
  bottomSheetRef,
  appUrl,
  onClose,
}: QRCodeBottomSheetProps) {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";
  const snapPoints = useMemo(() => ["65%"], []);
  const qrRef = React.useRef<View>(null);
  const { getUserData } = useUserStorage();
  const [currentHotel, setCurrentHotel] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initialize = async () => {
      try {
        const userData = await getUserData();

        // Get current hotel from storage
        const hotelDetailsStr = await AsyncStorage.getItem(
          "@current_hotel_details"
        );
        const currentHotelDetails = hotelDetailsStr
          ? JSON.parse(hotelDetailsStr)
          : null;
        setCurrentHotel(currentHotelDetails);
      } finally {
//do nothing
      }
    };
    initialize();
  }, []);

  const qrUrl = `${appUrl}/hotelCode=${currentHotel?.code}`;

  const renderBackdrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop
        {...props}
        appearsOnIndex={0}
        disappearsOnIndex={-1}
        pressBehavior="close"
        opacity={0.5}
      />
    ),
    []
  );

  const showToastWithGravity = () => {
    ToastAndroid.showWithGravity(
      "Code Copied To Clipboard",
      ToastAndroid.SHORT,
      ToastAndroid.CENTER
    );
  };

  const handleCopyLink = async () => {
    try {
      await Clipboard.setStringAsync(currentHotel?.code);
      showToastWithGravity();
    } catch (error) {
      Alert.alert("Error", "Failed to copy code");
    }
  };

  const handleShare = async () => {
    try {
      const result = await Share.share({
        title: "Hotel QR Code",
        message: `Scan this QR code to access the hotel: ${qrUrl}`,
        url: qrUrl,
      });
    } catch (error) {
      Alert.alert("Error", "Failed to share QR code");
    }
  };

  const handleDownload = async () => {
    try {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission Required",
          "Please grant permission to save images"
        );
        return;
      }

      if (qrRef.current) {
        const uri = await captureRef(qrRef.current, {
          format: "png",
          quality: 1,
        });
        await MediaLibrary.saveToLibraryAsync(uri);
        Alert.alert("Success", "QR code saved to gallery!");
      }
    } catch (error) {
      Alert.alert("Error", "Failed to save QR code");
    }
  };

  return (
    <BottomSheet
      ref={bottomSheetRef}
      index={-1}
      snapPoints={snapPoints}
      enablePanDownToClose
      backdropComponent={renderBackdrop}
      backgroundStyle={{
        backgroundColor: isDark ? "#1f2937" : "white",
        borderRadius: 24,
      }}
      handleIndicatorStyle={{
        backgroundColor: isDark ? "#6b7280" : "#94a3b8",
        width: 40,
      }}
      onChange={(index) => {
        if (index === -1) {
          onClose();
        }
      }}
    >
      <BottomSheetView className="flex-1 px-4 mb-6">
        <View className="flex-row justify-between items-center mb-6">
          <Text className="text-xl font-bold dark:text-white">
            Hotel QR Code
          </Text>
          <Pressable
            onPress={() => {
              if (bottomSheetRef.current) {
                bottomSheetRef.current.close();
              }
            }}
            className="p-2"
          >
            <Ionicons
              name="close"
              size={24}
              color={isDark ? "#9ca3af" : "#4b5563"}
            />
          </Pressable>
        </View>

        {/* QR Code */}
        <View
          ref={qrRef}
          className="items-center justify-center p-8 rounded-3xl mb-6"
        >
          <QRCode
            value={qrUrl}
            size={QR_SIZE}
            backgroundColor="white"
            color="black"
            quietZone={16}
            enableLinearGradient
            linearGradient={["#606c88", "#3f4c6b"]}
          />
          <Text className="mt-4 text-2xl dark:text-white font-medium">
            Hotel Code: {currentHotel?.code}
          </Text>
        </View>

        {/* Action Buttons */}
        {/* <View className="flex-row gap-2 flex-wrap items-center w-full justify-center"> */}
        {/* <Pressable
            onPress={handleShare}
            className="flex-row items-center bg-lime-500 dark:bg-lime-600 p-4 rounded-2xl"
          >
            <MaterialIcons name="share" size={24} color="white" />
            <Text className="text-white font-semibold ml-3">Share QR Code</Text>
          </Pressable> */}

        {/* <Pressable
            onPress={handleCopyLink}
            className="flex-row items-center bg-blue-500 dark:bg-blue-600 p-4 rounded-2xl"
          >
            <MaterialIcons name="content-copy" size={24} color="white" />
            <Text className="text-white font-semibold ml-3">Copy Code</Text>
          </Pressable> */}

        {/* <Pressable
            onPress={handleDownload}
            className="flex-row items-center bg-[#6366f1] dark:bg-[#6366f1] p-4 rounded-2xl"
          >
            <MaterialIcons name="file-download" size={24} color="white" />
            <Text className="text-white font-semibold ml-3">Save to Gallery</Text>
          </Pressable> */}
        {/* </View> */}
      </BottomSheetView>
    </BottomSheet>
  );
}
