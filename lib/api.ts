import { useUserStorage } from "@/hooks/useUserStorage";
import { HotelFormData, User, HotelRules, BookingData, BookingStatus, RoomStatus, BookingDataInDb, HotelRulesChange, RoomForm, CreateRoomForm, UpdateRoomForm } from "@/types";
import { useAuth } from "@clerk/clerk-expo";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from "expo-router";

const API_URL = process.env.EXPO_PUBLIC_API_URL;

const getAuthHeader = async () => {
  const { getToken } = useAuth();
  const token = await getToken();
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
};

const getHeaders = (token?: string) => ({
  ...(token ? { Authorization: `Bearer ${token}` } : {}),
  "Content-Type": "application/json",
});

const handleResponse = async (res: Response) => {
  if (!res.ok) {
    // Log the response status and type to debug
    console.error("API Response Error: ", res.status, res.statusText);

    try {
      // Try to parse as JSON first
      const contentType = res.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        const errorData = await res.json();
        if (res.status === 404 && errorData.message === "User not found") {
          return { error: "User not found" };
        }
        throw new Error(errorData.message || `API error: ${res.status}`);
      }
      
      // If not JSON, try to get text
      const text = await res.text();
      console.error("Error Response Text: ", text);
      throw new Error(`API error: ${res.status} - ${res.statusText}`);
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error(`API error: ${res.status} - ${res.statusText}`);
    }
  }

  try {
    const contentType = res.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
      return res.json();
    }
    // For endpoints that don't return JSON
    const text = await res.text();
    if (!text) return null;
    try {
      // Try to parse as JSON anyway in case content-type is wrong
      return JSON.parse(text);
    } catch {
      // If can't parse as JSON, return as is
      return text;
    }
  } catch (error) {
    console.error("Error parsing response:", error);
    throw new Error("Failed to parse response");
  }
};

// Function to store hotel bookings in storage
async function storeHotelBookings(hotelId: string, bookings: BookingDataInDb[]) {
  try {
    console.log(`Storing hotel bookings for hotel ID: ${hotelId}`);
    
    // Get current date minus 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    console.log(`Filtering bookings older than: ${sevenDaysAgo.toISOString()}`);

    // Filter out bookings older than 7 days
    const recentBookings = bookings.filter(booking => {
      const bookingDate = new Date(booking.checkIn);
      const isRecent = bookingDate >= sevenDaysAgo;
      console.log(`Booking ID: ${booking.id}, Check-in Date: ${bookingDate.toISOString()}, Is Recent: ${isRecent}`);
      return isRecent;
    });

    console.log(`Recent bookings count: ${recentBookings.length}`);

    // Store with timestamp
    const storageData = {
      lastUpdated: new Date().toISOString(),
      bookings: recentBookings
    };

    await AsyncStorage.setItem(`@hotel_bookings_${hotelId}`, JSON.stringify(storageData));
    console.log(`Successfully stored hotel bookings for hotel ID: ${hotelId}`);
  } catch (error) {
    console.error('Error storing hotel bookings:', error);
  }
}

// Function to get hotel bookings from storage
async function getHotelBookingsFromStorage(hotelId: string): Promise<BookingDataInDb[] | null> {
  try {
    console.log(`Retrieving hotel bookings from storage for hotel ID: ${hotelId}`);
    const data = await AsyncStorage.getItem(`@hotel_bookings_${hotelId}`);
    
    if (data) {
      const parsedData = JSON.parse(data);
      console.log(`Retrieved data: ${JSON.stringify(parsedData)}`);
      
      // Check if data is older than 7 days
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      console.log(`Filtering out bookings older than: ${sevenDaysAgo.toISOString()}`);
      
      // Filter out old bookings
      const recentBookings = parsedData.bookings.filter((booking: BookingDataInDb) => {
        const bookingDate = new Date(booking.checkIn);
        const isRecent = bookingDate >= sevenDaysAgo;
        console.log(`Booking ID: ${booking.id}, Check-in Date: ${bookingDate.toISOString()}, Is Recent: ${isRecent}`);
        return isRecent;
      });

      // If bookings were filtered out, update storage
      if (recentBookings.length !== parsedData.bookings.length) {
        console.log(`Updating storage with recent bookings for hotel ID: ${hotelId}`);
        await storeHotelBookings(hotelId, recentBookings);
      }

      console.log(`Returning recent bookings count: ${recentBookings.length}`);
      return recentBookings;
    }
    console.log(`No data found for hotel ID: ${hotelId}`);
    return null;
  } catch (error) {
    console.error('Error getting hotel bookings from storage:', error);
    return null;
  }
}

