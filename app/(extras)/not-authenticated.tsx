import { View } from "react-native";
import React from "react";
import { Text } from "@/components/ui/text";
import { Button } from "@/components/ui/button";
import { router } from "expo-router";
const NotAuthenticated = () => {
  return (
    <View className="flex-1 justify-center items-center">
      <Text className="text-center text-2xl font-bold dark:text-white text-black">
        You are not authenticated!!
      </Text>
      <Button onPress={() => router.push("/(auth)/sign-in")} className="bg-blue-500">
        <Text>Login</Text>
      </Button>
    </View>
  );
};

export default NotAuthenticated;
