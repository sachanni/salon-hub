# SalonHub - Beauty & Wellness Booking Platform

## Overview
SalonHub is a booking platform for beauty and wellness services, inspired by marketplaces like Airbnb. It allows customers to discover and book appointments at local establishments with integrated payment processing. The project aims to deliver a sophisticated, full-stack web application with real-time booking, a robust design system, and secure transactions, targeting the beauty and wellness market.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### UI/UX Decisions
- **Design System**: Custom professional purple/rose gradient scheme with Inter and Source Sans Pro typography, light theme, pastel gradients, and soft animated elements.
- **Responsiveness**: Mobile-first adaptive layouts.
- **Key UI Elements**: Fresha-inspired date/time pickers, compact calendars, and professional dashboards.
- **Salon Profile**: Fresha.com/Luzo.app inspired profile with hero image gallery, sticky navigation (top-0), Fresha-style sticky booking sidebar with production-ready sticky implementation:
  - **Sticky Positioning (Oct 2025)**: Grid-based layout with `lg:sticky lg:top-[88px]` provides precise 88px offset for sticky behavior below navigation bar on large screens
  - **Height Management**: `lg:max-h-[calc(100vh-120px)]` with `lg:overflow-y-auto` ensures sidebar content scrolls when exceeds viewport height, matches sticky offset
  - Displays salon name, rating with stars, intelligent day-based open/closed status with 60-second updates that checks businessHours for current day
  - Book now button, contact info, address with Google Maps directions integration
  - Google-style business hours display
- **Search Bar & Map Layout**: Consistent positioning for search dropdowns and Fresha-inspired map proportions with a compact sidebar.
- **Image Carousel**: Interactive image carousel on salon cards.

### Technical Implementations
- **Frontend**: React 18 with TypeScript, Wouter for routing, TanStack Query for state management, Radix UI primitives with Tailwind CSS, and Vite.
- **Backend**: Node.js with Express.js, TypeScript, RESTful API design, Drizzle ORM.
- **Database**: PostgreSQL via Neon serverless infrastructure (Drizzle Kit for schema management). Prices stored in `priceInPaisa`, duration in `durationMinutes`.
- **Authentication & Security**: Express sessions with PostgreSQL store, server-side price validation, Zod schemas, and CORS.
- **Firebase Phone Authentication (Nov 2025)**: Production-ready Firebase Phone Auth integration for both customer and business registration with:
  - **Client-side**: Reusable `PhoneVerification` component with OTP input, send/verify buttons, and invisible reCAPTCHA
  - **Server-side**: Firebase Admin SDK integration for secure token verification before account creation
  - Phone number formatting to E.164 international format (auto-adds +91 for India)
  - 6-digit OTP verification with Firebase Auth
  - Resend OTP functionality with 30-second cooldown timer
  - Comprehensive error handling for invalid phone, expired OTP, quota exceeded
  - Integration in both `JoinCustomer.tsx` and `JoinBusiness.tsx` registration pages
  - Form validation requiring phone verification before account creation
  - Firebase token passed to backend and verified server-side for enhanced security
  - Server verifies phone number matches between token and form submission
  - Sets `phoneVerified = 1` in database only after successful server-side verification
  - Module: `server/firebaseAdmin.ts` with `verifyFirebaseToken()` and `getPhoneNumberFromToken()` functions
  - Updated `/api/auth/register` endpoint with token verification middleware
  - Component: `PhoneVerification.tsx` with loading states and success feedback
