import React from "react";
import {
  View,
  ActivityIndicator,
  ScrollView,
  RefreshControl,
  Pressable,
  Dimensions,
} from "react-native";
import { Text } from "@/components/ui/text";
import { getAnalytics, getOccupancyData } from "@lib/api/analytics";
import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "@clerk/clerk-expo";
import { AnalyticsResponse, OccupancyData } from "@/lib/types/analytics";
import {
  format,
  subDays,
  formatDistanceToNow,
  startOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
} from "date-fns";
import {
  Ionicons,
  MaterialCommunityIcons,
  FontAwesome5,
} from "@expo/vector-icons";
import { useColorScheme } from "@/lib/useColorScheme";
import Svg, { Circle } from "react-native-svg";

const REFRESH_INTERVAL = 5 * 60 * 1000; // 5 minutes in milliseconds
const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CARD_WIDTH = (SCREEN_WIDTH - 40) / 2; // 40 is total horizontal padding

type DateRange = "month" | "week" | "today" | "tomorrow";

const CircularProgress = ({
  isLoading,
  percentage,
  size = 120,
  strokeWidth = 12,
  color,
  label,
  value,
}: {
  isLoading: boolean;
  percentage: number;
  size?: number;
  strokeWidth?: number;
  color: string;
  label: string;
  value: string | number;
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <View className="items-center flex justify-center">
      <View
        style={{
          width: size,
          height: size,
          justifyContent: "center",
          alignItems: "center",
          display: "flex",
        }}
      >
        <Svg width={size} height={size}>
          {/* Background circle */}
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={color + "20"}
            strokeWidth={strokeWidth}
            fill="none"
          />
          {/* Progress circle */}
          {!isLoading && (
            <Circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke={color}
              strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            fill="none"
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
            />
          )}
        </Svg>
        <View className="absolute inset-0 items-center justify-center">
          {isLoading ? (
            <Text className="text-sm font-light text-muted-foreground dark:text-white">
              Loading...
            </Text>
          ) : (
            <>
              <Text className="text-2xl font-bold dark:text-white">{value}</Text>
              <Text className="text-sm text-gray-500 dark:text-gray-400">
                {label}
              </Text>
            </>
          )}
        </View>
      </View>
    </View>
  );
};

