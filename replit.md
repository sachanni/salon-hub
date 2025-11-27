# SalonHub

## Overview
SalonHub is a full-stack web application designed to connect customers with salons, offering features for salon discovery, appointment booking, service management, and more. The project aims to provide a comprehensive platform for managing salon operations and enhancing the customer booking experience. Its key capabilities include a complete event management system with secure payment processing, attendee export, and a robust review and feedback system. The platform is designed for scalability and aims to capture a significant share of the salon management and booking market.

## User Preferences
I prefer an iterative development approach where features are built and reviewed incrementally. Please ensure that all new features include comprehensive testing. For any significant changes or architectural decisions, please ask for my approval before implementation. I value clear, concise explanations and well-documented code.

## System Architecture
The application follows a full-stack architecture.
- **Frontend**: Developed using React 18 with Vite, styled with Tailwind CSS and Radix UI components, and state managed by TanStack Query.
- **Backend**: Implemented with Express.js (Node.js).
- **Database**: PostgreSQL, utilizing Neon Serverless. Drizzle ORM is used for database interactions.
- **Project Structure**: Organized into `client/` (React app), `server/` (Express app with routes, services, middleware, scripts), `shared/` (shared types and schemas), `migrations/`, and `attached_assets/`.
- **UI/UX Decisions**:
    - **Event Management Redesign**: Features a modular hub-and-spoke design for event creation and management, including dedicated pages for speakers, tickets, and schedule. This provides real-time completion tracking and an intuitive publishing workflow.
    - **Validation and Error Handling**: Replaces browser alerts with modern toast notifications and provides specific, inline field-level validation errors to enhance user experience.
    - **Navigation**: Implemented consistent navigation across business management sections, preserving sidebar navigation. Customer-facing events listing is accessible from the main header.
    - **Design Consistency**: Softened page gradients to match the overall platform theme.
- **Technical Implementations**:
    - **Event Management System**: Comprehensive system supporting customer-facing pages (EventsListing, EventDetails, EventRegistration, RegistrationConfirmation, CancelRegistration, EventReviewPage) and business admin pages (EventDashboard, CreateEvent, EventCheckIn, DraftEvents, NotificationCenter, PastEvents, EventAnalytics).
    - **Payment Integration**: Razorpay integration with HMAC signature verification, multi-layer amount validation, and atomic reservation for TOCTOU security. Includes a 30-minute payment window and a background cleanup service for expired registrations.
    - **Review System**: Full review submission and display system, allowing only confirmed attendees to submit multi-aspect ratings with photo upload support.
    - **Attendee Export**: Capability to export attendee lists in Excel, PDF, and check-in sheet formats, with authorization checks.
    - **QR Code Security**: QR code generation with timestamp expiration and cryptographic signing for event tickets.
    - **Nearby Salons Discovery**: Salon pages display nearby salons based on geographic proximity using Haversine formula for distance calculation. Features include error handling with retry capability, responsive grid layout, and integration with existing SalonCard components.
    - **Validation**: Extensive use of Zod for validation schemas across multi-step forms.

## External Dependencies
- **Database**: PostgreSQL (Neon Serverless)
- **Payment Gateway**: Razorpay (Stripe integration deferred)
- **AI Services (Optional)**: Google Gemini API, OpenAI API
- **Communication Services (Optional)**: SendGrid (Email), Twilio (SMS)
- **Mapping/Location (Optional)**: Google Places API
- **Document Generation**: `exceljs`, `pdfkit`