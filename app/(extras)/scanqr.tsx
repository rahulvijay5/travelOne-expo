import { View, Alert, Linking, TextInput, Pressable } from "react-native";
import { useState, useEffect } from "react";
import { CameraView, Camera } from "expo-camera";
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import { Text } from "@/components/ui/text";
import { useAuth } from "@clerk/clerk-expo";
import { SafeAreaView } from "react-native-safe-area-context";
import { useUserStorage } from "@/hooks/useUserStorage";
import { processCode } from "@/lib/actions/processCode";

export default function ScanQRScreen() {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanning, setScanning] = useState(true); // Start with camera open
  const [manualCode, setManualCode] = useState("");
  const { isSignedIn, getToken } = useAuth();
  const { storeUserData, getUserData } = useUserStorage();

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
    const code = data.split("=")[1]; // Simple split to extract the hotelCode
    console.log("code", code);
    const result = await processCode({
      code,
      getToken,
      getUserData,
      storeUserData,
    });

    if (result.success) {
      router.replace("/");
    } else {
      Alert.alert("Error", result.error);
      setScanning(true);
    }
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

  const handleManualSubmit = async () => {
    const code = manualCode.toLowerCase().trim();
    console.log("code: ", code);
    if (code) {
      const result = await processCode({
        code,
        getToken,
        getUserData,
        storeUserData,
        forceRefetch: true, 
      });

      if (result.success) {
        router.replace("/");
      } else {
        Alert.alert("Error", result.error);
      }
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
        <Pressable onPress={getCameraPermissions} className="bg-lime-500 p-2">
          <Text className="dark:text-white text-black">
            Grant Camera Permission
          </Text>
        </Pressable>
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
            <Pressable
              onPress={() => setScanning(true)}
              className="bg-lime-500 bottom-4 h-100 absolute p-2 w-1/2 self-center rounded-md py-4"
            >
              <Text className="text-lg text-center font-bold">Try Again</Text>
            </Pressable>
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
            <Pressable
              onPress={handleManualSubmit}
              disabled={!manualCode.trim()}
              className="bg-lime-500 p-2 flex-grow self-center rounded-md py-4"
            >
              <Text className="text-lg text-center font-bold">Submit Code</Text>
            </Pressable>
          </View>
        </View>

        {/* <View className="gap-4">
            <Text className="text-center dark:text-white text-black">
              --- OR ---
            </Text>
            <Pressable
              onPress={() => setScanning(true)}
              className="bg-lime-500 p-2 w-1/2 self-center rounded-md py-4"
            >
              <Text className="text-lg text-center font-bold">
                Scan QR Code
              </Text>
            </Pressable>
          </View> */}
      </View>
      {/* )} */}
    </View>
  );
}
