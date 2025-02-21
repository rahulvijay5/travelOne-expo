import { BookingData, BookingStatus, CheckBookingStatusResponse, RoomStatus } from "@/types";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_URL } from "@lib/config/index";
import { getHeaders } from "@lib/utils";
import { handleResponse } from "@lib/actions/handleResponse";
import {
  getHotelBookingsFromStorage,
  hasBookingsDataChanged,
  storeHotelBookings,
} from "./hotels";

export const createBooking = async (
  bookingData: BookingData,
  token?: string
) => {
  try {
    const res = await fetch(`${API_URL}/api/bookings`, {
      method: "POST",
      headers: getHeaders(token),
      body: JSON.stringify(bookingData),
    });
    console.log("Here is the response", res);
    if(res.status === 400) {
      const response = await res.json();
      console.log("Here is the response", response);
      return response;
    }
    const response = await res.json();
    return response;
  } catch (error) {
    console.error("Error creating booking:", error);
    throw error;
  }
};

export const getBookingById = async (bookingId: string, token?: string) => {
  try {
    const res = await fetch(`${API_URL}/api/bookings/${bookingId}`, {
      method: "GET",
      headers: getHeaders(token),
    });

    if (res.status === 404) {
      return { error: "Booking not found" };
    }
    return handleResponse(res);
  } catch (error) {
    console.error("Error getting booking details:", error);
    throw error;
  }
};

export const checkBookingStatusFromApi = async (bookingId: string, token?: string): Promise<CheckBookingStatusResponse> => {
  try {
    const res = await fetch(`${API_URL}/api/bookings/check-booking-status/${bookingId}`, {
      method: "GET",
      headers: getHeaders(token),
    });

    if (res.status === 404) {
      throw new Error("Booking not found");
    }
    return handleResponse(res);
  } catch (error) {
    console.error("Error checking booking status:", error);
    throw error;
  }
};

// Function to save booking data to local storage
export const saveBookingToStorage = async (bookingData: any) => {
  try {
    const existingBookings = await AsyncStorage.getItem("userBookings");
    let bookings = existingBookings ? JSON.parse(existingBookings) : [];

    // Add new booking to the list
    bookings = [bookingData, ...bookings];

    await AsyncStorage.setItem("userBookings", JSON.stringify(bookings));
  } catch (error) {
    console.error("Error saving booking to storage:", error);
    throw error;
  }
};

// Function to get bookings from storage
export const getBookingsFromStorage = async () => {
  try {
    const bookings = await AsyncStorage.getItem("userBookings");
    return bookings ? JSON.parse(bookings) : [];
  } catch (error) {
    console.error("Error getting bookings from storage:", error);
    throw error;
  }
};

export const  getCurrentBookingOfUser = async (clerkId: string, token?: string) => {
  try {
    const res = await fetch(`${API_URL}/api/bookings/current-booking/${clerkId}`, {
      method: "GET",
      headers: getHeaders(token),
    });
    const response = await res.json();
    if (res.status === 404) {
      return { error: "Booking not found" };
    }
    return response;
  } catch (error) {
    console.error("Error getting current booking of user:", error);
    throw error;
  }
};

// Modified getFilteredHotelBookings to use storage
export const getFilteredHotelBookings = async (
  hotelId: string,
  filters: {
    status?: BookingStatus;
    timeRange?: "today" | "yesterday" | "thisWeek" | "thisMonth" | "custom";
    startDate?: Date;
    endDate?: Date;
    roomStatus?: RoomStatus;
    sortBy?: "checkIn" | "checkOut" | "bookingTime";
    sortOrder?: "asc" | "desc";
    page?: number;
    limit?: number;
    search?: string;
  },
  token?: string
) => {
  try {
    console.log(
      `Fetching filtered hotel bookings for hotel ID: ${hotelId} with filters:`,
      filters
    );

    // First try to get data from storage
    const storedBookings = await getHotelBookingsFromStorage(hotelId);
    console.log(`Stored bookings retrieved`);
    let bookingsToReturn = storedBookings || [];

    // Construct query parameters for API call
    const queryParams = new URLSearchParams();
    if (filters.status) queryParams.append("status", filters.status);
    if (filters.timeRange) queryParams.append("timeRange", filters.timeRange);
    if (filters.startDate)
      queryParams.append(
        "startDate",
        filters.startDate.toISOString().split("T")[0]
      );
    if (filters.endDate)
      queryParams.append(
        "endDate",
        filters.endDate.toISOString().split("T")[0]
      );
    if (filters.roomStatus)
      queryParams.append("roomStatus", filters.roomStatus);
    if (filters.sortBy) queryParams.append("sortBy", filters.sortBy);
    if (filters.sortOrder) queryParams.append("sortOrder", filters.sortOrder);
    if (filters.page) queryParams.append("page", filters.page.toString());
    if (filters.limit) queryParams.append("limit", filters.limit.toString());
    if (filters.search) queryParams.append("search", filters.search);

    // Make API call in background
    const url = `${API_URL}/api/bookings/hotel/${hotelId}/filter?${queryParams.toString()}`;
    console.log(`Making API call to: ${url}`);
    const res = await fetch(url, {
      method: "GET",
      headers: getHeaders(token),
    });

    const apiResponse = await handleResponse(res);
    const newBookings = apiResponse.data;
    console.log(`API response received in getFilteredHotelBookings`);

    // If we got new data and it's different from stored data
    if (
      newBookings &&
      (!storedBookings || hasBookingsDataChanged(storedBookings, newBookings))
    ) {
      console.log(`New bookings received, updating storage...`);
      // Update storage
      await storeHotelBookings(hotelId, newBookings);
      bookingsToReturn = newBookings;
    } else {
      console.log(`No new bookings or data is unchanged.`);
    }

    return {
      data: bookingsToReturn,
      isFromCache: bookingsToReturn === storedBookings,
    };
  } catch (error) {
    console.error("Error getting filtered hotel bookings:", error);
    throw error;
  }
};

export const updateBookingPaymentStatus = async (
  bookingId: string,
  paidAmount: number,
  status: "PAID" | "FAILED",
  token: string
) => {
  try {
    const response = await fetch(
      `${API_URL}/api/bookings/${bookingId}/payment`,
      {
        method: "PATCH",
        headers: getHeaders(token),
        body: JSON.stringify({
          paidAmount,
          status,
          transactionId: "OFFLINE",
        }),
      }
    );

    if (!response.ok) {
      throw new Error(
        `Failed to update booking payment status: ${response.statusText}`
      );
    }

    return { status: response.status, data: await response.json() };
  } catch (error) {
    console.error("Error updating booking payment status:", error);
    throw error;
  }
};

export const checkOutBooking = async (bookingId: string, token?: string) => {
  try {
    const response = await fetch(
      `${API_URL}/api/bookings/${bookingId}/checkout`,
      {
        method: "PATCH",
        headers: getHeaders(token),
      }
    );
    if (response.status === 200) {
      return { status: 200, data: await response.json() };
    } else {
      return { status: response.status, error: "Failed to check out booking" };
    }
  } catch (error) {
    console.error("Error checking out booking:", error);
    throw error;
  }
};
