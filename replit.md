# SalonHub - Beauty & Wellness Booking Platform

## Overview

SalonHub is a modern booking platform for beauty and wellness services, inspired by successful marketplaces like Airbnb. It enables customers to discover and book appointments at local salons, spas, and wellness centers, featuring integrated payment processing. The project aims to provide a sophisticated, full-stack web application with real-time booking capabilities, a robust design system, and secure transactions. The business vision is to capture a significant share of the beauty and wellness market by offering a user-friendly and efficient booking experience for both customers and service providers.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter
- **State Management**: TanStack Query for server state management and caching
- **UI Framework**: Custom design system built on Radix UI primitives with Tailwind CSS
- **Build Tool**: Vite
- **Design System**: Comprehensive component library with a professional purple/rose gradient scheme, Inter and Source Sans Pro typography, and a mobile-first responsive design. Includes Fresha-inspired professional date/time pickers and a light theme with consistent pastel gradients.

### Backend
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript
- **API Design**: RESTful API
- **Database ORM**: Drizzle ORM for type-safe operations
- **Storage**: Abstracted storage interface (in-memory and database implementations)
- **Error Handling**: Centralized middleware

### Database
- **Type**: PostgreSQL via Neon serverless infrastructure
- **Schema Management**: Drizzle Kit
- **Core Tables**: Users, Services, Bookings, Payments.

### Authentication & Security
- **Session Management**: Express sessions with PostgreSQL session store
- **Payment Security**: Server-side price validation
- **Input Validation**: Zod schemas
- **CORS**: Configured for secure cross-origin requests

