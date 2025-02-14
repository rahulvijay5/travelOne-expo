import { User } from "@/types";
import { API_URL } from "@lib/config/index";
import { getHeaders } from "@lib/utils";
import { handleResponse } from "@lib/actions/handleResponse";

export const createUser = async (
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
    console.log("error", error);
  }

  return handleResponse(res);
};

export const updateUserRole = async (
  clerkId: string,
  role: User["role"],
  token?: string
) => {
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
};

export const getUserByClerkId = async (clerkId: string, token?: string) => {
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
};

export const addManager = async (groupId: number, managerId: number, token?: string) => {
    try {
    const res = await fetch(`${API_URL}/groups/${groupId}/managers`, {
      method: "POST",
      headers: getHeaders(token),
      body: JSON.stringify({ managerId: managerId.toString() }),
    });
    return res.json();
    } catch (error) {
      console.error("Error adding manager:", error);
      throw error;
  }
};

export const addManagerByPhone = async (
  groupId: number,
  phoneNumber: string,
  token?: string
) => {
  const res = await fetch(`${API_URL}/groups/${groupId}/managers/phone`, {
      method: "POST",
      headers: getHeaders(token),
      body: JSON.stringify({ phoneNumber }),
    });
  return res.json();
};

export const removeManager = async (groupId: number, managerId: number) => {
  const res = await fetch(`${API_URL}/groups/${groupId}/managers/${managerId}`, {
        method: "DELETE",
      }
    );
  return res.json();
};

export const searchUserByPhone = async (phoneNumber: string, token?: string) => {
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
};

export const getManagingHotels = async (managerId: string, token?: string) => {
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
  };

  export const getUserProfile = async (userId: string, token?: string) => {
    try {
      const res = await fetch(`${API_URL}/api/users/user-profile/${userId}`, {
        method: "GET",
        headers: getHeaders(token),
      });
      console.log("res", res);
      if(res.status === 404) {
        return { error: "User not found" };
      }else if(res.status === 200) {
        return res.json();
      }
    } catch (error) {
      console.error("Error getting user profile:", error);
      throw error;
    }
  };