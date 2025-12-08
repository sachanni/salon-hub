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
- **Job Card System**: Complete front desk management system for salon operations.
    - **Database Tables**: `job_cards`, `job_card_services`, `job_card_products`, `job_card_payments`, `job_card_tips`, `job_card_activity_log`
    - **Job Card Lifecycle**: Open → In-Service → Pending Checkout → Completed (or Cancelled)
    - **Check-in Methods**: Booking check-in, walk-in registration, QR self-check-in (`/checkin/:salonId`)
    - **Service Management**: Add/remove services with pricing, staff assignment, and duration tracking
    - **Product Sales**: Sell retail products with automatic inventory deduction on completion
    - **Split Payments**: Support for Cash, Card, UPI, Wallet with multiple payment records per job card
    - **Staff Tips**: Track tips per staff member with payment method recording
    - **On Completion Features**:
      - Staff commission auto-calculation (hierarchical rate lookup: staff+service → staff default → salon default → 10%)
      - Inventory deduction for products sold (when trackStock enabled)
      - Feedback email notification with beautiful HTML template
      - Payment re-validation before closing
    - **API Endpoints**: All routes under `/api/job-cards/:salonId/...`:
      - `POST /check-in` - Create job card from booking or walk-in
      - `GET /job-cards` - List job cards with filters
      - `GET /job-cards/:jobCardId` - Get full job card details with services, products, payments
      - `POST /job-cards/:jobCardId/services` - Add service to job card
      - `DELETE /job-cards/:jobCardId/services/:id` - Remove service
      - `POST /job-cards/:jobCardId/products` - Add product to job card
      - `POST /job-cards/:jobCardId/payments` - Process split payment
      - `POST /job-cards/:jobCardId/tips` - Add staff tip
      - `PUT /job-cards/:jobCardId/status` - Update job card status
      - `POST /job-cards/:jobCardId/complete` - Complete job card (commission, inventory, feedback)
      - `GET /job-cards/:jobCardId/bill` - Get itemized bill
    - **Frontend Components**: `FrontDeskPanel` (active job cards, check-in, checkout tabs), `JobCardDrawer` (service/product management), `WalkInDialog` (quick walk-in registration)
    - **Security**: All routes protected by `requireSalonAccess()` middleware
- **Customer Onboarding System**: Complete bulk import and invitation system for migrating existing customer databases.
    - **Database Tables**: `customer_import_batches`, `imported_customers`, `invitation_campaigns`, `invitation_messages`, `welcome_offers`, `welcome_offer_redemptions`
    - **CSV Bulk Import**: Upload CSV files with phone, name, email columns. Validates phone numbers, deduplicates by normalized phone, tracks import batch stats.
    - **Campaign Sending**: WhatsApp and SMS campaigns via Twilio integration. Track delivery status (pending → sent → delivered → failed).
    - **Welcome Offer Engine**: Create offers (percentage/fixed discount) with validity periods, usage limits, and min purchase requirements. Auto-applied on mobile registration when phone matches imported customer.
    - **Phone Recognition**: Mobile OTP registration flow automatically checks if phone matches imported customer, links accounts, and applies welcome offers.
    - **Security**: Welcome offer auto-apply uses authenticated user's verified phone from database (not request body) to prevent offer hijacking.
    - **Analytics Dashboard**: Full conversion funnel tracking (Imported → Invited → Delivered → Registered → First Booking).
    - **Backend Services**:
      - `server/services/twilioService.ts` - WhatsApp/SMS sending
      - `server/services/customerImportService.ts` - CSV parsing, validation, batch import
      - `server/services/campaignService.ts` - Campaign management and message sending
      - `server/services/welcomeOfferService.ts` - Offer CRUD, redemption, auto-apply
      - `server/services/onboardingAnalyticsService.ts` - Import, campaign, conversion, offer metrics
    - **API Endpoints**:
      - `POST /api/salons/:salonId/customer-import/upload` - Upload CSV file
      - `POST /api/salons/:salonId/customer-import/process` - Process uploaded batch
      - `GET /api/salons/:salonId/customer-import/batches` - List import batches
      - `POST /api/salons/:salonId/campaigns` - Create campaign
      - `POST /api/salons/:salonId/campaigns/:id/send` - Send campaign messages
      - `GET /api/salons/:salonId/welcome-offers` - List offers
      - `POST /api/salons/:salonId/welcome-offers` - Create offer
      - `GET /api/salons/:salonId/onboarding-analytics` - Full analytics dashboard
      - `GET /api/salons/:salonId/onboarding-analytics/funnel` - Conversion funnel
    - **Frontend Components**: `CustomerImportDashboard.tsx` (file upload, preview, batch management)
- **Commission Management System**: Complete staff commission tracking and payout management.
    - **Dashboard Features**: Summary cards showing total commission, pending/paid amounts, staff-wise breakdown
    - **Rate Configuration**: Hierarchical rate system (staff+service specific → staff default → salon default → 10%)
    - **Payout Processing**: Bulk payout by date range with payment method and notes, wrapped in atomic transactions
    - **Date Range Filtering**: Flexible reporting with preset periods (weekly, monthly, quarterly, yearly) and custom ranges
    - **Staff Breakdown**: Per-staff commission summary with services completed, total earned, pending/paid amounts
    - **API Endpoints**: All routes under `/api/salons/:salonId/commissions/...`:
      - `GET /summary` - Aggregate metrics with date filtering (gte/lte operators)
      - `GET /by-staff` - Staff-wise breakdown with left join for profile images
      - `POST /payout` - Process payouts with transaction safety
    - **Frontend Components**: `CommissionManagement.tsx` (tabs for summary, staff breakdown, rate config, payouts)
    - **Security**: Protected by `isAuthenticated` + `requireSalonAccess()` middleware, accessible to business owners and users with financials permission
    - **Navigation**: Available in Analytics & Reports section of Business Dashboard

## External Dependencies
- **Database**: PostgreSQL (Neon Serverless)
- **Payment Gateway**: Razorpay
- **AI Services**: Google Gemini API, OpenAI API
- **Communication Services**: SendGrid (Email), Twilio (SMS)
- **Mapping/Location**: Google Places API (web), `expo-location` (mobile)
- **Document Generation**: `exceljs`, `pdfkit`
- **Mobile Push Notifications**: Expo Push Notifications