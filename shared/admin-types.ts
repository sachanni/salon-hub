// Super Admin TypeScript Types

export interface PlatformStats {
  totalBookings: number;
  totalRevenue: number;
  totalUsers: number;
  totalSalons: number;
  pendingApprovals: number;
  activeUsers: number;
  bookingTrends: Array<{ date: string; count: number; revenue: number }>;
}

export interface AdminSalon {
  id: string;
  name: string;
  description?: string;
  city?: string;
  approvalStatus?: 'pending' | 'approved' | 'rejected';
  approvalNotes?: string;
  totalBookings: number;
  totalRevenue: number;
  ownerName?: string;
  createdAt?: Date | string;
  isActive?: number;
}

export interface AdminUser {
  id: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  isActive: number;
  createdAt?: Date | string;
  roles?: string[];
  totalSpending?: number;
  totalBookings?: number;
}

export interface AdminBooking {
  id: string;
  customerId: string;
  customerName?: string;
  salonId: string;
  salonName?: string;
  serviceNames?: string[];
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  startDateTime: Date | string;
  totalAmountPaisa: number;
  createdAt?: Date | string;
}

export interface AdminPayout {
  id: string;
  salonId: string;
  salonName?: string;
  amountPaisa: number;
  status: 'pending' | 'approved' | 'paid' | 'rejected';
  requestDate?: Date | string;
  approvalDate?: Date | string;
  notes?: string;
  rejectionReason?: string;
}

export interface AdminOffer {
  id: string;
  salonId?: string;
  salonName?: string;
  title: string;
  description?: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  minimumPurchase?: number;
  maxDiscount?: number;
  validFrom: Date | string;
  validUntil: Date | string;
  isActive: number;
  isPlatformWide: number;
  usageLimit?: number;
  usageCount?: number;
  approvalStatus?: 'pending' | 'approved' | 'rejected';
  approvalNotes?: string;
  approvedBy?: string;
  approvedAt?: Date | string;
  rejectedBy?: string;
  rejectedAt?: Date | string;
  createdBy?: string;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}
