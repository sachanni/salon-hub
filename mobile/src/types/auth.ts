export interface User {
  id: string;
  phoneNumber: string;
  name?: string;
  email?: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  hasCompletedOnboarding: boolean;
}

export interface OnboardingPermissions {
  location: 'granted' | 'denied' | 'pending';
  locationPrecision: 'precise' | 'approximate';
  notifications: 'granted' | 'denied' | 'pending';
}
