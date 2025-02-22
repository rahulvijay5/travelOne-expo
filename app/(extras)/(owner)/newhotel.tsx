import React, { useEffect, useState, useCallback } from "react";
import { View, ScrollView, TextInput, Pressable } from "react-native";
import { Text } from "@/components/ui/text";
import { useAuth, useUser } from "@clerk/clerk-expo";
import { router } from "expo-router";
import { defaultAmenities } from "@/lib/constants";
import { HotelFormData, UserData } from "@/types";
import { Textarea } from "@/components/ui/textarea";
import { useUserStorage } from "@/hooks/useUserStorage";
import CustomImagePicker from "@/components/ImagePicker";
import { uploadImages, createHotel, saveHotelToStorage } from "@lib/api";
import { navigateTo } from "@/lib/actions/navigation";

const NewHotel = () => {
  const { user } = useUser();
  const { getToken } = useAuth();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [userData, setUserData] = useState<UserData | null>(null);
  const { getUserData } = useUserStorage();
  const [showNextButton, setShowNextButton] = useState(false);

  const [formData, setFormData] = useState<HotelFormData>({
    hotelName: "",
    description: "",
    location: "",
    address: "",
    contactNumber: "",
    amenities: [],
    hotelImages: [],
    owner: "",
    customAmenity: "",
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
              contactNumber: data.phone || ""
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

  const handleImagesSelected = useCallback((images: string[]) => {
    setFormData(prev => ({
      ...prev,
      hotelImages: images,
    }));
  }, []);

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
        "contactNumber",
      ] as const;
      const missingFields = requiredFields.filter(field => !formData[field]);

      if (missingFields.length > 0) {
        setError(
          `Please fill in all required fields: ${missingFields.join(", ")}`
        );
        return;
      }

      if (formData.hotelImages.length === 0) {
        setError("Please add at least one hotel image");
        return;
      }

      const token = await getToken();
      if (!token) {
        console.error("No auth token available");
        router.push("/not-authenticated");
        return;
      }

      // First upload the images
      let uploadedImageUrls: string[] = [];
      try {
        uploadedImageUrls = await uploadImages(formData.hotelImages, "HotelImages", token);
      } catch (uploadError) {
        console.error('Error uploading images:', uploadError);
        setError('Failed to upload images. Please try again.');
        return;
      }

      // Create hotel with uploaded image URLs
      const hotelData = {
        hotelName: formData.hotelName,
        description: formData.description,
        location: formData.location,
        address: formData.address,
        contactNumber: formData.contactNumber,
        amenities: formData.amenities,
        hotelImages: uploadedImageUrls,
        owner: user.id,
      };

      const response = await createHotel(hotelData, token);
      if (!response.ok) {
        throw new Error(response.error || "Failed to create hotel");
      }

      // Save hotel data to local storage
      await saveHotelToStorage(response.data);
      
      setStep(2);

      // Navigate to hotel rules page
      setTimeout(() => {
        navigateTo("/hotelrules", { hotelId: response.data.id, createNewHotel: "true" });
        setShowNextButton(true);
      }, 500);
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
        <View className="w-2/3 h-2 bg-gray-200 rounded-full">
          <View className="w-1/3 h-full bg-blue-500 rounded-full" />
          {showNextButton && (
            <Pressable onPress={() => router.push("/hotelrules")} className="bg-blue-500 my-8 w-fit">
              <Text className="text-white">Next Step</Text>
            </Pressable>
          )}
        </View>
      </View>
    );
  }

  return (
    <ScrollView className="flex-1">
      <View className="w-full h-0.5 bg-gray-200 rounded-full">
        <View className="w-1/3 h-full bg-blue-500 rounded-full" />
      </View>
        <CustomImagePicker
          images={formData.hotelImages}
          onImagesSelected={handleImagesSelected}
          maxImages={5}
        />
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
            <Text className="text-base mb-2 dark:text-white">Description *</Text>
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

          <View>
            <Text className="text-base mb-2 dark:text-white">Contact Number *</Text>
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
              {[...defaultAmenities, ...formData.amenities.filter(a => !defaultAmenities.includes(a as any))].map((amenity) => (
                <Pressable
                  key={amenity}
                  onPress={() => handleAmenityToggle(amenity)}
                  className={`px-3 py-2 rounded-lg ${
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
                </Pressable>
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
              onSubmitEditing={() => {
                if (formData.customAmenity?.trim()) {
                  handleAmenityToggle(formData.customAmenity.trim());
                  setFormData(prev => ({ ...prev, customAmenity: "" }));
                }
              }}
            />
            <Pressable 
              onPress={() => {
                if (formData.customAmenity?.trim()) {
                  handleAmenityToggle(formData.customAmenity.trim());
                  setFormData(prev => ({ ...prev, customAmenity: "" }));
                }
              }} 
              className="bg-blue-500 p-3 rounded-lg"
            >
              <Text className="text-white">Add</Text>
            </Pressable>
          </View>

          {error ? <Text className="text-red-500 mt-4">{error}</Text> : null}
          <View className="flex-row gap-2 mt-4">
          {!loading && <Pressable
            onPress={() => router.back()}
            disabled={loading}
            className={` bg-blue-500 rounded-lg p-3 ${loading ? "opacity-50" : ""}`}
          >
            <Text className="text-lg text-white">
              {"Go Back"}
            </Text>
          </Pressable>}
          <Pressable
            onPress={handleSubmit}
            disabled={loading}
            className={` bg-blue-500 rounded-lg p-3 flex-grow ${loading ? "opacity-50" : ""}`}
          >
            <Text className="text-lg text-white text-center">
              {loading ? "Creating..." : "Create Hotel"}
            </Text>
          </Pressable>
          </View>
        </View>

        <View className="h-8" />
      </View>
    </ScrollView>
  );
};

export default NewHotel;
