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
