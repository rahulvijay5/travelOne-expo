import AsyncStorage from "@react-native-async-storage/async-storage";
import { getHotelByCode, getHotelRooms } from "@/lib/api/hotels";

interface ProcessCodeOptions {
  code: string;
  token?: string;
  getToken?: () => Promise<string | null>;
  getUserData?: () => Promise<any>;
  storeUserData?: (data: any) => Promise<any>;
  forceRefetch?: boolean;
}

export const processCode = async ({
  code,
  token,
  getToken,
  getUserData,
  storeUserData,
  forceRefetch = false,
}: ProcessCodeOptions) => {
  try {
    // Check cache first if not forcing refetch
    if (!forceRefetch) {
      const cachedHotelsStr = await AsyncStorage.getItem("@cached_hotels");
      console.log("cachedHotelsStr", cachedHotelsStr);
      if (cachedHotelsStr) {
        const cachedHotels = JSON.parse(cachedHotelsStr);
        const cachedHotel = cachedHotels.find((h: any) => h.code === code);
        if (cachedHotel) {
          console.log("Using cached hotel data");
          await AsyncStorage.setItem(
            "@current_hotel_details",
            JSON.stringify(cachedHotel)
          );

          if (storeUserData) {
            await storeUserData({
              currentStay: {
                hotelId: cachedHotel.id,
                hotelCode: cachedHotel.code,
                hotelName: cachedHotel.hotelName,
              },
            });
          }

          // If user is owner/manager, still fetch rooms as they might have changed
          if (getUserData) {
            const userData = await getUserData();
            if (
              (userData?.role === "OWNER" || userData?.role === "MANAGER") &&
              getToken
            ) {
              const authToken = token || (await getToken());
              if (authToken) {
                const rooms = await getHotelRooms(cachedHotel.id, authToken);
                if (rooms && !rooms.error) {
                  await AsyncStorage.setItem(
                    "@current_hotel_rooms",
                    JSON.stringify({
                      hotelId: cachedHotel.id,
                      rooms: rooms.data || rooms,
                    })
                  );
                }
              }
            }
          }

          return { success: true, data: cachedHotel };
        }
      }
    }

    // If not in cache or force refetch, get from API
    const response = await getHotelByCode(code);
    console.log("Got hotel by code. ");
    console.log("response", response);

    if (response.status === 200 && response.data) {
      // Store in cache
      const cachedHotelsStr = await AsyncStorage.getItem("@cached_hotels");
      const cachedHotels = cachedHotelsStr ? JSON.parse(cachedHotelsStr) : [];
      const updatedCache = [
        ...cachedHotels.filter((h: any) => h.code !== code),
        response.data,
      ];
      await AsyncStorage.setItem("@cached_hotels", JSON.stringify(updatedCache));

      // Store current hotel details
      await AsyncStorage.setItem(
        "@current_hotel_details",
        JSON.stringify(response.data)
      );

      // Handle owner/manager specific data
      if (getUserData) {
        const userData = await getUserData();
        if (
          (userData?.role === "OWNER" || userData?.role === "MANAGER") &&
          getToken
        ) {
          const authToken = token || (await getToken());
          if (authToken) {
            const rooms = await getHotelRooms(response.data.id, authToken);
            if (rooms && !rooms.error) {
              await AsyncStorage.setItem(
                "@current_hotel_rooms",
                JSON.stringify({
                  hotelId: response.data.id,
                  rooms: rooms.data || rooms,
                })
              );
            }
          }
        }
      }

      // Update user data if storeUserData is provided
      if (storeUserData) {
        await storeUserData({
          currentStay: {
            hotelId: response.data.id,
            hotelCode: response.data.code,
            hotelName: response.data.hotelName,
          },
        });
      }

      return { success: true, data: response.data };
    } else {
      let errorMessage = "An unknown error occurred. Please try again.";
      switch (response.status) {
        case 404:
          errorMessage = "No hotel found with this code. Please verify and try again.";
          break;
        case 400:
          errorMessage = "Invalid hotel code format. Please try again.";
          break;
        case 500:
          errorMessage = "Server error. Please try again later.";
          break;
      }
      return { success: false, error: errorMessage };
    }
  } catch (error) {
    console.error("Error processing code:", error);
    return {
      success: false,
      error: "Failed to process hotel code. Please check your internet connection and try again.",
    };
  }
};
