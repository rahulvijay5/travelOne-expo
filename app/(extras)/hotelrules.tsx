import React, { useState } from "react";
import { View, ScrollView, Switch } from "react-native";
import { Text } from "@/components/ui/text";
import { Button } from "@/components/ui/button";
import { useLocalSearchParams, router } from "expo-router";
import { TextInput } from "react-native";
import { HotelRules } from "@/types";

const HotelRulesPage = () => {
  const { id } = useLocalSearchParams();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [rules, setRules] = useState<HotelRules>({
    petsAllowed: false,
    maxPeopleInOneRoom: "2",
    extraMattressOnAvailability: false,
    parking: true,
    swimmingPool: false,
    swimmingPoolTimings: "6:00 AM - 8:00 PM",
    ownRestaurant: false,
    checkInTime: "12:00 PM",
    checkOutTime: "11:00 AM",
    guestInfoNeeded: true,
    smokingAllowed: false,
    alcoholAllowed: false,
    eventsAllowed: false,
    minimumAgeForCheckIn: "18",
  });

  const handleSubmit = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch("/api/hotels/" + id + "/rules", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...rules,
          maxPeopleInOneRoom: parseInt(rules.maxPeopleInOneRoom),
          minimumAgeForCheckIn: parseInt(rules.minimumAgeForCheckIn),
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update hotel rules");
      }

      // Redirect to room details page
      router.push({
        pathname: "/(extras)/roomdetails",
        params: { id },
      } as any);
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "Failed to update hotel rules"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView className="flex-1">
      <View className="w-full h-0.5 bg-gray-200 rounded-full">
        <View className="w-2/3 h-full bg-blue-500 rounded-full" />
      </View>
      <View className="flex-1 p-4">
        <View className="space-y-6 gap-2">
          <Text className="text-xl mb-4 text-center font-semibold dark:text-white">
            Configure your hotel rules
          </Text>
          <View className="flex-row justify-between items-center">
            <Text className="text-base dark:text-white">Pets Allowed</Text>
            <Switch
              value={rules.petsAllowed}
              onValueChange={(value) =>
                setRules((prev) => ({ ...prev, petsAllowed: value }))
              }
            />
          </View>

          <View className="gap-2 flex-row items-center justify-between">
            <Text className="text-base mb-2 dark:text-white">
              Max People in One Room
            </Text>

            <TextInput
              className="border border-gray-300 dark:border-gray-600 rounded-lg p-2 dark:text-white"
              value={rules.maxPeopleInOneRoom}
              onChangeText={(text) =>
                setRules((prev) => ({
                  ...prev,
                  maxPeopleInOneRoom: text.replace(/[^0-9]/g, ""),
                }))
              }
              keyboardType="numeric"
              placeholder="Enter maximum number of people"
              placeholderTextColor="#666"
            />
          </View>

          <View className="flex-row justify-between items-center">
            <Text className="text-base dark:text-white">
              Extra Mattress Available
            </Text>
            <Switch
              value={rules.extraMattressOnAvailability}
              onValueChange={(value) =>
                setRules((prev) => ({
                  ...prev,
                  extraMattressOnAvailability: value,
                }))
              }
            />
          </View>

          <View className="flex-row justify-between items-center">
            <Text className="text-base dark:text-white">Parking Available</Text>
            <Switch
              value={rules.parking}
              onValueChange={(value) =>
                setRules((prev) => ({ ...prev, parking: value }))
              }
            />
          </View>

          <View>
            <View className="flex-row justify-between items-center mb-2">
              <Text className="text-base dark:text-white">Swimming Pool</Text>
              <Switch
                value={rules.swimmingPool}
                onValueChange={(value) =>
                  setRules((prev) => ({ ...prev, swimmingPool: value }))
                }
              />
            </View>
            {rules.swimmingPool && (
              <TextInput
                className="border border-gray-300 dark:border-gray-600 rounded-lg p-3 dark:text-white"
                value={rules.swimmingPoolTimings}
                onChangeText={(text) =>
                  setRules((prev) => ({ ...prev, swimmingPoolTimings: text }))
                }
                placeholder="Enter pool timings"
                placeholderTextColor="#666"
              />
            )}
          </View>

          <View className="flex-row justify-between items-center">
            <Text className="text-base dark:text-white">
              Restaurant Available
            </Text>
            <Switch
              value={rules.ownRestaurant}
              onValueChange={(value) =>
                setRules((prev) => ({ ...prev, ownRestaurant: value }))
              }
            />
          </View>

          <View>
            <Text className="text-base mb-2 dark:text-white">
              Check-in Time
            </Text>
            <TextInput
              className="border border-gray-300 dark:border-gray-600 rounded-lg p-3 dark:text-white"
              value={rules.checkInTime}
              onChangeText={(text) =>
                setRules((prev) => ({ ...prev, checkInTime: text }))
              }
              placeholder="Enter check-in time (e.g., 12:00 PM)"
              placeholderTextColor="#666"
            />
          </View>

          <View>
            <Text className="text-base mb-2 dark:text-white">
              Check-out Time
            </Text>
            <TextInput
              className="border border-gray-300 dark:border-gray-600 rounded-lg p-3 dark:text-white"
              value={rules.checkOutTime}
              onChangeText={(text) =>
                setRules((prev) => ({ ...prev, checkOutTime: text }))
              }
              placeholder="Enter check-out time (e.g., 11:00 AM)"
              placeholderTextColor="#666"
            />
          </View>

          <View className="flex-row justify-between items-center">
            <Text className="text-base dark:text-white">
              Guest Info Required
            </Text>
            <Switch
              value={rules.guestInfoNeeded}
              onValueChange={(value) =>
                setRules((prev) => ({ ...prev, guestInfoNeeded: value }))
              }
            />
          </View>

          <View className="flex-row justify-between items-center">
            <Text className="text-base dark:text-white">Smoking Allowed</Text>
            <Switch
              value={rules.smokingAllowed}
              onValueChange={(value) =>
                setRules((prev) => ({ ...prev, smokingAllowed: value }))
              }
            />
          </View>

          <View className="flex-row justify-between items-center">
            <Text className="text-base dark:text-white">Alcohol Allowed</Text>
            <Switch
              value={rules.alcoholAllowed}
              onValueChange={(value) =>
                setRules((prev) => ({ ...prev, alcoholAllowed: value }))
              }
            />
          </View>

          <View className="flex-row justify-between items-center">
            <Text className="text-base dark:text-white">Events Allowed</Text>
            <Switch
              value={rules.eventsAllowed}
              onValueChange={(value) =>
                setRules((prev) => ({ ...prev, eventsAllowed: value }))
              }
            />
          </View>

          <View className="gap-2 flex-row items-center justify-between">
            <Text className="text-base mb-2 dark:text-white">
              Minimum Age for Check-in
            </Text>
            <View className="flex-row items-center gap-2">
              <TextInput
                className="border border-gray-300 dark:border-gray-600 rounded-lg p-2 dark:text-white"
                value={rules.minimumAgeForCheckIn}
                onChangeText={(text) =>
                  setRules((prev) => ({
                    ...prev,
                    minimumAgeForCheckIn: text.replace(/[^0-9]/g, ""),
                  }))
                }
                keyboardType="numeric"
                placeholder="Enter minimum age"
                placeholderTextColor="#666"
              />
              <Text className="text-base mb-2 dark:text-white">yrs</Text>
            </View>
          </View>

          {error ? <Text className="text-red-500">{error}</Text> : null}

          <Button
            onPress={handleSubmit}
            disabled={loading}
            className={`mt-6 bg-blue-500 ${loading ? "opacity-50" : ""}`}
          >
            <Text className="text-white text-lg">
              {loading ? "Saving..." : "Continue to Room Details"}
            </Text>
          </Button>
          <Button
            className="bg-blue-500"
            onPress={() =>
              router.push({
                pathname: "/(extras)/roomdetails",
                params: { id },
              } as any)
            }
          >
            <Text className="text-white text-lg">
              {loading ? "Saving..." : "Room Details"}
            </Text>
          </Button>
        </View>

        <View className="h-8" />
      </View>
    </ScrollView>
  );
};

export default HotelRulesPage;
