import { View } from 'react-native';
import { WebView } from 'react-native-webview';
import { useColorScheme } from '@/lib/useColorScheme';
import { Stack } from 'expo-router';

export default function PrivacyScreen() {
  const { isDarkColorScheme } = useColorScheme();
  const appUrl = process.env.EXPO_PUBLIC_APP_URL;

  return (
    <View className="flex-1">
      <Stack.Screen
        options={{
          title: "Privacy Policy",
          headerStyle: {
            backgroundColor: isDarkColorScheme ? "#000" : "#fff",
          },
          headerTintColor: isDarkColorScheme ? "#fff" : "#000",
        }}
      />
      <WebView 
        source={{ uri: `${appUrl}/privacy-policy` }}
        style={{ flex: 1 }}
        className={isDarkColorScheme ? "bg-black" : "bg-white"}
      />
    </View>
  );
} 