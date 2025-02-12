import React, { useEffect, useRef } from 'react';
import { Platform, Alert } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Permissions from 'expo-permissions';
import Constants from 'expo-constants';
import { useAuth } from '@clerk/clerk-expo'; // Adjust based on your auth setup
import { getHeaders } from '@lib/utils';
import { API_URL } from '@lib/config/index';
import { getUserByClerkId } from '@/lib/api';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

const PushNotificationHandler = () => {
  const { getToken, userId } = useAuth(); // Adjust based on your auth setup
  const notificationListener = useRef<any>();
  const responseListener = useRef<any>();
  
  useEffect(() => {
    const register = async () => {
        console.log("trying to get user by clerk id", userId?.toString());
        const authToken = await getToken();
        console.log("auth token ", authToken);
        if (!authToken) {
      return null;
    }
      const user = await getUserByClerkId(userId?.toString() ?? '',authToken);
      const token = await registerForPushNotificationsAsync();
      console.log("pushtoken ", token);
      if (token && userId) {


        // Send the token to your backend to associate it with the user
        const response = await fetch(`${API_URL}/api/notifications/register-token`, {
          method: 'POST',
          headers: getHeaders(authToken),
          body: JSON.stringify({
            userId: user.id,
            pushToken: token,
          }),
        });
      }
    };

    register();

    // This listener is fired whenever a notification is received while the app is foregrounded
    notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
      console.log('Notification Received:', notification);
    });

    // This listener is fired whenever a user taps on or interacts with a notification
    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('User interacted with notification:', response);
    });

    return () => {
      Notifications.removeNotificationSubscription(notificationListener.current);
      Notifications.removeNotificationSubscription(responseListener.current);
    };
  }, [userId]);

  return null; // This component doesn't render anything
};

export default PushNotificationHandler;

// Helper function
async function registerForPushNotificationsAsync(): Promise<string | null> {
  if (!Constants.isDevice) {
    Alert.alert('Must use physical device for Push Notifications');
    return null;
  }

  const { status: existingStatus } = await Permissions.getAsync(Permissions.NOTIFICATIONS);
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Permissions.askAsync(Permissions.NOTIFICATIONS);
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    Alert.alert('Failed to get push token for push notification!');
    return null;
  }

  const token = (await Notifications.getExpoPushTokenAsync()).data;

  if (Platform.OS === 'android') {
    Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  return token;
}