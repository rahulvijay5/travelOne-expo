import { View, Alert, Platform, Linking, Pressable, TextInput } from "react-native";
import { useState, useEffect } from "react";
import { CameraView, Camera } from "expo-camera"
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import { Button } from "@/components/ui/button";
import { Text } from "@/components/ui/text";
import { Input } from "@/components/ui/input";
import { setCurrentHotel } from "@/hooks/getCurrentHotel";
import { HotelData } from "@/lib/constants";
import { useAuth } from "@clerk/clerk-expo";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ScanQRScreen() {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanning, setScanning] = useState(false);
  const [manualCode, setManualCode] = useState("");
  const { isSignedIn } = useAuth();

  const getCameraPermissions = async () => {
    try {
      const { status: existingStatus } =
        await Camera.getCameraPermissionsAsync();

      // If permission was previously denied, show an alert explaining why we need it
      if (existingStatus === "denied") {
        //remove this line latter, for testing only
        setHasPermission(true);

        Alert.alert(
          "Camera Permission Required",
          "We need camera access to scan QR codes. Would you like to enable it?",
          [
            {
              text: "Cancel",
              style: "cancel",
              onPress: () => setHasPermission(false),
            },
            {
              text: "Enable Camera",
              onPress: async () => {
                const { status } = await Camera.requestCameraPermissionsAsync();
                if (status !== "granted") {
                  // If still not granted, prompt to open settings
                  Alert.alert(
                    "Open Settings",
                    "Please enable camera access in your device settings to use this feature.",
                    [
                      {
                        text: "Cancel",
                        style: "cancel",
                        onPress: () => setHasPermission(false),
                      },
                      {
                        text: "Open Settings",
                        onPress: () => {
                          Linking.openSettings();
                          setHasPermission(false);
                        },
                      },
                    ]
                  );
                } else {
                  setHasPermission(true);
                }
              },
            },
          ]
        );
        return;
      }

      // If not previously denied or no existing permission, request it
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === "granted");

      if (status !== "granted") {
        Alert.alert(
          "Permission Denied",
          "Camera access is required to scan QR codes.",
          [{ text: "OK", onPress: () => setHasPermission(false) }]
        );
      }
    } catch (error) {
      console.error("Error requesting camera permission:", error);
      setHasPermission(false);
    }
  };

  useEffect(() => {
    if (!isSignedIn) {
      router.replace("/sign-up");
      return;
    }
    getCameraPermissions();
  }, [isSignedIn]);

  const handleBarCodeScanned = async ({ data }: { data: string }) => {
    setScanning(false);
    // Extract hotel code from the QR data (assuming data is like 'hotelCode=1234')
    const code = data.split("=")[1]; // Simple split to extract the hotelCode
    await processCode(code);
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      // process the image to extract QR code
      // For now, we'll just show an alert that this feature is coming soon
      Alert.alert(
        "Coming Soon",
        "QR code scanning from gallery will be available soon!"
      );
    }
  };

  const processCode = async (code: string) => {
    const hotel = HotelData.find((h) => h.code.toString() === code);
    if (hotel) {
      await setCurrentHotel(hotel.hotelId);
      Alert.alert("Success", `Found hotel: ${hotel.hotelName}`);
      router.back();
    } else {
      Alert.alert("Error", "Invalid hotel code. Please try again.");
    }
  };

  const handleManualSubmit = async () => {
    if (manualCode.trim()) {
      await processCode(manualCode.trim());
    }
  };

  const showOptions = () => {
    Alert.alert(
      "Scan QR Code",
      "Choose a method to scan the hotel code",
      [
        {
          text: "Use Camera",
          onPress: () => setScanning(true),
        },
        {
          text: "Choose from Gallery",
          onPress: pickImage,
        },
        {
          text: "Cancel",
          style: "cancel",
        },
      ],
      { cancelable: true }
    );
  };

  if (hasPermission === null) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center">
        <Text>Requesting camera permission...</Text>
      </SafeAreaView>
    );
  }

  if (hasPermission === false) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center p-4">
        <Text className="text-center mb-4 dark:text-white text-black">
          Camera access is required to scan QR codes.
        </Text>
        <Button onPress={getCameraPermissions} className="bg-lime-500 p-2">
          <Text className="dark:text-white text-black">
            Grant Camera Permission
          </Text>
        </Button>
      </SafeAreaView>
    );
  }

  return (
    <View className="flex-1 justify-center">
      {scanning ? (
        <View className="flex-1">
          <CameraView
            onBarcodeScanned={handleBarCodeScanned}
            barcodeScannerSettings={{
              barcodeTypes: ["qr", "pdf417"],
            }}
            style={{ flex: 1 }}
          />
          <Pressable
            onPress={() => setScanning(false)}
            className="absolute bottom-10 left-0 bg-lime-500 p-4 font-bold text-xl text-white rounded-lg right-0 mx-4"
          >
            <Text className="text-center">Cancel Scanning</Text>
          </Pressable>
        </View>
      ) : (
        <View className="flex-1 p-4 gap-4  justify-center">
          <View className="flex  gap-4">
            <Text className="text-2xl font-bold text-center  dark:text-white text-black">
              Scan Hotel QR Code
            </Text>

            <Pressable
              onPress={showOptions}
              className="bg-lime-500 p-2 w-1/2 self-center rounded-md py-4 "
            >
              <Text className="text-lg text-center font-bold">
                Scan QR Code
              </Text>
            </Pressable>
          </View>

          <View className="gap-4 flex-1">
            <Text className="text-center dark:text-white text-black">
              --- OR ---
            </Text>
            <Text className=" dark:text-white font-bold text-2xl text-center text-black">
              Enter Code Manually
            </Text>
            <TextInput
              value={manualCode}
              onChangeText={setManualCode}
              placeholder="Enter hotel code"
              className="p-4 border-2 border-gray-300 w-1/2 self-center rounded-md dark:text-white text-black text-lg"
            />
            <Button
              onPress={handleManualSubmit}
              disabled={!manualCode.trim()}
              className="bg-lime-500 p-2 w-1/2 self-center rounded-md py-4 "
            >
              <Text className="text-lg text-center font-bold">Submit Code</Text>
            </Button>
          </View>
        </View>
      )}
    </View>
  );
}
