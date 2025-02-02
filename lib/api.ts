import { useUserStorage } from "@/hooks/useUserStorage";
import { HotelFormData, User, HotelRules } from "@/types";
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

      console.log("Response:", res);
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
  getAllGroups: async () => {
    const headers = await getAuthHeader();
    const res = await fetch(`${API_URL}/admin/groups`, {
      headers
    });
    return handleResponse(res);
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
    console.log("Response:", await res.json());
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

  updateHotelRules: async (hotelId: string, rules: HotelRules, token: string) => {
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
      console.log("Response:", response);

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
      
      if (res.status === 404) {
        return { status: 404, error: "Hotel not found" };
      }
      
      if (res.status === 400) {
        return { status: 400, error: "Invalid hotel code" };
      }
      
      if (!res.ok) {
        return { status: res.status, error: "Failed to fetch hotel details" };
      }

      const data = await res.json();
      return { status: 200, data };
    } catch (error) {
      console.error("Error getting hotel by code:", error);
      return { status: 500, error: "Internal server error" };
    }
  },
};

export default api;
