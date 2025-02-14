import { Pressable, View } from "react-native";
import React from "react";
import { Text } from "@/components/ui/text";
import { router } from "expo-router";

const NotAuthenticated = () => {
  return (
    <View className="flex-1 justify-center items-center">
      <Text className="text-center text-2xl font-bold dark:text-white text-black">
        You are not authenticated!!
      </Text>
      <Text className="text-center text-lg mt-4 font-semibold dark:text-white text-black">
        First login to continue
      </Text>
      <Pressable onPress={() => router.push("/(auth)/sign-in")} className="bg-blue-500 mt-4 py-2 px-4 text-center rounded-md">
        <Text className="text-white text-center">Login</Text>
      </Pressable>
    </View>
  );
};

export default NotAuthenticated;