# SalonHub - Beauty & Wellness Booking Platform

## Overview

SalonHub is a comprehensive beauty and wellness service marketplace that connects customers with salons, spas, and beauty professionals. The platform enables seamless service discovery, booking, payment processing, and business management for the beauty industry.

**Core Value Proposition:**
- Customers: Discover and book beauty services with real-time availability, secure payments, and personalized recommendations
- Businesses: Manage appointments, staff, inventory, customer relationships, and financial operations through an all-in-one dashboard
- Platform: Marketplace with intelligent matching, AI-powered personalization, and automated business optimization

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Technology Stack:**
- React 18+ with TypeScript for type-safe component development
- Wouter for lightweight client-side routing
- TanStack Query (React Query) for server state management and caching
- Tailwind CSS with shadcn/ui component library for consistent design system
- Vite as the build tool and development server

**Key Design Patterns:**
- Component-based architecture with atomic design principles
- Context providers for global state (AuthContext for authentication)
- Custom hooks for reusable business logic
- Form validation using react-hook-form with Zod schemas
- Responsive-first mobile design with progressive enhancement

**UI Component System:**
- Radix UI primitives for accessible, unstyled components
- Custom theme with CSS variables for dark/light mode support
- Service-specific imagery system mapping categories to professional stock photos
- Gradient-based visual hierarchy (purple-to-rose brand colors)

### Backend Architecture

**Framework & Runtime:**
- Node.js with Express.js for HTTP server
- TypeScript for type safety across frontend and backend
- ESM module system for modern JavaScript features

**API Design:**
- RESTful API endpoints organized by domain (salons, bookings, payments, etc.)
- Role-based access control middleware (requireSalonAccess, requireStaffAccess, requireSuperAdmin)
- Session-based authentication with memory store (development) and external session storage (production)
- Request/response validation using Zod schemas

**Data Layer:**
- Drizzle ORM for type-safe database queries and migrations
- Neon PostgreSQL as primary database with connection pooling
- Schema-first approach with shared TypeScript types between frontend/backend
- Optimistic database indexes for high-traffic queries (services, bookings, payments)

**Key Architectural Decisions:**

1. **Monorepo Structure**: Single codebase with `/client`, `/server`, and `/shared` directories enables code sharing and consistent types across stack

2. **Shared Schema**: Database schema definitions in `/shared/schema.ts` generate TypeScript types consumed by both frontend and backend, eliminating type drift

3. **Service Layer Pattern**: Business logic encapsulated in dedicated services (`storage.ts`, `geocodingService.ts`, `communicationService.ts`) rather than inline in route handlers

4. **Middleware-Based Auth**: Authentication logic centralized in `/server/middleware/auth.ts` with role-checking functions that populate `req.user` for downstream handlers

5. **Template-Driven Services**: Comprehensive service catalog pre-loaded via `serviceTemplatesData.ts` (500+ services across 11 categories) enables quick salon onboarding

### Core Business Features

**Multi-Sided Marketplace:**
- Customer-facing booking flow with location-based salon discovery
- Business dashboard for salon owners with calendar, bookings, analytics
- Staff management with role-based service assignments and availability patterns
- Super admin panel for platform oversight and approval workflows

**Booking Engine:**
- Real-time availability calculation based on staff schedules and resource constraints
- Service packages with multi-service bundling and discounts
- Recurring appointments and bulk booking support
- Status transitions (pending → confirmed → completed → cancelled) with validation

**Payment Integration:**
- Razorpay payment gateway for Indian market (UPI, cards, wallets)
- Two-phase payment verification (order creation + signature verification)
- Wallet system for customer credits and refunds
- Commission tracking and salon payout management

**Location Services:**
- Proximity-based search with Haversino distance calculation
- Google Places API integration for accurate geocoding
- Redis caching layer for location lookups to reduce API costs
- Support for 147 hardcoded Delhi NCR locations as fallback

**Communication System:**
- Multi-channel messaging (email via SendGrid, SMS via Twilio)
- Template-based campaigns with variable substitution
- Customer segmentation for targeted marketing
- Scheduled messages and automated follow-ups
- A/B testing framework with variant generation and statistical winner selection

