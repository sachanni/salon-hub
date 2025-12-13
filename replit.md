# StudioHub - Beauty & Wellness Booking Platform

## Copyright
Copyright (c) 2025 Aulnova Techsoft Ind Pvt Ltd
Website: https://aulnovatechsoft.com/

All rights reserved. This source code is proprietary and confidential.

## Overview
StudioHub is a comprehensive beauty and wellness booking platform that allows customers to discover and book services at studios, while providing business owners with tools to manage their establishments.

## Tech Stack
- **Frontend**: React 18 with TypeScript, Vite, TailwindCSS
- **Backend**: Express.js with TypeScript, running on Bun runtime
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: JWT-based with access/refresh tokens
- **Real-time**: Socket.IO for chat functionality
- **Payments**: Razorpay integration
- **Email**: SendGrid
- **SMS**: Twilio
- **Maps**: Mapbox, Google Places API
- **AI Features**: Google Gemini API, OpenAI

## Project Structure
```
├── client/          # React frontend (Vite)
│   └── src/
│       ├── components/  # UI components
│       ├── pages/       # Page components
│       ├── contexts/    # React contexts
│       └── lib/         # Utilities
├── server/          # Express backend
│   ├── routes/      # API routes
│   ├── services/    # Business logic
│   └── middleware/  # Auth, etc.
├── shared/          # Shared types and schema
│   └── schema.ts    # Drizzle database schema
└── migrations/      # Database migrations
```

## Development Commands
- `bun run dev` - Start development server (port 5000)
- `bun run build` - Build for production
- `bun run start` - Start production server
- `bun run db:push` - Push database schema changes

## Environment Variables
The following environment variables are configured:
- `DATABASE_URL` - PostgreSQL connection (Replit secret)
- `JWT_ACCESS_SECRET` - JWT access token secret
- `JWT_REFRESH_SECRET` - JWT refresh token secret
- Various API keys in `.env` file (SendGrid, Twilio, Razorpay, Google, Mapbox, etc.)

## Deployment
- Deployment target: Autoscale
- Build command: `bun run build`
- Run command: `bun run start`

## Recent Changes
- 2025-12-13: Trending Studios with Real Salon Data
  - Replaced dummy/placeholder service cards in TrendingServicesCarousel with real salon data
  - Uses /api/salons endpoint with minRating=4.0 filter to show top-rated studios
  - Displays up to 8 salons in a horizontal carousel with SalonCard component
  - Location-aware: fetches nearby salons when user grants location permission
  - Loading state with spinner while fetching data
  - Gracefully hides section if no salons found
- 2025-12-13: Membership Package System (Complete Feature)
  - 6 new database tables: membership_plans, membership_plan_services, customer_memberships, membership_service_usage, membership_credit_transactions, membership_payments
  - 3 plan types: discount (percentage off), credit (beauty bank), packaged (included services)
  - Business Dashboard: Full membership management UI with plan creation, editing, member list, analytics
  - Customer UI: MembershipPlansCard (purchase on salon profile), CustomerMemberships (manage in dashboard)
  - Booking Integration: API endpoint POST /api/salons/:salonId/calculate-membership-benefits for discount preview
  - Service methods: getActiveMembershipForBooking, calculateMembershipBenefits, applyMembershipToBooking
  - Proper quota tracking for packaged plans (handles duplicate services in same booking)
  - Pause/Resume/Cancel actions with confirmation dialogs
- 2025-12-13: Sidebar Navigation Improvements (Industry Standard)
  - Made accordion controlled - auto-expands section containing active tab
  - Fixed focus loss when selecting navigation options
  - Reorganized navigation structure: Financial Management is now a separate top-level section
  - Financial Dashboard and Staff Commissions moved from Analytics to their own section
  - Analytics & Reports section now focused on Advanced Analytics and ML Predictions
- 2025-12-13: Subscription Management UI (Full-Flash Ready)
  - Pause/Resume subscription buttons with confirmation modals
  - Cancel subscription with refund estimate preview
  - Status indicators: active, paused, canceled, grace period
  - Refund modal shows eligibility, amount breakdown, and remaining days
  - React Query mutations for all subscription actions
  - Toast notifications for success/error feedback
- 2025-12-13: Razorpay Full-Flash Subscription System
  - Prorated refund calculation (7-day full refund window, then prorated for unused days)
  - Razorpay webhook handler at /api/payment/webhooks/razorpay with signature verification
  - Webhook idempotency via razorpay_webhook_events table to prevent duplicate processing
  - Subscription pause/resume functionality (max 90-day pause)
  - Failed payment retry and dunning management (max 3 retries before downgrade)
  - 3-day grace period for cancelled subscriptions
  - New database tables: subscription_refunds, razorpay_webhook_events
  - New API endpoints: refund-estimate, process-refund, pause, resume (authenticated)
  - Security: All refund/pause/resume endpoints require salon access authentication
