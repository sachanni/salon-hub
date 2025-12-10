# SalonHub

## Overview
SalonHub is a full-stack platform (web and native mobile applications for Android/iOS) designed to revolutionize the salon industry. It connects customers with salons for discovery, appointment booking, and comprehensive service management. The platform aims to enhance the customer experience and streamline salon operations through features like event management, secure payment processing, a robust review system, and AI-powered recommendations. Its business vision is to become the leading platform for beauty and wellness services, offering a seamless and integrated experience for both customers and salon businesses.

## User Preferences
I prefer an iterative development approach where features are built and reviewed incrementally. Please ensure that all new features include comprehensive testing. For any significant changes or architectural decisions, please ask for my approval before implementation. I value clear, concise explanations and well-documented code.

## System Architecture
The application employs a full-stack architecture with distinct web and mobile clients, a Node.js Express backend, and a PostgreSQL database.

**UI/UX Decisions:**
- Optimized user interfaces with a focus on conversion, consistent navigation, and modern design elements (e.g., softened gradients, modular components).
- Implementation of modern toast notifications and inline field-level validation for enhanced user feedback.

**Technical Implementations:**
- **Web Frontend**: React 18 with Vite, Tailwind CSS, Radix UI, and TanStack Query.
- **Mobile Frontend**: React Native + Expo with TypeScript, Expo Router for navigation, and AsyncStorage for persistence. Features include tab-based navigation, comprehensive event management, OTP authentication, location-based salon discovery, e-commerce shop, loyalty programs, and performance optimizations using Hermes, Reanimated 3, and FlashList.
- **Backend**: Express.js (Node.js) API.
- **Database**: PostgreSQL (Neon Serverless) with Drizzle ORM.
- **Project Structure**: Organized into `client/`, `mobile/`, `server/`, `shared/`, `migrations/`, and `attached_assets/`.
- **Core Features**:
    - **Event Management System**: Supports creation, check-in, and analytics.
    - **Payment Integration**: Razorpay with HMAC verification and multi-layer validation.
    - **Review System**: Multi-aspect ratings with photo uploads for confirmed attendees.
    - **QR Code Security**: Timestamped and cryptographically signed QR codes for tickets.
    - **Nearby Salons Discovery**: Utilizes the Haversine formula.
    - **Validation**: Zod for schema validation.
    - **Real-time Chat System**: Socket.IO-based messaging with features like typing indicators, read receipts, and presence.
    - **Smart Rebooking System**: AI-powered recommendations, configurable rebooking cycles, and automated reminders.
    - **Shop Admin RBAC System**: Role-based access control for multi-user salon management with distinct roles (Business Owner, Shop Admin, Staff) and comprehensive permission management with audit logging.
    - **Job Card System**: Front desk management for salon operations, handling job card lifecycle, service/product management, split payments, staff tips, and automated commission calculation/inventory deduction upon completion.
    - **Customer Onboarding System**: Bulk import via CSV, Twilio-integrated invitation campaigns (WhatsApp/SMS), welcome offer engine, and analytics dashboard for conversion tracking.
    - **Commission & Payout Management System**: Comprehensive tracking of staff commissions, tips, bonuses, and deductions. Includes a full payout workflow, configurable commission rates, manual adjustments, and detailed reporting with Excel/PDF export.

## Revenue & Analytics Architecture
The platform uses a dual-source data model for tracking salon activity:

**Bookings vs Job Cards:**
- **Bookings**: Represent reservations/appointments (expected activity). Revenue from bookings is "expected" - not yet realized.
- **Job Cards**: Represent actual service delivery (realized activity). Job cards are the **source of truth for revenue**.

**Revenue Calculation Rules:**
- **Realized Revenue**: ONLY counted from job cards with status='completed' AND paymentStatus='paid'
- **Expected Revenue**: From confirmed bookings that haven't been converted to job cards yet
- **Pending Revenue**: From job cards in progress (service started but not yet paid)

**Analytics Data Structure:**
All analytics functions separate booking and job card metrics:
- `bookingCount`: Number of reservations
- `jobCardCount`: Number of actual services delivered
- `realizedRevenuePaisa`: Revenue from completed & paid job cards only
- `expectedRevenuePaisa`: Revenue from pending bookings

**Type Safety Note:**
PostgreSQL aggregate functions (SUM, COALESCE, AVG) return strings via Drizzle ORM. Always use `parseFloat(String(...))` for numeric conversions.

## Planned Features (Roadmap)

### Subscription Tiers (Implemented)
- **Status**: Implemented
- **Three-tier model**:
  - **Free**: Basic listing, standard booking, up to 3 staff & 10 services
  - **Growth (₹999/mo)**: Instagram & Facebook "Book Now" buttons, social analytics, up to 10 staff & 50 services
  - **Elite (₹1999/mo)**: All Growth features + Reserve with Google, Messenger chatbot, API access, unlimited staff/services
- **Billing**: Razorpay recurring payments with 14-day free trial option
- **Tables**: `subscription_tiers`, `salon_subscriptions`, `subscription_payments`

### Instagram/Facebook Booking Integration (Implemented)
- **Status**: Implemented for Growth & Elite tiers
- **Documentation**: `docs/features/instagram-facebook-booking.md`
- **Features**:
  - Meta OAuth 2.0 flow with encrypted token storage (AES-256)
  - Webhook receiver with HMAC-SHA256 signature verification
  - Real-time booking sync from social platforms
  - Analytics dashboard (clicks, bookings, revenue by source)
- **Tables**: `meta_integrations`, `meta_booking_refs`, `meta_webhook_events`, `social_booking_analytics`
- **Routes**: `/api/subscriptions/*`, `/api/meta/*`

### Reserve with Google (Premium Feature) - Planned for Elite Tier
- **Status**: Planning Phase
- **Documentation**: `docs/features/reserve-with-google.md`
- **Description**: Allow customers to book salon appointments directly from Google Search and Maps
- **Timeline**: 12-16 weeks
- **Included in Elite tier** (₹1999/mo)

### Other Planned Features
- Waitlist Management
- Recurring Memberships/Subscriptions
- Digital Consultation Forms
- Before/After Photo Gallery
- Off-Peak/Dynamic Pricing
- Multi-Location Dashboard
- Staff Clock-In/Out Timesheets

## External Dependencies
- **Database**: PostgreSQL (Neon Serverless)
- **Payment Gateway**: Razorpay
- **AI Services**: Google Gemini API, OpenAI API
- **Communication Services**: SendGrid (Email), Twilio (SMS/WhatsApp)
- **Mapping/Location**: Google Places API, `expo-location`
- **Document Generation**: `exceljs`, `pdfkit`
- **Mobile Push Notifications**: Expo Push Notifications