// Function to check if bookings data has changed
function hasBookingsDataChanged(oldBookings: BookingDataInDb[], newBookings: BookingDataInDb[]): boolean {
  console.log(`Checking if bookings data has changed...`);
  if (oldBookings.length !== newBookings.length) {
    console.log(`Booking counts differ - Old: ${oldBookings.length}, New: ${newBookings.length}`);
    return true;
  }
  
  const bookingMap = new Map(oldBookings.map(b => [b.id, b]));
  
  const hasChanged = newBookings.some(newBooking => {
    const oldBooking = bookingMap.get(newBooking.id);
    if (!oldBooking) {
      console.log(`New booking found: ${newBooking.id}`);
      return true;
    }
    
    const isChanged = oldBooking.status !== newBooking.status ||
                      oldBooking.checkIn !== newBooking.checkIn ||
                      oldBooking.checkOut !== newBooking.checkOut ||
                      oldBooking.guests !== newBooking.guests;
    
    if (isChanged) {
      console.log(`Booking ID: ${newBooking.id} has changed.`);
    }
    
    return isChanged;
  });

  return hasChanged;
}

const api = {
  // User Management
  createUser: async (
    phoneNumber: string,
    UserEmail: string,
    UserName: string,
    role: User["role"],
    clerkId: string,
    token?: string
  ) => {
    console.log(
      "Creating user:",
      phoneNumber,
      UserEmail,
      UserName,
      role,
      clerkId
    );
    console.log("API URL:", API_URL);
    
    const res = await fetch(`${API_URL}/api/users`, {
      method: "POST",
      headers: getHeaders(token),
      body: JSON.stringify({
        phoneNumber,
        email: UserEmail,
        name: UserName,
        role,
        clerkId,
      }),
    });

    if (res.status === 400) {
      const error = await handleResponse(res);
      throw new Error(
        error.message || "User with this phone number already exists"
      );
    }

    if (!res.ok) {
      const error = await handleResponse(res);
      throw new Error(error.message || "Failed to create user");
    }

    return handleResponse(res);
  },

  updateUserRole: async (clerkId: string, role: User["role"], token?: string) => {
    const res = await fetch(`${API_URL}/api/users/update-role`, {
      method: "POST",
      headers: getHeaders(token),
      body: JSON.stringify({ clerkId, role }),
    });

    if (!res.ok) {
      const error = await handleResponse(res);
      throw new Error(error.message || "Failed to update user role");
    }
    console.log("res", res);
    return handleResponse(res);
  },

  getUserByClerkId: async (clerkId: string, token?: string) => {
    try {
      const url = `${API_URL}/api/users/${clerkId}`;
      console.log("Fetching URL:", url);
      
      const res = await fetch(url, {
        method: "GET",
        headers: getHeaders(token),
      });

      return handleResponse(res);
    } catch (error) {
      console.error("getUserByClerkId error:", error);
      throw error;
    }
  },

  createHotel: async (hotel: HotelFormData, token?: string) => {
    try {
      const { getUserData } = useUserStorage();
      const user = await getUserData();
      
      const res = await fetch(`${API_URL}/api/hotels`, {
        method: "POST",
        headers: getHeaders(token),
        body: JSON.stringify({...hotel, owner: user?.userId}),
      });

      if (!res.ok) {
        throw new Error('Failed to create hotel');
      }

      // Parse the response body
      const responseData = await res.json();
      return { ok: true, data: responseData };
    } catch (error) {
      console.error('Error creating hotel:', error);
      return { ok: false, error: error instanceof Error ? error.message : 'Failed to create hotel' };
    }
  },

  getOwnedHotels: async (ownerId: string, token?: string) => {
    try {
      console.log("Getting owned hotels for ownerId:", ownerId);
      console.log("API URL:", API_URL);
      const res = await fetch(`${API_URL}/api/hotels/owner/${ownerId}`, {
        method: "GET",
        headers: getHeaders(token),
      });

      console.log("Response in getOwnedHotels:", res);
      if (!res.ok) {
        throw new Error('Failed to get owned hotels');
      }

      // Parse the response body
      const responseData = await res.json();
      return { ok: true, data: responseData };
    } catch (error) {
      console.error('Error getting owned hotels:', error);
      return { ok: false, error: error instanceof Error ? error.message : 'Failed to get owned hotels' };
    }
  },

  // SuperAdmin Routes
  getAllRooms: async (hotelId: string, token?: string) => {
    const res = await fetch(`${API_URL}/api/rooms/hotel/${hotelId}`, {
      headers: getHeaders(token),
    });
    return handleResponse(res);
  },

  createMultipleRooms: async (rooms: CreateRoomForm[], hotelId: string, token?: string) => {
    console.log("rooms in createMultipleRooms", rooms);
    const res = await fetch(`${API_URL}/api/rooms/multiple/${hotelId}`, {
      method: "POST",
      headers: getHeaders(token),
      body: JSON.stringify({rooms:rooms}),
    });
    console.log("res in createMultipleRooms", res);
    if(res.status === 201){
      return res.json();
    }else{
      return { error: "Failed to create rooms" };
    }
  },

  deleteGroup: async (groupId: number) => {
    const res = await fetch(`${API_URL}/admin/groups/${groupId}`, {
      method: "DELETE",
    });
    return res.json();
  },

  // Owner Routes
  createGroup: async (name: string, ownerId: number) => {
    const res = await fetch(`${API_URL}/groups`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, ownerId }),
    });
    return res.json();
  },

  getOwnerGroups: async (ownerId: number) => {
    const res = await fetch(`${API_URL}/owners/${ownerId}/groups`);
    return res.json();
  },

  addManager: async (groupId: number, managerId: number) => {
    try {
      const res = await fetch(`${API_URL}/groups/${groupId}/managers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ managerId: managerId.toString() }),
      });
      return res.json();
    } catch (error) {
      console.error("Error adding manager:", error);
      throw error;
    }
  },

  addManagerByPhone: async (groupId: number, phoneNumber: string) => {
    const res = await fetch(`${API_URL}/groups/${groupId}/managers/phone`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phoneNumber }),
    });
    return res.json();
  },

  removeManager: async (groupId: number, managerId: number) => {
    const res = await fetch(
      `${API_URL}/groups/${groupId}/managers/${managerId}`,
      {
        method: "DELETE",
      }
    );
    return res.json();
  },

  // Manager Routes
  getManagerGroups: async (managerId: number) => {
    const res = await fetch(`${API_URL}/managers/${managerId}/groups`);
    return res.json();
  },

  addMember: async (groupId: number, memberId: number) => {
    const res = await fetch(`${API_URL}/groups/${groupId}/members`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: memberId.toString() }),
    });
    console.log("Response in addMember:", await res.json());
    return res.json();
  },

  removeMember: async (groupId: number, memberId: number) => {
    const res = await fetch(
      `${API_URL}/groups/${groupId}/members/${memberId}`,
      {
        method: "DELETE",
      }
    );
    return res.json();
  },

  // Customer Routes
  getUserGroups: async (userId: number) => {
    const res = await fetch(`${API_URL}/users/${userId}/groups`);
    return res.json();
  },

  // Todo Routes
  createTodo: async (groupId: number, title: string, creatorId: number) => {
    const res = await fetch(`${API_URL}/groups/${groupId}/todos`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, creatorId }),
    });
    return res.json();
  },

  updateTodo: async (
    todoId: number,
    data: { title?: string; status?: boolean }
  ) => {
    const res = await fetch(`${API_URL}/todos/${todoId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return res.json();
  },

  deleteTodo: async (todoId: number) => {
    const res = await fetch(`${API_URL}/todos/${todoId}`, {
      method: "DELETE",
    });
    return res.json();
  },

  getGroupTodos: async (groupId: number) => {
    const res = await fetch(`${API_URL}/groups/${groupId}/todos`);
    return res.json();
  },

  updateHotelRules: async (hotelId: string, rules: HotelRulesChange, token: string) => {
    try {
      console.log("Updating hotel rules for hotelId:", hotelId);
      console.log("Rules:", rules);
      const response = await fetch(`${API_URL}/api/hotels/${hotelId}/rules`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(rules),
      });
      console.log("Response in updateHotelRules:", response);

      if (!response.ok) {
        throw new Error('Failed to update hotel rules');
      }

      return response;
    } catch (error) {
      console.error('Error updating hotel rules:', error);
      throw error;
    }
  },

  // Function to save hotel data to local storage
  saveHotelToStorage: async (hotelData: any) => {
    try {
      const existingHotels = await AsyncStorage.getItem('userHotels');
      let hotels = existingHotels ? JSON.parse(existingHotels) : [];
      
      // Add new hotel to the list
      hotels = [hotelData, ...hotels];
      
      await AsyncStorage.setItem('userHotels', JSON.stringify(hotels));
    } catch (error) {
      console.error('Error saving hotel to storage:', error);
      throw error;
    }
  },

  // Function to get hotels from storage
  getHotelsFromStorage: async () => {
    try {
      const hotels = await AsyncStorage.getItem('userHotels');
      return hotels ? JSON.parse(hotels) : [];
    } catch (error) {
      console.error('Error getting hotels from storage:', error);
      throw error;
    }
  },

  uploadImages: async (imageUris: string[], folderName: string, token: string) => {
    try {
      console.log("Uploading images:", imageUris);
      const response = await fetch(`${API_URL}/api/images/upload`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          imageUris, // Send the URIs directly
          folderName,
        }),
      });
      console.log("Response:", response);
  
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to upload images');
      }
  
      const data = await response.json();
      return data.imageUrls;
    } catch (error) {
      console.error('Error uploading images:', error);
      throw error;
    }
  },

  searchUserByPhone: async (phoneNumber: string, token?: string) => {
    try {
      console.log("Searching user by phone number:", phoneNumber);
      const res = await fetch(`${API_URL}/api/users/search?query=${phoneNumber}`, {
        method: "GET",
        headers: getHeaders(token),
      });
      if(res.status === 404) {
        return { error: "User not found" };
      }
      return handleResponse(res);
    } catch (error) {
      console.error("Error searching user:", error);
      throw error;
    }
  },

  addManagerToHotel: async (hotelId: string, managerId: string, token?: string) => {
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
  },

  removeManagerFromHotel: async (hotelId: string, managerId: string, token?: string) => {
    try {
      console.log("Removing manager from hotel:", { hotelId, managerId });
      const res = await fetch(`${API_URL}/api/hotels/${hotelId}/managers/${managerId}`, {
        method: "DELETE",
        headers: getHeaders(token),
      });

      return handleResponse(res);
    } catch (error) {
      console.error("Error removing manager from hotel:", error);
      throw error;
    }
  },

  getHotelManagers: async (hotelId: string, token?: string) => {
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
  },

  getHotelById: async (hotelId: string, token?: string) => {
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
  },

  getHotelByCode: async (code: string) => {
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
  },

  getHotelRooms: async (hotelId: string, token?: string) => {
    try {
      const res = await fetch(`${API_URL}/api/rooms/hotel/${hotelId}`, {
        method: "GET",
        headers: getHeaders(token),
      });
      console.log("res in getHotelRooms", res);
      if(res.status === 404) {
        return { error: "Rooms not found" };
      }
      return res.json();
    } catch (error) {
      console.error("Error getting hotel rooms:", error);
      throw error;
    }
  },

  getRoomById: async (roomId: string, token?: string) => {
    try {
      const res = await fetch(`${API_URL}/api/rooms/${roomId}`, {
        method: "GET",
        headers: getHeaders(token),
      });
      
      if (res.status === 404) {
        return { error: "Room not found" };
      }
      return handleResponse(res);
    } catch (error) {
      console.error("Error getting room details:", error);
      throw error;
    }
  },

  updateRoom: async (roomId: string, roomData: UpdateRoomForm, token?: string) => {
    try {
      const res = await fetch(`${API_URL}/api/rooms/${roomId}`, {
        method: "PUT",
        headers: getHeaders(token),
        body: JSON.stringify(roomData),
      });
      
      if (res.status === 200) {
        return { success: true, data: await handleResponse(res) };
      }
      return { success: false, error: "Failed to update room" };
    } catch (error) {
      console.error("Error updating room:", error);
      throw error;
    }
  },

  deleteRoom: async (roomId: string, token?: string) => {
    try {
      const res = await fetch(`${API_URL}/api/rooms/${roomId}`, {
        method: "DELETE",
        headers: getHeaders(token),
      });
      
      if (res.status === 204) {
        return { success: true };
      }
      return { success: false, error: "Failed to delete room" };
    } catch (error) {
      console.error("Error deleting room:", error);
      throw error;
    }
  },

  // Room related functions
  getHotelRoomsByStatus: async (hotelId: string, roomStatus: string = "AVAILABLE") => {
    try {
      const res = await fetch(`${API_URL}/api/rooms/hotel/${hotelId}/${roomStatus}`);
      return handleResponse(res);
    } catch (error) {
      console.error("Error getting hotel rooms:", error);
      throw error;
    }
  },

  getManagingHotels: async (managerId: string, token?: string) => {
    try {
      const res = await fetch(`${API_URL}/api/users/currentManagingHotels/${managerId}`, {
        method: "GET",
        headers: getHeaders(token),
      });
      return handleResponse(res);
    } catch (error) {
      console.error("Error getting managing hotels:", error);
      throw error;
    }
  },

  // Booking related functions
  createBooking: async (bookingData: BookingData, token?: string) => {
    try {
      const res = await fetch(`${API_URL}/api/bookings`, {
        method: "POST",
        headers: getHeaders(token),
        body: JSON.stringify(bookingData),
      });
      const response = await res.json();
      return response;
    } catch (error) {
    console.error("Error creating booking:", error);
      throw error;
    }
  },

  getBookingById: async (bookingId: string, token?: string) => {
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
  },

  // Function to save booking data to local storage
  saveBookingToStorage: async (bookingData: any) => {
    try {
      const existingBookings = await AsyncStorage.getItem('userBookings');
      let bookings = existingBookings ? JSON.parse(existingBookings) : [];
      
      // Add new booking to the list
      bookings = [bookingData, ...bookings];
      
      await AsyncStorage.setItem('userBookings', JSON.stringify(bookings));
    } catch (error) {
      console.error('Error saving booking to storage:', error);
      throw error;
    }
  },

  // Function to get bookings from storage
  getBookingsFromStorage: async () => {
    try {
      const bookings = await AsyncStorage.getItem('userBookings');
      return bookings ? JSON.parse(bookings) : [];
    } catch (error) {
      console.error('Error getting bookings from storage:', error);
      throw error;
    }
  },

  // Modified getFilteredHotelBookings to use storage
  getFilteredHotelBookings: async (
    hotelId: string,
    filters: {
      status?: BookingStatus;
      timeRange?: 'today' | 'yesterday' | 'thisWeek' | 'thisMonth' | 'custom';
      startDate?: Date;
      endDate?: Date;
      roomStatus?: RoomStatus;
      sortBy?: 'checkIn' | 'checkOut' | 'bookingTime';
      sortOrder?: 'asc' | 'desc';
      page?: number;
      limit?: number;
      search?: string;
    },
    token?: string
  ) => {
    try {
      console.log(`Fetching filtered hotel bookings for hotel ID: ${hotelId} with filters:`, filters);

      // First try to get data from storage
      const storedBookings = await getHotelBookingsFromStorage(hotelId);
      console.log(`Stored bookings retrieved:`, storedBookings);
      let bookingsToReturn = storedBookings || [];

      // Construct query parameters for API call
      const queryParams = new URLSearchParams();
      if (filters.status) queryParams.append('status', filters.status);
      if (filters.timeRange) queryParams.append('timeRange', filters.timeRange);
      if (filters.startDate) queryParams.append('startDate', filters.startDate.toISOString().split('T')[0]);
      if (filters.endDate) queryParams.append('endDate', filters.endDate.toISOString().split('T')[0]);
      if (filters.roomStatus) queryParams.append('roomStatus', filters.roomStatus);
      if (filters.sortBy) queryParams.append('sortBy', filters.sortBy);
      if (filters.sortOrder) queryParams.append('sortOrder', filters.sortOrder);
      if (filters.page) queryParams.append('page', filters.page.toString());
      if (filters.limit) queryParams.append('limit', filters.limit.toString());
      if (filters.search) queryParams.append('search', filters.search);

      // Make API call in background
      const url = `${API_URL}/api/bookings/hotel/${hotelId}/filter?${queryParams.toString()}`;
      console.log(`Making API call to: ${url}`);
      const res = await fetch(url, {
        method: 'GET',
        headers: getHeaders(token),
      });

      const apiResponse = await handleResponse(res);
      const newBookings = apiResponse.data;
      console.log(`API response received:`, apiResponse);

      // If we got new data and it's different from stored data
      if (newBookings && (!storedBookings || hasBookingsDataChanged(storedBookings, newBookings))) {
        console.log(`New bookings received, updating storage...`);
        // Update storage
        await storeHotelBookings(hotelId, newBookings);
        bookingsToReturn = newBookings;
      } else {
        console.log(`No new bookings or data is unchanged.`);
      }

      return {
        data: bookingsToReturn,
        isFromCache: bookingsToReturn === storedBookings
      };
    } catch (error) {
      console.error('Error getting filtered hotel bookings:', error);
      throw error;
    }
  },

  updateBookingPaymentStatus: async (
    bookingId: string,
    paidAmount: number,
    status: "PAID" | "FAILED",
    token: string
  ) => {
    try {
      const response = await fetch(`${API_URL}/api/bookings/${bookingId}/payment`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          paidAmount,
          status,
          transactionId: "OFFLINE",
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to update booking payment status: ${response.statusText}`);
      }

      return { status: response.status, data: await response.json() };
    } catch (error) {
      console.error("Error updating booking payment status:", error);
      throw error;
    }
  },

  checkOutBooking: async (bookingId: string, token?: string) => {
    try {
      const response = await fetch(`${API_URL}/api/bookings/${bookingId}/checkout`, {
        method: "PATCH",
        headers: getHeaders(token),
      });
      if(response.status === 200){
        return { status: 200, data: await response.json() };
      }else{
        return { status: response.status, error: "Failed to check out booking" };
      }
    } catch (error) {
      console.error("Error checking out booking:", error);
      throw error;
    }
  },

  getAvailableRooms: async (
    hotelId: string,
    checkIn: string,
    checkOut: string,
    guests: number,
    token?: string
  ) => {
    try {
      const response = await fetch(
        `${API_URL}/api/rooms/${hotelId}/available?checkIn=${checkIn}&checkOut=${checkOut}&guests=${guests}`,
        {
          method: "GET",
          headers: getHeaders(token),
        }
      );

      if (!response.ok) {
        if (response.status === 400) {
          throw new Error("Invalid request parameters. Please check your input.");
        } else if (response.status === 500) {
          throw new Error("Server error. Please try again later.");
        }
        throw new Error("Failed to fetch available rooms");
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Error fetching available rooms:", error);
      throw error;
    }
  },
};
export default api;
