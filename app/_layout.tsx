import "../global.css";
import "@/lib/config";
import { tokenCache } from "@/cache";
import { ClerkProvider, ClerkLoaded } from "@clerk/clerk-expo";
import { Image } from "react-native";

import {
  DarkTheme,
  DefaultTheme,
  NavigationContainer,
  Theme,
  ThemeProvider,
} from "@react-navigation/native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import * as React from "react";
import { Platform } from "react-native";
import { NAV_THEME } from "@/lib/constants";
import { useColorScheme } from "@/lib/useColorScheme";
import { PortalHost } from "@rn-primitives/portal";
import { setAndroidNavigationBar } from "@/lib/android-navigation-bar";
import { PushNotificationProvider } from "@/components/context/PushNotificationContext";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { Toaster } from "react-native-customizable-toast";

const LIGHT_THEME: Theme = {
  ...DefaultTheme,
  colors: NAV_THEME.light,
};
const DARK_THEME: Theme = {
  ...DarkTheme,
  colors: NAV_THEME.dark,
};

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from "expo-router";

export default function RootLayout() {
  const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY!;

  if (!publishableKey) {
    throw new Error("Add EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY in your .env");
  }

  const hasMounted = React.useRef(false);
  const { colorScheme, isDarkColorScheme } = useColorScheme();
  const [isColorSchemeLoaded, setIsColorSchemeLoaded] = React.useState(false);

  useIsomorphicLayoutEffect(() => {
    if (hasMounted.current) {
      return;
    }

    if (Platform.OS === "web") {
      // Adds the background color to the html element to prevent white background on overscroll.
      document.documentElement.classList.add("bg-background");
    }
    setAndroidNavigationBar(colorScheme);
    setIsColorSchemeLoaded(true);
    hasMounted.current = true;
  }, []);

  if (!isColorSchemeLoaded) {
    return null;
  }

  return (
    <ClerkProvider tokenCache={tokenCache} publishableKey={publishableKey}>
      <ClerkLoaded>
        <GestureHandlerRootView style={{ flex: 1 }}>
          <PushNotificationProvider >
            <ThemeProvider value={isDarkColorScheme ? DARK_THEME : LIGHT_THEME}>

              <Stack>
                <Stack.Screen
                  name="(drawer)"
                  options={{
                    // headerShown: true,
                    headerShown: false,
                  }}
                />
                <Stack.Screen
                  name="(extras)"
                  options={{
                    headerShown: false,
                    headerBackButtonDisplayMode: "minimal",
                    headerStyle: {
                      backgroundColor: isDarkColorScheme ? "black" : "white",
                    },
                    headerTitle(props) {
                      return (
                        <Image
                          source={require("@/assets/images/icon.png")}
                          className="h-24 w-24 aspect-video"
                        />
                      );
                    },
                    headerTitleStyle: { color: "#A9A9A9" },
                    headerShadowVisible: false,
                  }}
                />
                <Stack.Screen name="(auth)" options={{ headerShown: false }} />
              </Stack>
              <PortalHost />
            </ThemeProvider>
            <StatusBar style={isDarkColorScheme ? "light" : "dark"} />
          </PushNotificationProvider>
        </GestureHandlerRootView>
      </ClerkLoaded>
    </ClerkProvider>
  );
}

const useIsomorphicLayoutEffect =
  Platform.OS === "web" && typeof window === "undefined"
    ? React.useEffect
    : React.useLayoutEffect;