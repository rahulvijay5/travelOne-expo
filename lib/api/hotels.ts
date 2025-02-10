import { useUserStorage } from "@/hooks/useUserStorage";
import { HotelFormData, BookingDataInDb, HotelRulesChange } from "@/types";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_URL } from "@lib/config/index";
import { getHeaders } from "@lib/utils";
import { handleResponse } from "@lib/actions/handleResponse";

export const storeHotelBookings = async (
  hotelId: string,
  bookings: BookingDataInDb[]
) => {
  try {
    console.log(`Storing hotel bookings for hotel ID: ${hotelId}`);

    // Get current date minus 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    console.log(`Filtering bookings older than: ${sevenDaysAgo.toISOString()}`);

    // Filter out bookings older than 7 days
    const recentBookings = bookings.filter((booking) => {
      const bookingDate = new Date(booking.checkIn);
      const isRecent = bookingDate >= sevenDaysAgo;
      console.log(
        `Booking ID: ${
          booking.id
        }, Check-in Date: ${bookingDate.toISOString()}, Is Recent: ${isRecent}`
      );
      return isRecent;
    });

    console.log(`Recent bookings count: ${recentBookings.length}`);

    // Store with timestamp
    const storageData = {
      lastUpdated: new Date().toISOString(),
      bookings: recentBookings,
    };

    await AsyncStorage.setItem(
      `@hotel_bookings_${hotelId}`,
      JSON.stringify(storageData)
    );
    console.log(`Successfully stored hotel bookings for hotel ID: ${hotelId}`);
  } catch (error) {
    console.error("Error storing hotel bookings:", error);
  }
};

// Function to get hotel bookings from storage
export const getHotelBookingsFromStorage = async (
  hotelId: string
): Promise<BookingDataInDb[] | null> => {
  try {
    console.log(
      `Retrieving hotel bookings from storage for hotel ID: ${hotelId}`
    );
    const data = await AsyncStorage.getItem(`@hotel_bookings_${hotelId}`);

    if (data) {
      const parsedData = JSON.parse(data);
      console.log(`Retrieved data: ${JSON.stringify(parsedData)}`);

      // Check if data is older than 7 days
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      console.log(
        `Filtering out bookings older than: ${sevenDaysAgo.toISOString()}`
      );

      // Filter out old bookings
      const recentBookings = parsedData.bookings.filter(
        (booking: BookingDataInDb) => {
          const bookingDate = new Date(booking.checkIn);
          const isRecent = bookingDate >= sevenDaysAgo;
          console.log(
            `Booking ID: ${
              booking.id
            }, Check-in Date: ${bookingDate.toISOString()}, Is Recent: ${isRecent}`
          );
          return isRecent;
        }
      );

      // If bookings were filtered out, update storage
      if (recentBookings.length !== parsedData.bookings.length) {
        console.log(
          `Updating storage with recent bookings for hotel ID: ${hotelId}`
        );
        await storeHotelBookings(hotelId, recentBookings);
      }

      console.log(`Returning recent bookings count: ${recentBookings.length}`);
      return recentBookings;
    }
    console.log(`No data found for hotel ID: ${hotelId}`);
    return null;
  } catch (error) {
    console.error("Error getting hotel bookings from storage:", error);
    return null;
  }
};

// Function to check if bookings data has changed
export const hasBookingsDataChanged = (
  oldBookings: BookingDataInDb[],
  newBookings: BookingDataInDb[]
): boolean => {
  console.log(`Checking if bookings data has changed...`);
  if (oldBookings.length !== newBookings.length) {
    console.log(
      `Booking counts differ - Old: ${oldBookings.length}, New: ${newBookings.length}`
    );
    return true;
  }

  const bookingMap = new Map(oldBookings.map((b) => [b.id, b]));

  const hasChanged = newBookings.some((newBooking) => {
    const oldBooking = bookingMap.get(newBooking.id);
    if (!oldBooking) {
      console.log(`New booking found: ${newBooking.id}`);
      return true;
    }

    const isChanged =
      oldBooking.status !== newBooking.status ||
      oldBooking.checkIn !== newBooking.checkIn ||
      oldBooking.checkOut !== newBooking.checkOut ||
      oldBooking.guests !== newBooking.guests;

    if (isChanged) {
      console.log(`Booking ID: ${newBooking.id} has changed.`);
    }

    return isChanged;
  });

  return hasChanged;
};

export const createHotel = async (hotel: HotelFormData, token?: string) => {
  try {
    const { getUserData } = useUserStorage();
    const user = await getUserData();

    const res = await fetch(`${API_URL}/api/hotels`, {
      method: "POST",
      headers: getHeaders(token),
      body: JSON.stringify({ ...hotel, owner: user?.userId }),
    });

    if (!res.ok) {
      throw new Error("Failed to create hotel");
    }

    // Parse the response body
    const responseData = await res.json();
    return { ok: true, data: responseData };
  } catch (error) {
    console.error("Error creating hotel:", error);
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Failed to create hotel",
    };
  }
};

