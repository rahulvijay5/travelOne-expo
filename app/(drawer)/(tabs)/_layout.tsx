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
        tabBarActiveTintColor: "#84cc16",
        tabBarInactiveTintColor: isDarkColorScheme ? "white" : "black",
        tabBarStyle: {
          backgroundColor: isDarkColorScheme ? "black" : "white",
        },
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
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
            <Feather name="book" size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color }) => (
            <Feather name="user" size={24} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
