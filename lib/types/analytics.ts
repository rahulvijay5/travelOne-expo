// export interface BookingAnalytics {
//   totalBookings: number;
//   canceledBookings: number;
//   totalRevenue: number;
//   averageRevenue: number;
//   occupancyRate: number;
// }

// export interface RealTimeAnalytics {
//   totalBookings: number;
//   canceledBookings: number;
//   totalRevenue: number;
//   averageRevenue: number;
//   occupancyRate: number;
// }

// export interface AnalyticsResponse {
//   precomputedData: BookingAnalytics[];
//   realTimeData: RealTimeAnalytics;
// }

// export interface OccupancyData {
//   totalRooms: number;
//   totalAvailableRooms: number;
//   totalBookedRooms: number;
//   pendingBookings: number;
//   confirmedBookings: number;
//   cancelledBookings: number;
//   completedBookings: number;
//   occupancyRate: number;
// } 

export type Timeframe = 'today' | 'tomorrow' | 'thisWeek' | 'currentMonth';

export interface AnalyticsResponse {
  revenue: number;
  totalBookings: number;
  pendingBookings: number;
  occupancyRate: number;
  confirmedBookings: number;
  completedBookings: number;
  cancelledBookings: number;
  availableRooms: number;
  calculatedAt: string; // ISO Date string
}