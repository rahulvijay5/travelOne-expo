import { API_URL } from "@lib/config/index";
import { getHeaders } from "../utils";
import { Timeframe, AnalyticsResponse } from "@/lib/types/analytics";

export const getAnalytics = async (
  hotelId: string,
  timeframe: Timeframe,
  token: string
): Promise<AnalyticsResponse> => {
  try {
    const response = await fetch(
      `${API_URL}/api/analytics/${hotelId}?timeframe=${timeframe}`,
      {
        headers: getHeaders(token),
      }
    );

    if (response.status === 429) {
      throw new Error("Rate limit exceeded");
    }

    if (!response.ok) {
      throw new Error("Failed to fetch analytics data");
    }

    const data: AnalyticsResponse = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching analytics data:", error);
    throw error;
  }
};