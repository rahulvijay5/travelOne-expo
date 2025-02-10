import { Pressable, View } from "react-native";
import React, { useEffect, useState } from "react";
import { useAuth, useUser } from "@clerk/clerk-expo";
import { Text } from "@/components/ui/text";
import { Button } from "@/components/ui/button";
import api from "@/lib/api";
import { useRouter } from "expo-router";
import NewHotelButton from "@/components/NewHotelButton";
import { useUserStorage } from "@/hooks/useUserStorage";

const Auth = () => {
  const { user } = useUser();
  const { getToken } = useAuth();
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
          const token = await getToken();
          if (!token) {
            console.error("No auth token available");
            return;
          }

          const response = await updateUserRole(user.id, "CUSTOMER", token);
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
      finally {
        //not sure this will work or not
        router.replace("/auth");
      }
    };

    handleCheckRole();
  }, [user?.id]);

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
        const { updateUserData } = useUserStorage();
        updateUserData({ role: metadataRole as string });
        return;
      }

      // If no role in metadata, update it to CUSTOMER
      if (!metadataRole) {
        try {
          const token = await getToken();
          if (!token) {
            console.error("No auth token available");
            return;
          }

          const response = await updateUserRole(user.id, "CUSTOMER", token);
          console.log("Update role response:", response);

          if (response?.role) {
            setCurrentRole(response.role);
          } else {
            console.error("Invalid response from updateUserRole:", response);
          }
        } catch (apiError) {
          console.error("API Error:", apiError);
        }
      }
    } catch (error) {
      console.error("Error checking/updating role:", error);
    }
  };

  return (
    <View className="flex-1 items-start justify-start gap-4 mt-8 px-4">
      <View className=" items-center flex-row justify-between w-full gap-2">
        <Text className="text-lg font-semibold dark:text-white text-black">
          Clerk ID:
        </Text>
        <Text className="text-base dark:text-white text-black">
          {user?.id || "Loading..."}
        </Text>
      </View>

      <View className="items-center flex-row justify-between w-full gap-2">
        <Text className="text-lg font-semibold dark:text-white text-black">
          Current Role:
        </Text>
        <Text className="text-base dark:text-white text-black">
          {currentRole || "Loading..."}
        </Text>
      </View>

      <View className="items-center flex-row justify-between w-full gap-2">
        <Text className="text-lg font-semibold dark:text-white text-black">
          Email:
        </Text>
        <Text className="text-base dark:text-white text-black">
          {user?.emailAddresses[0]?.emailAddress || "No email found"}
        </Text>
      </View>
      <View className="flex-row justify-between w-full gap-2">
        <Pressable
          onPress={handleCheckRole}
          className="flex-grow bg-blue-500 px-6 py-3 rounded-lg"
        >
          <Text className="text-white text-lg font-semibold">Check Role</Text>
        </Pressable>

        {currentRole === "OWNER" && (
          <Pressable
            onPress={() => {
              router.push("/(extras)/ownedHotels");
            }}
          className="flex-grow bg-blue-500 px-6 py-3 rounded-lg"
        >
          <Text className="text-white text-lg font-semibold">
            Owned Hotels
          </Text>
        </Pressable>
        )}
      </View>
      <NewHotelButton />
    </View>
  );
};

export default Auth;
