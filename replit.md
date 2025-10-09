# SalonHub - Beauty & Wellness Booking Platform

## Overview

SalonHub is a modern booking platform for beauty and wellness services, designed with inspiration from successful marketplaces like Airbnb. The application allows customers to discover and book appointments at local salons, spas, and wellness centers with integrated payment processing. Built as a full-stack web application with a React frontend and Express backend, it features a sophisticated design system, real-time booking capabilities, and secure payment processing through Razorpay.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript for type safety and modern development practices
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: TanStack Query (React Query) for server state management and caching
- **UI Framework**: Custom design system built on Radix UI primitives with Tailwind CSS
- **Build Tool**: Vite for fast development and optimized production builds
- **Design System**: Comprehensive component library following Airbnb-inspired marketplace aesthetics

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript for type safety across the full stack
- **API Design**: RESTful API with centralized route registration
- **Database ORM**: Drizzle ORM for type-safe database operations
- **Storage Strategy**: Abstracted storage interface supporting both in-memory and database implementations
- **Error Handling**: Centralized error handling middleware with structured error responses

### Database Design
- **Database**: PostgreSQL via Neon serverless infrastructure
- **Schema Management**: Drizzle Kit for migrations and schema management
- **Core Tables**:
  - Users: Authentication and user management
  - Services: Catalog of available salon services with fixed pricing
  - Bookings: Appointment scheduling with customer details
  - Payments: Transaction tracking with Razorpay integration

### Authentication & Security
- **Session Management**: Express sessions with PostgreSQL session store
- **Payment Security**: Server-side price validation to prevent tampering
- **Input Validation**: Zod schemas for request/response validation
- **CORS**: Configured for secure cross-origin requests

### Design System
- **Color Palette**: Professional purple/rose gradient scheme with light/dark mode support
- **Typography**: Inter and Source Sans Pro font families for modern readability
- **Component Architecture**: Modular component system with consistent spacing and elevation patterns
- **Responsive Design**: Mobile-first approach with Tailwind breakpoints

## External Dependencies

### Payment Processing
- **Razorpay**: Primary payment gateway for Indian market
- **Integration**: Server-side order creation with client-side payment capture
- **Security**: Webhook verification for payment confirmation

### Database & Infrastructure
- **Neon Database**: Serverless PostgreSQL with connection pooling
- **Database Driver**: @neondatabase/serverless for optimal serverless performance

### UI & Development Tools
- **Radix UI**: Comprehensive set of unstyled, accessible UI primitives
- **Tailwind CSS**: Utility-first CSS framework for rapid styling
- **Lucide React**: Modern icon library for consistent iconography
- **React Hook Form**: Form state management with validation
- **Date-fns**: Date manipulation and formatting utilities

### Development Infrastructure
- **Replit Integration**: Development environment integration with runtime error overlay
- **PostCSS**: CSS processing with autoprefixer
- **ESBuild**: Fast JavaScript bundling for production builds
- **WebSocket Support**: Real-time capabilities via ws library for database connections

## Replit Deployment

### Required Environment Variables for Replit

The following environment variables must be configured in Replit Secrets for the application to work:

#### Core Required:
- `DATABASE_URL` - PostgreSQL connection string (auto-provided by Replit database)
- `SESSION_SECRET` - Strong random string for session security
- `JWT_SECRET` - Strong random string for JWT tokens

#### Replit-Specific:
- `REPLIT_DOMAINS` - Auto-configured by Replit
- `ISSUER_URL` - Auto-configured by Replit for OIDC
- `REPL_ID` - Auto-configured by Replit

#### Optional Services:
- `SENDGRID_API_KEY` - For email functionality
- `SENDGRID_FROM_EMAIL` - Sender email address
- `TWILIO_ACCOUNT_SID` - For SMS functionality  
- `TWILIO_AUTH_TOKEN` - Twilio authentication
- `TWILIO_PHONE_NUMBER` - Twilio phone number
- `RAZORPAY_KEY_ID` - For payment processing
- `RAZORPAY_KEY_SECRET` - Razorpay secret key
- `GEOAPIFY_API_KEY` - For location services

### Deployment Configuration

The application is configured for VM deployment with:
- **Build Command**: `npm run build`
- **Run Command**: `npm start`
- **Port**: 5000 (configured in workflow)

### Generate Secrets

Use this command to generate secure secrets:
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```