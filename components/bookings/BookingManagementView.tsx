import React, { useEffect, useState } from "react";
import {
  View,
  ScrollView,
  Pressable,
  StyleSheet,
  Dimensions,
} from "react-native";
import {
  format,
  addDays,
  startOfDay,
  parseISO,
  eachDayOfInterval,
  subDays,
} from "date-fns";
import api from "@/lib/api";
import { useAuth } from "@clerk/clerk-expo";
import { BookingDataInDb, BookingStatus, RoomStatus } from "@/types";
import { useColorScheme } from "nativewind";
import { Text } from "@/components/ui/text";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import BookingModal from "./BookingModal";
import DropDownPicker from "react-native-dropdown-picker";

interface BookingManagementViewProps {
  hotelId: string;
}

type SortByType = "checkIn" | "checkOut" | "bookingTime";
type SortOrderType = "asc" | "desc";

const CELL_WIDTH = 120;
const ROOM_COLUMN_WIDTH = 80;
const TOTAL_DAYS = 7;

// Add helper function for calculating booking position
function calculateBookingPosition(
  checkIn: string,
  checkOut: string,
  dayStart: Date
) {
  const checkInTime = parseISO(checkIn);
  const checkOutTime = parseISO(checkOut);
  const dayEndTime = addDays(dayStart, 1);

  // Calculate start position
  const startOffset =
    checkInTime > dayStart
      ? (checkInTime.getHours() + checkInTime.getMinutes() / 60) / 24
      : 0;

  // Calculate end position
  const endOffset =
    checkOutTime < dayEndTime
      ? (checkOutTime.getHours() + checkOutTime.getMinutes() / 60) / 24
      : 1;

  return {
    left: startOffset * CELL_WIDTH,
    width: (endOffset - startOffset) * CELL_WIDTH,
  };
}