- 2025-12-13: ML Analytics Dashboard (Premium Feature)
  - New dashboard for salon owners to visualize ML prediction accuracy
  - Components: Overview KPI Cards, Prediction Accuracy Chart, Staff Performance Panel, Service Timing Heatmap
  - Backend service: MLAnalyticsService with aggregation queries
  - API endpoints: /api/premium-analytics/* (overview, accuracy, staff, timing-trends)
  - Premium tier gating: Professional, Premium, and Enterprise plans only
  - Date range filtering (7, 14, 30, 90 days) with consistent filtering across all endpoints
  - TanStack Query hooks with auto-refresh and smart caching
  - Documentation: docs/features/ml-analytics-dashboard.md
- 2025-12-12: Smart Queue-Based Departure Notification System
  - Predictive system that tells customers when to leave for appointments
  - Analyzes real-time queue status and staff availability
  - New database tables: staff_queue_status, departure_alerts, departure_alert_settings, customer_departure_preferences
  - Services: QueueCalculatorService, DepartureCalculatorService, DepartureNotificationService
  - API endpoints for departure status, customer preferences, salon settings
  - Background cron jobs run every 5 minutes for queue recalculation and alert sending
  - Notification channels: push notifications, SMS, in-app
  - Documentation: docs/features/smart-departure-notification.md
- 2025-12-12: Fresha.com style salon cards with time slots
  - Each service now shows available time slots (up to 3 services shown)
  - Time slot buttons styled as pill-shaped buttons matching fresha.com
  - Clicking time slot navigates to salon page with pre-selected service and time
  - Added "..." menu button (MoreVertical icon) when more slots are available
  - "See all X services" link for salons with more than 3 services
- 2025-12-12: Map view scroll fix (fresha.com style)
  - Implemented CSS Grid layout for split-view: `grid-cols-[60%_40%]`
  - Parent container uses `h-screen flex flex-col overflow-hidden`
  - Search bar uses `flex-shrink-0` to maintain fixed height
  - SalonMapView fills remaining space with `flex-1 overflow-hidden`
  - Sidebar has `overflow-y: auto` (via ScrollArea) for independent scrolling
  - Map uses `sticky top-0` and stays fixed while cards scroll
- 2025-12-12: Copyright protection added
  - Updated package.json with Aulnova Techsoft Ind Pvt Ltd company details
  - Created proprietary LICENSE file
  - Added copyright headers to key source files (server/index.ts, routes.ts, client/src/main.tsx, App.tsx, shared/schema.ts)
  - Rebranded from SalonHub to StudioHub
- 2025-12-11: Mobile "Running Late" feature complete
  - Created LateArrivalButton and LateArrivalModal React Native components
  - Added lateArrivalAPI service with proper error handling for all endpoints
  - Button shows only for today's confirmed/pending bookings before appointment time
  - Modal features: delay selection, ETA calculation, optional message, success/error states
  - IST timezone normalization for date comparisons
  - Backend routes at `/api/mobile/late-arrival/*` with mobile JWT authentication
  - Distinguishes network errors (retryable) from eligibility denials (business logic)
- 2025-12-11: Chat system fixes for business dashboard
  - Added `role=staff` query parameter to all chat API calls for proper authorization
  - Fixed socket event names to use canonical `message:new`, `message:ack`, `conversation:join`, `conversation:leave`
  - Implemented optimistic UI for message sending with fallback to REST API
  - Fixed unread count logic: only increments for inactive conversations, auto-clears for active
  - Added conversation room join/leave socket events for proper room management
  - Auto-marks messages as read when viewing active conversation
  - Sound notifications only play for inactive conversations
- 2025-12-11: Mobile package booking feature complete
  - Added mobile package API endpoints (GET /api/mobile/salons/:salonId/packages)
  - Implemented server-side price validation for both package and normal bookings
  - Created PackageCard and PackageDetailModal mobile components
  - Updated SalonDetailScreen with "Packages" tab
  - Updated BookingDetailsScreen and PaymentScreen for package pricing
  - Security: Server recomputes totals from database, ignoring client-supplied values
- 2024-12-11: Initial Replit setup complete
  - Database provisioned and schema deployed
  - Bun runtime configured for better compatibility
  - Environment variables configured
  - Deployment configuration set up

## Notes
- The app uses Bun runtime instead of Node.js for better TypeScript support
- Frontend runs on port 5000 with Vite HMR in development
- All API routes are prefixed with `/api/`
