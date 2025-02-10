import { View } from 'react-native';
import { WebView } from 'react-native-webview';
import { useColorScheme } from '@/lib/useColorScheme';
import { Stack } from 'expo-router';
import { APP_URL } from '@/lib/config/index';

export default function PrivacyScreen() {
  const { isDarkColorScheme } = useColorScheme();

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
        source={{ uri: `${APP_URL}/privacy-policy` }}
        style={{ flex: 1 }}
        className={isDarkColorScheme ? "bg-black" : "bg-white"}
      />
    </View>
  );
} 