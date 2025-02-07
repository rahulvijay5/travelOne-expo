import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Switch,
} from "react-native";
import React, { useState } from "react";
import { useLocalSearchParams, router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "@clerk/clerk-expo";
import api from "@/lib/api";
import { HotelRules, HotelRulesChange } from "@/types";
import { Separator } from "@/components/ui/separator";

export default function HotelRulesPage({
  creatingNewHotel = false,
}: {
  creatingNewHotel: boolean;
}) {
  const { hotelId } = useLocalSearchParams();
  const { getToken } = useAuth();
  const [loading, setLoading] = useState(false);

  const [rules, setRules] = useState<HotelRulesChange>({
    petsAllowed: false,
    maxPeopleInOneRoom: 2,
    extraMattressOnAvailability: false,
    parking: true,
    swimmingPool: false,
    swimmingPoolTimings: "6:00 AM - 8:00 PM",
    ownRestaurant: false,
    checkInTime: "14:00",
    checkOutTime: "11:00",
    guestInfoNeeded: true,
    smokingAllowed: false,
    alcoholAllowed: false,
    eventsAllowed: false,
    minimumAgeForCheckIn: 18,
  });

  const handleSubmit = async () => {
    try {
      setLoading(true);
      const token = await getToken();
      if (!token || !hotelId) {
        throw new Error("Missing required data");
      }

      await api.updateHotelRules(hotelId as string, rules, token);
      if (creatingNewHotel) {
        router.push({ pathname: "/roomdetails", params: { id: hotelId } });
      } else {
        router.back(); // Go back to hotel details page after successful update
      }
    } catch (error) {
      console.error("Error updating hotel rules:", error);
      // Here you might want to show an error message to the user
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView className="flex-1">
      <View className="w-full h-0.5 bg-gray-200 rounded-full">
        <View className="w-2/3 h-full bg-blue-500 rounded-full" />
      </View>

      <View className="flex-1 p-4 gap-2">
        <View className="flex-row justify-between items-center">
          <Text className="text-lg dark:text-white text-black">
            Check-in Time
          </Text>
          <TextInput
            className="border-2 border-gray-300 dark:text-white text-black rounded-lg p-2"
            value={rules.checkInTime}
            onChangeText={(text) =>
              setRules((prev) => ({ ...prev, checkInTime: text }))
            }
            placeholder="11:00"
          />
        </View>

        <View className="flex-row justify-between items-center">
          <Text className="text-lg dark:text-white text-black">
            Check-out Time
          </Text>
          <TextInput
            className="border-2 border-gray-300 dark:text-white text-black rounded-lg p-2"
            value={rules.checkOutTime}
            onChangeText={(text) =>
              setRules((prev) => ({ ...prev, checkOutTime: text }))
            }
            placeholder="10:00"
          />
        </View>

        <View className="h-0.5 bg-gray-200 my-1 rounded-full" />

        <View className="flex-row justify-between items-center">
          <Text className="text-lg dark:text-white text-black">
            Maximum People per Room
          </Text>
          <TextInput
            className="border-2 border-gray-300 dark:text-white text-black rounded-lg p-2"
            value={rules.maxPeopleInOneRoom.toString()}
            onChangeText={(text) =>
              setRules((prev) => ({
                ...prev,
                maxPeopleInOneRoom: parseInt(text) || 2,
              }))
            }
            keyboardType="numeric"
            placeholder="2"
          />
        </View>

        <View className="flex-row justify-between items-center">
          <Text className="text-lg dark:text-white text-black">
            Minimum Age for Check-in
          </Text>
          <TextInput
            className="border-2 border-gray-300 dark:text-white text-black rounded-lg py-2 px-4"
            value={rules.minimumAgeForCheckIn.toString()}
            onChangeText={(text) =>
              setRules((prev) => ({
                ...prev,
                minimumAgeForCheckIn: parseInt(text) || 18,
              }))
            }
            keyboardType="numeric"
            placeholder="18"
          />
        </View>

        <View className="h-0.5 bg-gray-200 my-1 rounded-full" />

        <View className="flex-row justify-between items-center">
          <Text className="text-lg dark:text-white text-black">
            Pets Allowed
          </Text>
          <Switch
            value={rules.petsAllowed}
            onValueChange={(value) =>
              setRules((prev) => ({ ...prev, petsAllowed: value }))
            }
          />
        </View>

        <View className="flex-row justify-between items-center">
          <Text className="text-lg dark:text-white text-black">
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
          <Text className="text-lg dark:text-white text-black">
            Parking Available
          </Text>
          <Switch
            value={rules.parking}
            onValueChange={(value) =>
              setRules((prev) => ({ ...prev, parking: value }))
            }
          />
        </View>

        <View className="flex-row justify-between items-center">
          <Text className="text-lg dark:text-white text-black">
            Swimming Pool
          </Text>
          <Switch
            value={rules.swimmingPool}
            onValueChange={(value) =>
              setRules((prev) => ({ ...prev, swimmingPool: value }))
            }
          />
        </View>

        {rules.swimmingPool && (
          <View className="flex-row justify-between items-center">
            <Text className="text-lg dark:text-white text-black">
              Pool Timings
            </Text>
            <TextInput
              className="border-2 border-gray-300 rounded-lg p-2"
              value={rules.swimmingPoolTimings}
              onChangeText={(text) =>
                setRules((prev) => ({ ...prev, swimmingPoolTimings: text }))
              }
              placeholder="6:00 AM - 8:00 PM"
            />
          </View>
        )}

        <View className="flex-row justify-between items-center">
          <Text className="text-lg dark:text-white text-black">
            Restaurant Available
          </Text>
          <Switch
            value={rules.ownRestaurant}
            onValueChange={(value) =>
              setRules((prev) => ({ ...prev, ownRestaurant: value }))
            }
          />
        </View>

        <View className="flex-row justify-between items-center">
          <Text className="text-lg dark:text-white text-black">
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
          <Text className="text-lg dark:text-white text-black">
            Smoking Allowed
          </Text>
          <Switch
            value={rules.smokingAllowed}
            onValueChange={(value) =>
              setRules((prev) => ({ ...prev, smokingAllowed: value }))
            }
          />
        </View>

        <View className="flex-row justify-between items-center">
          <Text className="text-lg dark:text-white text-black">
            Alcohol Allowed
          </Text>
          <Switch
            value={rules.alcoholAllowed}
            onValueChange={(value) =>
              setRules((prev) => ({ ...prev, alcoholAllowed: value }))
            }
          />
        </View>

        <View className="flex-row justify-between items-center">
          <Text className="text-lg dark:text-white text-black">
            Events Allowed
          </Text>
          <Switch
            value={rules.eventsAllowed}
            onValueChange={(value) =>
              setRules((prev) => ({ ...prev, eventsAllowed: value }))
            }
          />
        </View>

        <Text className="text-xs text-center dark:text-orange-200 text-orange-700">Hotel Rules will be applied to New Hotel Bookings Only</Text>

        <TouchableOpacity
          className="bg-blue-500 p-3 my-4 rounded-lg text-center"
          onPress={handleSubmit}
          disabled={loading}
        >
          <Text className="text-white text-center">
            {loading ? "Updating..." : "Update Rules"}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
