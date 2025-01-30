import React, { useEffect, useState, useCallback } from "react";
import { View, ScrollView, TextInput, TouchableOpacity } from "react-native";
import { Text } from "@/components/ui/text";
import { Button } from "@/components/ui/button";
import { useAuth, useUser } from "@clerk/clerk-expo";
import { router } from "expo-router";
import api from "@/lib/api";
import { defaultAmenities } from "@/lib/constants";
import { HotelFormData, UserData } from "@/types";
import { Textarea } from "@/components/ui/textarea";
import { useUserStorage } from "@/hooks/useUserStorage";

const NewHotel = () => {
  const { user } = useUser();
  const { getToken } = useAuth();

  const [step, setStep] = useState(1); // 1: Hotel Details, 2: Success, redirecting to rules
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [userData, setUserData] = useState<UserData | null>(null);
  const { getUserData } = useUserStorage();

  const [formData, setFormData] = useState<HotelFormData>({
    hotelName: "",
    description: "",
    location: "",
    address: "",
    totalRooms: 0,
    contactNumber: "",
    amenities: [],
    customAmenity: "",
    hotelImages: [],
    owner: "",
    managers: [],
    rooms: [],
    bookings: [],
  });

  // Fetch user data only once when component mounts
  useEffect(() => {
    let mounted = true;
    const fetchUserData = async () => {
      try {
        const data = await getUserData();
        if (mounted) {
          setUserData(data);
          if (data?.phone) {
            setFormData(prev => ({
              ...prev,
              contactNumber: data.phone
            }));
          }
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
    };

    fetchUserData();
    return () => {
      mounted = false;
    };
  }, []);

  const handleAmenityToggle = useCallback((amenity: string) => {
    setFormData(prev => ({
      ...prev,
      amenities: prev.amenities.includes(amenity)
        ? prev.amenities.filter(a => a !== amenity)
        : [...prev.amenities, amenity],
    }));
  }, []);

  const addCustomAmenity = useCallback(() => {
    if (formData.customAmenity.trim()) {
      setFormData(prev => ({
        ...prev,
        amenities: [...prev.amenities, prev.customAmenity.trim()],
        customAmenity: "",
      }));
    }
  }, [formData.customAmenity]);

  const handleSubmit = async () => {
    try {
      setLoading(true);
      setError("");
      
      if (user?.publicMetadata.role !== "OWNER") {
        router.push("/not-authorized");
        return;
      }

      if (!user?.id) {
        router.push("/not-authenticated");
        return;
      }

      const requiredFields = [
        "hotelName",
        "description",
        "location",
        "address",
        "totalRooms",
        "contactNumber",
      ] as const;
      const missingFields = requiredFields.filter(field => !formData[field]);

      if (missingFields.length > 0) {
        setError(
          `Please fill in all required fields: ${missingFields.join(", ")}`
        );
        return;
      }

      const token = await getToken();
      if (!token) {
        console.error("No auth token available");
        router.push("/(extras)/not-authenticated");
        return;
      }

      const response = await api.createHotel(formData, token);

      if (!response.ok) {
        throw new Error("Failed to create hotel");
      }

      const data = await response.json();
      setStep(2);

      setTimeout(() => {
        router.push({
          pathname: "/(extras)/hotelrules",
          params: { id: data.id },
        } as any);
      }, 2000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to create hotel");
    } finally {
      setLoading(false);
    }
  };

  if (step === 2) {
    return (
      <View className="flex-1 items-center justify-center p-4">
        <Text className="text-xl font-bold mb-4 dark:text-white">
          Hotel Created Successfully!
        </Text>
        <Text className="text-base mb-4 dark:text-white">
          Redirecting to hotel rules setup...
        </Text>
      </View>
    );
  }

  return (
    <ScrollView className="flex-1">
      <View className="w-full h-0.5 bg-gray-200 rounded-full">
        <View className="w-1/3 h-full bg-blue-500 rounded-full" />
      </View>
      <View className="flex-1 p-4">
        <View className="space-y-4 gap-3">
          <View>
            <Text className="text-base mb-2 dark:text-white">Hotel Name *</Text>
            <TextInput
              className="border border-gray-300 dark:border-gray-600 rounded-lg p-3 dark:text-white"
              value={formData.hotelName}
              onChangeText={(text) =>
                setFormData((prev) => ({ ...prev, hotelName: text }))
              }
              placeholder="Enter hotel name"
              placeholderTextColor="#666"
            />
          </View>

          <View>
            <Text className="text-base mb-2 dark:text-white">
              Description *
            </Text>
            <Textarea
              className="border border-gray-300 dark:border-gray-600 min-h-32 max-h-64 rounded-lg p-3 dark:text-white"
              value={formData.description}
              onChangeText={(text) =>
                setFormData((prev) => ({ ...prev, description: text }))
              }
              placeholder="Enter hotel description"
              placeholderTextColor="#666"
              multiline
              numberOfLines={4}
            />
          </View>

          <View>
            <Text className="text-base mb-2 dark:text-white">Location *</Text>
            <TextInput
              className="border border-gray-300 dark:border-gray-600 rounded-lg p-3 dark:text-white"
              value={formData.location}
              onChangeText={(text) =>
                setFormData((prev) => ({ ...prev, location: text }))
              }
              placeholder="Enter hotel location (maps link)"
              placeholderTextColor="#666"
            />
          </View>

          <View>
            <Text className="text-base mb-2 dark:text-white">Address *</Text>
            <Textarea
              className="border border-gray-300 dark:border-gray-600 min-h-20 max-h-40 rounded-lg p-3 dark:text-white"
              value={formData.address}
              onChangeText={(text) =>
                setFormData((prev) => ({ ...prev, address: text }))
              }
              placeholder="Enter complete address"
              placeholderTextColor="#666"
              multiline
              numberOfLines={3}
            />
          </View>

          <View className="flex-row items-center gap-2 justify-between">
            <Text className="text-base mb-2 dark:text-white">
              Total Rooms *
            </Text>
            <TextInput
              className="border border-gray-300 dark:border-gray-600 rounded-lg p-3 dark:text-white"
              value={formData.totalRooms.toString()}
              onChangeText={(text) =>
                setFormData((prev) => ({
                  ...prev,
                  totalRooms: parseInt(text.replace(/[^0-9]/g, "")),
                }))
              }
              placeholder="Enter total number of rooms"
              placeholderTextColor="#666"
              keyboardType="numeric"
            />
          </View>

          <View>
            <Text className="text-base mb-2 dark:text-white">
              Contact Number *
            </Text>
            <TextInput
              className="border border-gray-300 dark:border-gray-600 rounded-lg p-3 dark:text-white"
              value={formData.contactNumber}
              onChangeText={(text) =>
                setFormData((prev) => ({ ...prev, contactNumber: text }))
              }
              placeholder={`${userData?.phone}`}
              placeholderTextColor="#666"
              keyboardType="phone-pad"
            />
          </View>

          <View>
            <Text className="text-base mb-2 dark:text-white">Amenities</Text>
            <View className="flex-row flex-wrap gap-2">
              {defaultAmenities.map((amenity) => (
                <Button
                  key={amenity}
                  onPress={() => handleAmenityToggle(amenity)}
                  className={`px-3 py-2 ${
                    formData.amenities.includes(amenity)
                      ? "bg-blue-500"
                      : "bg-gray-200 dark:bg-gray-700"
                  }`}
                >
                  <Text
                    className={
                      formData.amenities.includes(amenity)
                        ? "text-white"
                        : "dark:text-white"
                    }
                  >
                    {amenity}
                  </Text>
                </Button>
              ))}
            </View>
          </View>

          <View className="flex-row items-center gap-2 mt-3">
            <TextInput
              className="flex-1 border border-gray-300 dark:border-gray-600 rounded-lg p-3 dark:text-white"
              value={formData.customAmenity}
              onChangeText={(text) =>
                setFormData((prev) => ({ ...prev, customAmenity: text }))
              }
              placeholder="Add custom amenity"
              placeholderTextColor="#666"
            />
            <Button onPress={addCustomAmenity} className="bg-blue-500 p-3">
              <Text className="text-white">Add</Text>
            </Button>
          </View>

          {error ? <Text className="text-red-500 mt-4">{error}</Text> : null}

          <Button
            onPress={handleSubmit}
            disabled={loading}
            className={`mt-6 bg-blue-500 ${loading ? "opacity-50" : ""}`}
          >
            <Text className="text-lg text-white">
              {loading ? "Creating..." : "Create Hotel"}
            </Text>
          </Button>
          <Button
            onPress={() => router.push("/(extras)/hotelrules")}
            disabled={loading}
            className={` bg-blue-500 ${loading ? "opacity-50" : ""}`}
          >
            <Text className="text-lg text-white">
              {loading ? "Creating..." : "HotelRules"}
            </Text>
          </Button>
        </View>

        <View className="h-8" />
      </View>
    </ScrollView>
  );
};

export default NewHotel;
