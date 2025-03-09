import { useSignIn, useSSO, useUser } from "@clerk/clerk-expo";
import { Link, useRouter } from "expo-router";
import { TextInput, View, SafeAreaView, Pressable, useColorScheme } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
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
    <SafeAreaView className="flex-1">
      <View className="flex-1 px-6 py-8 justify-center">
        {/* Header */}
        <View className="mb-8">
          <Text className="text-3xl font-bold dark:text-white text-black text-center">Welcome Back</Text>
          <Text className="text-gray-500 dark:text-gray-400 text-center mt-2">Sign in to continue to your account</Text>
        </View>

        {/* Form */}
        <Animated.View
          entering={FadeInDown.delay(200)}
          className="bg-white dark:bg-gray-800 p-6 rounded-2xl gap-4 shadow space-y-5"
        >
          {/* Email Input */}
          <View>
            <Text className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Email Address</Text>
            <TextInput
              autoCapitalize="none"
              value={emailAddress}
              placeholder="Enter email"
              onChangeText={(email) => setEmailAddress(email)}
              className="dark:text-white text-black p-4 rounded-xl border-2 border-gray-200 dark:border-gray-600 bg-transparent"
            />
          </View>

          {/* Password Input */}
          <View className="relative">
            <Text className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Password</Text>
            <View className="relative">
              <TextInput
                value={password}
                placeholder="Enter password"
                secureTextEntry={!showPassword}
                onChangeText={(password) => setPassword(password)}
                className="dark:text-white text-black p-4 rounded-xl border-2 border-gray-200 dark:border-gray-600 bg-transparent pr-12"
              />
              <Pressable onPress={() => setShowPassword(!showPassword)} className="absolute right-4 top-4">
                <Feather
                  name={showPassword ? "eye-off" : "eye"}
                  size={20}
                  color={isDarkColorScheme ? "#fff" : "#000"}
                />
              </Pressable>
            </View>
          </View>

          {/* Error Messages */}
          {error && (
            <Animated.Text entering={FadeInDown} className="text-red-500 text-center">
              {error}
            </Animated.Text>
          )}

          {tryAgain && (
            <Animated.Text entering={FadeInDown} className="text-red-500 text-center">
              Try again
            </Animated.Text>
          )}

          {/* Sign In Button */}
          <Pressable className="bg-blue-500 rounded-xl overflow-hidden" onPress={onSignInPress}>
            <View className="px-6 py-4 flex-row items-center justify-center">
              <Text className="text-white font-semibold text-lg mr-2">Sign In</Text>
              <Feather name="log-in" size={20} color="white" />
            </View>
          </Pressable>
        </Animated.View>

        {/* Divider */}
        <View className="flex-row items-center my-8">
          <View className="flex-1 h-[1px] bg-gray-300 dark:bg-gray-700" />
          <Text className="mx-4 text-gray-500 dark:text-gray-400">OR</Text>
          <View className="flex-1 h-[1px] bg-gray-300 dark:bg-gray-700" />
        </View>

        {/* Google Sign In */}
        <Animated.View entering={FadeInDown.delay(400)}>
          <Pressable
            className="bg-white dark:bg-gray-800 border-2 gap-2 border-gray-200 dark:border-gray-700 p-4 rounded-xl flex-row items-center justify-center space-x-3"
            onPress={onPressGoogleSignIn}
          >
            <GoogleLogo />
            <Text className="text-gray-800 dark:text-white font-medium">Sign In with Google</Text>
          </Pressable>
        </Animated.View>

        {/* Sign Up Link */}
        <View className="flex-row justify-center mt-8">
          <Text className="dark:text-white text-black">Don't have an account? </Text>
          <Link href="/(auth)/sign-up">
            <Text className="text-blue-500 font-medium">Sign Up</Text>
          </Link>
        </View>
      </View>
    </SafeAreaView>
  )
}
