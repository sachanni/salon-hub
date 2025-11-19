# SalonHub - Beauty & Wellness Booking Platform

## Overview

SalonHub is a comprehensive salon booking and management platform that connects customers with beauty and wellness service providers. The platform facilitates service discovery, online booking, payment processing, and business management for salons across India, with a primary focus on the Delhi NCR region.

**Core Purpose**: Enable seamless booking experiences for customers while providing salon owners with powerful tools for business management, staff scheduling, inventory tracking, and customer engagement.

**Technology Stack**: 
- Frontend: React + TypeScript + Vite + Tailwind CSS + shadcn/ui
- Backend: Node.js + Express + TypeScript
- Database: PostgreSQL (Neon serverless)
- ORM: Drizzle
- Payment: Razorpay
- Location Services: Google Places API / Mapbox
- Authentication: Firebase Admin (phone), email verification via SendGrid
- AR/AI Features: Banuba SDK, Google Generative AI

## User Preferences

Preferred communication style: Simple, everyday language.

## Recent Changes (November 19, 2025)

### Inventory Management System - COMPLETED ✅

Implemented complete production-grade inventory management functionality with multi-tenant security and transaction safety:

**Phase 1 - Product Categories**:
- Full CRUD operations with parent-child hierarchy support
- Soft delete with cascade validation (prevents deletion if products exist)
- Default category seeding (8 standard salon categories: Hair Care, Skin Care, Nail Care, Makeup, Spa & Wellness, Professional Tools, Retail Products, Other)
- All operations properly scoped by salonId for multi-tenant security

**Phase 2 - Vendor Management**:
- Complete vendor CRUD with contact information and payment terms
- Soft delete via status='inactive' instead of hard delete
- Cascade validation prevents deletion if vendor has pending purchase orders
- Multi-tenant security with salon scoping

**Phase 3 - Product Management**:
- SKU uniqueness validation per salon (prevents duplicate SKUs within same salon)
- Advanced filtering: by category, vendor, low stock alert, full-text search (name, SKU, brand, barcode)
- Stock changes BLOCKED in product updates - enforces use of stock movements for complete audit trail
- Soft delete with purchase order validation
- Support for retail items, barcode scanning, minimum/maximum stock levels, reorder points
- Low stock product queries for inventory alerts

**Phase 4 - Stock Movement System** (CRITICAL):
- Transaction-based stock updates with row-level locking (SELECT FOR UPDATE)
- Prevents race conditions in high-concurrency scenarios (concurrent movements serialize correctly)
- Complete audit trail: every movement records previousStock → newStock transition
- Movement types: purchase, usage, waste, adjustment, return, transfer
- Negative stock prevention with optional override for corrections
- All movements properly reference products with salon validation

**Phase 5 - Purchase Order System**:
- Complete PO lifecycle: draft → approved → received (state machine enforced)
- Vendor and product validation prevents cross-tenant references
- Transaction safety for PO creation (PO + line items created atomically)
- Auto-calculation of totals (subtotal, tax, shipping, discount)
- Receiving workflow: updates PO status, records actual delivery date, creates stock movements with row locking, updates product stock levels atomically
- Only draft POs can be edited/deleted
- Only approved POs can be received

**Security Improvements**:
- All operations properly scoped by salonId (no cross-tenant data leakage)
- Foreign key validation for vendors and products before mutations
- Immutable field stripping (salonId, stock levels, approval fields)
- Optional salonId pattern for future admin/system operations
- Fixed critical security bugs: search filter bypass, vendor validation gap

**Data Integrity Improvements**:
- Database transactions ensure atomic operations (all-or-nothing commits)
- Row-level locking prevents concurrent update corruption
- Cascade validation prevents orphaned records
- Audit trails maintain accurate stock history
- State machines enforce valid workflow transitions

**Implementation Notes**:
- All code in `server/storage.ts` (DatabaseStorage class methods)
- Follows established patterns from existing codebase
- Server tested and running successfully on port 5000
- No compilation errors or runtime issues
- Ready for API route integration and frontend UI development

## System Architecture

### Frontend Architecture

**Component Organization**: React functional components with hooks-based state management. UI components use shadcn/ui library built on Radix UI primitives for accessibility and consistency. The application follows a route-based structure with Wouter for client-side routing.

**Key Design Patterns**:
- Context-based authentication (`AuthContext`) for user session management
- React Query for server state management and caching
- Custom hooks for reusable business logic
- Version-controlled localStorage for client-side data persistence with TTL expiration
- Responsive design using Tailwind's utility-first approach

**State Management**: 
- Global auth state via React Context
- Server data via TanStack Query with automatic cache invalidation
- Local UI state via useState/useReducer
- Persistent user preferences in versioned localStorage (cache busting on breaking changes)

### Backend Architecture

**Server Design**: Express-based REST API with middleware-driven request processing. Uses middleware mode Vite integration for seamless development experience.

**Authentication Flow**:
- Phone authentication via Firebase Admin SDK token verification
- Email/password authentication with bcrypt hashing
- Session management using express-session with MemoryStore
- Role-based access control (RBAC) with middleware guards for staff, salon owners, and super admins

