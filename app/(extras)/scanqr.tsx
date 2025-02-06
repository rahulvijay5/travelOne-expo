import { View, Alert, Linking, TextInput } from "react-native";
import { useState, useEffect } from "react";
import { CameraView, Camera } from "expo-camera";
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import { Button } from "@/components/ui/button";
import { Text } from "@/components/ui/text";
import { useAuth } from "@clerk/clerk-expo";
import { SafeAreaView } from "react-native-safe-area-context";
import api from "@/lib/api";
import { useUserStorage } from "@/hooks/useUserStorage";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function ScanQRScreen() {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanning, setScanning] = useState(true); // Start with camera open
  const [manualCode, setManualCode] = useState("");
  const { isSignedIn, getToken } = useAuth();
  const { storeUserData } = useUserStorage();

  const getCameraPermissions = async () => {
    try {
      const { status: existingStatus } =
        await Camera.getCameraPermissionsAsync();

      // If permission was previously denied, show an alert explaining why we need it
      if (existingStatus === "denied") {
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
                  setScanning(true); // Start scanning when permission is granted
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
      if (status === "granted") {
        setScanning(true); // Start scanning when permission is granted
      } else {
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
    console.log("data", data);
    setScanning(false);
    // Extract hotel code from the QR data (right nowassuming data is like 'https://hotelone.in/hotelCode=abcd')
    const code = data.split("=")[1]; // Simple split to extract the hotelCode
    console.log("code", code);
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
      // TODO: Process QR code from image
      // For now, we'll just show an alert
      Alert.alert(
        "Coming Soon",
        "QR code scanning from gallery will be available soon!"
      );
    }
  };

  const processCode = async (code: string) => {
    try {
      setScanning(false);

      const response = await api.getHotelByCode(code);
      console.log("API Response:", response);

      if (response.status === 200 && response.data) {
        try {
          await AsyncStorage.setItem(
            "@current_hotel_details",
            JSON.stringify(response.data)
          );

          // Check if user is owner or manager
          const { getUserData } = useUserStorage();
          const userData = await getUserData();
          const user = userData;

          console.log("user in scanqr in processCode", user);
          if (user?.role === "OWNER" || user?.role === "MANAGER") {
            const token = await getToken();
            if (token) {
              const rooms = await api.getHotelRooms(response.data.id, token);
              console.log("Rooms fetched:", rooms);
              if (rooms && !rooms.error) {
                await AsyncStorage.setItem(
                  "@current_hotel_rooms",
                  JSON.stringify({
                    hotelId: response.data.id,
                    rooms: rooms.data || rooms // handle both formats
                  })
                );
              }
            }
          }

          await storeUserData({
            currentStay: {
              hotelId: response.data.id,
              hotelCode: response.data.code,
              hotelName: response.data.hotelName,
            },
          });

          router.replace("/");
        } catch (storageError) {
          console.error("Error storing data:", storageError);
          Alert.alert(
            "Storage Error",
            "Failed to save information. Please try again."
          );
          setScanning(true);
        }
      } else {
        let errorMessage = "An unknown error occurred. Please try again.";

        switch (response.status) {
          case 404:
            errorMessage =
              "No hotel found with this code. Please verify and try again.";
            break;
          case 400:
            errorMessage = "Invalid hotel code format. Please try again.";
            break;
          case 500:
            errorMessage = "Server error. Please try again later.";
            break;
        }

        Alert.alert("Error", errorMessage);
        setScanning(true); // Re-enable scanning after error
      }
    } catch (error) {
      console.error("Error processing code:", error);
      Alert.alert(
        "Error",
        "Failed to process hotel code. Please check your internet connection and try again."
      );
      setScanning(true); // Re-enable scanning after error
    }
  };

  const handleManualSubmit = async () => {
    const code = manualCode.toLowerCase().trim();
    console.log("code: ", code);
    if (code) {
      await processCode(code);
    }
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
      {/* {scanning ? ( */}
      <View className="flex flex-col flex-grow gap-4">
        <View className="flex flex-col flex-grow relative">
          {scanning ? (
            <CameraView
              onBarcodeScanned={handleBarCodeScanned}
              barcodeScannerSettings={{
                barcodeTypes: ["qr", "pdf417"],
              }}
              style={{ flex: 1, height: "100%" }}
            />
          ) : (
            <Button
              onPress={() => setScanning(true)}
              className="bg-lime-500 bottom-4 h-100 absolute p-2 w-1/2 self-center rounded-md py-4"
            >
              <Text className="text-lg text-center font-bold">Try Again</Text>
            </Button>
          )}

          {/* <View className="absolute bottom-0 left-0 right-0 flex-row justify-between px-4">
            <Pressable
              onPress={() => setScanning(false)}
              className="bg-lime-500 p-4 rounded-lg flex-1 mr-2"
            >
              <Text className="text-center">Cancel Scanning</Text>
            </Pressable>
            <Pressable
              onPress={pickImage}
              className="bg-lime-500 p-4 rounded-lg flex-1 ml-2"
            >
              <Text className="text-center">Choose from Gallery</Text>
            </Pressable>
          </View> */}
        </View>
        {/* </View>
      ) : (
        <View className="flex-1 p-4 gap-4 justify-center"> */}
        <View className="flex gap-2 mb-16 rounded-t-lg">
          <Text className="text-center dark:text-white text-black">
            --- OR ---
          </Text>
          <Text className="text-xl font-bold text-center dark:text-white text-black">
            Enter Hotel Code
          </Text>
          <View className="flex flex-row items-center justify-between gap-2 px-8">
            <TextInput
              value={manualCode}
              onChangeText={setManualCode}
              placeholder="Enter hotel code"
              className="p-4 border-2 font-bold text-xl border-gray-300 w-3/5 text-center self-center rounded-md dark:text-white text-black"
            />
            <Button
              onPress={handleManualSubmit}
              disabled={!manualCode.trim()}
              className="bg-lime-500 p-2 flex-grow self-center rounded-md py-4"
            >
              <Text className="text-lg text-center font-bold">Submit Code</Text>
            </Button>
          </View>
        </View>

        {/* <View className="gap-4">
            <Text className="text-center dark:text-white text-black">
              --- OR ---
            </Text>
            <Button
              onPress={() => setScanning(true)}
              className="bg-lime-500 p-2 w-1/2 self-center rounded-md py-4"
            >
              <Text className="text-lg text-center font-bold">
                Scan QR Code
              </Text>
            </Button>
          </View> */}
      </View>
      {/* )} */}
    </View>
  );
}
