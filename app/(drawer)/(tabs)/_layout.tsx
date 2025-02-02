import { Tabs } from "expo-router/tabs";
import { MaterialIcons } from "@expo/vector-icons";
import currentUser from "@/hooks/getCurrentUser";
import { useColorScheme } from "@/lib/useColorScheme";
import { ThemeToggle } from "@/components/ThemeToggle";
import { TouchableOpacity, View } from "react-native";
import { Link, router } from "expo-router";
import Feather from "@expo/vector-icons/Feather";
import { Text } from "@/components/ui/text";
import { Button } from "@/components/ui/button";
import { useAuth } from "@clerk/clerk-expo";

export default function TabLayout() {
  const { isDarkColorScheme } = useColorScheme();

  return (
    <Tabs
      screenOptions={{
        headerStyle: {
          backgroundColor: isDarkColorScheme ? "black" : "white",
        },
        headerTitleStyle: {
          color: isDarkColorScheme ? "white" : "black",
        },
        tabBarStyle: {
          backgroundColor: isDarkColorScheme ? "black" : "white",
        },
        tabBarActiveTintColor: "#84cc16",
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          headerShown: false,
          tabBarIcon: ({ color }) => (
            <Feather name="home" size={24} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="bookings"
        options={{
          title: "Bookings",
          tabBarIcon: ({ color }) => (
            <MaterialIcons name="book" size={24} color={color} />
          ),
          headerShown: false,
        }}
      />

      <Tabs.Screen
        name="auth"
        options={{
          title: "Auth",
          tabBarIcon: ({ color }) => (
            <MaterialIcons name="people" size={24} color={color} />
          ),
          headerShown: false,
        }}
      />
    </Tabs>
  );
}
