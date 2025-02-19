import { API_URL } from "@lib/config/index";
import { getHeaders } from "../utils";

export const getAnalytics = async (hotelId: string, startDate: string, endDate: string, token: string) => {
  const response = await fetch(
    `${API_URL}/api/analytics/${hotelId}?startDate=${startDate}&endDate=${endDate}`,
    {
      headers: getHeaders(token),
    }
  );
  console.log("response of analytics", response);
  if (response.status === 429) {
    throw new Error("Rate limit exceeded");
  }
  const data = await response.json();
  console.log("data of analytics", data);
  return data;
};  

export const getOccupancyData = async (hotelId: string, startDate: string, endDate: string, token: string) => {
  const response = await fetch(
    `${API_URL}/api/analytics/${hotelId}/occupancy?startDate=${startDate}&endDate=${endDate}`,
    {
      headers: getHeaders(token),
    }
  );
  if (response.status === 429) {
    throw new Error("Rate limit exceeded");
  }
  const data = await response.json();
  console.log("data of occupancy", data);
  return data;
};