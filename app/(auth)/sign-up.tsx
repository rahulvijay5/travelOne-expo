import * as React from "react";
import { TextInput, View, Pressable, useColorScheme } from "react-native";
import { Text } from "@/components/ui/text";
import { useSignUp, useSSO, useUser } from "@clerk/clerk-expo";
import { Link, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useCallback, useEffect, useState } from "react";
import { navigateTo } from "@/lib/actions/navigation";
import * as WebBrowser from "expo-web-browser";
import GoogleLogo from "@/components/icons/google";
import Animated, { FadeInDown } from "react-native-reanimated";
import { ThemeToggle } from "@/components/ThemeToggle";

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

export default function SignUpScreen() {
  const { isLoaded, signUp, setActive } = useSignUp();
  const router = useRouter();

  const [emailAddress, setEmailAddress] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [pendingVerification, setPendingVerification] = useState(false);
  const [code, setCode] = useState("");
  const isDarkColorScheme = useColorScheme();
  const [error, setError] = useState("");
  const [tryAgain, setTryAgain] = useState(false);
  const { isSignedIn } = useUser();

  const displayError = (error: string) => {
    setError(error);
    setTimeout(() => {
      setError("");
      setPassword("");
      setConfirmPassword("");
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

  // Handle submission of sign-up form
  const onSignUpPress = async () => {
    if (!isLoaded) return;

    if (password !== confirmPassword) {
      displayError("Passwords do not match");
      return;
    }

    // Start sign-up process using email and password provided
    try {
      await signUp.create({
        emailAddress,
        password,
      });

      // Send user an email with verification code
      await signUp.prepareEmailAddressVerification({ strategy: "email_code" });

      // Set 'pendingVerification' to true to display second form
      // and capture OTP code
      setPendingVerification(true);
    } catch (err: any) {
      displayError(JSON.stringify(err.errors[0].longMessage, null, 2));
    }
  };

  // Handle submission of verification form
  const onVerifyPress = async () => {
    if (!isLoaded) return;

    try {
      // Use the code the user provided to attempt verification
      const signUpAttempt = await signUp.attemptEmailAddressVerification({
        code,
      });

      // If verification was completed, set the session to active
      // and redirect the user
      if (signUpAttempt.status === "complete") {
        await setActive({ session: signUpAttempt.createdSessionId });
        router.replace("/onboarding");
      } else {
        // If the status is not complete, check why. User may need to
        // complete further steps.
        console.error(JSON.stringify(signUpAttempt, null, 2));
      }
    } catch (err: any) {
      // See https://clerk.com/docs/custom-flows/error-handling
      // for more info on error handling
      // console.error(JSON.stringify(err, null, 2));
      displayError(JSON.stringify(err.errors[0].message, null, 2));
    }
  };

  if (pendingVerification) {
    return (
      <View className="flex-1 ">
        <View className=" flex-1 px-6 justify-center">
          {/* Header */}
          <View className="mb-8">
            <Text className="text-3xl font-bold dark:text-white text-black text-center">Verify Your Email</Text>
            <Text className="text-gray-500 dark:text-gray-400 text-center mt-2">
              We've sent a code to your email address
            </Text>
          </View>

          {/* Verification Form */}
          <Animated.View
            entering={FadeInDown.delay(200)}
            className="bg-white shadow dark:bg-gray-800 p-6 gap-4 rounded-2xl space-y-5"
          >
            <View>
              <Text className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Verification Code</Text>
              <TextInput
                value={code}
                placeholder="Enter your verification code"
                onChangeText={(code) => setCode(code)}
                className="dark:text-white text-black p-4 rounded-xl border-2 border-gray-200 dark:border-gray-600 bg-transparent"
                keyboardType="number-pad"
              />
            </View>

            {/* Verify Button */}
            <Pressable className="bg-blue-500 rounded-xl overflow-hidden" onPress={onVerifyPress}>
              <View className="px-6 py-4 flex-row items-center justify-center">
                <Text className="text-white font-semibold text-lg mr-2">Verify</Text>
                <Feather name="check-circle" size={20} color="white" />
              </View>
            </Pressable>
          </Animated.View>
        </View>
      </View>
    )
  }

  return (
    <SafeAreaView className="flex-1">
      <View className="flex-1 px-6 py-8 justify-center">
        {/* Header */}
        <View className="mb-8">
          <Text className="text-3xl font-bold dark:text-white text-black text-center">Create Account</Text>
          <Text className="text-gray-500 dark:text-gray-400 text-center mt-2">Sign up to get started</Text>
        </View>

        {/* Form */}
        <Animated.View
          entering={FadeInDown.delay(200)}
          className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow gap-4 space-y-5"
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
          <View>
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
                  size={18}
                  color={isDarkColorScheme ? "#fff" : "#000"}
                />
              </Pressable>
            </View>
          </View>

          {/* Confirm Password Input */}
          <View>
            <Text className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Confirm Password</Text>
            <View className="relative">
              <TextInput
                value={confirmPassword}
                placeholder="Re-enter password"
                secureTextEntry={!showPassword}
                onChangeText={(password) => setConfirmPassword(password)}
                className="dark:text-white text-black p-4 rounded-xl border-2 border-gray-200 dark:border-gray-600 bg-transparent pr-12"
              />
              <Pressable onPress={() => setShowPassword(!showPassword)} className="absolute right-4 top-4">
                <Feather
                  name={showPassword ? "eye-off" : "eye"}
                  size={18}
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
            <Animated.Text
              entering={FadeInDown}
              className="dark:text-lime-300 text-lime-800 font-extrabold text-center"
            >
              Try again
            </Animated.Text>
          )}

          {/* Sign Up Button */}
          <Pressable className="bg-blue-500 rounded-xl overflow-hidden" onPress={onSignUpPress}>
            <View className="px-6 py-4 flex-row items-center justify-center">
              <Text className="text-white font-semibold text-lg mr-2">Continue</Text>
              <Feather name="arrow-right" size={20} color="white" />
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

        {/* Sign In Link */}
        <View className="flex-row justify-center mt-8">
          <Text className="dark:text-white text-black">Already have an account? </Text>
          <Link href="/(auth)/sign-in">
            <Text className="text-blue-500 font-medium">Sign In</Text>
          </Link>
        </View>
      </View>
    </SafeAreaView>
  )
}