export default function BookingManagementView({
  hotelId,
}: BookingManagementViewProps) {
  const { getToken } = useAuth();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";
  const [bookings, setBookings] = useState<BookingDataInDb[]>([]);
  const [filteredBookings, setFilteredBookings] = useState<BookingDataInDb[]>(
    []
  );
  const [rooms, setRooms] = useState<any[]>([]);
  const [startDate, setStartDate] = useState(
    subDays(startOfDay(new Date()), 0)
  );
  const [loading, setLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] =
    useState<BookingDataInDb | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  // Dropdown states
  const [statusOpen, setStatusOpen] = useState(false);
  const [roomStatusOpen, setRoomStatusOpen] = useState(false);
  const [sortByOpen, setSortByOpen] = useState(false);

  const [filters, setFilters] = useState({
    status: "" as BookingStatus | "",
    timeRange: "custom" as const,
    roomStatus: "" as RoomStatus | "",
    sortBy: "checkIn" as SortByType,
    sortOrder: "asc" as SortOrderType,
  });

  const statusItems = [
    { label: "All Status", value: "" },
    { label: "Pending", value: "PENDING" as BookingStatus },
    { label: "Confirmed", value: "CONFIRMED" as BookingStatus },
    { label: "Cancelled", value: "CANCELLED" as BookingStatus },
    { label: "Completed", value: "COMPLETED" as BookingStatus },
  ];

  const roomStatusItems = [
    { label: "All", value: "" },
    { label: "Available", value: "AVAILABLE" as RoomStatus },
    { label: "Booked", value: "BOOKED" as RoomStatus },
    { label: "Maintenance", value: "MAINTENANCE" as RoomStatus },
  ];

  const sortByItems = [
    { label: "Check In", value: "checkIn" as SortByType },
    { label: "Check Out", value: "checkOut" as SortByType },
    { label: "Booking Time", value: "bookingTime" as SortByType },
  ];

  // Load rooms from storage
  useEffect(() => {
  const loadRooms = async () => {
    try {
        const roomsData = await AsyncStorage.getItem("@current_hotel_rooms");
        if (roomsData) {
          const parsedData = JSON.parse(roomsData);
          if (parsedData.hotelId === hotelId) {
            const roomsArray = Array.isArray(parsedData.rooms)
              ? parsedData.rooms
              : [];
            const sortedRooms = roomsArray.sort(
              (a: any, b: any) =>
                parseInt(a.roomNumber) - parseInt(b.roomNumber)
        );
            console.log("Loaded rooms:", sortedRooms);
            setRooms(sortedRooms);
          }
      }
    } catch (error) {
      console.error("Error loading rooms:", error);
    }
  };
    loadRooms();
  }, [hotelId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const token = await getToken();

      const bookingsResponse = await api.getFilteredHotelBookings(
        hotelId,
        {
          ...(filters.status ? { status: filters.status } : {}),
          ...(filters.roomStatus ? { roomStatus: filters.roomStatus } : {}),
          timeRange: filters.timeRange,
          sortBy: filters.sortBy,
          sortOrder: filters.sortOrder,
          startDate: startDate,
          endDate: addDays(startDate, 7),
        },
        token || undefined
      );
      setBookings(bookingsResponse.data);
      setFilteredBookings(bookingsResponse.data);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [hotelId, startDate, filters]);

  const handleDateChange = (days: number) => {
    setStartDate((prev) => addDays(prev, days));
  };

  const handleBookingPress = (booking: BookingDataInDb) => {
    setSelectedBooking(booking);
    setShowModal(true);
  };

  const renderDateNavigation = () => (
    <View className="flex-row items-center justify-between flex-grow">
      <Pressable
        onPress={() => handleDateChange(-7)}
        className="bg-gray-200 dark:bg-gray-700 p-2 rounded-full"
      >
        <ChevronLeft size={24} color={isDark ? "white" : "black"} />
      </Pressable>
      <Text className="text-lg font-bold dark:text-white">
        {format(startDate, "MMM d")} -{" "}
        {format(addDays(startDate, 6), "MMM d, yyyy")}
      </Text>
      <Pressable
        onPress={() => handleDateChange(7)}
        className="bg-gray-200 dark:bg-gray-700 p-2 rounded-full"
      >
        <ChevronRight size={24} color={isDark ? "white" : "black"} />
      </Pressable>
    </View>
  );

  const renderTimelineGrid = () => {
    if (!rooms || rooms.length === 0) {
      return (
        <View className="flex-1 justify-center items-center">
          <Text className="dark:text-white">No rooms available</Text>
        </View>
      );
    }

    const days = eachDayOfInterval({
      start: startDate,
      end: addDays(startDate, 6),
    });

    return (
      <View style={[styles.gridContainer, isDark && styles.gridContainerDark]}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View>
            {/* Fixed Header */}
            <View style={[styles.headerRow, isDark && styles.headerRowDark]}>
                <View
                style={[styles.roomHeader, isDark && styles.roomHeaderDark]}
                >
                <Text
                  style={[styles.headerText, isDark && styles.headerTextDark]}
                >
                  Room
                </Text>
              </View>
              {days.map((day) => (
                <View
                  key={day.toISOString()}
                  style={[styles.dayHeader, isDark && styles.dayHeaderDark]}
                >
                  <Text
                    style={[styles.headerText, isDark && styles.headerTextDark]}
                  >
                    {format(day, "EEE")}
                  </Text>
                  <Text
                    style={[
                      styles.subHeaderText,
                      isDark && styles.subHeaderTextDark,
                    ]}
                  >
                    {format(day, "MMM d")}
                  </Text>
                </View>
              ))}
            </View>

            {/* Rooms Grid */}
            {rooms.map((room) => (
              <View
                key={room.id}
                style={[styles.roomRow, isDark && styles.roomRowDark]}
              >
                <View style={[styles.roomCell, isDark && styles.roomCellDark]}>
                  <Text
                    style={[styles.roomText, isDark && styles.roomTextDark]}
                  >
                    Room {room.roomNumber}
                  </Text>
                </View>
                {days.map((day) => {
                  const bookingsForDay = filteredBookings.filter((booking) => {
                    const bookingStart = parseISO(booking.checkIn);
                    const bookingEnd = parseISO(booking.checkOut);
                    const dayStart = startOfDay(day);
                    const dayEnd = addDays(dayStart, 1);
                    return (
                      booking.room.roomNumber === room.roomNumber &&
                      bookingStart < dayEnd &&
                      bookingEnd > dayStart
                    );
                  });

                  return (
                    <View
                      key={day.toISOString()}
                      style={[styles.dayCell, isDark && styles.dayCellDark]}
                    >
                      {bookingsForDay.map((booking) => {
                        const { left, width } = calculateBookingPosition(
                          booking.checkIn,
                          booking.checkOut,
                          startOfDay(day)
                        );

                        return (
                          <Pressable
                            key={booking.id}
                            style={[
                              styles.bookingChip,
                              {
                                backgroundColor: getStatusColor(booking.status),
                                position: "absolute",
                                left,
                                width: Math.max(width, 50), // Minimum width for visibility
                              },
                            ]}
                            onPress={() => handleBookingPress(booking)}
                          >
                            <Text style={styles.bookingText} numberOfLines={1}>
                              {booking.customer.name} | {booking.guests}
                            </Text>
                          </Pressable>
                        );
                      })}
                    </View>
                  );
                })}
              </View>
            ))}
          </View>
        </ScrollView>
      </View>
    );
  };

  const renderFilters = () =>
    showFilters && (
      <View className="px-4 mb-4">
        <View className="z-30">
          <DropDownPicker
            open={statusOpen}
            value={filters.status}
            items={statusItems}
            setOpen={setStatusOpen}
            setValue={(callback: (val: string) => BookingStatus | "") =>
              setFilters((prev) => ({ ...prev, status: callback(prev.status) }))
            }
            theme={isDark ? "DARK" : "LIGHT"}
            style={styles.dropdown}
            dropDownContainerStyle={styles.dropdownContainer}
          />
        </View>
      </View>
    );

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center">
        <Text className="dark:text-white">Loading...</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white dark:bg-gray-900">
      <View className="py-4 flex-row items-center justify-between px-4">
      {renderDateNavigation()}
      </View>
      <View className="flex-1">{renderTimelineGrid()}</View>
      <BookingModal
        booking={selectedBooking}
        visible={showModal}
        onClose={() => setShowModal(false)}
      />
    </View>
  );
}

