export interface DashboardSummary {
  totalBookings: number;
  completedBookings: number;
  completionRate: number;
  totalStaff: number;
  availableStaff: number;
  staffUtilization: number;
  pendingBookings: number;
  avgRating: number | null;
  bookingsTrend: { label: string; bookings: number }[];
  statusBreakdown: { status: string; count: number }[];
}

export interface StaffUtilizationRow {
  staffUserId: string;
  fullName: string;
  phone: string;
  city: string;
  staffCode: string;
  isAvailable: boolean;
  verificationStatus: string;
  totalVisits: number;
  completedVisits: number;
}
