import { API_URL } from "@lib/config/index";
import { getHeaders } from "@lib/utils";
import { handleResponse } from "@lib/actions/handleResponse";
import { CreateRoomForm, UpdateRoomForm } from "@/types";

export const getAllRooms = async (hotelId: string, token?: string) => {
  const res = await fetch(`${API_URL}/api/rooms/hotel/${hotelId}`, {
    headers: getHeaders(token),
  });
  return handleResponse(res);
};

export const createMultipleRooms = async (
  rooms: CreateRoomForm[],
  hotelId: string,
  token?: string
) => {
  console.log("rooms in createMultipleRooms", rooms);
  const res = await fetch(`${API_URL}/api/rooms/multiple/${hotelId}`, {
    method: "POST",
    headers: getHeaders(token),
    body: JSON.stringify({ rooms: rooms }),
  });
  console.log("res in createMultipleRooms", res);
  if (res.status === 201) {
    return res.json();
  } else {
    return { error: "Failed to create rooms" };
  }
};

export const getRoomById = async (roomId: string, token?: string) => {
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
};

export const updateRoom = async (
  roomId: string,
  roomData: UpdateRoomForm,
  token?: string
) => {
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
};

export const deleteRoom = async (roomId: string, token?: string) => {
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
};

// Room related functions
export const getHotelRoomsByStatus = async (
  hotelId: string,
  roomStatus: string = "AVAILABLE"
) => {
  try {
    const res = await fetch(
      `${API_URL}/api/rooms/hotel/${hotelId}/${roomStatus}`
    );
    return handleResponse(res);
  } catch (error) {
    console.error("Error getting hotel rooms:", error);
    throw error;
  }
};

export const getAvailableRooms = async (
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
};