function getStatusColor(status: BookingStatus): string {
  switch (status) {
    case "CONFIRMED":
      return "#22c55e"; // green-500
    case "PENDING":
      return "#eab308"; // yellow-500
    case "CANCELLED":
      return "#ef4444"; // red-500
    case "COMPLETED":
      return "#3b82f6"; // blue-500
    default:
      return "#6b7280"; // gray-500
  }
}

const styles = StyleSheet.create({
  gridContainer: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  gridContainerDark: {
    backgroundColor: "#1f2937",
  },
  headerRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
    backgroundColor: "#f9fafb",
  },
  headerRowDark: {
    borderBottomColor: "#374151",
    backgroundColor: "#111827",
  },
  roomHeader: {
    width: ROOM_COLUMN_WIDTH,
    padding: 8,
    justifyContent: "center",
    borderRightWidth: 1,
    borderRightColor: "#e5e7eb",
  },
  roomHeaderDark: {
    borderRightColor: "#374151",
  },
  dayHeader: {
    width: CELL_WIDTH,
    padding: 8,
    alignItems: "center",
    borderRightWidth: 1,
    borderRightColor: "#e5e7eb",
  },
  dayHeaderDark: {
    borderRightColor: "#374151",
  },
  headerText: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#374151",
  },
  headerTextDark: {
    color: "#f3f4f6",
  },
  subHeaderText: {
    fontSize: 12,
    color: "#6b7280",
  },
  subHeaderTextDark: {
    color: "#9ca3af",
  },
  gridScroll: {
    flex: 1,
  },
  daysContainer: {
    flexDirection: "row",
  },
  roomRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  roomRowDark: {
    borderBottomColor: "#374151",
  },
  roomCell: {
    width: ROOM_COLUMN_WIDTH,
    padding: 4,
    justifyContent: "center",
    borderRightWidth: 1,
    borderRightColor: "#e5e7eb",
    backgroundColor: "#f9fafb",
  },
  roomCellDark: {
    borderRightColor: "#374151",
    backgroundColor: "#111827",
  },
  roomText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#374151",
  },
  roomTextDark: {
    color: "#f3f4f6",
  },
  dayCell: {
    width: CELL_WIDTH,
    height: 40,
    padding: 4,
    borderRightWidth: 1,
    borderRightColor: "#e5e7eb",
    justifyContent: "center",
  },
  dayCellDark: {
    borderRightColor: "#374151",
  },
  bookingChip: {
    padding: 4,
    borderRadius: 4,
    marginVertical: 2,
  },
  bookingText: {
    color: "white",
    fontSize: 12,
    fontWeight: "500",
  },
  dropdown: {
    borderColor: "#d1d5db",
    backgroundColor: "#ffffff",
  },
  dropdownContainer: {
    borderColor: "#d1d5db",
    backgroundColor: "#ffffff",
  },
});
