import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Switch,
} from "react-native";
import React, { useEffect, useState } from "react";
import { useLocalSearchParams, router } from "expo-router";
import { useAuth } from "@clerk/clerk-expo";
import api from "@/lib/api";
import {  HotelRulesChange } from "@/types";
import TimePicker from "@/components/TimePicker";

type HotelRulesPageParams = {
  hotelId: string;
  createNewHotel?: string;
};

export default function HotelRulesPage() {
  const { getToken } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const params = useLocalSearchParams<HotelRulesPageParams>();
  const [hotelId, setHotelId] = useState<string | null>(null);
  const [creatingNewHotel, setCreatingNewHotel] = useState(false);

  useEffect(() => {
    console.log("params in hotelrules", params);
    if (params.hotelId) {
      setHotelId(params.hotelId);
    }
    if (params.createNewHotel === "true") {
      setCreatingNewHotel(true);
    }
  }, [params.hotelId, params.createNewHotel]);

  const [rules, setRules] = useState<HotelRulesChange>({
    petsAllowed: false,
    maxPeopleInOneRoom: 2,
    extraMattressOnAvailability: false,
    parking: true,
    swimmingPool: false,
    swimmingPoolTimings: "6:00 AM - 8:00 PM",
    ownRestaurant: false,
    checkInTime: 660, // 11:00 AM in minutes
    checkOutTime: 600, // 10:00 AM in minutes
    guestInfoNeeded: true,
    smokingAllowed: false,
    alcoholAllowed: false,
    eventsAllowed: false,
    minimumAgeForCheckIn: 18,
  });

  const handleSubmit = async () => {
    try {
      console.log("hotelId in hotelrules", hotelId);
        if(rules.swimmingPool ==false){
          rules.swimmingPoolTimings = ""
      }
      setLoading(true);
      const token = await getToken();
      if (!token || !hotelId) {
        throw new Error("Missing required data");
      }

      console.log("rules before sending to backend", rules);
      await api.updateHotelRules(hotelId as string, rules, token);
      if (creatingNewHotel) {
        router.push({ 
          pathname: "/roomdetails", 
          params: { 
            hotelId,
            createNewHotel: "true"
          } 
        });
      } else {
        router.back(); // Go back to hotel details page after successful update
      }
    } catch (error) {
      console.error("Error updating hotel rules:", error);
      setError("Error updating hotel rules, Try again later.");
      setTimeout(() => {
        setError("");
      }, 4000);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView className="flex-1">
      {creatingNewHotel && (
        <View className="w-full h-0.5 bg-gray-200 rounded-full">
          <View className="w-2/3 h-full bg-blue-500 rounded-full" />
        </View>
      )}

      <View className="flex-1 p-4 gap-2">
        <View className="flex-row justify-between items-center">
          <TimePicker
            value={rules.checkInTime}
            onChange={(time) => setRules((prev) => ({ ...prev, checkInTime: time }))}
            label="Check-in Time"
          />
        </View>

        <View className="flex-row justify-between items-center">
          <TimePicker
            value={rules.checkOutTime}
            onChange={(time) => setRules((prev) => ({ ...prev, checkOutTime: time }))}
            label="Check-out Time"
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

        <View className="flex-row justify-between border-y-2 border-gray-100 py-2 items-center">
          <View className="flex-col gap-1">
          <Text className="text-lg dark:text-white text-black">
            Guest Documents Required
          </Text>
          <Text className="text-xs dark:text-white text-black">
            Like aadhar card, pan card, driving license, or something?
          </Text>
          </View>
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
        {error && <Text className="text-sm text-center dark:text-orange-200 bg-red-500 text-white p-2 rounded-lg">{error}</Text>}
        <View className="flex-row gap-2 my-4 ">
          {!creatingNewHotel && (
            <TouchableOpacity
              className="bg-blue-500 p-3 rounded-lg text-center"
              onPress={() => router.back()}
              disabled={loading}
        >
          <Text className="text-white text-center">
            {"Go Back"}
          </Text>
        </TouchableOpacity>
        )}
        <TouchableOpacity
          className="bg-blue-500 p-3 flex-grow rounded-lg text-center"
          onPress={handleSubmit}
          disabled={loading}
        >
          <Text className="text-white text-center">
            {loading ? "Updating..." : "Update Rules"}
          </Text>
        </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}