**Route Organization**:
- Main routes in `server/routes.ts` handle core business logic
- Specialized routes in `server/routes/` for modular features (AI Look, automation)
- Middleware layers for authentication, salon access verification, and role checking

**Key Services**:
- `storage.ts`: Centralized database access layer abstracting Drizzle ORM operations
- `communicationService.ts`: Email (SendGrid) and SMS (Twilio) messaging with template support
- `geocodingService.ts`: Location resolution with canonical place_id-based caching to prevent coordinate duplication
- `offerCalculator.ts`: Dynamic pricing with platform-wide and salon-specific offer calculations
- Automation services for A/B testing campaigns, variant generation, and performance monitoring

### Data Storage Solutions

**Primary Database**: PostgreSQL via Neon serverless (pooled connections)

**Schema Design Philosophy**:
- Normalized relational structure with foreign key constraints
- UUID primary keys generated via `gen_random_uuid()`
- Timestamp tracking (created_at, updated_at) for audit trails
- Soft deletes via `is_active` flags where appropriate
- JSON columns for flexible metadata storage (templates, configurations)

**Key Domain Models**:
- **Users & Auth**: users, roles, user_roles, email_verification_tokens, sessions
- **Business Entities**: salons, staff, organizations, org_users
- **Services**: services, service_templates, service_packages, package_services
- **Bookings**: bookings, booking_services, booking_settings, availability_patterns, time_slots
- **Payments**: payments (Razorpay integration), tax_rates, payout_accounts
- **Financial**: expenses, expense_categories, commissions, commission_rates, budgets
- **Communication**: message_templates, communication_campaigns, communication_history, scheduled_messages, customer_segments
- **Inventory**: products, product_categories, vendors, purchase_orders, stock_movements
- **AI/AR Features**: beauty_products, ai_look_sessions, ai_look_options, salon_inventory, effect_presets
- **Location**: user_saved_locations, geocode_locations, location_aliases (canonical place_id mapping)

**Caching Strategy**:
- Geocoding results cached with place_id as canonical identifier to prevent duplicate coordinates for same location
- Performance indexes on high-traffic queries (services by salon, bookings by date/time, payments by order ID)
- Redis support available but optional for API response caching

### Authentication & Authorization

**Multi-Method Authentication**:
1. Firebase phone authentication (primary for customers)
2. Email/password with SendGrid verification emails
3. Session-based persistence via express-session

**Security Measures**:
- Password hashing with bcrypt
- JWT-style token verification for Firebase ID tokens
- CSRF protection via session cookies
- Rate limiting considerations for production deployment
- Email verification required for password reset flows

**Role-Based Access Control**:
- `populateUserFromSession`: Attaches user and roles to request object
- `requireStaffAccess`: Ensures user has staff privileges for a salon
- `requireSalonAccess`: Validates salon ownership
- `requireSuperAdmin`: Platform administrator access

### External Dependencies

**Payment Processing**:
- Razorpay for Indian market payment acceptance
- Webhook verification via signature validation
- Order creation, payment capture, and refund flows
- Amount stored in paisa (smallest currency unit) for precision

**Communication Services**:
- SendGrid for transactional and marketing emails (API key required)
- Twilio for SMS notifications (optional, not fully implemented)
- Template-based messaging with variable substitution
- Campaign management with A/B testing and performance tracking

**Location & Mapping**:
- Google Places API for address autocomplete and geocoding (recommended)
- Mapbox as alternative for geocoding (free tier sufficient for MVP)
- Canonical location caching via place_id to ensure coordinate accuracy
- Proximity-based salon search with Haversine distance calculations

**AI & Computer Vision**:
- Google Generative AI (Gemini) for personalized beauty recommendations
- Banuba SDK for AR makeup try-on and virtual hairstyle previews
- Product recommendation engine based on skin tone, event type, and customer preferences
- MediaPipe Face Mesh for facial landmark detection (used with Banuba)

**Database Hosting**:
- Neon serverless PostgreSQL (primary, via `EXTERNAL_DATABASE_URL`)
- Fallback to Replit's built-in PostgreSQL (`DATABASE_URL`)
- Connection pooling with configurable timeouts for serverless optimization
- WebSocket support via `ws` library for Neon compatibility

**Development Tools**:
- Drizzle Kit for database migrations
- Vite with HMR for fast frontend development
- TypeScript for type safety across client and server
- Replit-specific integrations (auth, cartographer, error overlay)

**Environment Configuration**:
- Firebase service account JSON for server-side phone verification
- SendGrid API key and verified sender email
- Razorpay key ID and secret for payment processing
- Google Places API key (or Mapbox token) for location services
- Banuba client token for AR features
- Database connection strings (EXTERNAL_DATABASE_URL preferred)
- APP_URL for email verification link generation

**Feature Flags & Configuration**:
- Automation features (A/B testing, variant generation) controlled via `automation_configurations` table
- Communication preferences per customer in `communication_preferences`
- Business settings per salon in `booking_settings`, `publish_state`
- Optional Redis for advanced caching scenarios