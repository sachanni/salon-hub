# SalonHub Mobile App (React Native + Expo)

Production-level React Native mobile application for SalonHub with comprehensive onboarding flow.

## 📱 Features

### Onboarding Flow (First-Time Installation)
1. **Splash Carousel** - 3 animated slides introducing the app
2. **Location Permission** - Request location access with Precise/Approximate options
3. **Notification Permission** - Push notification setup with animated UI
4. **Mobile Verification** - Phone number input with validation
5. **OTP Verification** - 4-digit OTP with auto-focus, paste support, and resend timer

### Technical Features
- ✅ TypeScript for type safety
- ✅ Expo Router for navigation
- ✅ AsyncStorage for persistent state
- ✅ Native permissions (Location, Notifications)
- ✅ Production-ready authentication flow
- ✅ API integration with existing Express backend
- ✅ Animated UI components
- ✅ Industry-standard code architecture

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ installed
- Expo CLI (`npm install -g expo-cli`)
- iOS Simulator (Mac) or Android Emulator

### Installation

1. Navigate to mobile directory:
\`\`\`bash
cd mobile
\`\`\`

2. Install dependencies:
\`\`\`bash
npm install
\`\`\`

3. Set up environment variables:
Create a `.env` file in the mobile directory:
\`\`\`env
EXPO_PUBLIC_API_URL=http://YOUR_SERVER_IP:5000
\`\`\`

Replace `YOUR_SERVER_IP` with:
- For iOS simulator: `localhost` or `127.0.0.1`
- For Android emulator: `10.0.2.2`
- For physical device: Your computer's local IP address

4. Add required image assets:
The following placeholder images need to be added to \`mobile/src/assets/\`:
- \`splash1.png\` - Woman getting hair styled (1080x1920px)
- \`splash2.png\` - Man getting haircut (1080x1920px)
- \`splash3.png\` - Spa/wellness scene (1080x1920px)
- \`map-bg.png\` - Minimalist city map illustration
- \`precise-map.png\` - Zoomed-in street view map
- \`approximate-map.png\` - Zoomed-out city view map
- \`icon.png\` - App icon (1024x1024px)
- \`adaptive-icon.png\` - Android adaptive icon (1024x1024px)
- \`splash.png\` - Splash screen (1242x2436px)
- \`notification-icon.png\` - Notification icon (96x96px)

5. Start the development server:
\`\`\`bash
npm start
\`\`\`

6. Run on device/simulator:
- Press \`i\` for iOS simulator
- Press \`a\` for Android emulator
- Scan QR code with Expo Go app for physical device

## 📂 Project Structure

\`\`\`
mobile/
├── app/                          # Expo Router pages
│   ├── _layout.tsx              # Root layout with AuthProvider
│   ├── index.tsx                # Entry point with auth routing
│   ├── home.tsx                 # Home screen (post-onboarding)
│   └── onboarding/              # Onboarding flow screens
│       ├── _layout.tsx
│       ├── splash.tsx
│       ├── location.tsx
│       ├── notification.tsx
│       ├── mobile-verification.tsx
│       └── otp-verification.tsx
├── src/
│   ├── screens/                 # Screen components
│   │   ├── SplashCarouselScreen.tsx
│   │   ├── LocationPermissionScreen.tsx
│   │   ├── NotificationPermissionScreen.tsx
│   │   ├── MobileVerificationScreen.tsx
│   │   └── OTPVerificationScreen.tsx
│   ├── contexts/                # React contexts
│   │   └── AuthContext.tsx     # Authentication & onboarding state
│   ├── services/                # API services
│   │   └── api.ts              # Axios setup + auth endpoints
│   ├── types/                   # TypeScript definitions
│   │   └── auth.ts
│   └── assets/                  # Images, fonts, etc.
├── app.json                     # Expo configuration
├── package.json
└── tsconfig.json
\`\`\`

## 🔌 Backend Integration

The mobile app connects to the existing Express backend:

### Required Backend Endpoints
\`\`\`
POST /api/auth/request-otp
POST /api/auth/verify-otp
POST /api/auth/resend-otp
\`\`\`

### Backend Setup
Make sure your Express server (from the main SalonHub project) is running and accessible from the mobile app's network.

## 🎨 Design System

### Colors
- Primary Purple: \`#8B5CF6\`
- Primary Pink: \`#EC4899\`
- Dark: \`#111827\`
- Gray variants: \`#6B7280\`, \`#9CA3AF\`, \`#E5E7EB\`

### Typography
- Font: Inter (system fallback: system-ui, sans-serif)
- Weights: 400 (regular), 500 (medium), 600 (semibold), 700 (bold), 900 (black)

### Border Radius
- Small: 12px
- Medium: 16px
- Large: 24px
- XL: 32px
- Full: 9999px (pill shape)

## 🧪 Testing

### Manual Testing Checklist
- [ ] Splash carousel auto-advances every 4 seconds
- [ ] Location permission request works on both iOS and Android
- [ ] Precise/Approximate toggle updates selection
- [ ] Notification permission request shows native dialog
- [ ] Phone number validation accepts only 10-digit numbers starting with 6-9
- [ ] OTP inputs auto-focus on type
- [ ] OTP paste functionality works
- [ ] Resend timer counts down from 27 seconds
- [ ] Successful OTP verification navigates to home screen
- [ ] Onboarding state persists across app restarts

## 📱 Building for Production

### iOS
\`\`\`bash
eas build --platform ios
\`\`\`

### Android
\`\`\`bash
eas build --platform android
\`\`\`

### Both Platforms
\`\`\`bash
eas build --platform all
\`\`\`

## 🔐 Permissions

### iOS (Info.plist)
- \`NSLocationWhenInUseUsageDescription\` - Location access for finding nearby salons
- \`NSLocationAlwaysUsageDescription\` - Background location for better recommendations

### Android (AndroidManifest.xml)
- \`ACCESS_FINE_LOCATION\` - Precise location access
- \`ACCESS_COARSE_LOCATION\` - Approximate location access
- \`POST_NOTIFICATIONS\` - Push notifications (Android 13+)

## 🔄 State Management

Uses React Context API for:
- Authentication state
- User profile
- Onboarding completion tracking
- Permission status (location, notifications)

Persisted to AsyncStorage for:
- User data
- Onboarding completion flag
- Permission preferences

## 🚀 Next Steps

1. **Add remaining screens**: Salon browse, booking, profile, etc.
2. **Integrate maps**: Google Maps or Mapbox for salon discovery
3. **Add payment**: Razorpay mobile SDK integration
4. **Push notifications**: Configure FCM/APNs
5. **Offline support**: Cache salon data for offline browsing
6. **Deep linking**: Handle salon/booking deep links
7. **Analytics**: Add Firebase Analytics or similar

## 📄 License

Part of the SalonHub platform - proprietary and confidential.