### Key Features and Design Decisions
- **Fresha-Style Date & Time Pickers**: Professional calendar component with month navigation, quick selection pills ("Any date", "Today", "Tomorrow"), and timezone-aware filtering of time slots.
- **Mobile-Responsive Search Bar**: Adapts layout for mobile and desktop, with date/time side-by-side on mobile.
- **Location Features**: Reverse geocoding for "Current location", dynamic GPS coordinates, and a 2-layer location search (Delhi NCR database + Google Places API fallback).
- **Application-Wide Light Theme**: Consistent light pastel gradient backgrounds, optimized readability with dark text on light backgrounds, soft animated orbs, and subtle texture overlays.
- **Two-Level Service Search (Fresha-Style)**: Categorized service selection (10 main categories and 50+ sub-services) allowing users to drill down from broad categories to specific treatments.
- **Unified 8-Step Setup System**: Complete business onboarding enforcing all required setup before publishing. Features server-side validation through `/api/salons/:id/setup-status` endpoint tracking completion of 8 mandatory steps: (1) Business Info, (2) Location/Contact, (3) Services, (4) Staff, (5) Resources, (6) Booking Settings, (7) Payment Setup, (8) Media. Includes `setup_progress` JSONB column in salons table for authoritative completion tracking. Both setup entry points (BusinessDashboard → Continue Setup and Direct → BusinessSetup) use unified `SetupWizard` component that syncs with API to ensure consistent state. Wizard automatically resumes from first incomplete step and blocks "Go Live" with detailed missing steps modal until all requirements met. Features predefined business templates (Hair Salon, Spa & Wellness), smart description generator, professional business hours picker with India state/city dropdowns, and robust race condition handling preventing 404 errors during first-time registration.
- **Calendar Compacting**: Reduced calendar size for a cleaner, more compact appearance.
- **Google Maps Integration**: Full integration with Google Maps JavaScript API for precise location selection, address autocomplete (India-focused), and GPS coordinate capture (latitude/longitude). Includes visual map preview showing exact business location with marker for confirmation.
- **Intelligent Services & Pricing Page**: Advanced service creation with two-level category selection, smart auto-fill suggestions (50+ services with predefined prices/durations), duration preset buttons (15-120 mins), popular service quick-add templates, and modern visual design with icons and gradients matching platform theme.
- **Advanced Staff Management System**: Professional team member management with photo upload capability, predefined role templates (Stylist, Colorist, Nail Technician, Makeup Artist, Esthetician, Massage Therapist), gradient-themed UI cards, and enhanced visual design. Includes image validation (5MB limit), base64 photo encoding, and responsive 2-column staff grid with professional photo display and contact information.
- **Intelligent Booking Settings System**: Comprehensive booking policy management with 4 smart presets (Hair Salon, Spa & Wellness, Express Services, Premium/VIP), each optimized for business type. Features advanced capabilities including minimum lead time management (prevents last-minute bookings), group booking support (1-20 people), automated reminder system (1-72 hours before), concurrent booking capacity controls, and flexible deposit protection (fixed amount or percentage-based). Includes real-time intelligent recommendations (buffer time alerts, cancellation policy suggestions, no-show reduction tips), visual booking impact preview dashboard, and purple/pink gradient UI matching platform design system. All settings properly persist to database with 7 new columns in booking_settings table.
- **Advanced Media & Gallery System**: Professional photo management with dual upload system (local files + URL), drag & drop interface, batch upload support (multiple files), automatic image compression and optimization (max 1920px, quality 0.7-0.85), base64 encoding for serverless storage. Features 6 smart categories (Cover Photo, Salon Interior, Services & Work, Team Photos, Products, General Gallery) each with unique gradient colors and icons. Includes intelligent suggestions (auto-suggest next needed category), smart tips panel (65% booking increase stats), real-time preview, visual gallery with hover effects, primary photo management with Crown badge, category-based organization, and file validation (image types, 10MB limit). Full purple/pink gradient theme with animated transitions matching platform design. Server configured with 20MB payload limit to support batch uploads.
- **Fresha-Style Salon Profile Page**: Complete transformation matching Fresha.com's exact UX design. Features salon name, rating, hours, and location prominently at the top. Hero gallery displays 1 large primary image with 2 smaller images stacked vertically on the right side, with "See all images" button overlay. Clicking "See all images" opens a beautiful modal dialog displaying all salon photos in a scrollable grid with captions and featured badges. Clean sticky navigation bar with Services, Team, About, and Reviews tabs (Gallery tab removed - images accessible via modal). Includes auto-scroll-spy navigation highlighting active sections, horizontal-scrolling service category pills with instant filtering, professional service cards with hover effects, team member cards with booking integration, sticky booking sidebar with gradient buttons, and smooth scroll-to-section navigation. Full gradient theme (violet-100→pink-100→rose-50) with seamless mobile responsiveness.
- **Stunning Business Dashboard with Modern Sidebar UX**: Complete dashboard redesign with premium profile section featuring user avatar with online status indicator, time-based greeting ("Good Morning/Afternoon/Evening"), business owner name prominently displayed, and business name with location. Sidebar includes quick stats panel showing today's bookings, services count, and staff count in a 3-column grid. Quick Actions panel with gradient buttons for Calendar and Services navigation. Enhanced navigation with purple/pink gradient theme for active items (violet-500→purple-500), status badges (complete/incomplete), progress indicators, and count badges. Premium features teaser section showcasing advanced analytics, loyalty programs, and AI recommendations with upgrade CTA. Dashboard header displays business owner name with gradient text styling, online status indicator, business name with city location, setup progress badge, and action buttons (notifications, settings). All navigation items include completion indicators, animated status dots, and collapsible icon-only mode. Full responsive design with mobile navigation drawer.
- **Package/Combo System**: Comprehensive package management allowing businesses to bundle multiple services from different categories at discounted prices. Features full-page creation wizard (no popups per user requirement), edit functionality with service modification, and production-ready validation. Implements database transactions for atomic operations ensuring data integrity - either all operations succeed or all fail together. Includes Zod validation schemas enforcing minimum 2 services, positive prices less than regular price, and proper field naming (packagePriceInPaisa, regularPriceInPaisa, totalDurationMinutes). Transaction logic handles three scenarios: null/undefined serviceIds (no changes), empty array (remove all services), populated array (replace all services). Built with intelligent platform behavior and robust error handling.
- **Multi-Service Booking API** (`/api/bookings`): Production-ready booking endpoint supporting multiple service selection with SERVER-SIDE PRICE VALIDATION and security. Features: (1) Server-side price revalidation - fetches services from database and validates client prices match server calculations to prevent price manipulation, (2) Server-side duration validation - ensures total duration matches server calculations, (3) StaffId validation - verifies staff exists and belongs to correct salon, (4) Comprehensive input validation for all required fields. **Current Limitation**: Database schema lacks `booking_services` join table, so only primary service is stored in `serviceId` field while additional services are noted in text field. **TODO**: Create proper `booking_services` table with foreign keys for full multi-service referential integrity, proper receipts, scheduling, and analytics.

## External Dependencies

- **Razorpay**: Primary payment gateway for India, integrated with server-side order creation and client-side payment capture.
- **Neon Database**: Serverless PostgreSQL.
- **@neondatabase/serverless**: Database driver for optimal serverless performance.
- **Radix UI**: Unstyled, accessible UI primitives.
- **Tailwind CSS**: Utility-first CSS framework.
- **Lucide React**: Icon library.
- **React Hook Form**: Form state management with validation.
- **Date-fns**: Date manipulation and formatting.
- **Replit Integration**: For development environment and runtime error overlay.
- **PostCSS**: CSS processing.
- **ESBuild**: Fast JavaScript bundling.
- **ws library**: For WebSocket support and real-time capabilities.
- **Geoapify API**: For location services (optional).
- **SendGrid**: For email functionality (optional).
- **Twilio**: For SMS functionality (optional).