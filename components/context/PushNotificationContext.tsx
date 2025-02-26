import React, { createContext, useContext, useEffect, useRef } from "react";
import { Platform, Alert } from "react-native";
import * as Notifications from "expo-notifications";
import { useAuth } from "@clerk/clerk-expo";
import { getHeaders } from "@lib/utils";
import { API_URL } from "@lib/config/index";
import { getUserByClerkId } from "@/lib/api";
import { isDevice } from "expo-device";
import { router } from "expo-router";

const PushNotificationContext = createContext(null);

export const PushNotificationProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const { getToken, userId } = useAuth();
  const notificationListener = useRef<any>();
  const responseListener = useRef<any>();
  const hasRegistered = useRef(false);

  useEffect(() => {
    console.log("Is Device:", isDevice);
    if (!isDevice) {
      return;
    }
  }, []);

  useEffect(() => {
    const register = async () => {
      if (!isDevice) {
        return;
      }
      if (hasRegistered.current || !userId) return;

      console.log(
        "Attempting to register user for push notifications",
        userId?.toString()
      );
      const authToken = await getToken();
      if (!authToken) {
        return;
      }

      const user = await getUserByClerkId(userId?.toString() ?? "", authToken);
      const token = await registerForPushNotificationsAsync();
      console.log("Push token:", token);
      if (token && userId) {
        console.log("Registering push token:", token);
        try {
          const response = await fetch(
            `${API_URL}/api/notifications/register-token`,
            {
              method: "POST",
              headers: getHeaders(authToken),
              body: JSON.stringify({
                userId: user.id,
                pushToken: token,
              }),
            }
          );

          if (!response.ok) {
            console.error(
              "Failed to register push token:",
              response.statusText
            );
          } else {
            hasRegistered.current = true;
            console.log("Push token registered successfully");
          }
        } catch (error) {
          console.error("Error registering push token:", error);
        }
      }
    };

    register();

    notificationListener.current =
      Notifications.addNotificationReceivedListener((notification) => {
        console.log("Notification Received:", notification);
        console.log("Data within it:", notification.request.content.data);
      });

    responseListener.current =
      Notifications.addNotificationResponseReceivedListener((response) => {
        console.log("User interacted with notification:", response);
        const bookingId = response.notification.request.content.data.bookingId;

        if (bookingId) {
          router.push(`/bookings/${bookingId}`);
        } else {
          console.warn("No bookingId found in notification data.");
        }
      });

    return () => {
      Notifications.removeNotificationSubscription(
        notificationListener.current
      );
      Notifications.removeNotificationSubscription(responseListener.current);
    };
  }, [userId]);

  return (
    <PushNotificationContext.Provider value={null}>
      {children}
    </PushNotificationContext.Provider>
  );
};

export const usePushNotifications = () => {
  return useContext(PushNotificationContext);
};

async function registerForPushNotificationsAsync(): Promise<string | null> {
  if (!isDevice) {
    // Alert.alert('Must use a physical device for Push Notifications');
    return null;
  }
  console.log("I am here");
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== "granted") {
    Alert.alert("Failed to get push token for push notification!");
    return null;
  }

  const token = (await Notifications.getExpoPushTokenAsync()).data;
  console.log("I am here2 ");
  console.log("Token:", token);
  if (Platform.OS === "android") {
    Notifications.setNotificationChannelAsync("default", {
      name: "default",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#FF231F7C",
    });
  }

  return token;
}
