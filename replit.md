# SalonHub

## Overview
SalonHub is a full-stack platform (web + mobile) connecting customers with salons for discovery, appointment booking, and service management. It aims to enhance the customer experience and streamline salon operations by offering a comprehensive system including event management, secure payment processing, and a robust review system. The platform features native mobile apps for Android and iOS, built with React Native and Expo.

## User Preferences
I prefer an iterative development approach where features are built and reviewed incrementally. Please ensure that all new features include comprehensive testing. For any significant changes or architectural decisions, please ask for my approval before implementation. I value clear, concise explanations and well-documented code.

## System Architecture
The application employs a full-stack architecture with distinct web and mobile clients.

**UI/UX Decisions:**
- **Homepage Redesign**: Optimized for user conversion with a simplified hero section ("Book Beauty Services In 30 Seconds"), new components like `USPStrip`, `TrendingServicesCarousel`, and `TestimonialChips`. Strategic reordering of sections prioritizes social proof and urgency. An A/B testing framework is integrated for future optimizations.
- **Event Management**: Features a modular hub-and-spoke design for event creation and management, including dedicated pages for speakers, tickets, and schedules, with real-time completion tracking.
- **Validation and Error Handling**: Modern toast notifications and inline field-level validation errors replace traditional browser alerts.
- **Navigation**: Consistent navigation across business management sections, with a "Salons" button in the main header and customer-facing event listings.
- **Design Consistency**: Softened page gradients match the platform's overall theme.

**Technical Implementations:**
- **Web Frontend**: React 18 with Vite, styled using Tailwind CSS and Radix UI, state managed by TanStack Query.
- **Mobile Frontend**: React Native + Expo with TypeScript, Expo Router for navigation, and AsyncStorage for persistence. Supports iOS and Android.
    - **Onboarding Flow**: Production-level sequence including splash carousel, location/notification permission requests, and OTP-based phone verification.
    - **Home Screen**: Displays real salon data with 7 UI sections (Header, Hero, Search & Filter, Browse Categories, Special Offers, Recently Viewed, Recommended).
    - **Filter System**: Bottom sheet modal for date, time, and category selection with client-side filtering and debounced search.
    - **GPS Location (Mobile-Specific)**: Automatic location detection using expo-location with permission handling, 5-minute caching, reverse geocoding, and fallback to Delhi coordinates. Displays detected city/area in header with loading/error states and tap-to-refresh. Passes coordinates to backend for distance-based salon sorting.
      - **Smart Radius System**: Default 10km search (optimal for salon services), auto-expands to 20km if <8 results found. User can manually select 5km/10km/20km via filter chips. Expansion message shown when radius widens automatically.
    - **Authentication**: OTP-based phone verification, persistent auth state via AsyncStorage, and JWT access/refresh tokens stored securely with automatic token refresh.
    - **Shop Feature (Mobile)**: Complete e-commerce flow with 11 screens including product discovery, cart management, wishlist, checkout with shipping options, dual payment methods ("Pay Now" simulated flow and "Pay at Salon"), order tracking with timeline, and product reviews. All prices displayed in Indian Rupees (₹).
      - **Phase 1 Security & Stability (COMPLETED - December 2025)**: Production-ready implementation with XSS vulnerability fixes (HTML escaping), WebView navigation guards (Razorpay subdomain whitelisting), 60-second timeout with proper cleanup, offline detection and retry with network revalidation, Zod-based JSON validation preventing crashes, cart validation (empty/stock checks) before payment, and double-submit prevention via submission lock. All critical security issues resolved and architect-approved.
      - **Phase 2 Type Safety & Validation (COMPLETED - December 2025)**: Comprehensive TypeScript type system with 30+ interfaces, eliminated all 'any' types across shop screens, cart staleness validation using useFocusEffect to prevent stale checkouts, Indian-specific validation (phone regex `/^[6-9]\d{9}$/`, pincode regex `/^[1-9][0-9]{5}$/`), enhanced error handling with retry mechanisms, typed error extraction from API responses, and actionable user messages. Architect-approved production-ready quality.
      - **Phase 3 UX Polish & Optimistic Updates (COMPLETED - December 2025)**: Created reusable LoadingSkeleton component (shimmer animation, ProductCardSkeleton, ProductListSkeleton, CategoryChipSkeleton) and EmptyState component (icon, title, message, optional action button). Implemented optimistic updates for cart operations (quantity changes, item removal) and wishlist toggles with automatic rollback on API failure. Enhanced loading states in ShopHomeScreen and ProductListingScreen with skeletons replacing spinners. Added FilterBottomSheet component with price range filters (Under ₹500 to Above ₹5000), minimum rating filters (1-4+ stars), brand filters (multi-select chips), and sort options (price asc/desc, rating, popularity). Client-side filtering and sorting with active filter count badge. Architect-approved with zero regressions.
      - **Toast Notification System (COMPLETED - December 2025)**: Custom non-blocking toast notification system replacing all Alert.alert dialogs across shop screens. Features include ToastProvider with context-based useToast hook, four toast types (success/error/warning/info) with industry-standard colors, animated slide-in/fade transitions, auto-dismiss (3s default, configurable), action button support for confirmations, multiple toast stacking, and manual dismiss. Clear cart uses toast-based confirmation with action button to prevent accidental deletion. All error/validation messages stay in context without forced navigation, providing actionable guidance. Architect-approved production-ready implementation.
    - **Development Limitations**: In-memory OTP storage and console logging for OTPs (requires production upgrades like Redis/Twilio). Razorpay "Pay Now" flow simulates payment (requires Razorpay API keys for production).
- **Backend**: Express.js (Node.js) handles API requests.
- **Database**: PostgreSQL (Neon Serverless) with Drizzle ORM.
- **Project Structure**: Organized into `client/`, `mobile/`, `server/`, `shared/`, `migrations/`, and `attached_assets/`.
- **Event Management System**: Comprehensive system for both customer-facing and business admin pages, including event creation, check-in, and analytics.
- **Payment Integration**: Razorpay integration with HMAC signature verification, multi-layer amount validation, and atomic reservation for security, including a 30-minute payment window and background cleanup for expired registrations.
- **Review System**: Allows confirmed attendees to submit multi-aspect ratings with photo uploads.
- **Attendee Export**: Exports attendee lists in Excel, PDF, and check-in sheet formats with authorization.
- **QR Code Security**: QR code generation with timestamp expiration and cryptographic signing for tickets.
- **Nearby Salons Discovery**: Uses the Haversine formula for distance calculation to display nearby salons.
- **Validation**: Zod is used extensively for schema validation across multi-step forms.

## External Dependencies
- **Database**: PostgreSQL (Neon Serverless)
- **Payment Gateway**: Razorpay
- **AI Services**: Google Gemini API, OpenAI API (Optional)
- **Communication Services**: SendGrid (Email), Twilio (SMS - for mobile OTP)
- **Mapping/Location**: Google Places API (web), expo-location (mobile)
- **Document Generation**: `exceljs`, `pdfkit`
- **Mobile Push Notifications**: Expo Push Notifications