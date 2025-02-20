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
import { getAnalytics } from "@lib/api/analytics";
import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "@clerk/clerk-expo";
import { AnalyticsResponse, Timeframe } from "@/lib/types/analytics";
import { formatDistanceToNow } from "date-fns";
import { Ionicons, FontAwesome5, MaterialIcons } from "@expo/vector-icons";
import { useColorScheme } from "@/lib/useColorScheme";
import Svg, { Circle } from "react-native-svg";

const REFRESH_INTERVAL = 5 * 60 * 1000; // 5 minutes in milliseconds
const UI_UPDATE_INTERVAL = 30 * 1000; // 30 seconds for UI updates
const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CARD_WIDTH = (SCREEN_WIDTH - 40) / 2; // 40 is total horizontal padding

type DateRange = Timeframe;

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
            <ActivityIndicator size="small" color={color} />
          ) : (
            <>
              <Text className="text-2xl font-bold dark:text-white">
                {value}
              </Text>
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

interface CacheData {
  data: AnalyticsResponse;
  timestamp: number;
  timeframe: DateRange;
}

interface RangeCache {
  [key: string]: CacheData;
}

export default function HotelAnalytics({ hotelId }: { hotelId: string }) {
  const [analytics, setAnalytics] = useState<AnalyticsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedRange, setSelectedRange] = useState<DateRange>("today");
  const { getToken } = useAuth();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";
  const intervalRef = useRef<NodeJS.Timeout>();
  const uiUpdateIntervalRef = useRef<NodeJS.Timeout>();
  const isMountedRef = useRef(true);
  const isInitialFetchRef = useRef(true);
  const cacheRef = useRef<RangeCache>({});
  const [calculatedAt, setCalculatedAt] = useState<Date | null>(null);

  const getDateRange = (range: DateRange): { timeframe: Timeframe } => {
    return { timeframe: range };
  };

  // Separate the data fetching logic
  const fetchAnalyticsData = async (
    token: string,
    timeframe: Timeframe
  ) => {
    return await getAnalytics(hotelId, timeframe, token);
  };

  const isCacheValid = (range: DateRange): boolean => {
    const cache = cacheRef.current[range];
    if (!cache) return false;

    const now = Date.now();
    const cacheAge = now - cache.timestamp;
    return cacheAge < REFRESH_INTERVAL;
  };

  const updateCache = (range: DateRange, data: AnalyticsResponse) => {
    const timestamp = Date.now();
    cacheRef.current[range] = {
      data,
      timestamp,
      timeframe: range,
    };
    setCalculatedAt(new Date(data.calculatedAt));
  };

  const startUIUpdateInterval = () => {
    if (uiUpdateIntervalRef.current) {
      clearInterval(uiUpdateIntervalRef.current);
    }

    // Update UI every 30 seconds to reflect accurate time based on calculatedAt
    uiUpdateIntervalRef.current = setInterval(() => {
      if (isMountedRef.current && calculatedAt) {
        const cache = cacheRef.current[selectedRange];
        if (cache) {
          const now = Date.now();
          const cacheAge = now - cache.timestamp;
          if (cacheAge >= REFRESH_INTERVAL) {
            fetchData(false);
          }
        }
      }
    }, UI_UPDATE_INTERVAL);
  };

  const fetchData = async (showLoading = true) => {
    if (!isMountedRef.current) return;

    // Check cache first
    if (isCacheValid(selectedRange)) {
      const cache = cacheRef.current[selectedRange];
      setAnalytics(cache.data);
      setCalculatedAt(new Date(cache.data.calculatedAt));
      return;
    }

    if (showLoading) {
      setIsLoading(true);
    }

    try {
      const token = await getToken();
      if (!token) throw new Error("No authentication token found");

      const { timeframe } = getDateRange(selectedRange);
      const analyticsData = await fetchAnalyticsData(token, timeframe);

      if (isMountedRef.current) {
        // Compare new data with cached data to see if anything changed
        const cache = cacheRef.current[selectedRange];
        const hasDataChanged =
          !cache ||
          JSON.stringify(analyticsData) !== JSON.stringify(cache.data);

        setAnalytics(analyticsData);
        setError(null);
        setCalculatedAt(new Date(analyticsData.calculatedAt));

        // Only update cache and timestamp if data actually changed
        if (hasDataChanged) {
          updateCache(selectedRange, analyticsData);
        }

        if (isInitialFetchRef.current) {
          isInitialFetchRef.current = false;
          startInterval();
          startUIUpdateInterval();
        }
      }
    } catch (err) {
      if (isMountedRef.current) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to fetch analytics data";
        setError(errorMessage);
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
    startUIUpdateInterval();

    return () => {
      isMountedRef.current = false;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (uiUpdateIntervalRef.current) {
        clearInterval(uiUpdateIntervalRef.current);
      }
    };
  }, [hotelId, selectedRange]);

  // Auto-refresh if more than 5 minutes have passed since last fetch
  useEffect(() => {
    const checkAndRefresh = () => {
      if (calculatedAt) {
        const now = Date.now();
        const cacheAge = now - calculatedAt.getTime();
        if (cacheAge >= REFRESH_INTERVAL) {
          fetchData(false);
        }
      }
    };

    const refreshInterval = setInterval(checkAndRefresh, UI_UPDATE_INTERVAL);

    return () => clearInterval(refreshInterval);
  }, [calculatedAt]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    // Clear cache for current range to force refresh
    delete cacheRef.current[selectedRange];
    fetchData(false);
  }, [selectedRange]);

  const handleRangeChange = (range: DateRange) => {
    setSelectedRange(range);
    const cache = cacheRef.current[range];

    // Update calculatedAt based on cache if it exists
    if (cache) {
      setCalculatedAt(new Date(cache.data.calculatedAt));
    }

    if (!isCacheValid(range)) {
      fetchData(true);
    }
  };

  const DateFilterButton = ({
    range,
    label,
  }: {
    range: DateRange;
    label: string;
  }) => (
    <Pressable
      onPress={() => handleRangeChange(range)}
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

  return (
    <View className="flex-1">
      {/* Date Filter Buttons */}
      <View className="px-6 py-2">
        <View className="flex-row gap-2 items-center justify-between w-full">
          <DateFilterButton range="currentMonth" label="This Month" />
          <DateFilterButton range="thisWeek" label="This Week" />
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
        <View className="px-4">
          {/* Last Updated */}
          <View className="flex-row items-center justify-end py-2">
            <Text className="text-gray-500 dark:text-gray-400 text-xs">
              Last updated{" "}
              {calculatedAt
                ? formatDistanceToNow(calculatedAt, { addSuffix: true })
                : "a moment ago"}
            </Text>
          </View>

          {/* Revenue Card - Full Width */}
          <View className="bg-gray-100 dark:bg-gray-800 rounded-2xl mb-2 p-6 shadow-sm">
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
                  <ActivityIndicator size="small" color="#4b5563" />
                ) : (
                  <Text className="text-2xl font-bold mt-1 dark:text-white">
                    ₹{analytics?.revenue.toFixed(2) || "0.00"}
                  </Text>
                )}
              </View>
              {analytics?.revenue && (
                <View>
                  <Text className="text-gray-500 dark:text-gray-400 text-sm">
                    Average Revenue
                  </Text>
                  {isLoading ? (
                    <ActivityIndicator size="small" color="#4b5563" />
                  ) : (
                    <Text className="text-2xl font-bold mt-1 dark:text-white">
                      ₹
                      {(
                        analytics?.revenue / (analytics?.confirmedBookings || 1)
                      ).toFixed(2) || "0.00"}
                    </Text>
                  )}
                </View>
              )}
            </View>
          </View>

          {/* Bookings Overview */}
          <View className="flex-row flex-wrap gap-2">
            {/* Total Bookings */}
            <View
              style={{ width: CARD_WIDTH }}
              className="bg-gray-100 dark:bg-gray-800 rounded-2xl p-4 shadow-sm flex justify-center items-center"
            >
              <CircularProgress
                isLoading={isLoading}
                percentage={
                  analytics
                    ? (analytics.confirmedBookings / analytics.totalBookings) *
                      100
                    : 0
                }
                color="#3b82f6"
                label="Total"
                value={analytics?.confirmedBookings || 0}
              />
            </View>

            {/* Pending Bookings */}
            {analytics && (
              <View
                style={{ width: CARD_WIDTH }}
                  className="bg-gray-100 dark:bg-gray-800 rounded-2xl p-4 shadow-sm flex justify-center items-center"
              >
                <CircularProgress
                  isLoading={isLoading}
                  percentage={
                    (analytics.pendingBookings /
                      (analytics.availableRooms || 1)) *
                    100
                  }
                  color="#eab308"
                  label="Pending"
                  value={analytics.pendingBookings}
                />
              </View>
            )}

            {/* Confirmed Bookings */}
            {analytics && (
              <View
                style={{ width: CARD_WIDTH }}
                className="bg-gray-100 dark:bg-gray-800 rounded-2xl p-4 shadow-sm flex justify-center items-center"
              >
                <CircularProgress
                  isLoading={isLoading}
                  percentage={
                    (analytics.confirmedBookings /
                      (analytics.availableRooms || 1)) *
                    100
                  }
                  color="#10b981"
                  label="Confirmed"
                  value={analytics.confirmedBookings}
                />
              </View>
            )}

            {/* Occupancy Rate - Only show for today/tomorrow */}
            {analytics &&
              (selectedRange === "today" || selectedRange === "tomorrow") && (
                <View
                  style={{ width: CARD_WIDTH }}
                  className="bg-gray-100 dark:bg-gray-800 rounded-2xl p-4 shadow-sm flex justify-center items-center"
                >
                  <CircularProgress
                    isLoading={isLoading}
                    percentage={analytics?.occupancyRate || 0}
                    color="#6366f1"
                    label="Occupancy"
                    value={`${analytics?.occupancyRate ? analytics.occupancyRate.toFixed(0) : 0}%`}
                  />
                </View>
              )}
          </View>
          <View className="flex-row flex-wrap gap-2 my-2 mb-4">

              <View className="bg-gray-100 dark:bg-gray-800 rounded-2xl p-4 shadow-sm flex flex-grow justify-center items-center">
                <Text className="text-gray-500 dark:text-gray-400 text-sm">
                  Available Rooms
                </Text>
                <Text className="text-2xl font-bold mt-1 dark:text-white">
                  {isLoading ? (
                    <ActivityIndicator size="small" color="#4b5563" />
                  ) : (
                    analytics?.availableRooms || 0
                  )}
                </Text>
              </View>

              <View className="bg-gray-100 dark:bg-gray-800 rounded-2xl p-4 shadow-sm flex flex-grow justify-center items-center">
                <Text className="text-gray-500 dark:text-gray-400 text-sm">
                  Pending Bookings
                </Text>
                <Text className="text-2xl font-bold mt-1 dark:text-white">
                  {isLoading ? (
                    <ActivityIndicator size="small" color="#4b5563" />
                  ) : (
                    analytics?.pendingBookings || 0
                  )}
                </Text>
              </View>

              <View className="bg-gray-100 dark:bg-gray-800 rounded-2xl p-4 shadow-sm flex flex-grow justify-center items-center">
                <Text className="text-gray-500 dark:text-gray-400 text-sm">
                  Confirmed Bookings
                </Text>
                <Text className="text-2xl font-bold mt-1 dark:text-white">
                  {isLoading ? (
                    <ActivityIndicator size="small" color="#4b5563" />
                  ) : (
                    analytics?.confirmedBookings || 0
                  )}
                </Text>
              </View>
              <View className="bg-gray-100 dark:bg-gray-800 rounded-2xl p-4 shadow-sm flex flex-grow justify-center items-center">
                <Text className="text-gray-500 dark:text-gray-400 text-sm">
                  Checkout
                </Text>
                <Text className="text-2xl font-bold mt-1 dark:text-white">
                  {isLoading ? (
                    <ActivityIndicator size="small" color="#4b5563" />
                  ) : (
                    analytics?.completedBookings || 0
                  )}
                </Text>
              </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}