- **Firebase Email Verification (Nov 2025)**: Production-ready email verification system using Firebase Authentication with:
  - **Welcome Email System**: Automatically sends verification email after successful registration
  - **Firebase Integration**: Uses Firebase Auth's `createUserWithEmailAndPassword()` and `sendEmailVerification()` methods
  - **Email Service Module**: `client/src/lib/emailVerification.ts` with `sendWelcomeEmailWithVerification()`, `checkEmailVerificationStatus()`, and `resendVerificationEmail()` functions
  - **Verification Flow**: User receives email with verification link → clicks link → redirected to `/email-verified` page → email marked as verified in Firebase
  - **Email Verification Page**: `/email-verified` route displays success/failed status with appropriate UI feedback
  - **Dual User System**: Creates Firebase user for email verification while maintaining database user for application data
  - **Database Field**: `emailVerified` column tracks verification status (0 = pending, 1 = verified)
  - **Error Handling**: Graceful handling of invalid email, weak password, network errors with user-friendly messages
  - **Resend Functionality**: Built-in support for resending verification emails if needed
  - **Integrated with Registration**: Both `JoinCustomer.tsx` and `JoinBusiness.tsx` automatically send welcome emails post-registration
  - **No External Dependencies**: Uses Firebase only, no SendGrid or other email service required
  - **Customizable Landing Page**: Verification link redirects to configurable URL (defaults to `/email-verified`)
- **Setup Wizard Architecture**: Standardized prop interface for steps, React Query for data pre-population.
- **Time Slot Management**: Timezone-safe handling, dynamic generation based on salon hours (30-minute intervals), and robust date parsing/formatting.
- **Real-Time Booking Availability**: Production-ready slot conflict detection with 15-second polling, comprehensive overlap prevention, and staff-aware availability.
- **Multi-Day Booking**: Supports any future date, dynamically generates slots from `businessHours` JSONB, checks existing bookings, and displays color-coded slots.
- **Interactive Calendar Component**: Professional month view with quick-selects, month navigation, past-date prevention, and timezone-safe date normalization.
- **Mapbox Maps Integration**: Fresha-style minimalist map using Mapbox GL JS and react-map-gl for salon location display, featuring numbered markers, interactive popups, user location tracking, clustering, "Search This Area" functionality, and turn-by-turn directions via Mapbox Directions API.

### Feature Specifications
- **Service Search**: Two-level search with main categories and sub-services.
- **Location Features**: Reverse geocoding ("Current location"), dynamic GPS, and 2-layer search (Delhi NCR + Google Places API).
- **8-Step Business Setup System**: Unified onboarding wizard with server-side validation, templates, smart description generator, and business hours picker.
- **Staff Management**: Professional system with auto-suggested roles and photo upload.
- **Booking Settings**: Comprehensive policy management with smart auto-suggestion of 4 booking presets.
- **Media & Gallery System**: Professional photo management with dual upload, drag & drop, batch upload, compression, base64 encoding, and smart categories.
- **Package/Combo System**: Full-page creation wizard for bundled services.
- **Multi-Service Booking API**: Endpoint supporting multiple service selection with server-side validation.
- **Resources Management**: Modern system with intelligent service-to-resource mapping and quick setup templates.
- **Enhanced Search Results**: Fresha-style UX displaying rich salon information, media gallery, top 3 services, interactive time slot chips, and real-time open/closed status badges.
- **Advanced Filtering System**: Comprehensive filter panel with 4 sort options, max price slider, venue type pills, and booking options.
- **Category Tabs Navigation**: Horizontal tabs for quick filtering.
- **Offer Integration System**: Production-ready discount system with a 2-tier approval workflow for platform-wide and salon-specific offers. Includes server-side validation for eligibility, minimum purchase, and discount calculation with a `maxDiscount` cap. Stores offer snapshots with bookings and tracks usage.
- **Super Admin Panel**: Production-ready single-page dashboard with URL-based routing, modern sidebar, and defensive data handling. Features authentication, dashboard overview, business management (salon approval workflow), user management, booking analytics, and offers management (CRUD operations with comprehensive creation dialog and validation).
- **Business Offers Management**: Card-based embedded UI in the BusinessDashboard for creating, editing, deleting, and toggling salon-specific offers with approval status display and robust numeric validation. **Date Handling Fix (Oct 2025)**: Implemented explicit date conversion in storage layer (`createSalonOffer` method) to ensure ISO string dates from frontend are properly converted to Date objects before database insertion, preventing Drizzle ORM `toISOString is not a function` errors.
- **Phone Verification System**: Production-ready OTP verification for the booking flow with a dedicated `otpVerifications` table, 5-minute OTP expiry, 5 attempt limit, 30-second resend cooldown, and server-enforced verification before booking.
- **Service Image Auto-Assignment (Oct 2025)**: Intelligent service image system that automatically assigns professional Unsplash stock images to services based on service type/name. Features:
  - Comprehensive image library (`shared/service-images.ts`) with 100+ curated images mapped to 66+ service sub-categories
  - Auto-assignment logic in `createService` method matches service names to appropriate images
  - Images displayed across all customer-facing pages:
    - SalonProfile page: 96x96px service thumbnails
    - Business setup wizard (ServicesStep): 48x48px service icons
    - SalonBookingPage: 64x64px service selection cards
    - ServicesSelection page: 80x80px service cards
    - BookingPage checkout: 64x64px service summaries
    - Search results (SalonCard): 48x48px service previews with top 3 services
  - All existing services backfilled with appropriate images
  - Graceful handling of missing images with optional imageUrl field
  - Backend includes imageUrl in all service API responses for comprehensive coverage
