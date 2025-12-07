# SalonHub

## Overview
SalonHub is a full-stack platform (web + mobile) designed to connect customers with salons for discovery, appointment booking, and service management. Its primary purpose is to enhance the customer experience and streamline salon operations through a comprehensive system that includes event management, secure payment processing, and a robust review system. The platform features native mobile applications for Android and iOS.

## User Preferences
I prefer an iterative development approach where features are built and reviewed incrementally. Please ensure that all new features include comprehensive testing. For any significant changes or architectural decisions, please ask for my approval before implementation. I value clear, concise explanations and well-documented code.

## System Architecture
The application utilizes a full-stack architecture with separate web and mobile clients.

**UI/UX Decisions:**
- Optimized homepage for user conversion with a simplified hero section and new components like `USPStrip`, `TrendingServicesCarousel`, and `TestimonialChips`.
- Modular event management system with dedicated pages for speakers, tickets, and schedules.
- Modern toast notifications and inline field-level validation for improved error handling.
- Consistent navigation across the platform.
- Softened page gradients maintain design consistency.

**Technical Implementations:**
- **Web Frontend**: React 18 with Vite, Tailwind CSS, Radix UI, and TanStack Query for state management.
- **Mobile Frontend**: React Native + Expo with TypeScript, Expo Router for navigation, and AsyncStorage for persistence.
    - **Key Features**: Tab-based navigation, comprehensive event management system (discovery, details, registration, ticketing, feedback), OTP-based onboarding and authentication, location-based salon discovery with smart radius, a full-fledged e-commerce Shop feature with secure payment flows and order tracking, and a comprehensive Profile system including Wallet, Notifications, and editable user profiles.
    - **Customer Engagement**: Loyalty & Rewards program, Favorites system for salons/stylists, and a Referral program.
    - **Performance Optimizations**: Hermes engine, TanStack Query for offline-first capabilities, Reanimated 3 for native animations, `expo-image` for optimized images, memoized context, and FlashList integration for efficient list rendering.
- **Backend**: Express.js (Node.js) API.
- **Database**: PostgreSQL (Neon Serverless) with Drizzle ORM.
- **Project Structure**: Organized into `client/`, `mobile/`, `server/`, `shared/`, `migrations/`, and `attached_assets/`.
- **Event Management System**: Supports event creation, check-in, and analytics for both customer and admin interfaces.
- **Payment Integration**: Razorpay with HMAC signature verification, multi-layer amount validation, and atomic reservation.
- **Review System**: Allows confirmed attendees to submit multi-aspect ratings with photo uploads.
- **Attendee Export**: Exports attendee lists in various formats (Excel, PDF).
- **QR Code Security**: Timestamped and cryptographically signed QR codes for tickets.
- **Nearby Salons Discovery**: Uses the Haversine formula for distance calculation.
- **Validation**: Zod for schema validation across forms.
- **Real-time Chat System**: Socket.IO-based real-time messaging between customers and salons.
    - **Database Tables**: `chat_conversations`, `chat_participants`, `chat_messages`, `chat_message_reads`
    - **Security**: JWT token verification for Socket.IO connections, REST routes protected by authenticateMobileUser middleware
    - **Features**: Typing indicators, read receipts, online/offline presence, message history with pagination
    - **Web Components**: `ChatWidget` (inline, resizable customer widget), `ChatInbox` (staff message management)
    - **Real-time Events**: message:send, message:new, typing:start/stop, presence:update, conversation:join/leave
- **Smart Rebooking System**: AI-powered rebooking recommendations to increase customer retention.
    - **Database Tables**: `rebooking_settings`, `service_rebooking_cycles`, `customer_rebooking_stats`, `rebooking_reminders`
    - **Business Dashboard**: Salon owners can configure rebooking cycles per service, enable/disable reminders, set discount incentives
    - **Customer Experience**: "Recommended for You" carousel on homepage with personalized suggestions based on booking history
    - **Automation**: Scheduled jobs for daily reminder generation and status updates (approaching/due/overdue)
    - **Features**: Snooze/dismiss options, preferred staff tracking, preferred time slot detection, discount incentives for overdue rebookings
    - **API Endpoints**: `/api/rebooking/suggestions`, `/api/rebooking/dismiss`, `/api/rebooking/settings/:salonId`, `/api/rebooking/analytics/:salonId`
- **Shop Admin RBAC System**: Role-based access control for multi-user salon management.
    - **Database Tables**: `shop_admin_assignments` (user-salon-role mapping), `permissions` (permission definitions), `role_permissions` (role-permission mapping), `permission_audit_log` (change tracking)
    - **User Roles**: Business Owner (full access), Shop Admin (configurable permissions), Staff (limited view access)
    - **Permission Categories**: bookings, services, staff, reports, settings, customers, inventory, financials, marketing, admin
    - **Permission Actions**: view, create, edit, cancel (where applicable)
    - **Backend Services**: `server/services/rbacService.ts` handles permission checking, role management, and comprehensive audit logging
    - **Middleware**: `requireSalonAccess(['owner'])`, `requireBusinessOwner`, `checkSalonPermission` for layered route protection
    - **API Endpoints**: All routes include salonId in URL path for proper middleware protection:
      - `GET /api/shop-admins/:salonId/admins` - List shop admins (owner/shop_admin only)
      - `POST /api/shop-admins/:salonId/assign` - Assign role (owner only)
      - `POST /api/shop-admins/:salonId/revoke` - Revoke role (owner only)
      - `POST /api/shop-admins/:salonId/update-role` - Update role (owner only)
      - `GET /api/shop-admins/:salonId/audit-logs` - View audit logs (owner only)
      - `GET /api/shop-admins/:salonId/my-permissions` - Get current user's permissions
    - **Frontend Components**: `ShopAdminManagement.tsx` (owner UI for managing admins), `useSalonPermissions` hook for permission checks
    - **Security Features**: Layered middleware chains, explicit business owner verification, comprehensive audit logging for role changes and privileged actions (bookings, services, staff, settings)

## External Dependencies
- **Database**: PostgreSQL (Neon Serverless)
- **Payment Gateway**: Razorpay
- **AI Services**: Google Gemini API, OpenAI API
- **Communication Services**: SendGrid (Email), Twilio (SMS)
- **Mapping/Location**: Google Places API (web), `expo-location` (mobile)
- **Document Generation**: `exceljs`, `pdfkit`
- **Mobile Push Notifications**: Expo Push Notifications