export const getOwnedHotels = async (ownerId: string, token?: string) => {
  try {
    console.log("Getting owned hotels for ownerId:", ownerId);
    console.log("API URL:", API_URL);
    const res = await fetch(`${API_URL}/api/hotels/owner/${ownerId}`, {
      method: "GET",
      headers: getHeaders(token),
    });

    console.log("Response in getOwnedHotels:", res);
    if (!res.ok) {
      throw new Error("Failed to get owned hotels");
    }

    // Parse the response body
    const responseData = await res.json();
    return { ok: true, data: responseData };
  } catch (error) {
    console.error("Error getting owned hotels:", error);
    return {
      ok: false,
      error:
        error instanceof Error ? error.message : "Failed to get owned hotels",
    };
  }
};

export const updateHotelRules = async (
  hotelId: string,
  rules: HotelRulesChange,
  token: string
) => {
  try {
    console.log("Updating hotel rules for hotelId:", hotelId);
    console.log("Rules:", rules);
    const response = await fetch(`${API_URL}/api/hotels/${hotelId}/rules`, {
      method: "PUT",
      headers: getHeaders(token),
      body: JSON.stringify(rules),
    });
    console.log("Response in updateHotelRules:", response);

    if (!response.ok) {
      throw new Error("Failed to update hotel rules");
    }

    return response;
  } catch (error) {
    console.error("Error updating hotel rules:", error);
    throw error;
  }
};

// Function to save hotel data to local storage
export const saveHotelToStorage = async (hotelData: any) => {
  try {
    const existingHotels = await AsyncStorage.getItem("userHotels");
    let hotels = existingHotels ? JSON.parse(existingHotels) : [];

    // Add new hotel to the list
    hotels = [hotelData, ...hotels];

    await AsyncStorage.setItem("userHotels", JSON.stringify(hotels));
  } catch (error) {
    console.error("Error saving hotel to storage:", error);
    throw error;
  }
};

// Function to get hotels from storage
export const getHotelsFromStorage = async () => {
  try {
    const hotels = await AsyncStorage.getItem("userHotels");
    return hotels ? JSON.parse(hotels) : [];
  } catch (error) {
    console.error("Error getting hotels from storage:", error);
    throw error;
  }
};

export const addManagerToHotel = async (
  hotelId: string,
  managerId: string,
  token?: string
) => {
  try {
    console.log("Adding manager to hotel:", { hotelId, managerId });
    const res = await fetch(`${API_URL}/api/hotels/${hotelId}/managers`, {
      method: "POST",
      headers: getHeaders(token),
      body: JSON.stringify({ managerId }),
    });

    return handleResponse(res);
  } catch (error) {
    console.error("Error adding manager to hotel:", error);
    throw error;
  }
};

export const removeManagerFromHotel = async (
  hotelId: string,
  managerId: string,
  token?: string
) => {
  try {
    console.log("Removing manager from hotel:", { hotelId, managerId });
    const res = await fetch(
      `${API_URL}/api/hotels/${hotelId}/managers/${managerId}`,
      {
        method: "DELETE",
        headers: getHeaders(token),
      }
    );

    return handleResponse(res);
  } catch (error) {
    console.error("Error removing manager from hotel:", error);
    throw error;
  }
};

export const getHotelManagers = async (hotelId: string, token?: string) => {
  try {
    console.log("Getting hotel managers for hotelId:", hotelId);
    const res = await fetch(`${API_URL}/api/hotels/${hotelId}/managers`, {
      method: "GET",
      headers: getHeaders(token),
    });

    return handleResponse(res);
  } catch (error) {
    console.error("Error getting hotel managers:", error);
    throw error;
  }
};

export const getHotelById = async (hotelId: string, token?: string) => {
  try {
    console.log("Getting hotel details for hotelId:", hotelId);
    const res = await fetch(`${API_URL}/api/hotels/${hotelId}`, {
      method: "GET",
      headers: getHeaders(token),
    });

    console.log("res in getHotelById", res);

    return handleResponse(res);
  } catch (error) {
    console.error("Error getting hotel details:", error);
    throw error;
  }
};

export const getHotelByCode = async (code: string) => {
  try {
    const res = await fetch(`${API_URL}/api/hotels/code/${code}`);
    console.log("Response status:", res.status);

    if (!res.ok) {
      if (res.status === 404) {
        return { status: 404, error: "Hotel not found" };
      }
      if (res.status === 400) {
        return { status: 400, error: "Invalid hotel code" };
      }
      return { status: res.status, error: "Failed to fetch hotel details" };
    }

    // Parse response data
    const data = await res.json();

    // Validate required fields
    if (!data.id || !data.code || !data.hotelName) {
      console.error("Invalid hotel data received:", data);
      return { status: 500, error: "Invalid hotel data received" };
    }

    return { status: 200, data };
  } catch (error) {
    console.error("Error getting hotel by code:", error);
    return { status: 500, error: "Internal server error" };
  }
};

export const getHotelRooms = async (hotelId: string, token?: string) => {
  try {
    const res = await fetch(`${API_URL}/api/rooms/hotel/${hotelId}`, {
      method: "GET",
      headers: getHeaders(token),
    });
    console.log("res in getHotelRooms", res);
    if (res.status === 404) {
      return { error: "Rooms not found" };
    }
    return res.json();
  } catch (error) {
    console.error("Error getting hotel rooms:", error);
    throw error;
  }
};