- **Platform Offers Carousel (Oct 2025)**: Luzo.app-inspired carousel for platform-wide offers on SalonProfile page. Features:
  - Positioned below gallery images, before sticky navigation
  - Displays only platform-wide offers (isPlatformWide = 1) in swipeable carousel
  - Auto-play: 3-second intervals with continuous loop
  - **Luzo-style Design (Oct 2025)**: Larger cards (p-4 padding), w-12 h-12 checkmark containers with w-7 h-7 icons, text-based pagination ("1/2" format) replacing dots
  - Card sizing: Shows ~2 cards on desktop (lg:flex-[0_0_45%]) for better visual prominence
  - Green checkmark icons with shadow, purple/pink gradient card design with hover effects
  - Embla carousel with text pagination showing current/total count
  - Salon-specific offers separated in dedicated "Salon Exclusive Offers" tab
  - Component: `PlatformOffersCarousel.tsx` with proper filtering and responsive design
- **All Offers Page (Oct 2025)**: Comprehensive offers discovery page with Luzo.app-inspired design. Features:
  - **Navigation**: Prominent green "Offers" button in header for easy access
  - **Hero Section**: Luzo-style hero with "Save up to 60%" messaging and how-to-avail steps
  - **Category Filtering**: Horizontal tabs for All, Salons, Spas, Clinics, and Nail Spas
  - **Offer Cards**: Rich salon cards displaying:
    - Salon logo/image with fallback
    - Discount badge (% or ₹ off)
    - Salon name, rating with stars, and location
    - Blue CTA button "Get X% OFF via SalonHub"
  - **API Endpoint**: `/api/offers/all-with-salons` joins active/approved offers with salon metadata
  - **Storage Method**: `getAllOffersWithSalons()` with comprehensive salon information
  - Component: `AllOffersPage.tsx` with loading/error states and responsive design
  - Route: `/all-offers` for direct access

## External Dependencies
- **Razorpay**: Payment gateway.
- **Neon Database**: Serverless PostgreSQL.
- **@neondatabase/serverless**: PostgreSQL driver.
- **Radix UI**: Unstyled UI primitives.
- **Tailwind CSS**: Utility-first CSS framework.
- **Lucide React**: Icon library.
- **React Hook Form**: Form management.
- **Date-fns**: Date utilities.
- **Mapbox GL JS**: Interactive maps library.
- **react-map-gl**: React wrapper for Mapbox.
- **supercluster**: Point clustering library for map markers.
- **Firebase**: Phone authentication and OTP verification.
- **SMS Provider (Deprecated)**: Replaced with Firebase Phone Auth for registration OTP verification. The existing booking flow OTP system (with `otpVerifications` table) remains for booking confirmation.