export default function HotelAnalytics({ hotelId }: { hotelId: string }) {
  const [analytics, setAnalytics] = useState<AnalyticsResponse | null>(null);
  const [occupancyData, setOccupancyData] = useState<OccupancyData | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [refreshing, setRefreshing] = useState(false);
  const [selectedRange, setSelectedRange] = useState<DateRange>("today");
  const { getToken } = useAuth();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";
  const intervalRef = useRef<NodeJS.Timeout>();
  const isMountedRef = useRef(true);
  const isInitialFetchRef = useRef(true);

  const getDateRange = (
    range: DateRange
  ): { startDate: string; endDate: string } => {
    const today = new Date();

    switch (range) {
      case "today":
        return {
          startDate: format(today, "yyyy-MM-dd"),
          endDate: format(addDays(today, 1), "yyyy-MM-dd"),
        };
      case "tomorrow":
        return {
          startDate: format(addDays(today, 1), "yyyy-MM-dd"),
          endDate: format(addDays(today, 2), "yyyy-MM-dd"),
        };
      case "week":
        return {
          startDate: format(
            startOfWeek(today, { weekStartsOn: 1 }),
            "yyyy-MM-dd"
          ),
          endDate: format(endOfWeek(today, { weekStartsOn: 1 }), "yyyy-MM-dd"),
        };
      case "month":
        return {
          startDate: format(today, "yyyy-MM-01"),
          endDate: format(today, "yyyy-MM-dd"),
        };
      default:
        return {
          startDate: format(today, "yyyy-MM-dd"),
          endDate: format(addDays(today, 1), "yyyy-MM-dd"),
        };
    }
  };

  // Separate the data fetching logic
  const fetchAnalyticsData = async (
    token: string,
    startDate: string,
    endDate: string
  ) => {
    return await getAnalytics(hotelId, startDate, endDate, token);
  };

  const fetchOccupancyData = async (
    token: string,
    startDate: string,
    endDate: string
  ) => {
    return await getOccupancyData(hotelId, startDate, endDate, token);
  };

  const fetchData = async (showLoading = true) => {
    if (!isMountedRef.current) return;

    if (showLoading) {
      setIsLoading(true);
    }

    try {
      const token = await getToken();
      if (!token) throw new Error("No authentication token found");

      const { startDate, endDate } = getDateRange(selectedRange);

      const [analyticsData, occupancyInfo] = await Promise.all([
        fetchAnalyticsData(token, startDate, endDate),
        fetchOccupancyData(token, startDate, endDate),
      ]);

      if (isMountedRef.current) {
        setAnalytics(analyticsData);
        setOccupancyData(occupancyInfo);
        setLastUpdated(new Date());
        setError(null);

        if (isInitialFetchRef.current) {
          isInitialFetchRef.current = false;
          startInterval();
        }
      }
    } catch (err) {
      if (isMountedRef.current) {
        setError(
          err instanceof Error ? err.message : "Failed to fetch analytics data"
        );
      }
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
        setRefreshing(false);
      }
    }
  };

  const startInterval = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    intervalRef.current = setInterval(() => {
      if (isMountedRef.current) {
        fetchData(false);
      }
    }, REFRESH_INTERVAL);
  };

  useEffect(() => {
    isMountedRef.current = true;
    isInitialFetchRef.current = true;
    fetchData();

    return () => {
      isMountedRef.current = false;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [hotelId, selectedRange]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchData(false);
  }, []);

  const DateFilterButton = ({
    range,
    label,
  }: {
    range: DateRange;
    label: string;
  }) => (
    <Pressable
      onPress={() => setSelectedRange(range)}
      className={`px-4 py-3 rounded-xl flex-grow items-center justify-center ${
        selectedRange === range
          ? "bg-lime-500 dark:bg-lime-600"
          : "bg-gray-100 dark:bg-gray-800"
      }`}
    >
      <Text
        className={`text-sm font-medium ${
          selectedRange === range
            ? "text-white"
            : "text-gray-700 dark:text-gray-300"
        }`}
      >
        {label}
      </Text>
    </Pressable>
  );

  // if (isLoading) {
  //   return (
  //     <View className="flex-1 items-center justify-center p-4">
  //       <ActivityIndicator
  //         size="large"
  //         color={isDark ? "#84cc16" : "#65a30d"}
  //       />
  //       <Text className="mt-4 text-lg text-gray-600 dark:text-gray-300">
  //         Loading analytics data...
  //       </Text>
  //     </View>
  //   );
  // }

  if (error) {
    return (
      <View className="flex-1 items-center justify-center p-4 ">
        <Ionicons name="alert-circle" size={48} color="#ef4444" />
        <Text className="text-red-500 text-center mt-4">{error}</Text>
        <Pressable
          onPress={() => fetchData(true)}
          className="mt-4 bg-lime-500 dark:bg-lime-600 px-6 py-3 rounded-full"
        >
          <Text className="text-white font-semibold">Tap to retry</Text>
        </Pressable>
      </View>
    );
  }

  const realTimeData = analytics?.realTimeData;

  return (
    <View className="flex-1">
      {/* Date Filter Buttons */}
      <View className="p-6 ">
        <View className="flex-row gap-2 items-center justify-between w-full">
          <DateFilterButton range="month" label="This Month" />
          <DateFilterButton range="week" label="This Week" />
          <DateFilterButton range="today" label="Today" />
          <DateFilterButton range="tomorrow" label="Tomorrow" />
        </View>
      </View>

      <ScrollView
        className="flex-1"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View className="p-4 space-y-4">
          {/* Last Updated */}
          <View className="items-end py-2">
            <Text className="text-gray-500 dark:text-gray-400 text-xs">
              Last updated {formatDistanceToNow(lastUpdated)} ago
            </Text>
          </View>

          {/* Revenue Card - Full Width */}
          <View className="bg-white dark:bg-gray-800 rounded-2xl mb-2 p-6 shadow-sm">
            <View className="flex-row items-center mb-4">
              <FontAwesome5
                name="money-bill-wave"
                size={20}
                color={isDark ? "#9ca3af" : "#4b5563"}
              />
              <Text className="text-lg font-bold ml-2 dark:text-white">
                Revenue
              </Text>
            </View>
            <View className="flex-row justify-between">
              <View>
                <Text className="text-gray-500 dark:text-gray-400 text-sm">
                  Total Revenue
                </Text>
                {isLoading ? (
                  <Text className="text-sm py-1 font-light text-muted-foreground mt-1 dark:text-white">
                    Loading...
                  </Text>
                ) : (
                  <Text className="text-2xl font-bold mt-1 dark:text-white">
                    {realTimeData?.totalRevenue?.toFixed(2) || "0.00"}
                  </Text>
                )}
              </View>
              <View>
                <Text className="text-gray-500 dark:text-gray-400 text-sm">
                  Average Revenue
                </Text>
                {isLoading ? (
                  <Text className="text-sm font-light pt-1 pb-2 text-muted-foreground mt-1 dark:text-white">
                    Loading...
                  </Text>
                ) : (
                  <Text className="text-2xl font-bold mt-1 dark:text-white">
                    ₹{realTimeData?.averageRevenue?.toFixed(2) || "0.00"}
                  </Text>
                )}
              </View>
            </View>
          </View>

          {/* Bookings Overview */}
          <View className="flex-row flex-wrap gap-2">
            {/* Total Bookings */}
            <View
              style={{ width: CARD_WIDTH }}
              className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm flex justify-center items-center"
            >
              <CircularProgress
                isLoading={isLoading}
                percentage={((realTimeData?.totalBookings || 0) / 100) * 100}
                color="#3b82f6"
                label="Total"
                value={realTimeData?.totalBookings || 0}
              />
            </View>

            {/* Occupancy Rate - Only show for today/tomorrow */}
            {occupancyData &&
              (selectedRange === "today" || selectedRange === "tomorrow") && (
                <View
                  style={{ width: CARD_WIDTH }}
                  className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm  flex justify-center items-center"
                >
                  <CircularProgress
                    isLoading={isLoading}
                    percentage={occupancyData.occupancyRate}
                    color="#6366f1"
                    label="Occupancy"
                    value={`${occupancyData.occupancyRate.toFixed(0)}%`}
                  />
                </View>
              )}

            {/* Booking Status */}
            {occupancyData && (
              <>
                <View
                  style={{ width: CARD_WIDTH }}
                  className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm flex justify-center items-center"
                >
                  <CircularProgress
                    isLoading={isLoading}
                    percentage={
                      (occupancyData.pendingBookings /
                        (occupancyData.totalRooms || 1)) *
                      100
                    }
                    color="#eab308"
                    label="Pending"
                    value={occupancyData.pendingBookings}
                  />
                </View>
                <View
                  style={{ width: CARD_WIDTH }}
                  className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm flex justify-center items-center"
                >
                  <CircularProgress
                    isLoading={isLoading}
                    percentage={
                      (occupancyData.confirmedBookings /
                        (occupancyData.totalRooms || 1)) *
                      100
                    }
                    color="#10b981"
                    label="Confirmed"
                    value={occupancyData.confirmedBookings}
                  />
                </View>
              </>
            )}
          </View>

          {/* Historical Data */}
          {analytics?.precomputedData &&
            analytics.precomputedData.length > 0 &&
            selectedRange !== "tomorrow" && (
              <View className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm">
                <Text className="text-xl font-bold mb-4 dark:text-white">
                  Historical Trends
                </Text>
                <View className="space-y-4">
                  {analytics.precomputedData.map((data, index) => (
                    <View key={index} className="space-y-2">
                      <View className="flex-row justify-between">
                        <Text className="text-gray-600 dark:text-gray-300">
                          Total Bookings
                        </Text>
                        <Text className="font-semibold dark:text-white">
                          {data.totalBookings}
                        </Text>
                      </View>
                      <View className="flex-row justify-between">
                        <Text className="text-gray-600 dark:text-gray-300">
                          Revenue
                        </Text>
                        <Text className="font-semibold dark:text-white">
                          ₹{data.totalRevenue.toFixed(2)}
                        </Text>
                      </View>
                      <View className="flex-row justify-between">
                        <Text className="text-gray-600 dark:text-gray-300">
                          Occupancy
                        </Text>
                        <Text className="font-semibold dark:text-white">
                          {data.occupancyRate.toFixed(1)}%
                        </Text>
                      </View>
                      {index < analytics.precomputedData.length - 1 && (
                        <View className="border-b border-gray-200 dark:border-gray-700 my-2" />
                      )}
                    </View>
                  ))}
                </View>
              </View>
            )}
        </View>
      </ScrollView>
    </View>
  );
}
