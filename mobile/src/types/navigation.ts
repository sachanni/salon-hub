export type RootStackParamList = {
  SplashCarousel: undefined;
  LocationPermission: undefined;
  NotificationPermission: undefined;
  MobileVerification: undefined;
  OTPVerification: { phoneNumber: string };
  Home: undefined;
  SalonDetail: { salonId: string };
  ServicesList: { salonId: string; salonName: string };
  BookingDetails: {
    salonId: string;
    salonName: string;
    selectedServices: SelectedService[];
  };
  Payment: {
    salonId: string;
    salonName: string;
    selectedServices: SelectedService[];
    bookingDate: string;
    bookingTime: string;
    staffId?: string;
  };
  BookingConfirmation: {
    bookingId: string;
  };
  BeautyProfile: undefined;
};

export interface SelectedService {
  id: string;
  name: string;
  durationMinutes: number;
  priceInPaisa: number;
  currency: string;
  category?: string;
}

export interface Salon {
  id: string;
  name: string;
  description?: string;
  address: string;
  city: string;
  state: string;
  phone: string;
  email: string;
  category: string;
  rating: string;
  reviewCount: number;
  imageUrl?: string;
  imageUrls?: string[];
  latitude?: string;
  longitude?: string;
  distance?: number;
  openTime?: string;
  closeTime?: string;
  priceRange?: string;
  venueType?: string;
  instantBooking?: number;
}

export interface Service {
  id: string;
  name: string;
  description?: string;
  durationMinutes: number;
  priceInPaisa: number;
  currency: string;
  category?: string;
  subCategory?: string;
  gender?: string;
  imageUrl?: string;
  isActive: number;
  priceType?: string;
  depositPercentage?: number;
}

export interface StaffMember {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  title?: string;
  bio?: string;
  expertise?: string[];
  rating?: string;
  reviewCount?: number;
  profilePicture?: string;
  isActive: number;
}

export interface SalonReview {
  id: string;
  salonId: string;
  rating: number;
  comment?: string;
  source: string;
  googleAuthorName?: string;
  googleAuthorPhoto?: string;
  isVerified: number;
  createdAt: string;
  customerName?: string;
}

export interface ServicePackage {
  id: string;
  salonId: string;
  name: string;
  description?: string;
  regularPriceInPaisa: number;
  packagePriceInPaisa: number;
  totalDurationMinutes: number;
  discountPercentage?: number;
  regularPrice: number;
  packagePrice: number;
  savings: number;
  savingsPercentage: number;
  validFrom?: string;
  validUntil?: string;
  isActive: boolean;
  serviceCount?: number;
  services?: PackageService[];
}

export interface PackageService {
  id: string;
  name: string;
  description?: string;
  category?: string;
  subCategory?: string;
  priceInPaisa: number;
  price: number;
  durationMinutes: number;
  imageUrl?: string;
  quantity: number;
}

export interface MembershipPlan {
  id: string;
  salonId: string;
  name: string;
  description: string | null;
  planType: 'discount' | 'credit' | 'packaged';
  durationMonths: number;
  priceInPaisa: number;
  billingType: 'one_time' | 'monthly';
  monthlyPriceInPaisa: number | null;
  discountPercentage: number | null;
  creditAmountInPaisa: number | null;
  bonusPercentage: number | null;
  priorityBooking: number;
  isActive: number;
  includedServices?: MembershipPlanService[];
}

export interface MembershipPlanService {
  id: string;
  serviceId: string;
  quantityPerMonth: number;
  isUnlimited: number;
  serviceName: string;
  servicePrice: number;
}

export interface CustomerMembership {
  id: string;
  planId: string;
  customerId: string;
  salonId: string;
  status: 'active' | 'paused' | 'cancelled' | 'expired';
  startDate: string;
  endDate: string;
  pausedAt: string | null;
  resumedAt: string | null;
  cancelledAt: string | null;
  remainingCreditsInPaisa: number | null;
  createdAt: string;
  plan: MembershipPlan;
  salon: {
    id: string;
    name: string;
    imageUrl?: string;
  };
  serviceUsage?: MembershipServiceUsage[];
}

export interface MembershipServiceUsage {
  serviceId: string;
  serviceName: string;
  usedThisMonth: number;
  quantityPerMonth: number;
  isUnlimited: number;
}
