export interface SalonService {
  name: string;
  durationMinutes: number;
  price: number;
  currency: string;
  imageUrl: string | null;
}

export interface Salon {
  id: string;
  name: string;
  rating: number;
  reviewCount: number;
  location: string;
  address: string;
  category: string;
  priceRange: string;
  openTime: string;
  image: string;
  imageUrls: string[];
  latitude: number;
  longitude: number;
  services: SalonService[];
  distance_km?: number;
  hasPackages: boolean;
  hasGoogleReviews: boolean;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
}

export interface SpecialOffer {
  id: string;
  title: string;
  description: string;
  price: string;
  badge: string;
  badgeColor: string;
  icon: string;
  iconColor: string;
}

export interface SalonsApiResponse {
  salons: Salon[];
  total: number;
  error?: string;
}
