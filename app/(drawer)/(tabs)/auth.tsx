import { View } from "react-native";
import React, { useEffect, useState } from "react";
import { useAuth, useUser } from "@clerk/clerk-expo";
import { Text } from "@/components/ui/text";
import { Button } from "@/components/ui/button";
import api from "@/lib/api";
import { useRouter } from "expo-router";
import { useUserStorage } from "@/hooks/useUserStorage";
import { useColorScheme } from "@/lib/useColorScheme";
import NewHotelButton from "@/components/NewHotelButton";

const Auth = () => {
  const { user } = useUser();
  const [currentRole, setCurrentRole] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const handleCheckRole = async () => {
      try {
        if (!user?.id) {
          router.replace("/(auth)/sign-in");
          return;
        }

        // First try to get role from metadata
        const metadataRole = user.publicMetadata.role;
        if (metadataRole) {
          setCurrentRole(metadataRole as string);
          return;
        }

        // If no role in metadata, update it to CUSTOMER
        try {
          const response = await api.updateUserRole(user.id, "CUSTOMER");
          console.log("Update role response:", response);

          if (response?.role) {
            setCurrentRole("CUSTOMER");
          } else {
            console.error("Invalid response from updateUserRole:", response);
          }
        } catch (apiError) {
          console.error("API Error:", apiError);
        }
      } catch (error) {
        console.error("Error checking/updating role:", error);
      }
    };

    handleCheckRole();
  }, [user?.id]);

  return (
    <View className="flex-1 items-center justify-center gap-4">
      <View className="items-center gap-2">
        <Text className="text-lg font-semibold dark:text-white text-black">
          Clerk ID:
        </Text>
        <Text className="text-base dark:text-white text-black">
          {user?.id || "Loading..."}
        </Text>
      </View>

      <View className="items-center gap-2">
        <Text className="text-lg font-semibold dark:text-white text-black">
          Current Role:
        </Text>
        <Text className="text-base dark:text-white text-black">
          {currentRole || "Loading..."}
        </Text>
      </View>

      <View className="items-center gap-2">
        <Text className="text-lg font-semibold dark:text-white text-black">
          Email:
        </Text>
        <Text className="text-base dark:text-white text-black">
          {user?.emailAddresses[0]?.emailAddress || "No email found"}
        </Text>
      </View>

      <Button
        onPress={() => {
          const handleCheckRole = async () => {
            try {
              if (!user?.id) {
                router.replace("/(auth)/sign-in");
                return;
              }

              // First try to get role from metadata
              const metadataRole = user.publicMetadata.role;
              if (metadataRole) {
                setCurrentRole(metadataRole as string);
                return;
              }

              // If no role in metadata, update it to CUSTOMER
              try {
                const response = await api.updateUserRole(user.id, "CUSTOMER");
                console.log("Update role response:", response);

                if (response?.role) {
                  setCurrentRole("CUSTOMER");
                } else {
                  console.error("Invalid response from updateUserRole:", response);
                }
              } catch (apiError) {
                console.error("API Error:", apiError);
              }
            } catch (error) {
              console.error("Error checking/updating role:", error);
            }
          };
          handleCheckRole();
        }}
        className="mt-4 bg-blue-500 px-6 py-3 rounded-lg"
      >
        <Text className="text-white font-semibold">Check Role</Text>
      </Button>

      <NewHotelButton />
    </View>
  );
};

export default Auth;