**AI-Powered Features:**
- Personal Look Advisor using Google Gemini API with multi-provider fallback (Gemini 2.5 Flash primary, OpenAI GPT-4o backup)
- AR Virtual Try-On using MediaPipe Face Mesh (468-point facial landmark detection)
  - MediaPipe FaceMesh for accurate facial landmark detection (lips, eyes, cheeks, face oval)
  - Professional 2D canvas makeup rendering with natural blending modes
  - **Lipstick**: Multiply blend mode with precise lip contour tracing (excludes teeth/inner lip)
    - Optional lip liner with darker shade, follows exact outer lip boundary
  - **Blush**: Radial gradient overlays on cheekbones with overlay blend mode
  - **Eyeliner**: 5 professional styles with industry-standard rendering techniques
    - **Basic**: Clean filled line with gradient thickness (thicker at outer corner)
    - **Classic**: Medium thickness with subtle lower lash definition (Sephora/MAC standard)
    - **Winged**: Filled triangle wing shape (18% eye width length, 15-20° upward angle)
    - **Cat-Eye**: Bold dramatic wing (28% eye width, 25-30° angle, filled shapes)
    - **Smokey**: 3-layer kajal effect with smudged blend (base + halo + lower lash line)
    - Techniques: Gradient thickness, filled shapes (not stroked lines), multi-layer opacity rendering, lower lash line definition for complete eye makeup
    - Inspired by: YouCam Makeup, Sephora Virtual Artist, ModiFace, Banuba AR SDK approaches
  - **Foundation**: Soft-light blend mode for natural skin tone enhancement
  - User customization controls: Eyeliner style selector (5 options), Lip liner toggle (yes/no)
  - Typical render time: 200-500ms for static images
  - Fallback handling: Shows original photo + AI recommendations if face not detected
- Product recommendations based on skin tone, hair type, and occasion
- Beauty product catalog (500+ products) with gender-specific filtering

### Data Storage & Caching

**Primary Database (PostgreSQL via Neon):**
- 60+ tables covering users, salons, services, bookings, payments, inventory, communications, analytics
- Normalized schema with foreign key constraints
- JSON columns for flexible metadata (service options, booking metadata, communication preferences)
- Timestamp tracking on all entities for audit trails

**Session Storage:**
- In-memory session store (development)
- Database-backed sessions table for production persistence
- 30-day session TTL with automatic cleanup

**Caching Strategy:**
- Redis integration for geocoding results (reduces Google Places API costs)
- Location aliases table for canonical place_id-based caching
- Client-side localStorage for user location preferences (versioned cache busting)
- TanStack Query for automatic server state caching with configurable stale times

**Version Management:**
- App version tracking (`utils/versionManager.ts`) to invalidate stale localStorage data
- TTL-based expiration for cached location data (24 hours)
- Automated cleanup of old non-versioned keys on app load

### External Dependencies

**Google Services:**
- **Google Places API**: Location search, geocoding, and place details (primary location service)
- **Google Gemini API**: AI-powered look recommendations and content generation
- **Google OAuth**: Social login (via @react-oauth/google)

**Payment Gateway:**
- **Razorpay**: Payment processing for Indian market (orders, payments, refunds, payouts)

**Communication Services:**
- **SendGrid**: Transactional and marketing emails (email verification, booking confirmations, campaigns)
- **Twilio**: SMS delivery for booking reminders and OTP (mentioned in schema, not fully implemented)

**Firebase:**
- **Firebase Admin SDK**: Server-side phone number verification
- **Firebase Client SDK**: Client-side phone authentication with reCAPTCHA

**Mapping & Visualization:**
- **Mapbox**: Alternative geocoding service (configured but not primary)
- **Leaflet**: Map rendering for location selection

**Authentication:**
- **Replit Auth**: OAuth-based authentication for Replit environment (optional, not production)

**Database:**
- **Neon PostgreSQL**: Serverless Postgres with connection pooling and WebSocket support
- Configured via `EXTERNAL_DATABASE_URL` or `DATABASE_URL` environment variables

**Development Tools:**
- **Drizzle Kit**: Database migrations and schema management
- **Vite**: Frontend build tool with HMR and plugin ecosystem
- **TSX**: TypeScript execution for server and scripts
- **Zod**: Runtime type validation for API inputs and form data

**Monitoring & Analytics:**
- Platform analytics tracked in `communication_analytics` table
- Booking trends and revenue metrics for admin dashboard
- A/B test performance monitoring with automated winner selection

**Infrastructure Assumptions:**
- Node.js 18+ runtime environment
- Environment variables for API keys and database credentials
- HTTPS/SSL for production (Razorpay and Firebase requirements)
- Serverless-friendly architecture (stateless request handlers, connection pooling)