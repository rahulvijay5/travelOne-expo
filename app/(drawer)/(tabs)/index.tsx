import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, Dimensions, Pressable } from 'react-native';
import { useColorScheme } from '@/lib/useColorScheme';
import Feather from '@expo/vector-icons/Feather';
import { useUserStorage } from '@/hooks/useUserStorage';
import { router } from 'expo-router';
import { Button } from '@/components/ui/button';

const { width } = Dimensions.get('window');

export default function HomeScreen() {
  const [currentHotel, setCurrentHotel] = useState<any>(null);
  const { isDarkColorScheme } = useColorScheme();
  const { getUserData } = useUserStorage();

  useEffect(() => {
    loadCurrentHotel();
  }, []);

  const loadCurrentHotel = async () => {
    const userData = await getUserData();
    const hasOnboardingCompleted = userData?.isOnboarded;
    if (!hasOnboardingCompleted) {
      router.push('/onboarding');
      return;
    }
    
    if (userData?.currentStay) {
      try {
        const hotelData = JSON.parse(userData.currentStay);
        setCurrentHotel(hotelData);
      } catch (error) {
        console.error('Error parsing hotel data:', error);
      }
    }
  };

  if (!currentHotel) {
    return (
      <View className="flex-1 items-center justify-center p-4">
        <Text className="text-xl text-center dark:text-white text-black mb-4">
          No active hotel stay found
        </Text>
        <Button onPress={() => router.push('/scanqr')} className="bg-lime-500 p-4 rounded-lg">
          <Text className="text-lg font-bold">Scan Hotel QR Code</Text>
        </Button>
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-white dark:bg-black">
      {/* Hero Section */}
      <View className="relative">
        <Image
          source={{ uri: currentHotel.hotelImages[0] }}
          style={{ width, height: width * 0.7 }}
          className="bg-gray-200"
        />
        <View className="absolute bottom-0 left-0 right-0 p-4 bg-black/50">
          <Text className="text-2xl font-bold text-white">
            {currentHotel.hotelName}
          </Text>
          <Text className="text-white mt-1">
            {currentHotel.location}
          </Text>
        </View>
      </View>

      {/* Hotel Details */}
      <View className="p-4 space-y-6">
        {/* Description */}
        <View>
          <Text className="text-lg font-bold mb-2 dark:text-white text-black">
            About
          </Text>
          <Text className="text-gray-600 dark:text-gray-300">
            {currentHotel.description}
          </Text>
        </View>

        {/* Contact & Address */}
        <View>
          <Text className="text-lg font-bold mb-2 dark:text-white text-black">
            Contact & Location
          </Text>
          <View className="space-y-2">
            <Text className="text-gray-600 dark:text-gray-300">
              📞 {currentHotel.contactNumber}
            </Text>
            <Text className="text-gray-600 dark:text-gray-300">
              📍 {currentHotel.address}
            </Text>
          </View>
        </View>

        {/* Rules */}
        <View>
          <Text className="text-lg font-bold mb-2 dark:text-white text-black">
            Hotel Rules
          </Text>
          <View className="space-y-2">
            <Text className="text-gray-600 dark:text-gray-300">
              🕐 Check-in: {currentHotel.rules.checkInTime}
            </Text>
            <Text className="text-gray-600 dark:text-gray-300">
              🕐 Check-out: {currentHotel.rules.checkOutTime}
            </Text>
            <Text className="text-gray-600 dark:text-gray-300">
              👥 Max people per room: {currentHotel.rules.maxPeopleInOneRoom}
            </Text>
            <Text className="text-gray-600 dark:text-gray-300">
              🔞 Minimum age: {currentHotel.rules.minimumAgeForCheckIn}+
            </Text>
            {currentHotel.rules.petsAllowed && (
              <Text className="text-gray-600 dark:text-gray-300">
                🐾 Pets allowed
              </Text>
            )}
            {currentHotel.rules.smokingAllowed && (
              <Text className="text-gray-600 dark:text-gray-300">
                🚬 Smoking allowed
              </Text>
            )}
          </View>
        </View>

        {/* Amenities */}
        <View>
          <Text className="text-lg font-bold mb-2 dark:text-white text-black">
            Amenities
          </Text>
          <View className="flex-row flex-wrap">
            {currentHotel.amenities.map((amenity: string, index: number) => (
              <View
                key={index}
                className="bg-gray-100 dark:bg-gray-800 rounded-full px-4 py-2 m-1"
              >
                <Text className="text-gray-800 dark:text-gray-200">
                  {amenity}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Hotel Images */}
        <View>
          <Text className="text-lg font-bold mb-2 dark:text-white text-black">
            Gallery
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {currentHotel.hotelImages.map((image: string, index: number) => (
              <Image
                key={index}
                source={{ uri: image }}
                style={{ width: width * 0.8, height: width * 0.6, marginRight: 10 }}
                className="rounded-lg"
              />
            ))}
          </ScrollView>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#fff',
  },
  createGroup: {
    flexDirection: 'row',
    marginBottom: 16,
    gap: 8,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 8,
    marginRight: 8,
  },
  createButton: {
    backgroundColor: '#007AFF',
    padding: 10,
    borderRadius: 8,
    justifyContent: 'center',
  },
  createButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  list: {
    flex: 1,
  },
  groupItem: {
    flexDirection: 'row',
    padding: 16,
    borderWidth: 1,
    borderColor: '#eee',
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: '#fff',
  },
  selectedGroupItem: {
    borderColor: '#007AFF',
    backgroundColor: '#f0f8ff',
  },
  groupInfo: {
    flex: 1,
  },
  groupName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  groupId: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  groupDetails: {
    fontSize: 14,
    color: '#666',
  },
  deleteButton: {
    backgroundColor: '#FF3B30',
    padding: 8,
    borderRadius: 6,
    alignSelf: 'center',
    marginLeft: 8,
  },
  deleteButtonText: {
    color: '#fff',
  },
});
