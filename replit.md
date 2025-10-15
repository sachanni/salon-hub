# SalonHub - Beauty & Wellness Booking Platform

## Overview
SalonHub is a booking platform for beauty and wellness services, inspired by marketplaces like Airbnb. It enables customers to discover and book appointments at local establishments with integrated payment processing. The project aims to deliver a sophisticated, full-stack web application with real-time booking, a robust design system, and secure transactions, targeting a significant share of the beauty and wellness market.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### UI/UX Decisions
- **Design System**: Custom professional purple/rose gradient scheme using Inter and Source Sans Pro typography.
- **Theme**: Application-wide light theme with pastel gradients, dark text, soft animated orbs, and subtle texture overlays.
- **Responsiveness**: Mobile-first adaptive layouts for all components, including search bars and setup pages.
- **Key UI Elements**: Fresha-inspired professional date/time pickers, compact calendars, and visual components for staff, service, and media management.
- **Dashboard**: Premium dashboard with modern sidebar UX, featuring profile section, quick stats/actions, enhanced navigation, and unified completion validation across 12 required fields.
- **Salon Profile**: Fresha.com inspired profile with hero image gallery, sticky navigation (Services, Team, About, Reviews), sticky booking sidebar, and Google-style day-by-day business hours.
- **Settings Page**: Production-ready, tab-based interface for comprehensive business settings.
- **Search Bar Dropdown Positioning**: Consistent `md:left-0 md:right-auto` positioning with fixed desktop widths (Service: 384px, Location: 384px, Date: 420px, Time: 320px) and adaptive max-height (70vh for service/location, 85vh for date/time) to prevent viewport overflow and content cutoff. Responsive full-width on mobile with proper z-index layering.
- **Map & Search Results Layout**: Fresha-inspired proportions with compact sidebar (400px, min 360px) giving ~30% width to search results and ~70% to map view. Salon cards feature smaller images (h-32), compact padding (p-3), and streamlined content for better fit.
- **Image Carousel**: Interactive image carousel on salon cards with smooth navigation (prev/next arrows appear on hover), dot indicators showing current position, and image counter badge. Supports browsing through multiple salon photos with smooth transitions.

### Technical Implementations
- **Frontend**: React 18 with TypeScript, Wouter for routing, TanStack Query for state management, Radix UI primitives with Tailwind CSS, and Vite.
- **Backend**: Node.js with Express.js, TypeScript, RESTful API design, Drizzle ORM, and centralized error handling.
- **Database**: PostgreSQL via Neon serverless infrastructure (Drizzle Kit for schema management). Stores prices in `priceInPaisa` and duration in `durationMinutes`. Development TLS bypass for Neon is explicitly handled for Replit.
- **Authentication & Security**: Express sessions with PostgreSQL store, server-side price validation, Zod schemas, and CORS.
- **Setup Wizard Architecture**: Standardized prop interface `{salonId: string, onNext: () => void, onBack?: () => void, onSkip?: () => void}` for all 9 steps, with React Query for data pre-population and `onNext()` on successful mutation.
- **Price Display**: `priceInPaisa` converted to rupees for public display; `durationMinutes` to readable duration.
- **Smart Time Slot Validation**: Timezone-safe past time prevention, local timezone handling, automatic clearing of invalid selections, and robust date parsing/formatting.
- **Real-Time Booking Availability**: Production-ready slot conflict detection with 15-second polling, comprehensive overlap prevention, staff-aware availability, duration-aware blocking, and automatic selection clearing.
- **Multi-Day Booking**: Supports any future date, dynamically generates slots from `businessHours` JSONB, checks existing bookings, and displays color-coded available/booked/past slots with intelligent slot processing.
- **Interactive Calendar Component**: Professional month view with quick-selects (Today/Tomorrow), month navigation, past-date prevention, and timezone-safe date normalization to local midnight.
- **Google Maps Integration**: Reusable component displaying salon locations with dynamic API loading, markers, graceful fallbacks, and `VITE_GOOGLE_MAPS_API_KEY` authentication.

### Feature Specifications
- **Service Search**: Two-level search with 12 main categories and 50+ sub-services.
- **Location Features**: Reverse geocoding ("Current location"), dynamic GPS, and 2-layer search (Delhi NCR + Google Places API).
- **8-Step Business Setup System**: Unified onboarding wizard with server-side validation, predefined templates, smart description generator, business hours picker, and race condition handling.
- **Staff Management with Intelligent Role Sync**: Professional system with auto-suggested staff roles based on active services, supporting 11 role types, photo upload, multi-role selection, and gender field. Backend API `/api/salons/:salonId/suggested-roles` provides suggestions.
- **Booking Settings with Intelligent Preset Auto-Selection**: Comprehensive policy management with smart auto-suggestion of 4 booking presets based on salon services (e.g., Hair Salon, Spa & Wellness), including minimum lead time, group booking, reminders, and deposit protection.
- **Media & Gallery System**: Professional photo management with dual upload, drag & drop, batch upload, compression, base64 encoding, and 6 smart categories.
- **Package/Combo System**: Full-page creation wizard for bundled services with editing and validation.
- **Multi-Service Booking API**: Endpoint supporting multiple service selection with server-side price, duration, and staff validation.
- **Resources Management with Intelligent Auto-Suggestions**: Modern system with intelligent service-to-resource mapping, smart category normalization, sequential suggestion flow, quick setup templates for 4 business types, and visual resource cards.
- **Enhanced Search Results with Fresha-Style UX**: Displays rich salon information including media gallery, top 3 services, and interactive time slot chips. Backend `/api/search/salons` enriches results. Supports semantic time filtering.
- **Fresha-Style Booking Summary**: Enhanced summary with total duration, individual service details (name/price/duration/staff/subcategory), clear visual hierarchy, and full booking context including formatted date and time slot.
- **Advanced Filtering System (Fresha-Style)**: Comprehensive filter panel with 4 sort options (Recommended using rating × log(reviews), Nearest by GPS distance, Top-rated by rating priority, Distance by proximity), max price slider (₹0-₹10,000), venue type pills (Everyone/Female only/Male only), and booking options (instant booking, available today, offer deals, accept group). Backend supports intelligent sorting algorithms and all filter parameters (sortBy, maxPrice, venueType, instantBooking, availableToday, offerDeals, acceptGroup).
- **Category Tabs Navigation**: Horizontal tabs for quick filtering (All Salons, Hair Salons, etc.), with active/inactive states and mobile scrollability, filtering search results in real-time.

## External Dependencies
- **Razorpay**: Payment gateway.
- **Neon Database**: Serverless PostgreSQL.
- **@neondatabase/serverless**: PostgreSQL driver.
- **Radix UI**: Unstyled UI primitives.
- **Tailwind CSS**: Utility-first CSS framework.
- **Lucide React**: Icon library.
- **React Hook Form**: Form management.
- **Date-fns**: Date utilities.
- **Google Maps JavaScript API**: Location services.