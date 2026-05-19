export interface DashboardSummary {
  totalBookings: number;
  completedBookings: number;
  completionRate: number;
  totalStaff: number;
  availableStaff: number;
  staffUtilization: number;
  pendingBookings: number;
  avgRating: number | null;
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
