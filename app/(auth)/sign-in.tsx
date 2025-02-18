import { useSignIn, useSSO, useUser } from "@clerk/clerk-expo";
import { Link, useRouter } from "expo-router";
import { TextInput, Button, View, SafeAreaView, Pressable, useColorScheme } from "react-native";
import { Text } from "@/components/ui/text";
import React, { useCallback, useEffect } from "react";
import * as WebBrowser from "expo-web-browser";
import GoogleLogo from "@/components/icons/google";
import { Feather } from "@expo/vector-icons";

export const useWarmUpBrowser = () => {
  useEffect(() => {
    // Preloads the browser for Android devices to reduce authentication load time
    // See: https://docs.expo.dev/guides/authentication/#improving-user-experience
    void WebBrowser.warmUpAsync();
    return () => {
      // Cleanup: closes browser when component unmounts
      void WebBrowser.coolDownAsync();
    };
  }, []);
};

// Handle any pending authentication sessions
WebBrowser.maybeCompleteAuthSession();

export default function Page() {
  const { signIn, setActive, isLoaded } = useSignIn();
  const router = useRouter();
  const { isSignedIn } = useUser();
  const isDarkColorScheme = useColorScheme();

  const [emailAddress, setEmailAddress] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [showPassword, setShowPassword] = React.useState(false);
  const [error, setError] = React.useState("");
  const [tryAgain, setTryAgain] = React.useState(false);

  const displayError = (error: string) => {
    setError(error);
    setTimeout(() => {
      setError("");
      setPassword("");
    }, 3000);
  };

  const displayTryAgain = () => {
    setTimeout(() => {
      setTryAgain(false);
    }, 5000);
  };

  useWarmUpBrowser();

  // Use the `useSSO()` hook to access the `startSSOFlow()` method
  const { startSSOFlow } = useSSO();

  const onPressGoogleSignIn = useCallback(async () => {
    try {
      // Start the authentication process by calling `startSSOFlow()`
      const { createdSessionId, setActive, signIn, signUp } =
        await startSSOFlow({
          strategy: "oauth_google",
        });

      // If sign in was successful, set the active session
      if (createdSessionId) {
        setActive!({ session: createdSessionId });
      } else {
        // If there is no `createdSessionId`,
        // there are missing requirements, such as MFA
        // Use the `signIn` or `signUp` returned from `startSSOFlow`
        // to handle next steps
      }
    } catch (err) {
      // See https://clerk.com/docs/custom-flows/error-handling
      // for more info on error handling
      console.error(JSON.stringify(err, null, 2));
    }
  }, []);

  useEffect(() => {
    if (isSignedIn) {
      router.replace("/onboarding");
    }
  }, [isSignedIn]);

  // Handle the submission of the sign-in form
  const onSignInPress = React.useCallback(async () => {
    if (!isLoaded) return;

    // Start the sign-in process using the email and password provided
    try {
      const signInAttempt = await signIn.create({
        identifier: emailAddress,
        password,
      });

      // If sign-in process is complete, set the created session as active
      // and redirect the user
      if (signInAttempt.status === "complete") {
        await setActive({ session: signInAttempt.createdSessionId });
        router.replace("/onboarding");
      } else {
        // If the status isn't complete, check why. User might need to
        // complete further steps.
        console.error(JSON.stringify(signInAttempt, null, 2));
      }
    } catch (err: any) {
      // See https://clerk.com/docs/custom-flows/error-handling
      // for more info on error handling
      // console.error(JSON.stringify(err, null, 2));
      displayError(JSON.stringify(err.errors[0].message, null, 2));
    }
  }, [isLoaded, emailAddress, password]);

  return (
    <SafeAreaView className="flex-1 ">
      <View className="flex-1 gap-2 p-4 ">
        <Text className="text-2xl font-semibold dark:text-white text-black">
          Sign In
        </Text>
        <TextInput
          autoCapitalize="none"
          value={emailAddress}
          placeholder="Enter email"
          onChangeText={(email) => setEmailAddress(email)}
          className="border border-gray-300 dark:text-white p-4 rounded-md text-black"
        />
        <View className="relative">
          <TextInput
            value={password}
            placeholder="Enter password"
            secureTextEntry={!showPassword}
            onChangeText={(password) => setPassword(password)}
            className="border border-gray-300 dark:text-white p-4 rounded-md text-black pr-12"
          />
          <Pressable
            onPress={() => setShowPassword(!showPassword)}
            className="absolute right-4 top-4"
          >
            <Feather
              name={showPassword ? "eye-off" : "eye"}
              size={20}
              color={!isDarkColorScheme ? "#fff" : "#000"}
            />
          </Pressable>
        </View>
        {error && <Text className="text-red-500 text-center">{error}</Text>}
        {tryAgain && (
          <Text className="text-red-500 text-center">Try again</Text>
        )}
        <Pressable
          className="bg-blue-500 p-2 py-4 text-center rounded-md"
          onPress={onSignInPress}
        >
          <Text className="text-white text-center">Sign In</Text>
        </Pressable>
        <Text className="text-center text-black dark:text-white my-4">
          --- OR ---
        </Text>
        <Pressable
          className="border border-blue-500 p-2 py-4 text-center rounded-md"
          onPress={onPressGoogleSignIn}
        >
          <View className="flex-row items-center justify-center gap-2">
            <GoogleLogo />
            <Text className="text-blue-500 text-center">Sign In with Google</Text>
          </View>
        </Pressable>
        <View className="flex-row justify-center gap-2 flex">
          <Text className="dark:text-white text-black">
            Don't have an account?
          </Text>
          <Link href="/(auth)/sign-up">
            <Text className="text-blue-500 text-center ">Sign Up</Text>
          </Link>
        </View>
      </View>
    </SafeAreaView>
  );
}
