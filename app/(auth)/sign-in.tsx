import { useSignIn } from "@clerk/clerk-expo";
import { Link, useRouter } from "expo-router";
import {
  TextInput,
  Button,
  View,
  SafeAreaView,
  Pressable,
} from "react-native";
import { Text } from "@/components/ui/text";
import React from "react";

export default function Page() {
  const { signIn, setActive, isLoaded } = useSignIn();
  const router = useRouter();

  const [emailAddress, setEmailAddress] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [error, setError] = React.useState("");
  const [tryAgain, setTryAgain] = React.useState(false);
  const displayError = (error: string) => {
    setError(error);
    setTimeout(() => {
      setError("");
      setPassword("");
      setEmailAddress("");
    }, 5000);
  }; 

  const displayTryAgain = () => {
    setTimeout(() => {
      setTryAgain(false);
    }, 5000);
  };

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
        router.replace("/(extras)/onboarding");
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
        <Text className="text-2xl font-semibold dark:text-white text-black">Sign In</Text>
        <TextInput
          autoCapitalize="none"
          value={emailAddress}
          placeholder="Enter email"
          onChangeText={(email) => setEmailAddress(email)}
          className="border border-gray-300 dark:text-white p-4 rounded-md text-black"
        />
        <TextInput
          value={password}
          placeholder="Enter password"
          secureTextEntry={true}
          onChangeText={(password) => setPassword(password)}
          className="border border-gray-300 dark:text-white p-4 rounded-md text-black"
        />
          {error && <Text className="text-red-500 text-center">{error}</Text>}
          {tryAgain && <Text className="text-red-500 text-center">Try again</Text>}
        <Pressable
          className="bg-blue-500 p-2 py-4 text-center rounded-md"
          onPress={onSignInPress}
        >
          <Text className="text-white">Sign In</Text>
        </Pressable>
        <View className="flex-row justify-center gap-2 flex">
          <Text className="dark:text-white text-black">Don't have an account?</Text>
          <Link href="/(auth)/sign-up">
            <Text className="text-blue-500 text-center ">Sign Up</Text>
          </Link>
        </View>
      </View>
    </SafeAreaView>
  );
}
