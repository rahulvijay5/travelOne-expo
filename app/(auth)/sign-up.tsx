import * as React from "react";
import { TextInput, View, Pressable, useColorScheme } from "react-native";
import { Text } from "@/components/ui/text";
import { useSignUp } from "@clerk/clerk-expo";
import { Link, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button } from "@/components/ui/button";
import { Feather } from "@expo/vector-icons";
import { useState } from "react";
import { navigateTo } from "@/lib/actions/navigation";


export default function SignUpScreen() {
  const { isLoaded, signUp, setActive } = useSignUp();
  const router = useRouter();

  const [emailAddress, setEmailAddress] = useState("");
  const [password, setPassword] = useState("");
  const [pendingVerification, setPendingVerification] = useState(false);
  const [code, setCode] = useState("");
  const isDarkColorScheme  = useColorScheme();
  const [error, setError] = useState("");
  const [tryAgain, setTryAgain] = useState(false);
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



  // Handle submission of sign-up form
  const onSignUpPress = async () => {
    if (!isLoaded) return;

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
      // See https://clerk.com/docs/custom-flows/error-handling
      // for more info on error handling
      // console.error(JSON.stringify(err, null, 2));
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
    } catch (err:any) {
      // See https://clerk.com/docs/custom-flows/error-handling
      // for more info on error handling
      // console.error(JSON.stringify(err, null, 2));
      displayError(JSON.stringify(err.errors[0].message, null, 2));
    }
  };

  if (pendingVerification) {
    return (
      <SafeAreaView className="flex-1 p-4 gap-2">
        <Text className="dark:text-white text-black text-2xl font-semibold">Verify your email</Text>
        <TextInput
          value={code}
          placeholder="Enter your verification code"
          onChangeText={(code) => setCode(code)}
          className="border border-gray-300 p-4 rounded-md dark:text-white text-black"
        />
        <Pressable
          className="bg-blue-500 p-4 rounded-md"
          onPress={onVerifyPress}
        >
          <Text className="text-white">Verify</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 p-4">
      <View className="flex-1 gap-2">
        <Text className="text-2xl font-semibold dark:text-white text-black">Sign up</Text>
        <TextInput
          autoCapitalize="none"
          value={emailAddress}
          placeholder="Enter email"
          onChangeText={(email) => setEmailAddress(email)}
          className="border border-gray-300 p-4 rounded-md dark:text-white text-black"
        />
        <TextInput
          value={password}
          placeholder="Enter password"
          secureTextEntry={true}
          onChangeText={(password) => setPassword(password)}
          className="border border-gray-300 p-4 rounded-md dark:text-white text-black"
        />
        {error && <Text className="text-red-500 text-center">{error}</Text>}
        {tryAgain && <Text className="dark:text-lime-300 text-lime-800 font-extrabold text-center">Try again</Text>}
        <View className="flex-row items-center justify-center gap-1 mt-2">
          <Feather name="info" size={14} color={isDarkColorScheme ? "#fff" : "#000"} />
          <Text className="text-sm text-center dark:text-white text-black">
            By signing up, you agree to our{" "}
            <Text 
              className="text-lime-600 dark:text-lime-500"
              onPress={() => navigateTo("/terms")}
            >
              Terms & Conditions
            </Text>
            {" "}and{" "}
            <Text 
              className="text-lime-600 dark:text-lime-500"
              onPress={() => navigateTo("/privacy")}
            >
              Privacy Policy
            </Text>
          </Text>
        </View>
        
        <Pressable
          className="bg-blue-500 p-4 py-4 text-center rounded-md"
          onPress={onSignUpPress}
        >
          <Text className="text-white dark:text-white font-semibold text-lg">Continue</Text>
        </Pressable>
        <View className="flex-row justify-center gap-2 flex">
          <Text className="dark:text-white text-black">Already have an account?</Text>
          <Link href="/(auth)/sign-in">
            <Text className="text-blue-500 text-center">Sign In</Text>
          </Link>
        </View>
      </View>
    </SafeAreaView>
  );
}
